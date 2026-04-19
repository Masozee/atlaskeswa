/**
 * Comprehensive Flow Audit — using ACTUAL database structure
 * Run: npx tsx audit_flow.ts
 */

import type { Question, QuestionSection, SurveyAnswers } from './lib/types';

function evaluateCondition(answerValue: any, expectedValue: any): boolean {
  if (answerValue === null || answerValue === undefined) return false;
  if (Array.isArray(expectedValue)) {
    if (Array.isArray(answerValue)) return answerValue.some((v) => expectedValue.includes(v));
    return expectedValue.includes(answerValue);
  }
  return answerValue === expectedValue;
}

function evaluateShowCondition(showCondition: any, allResponses: SurveyAnswers): boolean {
  if (!showCondition) return true;
  const questionCode = showCondition.question_code;
  const operator = showCondition.operator || 'equals';
  const expectedValue = showCondition.value;
  if (!questionCode) return true;
  const answer = allResponses[questionCode];
  if (answer === null || answer === undefined) return false;
  if (operator === 'contains') return evaluateCondition(answer, expectedValue);
  if (operator === 'in') return evaluateCondition(answer, expectedValue);
  if (operator === 'equals') return evaluateCondition(answer, expectedValue);
  return evaluateCondition(answer, expectedValue);
}

function getActiveSections(sections: QuestionSection[], allResponses: SurveyAnswers): QuestionSection[] {
  const result = sections.filter((section) => {
    if (section.show_condition) return evaluateShowCondition(section.show_condition, allResponses);
    return true;
  });
  return result;
}

function getActiveQuestionsForSection(section: QuestionSection, allResponses: SurveyAnswers): Question[] {
  if (!section.questions) return [];
  return section.questions
    .filter((q) => {
      if (q.show_condition) return evaluateShowCondition(q.show_condition, allResponses);
      return true;
    })
    .sort((a, b) => (a.order || 0) - (b.order || 0));
}

