/**
 * Multi-section flow test — simulates the actual app structure:
 * DATA_DASAR (Q1-Q16 + QL1) → FASKSES (single block based on QL1 selection)
 * Run: npx tsx test_each_ql1.ts
 */

function evaluateCondition(answerValue: any, expectedValue: any): boolean {
  if (answerValue === null || answerValue === undefined) return false;
  if (Array.isArray(expectedValue)) {
    if (Array.isArray(answerValue)) return answerValue.some((v) => expectedValue.includes(v));
    return expectedValue.includes(answerValue);
  }
  return answerValue === expectedValue;
}

function getFlow(section: any, allResponses: any, allSections: any[]): string[] {
  const questions = section.questions ?? [];
  const codeMap = new Map(questions.map((q: any) => [q.code, q]));
  const visited = new Set<string>();

  // Entry point detection — from OTHER sections (cross-section jump via next_question_code)
  let entryCodes: string[] = [];
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
  if (entryCodes.length === 0) entryCodes = [questions[0]?.code].filter(Boolean) as string[];

  const result: string[] = [];

  for (const entryCode of entryCodes) {
    let current = codeMap.get(entryCode);
    if (!current) { console.log(`  ENTRY ${entryCode} NOT FOUND`); continue; }

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
        // Only break as terminal if this is LAST question AND has choices
        // (e.g. RQJ, DQF at end of their block — NOT Q2 which continues to Q3)
        if (current.choices && current.choices.length > 0 && idx >= questions.length - 1) {
          break;
        }
        if (idx < questions.length - 1) {
          current = questions[idx + 1];
          continue;
        }
        break;
      }

      const nextInSection = codeMap.get(nextCode);
      if (nextInSection) {
        current = nextInSection;
        continue;
      }
      break; // cross-section or missing
    }
  }
  return result;
}

// ── DATA ───────────────────────────────────────────────────────────────────
const DATA_DASAR_QS = ['Q1','Q2','Q3','Q4','Q5','Q6','Q7','Q8','Q9','Q10','Q11','Q12','Q13','Q14','Q15','Q16'];

// Only R block (simulate FASKSES with just the R section — like app does per-section)
const FASKSES_RQ = [
  { code: 'RQ1', choices: [{ value: 'AKUT', next_question_code: 'RQ2' }, { value: 'NON-AKUT', next_question_code: 'RQ5' }] },
  { code: 'RQ2', choices: [{ value: 'Terdapat Dokter Jaga 24 Jam', next_question_code: 'RQ3' }, { value: 'Tidak Terdapat Dokter Jaga 24 Jam', next_question_code: 'RQ4' }] },
  { code: 'RQ3', choices: [{ value: 'R1', next_question_code: 'RQA' }, { value: 'R2', next_question_code: 'RQA' }] },
  { code: 'RQ4', choices: [{ value: 'R3.1.1', next_question_code: 'RQA' }, { value: 'R3.1.2', next_question_code: 'RQA' }] },
  { code: 'RQ5', choices: [{ value: 'DOKTER_24', next_question_code: 'RQ6' }, { value: 'NON_DOKTER_24', next_question_code: 'RQ8' }, { value: 'LAINNYA', next_question_code: 'RQA' }] },
  { code: 'RQ6', choices: [{ value: 'R4', next_question_code: 'RQA' }, { value: 'R6', next_question_code: 'RQA' }] },
  { code: 'RQ7', choices: [{ value: 'R5', next_question_code: 'RQA' }, { value: 'R7', next_question_code: 'RQA' }] },
  { code: 'RQ8', choices: [{ value: 'BATASAN_DITETAPKAN', next_question_code: 'RQ9' }, { value: 'BATASAN_TDK_DITETAPKAN', next_question_code: 'RQ13' }] },
  { code: 'RQ9', choices: [{ value: 'R8', next_question_code: 'RQ10' }, { value: 'R9', next_question_code: 'RQ11' }, { value: 'RQ10', next_question_code: 'RQ12' }] },
  { code: 'RQ10', choices: [{ value: 'R8.1', next_question_code: 'RQA' }, { value: 'R8.2', next_question_code: 'RQA' }] },
  { code: 'RQ11', choices: [{ value: 'R9.1', next_question_code: 'RQA' }, { value: 'R9.2', next_question_code: 'RQA' }] },
  { code: 'RQ12', choices: [{ value: 'R10.1', next_question_code: 'RQA' }, { value: 'R10.2', next_question_code: 'RQA' }] },
  { code: 'RQ13', choices: [{ value: 'R11', next_question_code: 'RQA' }, { value: 'R12', next_question_code: 'RQA' }, { value: 'R13', next_question_code: 'RQA' }] },
  { code: 'RQA' }, { code: 'RQB' }, { code: 'RQC' }, { code: 'RQD' }, { code: 'RQE' },
  { code: 'RQF' }, { code: 'RQG' }, { code: 'RQH' }, { code: 'RQI' },
  { code: 'RQJ', choices: [{ value: 'YA', next_question_code: '' }, { value: 'TIDAK', next_question_code: '' }] },
];

