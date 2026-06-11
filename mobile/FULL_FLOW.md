# Full Mobile Survey Flow — Q1 → End

Walkable map of every question + branch driven by [mobile/lib/question-logic.ts](lib/question-logic.ts). Generated from the current production template (Q4 = `'1'..'12'` integer-string schema, post-migration 0048).

Notation:
- `→` = next question on default `_next` path
- `[choice → target]` = choice value → next_question_code
- `(show if X)` = visible only when X holds
- `⋯` = chains to the next family at the bottom

---

## SECTION 1 — DATA_DASAR (always shown)

Linear walk; every question advances to the next via `skip_logic: _next`.

```
Q1  (TEXT — nama resmi)
 → Q2  (SINGLE_CHOICE — ya/tidak)
        [0 → _END_]           ← survey terminates (consent declined)
        [1 → Q3]
 → Q3  (SINGLE_CHOICE — bidang kegiatan)
 → Q4  (SINGLE_CHOICE — bentuk kelembagaan)  ← ROUTING ANCHOR
 → Q5  (GEO_PROVINSI)
 → Q6  (GEO_KABUPATEN)
 → Q7  (GEO_KECAMATAN)
 → Q8  (GEO_DESA)
 → Q9  (TEXTAREA — alamat)
 → Q10 (PHONE)
 → Q11 (EMAIL)
 → Q12 (URL)
 → Q13 (SINGLE_CHOICE — bentuk hukum)
 → Q14 (SINGLE_CHOICE — izin)
 → Q15 (SINGLE_CHOICE — tanggal/tahun)
 → Q16 (MULTIPLE_CHOICE — cakupan wilayah)
```

After Q16: advance to next active section.

---

## SECTION 2 — JENIS_LAYANAN (gated by Q4)

```
QL1  (MULTIPLE_CHOICE — jenis layanan faskes)
     visible iff Q4 in ['1','2','3','4','5']
     choices: R, D, O, A, I — each value triggers its detail family

QL2  (MULTIPLE_CHOICE — jenis layanan non-faskes)
     visible iff Q4 in ['6','7','8','9','10','11','12']
     choices: SR, SD, SO, SA, SI — each triggers its social detail family
```

Exactly one of QL1/QL2 is visible (Q4 determines which).

---

## SECTION 3 — FASKSES (gated by Q4 in 1-5)

The pre-detail intake chains. Each QL1 selection opens its own intake chain; intake chains then jump cross-section into DETAIL.

### R family (QL1 contains `R` — Rawat inap)

```
RQ1  [1 → RQ2] [2 → RQ5]
RQ2  [1 → RQ3] [R3 → RQ4]
RQ3  [R1 → RQA] [R2 → RQA]
RQ4  [R3.1.1 → RQA] [R3.1.2 → RQA]
RQ5  [2 → RQ8] [R14 → RQA]
RQ6  (show iff QL1∋R AND Q4 ∈ ['1','2'])    [R4 → RQA] [R6 → RQA]
RQ7  (show iff QL1∋R AND Q4 ∉ ['1','2'])    [R5 → RQA] [R7 → RQA]
RQ8  [1 → RQ9] [2 → RQ13]
RQ9  [R8 → RQ10] [R9 → RQ11] [RQ10 → RQ12]
RQ10 [R8.1 → RQA] [R8.2 → RQA]
RQ11 [R9.1 → RQA] [R9.2 → RQA]
RQ12 [R10.1 → RQA] [R10.2 → RQA]
RQ13 [R11 → RQA] [R12 → RQA] [R13 → RQA]
```

→ each RQA jump enters the **R detail block** (see DETAIL: R block).

### D family (QL1 contains `D` — Daily care)

```
DQ1  [1 → DQ2] [2 → DQ5]
DQ2  [DO → DQ3] [D1 → DQ4]
DQ3  [D0.1 → DQA] [D0.2 → DQA]
DQ4  [D1.1 → DQA] [D1.2 → DQA]
DQ5  [1 → DQ6] [2 → DQ9] [3 → DQ12] [4 → DQ15]
DQ6  [D2 → DQ7] [D6 → DQ8]
DQ7  [D2.1 → DQA] [D2.2 → DQA]
DQ8  [D6.1 → DQA] [D6.2 → DQA]
DQ9  [D3 → DQ10] [D7 → DQ11]
DQ10 [D3.1 → DQA] [D3.2 → DQA]
DQ11 [D7.1 → DQA] [D7.2 → DQA]
DQ12 [D4 → DQ13] [D8 → DQ14]
DQ13 [D4.1..D4.4 → DQA]    ← context value (D4.1/4.2/4.3/4.4) picks DQB1..DQB4
DQ14 [D8.1..D8.4 → DQA]    ← same, picks DQB1..DQB4
DQ15 [D5 → DQA] [D9 → DQA]
```

