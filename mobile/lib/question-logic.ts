/**
 * Client-side conditional logic engine for dynamic questionnaire (mobile)
 * Ported from frontend/lib/utils/question-logic.ts
 *
 * Key concept: FlowItem — every "page" in the survey is either a Question or
 * a HintPage.  A HintPage displays introduction_text and is a SEPARATE screen
 * shown BEFORE the question it introduces (e.g. RQ5 hint on page N, RQ5 on N+1).
 */

import type { Question, QuestionSection, SurveyAnswers, QuestionOption } from './types';
export type { Question, QuestionSection, SurveyAnswers };

/** A single page in the survey navigation sequence. */
export type FlowItem =
  | { kind: 'question'; question: Question }
  | { kind: 'hint'; questionCode: string; hintText: string; prevAnswerLabel: string | null }
  | { kind: 'end_survey' };

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

  const result = (() => {
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
        if (Array.isArray(answer)) return answer.includes(expectedValue);
        if (typeof answer === 'string') return answer.includes(String(expectedValue));
        return false;
      default:
        return evaluateCondition(answer, expectedValue);
    }
  })();

  console.log(`[FLOW] evaluateShowCondition q=${questionCode} op=${operator} val=${JSON.stringify(expectedValue)} answer=${JSON.stringify(answer)} => ${result}`);
  return result;
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
  const result = sections.filter((section) => {
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
  console.log(`[FLOW] getActiveSections: ${result.map(s => s.code).join(',')} (from ${sections.length} sections)`);
  console.log(`[FLOW] getActiveSections: QL1=${JSON.stringify(allResponses['QL1'])} Q4=${JSON.stringify(allResponses['Q4'])}`);
  result.forEach(s => {
    if (s.show_condition) {
      console.log(`[FLOW]   section ${s.code} show_cond=${JSON.stringify(s.show_condition)} => ${evaluateShowCondition(s.show_condition as any, allResponses)}`);
    }
  });
  return result;
}

export function getActiveQuestionsForSection(
  section: QuestionSection,
  allResponses: SurveyAnswers,
  questionsMap?: Map<number, Question>
): Question[] {
  if (!section.questions) return [];

  const result = section.questions
    .filter((question) => {
      if (question.show_condition) {
        const r = evaluateShowCondition(question.show_condition, allResponses);
        console.log(`[GAQ] section=${section.code} q=${question.code} show_cond=${JSON.stringify(question.show_condition)} QL1=${JSON.stringify(allResponses['QL1'])} => ${r}`);
        return r;
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

  console.log(`[GAQ] section=${section.code} => ${result.length}/${section.questions.length} questions: ${result.map(q => q.code).join(',')}`);
  return result;
}

/** Global code → Question map across all sections. */
function buildGlobalCodeMap(allSections: QuestionSection[]): Map<string, Question> {
  const map = new Map<string, Question>();
  allSections.forEach((section) => {
    section.questions?.forEach((q) => map.set(q.code, q));
  });
  return map;
}

/** Find which question in prevSection was answered and where its choice points. */
function findPreviousAnswerInfo(
  allResponses: SurveyAnswers,
  allSections: QuestionSection[],
): { question: Question; choice: QuestionOption } | null {
  for (const section of allSections) {
    for (const q of section.questions || []) {
      const answer = allResponses[q.code];
      if (answer === null || answer === undefined || answer === '') continue;
      const selectedValues = Array.isArray(answer) ? answer : [String(answer)];
      const choice = (q.choices || []).find(
        (c: QuestionOption) => selectedValues.includes(c.value)
      );
      if (choice) return { question: q, choice };
    }
  }
  return null;
}

/** Find ALL entry-point codes for a section based on previous MULTIPLE_CHOICE answers pointing to it. */
function findAllEntryPointsForSection(
  section: QuestionSection,
  visibleQuestions: Question[],
  allResponses: SurveyAnswers,
  allSections: QuestionSection[],
  globalCodeMap: Map<string, Question>,
): string[] {
  const sectionCodes = new Set(visibleQuestions.map((q) => q.code));
  const entryPoints: { code: string; order: number }[] = [];

  for (const otherSection of allSections) {
    if (otherSection.id === section.id) continue;
    for (const q of otherSection.questions || []) {
      const answer = allResponses[q.code];
      if (answer === null || answer === undefined || answer === '') continue;
      const selectedValues = Array.isArray(answer) ? answer : [String(answer)];

      const matchingChoices = (q.choices || []).filter(
        (c: QuestionOption) =>
          selectedValues.includes(c.value) &&
          c.next_question_code &&
          sectionCodes.has(c.next_question_code)
      );
      for (const choice of matchingChoices) {
        const entry = globalCodeMap.get(choice.next_question_code!);
        if (entry && !entryPoints.some(e => e.code === entry.code)) {
          entryPoints.push({ code: entry.code, order: entry.order });
        }
      }

      if (q.skip_logic) {
        for (const rule of q.skip_logic) {
          if (rule.value === String(answer) && rule.goto && sectionCodes.has(rule.goto)) {
            const entry = globalCodeMap.get(rule.goto);
            if (entry && !entryPoints.some(e => e.code === entry.code)) {
              entryPoints.push({ code: entry.code, order: entry.order });
            }
          }
        }
      }
    }
  }

  // Sort by order to maintain the intended sequence
  return entryPoints.sort((a, b) => a.order - b.order).map(e => e.code);
}

/** Find the FIRST entry-point code for a section (legacy single-entry behavior). */
function findEntryPointForSection(
  section: QuestionSection,
  visibleQuestions: Question[],
  allResponses: SurveyAnswers,
  allSections: QuestionSection[],
  globalCodeMap: Map<string, Question>,
): string | undefined {
  return findAllEntryPointsForSection(section, visibleQuestions, allResponses, allSections, globalCodeMap)[0];
}

/**
 * Get the flow of pages for a section.
 *
 * Each page is a FlowItem — either a Question page, or a HintPage (which shows
 * introduction_text as a full screen before its question).
 *
 * Navigation is driven by answer values and their next_question_code.
 * When a selected choice points to a question in a different section (e.g.
 * JENIS_LAYANAN → FASKSES), that section is embedded inline.
 *
 * Hint pages are interleaved: if question Q has introduction_text, the hint page
 * appears immediately BEFORE Q in the returned sequence.
 */
export function getFlowItems(
  section: QuestionSection,
  allResponses: SurveyAnswers,
  questionsMap: Map<number, Question> | undefined,
  allSections: QuestionSection[] | undefined,
  rawAnswers: SurveyAnswers | undefined,
  _visitedSectionIds?: Set<number>,
  _forcedStartCode?: string,
): FlowItem[] {
  if (!section.questions || section.questions.length === 0) return [];

  console.log(`[FLOW] getFlowItems ENTRY: section=${section.code} section.introduction_text="${section.introduction_text?.substring(0, 50) ?? 'none'}" entryCodes=${JSON.stringify(entryCodes)}`);

  const globalCodeMap = allSections ? buildGlobalCodeMap(allSections) : new Map<string, Question>();

  const detailGroupPrefix =
    _forcedStartCode && /[A-Z]$/.test(_forcedStartCode)
      ? _forcedStartCode.slice(0, -1)
      : undefined;

  const visibleQuestions = section.questions
    .filter((q) => {
      if (detailGroupPrefix && !q.code.startsWith(detailGroupPrefix)) return false;
      if (q.show_condition) return evaluateShowCondition(q.show_condition, allResponses);
      if (!q.parent_question) return true;
      if (!questionsMap) return true;
      const parent = questionsMap.get(q.parent_question);
      if (!parent) return true;
      const parentAnswer = allResponses[parent.code];
      if (parentAnswer === null || parentAnswer === undefined) return false;
      return evaluateCondition(parentAnswer, q.show_if_value);
    })
    .sort((a, b) => a.order - b.order);

  // Debug: log why questions are filtered out
  console.log(`[FLOW] getFlowItems: section=${section.code} visible=${visibleQuestions.length}/${section.questions.length}`);
  if (section.code === 'FASKSES' || section.code === 'NON-FASKES') {
    console.log(`[FLOW] ${section.code}: ${visibleQuestions.length}/${section.questions.length} visible, QL1=${JSON.stringify(allResponses['QL1'])}, QL2=${JSON.stringify(allResponses['QL2'])}`);
    section.questions.forEach(q => {
      if (q.show_condition) {
        const visible = evaluateShowCondition(q.show_condition, allResponses);
        console.log(`[FLOW]   ${q.code} show_cond=${JSON.stringify(q.show_condition)} => ${visible}`);
      }
    });
  }

  if (visibleQuestions.length === 0) {
    console.log(`[FLOW] ${section.code}: NO visible questions, returning empty flow`);
    return [];
  }

  // Log entry point processing
  console.log(`[FLOW] ${section.code}: entryCodes=${JSON.stringify(entryCodes)} visibleQuestions=${visibleQuestions.map(q => q.code).join(',')}`);

  const codeMap = new Map<string, Question>();
  visibleQuestions.forEach((q) => codeMap.set(q.code, q));

  // Find previous answer context for hint labels
  const prevAnswerInfo = allSections
    ? findPreviousAnswerInfo(allResponses, allSections)
    : null;

  const result: FlowItem[] = [];
  const visited = new Set<string>();

  // Determine entry point(s)
  // _forcedStartCode is used for cross-section jumps (detail chain) — process only that one
  // Otherwise, find ALL entry points from parent MULTIPLE_CHOICE (QL1/QL2) selections
  let entryCodes: string[];
  if (_forcedStartCode) {
    entryCodes = [_forcedStartCode];
  } else if (allSections) {
    entryCodes = findAllEntryPointsForSection(section, visibleQuestions, allResponses, allSections, globalCodeMap);
  } else {
    entryCodes = [];
  }

  // If no entry codes found (no parent answer yet), start from first question by order
  if (entryCodes.length === 0) {
    entryCodes = [visibleQuestions[0].code];
  }

  // If ALL visible questions in this section are already answered, return empty flow.
  // This prevents re-scanning entry points (which finds default entries) and restarting
  // a cross-section chain that has already been completed.
  // IMPORTANT: Only apply this shortcut to inline/sentinel sections (DETAIL blocks).
  // Regular sections (e.g. JENIS_LAYANAN containing QL1) must always render their questions
  // so users can review/change answers, including adding more choices to MULTIPLE_CHOICE questions.
  const isInlineSection = (section.show_condition as Record<string, any>)?.question_code === '_inline_only_';
  const allAnswered = visibleQuestions.every((q) => {
    const ans = allResponses[q.code];
    return ans !== null && ans !== undefined && ans !== '' && !(Array.isArray(ans) && ans.length === 0);
  });
  if (allAnswered && !_forcedStartCode && isInlineSection) {
    console.log(`[FLOW] section=${section.code} — all ${visibleQuestions.length} questions answered (inline section), returning empty flow`);
    return [];
  }

  console.log(`[FLOW] section=${section.code} visibleQ=${visibleQuestions.map(q=>q.code)} entryCodes=${JSON.stringify(entryCodes)} allResponsesKeys=${Object.keys(allResponses).join(',')}`);
  console.log(`[FLOW]   QL1 answer = ${JSON.stringify(allResponses['QL1'])} show_condition check: ${evaluateShowCondition({question_code:'QL1',operator:'contains',value:'R'}, allResponses)}`);

  // Process each entry point sequentially
  for (const entryCode of entryCodes) {
    const startQuestion = codeMap.get(entryCode);
    if (!startQuestion) continue;

    let current: Question | undefined = startQuestion;
    let isFirstInSection = true; // Track if this is the first question (entry point) in the section

    while (current && !visited.has(current.code)) {
      visited.add(current.code);

      // If current question has introduction_text, emit a hint page FIRST, then the question
      if (current.introduction_text && current.introduction_text.trim().length > 0) {
        const prevLabel = prevAnswerInfo
          ? prevAnswerInfo.choice.label
          : null;
        console.log(`[FLOW]   ${current.code} has introduction_text="${current.introduction_text.trim().substring(0, 50)}..." — adding HINT page`);
        result.push({
          kind: 'hint',
          questionCode: current.code,
          hintText: current.introduction_text.trim(),
          prevAnswerLabel: prevLabel,
        });
      }

      result.push({ kind: 'question', question: current });

      const answer = allResponses[current.code];
      const isAnswered = answer !== null && answer !== undefined && answer !== '';

      // Break on unanswered required question ONLY if it's NOT an entry point.
      // Entry points (first questions in section flow) should always be shown to user first.
      // The user must see and attempt the question before we break.
      if (!isAnswered && current.is_required && !isFirstInSection) {
        console.log(`[FLOW]   ${current.code} unanswered required — BREAK`);
        break;
      }
      isFirstInSection = false;

      // Determine next
      let nextCode: string | undefined;
      let triggeringChoice: QuestionOption | undefined;

      if (current.choices && current.choices.length > 0) {
        const answerType = questionsMap
          ? (questionsMap.get(current.id)?.answer_type ?? current.answer_type)
          : current.answer_type;
        // For MULTIPLE_CHOICE, answer is an array — find choice whose value appears in the answer array
        // For other types, answer is a scalar — find choice whose value equals the answer
        triggeringChoice = (current.choices as QuestionOption[]).find((c) => {
          const match = answerType === 'MULTIPLE_CHOICE' && Array.isArray(answer)
            ? answer.includes(c.value)
            : evaluateCondition(answer, c.value);
          console.log(`[FLOW]     choiceMatch c.value=${JSON.stringify(c.value)} answer=${JSON.stringify(answer)} type=${answerType} => ${match}`);
          return match;
        });
        if (triggeringChoice?.next_question_code) {
          nextCode = triggeringChoice.next_question_code;
          console.log(`[FLOW]   ${current.code} ansType=${answerType} ans=${JSON.stringify(answer)} → choice=${triggeringChoice.value} → next=${nextCode} (cabang_mtc=${triggeringChoice.cabang_mtc})`);
        } else {
          console.log(`[FLOW]   ${current.code} ansType=${answerType} ans=${JSON.stringify(answer)} → NO matching choice (${current.choices.length} choices, first=${current.choices[0]?.value})`);
        }
      } else if (current.skip_logic?.length && current.skip_logic[0].goto) {
        nextCode = current.skip_logic[0].goto;
        console.log(`[FLOW]   ${current.code} → next=${nextCode} (via skip_logic)`);
      }

      if (!nextCode) {
        const idx = visibleQuestions.indexOf(current);
        // Only break as terminal if this is the LAST question AND it has choices
        // with no next_question_code (e.g. RQJ, DQF). Non-last questions with
        // empty next_question_code fall through to sequential navigation.
        if (current.choices && current.choices.length > 0 && idx >= visibleQuestions.length - 1) {
          console.log(`[FLOW]   ${current.code} → END OF BLOCK (terminal question at end of section)`);
          break;
        }
        if (idx < visibleQuestions.length - 1) {
          const nextQ = visibleQuestions[idx + 1];
          console.log(`[FLOW]   ${current.code} → next=${nextQ.code} (sequential, idx=${idx}/${visibleQuestions.length - 1})`);
          current = nextQ;
          continue;
        }
        console.log(`[FLOW]   ${current.code} → END OF SECTION (idx=${idx}/${visibleQuestions.length - 1})`);
        break;
      }

      // Within same section
      const nextInSection = codeMap.get(nextCode);
      if (nextInSection) {
        current = nextInSection;
        continue;
      }

      // Special sentinel: _END_ signals the survey should end here (e.g., consent declined)
      if (nextCode === '_END_') {
        result.push({ kind: 'end_survey' as const });
        break;
      }

      // Cross-section jump — when next_question_code points to a question in another section,
      // ONLY inline sections marked as _inline_only_ (sentinel). Standalone sections are
      // navigated via section buttons, not inlined here. This prevents DETAIL (which is
      // embedded inline within FASKSES via _inline_only_) from appearing as a separate
      // section that would cause looping back to RQA after RQJ completes.
      if (allSections && rawAnswers) {
        const otherSection = allSections.find(
          (s) => s.id !== section.id && (s.questions || []).some((q) => q.code === nextCode)
        );
        const targetIsSentinel =
          otherSection?.show_condition != null &&
          (otherSection.show_condition as Record<string, any>)?.question_code === '_inline_only_';
        console.log(`[FLOW] cross-section check: nextCode=${nextCode} currentSection=${section.code} found=${otherSection?.code ?? 'NOT FOUND'} isSentinel=${targetIsSentinel}`);
        if (otherSection && targetIsSentinel) {
          const sectionVisited = _visitedSectionIds ?? new Set<number>();
          if (!sectionVisited.has(otherSection.id)) {
            const newVisited = new Set(sectionVisited);
            newVisited.add(section.id);

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

            // Track the index of the question that triggered the cross-section jump
            const triggerIdx = visibleQuestions.indexOf(current);

            const crossItems = getFlowItems(
              otherSection,
              ctxAnswers,
              questionsMap,
              allSections,
              rawAnswers,
              newVisited,
              nextCode,
            );

            result.push(...crossItems);

            // After completing cross-section detail (e.g., RQA→RQJ), continue to the next
            // unvisited question in the current section (e.g., DQ1 after RQ13 triggered detail)
            // Skip any questions that were already visited through a previous cross-section jump
            let nextIdx = triggerIdx + 1;
            while (nextIdx < visibleQuestions.length && visited.has(visibleQuestions[nextIdx].code)) {
              nextIdx++;
            }
            if (nextIdx < visibleQuestions.length) {
              current = visibleQuestions[nextIdx];
              continue;
            }
            break;
          }
        }
      }

      // Target doesn't exist — next by order
      // Only navigate by index if lastQ actually belongs to this section.
      // If lastQ came from a cross-section (e.g. RQJ from DETAIL block), it
      // won't be in visibleQuestions (indexOf returns -1) and we should break
      // rather than incorrectly wrapping to visibleQuestions[0].
      const lastItem = result[result.length - 1];
      const lastQ =
        lastItem?.kind === 'question' ? lastItem.question : null;
      if (lastQ && visibleQuestions.includes(lastQ)) {
        const idx = visibleQuestions.indexOf(lastQ);
        if (idx < visibleQuestions.length - 1) {
          current = visibleQuestions[idx + 1];
        } else {
          break;
        }
      } else {
        break;
      }
    }
  }

  console.log(`[FLOW] section=${section.code} entryCodes=${JSON.stringify(entryCodes)} result.length=${result.length} items:`, result.map(i => i.kind === 'question' ? i.question.code : `HINT:${i.questionCode}`));
  return result;
}

/** Convenience wrapper: returns only the Question[] from getFlowItems. */
export function getFlowBasedQuestions(
  section: QuestionSection,
  allResponses: SurveyAnswers,
  questionsMap: Map<number, Question> | undefined,
  allSections: QuestionSection[] | undefined,
  rawAnswers?: SurveyAnswers,
): Question[] {
  const items = getFlowItems(
    section,
    allResponses,
    questionsMap,
    allSections,
    rawAnswers,
    undefined,
    undefined,
  );
  return items
    .filter((item): item is { kind: 'question'; question: Question } => item.kind === 'question')
    .map((item) => item.question);
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
    const questions = getFlowBasedQuestions(section, answers, questionsMap, sections, rawAnswers);
    questions.forEach((question) => {
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
