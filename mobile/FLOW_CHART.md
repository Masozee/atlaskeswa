# Survey Flow — DATA_DASAR → JENIS_LAYANAN → FASKSES/NON-FASKES

## SECTION 1: DATA_DASAR (Linear, Q1–Q16)

```
Q1 → Q2 → Q3 → Q4 → Q5 → Q6 → Q7 → Q8 → Q9 → Q10 → Q11 → Q12 → Q13 → Q14 → Q15 → Q16
     (single choice, _next)
```

All questions in DATA_DASAR use `skip_logic: [{"goto": "_next"}]` so they flow linearly by question order.

---

## SECTION 2: JENIS_LAYANAN (QL1 / QL2 — Conditional on Q4)

```
Q4 answer = [RSU, RSJ, PUSKESMAS, KLINIK, PRAKTEK_DOKTER]  →  QL1 visible, QL2 hidden
Q4 answer = [BALAI_REHABILITASI, PANTI_SOSIAL, LSM, LKS, PRAKTEK_PRIBADI, LAINNYA] → QL2 visible, QL1 hidden
```

QL1 / QL2 choices (MULTIPLE_CHOICE) → determine which FASKSES/NON-FASKES block activates:

```
QL1 / QL2 choices:
│
├──[R]  → FASKSES "RAWAT INAP" block  (RQ1 → RQ13 → RQA → RQB → ... → RQJ)
├──[D]  → FASKSES "DAY CARE" block    (DQ1 → DQ15 → DQA → DQB → ... → DQF)
├──[O]  → FASKSES "RAWAT JALAN" block (OQ1 → OQ19 → OQA → OQB → ... → OQE)
├──[A]  → "AKSIBILITAS" block        (AQ1 → AQ6 → AQA → ... → AQG)
└──[I]  → "INFORMASI" block          (IQ1 → IQ4 → IQA → ... → IQM)
```

**Multiple selections allowed** — if surveyor selects e.g. `[R, D]` → both Rawat Inap AND Day Care blocks are answered sequentially.

---

## SECTION 3: FASKSES — RAWAT INAP (RQ1–RQ13, then Detail RQA–RQJ)

### 3.1 RQ1 — First Branch

```
RQ1: LAYANAN RAWAT INAP MENERIMA PASIEN DENGAN KONDISI APA?  (MULTIPLE_CHOICE)

Selected: [AKUT]
  └──→ RQ2 ──────────────────── AKUT path

Selected: [NON-AKUT]
  └──→ RQ5 ──────────────── NON-AKUT path

Selected: [AKUT, NON-AKUT]  (both)
  └──→ RQ1 saved with both
  └──→ First "Selanjutnya" press → RQ2 (AKUT path)
       Second pass through (after completing NON-AKUT branch later) → RQ5
```

> ⚠️ **MULTIPLE_CHOICE note**: If both AKUT and NON-AKUT are selected, the app shows RQ2 first. After completing the AKUT branch, surveyor returns to the FASKSES section and answers the remaining RQ1 answer (NON-AKUT), then proceeds to RQ5.

---

### 3.2 AKUT PATH: RQ1 → RQ2 → RQ3/RQ4 → RQA

```
RQ1 answered [AKUT]
  │
  └──→ RQ2: KETERSEDIAAN DOKTER JAGA ATAU RESIDEN?  (SINGLE_CHOICE)
            │
            ├──[Terdapat Dokter Jaga 24 Jam]  ─→ RQ3
            │                                       │
            │                               ┌───────┴───────┐
            │                          R1 (INTENSITAS TINGGI)   R2 (INTENSITAS SEDANG)
            │                                 │                  │
            │                                 └────────┬────────┘
            │                                          │
            │                                  (both → RQA)
            │                                          │
            └──[Tidak Terdapat Dokter Jaga 24 Jam]  ─→ RQ4
                                                              │
                                                     ┌────────┴────────┐
                                          R3.1.1 (LAYANAN KESEHATAN)   R3.1.2 (LAYANAN NON-KESEHATAN)
                                                              │
                                                     (both → RQA)
```

---

### 3.3 NON-AKUT PATH: RQ1 → RQ5

```
RQ1 answered [NON-AKUT]
  │
  └──→ RQ5: KARAKTERISTIK LAYANAN RAWAT INAP NON-AKUT?  (SINGLE_CHOICE)
            │
            ├──[DOKTER_24 — DENGAN DOKTER JAGA 24 JAM]  ─→ RQ6
            │                                                   │
            │                                          ┌───────┴───────┐
            │                                    BATASAN_YA    BATASAN_TIDAK
            │                                          │              │
            │                               (both → RQA)    (both → RQA)
            │
            ├──[NON_DOKTER_24 — TANPA DOKTER JAGA 24 JAM]  ─→ RQ8
            │                                                    │
            │                                          ┌───────────┴───────────┐
            │                                    BATASAN_YA          BATASAN_TIDAK
            │                                          │                    │
            │                                          ▼                    ▼
            │                                        RQ9                  RQ13
            │                                          │                    │
            │                               ┌─────────┴─────────┐  (→ RQA)
            │                          R8 (STAF 24 JAM)    R9 (STAF ≥5 HARI)
            │                               │                    │
            │                               └─────────┬─────────┘
            │                                         │
            └──[LAINNYA — AKOMODASI SEMENTARA]  ─────────────────→ RQA
                                                              │
                                                    ┌─────────┴─────────┐
                                              (all sub-paths end at RQA)
```