const FASKSES_DQ = [
  { code: 'DQ1', choices: [{ value: 'AKUT', next_question_code: 'DQ2' }, { value: 'NON-AKUT', next_question_code: 'DQ5' }] },
  { code: 'DQ2', choices: [{ value: 'DO', next_question_code: 'DQ3' }, { value: 'D1', next_question_code: 'DQ4' }] },
  { code: 'DQ3', choices: [{ value: 'D0.1', next_question_code: 'DQA' }, { value: 'D0.2', next_question_code: 'DQA' }] },
  { code: 'DQ4', choices: [{ value: 'D1.1', next_question_code: 'DQA' }, { value: 'D1.2', next_question_code: 'DQA' }] },
  { code: 'DQ5', choices: [{ value: 'PEKERJAAN', next_question_code: 'DQ6' }, { value: 'TERSTRUKTUR_NON_PEKERJAAN', next_question_code: 'DQ12' }, { value: 'PERSIAPAN_KERJA', next_question_code: 'DQ9' }, { value: 'TIDAK_TERSTRUKTUR', next_question_code: 'DQ15' }] },
  { code: 'DQ6', choices: [{ value: 'D2', next_question_code: 'DQ7' }, { value: 'D6', next_question_code: 'DQ8' }] },
  { code: 'DQ7', choices: [{ value: 'D2.1', next_question_code: 'DQA' }, { value: 'D2.2', next_question_code: 'DQA' }] },
  { code: 'DQ8', choices: [{ value: 'D6.1', next_question_code: 'DQA' }, { value: 'D6.2', next_question_code: 'DQA' }] },
  { code: 'DQ9', choices: [{ value: 'D3', next_question_code: 'DQ10' }, { value: 'D7', next_question_code: 'DQ11' }] },
  { code: 'DQ10', choices: [{ value: 'D3.1', next_question_code: 'DQA' }, { value: 'D3.2', next_question_code: 'DQA' }] },
  { code: 'DQ11', choices: [{ value: 'D7.1', next_question_code: 'DQA' }, { value: 'D7.2', next_question_code: 'DQA' }] },
  { code: 'DQ12', choices: [{ value: 'D4', next_question_code: 'DQ13' }, { value: 'D8', next_question_code: 'DQ14' }] },
  { code: 'DQ13', choices: [{ value: 'D4.1', next_question_code: 'DQA' }, { value: 'D4.2', next_question_code: 'DQA' }, { value: 'D4.3', next_question_code: 'DQA' }, { value: 'D4.4', next_question_code: 'DQA' }] },
  { code: 'DQ14', choices: [{ value: 'D8.1', next_question_code: 'DQA' }, { value: 'D8.2', next_question_code: 'DQA' }, { value: 'D8.3', next_question_code: 'DQA' }, { value: 'D8.4', next_question_code: 'DQA' }] },
  { code: 'DQ15', choices: [{ value: 'D5', next_question_code: 'DQA' }, { value: 'D9', next_question_code: 'DQA' }] },
  { code: 'DQA' }, { code: 'DQB' }, { code: 'DQC' }, { code: 'DQD' },
  { code: 'DQE', choices: [{ value: 'ANAK', next_question_code: '' }, { value: 'DEWASA', next_question_code: '' }, { value: 'LANSIA', next_question_code: '' }, { value: 'SEMUA', next_question_code: '' }] },
  { code: 'DQF', choices: [{ value: 'YA', next_question_code: '' }, { value: 'TIDAK', next_question_code: '' }] },
];

