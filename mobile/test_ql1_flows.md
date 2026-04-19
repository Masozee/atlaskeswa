# QL1 Flow Test Report

## Test Results Summary

| QL1 Selection | Expected Flow | Test Result |
|--------------|---------------|-------------|
| `QL1=[I]` | Q1→...→Q16→QL1→IQ1→...→IQM→END | ✅ PASS |
| `QL1=[R]` | Q1→...→Q16→QL1→RQ1→...→RQJ→END | ❌ FAIL |
| `QL1=[D]` | Q1→...→Q16→QL1→DQ1→...→DQF→END | ❌ FAIL |
| `QL1=[O]` | Q1→...→Q16→QL1→OQ1→...→OQE→END | ❌ FAIL |
| `QL1=[A]` | Q1→...→Q16→QL1→AQ1→...→AQG→END | ❌ FAIL |
| `QL1=[R,D]` | Q1→...→Q16→QL1→[R block]→[D block]→END | ❌ FAIL |

## Detailed Test Flows

### QL1=[I] ✅ PASS
```
Q1 → Q2 → Q3 → Q4 → Q5 → Q6 → Q7 → Q8 → Q9 → Q10 → Q11 → Q12 → Q13 → Q14 → Q15 → Q16
    → QL1 → IQ1 → IQ2 → IQA → IQB → IQC → IQD → IQE → IQF → IQG → IQH → IQI → IQJ → IQK → IQL → IQM → END
```
**Count:** 16 (DATA_DASAR) + 1 (QL1) + 17 (IQ chain) = **34 questions**

---

### QL1=[R] ❌ FAIL — Continues to DQ, OQ, AQ, IQ blocks after RQJ

**Actual output:**
```
Q1 → ... → Q16 → QL1 → RQ1 → RQ5 → RQ8 → RQ13 → RQA → RQB → RQC → RQD → RQE → RQF → RQG → RQH → RQI → RQJ
→ DQ1 → DQ2 → DQ3 → DQ4 → DQ5 → DQ6 → DQ7 → DQ8 → DQ9 → DQ10 → DQ11 → DQ12 → DQ13 → DQ14 → DQ15 → DQA → DQB → DQC → DQD → DQE → DQF
→ OQ1 → OQ2 → OQA → OQB → OQC → OQD → OQE
→ AQ1 → AQ2 → AQA → AQB → AQC → AQD → AQE → AQF → AQG
→ IQ1 → IQ2 → IQ3 → IQ4 → IQA → IQB → IQC → IQD → IQE → IQF → IQG → IQH → IQI → IQJ → IQK → IQL → IQM
```

**Expected:**
```
Q1 → ... → Q16 → QL1 → RQ1 → RQ5 → RQ8 → RQ13 → RQA → RQB → RQC → RQD → RQE → RQF → RQG → RQH → RQI → RQJ → END
```

---

### QL1=[D] ❌ FAIL — Same issue

**Actual:** Flow continues through ALL blocks after DQF

**Expected:**
```
Q1 → ... → Q16 → QL1 → DQ1 → DQ5 → DQ6 → DQ7 → DQA → DQB → DQC → DQD → DQE → DQF → END
```

---

### QL1=[O] ❌ FAIL — Same issue

**Expected:**
```
Q1 → ... → Q16 → QL1 → OQ1 → OQ2 → OQA → OQB → OQC → OQD → OQE → END
```

---

### QL1=[A] ❌ FAIL — Same issue

**Expected:**
```
Q1 → ... → Q16 → QL1 → AQ1 → AQ2 → AQA → AQB → AQC → AQD → AQE → AQF → AQG → END
```

---

### QL1=[R,D] ❌ FAIL — Multi-selection

**Actual:** Full sequential flow through ALL questions

**Expected:**
```
Q1 → ... → Q16 → QL1 → [R block: RQ1→...→RQJ] → [D block: DQ1→...→DQF] → END
```

---

## Root Cause Analysis

### Only IQ chain works correctly

The IQ chain (QL1=[I]) passes because:
- IQ1 → IQ2 → IQA → ... → IQM
- IQ1's choices point to IQ2
- IQ2's choices point to IQA
- ...continues to IQM
- IQM has no next_question_code → END OF SECTION

### R, D, O, A chains fail

All other chains fail because after the last question in the chain:
- RQJ has no next_question_code → should END
- DQF has no next_question_code → should END
- OQE has no next_question_code → should END
- AQG has no next_question_code → should END

**But the flow continues to the next block instead of ending.**

### Hypothesis: Entry Point Detection Bug

The issue might be in `findAllEntryPointsForSection`. When processing FASKSES section with QL1=['R']:

1. It should find entryCodes = ['RQ1'] (only R's next_question_code)
2. After RQJ ends, the for loop should end (no more entry codes)
3. But somehow DQ1, OQ1, AQ1, IQ1 are being added

This suggests that when RQJ ends and the while loop breaks, either:
1. The for loop finds another entry code that wasn't filtered out
2. OR the sequential fallback after RQJ finds DQ1

### Multi-selection QL1=[R,D] fails similarly

For multi-selection, `findAllEntryPointsForSection` correctly finds multiple entry codes:
- R's choice → RQ1
- D's choice → DQ1

But after processing R block, instead of continuing to DQ block, it processes ALL remaining questions sequentially.

---

## Database Evidence

```
QL1 choices:
  R → RQ1
  D → DQ1
  O → OQ1
  A → AQ1
  I → IQ1

RQJ choices: (YA, TIDAK) → next_question_code = ''
DQF choices: (YA, TIDAK) → next_question_code = ''
OQE choices: (YA, TIDAK) → next_question_code = ''
AQG choices: (YA, TIDAK) → next_question_code = ''
IQM choices: (YA, TIDAK) → next_question_code = ''
```

All terminal questions have empty next_question_code — correct.

---

## Next Steps

1. **Install APK with debug logging** and run `adb logcat | grep "\[FLOW\]"` to see actual runtime flow
2. **Check getActiveSections** — ensure only one section is active when QL1=[R]
3. **Check entry point detection** — verify only RQ1 is found as entry for FASKSES when QL1=[R]
4. **Check section navigation** — verify currentSectionIndex doesn't go back to JENIS_LAYANAN after FASKSES ends