---

### 3.4 DETAIL: RQ5 = LAINNYA → RQA → RQB → ... → RQJ

```
RQ5 answered [LAINNYA]
  │
  └──→ RQA: NAMA LAYANAN RAWAT INAP?  (TEXT)
            │
            └──→ RQB: TOTAL BED?  (TEXT)
                      │
                      └──→ RQC: BED TERISI SAAT INI?  (TEXT)
                                │
                                └──→ RQD: CARA BAYAR?  (MULTIPLE_CHOICE)
                                          │
                                          └──→ RQE: TARIF RATA-RATA?  (NUMBER)
                                                    │
                                                    └──→ RQF: STAF (STAFF_TABLE)
                                                              │
                                                              └──→ RQG: ADA DAFTAR DIAGNOSIS?  (SINGLE_CHOICE)
                                                                        │
                                                              ┌───────────┴───────────┐
                                                           YA (ada)              TIDAK (skip)
                                                                │                   │
                                                                ▼                   │
                                                             RQH: SALINAN          │
                                                             DIAGNOSIS? (TEXT)       │
                                                                │                   │
                                                                └──→ RQI: RENTANG    │
                                                                         USIA (MULTIPLE)  │
                                                                            │             │
                                                                            └──→ RQJ ───┘
                                                                                      │
                                                                            KERJASAMA RUJUKAN?
                                                                              (SINGLE_CHOICE)
                                                                                  │
                                                                       ┌──────────┴──────────┐
                                                                    YA                  TIDAK
                                                                      │                    │
                                                                      ▼                 (end
                                                                   (end survey          survey
                                                                    for this            for this
                                                                    branch)             branch)
```

> **CRITICAL: After RQ5 = LAINNYA branch completes RQA–RQJ, control returns to RQ6** — surveyor continues with the NON-AKUT path from RQ6 onward.

---

### 3.5 NON-AKUT PATH continued: After LAINNYA detail → RQ6

```
RQ5 answered [LAINNYA]
  │
  └──→ RQA ─ RQB ─ RQC ─ RQD ─ RQE ─ RQF ─ RQG ─ RQH ─ RQI ─ RQJ
                                                                      │
                                                            (LAINNYA branch complete)
                                                                      │
                                                                      ▼
                                                                 RQ6: BATASAN WAKTU TINGGAL?  (SINGLE_CHOICE)
                                                                   │
                                                         ┌─────────┴─────────┐
                                                    BATASAN_YA        BATASAN_TIDAK
                                                         │                │
                                                         ▼                ▼
                                                   (→ RQA detail)  (→ RQA detail)
                                                    [repeats detail flow for RQ6 sub-service]
```

> ⚠️ **Important**: The user said "you go back to RQ6 and follow the flow again" — meaning after completing the LAINNYA detail (RQA–RQJ), the surveyor fills in **a second service instance** starting at RQ6. This implies the surveyor fills RQF (staff table) for the service described in RQ5=LAINNYA, then returns to RQ6 to answer for the main NON-AKUT service.

**BUT WAIT** — re-reading the user's description more carefully:

> "after RQ1 if you choose NON-AKUT then you go to RQ5 and you choose LAINNYA then you go RQA until RQJ, you go back to RQ6 and follow the flow again"

This means:
1. RQ1 [NON-AKUT] → RQ5
2. RQ5 [LAINNYA] → RQA–RQJ (detail for the LAINNYA service)
3. After RQJ → back to RQ6
4. RQ6 onwards for the NON-AKUT "main" service (DOKTER_24 or NON_DOKTER_24 path)

---

### 3.6 NON-AKUT full flow diagram (after RQ1 = NON-AKUT):

```
RQ1 [NON-AKUT]
  │
  └──→ RQ5: KARAKTERISTIK?  (SINGLE_CHOICE)
            │
            ├──[DOKTER_24]──────────────→ RQ6
            │                               │
            │                    ┌──────────┴──────────┐
            │               BATASAN_YA           BATASAN_TIDAK
            │                     │                  │
            │                     ▼                  ▼
            │                   RQ6 detail       RQ6 detail
            │                   (RQA→RQJ)         (RQA→RQJ)
            │                     │                  │
            │                     └────────┬─────────┘
            │                              │
            ├──[NON_DOKTER_24]──────────→ RQ8
            │                               │
            │                    ┌──────────┴──────────┐
            │               BATASAN_YA           BATASAN_TIDAK
            │                     │                  │
            │                     ▼                  ▼
            │                   RQ9                  RQ13
            │                     │                   │
            │          ┌─────────┴─────────┐        │
            │        R8 (STAF 24J)  R9 (STAF ≥5H)    │
            │             │            │             │
            │             └──────┬─────┘             │
            │                    │                    │
            │                    └──────────┬─────────┘
            │                               │
            └──[LAINNYA]────────────────→ RQA
                                          │
                                    RQA→RQB→RQC→RQD→RQE→RQF→RQG→RQH→RQI→RQJ
                                          │
                                          ▼
                                    (end LAINNYA detail)
                                          │
                                          ▼
                            ┌──────── RQ6 (BATASAN?) ─────────┐
                            │                                  │
                     BATASAN_YA                           BATASAN_TIDAK
                            │                                  │
                            ▼                                  ▼
                      RQ6 detail                          RQ6 detail
                      (RQA→RQJ)                           (RQA→RQJ)
                            │                                  │
                            └──────────────┬──────────────────┘
                                           │
                            (NON-AKUT branch COMPLETE)
                                           │
                                           ▼
                              ─── END OF FASKSES SECTION ───
```

