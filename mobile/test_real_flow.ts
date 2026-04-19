/**
 * Test getFlowItems with data structured like the actual API response.
 * Uses the real database values for QL1, show_conditions, choices, etc.
 *
 * Run: npx tsx test_real_flow.ts
 */

import type { Question, QuestionSection, SurveyAnswers, QuestionOption } from './lib/types';
export type { Question, QuestionSection, SurveyAnswers };

type FlowItem =
  | { kind: 'question'; question: Question }
  | { kind: 'hint'; questionCode: string; hintText: string; prevAnswerLabel: string | null };

function evaluateCondition(answerValue: any, expectedValue: any): boolean {
  if (answerValue === null || answerValue === undefined) return false;
  if (Array.isArray(expectedValue)) {
    if (Array.isArray(answerValue)) return answerValue.some((v) => expectedValue.includes(v));
    return expectedValue.includes(answerValue);
  }
  return answerValue === expectedValue;
}

function evaluateShowCondition(showCondition: Record<string, any> | undefined, allResponses: SurveyAnswers): boolean {
  if (!showCondition) return true;
  const questionCode = showCondition.question_code;
  const operator = showCondition.operator || 'equals';
  const expectedValue = showCondition.value;
  if (!questionCode) return true;
  const answer = allResponses[questionCode];
  if (answer === null || answer === undefined) return false;
  const result = (() => {
    switch (operator) {
      case 'equals': return evaluateCondition(answer, expectedValue);
      case 'contains': return Array.isArray(answer) ? answer.includes(expectedValue) : false;
      case 'in': return Array.isArray(expectedValue) ? expectedValue.includes(answer) : false;
      default: return evaluateCondition(answer, expectedValue);
    }
  })();
  console.log(`  evaluateShowCondition: q=${questionCode} op=${operator} val=${JSON.stringify(expectedValue)} answer=${JSON.stringify(answer)} => ${result}`);
  return result;
}