→ enters **D detail block**.

### O family (QL1 contains `O` — Outpatient)

```
OQ1  [1 → OQ2] [2 → OQ9]
OQ2  [1 → OQ3] [2 → OQ6]
OQ3  [O1 → OQ4] [O2 → OQ5]
OQ4  [O1.1 → OQA] [O1.2 → OQA]
OQ5  [O2.1 → OQA] [O1.2 → OQA]
OQ6  [O3 → OQ7] [O4 → OQ8]
OQ7  [O3.1 → OQA] [O3.2 → OQA]
OQ8  [O4.1 → OQA] [O5.2 → OQA]
OQ9  [1 → OQ10] [2 → OQ16]
OQ10 [O5 → OQ11] [O6 → OQ14] [O7 → OQ15]
OQ11 [O5.1 → OQ12] [O5.2 → OQ13]
OQ12 [O5.1.1 → OQA] [O5.1.2 → OQA] [O5.1.3 → OQA]
OQ13 [O5.2.1 → OQA] [O5.2.2 → OQA] [O5.2.3 → OQA]
OQ14, OQ15, OQ16, OQ17, OQ18, OQ19  → OQA (context drives OQB1 vs OQB2)
```

→ enters **O detail block**.

### A family (QL1 contains `A` — Access)

```
AQ1 → AQ2 → AQ3 → AQ4 → AQ5 → AQ6  (each via skip_logic _next → AQA)
```

→ enters **A detail block** (single block, no per-row context routing).

### I family (QL1 contains `I` — Info)

```
IQ1 → IQ2 → IQ3                  (each MULTIPLE_CHOICE; IQ3 = mode of delivery)
IQ3  [I2.1 → IQ4]                 ← hardcoded special: I2.1 forces IQ4 next
IQ4  (only if IQ3 = I2.1)
```

→ each branch enters **I detail block** with its own `_contextKey` (I1.x, I2.1.1, I2.1.2, I2.2).

---

## SECTION 4 — NON-FASKES (gated by Q4 in 6-12)

Mirror of FASKSES with `S`-prefix codes. Pattern identical: intake chains → cross-section to detail blocks.

```
SR family: SRQ1..SRQ9   → SRQA (rawat inap social)
SD family: SDQ1..SDQ11  → SDQA (daily social; SDQ9/10 context → SDQB1..SDQB4)
SO family: SOQ1..SOQ9   → SOQA (outpatient social; SOQ7/8/9 context → SOQB1 or SOQB2)
SA family: SAQ1..SAQ6   → SAQA (access social)
SI family: SIQ1..SIQ4   → SIQA (info social; SIQ4 context → SIQC/SIQD/SIQG)
```

