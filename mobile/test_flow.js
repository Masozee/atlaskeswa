/**
 * Simulate getFlowItems() traversal — reads from Django API (or mobile state).
 * Run: cd mobile && node test_flow.js
 */
const API = 'http://127.0.0.1:8000/api';

async function fetchJSON(path) {
  const res = await fetch(`${API}${path}`);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${path}`);
  return res.json();
}

async function main() {
  // Load full survey with sections + questions + choices
  const sectionsRes = await fetchJSON('/survey/survey-sections/?survey_id=1&_scope=with_questions');
  const sections = sectionsRes.results || sectionsRes;
  const questionsMap = new Map();
  const allResponses = {};
  const MANDIRI_VALUE = 'PEMBAYARAN MANDIRI OLEH KLIEN/PASIEN/KELUARGA';

  sections.forEach(sec => {
    (sec.questions || []).forEach(q => {
      questionsMap.set(q.code, q);
      // Add choices
      if (q.choices) {
        q.choices.forEach(c => { /* already attached */ });
      }
    });
  });

  // ── Answer set (Q4 = 'Rumah Sakit Umum', RQH = [MANDIRI]) ──────────────────
  Object.assign(allResponses, {
    Q1: 'Ya, saya siap',
    Q2: 'RSUP (Rumah Sakit Universitas Pendidikan)',
    Q3: 'Fasilitas kesehatan tingkat pertama (FKTP)',
    Q4: 'Rumah Sakit Umum',       // → QL1='R', RSU/RSJ branch
    Q5: 'Ya',
    Q6: 'Tidak ada',
    QL1: 'R',
    RQ1: 'Ya',
    RQ2: 'Ya',
    RQ3: 'Ya',
    RQA: 'Ya',
    RQB: 'Ya',
    RQC: 'Ya',
    RQD: 'Ya',
    RQE: 'Ya',
    RQF1: 'Ya',
    RQF: 'Ya',
    RQG: 'Ya',
    RQH: [MANDIRI_VALUE],          // ← MANDIRI selected → RQI should appear
    RQK: 'Ya',
    RQL: 'Ya',
    RQ4: 'Ya',
    RQ5: 'Tidak',
    RQ8: 'Ya',
    RQ9: 'Tidak',
    RQ10: 'Ya',
    RQ11: 'Ya',
    RQ12: 'Ya',
    RQ13: 'Tidak',
  });

  // ── Build codeMap ────────────────────────────────────────────────────────────
  const codeMap = new Map();
  sections.forEach(sec => (sec.questions || []).forEach(q => codeMap.set(q.code, q)));

  function evaluateCondition(answerValue, expectedValue) {
    if (answerValue === null || answerValue === undefined) return false;
    if (Array.isArray(expectedValue)) {
      return Array.isArray(answerValue)
        ? answerValue.some(v => expectedValue.includes(v))
        : expectedValue.includes(answerValue);
    }
    return answerValue === expectedValue;
  }

  function evaluateShowCondition(sc, allResp) {
    if (!sc) return true;
    const op = sc.operator;
    if (op === 'and' || op === 'or') {
      const sub = (sc.conditions || []).map(c => evaluateSingleCondition(c, allResp));
      return op === 'and' ? sub.every(Boolean) : sub.some(Boolean);
    }
    return evaluateSingleCondition(sc, allResp);
  }

  function evaluateSingleCondition(cond, allResp) {
    const qc = cond.question_code;
    const op = cond.operator || 'equals';
    const expected = cond.value;
    const answer = allResp[qc];
    if (answer === null || answer === undefined) return false;
    const result = (() => {
      switch (op) {
        case 'equals': return evaluateCondition(answer, expected);
        case 'not_equals': return !evaluateCondition(answer, expected);
        case 'in': return Array.isArray(expected) && expected.includes(answer);
        case 'not_in': return Array.isArray(expected) && !expected.includes(answer);
        case 'contains':
          if (Array.isArray(answer)) return answer.includes(expected);
          if (typeof answer === 'string') return answer.includes(String(expected));
          return false;
        default: return evaluateCondition(answer, expected);
      }
    })();
    return result;
  }

  // ── getFlowItems core logic ─────────────────────────────────────────────────
  function getFlowItemsForSection(section, allResp, rawResp) {
    const detailGroupPrefix = undefined;

    const visibleQuestions = (section.questions || [])
      .filter(q => {
        if (detailGroupPrefix && !q.code.startsWith(detailGroupPrefix)) return false;
        if (q.show_condition) return evaluateShowCondition(q.show_condition, allResp);
        return true;
      })
      .sort((a, b) => a.order - b.order);

    if (visibleQuestions.length === 0) return [];

    const localCodeMap = new Map();
    visibleQuestions.forEach(q => localCodeMap.set(q.code, q));

    const result = [];
    const visited = new Set();

    // Find entry point via MULTIPLE_CHOICE choices pointing to this section
    let entryCodes = [];
    if (section.code === 'DETAIL') {
      // Entry from QL1 / QL2 via RQ*/SRQ* choice values
      for (const sec of sections) {
        for (const q of sec.questions || []) {
          const ans = allResp[q.code];
          if (ans == null) continue;
          const vals = Array.isArray(ans) ? ans : [String(ans)];
          for (const c of q.choices || []) {
            if (vals.includes(c.value) && c.next_question_code) {
              const target = codeMap.get(c.next_question_code);
              if (target && target.section?.code === 'DETAIL') {
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

    // Deduplicate
    entryCodes = [...new Set(entryCodes)];

    for (const entryCode of entryCodes) {
      let current = localCodeMap.get(entryCode);
      if (!current) continue;

      while (current && !visited.has(current.code)) {
        visited.add(current.code);
        result.push(current.code);

        const answer = allResp[current.code];
        let nextCode = undefined;

        // Special RQH case
        if (current.code === 'RQH' && Array.isArray(answer)) {
          nextCode = answer.includes(MANDIRI_VALUE) ? 'RQI' : 'RQJ';
        } else if (current.code === 'SRQH' && Array.isArray(answer)) {
          nextCode = answer.includes(MANDIRI_VALUE) ? 'SRQI' : 'SRQJ';
        } else {
          // Find matching choice
          const triggeringChoice = (current.choices || []).find(c => {
            if (current.answer_type === 'MULTIPLE_CHOICE' && Array.isArray(answer)) {
              return answer.includes(c.value);
            }
            return evaluateCondition(answer, c.value);
          });
          if (triggeringChoice?.next_question_code) {
            nextCode = triggeringChoice.next_question_code;
          }
        }

        if (!nextCode && current.skip_logic?.length) {
          nextCode = current.skip_logic[0].goto;
        }

        if (nextCode === '') nextCode = undefined;

        // Sequential next
        if (!nextCode) {
          const idx = visibleQuestions.indexOf(current);
          if (idx < visibleQuestions.length - 1) {
            current = visibleQuestions[idx + 1];
            continue;
          }
          break;
        }

        // Check if next is in same section
        const nextInSection = localCodeMap.get(nextCode);
        if (nextInSection) {
          current = nextInSection;
          continue;
        }

        // Cross-section — check if nextCode is in another section
        const otherSec = sections.find(s =>
          s.id !== section.id && (s.questions || []).some(q => q.code === nextCode)
        );
        if (otherSec) {
          console.log(`  → cross-section jump: ${current.code} → ${nextCode} (to section ${otherSec.code})`);
          break;
        }

        break;
      }
    }

    return result;
  }

  // ── Run traversal: Q1 → Q2 → ... ───────────────────────────────────────────
  console.log('=== Flow traversal (MANDIRI selected in RQH) ===\n');

  // Start from first non-DETAIL section
  const firstSection = sections.find(s => s.code !== 'DETAIL');
  const allCodes = [];

  for (const section of sections) {
    if (section.code === 'DETAIL') continue;
    const codes = getFlowItemsForSection(section, allResponses, allResponses);
    if (codes.length > 0) {
      allCodes.push(...codes);
    }
  }

  // Then DETAIL
  const detailSection = sections.find(s => s.code === 'DETAIL');
  if (detailSection) {
    const detailCodes = getFlowItemsForSection(detailSection, allResponses, allResponses);
    if (detailCodes.length > 0) {
      allCodes.push('--- DETAIL ---', ...detailCodes);
    }
  }

  console.log('\nRoute:', allCodes.join(' → '));
  console.log('\nVerifying RQI appears (MANDIRI selected):',
    allCodes.includes('RQI') ? '✓ RQI appears' : '✗ RQI MISSING');
  console.log('Verifying SRQI does NOT appear (SRQH not answered):',
    allCodes.includes('SRQI') ? '✗ SRQI should not appear' : '✓ SRQI correctly absent');
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
