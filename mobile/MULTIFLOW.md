# Survey Multi-Flow — Multiple Service Types

## Overview

When a surveyor selects multiple service types in QL1 (or QL2 for non-standard facilities), the app answers each service block sequentially before ending the survey.

---

## QL1 / QL2 Service Blocks

```
QL1 (standard facilities: RSU, RSJ, PUSKESMAS, KLINIK, PRAKTEK_DOKTER):
│
├──[R]  → FASKSES "RAWAT INAP"      (RQ1 → RQ2/3/4/5 → ... → RQ13 → RQA → ... → RQJ)
├──[D]  → FASKSES "DAY CARE"         (DQ1 → DQ2/3/4/5 → ... → DQA → ... → DQF)
├──[O]  → FASKSES "RAWAT JALAN"      (OQ1 → OQ2/3 → ... → OQA → ... → OQE)
├──[A]  → "AKSIBILITAS"             (AQ1 → AQ2 → ... → AQ6 → AQA → ... → AQG)
└──[I]  → "INFORMASI"               (IQ1 → IQ2 → IQ3 → IQ4 → IQA → ... → IQM)

QL2 (non-standard facilities: BALAI_REHABILITASI, PANTI_SOSIAL, LSM, LKS, dll.):
└──[non-FASKES] → SRQ block          (SRQ1 → SRQ2 → ... → SRQ9 → SRQA → ... → SRQG)
```

---

## Multi-Selection Flow

### Example: QL1 = [R, I]

```
DATA_DASAR: Q1 → Q2 → ... → Q16
                                 │
                           QL1 [R, I] selected
                                 │
              ┌──────────────────┴──────────────────┐
              ▼                                     ▼
      [FASKES: RAWAT INAP]                 [INFORMASI]
              │                                     │
              ▼                                     ▼
      RQ1 → RQ2 → ... → RQ13                 IQ1 → IQ2 → IQ3 → IQ4
              │                                     │
              ▼ (each RQ chain may have            ▼
                detail: RQA→RQJ)              IQA → ... → IQM
              │                                     │
              └──────────────────┬──────────────────┘
                                 ▼
                           ── SELESAI ──
```

### Example: QL1 = [R, D, O]

```
DATA_DASAR: Q1 → ... → Q16
                                 │
                        QL1 [R, D, O] selected
                                 │
         ┌────────────────────────┼────────────────────────┐
         ▼                        ▼                        ▼
[FASKES: RAWAT INAP]   [FASKES: DAY CARE]   [FASKES: RAWAT JALAN]
         │                        │                        │
         RQ1→...→RQ13             DQ1→...→DQ15             OQ1→...→OQ19
         │ (each with            │ (each with              │ (each with
         │  details)             │  details)               │  details)
         └────────────────────────┼────────────────────────┘
                                  ▼
                           ── SELESAI ──
```

---

## How the App Processes Multi-Selection

### 1. QL1 / QL2 Answered

QL1/QL2 is a `MULTIPLE_CHOICE` question. The answer is stored as an array, e.g., `['R', 'I']`.

### 2. Each Selected Block Gets Its Own Flow

For each selected value (R, D, O, A, I), the app finds the corresponding section and builds its flow:

```
For [R, I]:
  1. Build flow for FASKSES section   → RQ1 → RQ2 → ... → RQ13 → RQA → ... → RQJ
  2. Build flow for INFORMASI section  → IQ1 → IQ2 → IQ3 → IQ4 → IQA → ... → IQM
```

### 3. Flows Are Concatenated in QL1/QL2 Selection Order

The flows are appended sequentially. Since the order in the array matches the selection order (R first, I second), the combined flow is:

```
...QL1 → [RQ1 → ... → RQJ] → [IQ1 → ... → IQM] → SELESAI
```

### 4. Each Block Is Independent

- Each block (FASKES-Rawat Inap, INFORMASI, etc.) has its own set of questions
- Answers within one block do not affect questions in another block
- Each block has its own detail chain (e.g., RQA→RQJ for Rawat Inap, IQA→IQM for INFORMASI)
- After completing one block, the app moves to the next block in the selection order

---

## Question Count Example: QL1 = [R, I]

### FASKSES (Rawat Inap) — RQ1→RQ13 + Details

| Questions | Count |
|-----------|-------|
| RQ1–RQ13 | 13 |
| Detail per RQ (RQA→RQJ) × 4 triggers (RQ10, RQ11, RQ12, RQ13) | 4 × 10 = 40 |
| **Subtotal R block** | **53** |

### INFORMASI — IQ1→IQ4 + Details

| Questions | Count |
|-----------|-------|
| IQ1–IQ4 | 4 |
| Detail IQA→IQM | 13 |
| **Subtotal I block** | **17** |

### DATA_DASAR

| Questions | Count |
|-----------|-------|
| Q1–Q16 | 16 |
| QL1 | 1 |
| **Subtotal** | **17** |

### Total: 53 + 17 + 17 = **87 question visits**

---

## Implementation Notes

### In `getFlowItems`

The multi-selection handling works through `findEntryPointForSection`:

1. When processing QL1, the answer array `['R', 'I']` is used to find which sections to embed
2. For each selected value, `findEntryPointForSection` locates the matching section's entry point
3. The flows are built via recursive `getFlowItems` calls and concatenated
4. `sectionVisited` tracks which sections have been completed to prevent revisiting

### Key Data Structures

- **QL1/QL2 answer**: `string[]` e.g., `['R', 'I']`
- **Section targeting**: Each choice in QL1/QL2 has `next_question_code` pointing to the first question of that block
- **Cross-section jumps**: When a choice triggers `next_question_code` in a different section, `getFlowItems` recursively processes that section's flow

---

## Summary

| Scenario | Flow |
|----------|------|
| QL1 = [R] | DATA_DASAR → Rawat Inap → SELESAI |
| QL1 = [R, I] | DATA_DASAR → Rawat Inap → INFORMASI → SELESAI |
| QL1 = [R, D, O] | DATA_DASAR → Rawat Inap → Day Care → Rawat Jalan → SELESAI |
| QL1 = [R, D, O, A, I] | DATA_DASAR → All 5 blocks in order → SELESAI |
| QL2 = [non-FASKES] | DATA_DASAR → SRQ block → SELESAI |

**Rule**: After completing a service block, the app automatically proceeds to the next selected block. The order follows the sequence in which the surveyor selected the options.