// Build sections mirroring the ACTUAL database structure
// DETAIL section has RQA-RQJ (order 14-23) + SRQA-SRQH (order 18-25) mixed
const DETAIL: QuestionSection = {
  id: 5, code: 'DETAIL', name: 'Detail', description: '',
  questions: [
    { id: 234, code: 'RQA', answer_type: 'TEXT', is_required: true, order: 14, show_condition: { question_code: 'QL1', operator: 'contains', value: 'R' }, choices: [] },
    { id: 235, code: 'RQB', answer_type: 'TEXT', is_required: true, order: 15, show_condition: { question_code: 'QL1', operator: 'contains', value: 'R' }, choices: [] },
    { id: 236, code: 'RQC', answer_type: 'TEXT', is_required: true, order: 16, show_condition: { question_code: 'QL1', operator: 'contains', value: 'R' }, choices: [] },
    { id: 237, code: 'RQD', answer_type: 'MULTIPLE_CHOICE', is_required: true, order: 17, show_condition: { question_code: 'QL1', operator: 'contains', value: 'R' }, choices: [{ value: 'JKN', next_question_code: 'RQF' }, { value: 'ASURANSI_SWASTA', next_question_code: 'RQF' }, { value: 'MANDIRI', next_question_code: 'RQE' }] },
    { id: 238, code: 'RQE', answer_type: 'NUMBER', is_required: true, order: 18, show_condition: { question_code: 'QL1', operator: 'contains', value: 'R' }, choices: [] },
    { id: 239, code: 'RQF', answer_type: 'STAFF_TABLE', is_required: true, order: 19, show_condition: { question_code: 'QL1', operator: 'contains', value: 'R' }, choices: [] },
    { id: 240, code: 'RQG', answer_type: 'SINGLE_CHOICE', is_required: true, order: 20, show_condition: { question_code: 'QL1', operator: 'contains', value: 'R' }, choices: [{ value: 'YA', next_question_code: 'RQH' }, { value: 'TIDAK', next_question_code: 'RQI' }] },
    { id: 241, code: 'RQH', answer_type: 'TEXT', is_required: true, order: 21, show_condition: { question_code: 'QL1', operator: 'contains', value: 'R' }, choices: [] },
    { id: 242, code: 'RQI', answer_type: 'MULTIPLE_CHOICE', is_required: true, order: 22, show_condition: { question_code: 'QL1', operator: 'contains', value: 'R' }, choices: [{ value: 'Anak', next_question_code: '' }, { value: 'DEWASA', next_question_code: '' }, { value: 'LANSIA', next_question_code: '' }, { value: 'SEMUA', next_question_code: '' }] },
    { id: 243, code: 'RQJ', answer_type: 'SINGLE_CHOICE', is_required: true, order: 23, show_condition: { question_code: 'QL1', operator: 'contains', value: 'R' }, choices: [{ value: 'YA', next_question_code: '' }, { value: 'TIDAK', next_question_code: '' }] },
    // SR questions mixed in (same section, different order)
    { id: 244, code: 'SRQA', answer_type: 'SINGLE_CHOICE', is_required: true, order: 18, show_condition: { question_code: 'QL1', operator: 'contains', value: 'SR' }, choices: [] },
    { id: 245, code: 'SRQB', answer_type: 'SINGLE_CHOICE', is_required: true, order: 19, show_condition: { question_code: 'QL1', operator: 'contains', value: 'SR' }, choices: [] },
    { id: 246, code: 'SRQC', answer_type: 'SINGLE_CHOICE', is_required: true, order: 20, show_condition: { question_code: 'QL1', operator: 'contains', value: 'SR' }, choices: [] },
    { id: 247, code: 'SRQD', answer_type: 'SINGLE_CHOICE', is_required: true, order: 21, show_condition: { question_code: 'QL1', operator: 'contains', value: 'SR' }, choices: [] },
    { id: 248, code: 'SRQE', answer_type: 'SINGLE_CHOICE', is_required: true, order: 22, show_condition: { question_code: 'QL1', operator: 'contains', value: 'SR' }, choices: [] },
    { id: 249, code: 'SRQF', answer_type: 'SINGLE_CHOICE', is_required: true, order: 23, show_condition: { question_code: 'QL1', operator: 'contains', value: 'SR' }, choices: [] },
    { id: 250, code: 'SRQG', answer_type: 'SINGLE_CHOICE', is_required: true, order: 24, show_condition: { question_code: 'QL1', operator: 'contains', value: 'SR' }, choices: [] },
    { id: 251, code: 'SRQH', answer_type: 'SINGLE_CHOICE', is_required: true, order: 25, show_condition: { question_code: 'QL1', operator: 'contains', value: 'SR' }, choices: [] },
  ]
};

