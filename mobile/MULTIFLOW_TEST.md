# Multi-Selection Test Flow

## Test Case: QL1 = [R, I]

### Setup
- **QL1 answer**: `['R', 'I']` (MULTIPLE_CHOICE)
- **Expected flow**: DATA_DASAR → Rawat Inap (RQ1→...→RQJ) → INFORMASI (IQ1→...→IQM) → SELESAI

---

## Expected Question Sequence

### Section: DATA_DASAR
```
Q1 → Q2 → Q3 → Q4 → Q5 → Q6 → Q7 → Q8 → Q9 → Q10 → Q11 → Q12 → Q13 → Q14 → Q15 → Q16
```

### Section: JENIS_LAYANAN
```
QL1: Select [R, I]
```

### Section: FASKSES (contains both RQ and IQ sub-chains)

#### Entry Point 1: R (Rawat Inap)
```
RQ1 → RQ5 → RQ6 → RQ7 → RQ8 → RQ10 → RQA→...→RQJ
                                           ↓
                                         RQ11 → RQA→...→RQJ
                                           ↓
                                         RQ12 → RQA→...→RQJ
                                           ↓
                                         RQ13 → RQA→...→RQJ
```

#### Entry Point 2: I (INFORMASI)
```
IQ1 → IQ2 → IQA→...→IQM
           ↓
         IQ3 → IQA→...→IQM
           ↓
         IQ4 → IQA→...→IQM
```

---

## Full Expected Path (simplified)

```
DATA_DASAR: Q1 → Q2 → Q3 → Q4 → Q5 → Q6 → Q7 → Q8 → Q9 → Q10 → Q11 → Q12 → Q13 → Q14 → Q15 → Q16
                ↓
           QL1 [R, I]
                ↓
    ┌───────────┴───────────┐
    ↓                       ↓
[Rawat Inap]         [INFORMASI]
    │                       │
    RQ1                    IQ1
    │                       ↓
    RQ5                    IQ2 → IQA → ... → IQM
    │                       ↓
    RQ6                    IQ3 → IQA → ... → IQM
    │                       ↓
    RQ7                    IQ4 → IQA → ... → IQM
    │                       │
    RQ8                    ↓
    │                  ── SELESAI ──
    RQ10 → RQA→...→RQJ
    ↓
RQ11 → RQA→...→RQJ
    ↓
RQ12 → RQA→...→RQJ
    ↓
RQ13 → RQA→...→RQJ
    │
    ↓
 IQ1 (next entry point)
    ↓
 IQ2 → IQA→...→IQM
    ↓
 IQ3 → IQA→...→IQM
    ↓
 IQ4 → IQA→...→IQM
    │
    ↓
── SELESAI ──
```

---

## Question Count

| Block | Questions | Detail | Total |
|-------|-----------|--------|-------|
| DATA_DASAR | Q1-Q16 = 16 | - | 16 |
| JENIS_LAYANAN | QL1 = 1 | - | 1 |
| Rawat Inap | RQ1,5,6,7,8,10,11,12,13 = 9 | 4 × 10 (RQA-RQJ) = 40 | 49 |
| INFORMASI | IQ1,2,3,4 = 4 | 3 × 13 (IQA-IQM) = 39 | 43 |
| **TOTAL** | | | **109** |

---

## Test Scenarios

### Scenario 1: QL1 = [R]
- Only Rawat Inap block is processed
- After RQJ, survey ends

### Scenario 2: QL1 = [I]
- Only INFORMASI block is processed
- After IQM, survey ends

### Scenario 3: QL1 = [R, I]
- Rawat Inap block first, then INFORMASI block
- After IQM, survey ends

### Scenario 4: QL1 = [R, D]
- Rawat Inap block first (RQ1→...→RQJ)
- Then Day Care block (DQ1→...→DQF)
- After DQF, survey ends

### Scenario 5: QL1 = [R, D, O, A, I]
- All 5 blocks processed in order
- After IQM, survey ends

---

## Database Evidence

From the database query:
```
QL1 choices:
  R -> next: RQ1
  D -> next: DQ1
  O -> next: OQ1
  A -> next: AQ1
  I -> next: IQ1

RQ10, RQ11, RQ12, RQ13 all point to RQA (detail)
IQ2, IQ3, IQ4 all point to IQA (detail)
```
