/**
 * Client-side conditional logic engine for dynamic questionnaire (mobile)
 * Ported from frontend/lib/utils/question-logic.ts
 */

import type { Question, QuestionSection, SurveyAnswers } from './types';

export function evaluateCondition(answerValue: any, expectedValue: any): boolean {
  if (answerValue === null || answerValue === undefined) return false;

  if (Array.isArray(expectedValue)) {
    if (Array.isArray(answerValue)) {
      return answerValue.some((val) => expectedValue.includes(val));
    }
    return expectedValue.includes(answerValue);
  }

  return answerValue === expectedValue;
}

function evaluateShowCondition(
  showCondition: Record<string, any> | undefined,
  allResponses: SurveyAnswers
): boolean {
  if (!showCondition) return true;

  const questionCode = showCondition.question_code;
  const operator = showCondition.operator || 'equals';
  const expectedValue = showCondition.value;

  if (!questionCode) return true;

  const answer = allResponses[questionCode];
  if (answer === null || answer === undefined) return false;

  switch (operator) {
    case 'equals':
      return evaluateCondition(answer, expectedValue);
    case 'not_equals':
      return !evaluateCondition(answer, expectedValue);
    case 'in':
      return Array.isArray(expectedValue) ? expectedValue.includes(answer) : false;
    case 'not_in':
      return Array.isArray(expectedValue) ? !expectedValue.includes(answer) : true;
    case 'contains':
      return Array.isArray(answer) ? answer.includes(expectedValue) : false;
    default:
      return evaluateCondition(answer, expectedValue);
  }
}

export function buildQuestionsMap(sections: QuestionSection[]): Map<number, Question> {
  const map = new Map<number, Question>();
  sections.forEach((section) => {
    section.questions?.forEach((question) => {
      map.set(question.id, question);
    });
  });
  return map;
}

export function getActiveSections(
  sections: QuestionSection[],
  allResponses: SurveyAnswers,
  questionsMap?: Map<number, Question>
): QuestionSection[] {
  return sections.filter((section) => {
    if (section.show_condition) {
      return evaluateShowCondition(section.show_condition, allResponses);
    }
    if (!section.show_if_question || !section.show_if_value) return true;
    if (!questionsMap) return true;

    const triggerQuestion = questionsMap.get(section.show_if_question);
    if (!triggerQuestion) return true;

    const triggerAnswer = allResponses[triggerQuestion.code];
    if (triggerAnswer === null || triggerAnswer === undefined) return false;

    return evaluateCondition(triggerAnswer, section.show_if_value);
  });
}

export function getActiveQuestionsForSection(
  section: QuestionSection,
  allResponses: SurveyAnswers,
  questionsMap?: Map<number, Question>
): Question[] {
  if (!section.questions) return [];

  return section.questions
    .filter((question) => {
      if (question.show_condition) {
        return evaluateShowCondition(question.show_condition, allResponses);
      }
      if (!question.parent_question) return true;
      if (!questionsMap) return true;

      const parentQuestion = questionsMap.get(question.parent_question);
      if (!parentQuestion) return true;

      const parentAnswer = allResponses[parentQuestion.code];
      if (parentAnswer === null || parentAnswer === undefined) return false;

      return evaluateCondition(parentAnswer, question.show_if_value);
    })
    .sort((a, b) => a.order - b.order);
}

/**
 * Get flow-based active questions for a section.
 *
 * When rawAnswers is provided, cross-section next_question_code links
 * are followed inline — DETAIL questions are embedded within FASKSES,
 * one loop per MTC context (cabang_mtc).
 */
