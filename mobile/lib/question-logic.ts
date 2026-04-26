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
  | { kind: 'question'; question: Question; contextKey?: string }
  | { kind: 'hint'; questionCode: string; hintText: string; prevAnswerLabel: string | null; contextKey?: string }
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

  // Handle compound conditions (and/or with nested conditions)
  if (showCondition.operator === 'and' || showCondition.operator === 'or') {
    const conditions = showCondition.conditions || [];
    if (showCondition.operator === 'and') {
      return conditions.every((cond: Record<string, any>) =>
        evaluateSingleCondition(cond, allResponses)
      );
    } else {
      return conditions.some((cond: Record<string, any>) =>
        evaluateSingleCondition(cond, allResponses)
      );
    }
  }

  // Legacy single-condition format
  return evaluateSingleCondition(showCondition, allResponses);
}

function evaluateSingleCondition(
  cond: Record<string, any>,
  allResponses: SurveyAnswers
): boolean {
  const questionCode = cond.question_code;
  const operator = cond.operator || 'equals';
  const expectedValue = cond.value;

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
  _contextKey?: string,
): FlowItem[] {
  if (!section.questions || section.questions.length === 0) return [];

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

  if (visibleQuestions.length === 0) {
    return [];
  }

  const codeMap = new Map<string, Question>();
  visibleQuestions.forEach((q) => codeMap.set(q.code, q));

  // Find previous answer context for hint labels
  const prevAnswerInfo = allSections
    ? findPreviousAnswerInfo(allResponses, allSections)
    : null;

  const result: FlowItem[] = [];
  const visited = new Set<string>();
  const resolveBranchTargetCode = (questionCode: string, choice: QuestionOption): string | undefined => {
    if (questionCode === 'IQ3' && choice.value === 'I2.1') {
      return 'IQ4';
    }
    return choice.next_question_code;
  };
  const findInlineSectionForCode = (targetCode: string): QuestionSection | undefined =>
    allSections?.find(
      (s) =>
        s.id !== section.id &&
        (s.show_condition as Record<string, any>)?.question_code === '_inline_only_' &&
        (s.questions || []).some((q) => q.code === targetCode),
    );
  const buildContextAnswers = (ctxValue: string): SurveyAnswers => {
    const ctxAnswers: SurveyAnswers = {};
    for (const [k, v] of Object.entries(allResponses)) {
      if (!k.includes('|')) ctxAnswers[k] = v;
    }
    if (ctxValue && rawAnswers) {
      const prefix = `${ctxValue}|`;
      for (const [k, v] of Object.entries(rawAnswers)) {
        if (k.startsWith(prefix)) {
          ctxAnswers[k.slice(prefix.length)] = v;
        }
      }
    }
    return ctxAnswers;
  };
  const hasTraversedContextBranch = (targetCode: string, ctxValue: string): boolean =>
    result.some(
      (item) =>
        item.kind === 'question' &&
        item.question.code === targetCode &&
        (item.contextKey ?? '') === ctxValue,
    );

  // Determine entry point(s)
  // _forcedStartCode is used for cross-section jumps (detail chain) — process only that one
  // Otherwise, find ALL entry points from parent MULTIPLE_CHOICE (QL1/QL2) selections
  let entryCodes: string[];
  let hasExternalEntryCodes = false;
  if (_forcedStartCode) {
    entryCodes = [_forcedStartCode];
  } else if (allSections) {
    entryCodes = findAllEntryPointsForSection(section, visibleQuestions, allResponses, allSections, globalCodeMap);
    hasExternalEntryCodes = entryCodes.length > 0;
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
  // Also skip this check when _forcedStartCode is set — we need to traverse the full chain
  // even if all questions appear answered.
  const isInlineSection = (section.show_condition as Record<string, any>)?.question_code === '_inline_only_';
  if (isInlineSection && !_forcedStartCode) {
    const unvisitedQuestions = visibleQuestions.filter(q => {
      const ans = allResponses[q.code];
      return ans === null || ans === undefined || ans === '' || (Array.isArray(ans) && ans.length === 0);
    });
    if (unvisitedQuestions.length === 0) {
      return [];
    }
  }

  // Process each entry point sequentially
  entryLoop: for (const entryCode of entryCodes) {
    const startQuestion = codeMap.get(entryCode);
    if (!startQuestion) continue;

    let current: Question | undefined = startQuestion;
    let isFirstInSection = true; // Track if this is the first question (entry point) in the section

    questionLoop: while (current && !visited.has(current.code)) {
      visited.add(current.code);

      // If current question has introduction_text, emit a hint page FIRST, then the question
      if (current.introduction_text && current.introduction_text.trim().length > 0) {
        const prevLabel = prevAnswerInfo
          ? prevAnswerInfo.choice.label
          : null;
        result.push({
          kind: 'hint',
          questionCode: current.code,
          hintText: current.introduction_text.trim(),
          prevAnswerLabel: prevLabel,
          contextKey: _contextKey,
        });
      }

      result.push({ kind: 'question', question: current, contextKey: _contextKey });

      const answer = allResponses[current.code];
      const isAnswered = answer !== null && answer !== undefined && answer !== '';

      // Break on unanswered required question ONLY if it's NOT an entry point.
      // Entry points (first questions in section flow) should always be shown to user first.
      // The user must see and attempt the question before we break.
      if (!isAnswered && current.is_required && !isFirstInSection) {
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
          return answerType === 'MULTIPLE_CHOICE' && Array.isArray(answer)
            ? answer.includes(c.value)
            : evaluateCondition(answer, c.value);
        });
        if (triggeringChoice?.next_question_code) {
          nextCode = triggeringChoice.next_question_code;
        }
      } else if (current.skip_logic?.length && current.skip_logic[0].goto) {
        nextCode = current.skip_logic[0].goto;
      }

      // Special case: IQC (detail Konsultasi & Asesmen) — next depends on IQ1 answer
      // IQ1=I1 (konsultasi, no direct patient care) → go to IQD (tarif konsultasi)
      // IQ1=I2 (penyediaan informasi) → go to IQF (tarif informasi)
      // IQC is a SINGLE_CHOICE with YA→IQF, TIDAK→IQG by default;
      // but the IQC→IQD branch is needed only when IQ1=I1.
      if (current.code === 'IQC' && !nextCode?.startsWith('_iq1_branch')) {
        const iq1Answer = allResponses['IQ1'];
        if (iq1Answer === 'I1') {
          // User chose "Layanan Konsultasi..." → after IQC go to IQD (not IQF)
          const iqcNext = codeMap.get('IQD');
          if (iqcNext) {
            nextCode = 'IQD';
          }
        }
        // If IQ1=I2, default choice-based next (IQF or IQG) is correct
      }

      // Special case: IQ3 interactive info should go through IQ4 before entering detail.
      if (current.code === 'IQ3' && answer === 'I2.1') {
        nextCode = 'IQ4';
      }

      // Special case: IQB detail routing depends on the IQ2 / IQ3 / IQ4 context.
      // I1.x (consultation/assessment) -> IQD
      // I2.1.2 (interactive via media) -> IQC -> IQG...
      // I2.1.1 and I2.2 (face-to-face / non-interactive info) -> IQG
      if (current.code === 'IQB' && _contextKey) {
        if (/^I1\./.test(_contextKey)) {
          nextCode = 'IQD';
        } else if (_contextKey === 'I2.1.2') {
          nextCode = 'IQC';
        } else if (_contextKey === 'I2.1.1' || _contextKey === 'I2.2') {
          nextCode = 'IQG';
        }
      }

      // Special case: SDQA detail branch depends on the SDQ9/SDQ10 context value.
      // The template choices currently always point to SDQB, but each context should
      // open its own follow-up:
      // SD3.1.1 / SD3.2.1 -> SDQB1
      // SD3.1.2 / SD3.2.2 -> SDQB2
      // SD3.1.3 / SD3.2.3 -> SDQB3
      // SD3.1.4 / SD3.2.4 -> SDQB4
      if (current.code === 'SDQA' && _contextKey) {
        const ctxMatch = _contextKey.match(/^SD3\.[12]\.([1-4])$/);
        if (ctxMatch) {
          nextCode = `SDQB${ctxMatch[1]}`;
        }
      }

      // Special case: DQA detail branch depends on the DQ13/DQ14 context value.
      // D4.1 / D8.1 -> DQB1
      // D4.2 / D8.2 -> DQB2
      // D4.3 / D8.3 -> DQB3
      // D4.4 / D8.4 -> DQB3
      if (current.code === 'DQA' && _contextKey) {
        const ctxMatch = _contextKey.match(/^D(?:4|8)\.([1-4])$/);
        if (ctxMatch) {
          const branch = ctxMatch[1] === '1'
            ? 'DQB1'
            : ctxMatch[1] === '2'
            ? 'DQB2'
            : 'DQB3';
          nextCode = branch;
        }
      }

      // Special case: SOQ8 contains a stale SOQ8A target in template data.
      // Route the social branch into the shared detail entry instead.
      if (current.code === 'SOQ8' && answer === 'SO2.2.2') {
        nextCode = 'SOQA';
      }

      // Special case: SOQA detail branch depends on the SOQ7/SOQ8/SOQ9 context value.
      // SO2.x.1 -> SOQB1
      // SO2.x.2 -> SOQB2
      if (current.code === 'SOQA' && _contextKey) {
        const ctxMatch = _contextKey.match(/^SO2\.[123]\.([12])$/);
        if (ctxMatch) {
          nextCode = `SOQB${ctxMatch[1]}`;
        }
      }

      // Special case: OQA detail branch depends on the OQ4/OQ5/OQ7/OQ8/OQ11/OQ14/OQ15/OQ17/OQ18/OQ19
      // context family. Any O*.1 branch goes to OQB1, any O*.2 branch goes to OQB2.
      // This also covers deeper contexts such as O5.1.1 / O5.2.3 that reach OQA via OQ12/OQ13.
      if (current.code === 'OQA' && _contextKey) {
        const ctxMatch = _contextKey.match(/^O(?:\d+)\.(1|2)(?:\.\d+)?$/i);
        if (ctxMatch) {
          nextCode = `OQB${ctxMatch[1]}`;
        }
      }

      // Special case: SIQB detail routing depends on the SIQ2 / SIQ4 context.
      // SI1.x (consultation/assessment) -> SIQD
      // SI2.1.2 (interactive via media) -> SIQC -> SIQG...
      // SI2.1.1 and SI2.2 (face-to-face / non-interactive info) -> SIQG
      if (current.code === 'SIQB' && _contextKey) {
        if (/^SI1\./.test(_contextKey)) {
          nextCode = 'SIQD';
        } else if (_contextKey === 'SI2.1.2') {
          nextCode = 'SIQC';
        } else if (_contextKey === 'SI2.1.1' || _contextKey === 'SI2.2') {
          nextCode = 'SIQG';
        }
      }

      // Special case: payment-method MULTIPLE_CHOICE questions — show the tariff question
      // only when PEMBAYARAN MANDIRI is among the selected values, else skip past it.
      // This must be code-driven (not show_condition) because show_condition is evaluated once
      // at the start of the detail block flow, before the payment question may have been answered.
      const MANDIRI_VALUE = 'PEMBAYARAN MANDIRI OLEH KLIEN/PASIEN/KELUARGA';
      const paymentRouting = {
        RQH: { tariff: 'RQI', next: 'RQJ' },
        SRQH: { tariff: 'SRQI', next: 'SRQJ' },
        DQK: { tariff: 'DQL', next: 'DQM' },
        SDQK: { tariff: 'SDQL', next: 'SDQM' },
        OQK: { tariff: 'OQL', next: 'OQM' },
        SOQK: { tariff: 'SOQL', next: 'SOQM' },
      } as const;
      const paymentRoute = paymentRouting[current.code as keyof typeof paymentRouting];
      if (paymentRoute && Array.isArray(answer)) {
        const hasMandiri = answer.includes(MANDIRI_VALUE);
        nextCode = hasMandiri ? paymentRoute.tariff : paymentRoute.next;
      }

      if (!nextCode) {
        const idx = visibleQuestions.indexOf(current);
        // Only break as terminal if this is the LAST question AND it has choices
        // with no next_question_code (e.g. RQJ, DQF). Non-last questions with
        // empty next_question_code fall through to sequential navigation.
        if (current.choices && current.choices.length > 0 && idx >= visibleQuestions.length - 1) {
          break;
        }
        if (idx < visibleQuestions.length - 1) {
          const nextQ = visibleQuestions[idx + 1];
          current = nextQ;
          continue;
        }
        break;
      }

      // Within same section
      const nextInSection = codeMap.get(nextCode);
      if (nextInSection) {
        current = nextInSection;
        continue questionLoop;
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
        // Only cross-section jump to inline sentinel sections (_inline_only_).
        // Searching all sections first could find the wrong section (e.g., SAQA found
        // in JENIS_LAYANAN instead of DETAIL). By filtering for _inline_only_ first,
        // we ensure only actual DETAIL blocks are considered cross-section targets.
        const otherSection = findInlineSectionForCode(nextCode);
        const targetIsSentinel =
          otherSection?.show_condition != null &&
          (otherSection.show_condition as Record<string, any>)?.question_code === '_inline_only_';
        if (otherSection && targetIsSentinel && !(_visitedSectionIds?.has(otherSection.id))) {
          const sectionVisited = _visitedSectionIds ?? new Set<number>();
          const newVisited = new Set(sectionVisited);
          newVisited.add(section.id);
          // Track the index of the question that triggered the cross-section jump
          const triggerIdx = visibleQuestions.indexOf(current);
          let pendingChoice: QuestionOption | undefined = triggeringChoice;
          let pendingStartCode: string | undefined = nextCode;
          let pendingInlineSection: QuestionSection | undefined = otherSection;

          while (pendingInlineSection && pendingStartCode) {
            // Mobile storage prefixes detail answers with the raw choice VALUE
            // (e.g. "R4|RQA"), NOT cabang_mtc. Use the raw value so the prefix
            // lookup actually finds this cycle's answers and each loop stays isolated.
            const ctxValue = pendingChoice?.value ?? '';
            const ctxAnswers = buildContextAnswers(ctxValue);
            const crossItems = getFlowItems(
              pendingInlineSection,
              ctxAnswers,
              questionsMap,
              allSections,
              rawAnswers,
              newVisited,
              pendingStartCode,
              ctxValue,
            );

            result.push(...crossItems);

            // After a cross-section inline detail block (e.g. RQA→RQJ) completes,
            // determine where to go next based on the MULTIPLE_CHOICE branching structure.
            let mcFound = false;
            let nextBranchQuestion: Question | undefined;
            let nextCrossSectionChoice: QuestionOption | undefined;
            let allSelectedBranchesWereCrossSection = false;

            for (const item of crossItems) {
              if (item.kind === 'question') {
                visited.add(item.question.code);
              }
            }

            for (let ri = result.length - 1; ri >= 0; ri--) {
              const item = result[ri];
              if (item.kind !== 'question') continue;
              const mcQ = item.question;

              if (!codeMap.has(mcQ.code)) continue;
              if (mcQ.answer_type !== 'MULTIPLE_CHOICE') continue;

              const rawMcAnswer = allResponses[mcQ.code];
              const mcAnswer = Array.isArray(rawMcAnswer)
                ? rawMcAnswer
                : rawMcAnswer != null && rawMcAnswer !== ''
                ? [rawMcAnswer]
                : [];
              if (mcAnswer.length === 0) continue;

              const selectedChoicesWithNext = (mcQ.choices || []).filter(
                (c: QuestionOption) =>
                  mcAnswer.includes(c.value) && resolveBranchTargetCode(mcQ.code, c),
              );
              const nextChoice = selectedChoicesWithNext.find((c) => {
                const targetCode = resolveBranchTargetCode(mcQ.code, c)!;
                const target = codeMap.get(targetCode);
                if (target) return !visited.has(target.code);
                const inlineTarget = findInlineSectionForCode(targetCode);
                if (!inlineTarget) return false;
                return !hasTraversedContextBranch(targetCode, c.value);
              });

              if (nextChoice) {
                const targetCode = resolveBranchTargetCode(mcQ.code, nextChoice)!;
                const target = codeMap.get(targetCode);
                if (target) {
                  nextBranchQuestion = target;
                } else {
                  nextCrossSectionChoice = nextChoice;
                }
                mcFound = true;
                break;
              }

              if (selectedChoicesWithNext.length > 0) {
                allSelectedBranchesWereCrossSection = selectedChoicesWithNext.every(
                  (c) => !codeMap.has(resolveBranchTargetCode(mcQ.code, c)!),
                );
                mcFound = true;
              }
            }

            if (nextCrossSectionChoice) {
              pendingChoice = nextCrossSectionChoice;
              pendingStartCode = nextCrossSectionChoice.next_question_code;
              pendingInlineSection = pendingStartCode
                ? findInlineSectionForCode(pendingStartCode)
                : undefined;
              if (pendingInlineSection) {
                continue;
              }
            }

            if (nextBranchQuestion && !visited.has(nextBranchQuestion.code)) {
              current = nextBranchQuestion;
              continue questionLoop;
            }

            if (mcFound) {
              if (!allSelectedBranchesWereCrossSection) {
                break questionLoop;
              }
            }

            let nextIdx = triggerIdx + 1;
            while (nextIdx < visibleQuestions.length && visited.has(visibleQuestions[nextIdx].code)) {
              nextIdx++;
            }
            if (nextIdx < visibleQuestions.length) {
              const nextQuestion = visibleQuestions[nextIdx];
              const isUnselectedRootBranch =
                hasExternalEntryCodes &&
                nextQuestion.parent_question == null &&
                !entryCodes.includes(nextQuestion.code);
              if (isUnselectedRootBranch) {
                break questionLoop;
              }
              current = visibleQuestions[nextIdx];
              continue questionLoop;
            }
            break questionLoop;
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