Special patches:
- `SOQ8` answer `SO2.2.2` → forced to `SOQA` (template's stale `SOQ8A` target patched in code)
- `SIQB` context routing: `SI1.*` → SIQD, `SI2.1.2` → SIQC, `SI2.1.1`/`SI2.2` → SIQG
- `SIQC` always → `SIQG`

---

## SECTION 5 — DETAIL (inline-only, reached via cross-section jumps)

Each cross-section jump opens a per-branch instance. The whole block runs to completion, then control returns and the next selected QL1/QL2 branch opens its own instance.

### R detail block

```
RQA → RQB → RQC → RQD → RQE → RQF1 → RQF → RQG → RQH
RQH  (MULTI — PEMBAYARAN)
       [contains '3' OR legacy label → RQI → RQJ]
       [else → RQJ]
RQI → RQJ (KEGIATAN_TABLE) → RQK (STAFF_TABLE) → RQL (terminal)
```

### D detail block

```
DQA → DQB | DQB1 | DQB2 | DQB3 | DQB4   ← contextKey D(4|8).(1..4) → DQB${1..4}
       (DQB without suffix used when no preset variant)
→ DQC → DQD → DQE → DQF → DQG → DQH → DQI → DQJ
DQK  (MULTI — PEMBAYARAN)
       [mandiri → DQL → DQM]
       [else → DQM]
DQL → DQM (STAFF_TABLE) → DQN (terminal)
```

### O detail block

```
OQA → OQB1 | OQB2          ← contextKey O\d+\.(1|2) → OQB${1..2}
→ OQC → OQD → OQE → OQF → OQG → OQH → OQI → OQJ
OQK  (MULTI — PEMBAYARAN)
       [mandiri → OQL → OQM]
       [else → OQM]
OQL → OQM (STAFF_TABLE) → OQN (terminal)
```

### A detail block

```
AQA → AQB → AQC (terminal of upper branch)
AQD (terminal)
AQE → AQF (STAFF_TABLE) → AQG (terminal)
```

### I detail block (context-driven entry)

```
IQA → IQB
IQB  contextKey routing:
       [/^I1\./ → IQD]                      (consultation/assessment)
       [I2.1.2 → IQC]                       (interactive via media)
       [I2.1.1 or I2.2 → IQG]               (face-to-face / non-interactive)

IQC → IQG    (always — special-cased)
IQD (terminal of consult branch)

IQG → ?? (terminal of info branch; or falls through)
IQH → IQI → IQJ → IQK → IQL → IQM (STAFF_TABLE) → IQN (terminal)
IQE → IQF → IQJ → … (rejoins from earlier branches)
```

### Social variants (SR/SD/SO/SA/SI detail)

```
SR: SRQA → SRQB → SRQC → SRQD → SRQE → SRQF1 → SRQF → SRQG → SRQH
    SRQH [mandiri → SRQI → SRQJ] [else → SRQJ]
    SRQI → SRQJ (KEGIATAN_TABLE) → SRQK (STAFF) → SRQL (terminal)

SD: SDQA → SDQB | SDQB1 | SDQB2 | SDQB3 | SDQB4   ← SD3.[12].(1..4)
    → SDQC → SDQD → SDQE → SDQF → SDQG → SDQH → SDQI → SDQJ
    SDQK [mandiri → SDQL → SDQM] [else → SDQM]
    SDQL → SDQM (STAFF) → SDQN (terminal)

SO: SOQA → SOQB1 | SOQB2          ← SO2.[123].(1..2)
    → SOQC → SOQD → SOQE → SOQF → SOQG → SOQH → SOQI → SOQJ
    SOQK [mandiri → SOQL → SOQM] [else → SOQM]
    SOQL → SOQM (STAFF) → SOQN (terminal)

SA: SAQA → SAQB → SAQC (terminal)
    SAQD (terminal)
    SAQE → SAQF (STAFF) → SAQG (terminal)

SI: SIQA → SIQB
    SIQB [/^SI1\./ → SIQD] [SI2.1.2 → SIQC] [SI2.1.1|SI2.2 → SIQG]
    SIQC → SIQG (always)
    SIQD (terminal)
    SIQG → ? terminal; or SIQH → SIQI → SIQJ → SIQK → SIQL → SIQM (STAFF) → SIQN
    SIQE → SIQF → SIQJ → … (rejoins)
```

---

## End condition

Survey completes when:
1. All selected QL1 + QL2 branches have run their detail blocks AND
2. No more pending items in the flow queue, OR
3. A question returned `next_question_code = '_END_'` (Q2 answer `0` is the only current trigger — consent declined)

The form then auto-saves via `handleSave(true)`.

---

## Concrete example walks

### Walk A — RSU faskes with rawat inap

```
Q1 → Q2(1) → Q3 → Q4(1=RSU) → Q5..Q16 →
QL1[R selected] → cross-jump →
RQ1(1) → RQ2(R3) → RQ4(R3.1.1) → RQA → RQB..RQF1 → RQF → RQG → RQH(mandiri+jkn) →
RQI → RQJ → RQK → RQL → END
```

### Walk B — Puskesmas with rawat jalan + info

```
Q1 → Q2(1) → Q3 → Q4(3=PUSKESMAS) → … → Q16 →
QL1[O, I selected] →
  block 1: OQ1..OQ19 → OQA → OQB1 → OQC..OQK(no mandiri) → OQM → OQN
  block 2: IQ1..IQ3(I2.1.2) → IQ4 → IQA → IQB → IQC → IQG → IQH..IQN
→ END
```

### Walk C — LSM with social info only

```
Q1 → Q2(1) → Q3 → Q4(9=LSM) → … → Q16 →
QL2[SI selected] →
  SIQ1..SIQ2(SI1.1) → SIQ3..SIQ4 → SIQA → SIQB(SI1.x → SIQD) → SIQD → END
```

### Walk D — Consent declined

```
Q1 → Q2(0=Tidak) → _END_
```

---

## Cross-references

- Hardcoded sub-routing rules: see [FLOW_VARIANTS.md](FLOW_VARIANTS.md)
- Engine implementation: [getFlowItems](lib/question-logic.ts) in [mobile/lib/question-logic.ts](lib/question-logic.ts)
- Condition evaluator: [evaluateShowCondition](lib/question-logic.ts)