export function getFlowBasedQuestions(
  section: QuestionSection,
  allResponses: SurveyAnswers,
  questionsMap?: Map<number, Question>,
  allSections?: QuestionSection[],
  rawAnswers?: SurveyAnswers,
  _visitedSectionIds?: Set<number>,
  _forcedStartCode?: string,
): Question[] {
  if (!section.questions || section.questions.length === 0) return [];

  const visibleQuestions = section.questions
    .filter((q) => {
      if (q.show_condition) {
        return evaluateShowCondition(q.show_condition, allResponses);
      }
      if (!q.parent_question) return true;
      if (!questionsMap) return true;
      const parent = questionsMap.get(q.parent_question);
      if (!parent) return true;
      const parentAnswer = allResponses[parent.code];
      if (parentAnswer === null || parentAnswer === undefined) return false;
      return evaluateCondition(parentAnswer, q.show_if_value);
    })
    .sort((a, b) => a.order - b.order);

  if (visibleQuestions.length === 0) return [];

  const codeMap = new Map<string, Question>();
  visibleQuestions.forEach((q) => codeMap.set(q.code, q));

  // Determine entry point
  let startCode: string | undefined = _forcedStartCode;
  if (!startCode && allSections) {
    const sectionCodes = new Set(visibleQuestions.map((q) => q.code));
    outer: for (const otherSection of allSections) {
      if (otherSection.id === section.id) continue;
      for (const q of otherSection.questions || []) {
        const answer = allResponses[q.code];
        if (answer === null || answer === undefined || answer === '') continue;
        const selectedValues = Array.isArray(answer) ? answer : [String(answer)];
        const matchingChoices = (q.choices || []).filter(
          (c) =>
            selectedValues.includes(c.value) &&
            c.next_question_code &&
            sectionCodes.has(c.next_question_code)
        );
        if (matchingChoices.length > 0) {
          const entryCandidate = matchingChoices
            .map((c) => codeMap.get(c.next_question_code!))
            .filter((q): q is Question => q !== undefined)
            .sort((a, b) => a.order - b.order)[0];
          if (entryCandidate) {
            startCode = entryCandidate.code;
            break outer;
          }
        }
        if (q.skip_logic) {
          for (const rule of q.skip_logic) {
            if (rule.value === String(answer) && rule.goto && sectionCodes.has(rule.goto)) {
              startCode = rule.goto;
              break outer;
            }
          }
        }
      }
    }
  }

  const result: Question[] = [];
  const visited = new Set<string>();
  let current: Question | undefined = (startCode && codeMap.get(startCode)) || visibleQuestions[0];

  while (current && !visited.has(current.code)) {
    visited.add(current.code);
    result.push(current);

    const answer = allResponses[current.code];
    const isAnswered = answer !== null && answer !== undefined && answer !== '';

    if (!isAnswered) break;

    let nextCode: string | undefined;
    let triggeringChoice: NonNullable<typeof current.choices>[0] | undefined;

    if (current.choices && current.choices.length > 0) {
      triggeringChoice = current.choices.find((c) => c.value === answer);
      if (triggeringChoice?.next_question_code) {
        nextCode = triggeringChoice.next_question_code;
      }
    }

    if (!nextCode && current.skip_logic && current.skip_logic.length > 0 && current.skip_logic[0].goto) {
      nextCode = current.skip_logic[0].goto;
    }

    if (!nextCode) {
      const currentIdx = visibleQuestions.indexOf(current);
      if (currentIdx < visibleQuestions.length - 1) {
        current = visibleQuestions[currentIdx + 1];
        continue;
      }
      break;
    }

    const nextInSection = codeMap.get(nextCode);
    if (nextInSection) {
      current = nextInSection;
    } else {
      // Cross-section exit — try inline follow
      if (allSections && rawAnswers) {
        const otherSection = allSections.find(
          (s) => s.id !== section.id && (s.questions || []).some((q) => q.code === nextCode)
        );
        if (otherSection) {
          const sectionVisited = _visitedSectionIds ?? new Set<number>();
          if (!sectionVisited.has(otherSection.id)) {
            const newSectionVisited = new Set(sectionVisited);
            newSectionVisited.add(section.id);

            const cabangMtc = triggeringChoice?.cabang_mtc ?? '';
            const ctxAnswers: SurveyAnswers = { ...allResponses };
            if (cabangMtc) {
              const prefix = `${cabangMtc}|`;
              for (const [k, v] of Object.entries(rawAnswers)) {
                if (k.startsWith(prefix)) {
                  ctxAnswers[k.slice(prefix.length)] = v;
                }
              }
            }

            const crossQuestions = getFlowBasedQuestions(
              otherSection,
              ctxAnswers,
              questionsMap,
              allSections,
              rawAnswers,
              newSectionVisited,
              nextCode,
            );

            result.push(...crossQuestions);

            const lastInCurrentSection = [...result].reverse().find((q) => codeMap.has(q.code));
            if (lastInCurrentSection) {
              const idx = visibleQuestions.indexOf(lastInCurrentSection);
              if (idx >= 0 && idx < visibleQuestions.length - 1) {
                current = visibleQuestions[idx + 1];
              } else {
                break;
              }
            } else {
              break;
            }
            continue;
          }
        }
      }

      // Fall back to next by order
      const lastQ = result[result.length - 1];
      const currentIdx = visibleQuestions.indexOf(lastQ);
      if (currentIdx < visibleQuestions.length - 1) {
        current = visibleQuestions[currentIdx + 1];
      } else {
        break;
      }
    }
  }

  return result;
}

export function calculateProgress(
  sections: QuestionSection[],
  answers: SurveyAnswers,
  questionsMap: Map<number, Question>,
  rawAnswers?: SurveyAnswers,
): number {
  const activeSections = getActiveSections(sections, answers, questionsMap);

  let totalRequired = 0;
  let answeredRequired = 0;

  activeSections.forEach((section) => {
    const activeQuestions = getFlowBasedQuestions(section, answers, questionsMap, sections, rawAnswers);
    activeQuestions.forEach((question) => {
      if (question.is_required) {
        totalRequired++;
        if (answers[question.code] !== null && answers[question.code] !== undefined) {
          answeredRequired++;
        }
      }
    });
  });

  if (totalRequired === 0) return 0;
  return Math.round((answeredRequired / totalRequired) * 100);
}