const FASKSES_OQ = [
  { code: 'OQ1', choices: [{ value: 'O1', next_question_code: 'OQ2' }] },
  { code: 'OQ2', choices: [{ value: 'OA1', next_question_code: 'OQA' }, { value: 'OA2', next_question_code: 'OQA' }] },
  { code: 'OQA' }, { code: 'OQB' }, { code: 'OQC' }, { code: 'OQD' },
  { code: 'OQE', choices: [{ value: 'YA', next_question_code: '' }, { value: 'TIDAK', next_question_code: '' }] },
];

const FASKSES_AQ = [
  { code: 'AQ1', choices: [{ value: 'A1', next_question_code: 'AQ2' }] },
  { code: 'AQ2', choices: [{ value: 'AA1', next_question_code: 'AQA' }, { value: 'AA2', next_question_code: 'AQA' }] },
  { code: 'AQA' }, { code: 'AQB' }, { code: 'AQC' }, { code: 'AQD' }, { code: 'AQE' }, { code: 'AQF' },
  { code: 'AQG', choices: [{ value: 'YA', next_question_code: '' }, { value: 'TIDAK', next_question_code: '' }] },
];

const FASKSES_IQ = [
  { code: 'IQ1', choices: [{ value: 'I1', next_question_code: 'IQ2' }, { value: 'I2', next_question_code: 'IQ2' }] },
  { code: 'IQ2', choices: [{ value: 'IA1', next_question_code: 'IQA' }, { value: 'IA2', next_question_code: 'IQA' }, { value: 'IA3', next_question_code: 'IQA' }] },
  { code: 'IQ3', choices: [{ value: 'IB1', next_question_code: 'IQA' }, { value: 'IB2', next_question_code: 'IQA' }] },
  { code: 'IQ4', choices: [{ value: 'IC1', next_question_code: 'IQA' }, { value: 'IC2', next_question_code: 'IQA' }] },
  { code: 'IQA' }, { code: 'IQB' }, { code: 'IQC' }, { code: 'IQD' }, { code: 'IQE' }, { code: 'IQF' },
  { code: 'IQG' }, { code: 'IQH' }, { code: 'IQI' }, { code: 'IQJ' }, { code: 'IQK' }, { code: 'IQL' },
  { code: 'IQM', choices: [{ value: 'YA', next_question_code: '' }, { value: 'TIDAK', next_question_code: '' }] },
];

// Each block is a separate "section" in FASKSES (simulating real app per-section calls)
const FASKSES_R = { id: 3, code: 'FASKSES_R', questions: FASKSES_RQ };
const FASKSES_D = { id: 4, code: 'FASKSES_D', questions: FASKSES_DQ };
const FASKSES_O = { id: 5, code: 'FASKSES_O', questions: FASKSES_OQ };
const FASKSES_A = { id: 6, code: 'FASKSES_A', questions: FASKSES_AQ };
const FASKSES_I = { id: 7, code: 'FASKSES_I', questions: FASKSES_IQ };

const JENIS_LAYANAN = {
  id: 2, code: 'JENIS_LAYANAN', questions: [
    { code: 'QL1', choices: [
      { value: 'R', next_question_code: 'RQ1' },
      { value: 'D', next_question_code: 'DQ1' },
      { value: 'O', next_question_code: 'OQ1' },
      { value: 'A', next_question_code: 'AQ1' },
      { value: 'I', next_question_code: 'IQ1' },
    ]}
  ]
};

// DATA_DASAR section: Q1→Q2→Q3...→Q16→QL1
const DATA_DASAR = {
  id: 1, code: 'DATA_DASAR', questions: [
    ...DATA_DASAR_QS.map(code => ({ code, is_required: true })),
    JENIS_LAYANAN.questions[0]
  ]
};