---

## SECTION 3b: NON-FASKES (SRQ1–SRQ9 → SRQA–SRQG)

If QL2 is active (non-standard facilities):

```
SRQ1 → SRQ2 → SRQ3 → SRQ4 → SRQ5 → SRQ6 → SRQ7 → SRQ8 → SRQ9 → SRQA → ... → SRQG
       (linear, _next skip logic on each)
```

---

## COMPLETE SURVEY SEQUENCE (example: standard facility, R + D selected in QL1)

```
DATA_DASAR: Q1 → Q2 → Q3 → Q4 → Q5 → Q6 → Q7 → Q8 → Q9 → Q10 → Q11 → Q12 → Q13 → Q14 → Q15 → Q16
                │
                ▼
         (QL1 visible, QL2 hidden)
                │
         QL1: select [R, D]
                │
    ┌───────────┴───────────┐
    ▼                       ▼
[FASKES: RAWAT INAP]    [FASKES: DAY CARE]
    │                       │
    RQ1 [NON-AKUT]         DQ1 [AKUT]
    │                       │
    ▼                       DQ2 [DO]
RQ5 [LAINNYA]                  │
    │                          DQ3 → DQA→...→DQF
RQ1 [NON-AKUT]             DQ1 [NON-AKUT]
    │                       │
    ▼                       DQ5 [PEKERJAAN]
RQ5 [DOKTER_24]                 │
    │                          DQ6 → DQA→...→DQF
RQ6 [BATASAN_YA]            DQ1 [NON-AKUT]
    │                       │
    ▼                       DQ5 [PERSIAPAN_KERJA]
RQ6 detail (RQA→RQJ)             │
    │                          DQ9 → DQA→...→DQF
    │                       DQ1 [NON-AKUT]
    │                          │
    └──────────────────────────┘
                │
                ▼
      ─── END OF SURVEY ───
```

---

## BRANCH DECISION TABLE (RQ1 → ... → end of branch)

| RQ1 answer | → next | Branch description |
|---|---|---|
| [AKUT] | RQ2 | AKUT: dokter jaga path |
| [AKUT, NON-AKUT] | RQ2 first | Both: complete AKUT, then NON-AKUT |

| RQ5 answer | → next | Description |
|---|---|---|
| DOKTER_24 | RQ6 | NON-AKUT with 24h doctor |
| NON_DOKTER_24 | RQ8 | NON-AKUT without 24h doctor |
| LAINNYA | RQA | Detail first, then RQ6 |

| RQ6 answer | → next |
|---|---|
| BATASAN_YA | RQA detail |
| BATASAN_TIDAK | RQA detail |

| RQ8 answer | → next |
|---|---|---|
| BATASAN_YA | RQ9 |
| BATASAN_TIDAK | RQ13 |

| RQ9 answer | → next |
|---|---|
| R8 (STAF 24J) | RQ10 |
| R9 (STAF ≥5H) | RQ11 |
| RQ10 (STAF <5H) | RQ12 |

| RQ10/RQ11/RQ12/RQ13 | → next |
|---|---|---|
| (any answer) | RQA detail |

---

## DETAIL QUESTION FLOW (RQA→RQJ) — all branches

```
RQA (NAMA) ─→ RQB (BED) ─→ RQC (BED TERISI) ─→ RQD (CARA BAYAR)
    │                                                    │
    │                                            ┌──────┴──────┐
    │                                         (MULTIPLE CHOICE)
    │                                            no skip, next
    │                                                    │
    ▼                                                    ▼
RQE (TARIF) ─→ RQF (STAFF TABLE) ─→ RQG (ADA DAFTAR DIAGNOSIS?)
                                                        │
                                              ┌─────────┴─────────┐
                                           YA              TIDAK
                                             │                │
                                             ▼                │
                                          RQH: SALINAN        │
                                          DIAGNOSIS? (TEXT)    │
                                             │                │
                                             ▼                │
                                         RQI (RENTANG USIA)   │
                                             │                │
                                             ▼                │
                                      RQJ (KERJASAMA RUJUKAN?)──┘
                                             │
                                    ┌────────┴────────┐
                                 YA              TIDAK
                                   │                │
                                   ▼             (end)
                                (end)
```