// FASKSES section
const FASKSES: QuestionSection = {
  id: 3, code: 'FASKSES', name: 'Fasilitas Keswa', description: '',
  questions: [
    { id: 200, code: 'RQ1', answer_type: 'MULTIPLE_CHOICE', is_required: true, order: 1, show_condition: { question_code: 'QL1', operator: 'contains', value: 'R' }, choices: [{ value: 'AKUT', next_question_code: 'RQ2' }, { value: 'NON-AKUT', next_question_code: 'RQ5' }] },
    { id: 201, code: 'RQ2', answer_type: 'SINGLE_CHOICE', is_required: true, order: 2, show_condition: { question_code: 'QL1', operator: 'contains', value: 'R' }, choices: [{ value: 'Terdapat Dokter Jaga 24 Jam', next_question_code: 'RQ3' }, { value: 'Tidak Terdapat Dokter Jaga 24 Jam', next_question_code: 'RQ4' }] },
    { id: 202, code: 'RQ3', answer_type: 'SINGLE_CHOICE', is_required: true, order: 3, show_condition: { question_code: 'QL1', operator: 'contains', value: 'R' }, choices: [{ value: 'R1', next_question_code: 'RQA' }, { value: 'R2', next_question_code: 'RQA' }] },
    { id: 203, code: 'RQ4', answer_type: 'SINGLE_CHOICE', is_required: true, order: 4, show_condition: { question_code: 'QL1', operator: 'contains', value: 'R' }, choices: [{ value: 'R3.1.1', next_question_code: 'RQA' }, { value: 'R3.1.2', next_question_code: 'RQA' }] },
    { id: 204, code: 'RQ5', answer_type: 'SINGLE_CHOICE', is_required: true, order: 5, show_condition: { question_code: 'QL1', operator: 'contains', value: 'R' }, choices: [{ value: 'DOKTER_24', next_question_code: 'RQ6' }, { value: 'NON_DOKTER_24', next_question_code: 'RQ8' }, { value: 'LAINNYA', next_question_code: 'RQA' }] },
    { id: 205, code: 'RQ6', answer_type: 'SINGLE_CHOICE', is_required: true, order: 6, show_condition: { question_code: 'QL1', operator: 'contains', value: 'R' }, choices: [{ value: 'R4', next_question_code: 'RQA' }, { value: 'R6', next_question_code: 'RQA' }] },
    { id: 206, code: 'RQ7', answer_type: 'SINGLE_CHOICE', is_required: true, order: 7, show_condition: { question_code: 'QL1', operator: 'contains', value: 'R' }, choices: [{ value: 'R5', next_question_code: 'RQA' }, { value: 'R7', next_question_code: 'RQA' }] },
    { id: 207, code: 'RQ8', answer_type: 'SINGLE_CHOICE', is_required: true, order: 8, show_condition: { question_code: 'QL1', operator: 'contains', value: 'R' }, choices: [{ value: 'BATASAN_DITETAPKAN', next_question_code: 'RQ9' }, { value: 'BATASAN_TDK_DITETAPKAN', next_question_code: 'RQ13' }] },
    { id: 208, code: 'RQ9', answer_type: 'SINGLE_CHOICE', is_required: true, order: 9, show_condition: { question_code: 'QL1', operator: 'contains', value: 'R' }, choices: [{ value: 'R8', next_question_code: 'RQ10' }, { value: 'R9', next_question_code: 'RQ11' }, { value: 'RQ10', next_question_code: 'RQ12' }] },
    { id: 209, code: 'RQ10', answer_type: 'SINGLE_CHOICE', is_required: true, order: 10, show_condition: { question_code: 'QL1', operator: 'contains', value: 'R' }, choices: [{ value: 'R8.1', next_question_code: 'RQA' }, { value: 'R8.2', next_question_code: 'RQA' }] },
    { id: 210, code: 'RQ11', answer_type: 'SINGLE_CHOICE', is_required: true, order: 11, show_condition: { question_code: 'QL1', operator: 'contains', value: 'R' }, choices: [{ value: 'R9.1', next_question_code: 'RQA' }, { value: 'R9.2', next_question_code: 'RQA' }] },
    { id: 211, code: 'RQ12', answer_type: 'SINGLE_CHOICE', is_required: true, order: 12, show_condition: { question_code: 'QL1', operator: 'contains', value: 'R' }, choices: [{ value: 'R10.1', next_question_code: 'RQA' }, { value: 'R10.2', next_question_code: 'RQA' }] },
    { id: 212, code: 'RQ13', answer_type: 'SINGLE_CHOICE', is_required: true, order: 13, show_condition: { question_code: 'QL1', operator: 'contains', value: 'R' }, choices: [{ value: 'R11', next_question_code: 'RQA' }, { value: 'R12', next_question_code: 'RQA' }, { value: 'R13', next_question_code: 'RQA' }] },
  ]
};

// JENIS_LAYANAN section
const JENIS_LAYANAN: QuestionSection = {
  id: 2, code: 'JENIS_LAYANAN', name: 'Jenis Layanan', description: '',
  questions: [
    { id: 100, code: 'QL1', answer_type: 'MULTIPLE_CHOICE', is_required: true, order: 1, choices: [
      { value: 'R', next_question_code: 'RQ1' },
      { value: 'D', next_question_code: 'DQ1' },
      { value: 'O', next_question_code: 'OQ1' },
      { value: 'A', next_question_code: 'AQ1' },
      { value: 'I', next_question_code: 'IQ1' },
    ]}
  ]
};