// Base answers — DATA_DASAR Qs + QL1
const BASE: any = {};
DATA_DASAR_QS.forEach(q => BASE[q] = 'x');
BASE.QL1 = [] as string[];

// Sections list for cross-section entry point detection
const allSections = [DATA_DASAR, JENIS_LAYANAN, FASKSES_R, FASKSES_D, FASKSES_O, FASKSES_A, FASKSES_I];

function runTest(label: string, ql1Value: string, fasksesSection: any, expected: string, answers: any) {
  answers.QL1 = [ql1Value];
  const flow = getFlow(fasksesSection, answers, allSections);
  const result = flow.join(' → ');
  const pass = result === expected;
  console.log(`\n${'─'.repeat(80)}`);
  console.log(`${pass ? '✅' : '❌'} ${label}`);
  console.log(`${'─'.repeat(80)}`);
  console.log(`Got:      ${result}`);
  if (!pass) console.log(`Expected: ${expected}`);
}

// ── TEST R ────────────────────────────────────────────────────────────────
{
  const a = { ...BASE, RQ1: 'NON-AKUT', RQ5: 'NON_DOKTER_24', RQ8: 'BATASAN_TDK_DITETAPKAN', RQ13: 'R11',
    RQA: 'x', RQB: 'x', RQC: [], RQD: 'JKN', RQE: 5, RQF: [], RQG: 'YA', RQH: 'x', RQI: ['SEMUA'], RQJ: 'TIDAK' };
  runTest('QL1=[R] — Rawat Inap path', 'R', FASKSES_R,
    'RQ1 → RQ5 → RQ8 → RQ13 → RQA → RQB → RQC → RQD → RQE → RQF → RQG → RQH → RQI → RQJ',
    a);
}

// ── TEST D ────────────────────────────────────────────────────────────────
{
  const a = { ...BASE, DQ1: 'NON-AKUT', DQ5: 'PEKERJAAN', DQ6: 'D2', DQ7: 'D2.1',
    DQA: 'x', DQB: [], DQC: [], DQD: 'x', DQE: 'YA', DQF: 'TIDAK' };
  runTest('QL1=[D] — Day Care path', 'D', FASKSES_D,
    'DQ1 → DQ5 → DQ6 → DQ7 → DQA → DQB → DQC → DQD → DQE → DQF',
    a);
}

// ── TEST O ────────────────────────────────────────────────────────────────
{
  const a = { ...BASE, OQ1: 'O1', OQ2: 'OA1', OQA: 'x', OQB: 'x', OQC: 'x', OQD: 'x', OQE: 'TIDAK' };
  runTest('QL1=[O] — Rawat Jalan path', 'O', FASKSES_O,
    'OQ1 → OQ2 → OQA → OQB → OQC → OQD → OQE',
    a);
}

// ── TEST A ────────────────────────────────────────────────────────────────
{
  const a = { ...BASE, AQ1: 'A1', AQ2: 'AA1', AQA: 'x', AQB: 'x', AQC: 'x', AQD: 'x', AQE: 'x', AQF: 'x', AQG: 'TIDAK' };
  runTest('QL1=[A] — Aksesibilitas path', 'A', FASKSES_A,
    'AQ1 → AQ2 → AQA → AQB → AQC → AQD → AQE → AQF → AQG',
    a);
}

// ── TEST I ────────────────────────────────────────────────────────────────
{
  const a = { ...BASE, IQ1: 'I1', IQ2: 'IA1', IQ3: 'IB1', IQ4: 'IC1',
    IQA: 'x', IQB: 'x', IQC: 'x', IQD: 'x', IQE: 'x', IQF: 'x',
    IQG: 'x', IQH: 'x', IQI: 'x', IQJ: 'x', IQK: 'x', IQL: 'x', IQM: 'TIDAK' };
  runTest('QL1=[I] — Informasi path', 'I', FASKSES_I,
    'IQ1 → IQ2 → IQA → IQB → IQC → IQD → IQE → IQF → IQG → IQH → IQI → IQJ → IQK → IQL → IQM',
    a);
}

console.log('\n');
