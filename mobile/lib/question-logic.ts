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

export function getFlowBasedQuestions(
  section: QuestionSection,
  allResponses: SurveyAnswers,
  questionsMap?: Map<number, Question>
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

  const hasBranching = visibleQuestions.some(
    (q) =>
      (q.skip_logic && q.skip_logic.length > 0 && q.skip_logic[0].goto) ||
      (q.choices && q.choices.some((c) => c.next_question_code))
  );

  if (!hasBranching) return visibleQuestions;

  const codeMap = new Map<string, Question>();
  visibleQuestions.forEach((q) => codeMap.set(q.code, q));

  const result: Question[] = [];
  const visited = new Set<string>();
  let current: Question | undefined = visibleQuestions[0];

  while (current && !visited.has(current.code)) {
    visited.add(current.code);
    result.push(current);

    const answer = allResponses[current.code];
    const isAnswered = answer !== null && answer !== undefined && answer !== '';

    if (!isAnswered) break;

    let nextCode: string | undefined;

    if (current.choices && current.choices.length > 0) {
      const selectedChoice = current.choices.find((c) => c.value === answer);
      if (selectedChoice?.next_question_code) {
        nextCode = selectedChoice.next_question_code;
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

    current = codeMap.get(nextCode);
    if (!current) break;
  }

  return result;
}

export function calculateProgress(
  sections: QuestionSection[],
  answers: SurveyAnswers,
  questionsMap: Map<number, Question>
): number {
  const activeSections = getActiveSections(sections, answers, questionsMap);

  let totalRequired = 0;
  let answeredRequired = 0;

  activeSections.forEach((section) => {
    const activeQuestions = getFlowBasedQuestions(section, answers, questionsMap);
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
