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
 * Get flow-based active questions for a section.
 * Uses skip_logic and next_question_code to determine which questions
 * are reachable based on current answers, following branching paths.
 *
 * Flow logic:
 * 1. Start with the first question (by order)
 * 2. Show the question
 * 3. If answered, determine next question:
 *    a. Selected choice's next_question_code (highest priority)
 *    b. Question's skip_logic[0].goto (fallback)
 *    c. Next question by order (default)
 * 4. Continue until we hit an unanswered question or reach the end
 */
export function getFlowBasedQuestions(
  section: QuestionSection,
  allResponses: SurveyAnswers,
  questionsMap?: Map<number, Question>,
  allSections?: QuestionSection[]
): Question[] {
  if (!section.questions || section.questions.length === 0) return [];

  // First filter by show_condition
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

  // Always use flow-based progressive reveal:
  // show questions one at a time, each revealed only after the previous is answered.
  // If branching (skip_logic / next_question_code) is present it is followed;
  // otherwise questions are revealed in order.

  // Build code-to-question map for this section
  const codeMap = new Map<string, Question>();
  visibleQuestions.forEach((q) => codeMap.set(q.code, q));

  // Determine entry point from cross-section navigation:
  // if a question in another section was answered and its selected choice's
  // next_question_code points into this section, start from that question.
  let startCode: string | undefined;
  if (allSections) {
    const sectionCodes = new Set(visibleQuestions.map((q) => q.code));
    outer: for (const otherSection of allSections) {
      if (otherSection.id === section.id) continue;
      for (const q of otherSection.questions || []) {
        const answer = allResponses[q.code];
        if (answer === null || answer === undefined || answer === '') continue;
        // Check choice-level next_question_code — handles SINGLE and MULTIPLE_CHOICE
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
        // Check question-level skip_logic
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

  // Build flow path starting from entry point (or first question)
  const result: Question[] = [];
  const visited = new Set<string>();
  let current: Question | undefined = (startCode && codeMap.get(startCode)) || visibleQuestions[0];

  while (current && !visited.has(current.code)) {
    visited.add(current.code);
    result.push(current);

    const answer = allResponses[current.code];
    const isAnswered = answer !== null && answer !== undefined && answer !== '';

    if (!isAnswered) {
      // Stop here — show up to the first unanswered question
      break;
    }

    let nextCode: string | undefined;

    // 1. Check choice-level branching (selected choice's next_question_code)
    if (current.choices && current.choices.length > 0) {
      const selectedChoice = current.choices.find((c) => c.value === answer);
      if (selectedChoice?.next_question_code) {
        nextCode = selectedChoice.next_question_code;
      }
    }

    // 2. Fallback to question-level skip_logic
    if (!nextCode && current.skip_logic && current.skip_logic.length > 0 && current.skip_logic[0].goto) {
      nextCode = current.skip_logic[0].goto;
    }

    // 3. Default: next question by order
    if (!nextCode) {
      const currentIdx = visibleQuestions.indexOf(current);
      if (currentIdx < visibleQuestions.length - 1) {
        current = visibleQuestions[currentIdx + 1];
        continue;
      }
      break;
    }

    // Follow the branch
    current = codeMap.get(nextCode);
    if (!current) {
      // Target question not in this section — fall back to next by order
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

/**
 * Calculate progress percentage based on required questions answered.
 * Uses flow-based questions when branching is available.
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
    // Use flow-based questions for sections with branching
    const activeQuestions = getFlowBasedQuestions(section, answers, questionsMap, sections);

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