const allSections = [JENIS_LAYANAN, FASKSES, DETAIL];

function buildGlobalCodeMap(allSections: QuestionSection[]): Map<string, Question> {
  const map = new Map<string, Question>();
  allSections.forEach((section) => {
    section.questions?.forEach((q) => map.set(q.code, q));
  });
  return map;
}

function getFlowItems(
  section: QuestionSection,
  allResponses: SurveyAnswers,
  questionsMap: Map<number, Question> | undefined,
  allSections: QuestionSection[] | undefined,
  rawAnswers: SurveyAnswers | undefined,
  _visitedSectionIds?: Set<number>,
  _forcedStartCode?: string,
): FlowItem[] {
  if (!section.questions || section.questions.length === 0) return [];

  const globalCodeMap = allSections ? buildGlobalCodeMap(allSections) : new Map<string, Question>();

  const detailGroupPrefix =
    _forcedStartCode && /[A-Z]$/.test(_forcedStartCode)
      ? _forcedStartCode.slice(0, -1)
      : undefined;

  console.log(`\n[getFlowItems] section=${section.code} _forcedStartCode=${_forcedStartCode} detailGroupPrefix=${detailGroupPrefix}`);
  console.log(`  section.questions (${section.questions.length} total):`, section.questions.map(q => q.code));

  const visibleQuestions = section.questions
    .filter((q) => {
      if (detailGroupPrefix && !q.code.startsWith(detailGroupPrefix)) {
        console.log(`  FILTER OUT '${q.code}': doesn't start with '${detailGroupPrefix}'`);
        return false;
      }
      if (q.show_condition) {
        const result = evaluateShowCondition(q.show_condition, allResponses);
        if (!result) console.log(`  FILTER OUT '${q.code}': show_condition false`);
        return result;
      }
      return true;
    })
    .sort((a, b) => a.order - b.order);

  console.log(`  visibleQuestions (${visibleQuestions.length}):`, visibleQuestions.map(q => q.code));

  if (visibleQuestions.length === 0) return [];

  const codeMap = new Map<string, Question>();
  visibleQuestions.forEach((q) => codeMap.set(q.code, q));

  const result: FlowItem[] = [];
  const visited = new Set<string>();

  let entryCodes: string[] = [];
  if (_forcedStartCode) {
    entryCodes = [_forcedStartCode];
  } else if (allSections) {
    for (const otherSection of allSections) {
      if (otherSection.id === section.id) continue;
      for (const q of otherSection.questions || []) {
        const answer = allResponses[q.code];
        if (answer === null || answer === undefined || answer === '') continue;
        const selectedValues = Array.isArray(answer) ? answer : [String(answer)];
        for (const c of q.choices || []) {
          if (selectedValues.includes(c.value) && c.next_question_code && codeMap.has(c.next_question_code)) {
            if (!entryCodes.includes(c.next_question_code)) {
              entryCodes.push(c.next_question_code);
            }
          }
        }
      }
    }
  }

  if (entryCodes.length === 0) {
    entryCodes = [visibleQuestions[0].code];
  }

  console.log(`  entryCodes: ${JSON.stringify(entryCodes)}`);

  for (const entryCode of entryCodes) {
    const startQuestion = codeMap.get(entryCode);
    if (!startQuestion) {
      console.log(`  ENTRY ${entryCode} NOT FOUND in codeMap`);
      continue;
    }

    let current: Question | undefined = startQuestion;

    while (current && !visited.has(current.code)) {
      visited.add(current.code);
      result.push({ kind: 'question', question: current });

      const answer = allResponses[current.code];
      const isAnswered = answer !== null && answer !== undefined && answer !== '';

      if (!isAnswered && current.is_required) {
        console.log(`  ${current.code}: BREAK (unanswered required)`);
        break;
      }

      let nextCode: string | undefined;
      let triggeringChoice: QuestionOption | undefined;

      if (current.choices && current.choices.length > 0) {
        triggeringChoice = (current.choices as QuestionOption[]).find((c) => {
          if (current!.answer_type === 'MULTIPLE_CHOICE' && Array.isArray(answer)) {
            return answer.includes(c.value);
          }
          return evaluateCondition(answer, c.value);
        });
        if (triggeringChoice?.next_question_code) {
          nextCode = triggeringChoice.next_question_code;
        }
      }

      if (!nextCode && current.skip_logic?.length && current.skip_logic[0].goto) {
        nextCode = current.skip_logic[0].goto;
      }

      if (!nextCode) {
        const idx = visibleQuestions.indexOf(current);
        if (current.choices && current.choices.length > 0 && idx >= visibleQuestions.length - 1) {
          console.log(`  ${current.code}: END OF BLOCK (terminal)`);
          break;
        }
        if (idx < visibleQuestions.length - 1) {
          current = visibleQuestions[idx + 1];
          continue;
        }
        console.log(`  ${current.code}: END OF SECTION`);
        break;
      }

      const nextInSection = codeMap.get(nextCode!);
      if (nextInSection) {
        current = nextInSection;
        continue;
      }

      // Cross-section jump
      if (allSections && rawAnswers) {
        const otherSection = allSections.find(
          (s) => s.id !== section.id && (s.questions || []).some((q) => q.code === nextCode)
        );
        if (otherSection) {
          const newVisited = new Set(_visitedSectionIds ?? []);
          newVisited.add(section.id);
          const triggerIdx = visibleQuestions.indexOf(current);

          console.log(`  ${current.code}: CROSS-SECTION → ${otherSection.code} (nextCode=${nextCode})`);
          const crossItems = getFlowItems(
            otherSection,
            allResponses,
            questionsMap,
            allSections,
            rawAnswers,
            newVisited,
            nextCode,
          );
          result.push(...crossItems);

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
      break;
    }
  }

  console.log(`  RESULT: ${result.map(i => i.kind === 'question' ? i.question.code : `HINT:${i.questionCode}`).join(' → ')}`);
  return result;
}

// ── TEST ─────────────────────────────────────────────────────────────────────
console.log('═'.repeat(80));
console.log('REAL DATABASE STRUCTURE TEST');
console.log('═'.repeat(80));

const answers: SurveyAnswers = {
  QL1: ['R'] as any,
  // R path
  RQ1: 'NON-AKUT',
  RQ5: 'NON_DOKTER_24',
  RQ8: 'BATASAN_TDK_DITETAPKAN',
  RQ13: 'R11',
  // Detail
  RQA: 'Pelayanan rawat inap',
  RQB: 'Program 1',
  RQC: [],
  RQD: 'JKN',
  RQE: 5,
  RQF: [],
  RQG: 'YA',
  RQH: 'Layanan rawat inap',
  RQI: ['SEMUA'],
  RQJ: 'TIDAK',
};

const questionsMap = buildGlobalCodeMap(allSections);

// Test: start from FASKSES (simulate being at RQ13 and going to DETAIL)
console.log('\n── Test 1: FASKSES flow from RQ1 ──');
const fasksesFlow = getFlowItems(FASKSES, answers, questionsMap, allSections, answers);
console.log(`FASKSES flow: ${fasksesFlow.map(i => i.kind === 'question' ? i.question.code : 'HINT').join(' → ')}`);
console.log(`Total items: ${fasksesFlow.length}`);

const lastItem = fasksesFlow[fasksesFlow.length - 1];
if (lastItem?.kind === 'question' && lastItem.question.code === 'RQJ') {
  console.log('✅ Terminates at RQJ correctly');
} else {
  console.log(`❌ Should terminate at RQJ, got: ${lastItem?.kind === 'question' ? lastItem.question.code : 'HINT'}`);
}
