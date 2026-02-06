/**
 * Client-side conditional logic engine for dynamic questionnaire
 * Evaluates which questions and sections should be displayed
 */

import type { Question, QuestionSection, SurveyAnswers } from '@/lib/types/survey-template';

/**
 * Evaluate if an answer matches the expected condition
 */
export function evaluateCondition(answerValue: any, expectedValue: any): boolean {
  if (answerValue === null || answerValue === undefined) {
    return false;
  }

  // If expected value is an array, check if answer matches any value
  if (Array.isArray(expectedValue)) {
    // For multi-select answers (stored as array)
    if (Array.isArray(answerValue)) {
      // Check if any of the answer values match any of the expected values
      return answerValue.some((val) => expectedValue.includes(val));
    } else {
      // For single-value answers, check if value is in expected list
      return expectedValue.includes(answerValue);
    }
  }

  // Single value comparison
  return answerValue === expectedValue;
}

/**
 * Determine if a question should be shown based on conditional logic
 */
export function shouldShowQuestion(question: Question, allResponses: SurveyAnswers): boolean {
  // If question has no parent, always show it
  if (!question.parent_question) {
    return true;
  }

  // Find parent question code from questions list
  // Since we only have parent_question ID, we need to find the actual question
  // In practice, this will be handled by the parent component passing the full question tree

  // For now, check if parent question code exists in responses
  if (!question.show_if_value) {
    return true;
  }

  // We need to get parent question's code
  // This will be enhanced when we have the full question tree
  return true;
}

/**
 * Determine if a section should be shown based on conditional logic
 */
export function shouldShowSection(section: QuestionSection, allResponses: SurveyAnswers): boolean {
  // If section has no conditional logic, always show it
  if (!section.show_if_question || !section.show_if_value) {
    return true;
  }

  // Find the trigger question's code
  // We need to match the question ID to get its code from responses
  // This will need access to the questions map

  return true;
}

/**
 * Get questions that should be displayed for a section
 */
export function getActiveQuestionsForSection(
  section: QuestionSection,
  allResponses: SurveyAnswers,
  questionsMap?: Map<number, Question>
): Question[] {
  if (!section.questions) {
    return [];
  }

  return section.questions.filter((question) => {
    // Check backend show_condition JSON format first
    if (question.show_condition) {
      return evaluateShowCondition(question.show_condition, allResponses);
    }

    // Fallback: If no parent question, always show
    if (!question.parent_question) {
      return true;
    }

    // Get parent question to find its code
    if (!questionsMap) {
      return true; // Can't evaluate without questions map
    }

    const parentQuestion = questionsMap.get(question.parent_question);
    if (!parentQuestion) {
      return true;
    }

    // Check if parent question has been answered
    const parentAnswer = allResponses[parentQuestion.code];
    if (parentAnswer === null || parentAnswer === undefined) {
      return false;
    }

    // Evaluate condition
    return evaluateCondition(parentAnswer, question.show_if_value);
  });
}

/**
 * Evaluate show_condition JSON from backend
 * Format: {"question_code": "Q3", "operator": "equals", "value": "KESEHATAN"}
 */
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

/**
 * Get sections that should be displayed
 */
export function getActiveSections(
  sections: QuestionSection[],
  allResponses: SurveyAnswers,
  questionsMap?: Map<number, Question>
): QuestionSection[] {
  return sections.filter((section) => {
    // Check backend show_condition JSON format first
    if (section.show_condition) {
      return evaluateShowCondition(section.show_condition, allResponses);
    }

    // Fallback: If no conditional logic, always show
    if (!section.show_if_question || !section.show_if_value) {
      return true;
    }

    // Get trigger question to find its code
    if (!questionsMap) {
      return true; // Can't evaluate without questions map
    }

    const triggerQuestion = questionsMap.get(section.show_if_question);
    if (!triggerQuestion) {
      return true;
    }

    // Check if trigger question has been answered
    const triggerAnswer = allResponses[triggerQuestion.code];
    if (triggerAnswer === null || triggerAnswer === undefined) {
      return false;
    }

    // Evaluate condition
    return evaluateCondition(triggerAnswer, section.show_if_value);
  });
}

/**
 * Build a map of question ID to Question for easy lookup
 */
export function buildQuestionsMap(sections: QuestionSection[]): Map<number, Question> {
  const map = new Map<number, Question>();

  sections.forEach((section) => {
    section.questions?.forEach((question) => {
      map.set(question.id, question);
    });
  });

  return map;
}

/**
 * Calculate progress percentage based on required questions answered
 */
export function calculateProgress(
  sections: QuestionSection[],
  answers: SurveyAnswers,
  questionsMap: Map<number, Question>
): number {
  const activeSections = getActiveSections(sections, answers, questionsMap);

  let totalRequired = 0;
  let answeredRequired = 0;

  activeSections.forEach((section) => {
    const activeQuestions = getActiveQuestionsForSection(section, answers, questionsMap);

    activeQuestions.forEach((question) => {
      if (question.is_required) {
        totalRequired++;
        if (answers[question.code] !== null && answers[question.code] !== undefined) {
          answeredRequired++;
        }
      }
    });
  });

  if (totalRequired === 0) {
    return 0;
  }

  return Math.round((answeredRequired / totalRequired) * 100);
}
