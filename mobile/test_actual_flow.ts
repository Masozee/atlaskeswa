/**
 * Real database flow test based on ACTUAL db structure
 * Run: npx tsx test_actual_flow.ts
 */

function evaluateCondition(answerValue: any, expectedValue: any): boolean {
  if (answerValue === null || answerValue === undefined) return false;
  if (Array.isArray(expectedValue)) {
    if (Array.isArray(answerValue)) return answerValue.some((v) => expectedValue.includes(v));
    return expectedValue.includes(answerValue);
  }
  return answerValue === expectedValue;
}

function getFlow(section: any, allResponses: any, allSections: any[], visitedSectionIds?: Set<number>, forcedStartCode?: string): string[] {
  const questions = section.questions ?? [];
  const codeMap = new Map(questions.map((q: any) => [q.code, q]));
  const visited = new Set<string>();
  if (visitedSectionIds && visitedSectionIds.has(section.id)) {
    // Already visited this section — find entry from parent
    console.log(`  [${section.code}] already visited, finding re-entry point...`);
  }

  // Entry point detection
  let entryCodes: string[] = [];
  if (forcedStartCode) {
    entryCodes = [forcedStartCode];
  } else {
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

  const result: string[] = [];

  for (const entryCode of entryCodes) {
    let current = codeMap.get(entryCode);
    if (!current) { console.log(`  ENTRY ${entryCode} NOT FOUND in ${section.code}`); continue; }

    while (current && !visited.has(current.code)) {
      visited.add(current.code);
      result.push(current.code);

      const answer = allResponses[current.code];
      const isAnswered = answer !== null && answer !== undefined && answer !== '';
      if (!isAnswered && current.is_required) break;

      let nextCode: string | undefined;
      let triggeringChoice: any;

      if (current.choices?.length) {
        triggeringChoice = current.choices.find((c: any) => {
          if (Array.isArray(answer)) return answer.includes(c.value);
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
        const idx = questions.indexOf(current);
        // Terminal: last question AND has choices
        if (current.choices && current.choices.length > 0 && idx >= questions.length - 1) {
          console.log(`  [${section.code}] ${current.code} → END (terminal, last in section)`);
          break;
        }
        if (idx < questions.length - 1) {
          current = questions[idx + 1];
          continue;
        }
        console.log(`  [${section.code}] ${current.code} → END OF SECTION`);
        break;
      }

      // Within same section
      const nextInSection = codeMap.get(nextCode);
      if (nextInSection) {
        current = nextInSection;
        continue;
      }

      // Cross-section jump
      if (allSections) {
        const otherSection = allSections.find(
          (s) => s.id !== section.id && (s.questions || []).some((q) => q.code === nextCode)
        );
        if (otherSection) {
          const newVisited = new Set(visitedSectionIds || []);
          newVisited.add(section.id);
          const triggerIdx = questions.indexOf(current);

          console.log(`  [${section.code}] ${current.code} → CROSS-SECTION → ${otherSection.code} (nextCode=${nextCode})`);
          const crossItems = getFlow(otherSection, allResponses, allSections, newVisited, nextCode);
          result.push(...crossItems);

          // Continue to next unvisited question in current section
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
      }
      break; // target doesn't exist
    }
  }
  return result;
}

// ── REAL DATA from database ────────────────────────────────────────────────
// DATA_DASAR (section 1): Q1-Q16
const DATA_DASAR_QUESTIONS = ['Q1','Q2','Q3','Q4','Q5','Q6','Q7','Q8','Q9','Q10','Q11','Q12','Q13','Q14','Q15','Q16'];

// JENIS_LAYANAN (section 2): QL1, QL2
const JENIS_LAYANAN = {
  id: 2, code: 'JENIS_LAYANAN', questions: [
    { code: 'QL1', is_required: true, choices: [
      { value: 'R', next_question_code: 'RQ1' },
      { value: 'D', next_question_code: 'DQ1' },
      { value: 'O', next_question_code: 'OQ1' },
      { value: 'A', next_question_code: 'AQ1' },
      { value: 'I', next_question_code: 'IQ1' },
    ]},
    { code: 'QL2', is_required: false, choices: [
      { value: 'SR', next_question_code: 'SRQ1' },
      { value: 'SD', next_question_code: 'SDQ1' },
      { value: 'SO', next_question_code: 'SOQ1' },
      { value: 'SA', next_question_code: 'SAQ1' },
      { value: 'SI', next_question_code: 'SIQ1' },
    ]},
  ]
};

// FASKSES (section 3)
const FASKSES_QUESTIONS = [
  { code: 'RQ1', is_required: true, choices: [{ value: 'AKUT', next_question_code: 'RQ2' }, { value: 'NON-AKUT', next_question_code: 'RQ5' }] },
  { code: 'RQ2', is_required: true, choices: [{ value: 'Terdapat Dokter Jaga 24 Jam', next_question_code: 'RQ3' }, { value: 'Tidak Terdapat Dokter Jaga 24 Jam', next_question_code: 'RQ4' }] },
  { code: 'RQ3', is_required: true, choices: [{ value: 'R1', next_question_code: 'RQA' }, { value: 'R2', next_question_code: 'RQA' }] },
  { code: 'RQ4', is_required: true, choices: [{ value: 'R3.1.1', next_question_code: 'RQA' }, { value: 'R3.1.2', next_question_code: 'RQA' }] },
  { code: 'RQ5', is_required: true, choices: [{ value: 'DOKTER_24', next_question_code: 'RQ6' }, { value: 'NON_DOKTER_24', next_question_code: 'RQ8' }, { value: 'LAINNYA', next_question_code: 'RQA' }] },
  { code: 'RQ6', is_required: true, choices: [{ value: 'R4', next_question_code: 'RQA' }, { value: 'R6', next_question_code: 'RQA' }] },
  { code: 'RQ7', is_required: true, choices: [{ value: 'R5', next_question_code: 'RQA' }, { value: 'R7', next_question_code: 'RQA' }] },
  { code: 'RQ8', is_required: true, choices: [{ value: 'BATASAN_DITETAPKAN', next_question_code: 'RQ9' }, { value: 'BATASAN_TDK_DITETAPKAN', next_question_code: 'RQ13' }] },
  { code: 'RQ9', is_required: true, choices: [{ value: 'R8', next_question_code: 'RQ10' }, { value: 'R9', next_question_code: 'RQ11' }, { value: 'RQ10', next_question_code: 'RQ12' }] },
  { code: 'RQ10', is_required: true, choices: [{ value: 'R8.1', next_question_code: 'RQA' }, { value: 'R8.2', next_question_code: 'RQA' }] },
  { code: 'RQ11', is_required: true, choices: [{ value: 'R9.1', next_question_code: 'RQA' }, { value: 'R9.2', next_question_code: 'RQA' }] },
  { code: 'RQ12', is_required: true, choices: [{ value: 'R10.1', next_question_code: 'RQA' }, { value: 'R10.2', next_question_code: 'RQA' }] },
  { code: 'RQ13', is_required: true, choices: [{ value: 'R11', next_question_code: 'RQA' }, { value: 'R12', next_question_code: 'RQA' }, { value: 'R13', next_question_code: 'RQA' }] },
  // DQ, OQ, AQ, IQ would follow but we test R only
];

const FASKSES = { id: 3, code: 'FASKSES', questions: FASKSES_QUESTIONS };

// DETAIL (section 5)
const DETAIL_R_QUESTIONS = [
  { code: 'RQA' }, // TEXT, no choices
  { code: 'RQB' }, // TEXT, no choices
  { code: 'RQC' }, // TEXT, no choices
  { code: 'RQD', choices: [{ value: 'JKN', next_question_code: 'RQF' }, { value: 'ASURANSI_SWASTA', next_question_code: 'RQF' }, { value: 'MANDIRI', next_question_code: 'RQE' }] },
  { code: 'RQE' }, // NUMBER, no choices
  { code: 'RQF' }, // STAFF_TABLE, no choices
  { code: 'RQG', choices: [{ value: 'YA', next_question_code: 'RQH' }, { value: 'TIDAK', next_question_code: 'RQI' }] },
  { code: 'RQH' }, // TEXT, no choices
  { code: 'RQI', choices: [{ value: 'Anak', next_question_code: '' }, { value: 'DEWASA', next_question_code: '' }, { value: 'LANSIA', next_question_code: '' }, { value: 'SEMUA', next_question_code: '' }] },
  { code: 'RQJ', choices: [{ value: 'YA', next_question_code: '' }, { value: 'TIDAK', next_question_code: '' }] },
];

const DETAIL = { id: 5, code: 'DETAIL', show_condition: { question_code: '_inline_only_' }, questions: DETAIL_R_QUESTIONS };

const allSections = [
  { id: 1, code: 'DATA_DASAR', questions: DATA_DASAR_QUESTIONS.map(c => ({ code: c })) },
  JENIS_LAYANAN,
  FASKSES,
  DETAIL,
];

// Test: QL1=['R'], path RQ1→RQ5→RQ8→RQ13→RQA→...→RQJ
console.log('=== QL1=[R] Flow Test (Real Database Structure) ===\n');

const answers: any = {};
DATA_DASAR_QUESTIONS.forEach(q => answers[q] = 'x');
answers.QL1 = ['R'];
answers.QL2 = [];
// R path
answers.RQ1 = 'NON-AKUT';
answers.RQ5 = 'NON_DOKTER_24';
answers.RQ8 = 'BATASAN_TDK_DITETAPKAN';
answers.RQ13 = 'R11';
// Detail chain
answers.RQA = 'Pelayanan rawat inap';
answers.RQB = 'Program 1';
answers.RQC = [];
answers.RQD = 'JKN';
answers.RQE = 5;
answers.RQF = [];
answers.RQG = 'YA';
answers.RQH = 'Layanan rawat inap';
answers.RQI = ['SEMUA'];
answers.RQJ = 'TIDAK';

console.log('Answers set:', Object.entries(answers).filter(([k]) => !k.startsWith('Q') || k === 'QL1').map(([k,v]) => `${k}=${JSON.stringify(v)}`).join(', '));
console.log('');

const flow = getFlow(FASKSES, answers, allSections);
console.log('\nFlow result:', flow.join(' → '));
console.log('Total questions:', flow.length);
console.log('');
if (flow[flow.length - 1] === 'RQJ') {
  console.log('✅ Flow terminates at RQJ correctly');
} else {
  console.log('❌ Flow does NOT terminate at RQJ — last item is:', flow[flow.length - 1]);
}