// Simulate getFlowItems — trace every navigation step
function traceFlow(
  section: QuestionSection,
  allResponses: SurveyAnswers,
  allSections: QuestionSection[],
  visitedSectionIds?: Set<number>,
  forcedStartCode?: string,
  indent: string = '',
): string[] {
  // Filter visible questions
  const questions = section.questions
    ? section.questions
        .filter((q) => {
          if (q.show_condition) return evaluateShowCondition(q.show_condition, allResponses);
          return true;
        })
        .sort((a, b) => (a.order || 0) - (b.order || 0))
    : [];

  const codeMap = new Map(questions.map((q) => [q.code, q]));
  const visited = new Set<string>();
  const result: string[] = [];

  // Entry points
  let entryCodes: string[] = [];
  if (forcedStartCode) {
    entryCodes = [forcedStartCode];
  } else {
    // Find from other sections
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
  if (entryCodes.length === 0) entryCodes = [questions[0]?.code].filter(Boolean) as string[];

  console.log(`${indent}[TRACE] section=${section.code} visible=[${questions.map(q => q.code).join(',')}] entries=[${entryCodes.join(',')}]`);

  for (const entryCode of entryCodes) {
    let current = codeMap.get(entryCode);
    if (!current) continue;

    while (current && !visited.has(current.code)) {
      visited.add(current.code);
      const answer = allResponses[current.code];
      const isAnswered = answer !== null && answer !== undefined && answer !== '';

      console.log(`${indent}  → ${current.code} (${current.answer_type}) ${isAnswered ? `✓=${JSON.stringify(answer)}` : '✗ UNANSWERED'}`);

      let nextCode: string | undefined;
      let triggeringChoice: any;

      if (current.choices?.length) {
        triggeringChoice = current.choices.find((c: any) => {
          if (Array.isArray(answer)) return answer.includes(c.value);
          return evaluateCondition(answer, c.value);
        });
        if (triggeringChoice?.next_question_code) {
          nextCode = triggeringChoice.next_question_code;
          console.log(`${indent}    choice=${triggeringChoice.value} → ${nextCode}`);
        } else if (triggeringChoice) {
          console.log(`${indent}    choice=${triggeringChoice.value} → TERMINAL (no next)`);
        } else {
          console.log(`${indent}    NO MATCH for ans=${JSON.stringify(answer)} first=${current.choices[0]?.value}`);
        }
      }

      if (!nextCode && current.skip_logic?.length && current.skip_logic[0].goto) {
        nextCode = current.skip_logic[0].goto;
      }

      if (!nextCode) {
        const idx = questions.indexOf(current);
        // Only break as terminal if LAST question AND has choices
        if (current.choices && current.choices.length > 0 && idx >= questions.length - 1) {
          console.log(`${indent}    END OF BLOCK (last, terminal)`);
          break;
        }
        if (idx < questions.length - 1) {
          current = questions[idx + 1];
          console.log(`${indent}    SEQUENTIAL → ${current.code}`);
          continue;
        }
        console.log(`${indent}    END OF SECTION`);
        break;
      }

      const nextInSection = codeMap.get(nextCode);
      if (nextInSection) {
        current = nextInSection;
        continue;
      }

      // Cross-section
      const otherSection = allSections.find(
        (s) => s.id !== section.id && (s.questions || []).some((q) => q.code === nextCode)
      );
      if (otherSection) {
        const triggerIdx = questions.indexOf(current);
        console.log(`${indent}    ══ CROSS-SECTION: ${section.code} → ${otherSection.code} ══`);
        const newVisited = new Set(visitedSectionIds || []);
        newVisited.add(section.id);
        const crossResult = traceFlow(otherSection, allResponses, allSections, newVisited, nextCode, indent + '    ');
        result.push(...crossResult);

        // Continue in current section after cross-section
        let nextIdx = triggerIdx + 1;
        while (nextIdx < questions.length && visited.has(questions[nextIdx].code)) {
          nextIdx++;
        }
        if (nextIdx < questions.length) {
          current = questions[nextIdx];
          continue;
        }
        break;
      }

      console.log(`${indent}    ${nextCode} NOT FOUND`);
      break;
    }
  }

  return result;
}

// ── REAL DATABASE STRUCTURE ────────────────────────────────────────────────

const QL1_SHOW_COND_R = { question_code: 'QL1', operator: 'contains', value: 'R' };
const QL1_SHOW_COND_D = { question_code: 'QL1', operator: 'contains', value: 'D' };
const QL1_SHOW_COND_O = { question_code: 'QL1', operator: 'contains', value: 'O' };
const QL1_SHOW_COND_A = { question_code: 'QL1', operator: 'contains', value: 'A' };
const QL1_SHOW_COND_I = { question_code: 'QL1', operator: 'contains', value: 'I' };

// DATA_DASAR
const DATA_DASAR: QuestionSection = {
  id: 1, code: 'DATA_DASAR',
  questions: Array.from({ length: 16 }, (_, i) => ({ id: i + 1, code: `Q${i + 1}`, answer_type: 'TEXT', is_required: true, order: i + 1, choices: [] }))
};

// JENIS_LAYANAN
const JENIS_LAYANAN: QuestionSection = {
  id: 2, code: 'JENIS_LAYANAN',
  questions: [
    { id: 40, code: 'QL1', answer_type: 'MULTIPLE_CHOICE', is_required: true, order: 1, choices: [
      { value: 'R', next_question_code: 'RQ1' }, { value: 'D', next_question_code: 'DQ1' },
      { value: 'O', next_question_code: 'OQ1' }, { value: 'A', next_question_code: 'AQ1' },
      { value: 'I', next_question_code: 'IQ1' },
    ]},
    { id: 41, code: 'QL2', answer_type: 'MULTIPLE_CHOICE', is_required: false, order: 2, choices: [
      { value: 'SR', next_question_code: 'SRQ1' }, { value: 'SD', next_question_code: 'SDQ1' },
      { value: 'SO', next_question_code: 'SOQ1' }, { value: 'SA', next_question_code: 'SAQ1' },
      { value: 'SI', next_question_code: 'SIQ1' },
    ]},
  ]
};

// FASKSES — all 57 questions (database structure)
const FASKSES: QuestionSection = {
  id: 3, code: 'FASKSES',
  questions: [
    { id: 43, code: 'RQ1', answer_type: 'MULTIPLE_CHOICE', is_required: true, order: 1, choices: [{ value: 'AKUT', next_question_code: 'RQ2' }, { value: 'NON-AKUT', next_question_code: 'RQ5' }] },
    { id: 44, code: 'RQ2', answer_type: 'SINGLE_CHOICE', is_required: true, order: 2, choices: [{ value: 'Terdapat Dokter Jaga 24 Jam', next_question_code: 'RQ3' }, { value: 'Tidak Terdapat Dokter Jaga 24 Jam', next_question_code: 'RQ4' }] },
    { id: 45, code: 'RQ3', answer_type: 'SINGLE_CHOICE', is_required: true, order: 3, choices: [{ value: 'R1', next_question_code: 'RQA' }, { value: 'R2', next_question_code: 'RQA' }] },
    { id: 46, code: 'RQ4', answer_type: 'SINGLE_CHOICE', is_required: true, order: 4, choices: [{ value: 'R3.1.1', next_question_code: 'RQA' }, { value: 'R3.1.2', next_question_code: 'RQA' }] },
    { id: 47, code: 'RQ5', answer_type: 'SINGLE_CHOICE', is_required: true, order: 5, choices: [{ value: 'DOKTER_24', next_question_code: 'RQ6' }, { value: 'NON_DOKTER_24', next_question_code: 'RQ8' }, { value: 'LAINNYA', next_question_code: 'RQA' }] },
    { id: 48, code: 'RQ6', answer_type: 'SINGLE_CHOICE', is_required: true, order: 6, choices: [{ value: 'R4', next_question_code: 'RQA' }, { value: 'R6', next_question_code: 'RQA' }] },
    { id: 49, code: 'RQ7', answer_type: 'SINGLE_CHOICE', is_required: true, order: 7, choices: [{ value: 'R5', next_question_code: 'RQA' }, { value: 'R7', next_question_code: 'RQA' }] },
    { id: 50, code: 'RQ8', answer_type: 'SINGLE_CHOICE', is_required: true, order: 8, choices: [{ value: 'BATASAN_DITETAPKAN', next_question_code: 'RQ9' }, { value: 'BATASAN_TDK_DITETAPKAN', next_question_code: 'RQ13' }] },
    { id: 51, code: 'RQ9', answer_type: 'SINGLE_CHOICE', is_required: true, order: 9, choices: [{ value: 'R8', next_question_code: 'RQ10' }, { value: 'R9', next_question_code: 'RQ11' }, { value: 'RQ10', next_question_code: 'RQ12' }] },
    { id: 52, code: 'RQ10', answer_type: 'SINGLE_CHOICE', is_required: true, order: 10, choices: [{ value: 'R8.1', next_question_code: 'RQA' }, { value: 'R8.2', next_question_code: 'RQA' }] },
    { id: 53, code: 'RQ11', answer_type: 'SINGLE_CHOICE', is_required: true, order: 11, choices: [{ value: 'R9.1', next_question_code: 'RQA' }, { value: 'R9.2', next_question_code: 'RQA' }] },
    { id: 54, code: 'RQ12', answer_type: 'SINGLE_CHOICE', is_required: true, order: 12, choices: [{ value: 'R10.1', next_question_code: 'RQA' }, { value: 'R10.2', next_question_code: 'RQA' }] },
    { id: 56, code: 'RQ13', answer_type: 'SINGLE_CHOICE', is_required: true, order: 13, choices: [{ value: 'R11', next_question_code: 'RQA', cabang_mtc: 'Dukungan Staf 24 Jam' }, { value: 'R12', next_question_code: 'RQA', cabang_mtc: 'Dukungan Staf Durante Jam Kerja' }, { value: 'R13', next_question_code: 'RQA', cabang_mtc: 'Dukungan Staf <5 Per Minggu' }] },
    // DQ block
    { id: 57, code: 'DQ1', answer_type: 'SINGLE_CHOICE', is_required: true, order: 14, choices: [{ value: 'AKUT', next_question_code: 'DQ2' }, { value: 'NON-AKUT', next_question_code: 'DQ5' }] },
    { id: 58, code: 'DQ2', answer_type: 'SINGLE_CHOICE', is_required: true, order: 15, choices: [{ value: 'DO', next_question_code: 'DQ3' }, { value: 'D1', next_question_code: 'DQ4' }] },
    { id: 59, code: 'DQ3', answer_type: 'SINGLE_CHOICE', is_required: true, order: 16, choices: [{ value: 'D0.1', next_question_code: 'DQA' }, { value: 'D0.2', next_question_code: 'DQA' }] },
    { id: 60, code: 'DQ4', answer_type: 'SINGLE_CHOICE', is_required: true, order: 17, choices: [{ value: 'D1.1', next_question_code: 'DQA' }, { value: 'D1.2', next_question_code: 'DQA' }] },
    { id: 61, code: 'DQ5', answer_type: 'MULTIPLE_CHOICE', is_required: true, order: 18, choices: [{ value: 'PEKERJAAN', next_question_code: 'DQ6' }, { value: 'TERSTRUKTUR_NON_PEKERJAAN', next_question_code: 'DQ12' }, { value: 'PERSIAPAN_KERJA', next_question_code: 'DQ9' }, { value: 'TIDAK_TERSTRUKTUR', next_question_code: 'DQ15' }] },
    { id: 62, code: 'DQ6', answer_type: 'SINGLE_CHOICE', is_required: true, order: 19, choices: [{ value: 'D2', next_question_code: 'DQ7' }, { value: 'D6', next_question_code: 'DQ8' }] },
    { id: 63, code: 'DQ7', answer_type: 'SINGLE_CHOICE', is_required: true, order: 20, choices: [{ value: 'D2.1', next_question_code: 'DQA' }, { value: 'D2.2', next_question_code: 'DQA' }] },
    { id: 64, code: 'DQ8', answer_type: 'SINGLE_CHOICE', is_required: true, order: 21, choices: [{ value: 'D6.1', next_question_code: 'DQA' }, { value: 'D6.2', next_question_code: 'DQA' }] },
    { id: 65, code: 'DQ9', answer_type: 'SINGLE_CHOICE', is_required: true, order: 22, choices: [{ value: 'D3', next_question_code: 'DQ10' }, { value: 'D7', next_question_code: 'DQ11' }] },
    { id: 66, code: 'DQ10', answer_type: 'SINGLE_CHOICE', is_required: true, order: 23, choices: [{ value: 'D3.1', next_question_code: 'DQA' }, { value: 'D3.2', next_question_code: 'DQA' }] },
    { id: 67, code: 'DQ11', answer_type: 'SINGLE_CHOICE', is_required: true, order: 24, choices: [{ value: 'D7.1', next_question_code: 'DQA' }, { value: 'D7.2', next_question_code: 'DQA' }] },
    { id: 68, code: 'DQ12', answer_type: 'SINGLE_CHOICE', is_required: true, order: 25, choices: [{ value: 'D4', next_question_code: 'DQ13' }, { value: 'D8', next_question_code: 'DQ14' }] },
    { id: 69, code: 'DQ13', answer_type: 'SINGLE_CHOICE', is_required: true, order: 26, choices: [{ value: 'D4.1', next_question_code: 'DQA' }, { value: 'D4.2', next_question_code: 'DQA' }, { value: 'D4.3', next_question_code: 'DQA' }, { value: 'D4.4', next_question_code: 'DQA' }] },
    { id: 70, code: 'DQ14', answer_type: 'SINGLE_CHOICE', is_required: true, order: 27, choices: [{ value: 'D8.1', next_question_code: 'DQA' }, { value: 'D8.2', next_question_code: 'DQA' }, { value: 'D8.3', next_question_code: 'DQA' }, { value: 'D8.4', next_question_code: 'DQA' }] },
    { id: 71, code: 'DQ15', answer_type: 'SINGLE_CHOICE', is_required: true, order: 28, choices: [{ value: 'D5', next_question_code: 'DQA' }, { value: 'D9', next_question_code: 'DQA' }] },
    // OQ block
    { id: 72, code: 'OQ1', answer_type: 'SINGLE_CHOICE', is_required: true, order: 29, choices: [{ value: 'AKUT', next_question_code: 'OQ2' }, { value: 'NON_AKUT', next_question_code: 'OQ9' }] },
    { id: 73, code: 'OQ2', answer_type: 'SINGLE_CHOICE', is_required: true, order: 30, choices: [{ value: 'LAYANAN_KUNJUNGAN', next_question_code: 'OQ3' }, { value: 'LAYANAN_FASILITAS', next_question_code: 'OQ6' }] },
    { id: 74, code: 'OQ3', answer_type: 'SINGLE_CHOICE', is_required: true, order: 31, choices: [{ value: 'O1', next_question_code: 'OQ4' }, { value: 'O2', next_question_code: 'OQ5' }] },
    { id: 75, code: 'OQ4', answer_type: 'SINGLE_CHOICE', is_required: true, order: 32, choices: [{ value: 'O1.1', next_question_code: 'OQA' }, { value: 'O1.2', next_question_code: 'OQA' }] },
    { id: 76, code: 'OQ5', answer_type: 'SINGLE_CHOICE', is_required: true, order: 33, choices: [{ value: 'O2.1', next_question_code: 'OQA' }, { value: 'O1.2', next_question_code: 'OQA' }] },
    { id: 77, code: 'OQ6', answer_type: 'SINGLE_CHOICE', is_required: true, order: 34, choices: [{ value: 'O3', next_question_code: 'OQ7' }, { value: 'O4', next_question_code: 'OQ8' }] },
    { id: 78, code: 'OQ7', answer_type: 'SINGLE_CHOICE', is_required: true, order: 35, choices: [{ value: 'O3.1', next_question_code: 'OQA' }, { value: 'O3.2', next_question_code: 'OQA' }] },
    { id: 79, code: 'OQ8', answer_type: 'SINGLE_CHOICE', is_required: true, order: 36, choices: [{ value: 'O4.1', next_question_code: 'OQA' }, { value: 'O5.2', next_question_code: 'OQ13' }] },
    { id: 80, code: 'OQ9', answer_type: 'SINGLE_CHOICE', is_required: true, order: 37, choices: [{ value: 'LAYANAN_KUNJUNGAN', next_question_code: 'OQ10' }, { value: 'LAYANAN_FASILITAS', next_question_code: 'OQ16' }] },
    { id: 81, code: 'OQ10', answer_type: 'SINGLE_CHOICE', is_required: true, order: 38, choices: [{ value: 'O5', next_question_code: 'OQ11' }, { value: 'O6', next_question_code: 'OQ14' }, { value: 'O7', next_question_code: 'OQ15' }] },
    { id: 82, code: 'OQ11', answer_type: 'SINGLE_CHOICE', is_required: true, order: 39, choices: [{ value: 'O5.1', next_question_code: 'OQ12' }, { value: 'O5.2', next_question_code: 'OQ13' }] },
    { id: 83, code: 'OQ12', answer_type: 'SINGLE_CHOICE', is_required: true, order: 40, choices: [{ value: 'O5.1.1', next_question_code: 'OQA' }, { value: 'O5.1.2', next_question_code: 'OQA' }, { value: 'O5.1.3', next_question_code: 'OQA' }] },
    { id: 84, code: 'OQ13', answer_type: 'SINGLE_CHOICE', is_required: true, order: 41, choices: [{ value: 'O5.2.1', next_question_code: 'OQA' }, { value: 'o5.2.2', next_question_code: 'OQA' }, { value: 'O5.2.3', next_question_code: 'OQA' }] },
    { id: 85, code: 'OQ14', answer_type: 'SINGLE_CHOICE', is_required: true, order: 42, choices: [{ value: 'O6.1', next_question_code: 'OQA' }, { value: 'O6.2', next_question_code: 'OQA' }] },
    { id: 86, code: 'OQ15', answer_type: 'SINGLE_CHOICE', is_required: true, order: 43, choices: [{ value: 'O7.1', next_question_code: 'OQA' }, { value: 'O7.2', next_question_code: 'OQA' }] },
    { id: 87, code: 'OQ16', answer_type: 'SINGLE_CHOICE', is_required: true, order: 44, choices: [{ value: 'O8', next_question_code: 'OQ17' }, { value: 'O10', next_question_code: 'OQ19' }] },
    { id: 88, code: 'OQ17', answer_type: 'SINGLE_CHOICE', is_required: true, order: 45, choices: [{ value: 'O8.1', next_question_code: 'OQA' }, { value: 'O8.2', next_question_code: 'OQA' }] },
    { id: 89, code: 'OQ18', answer_type: 'SINGLE_CHOICE', is_required: true, order: 46, choices: [{ value: 'O9.1', next_question_code: 'OQA' }, { value: 'O9.2', next_question_code: 'OQA' }] },
    { id: 90, code: 'OQ19', answer_type: 'SINGLE_CHOICE', is_required: true, order: 47, choices: [{ value: 'O10.1', next_question_code: 'OQA' }, { value: 'O10.2', next_question_code: 'OQA' }] },
    // AQ block
    { id: 91, code: 'AQ1', answer_type: 'MULTIPLE_CHOICE', is_required: true, order: 48, choices: [{ value: 'A1', next_question_code: 'AQ2' }, { value: 'A2', next_question_code: 'AQ3' }, { value: 'A3', next_question_code: 'AQ4' }, { value: 'A4', next_question_code: 'AQ5' }, { value: 'A5', next_question_code: 'AQ6' }] },
    { id: 92, code: 'AQ2', answer_type: 'TEXT', is_required: true, order: 49, choices: [] },
    { id: 93, code: 'AQ3', answer_type: 'TEXT', is_required: true, order: 50, choices: [] },
    { id: 94, code: 'AQ4', answer_type: 'SINGLE_CHOICE', is_required: true, order: 51, choices: [] },
    { id: 95, code: 'AQ5', answer_type: 'SINGLE_CHOICE', is_required: true, order: 52, choices: [] },
    { id: 96, code: 'AQ6', answer_type: 'SINGLE_CHOICE', is_required: true, order: 53, choices: [] },
    // IQ block
    { id: 97, code: 'IQ1', answer_type: 'MULTIPLE_CHOICE', is_required: true, order: 54, choices: [{ value: 'I1', next_question_code: 'IQ2' }, { value: 'I2', next_question_code: 'IQ3' }] },
    { id: 98, code: 'IQ2', answer_type: 'SINGLE_CHOICE', is_required: true, order: 55, choices: [{ value: 'I1.1', next_question_code: 'IQA' }, { value: 'I1.2', next_question_code: 'IQA' }, { value: 'I1.3', next_question_code: 'IQA' }, { value: 'I1.4', next_question_code: 'IQA' }, { value: 'I1.5', next_question_code: 'IQA' }] },
    { id: 99, code: 'IQ3', answer_type: 'MULTIPLE_CHOICE', is_required: true, order: 56, choices: [{ value: 'I2.1', next_question_code: 'IQA' }, { value: 'I2.2', next_question_code: 'IQA' }] },
    { id: 100, code: 'IQ4', answer_type: 'SINGLE_CHOICE', is_required: true, order: 57, choices: [{ value: 'I2.1.1', next_question_code: 'IQA' }, { value: 'I2.1.2', next_question_code: 'IQA' }] },
  ]
};

// DETAIL section
const DETAIL: QuestionSection = {
  id: 5, code: 'DETAIL',
  questions: [
    { id: 234, code: 'RQA', answer_type: 'TEXT', is_required: true, order: 1, show_condition: QL1_SHOW_COND_R, choices: [] },
    { id: 235, code: 'RQB', answer_type: 'TEXT', is_required: true, order: 2, show_condition: QL1_SHOW_COND_R, choices: [] },
    { id: 236, code: 'RQC', answer_type: 'TEXT', is_required: true, order: 3, show_condition: QL1_SHOW_COND_R, choices: [] },
    { id: 237, code: 'RQD', answer_type: 'MULTIPLE_CHOICE', is_required: true, order: 4, show_condition: QL1_SHOW_COND_R, choices: [{ value: 'JKN', next_question_code: 'RQF' }, { value: 'ASURANSI_SWASTA', next_question_code: 'RQF' }, { value: 'MANDIRI', next_question_code: 'RQE' }] },
    { id: 238, code: 'RQE', answer_type: 'NUMBER', is_required: true, order: 5, show_condition: QL1_SHOW_COND_R, choices: [] },
    { id: 239, code: 'RQF', answer_type: 'STAFF_TABLE', is_required: true, order: 6, show_condition: QL1_SHOW_COND_R, choices: [] },
    { id: 240, code: 'RQG', answer_type: 'SINGLE_CHOICE', is_required: true, order: 7, show_condition: QL1_SHOW_COND_R, choices: [{ value: 'YA', next_question_code: 'RQH' }, { value: 'TIDAK', next_question_code: 'RQI' }] },
    { id: 241, code: 'RQH', answer_type: 'TEXT', is_required: true, order: 8, show_condition: QL1_SHOW_COND_R, choices: [] },
    { id: 242, code: 'RQI', answer_type: 'MULTIPLE_CHOICE', is_required: true, order: 9, show_condition: QL1_SHOW_COND_R, choices: [{ value: 'Anak', next_question_code: '' }, { value: 'DEWASA', next_question_code: '' }, { value: 'LANSIA', next_question_code: '' }, { value: 'SEMUA', next_question_code: '' }] },
    { id: 243, code: 'RQJ', answer_type: 'SINGLE_CHOICE', is_required: true, order: 10, show_condition: QL1_SHOW_COND_R, choices: [{ value: 'YA', next_question_code: '' }, { value: 'TIDAK', next_question_code: '' }] },
    // DQ detail
    { id: 244, code: 'DQA', answer_type: 'TEXT', is_required: true, order: 11, show_condition: QL1_SHOW_COND_D, choices: [] },
    { id: 245, code: 'DQB', answer_type: 'REPEATING_TABLE', is_required: true, order: 12, show_condition: QL1_SHOW_COND_D, choices: [] },
    { id: 246, code: 'DQC', answer_type: 'STAFF_TABLE', is_required: true, order: 13, show_condition: QL1_SHOW_COND_D, choices: [] },
    { id: 247, code: 'DQD', answer_type: 'SINGLE_CHOICE', is_required: true, order: 14, show_condition: QL1_SHOW_COND_D, choices: [] },
    { id: 248, code: 'DQE', answer_type: 'SINGLE_CHOICE', is_required: true, order: 15, show_condition: QL1_SHOW_COND_D, choices: [{ value: 'ANAK', next_question_code: '' }, { value: 'DEWASA', next_question_code: '' }, { value: 'LANSIA', next_question_code: '' }, { value: 'SEMUA', next_question_code: '' }] },
    { id: 249, code: 'DQF', answer_type: 'SINGLE_CHOICE', is_required: true, order: 16, show_condition: QL1_SHOW_COND_D, choices: [{ value: 'YA', next_question_code: '' }, { value: 'TIDAK', next_question_code: '' }] },
    // OQ detail
    { id: 250, code: 'OQA', answer_type: 'TEXT', is_required: true, order: 17, show_condition: QL1_SHOW_COND_O, choices: [] },
    { id: 251, code: 'OQB', answer_type: 'INTERVENTION_MATRIX', is_required: true, order: 18, show_condition: QL1_SHOW_COND_O, choices: [] },
    { id: 252, code: 'OQC', answer_type: 'SINGLE_CHOICE', is_required: true, order: 19, show_condition: QL1_SHOW_COND_O, choices: [{ value: 'YA', next_question_code: 'OQD' }, { value: 'TIDAK', next_question_code: 'OQE' }] },
    { id: 253, code: 'OQD', answer_type: 'BOOLEAN', is_required: true, order: 20, show_condition: QL1_SHOW_COND_O, choices: [] },
    { id: 254, code: 'OQE', answer_type: 'STAFF_TABLE', is_required: true, order: 21, show_condition: QL1_SHOW_COND_O, choices: [] },
    // AQ detail
    { id: 255, code: 'AQA', answer_type: 'SINGLE_CHOICE', is_required: true, order: 22, show_condition: QL1_SHOW_COND_A, choices: [] },
    { id: 256, code: 'AQB', answer_type: 'SINGLE_CHOICE', is_required: true, order: 23, show_condition: QL1_SHOW_COND_A, choices: [] },
    { id: 257, code: 'AQC', answer_type: 'SINGLE_CHOICE', is_required: true, order: 24, show_condition: QL1_SHOW_COND_A, choices: [] },
    { id: 258, code: 'AQD', answer_type: 'SINGLE_CHOICE', is_required: true, order: 25, show_condition: QL1_SHOW_COND_A, choices: [] },
    { id: 259, code: 'AQE', answer_type: 'SINGLE_CHOICE', is_required: true, order: 26, show_condition: QL1_SHOW_COND_A, choices: [] },
    { id: 260, code: 'AQF', answer_type: 'SINGLE_CHOICE', is_required: true, order: 27, show_condition: QL1_SHOW_COND_A, choices: [] },
    { id: 261, code: 'AQG', answer_type: 'SINGLE_CHOICE', is_required: true, order: 28, show_condition: QL1_SHOW_COND_A, choices: [{ value: 'YA', next_question_code: '' }, { value: 'TIDAK', next_question_code: '' }] },
    // IQ detail
    { id: 262, code: 'IQA', answer_type: 'TEXT', is_required: true, order: 29, show_condition: QL1_SHOW_COND_I, choices: [] },
    { id: 263, code: 'IQB', answer_type: 'MULTIPLE_CHOICE', is_required: true, order: 30, show_condition: QL1_SHOW_COND_I, choices: [{ value: 'IG', next_question_code: '' }, { value: 'TIKTOK', next_question_code: '' }, { value: 'Fb', next_question_code: '' }, { value: 'Web', next_question_code: '' }, { value: 'YOUTUBE', next_question_code: '' }, { value: 'WA', next_question_code: '' }] },
    { id: 264, code: 'IQC', answer_type: 'SINGLE_CHOICE', is_required: true, order: 31, show_condition: QL1_SHOW_COND_I, choices: [{ value: 'YA', next_question_code: 'IQF' }, { value: 'TIDAK', next_question_code: 'IQG' }] },
    { id: 265, code: 'IQD', answer_type: 'NUMBER', is_required: true, order: 32, show_condition: QL1_SHOW_COND_I, choices: [] },
    { id: 266, code: 'IQE', answer_type: 'SINGLE_CHOICE', is_required: true, order: 33, show_condition: QL1_SHOW_COND_I, choices: [] },
    { id: 267, code: 'IQF', answer_type: 'NUMBER', is_required: true, order: 34, show_condition: QL1_SHOW_COND_I, choices: [] },
    { id: 268, code: 'IQG', answer_type: 'TEXT', is_required: true, order: 35, show_condition: QL1_SHOW_COND_I, choices: [] },
    { id: 269, code: 'IQH', answer_type: 'TEXT', is_required: true, order: 36, show_condition: QL1_SHOW_COND_I, choices: [] },
    { id: 270, code: 'IQI', answer_type: 'STAFF_TABLE', is_required: true, order: 37, show_condition: QL1_SHOW_COND_I, choices: [] },
    { id: 271, code: 'IQJ', answer_type: 'SINGLE_CHOICE', is_required: true, order: 38, show_condition: QL1_SHOW_COND_I, choices: [{ value: 'LAKI', next_question_code: '' }, { value: 'PEREMPUAN', next_question_code: '' }] },
    { id: 272, code: 'IQK', answer_type: 'SINGLE_CHOICE', is_required: true, order: 39, show_condition: QL1_SHOW_COND_I, choices: [{ value: 'ANAK', next_question_code: '' }, { value: 'DEWASA', next_question_code: '' }, { value: 'LANSIA', next_question_code: '' }, { value: 'SEMUA', next_question_code: '' }] },
    { id: 273, code: 'IQL', answer_type: 'OPERATING_HOURS', is_required: true, order: 40, show_condition: QL1_SHOW_COND_I, choices: [] },
    { id: 274, code: 'IQM', answer_type: 'SINGLE_CHOICE', is_required: true, order: 41, show_condition: QL1_SHOW_COND_I, choices: [{ value: 'YA', next_question_code: '' }, { value: 'TIDAK', next_question_code: '' }] },
  ]
};

// NON-FASKES
const NON_FASKES: QuestionSection = {
  id: 4, code: 'NON-FASKES',
  show_condition: { question_code: 'Q4', operator: 'in', value: ['BALAI_REHABILITASI', 'PANTI_SOSIAL', 'LSM', 'LKS', 'PRAKTIK_PRIBADI', 'LAINNYA'] },
  questions: [{ id: 0, code: 'SRQ1', answer_type: 'TEXT', is_required: true, order: 1, choices: [] }]
};

const ALL_SECTIONS: QuestionSection[] = [DATA_DASAR, JENIS_LAYANAN, FASKSES, NON_FASKES, DETAIL];

// ── TEST ───────────────────────────────────────────────────────────────────

console.log('═'.repeat(80));
console.log('COMPREHENSIVE FLOW AUDIT — Survey 47 (QL1=[R], Q4=RSU)');
console.log('═'.repeat(80));

// Survey 47 answers
const answers: SurveyAnswers = {
  Q1: 'Test', Q2: 'YA', Q3: 'KESEHATAN', Q4: 'RSU',
  Q5: 'Jawa Tengah', Q6: 'Kebumen', Q7: '', Q8: 'Test',
  Q9: 'Test', Q10: '081322635571', Q11: 'admin@gmail.com',
  Q13: 'YAYASAN', Q14: 'TIDAK', Q15: 'TIDAK_DIKETAHUI', Q16: 'KECAMATAN',
  QL1: ['R'], QL2: [],
  // R path
  RQ1: 'NON-AKUT', RQ5: 'NON_DOKTER_24', RQ8: 'BATASAN_TDK_DITETAPKAN', RQ13: 'R12',
  // Detail (stored as context-keyed — but we simulate the flow engine)
  // In real app: 'Dukungan Staf Selama Jam Kerja|RQA' etc.
};

// Step 1: Which sections are active?
console.log('\n── Section Visibility ──');
ALL_SECTIONS.forEach(s => {
  const active = getActiveSections([s], answers).length > 0;
  const reason = s.show_condition ? JSON.stringify(s.show_condition) : 'always';
  console.log(`${active ? '✅' : '❌'} ${s.code}: ${reason}`);
});

// Step 2: Trace FASKSES flow
console.log('\n── FASKSES Flow ──');
const fasksesActive = getActiveQuestionsForSection(FASKSES, answers);
console.log(`Active questions in FASKSES: [${fasksesActive.map(q => q.code).join(', ')}]`);

const fasksesFlow = traceFlow(FASKSES, answers, ALL_SECTIONS);
console.log(`\nFASKSES flow: [${fasksesFlow.join(' → ')}]`);

// Step 3: What comes after RQJ?
const lastIdx = fasksesFlow.indexOf('RQJ');
if (lastIdx >= 0) {
  const after = fasksesFlow.slice(lastIdx + 1);
  console.log(`\nQuestions after RQJ: [${after.join(', ')} || 'NONE']`);
  if (after.length === 0) {
    console.log('✅ RQJ IS the last question — flow terminates correctly');
  } else {
    console.log(`❌ RQJ is NOT last — ${after.length} questions follow`);
    after.forEach(q => console.log(`   ${q}`));
  }
} else {
  console.log('\n❌ RQJ NOT FOUND in flow!');
  console.log('Flow:', fasksesFlow);
}
