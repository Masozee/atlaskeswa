# Question Flow Chart — ACTUAL ANSWER-BASED FLOW

## REAL Survey Flow — Answer-Driven Branching

The flow is NOT linear through question codes. The NEXT question is determined by the **answer value** selected, not the question order.

---

## DATA_DASAR: Q1 → Q16 (Linear)

```
Q1 → Q2 → Q3 → Q4 → Q5 → Q6 → Q7 → Q8 → Q9 → Q10 → Q11 → Q12 → Q13 → Q14 → Q15 → Q16
```
All questions use `next_question_code: "_next"` so they flow linearly.

---

## JENIS_LAYANAN: QL1 / QL2 (Conditional on Q4)

```
Q4 answer in [RSU, RSJ, PUSKESMAS, KLINIK, PRAKTEK_DOKTER]  → QL1 visible, QL2 hidden
Q4 answer in [BALAI_REHABILITASI, PANTI_SOSIAL, LSM, LKS, PRAKTEK_PRIBADI, LAINNYA] → QL2 visible, QL1 hidden
```

QL1/QL2 choices determine which FASKSES block activates:
- `R` → Rawat Inap block
- `D` → Day Care block
- `O` → Rawat Jalan block
- `A` → Aksesibilitas block
- `I` → Informasi block

---

## RAWAT INAP (FASKSES): Answer-Based Flow

### RQ1 — First Branch: AKUT vs NON-AKUT

```
RQ1: LAYANAN RAWAT INAP MENERIMA PASIEN DENGAN KONDISI?
│
 ├──[AKUT]───────────────────→ RQ2
 │                                  │
 │                           ┌─────┴─────┐
 │                     DOKTER_24_JAM   TIDAK_TERDAPAT
 │                           │              │
 │                           ▼              ▼
 │                         RQ3           RQ4
 │                           │              │
 │                     ┌─────┴─────┐  ┌─────┴─────┐
 │                    R1 (INTENSIF) R2 (SEDANG) R3.1.1 / R3.1.2
 │                           │              │
 │                           └──────┬──────┘
 │                                  │
 ├─[NON-AKUT]───────────────────────→ RQ5
 │                                        │
 │                              ┌─────────┴──────────┐
 │                        DOKTER_24_JAM          NON_DOKTER_24_JAM
 │                              │                      │
 │                              ▼                      ▼
 │                            RQ6                    RQ8
 │                              │                      │
 │                       ┌──────┴──────┐         ┌──────┴──────┐
 │                 BATASAN_YA      BATASAN_TIDAK  BATASAN_YES  BATASAN_NO
 │                       │              │              │            │
 │                       ▼              ▼              ▼            ▼
 │                     RQA            RQA            RQ9         RQ13
```

### RQ2 → RQ3 → RQ4 → RQA (AKUT path, after RQ2)

```
RQ2: KETERSEDIAAN DOKTER JAGA?
│
 ├──[Terdapat Dokter Jaga 24 Jam]──→ RQ3
 │                                        │
 │                                  ┌─────┴─────┐
 │                               R1 (INTENSIF) R2 (SEDANG)
 │                                    │           │
 │                                    └─────┬─────┘
 │                                          │
 ├──[Tidak Terdapat Dokter Jaga 24 Jam]──→ RQ4
 │                                            │
 │                                      ┌─────┴─────┐
 │                               R3.1.1 (KESEHATAN) R3.1.2 (NON-KESEHATAN)
 │                                      │              │
 │                                      └──────┬───────┘
 │                                             │
└──────────────────────────────────────────────▼ RQA
```

### RQ3 → RQA (AKUT, after RQ3 choice)

```
RQ3 choices:
- R1 (PEMANTAUAN INTENSITAS TINGGI) ──→ RQA
- R2 (PEMANTAUAN INTENSITAS SEDANG) ──→ RQA
```

### RQ4 → RQA (AKUT, after RQ4 choice)

```
RQ4 choices:
- R3.1.1 (LAYANAN KESEHATAN) ──→ RQA
- R3.1.2 (LAYANAN NON KESEHATAN) ──→ RQA
```

### RQ5 → RQ6/RQ8 (NON-AKUT path)

```
RQ5: KARAKTERISTIK RAWAT INAP NON-AKUT?
│
 ├──[DOKTER_24 — DENGAN DOKTER JAGA 24 JAM]──→ RQ6
 │                                                  │
 │                                           ┌──────┴──────┐
 │                                    BATASAN_YA    BATASAN_TIDAK
 │                                          │            │
 │                                          ▼            ▼
 │                                        RQA          RQA
 │
 └──[NON_DOKTER_24 — TANPA DOKTER JAGA 24 JAM]──→ RQ8
 │                                                    │
 │                                             ┌───────┴───────┐
 │                                      BATASAN_DITETAPKAN  BATASAN_TDK_DITETAPKAN
 │                                             │                │
 │                                             ▼                ▼
 │                                           RQ9             RQ13
```

### RQ6 → RQA

```
RQ6 choices:
- R4 (BATASAN WAKTU TINGGAL SUDAH DITETAPKAN) ──→ RQA
- R6 (BATASAN WAKTU TINGGAL TIDAK DITETAPKAN) ──→ RQA
```

### RQ7 → RQA

```
RQ7 choices:
- R5 (BATASAN WAKTU TINGGAL SUDAH DITETAPKAN) ──→ RQA
- R7 (BATASAN WAKTU TINGGAL TIDAK DITETAPKAN) ──→ RQA
```

### RQ8 → RQ9 or RQ13

```
RQ8 choices:
- BATASAN_DITETAPKAN ──→ RQ9
- BATASAN_TDK_DITETAPKAN ──→ RQ13
```

### RQ9 → RQ10/RQ11/RQ12

```
RQ9 choices:
- R8 (DUKUNGAN STAF 24 JAM) ──→ RQ10
- R9 (DUKUNGAN STAF ≥5 HARI/MINGGU) ──→ RQ11
- RQ10 (DUKUNGAN STAF <5 HARI/MINGGU) ──→ RQ12
```

### RQ10 → RQA

```
RQ10 choices:
- R8.1 (KURANG DARI 1 BULAN) ──→ RQA
- R8.2 (LEBIH DARI 1 BULAN) ──→ RQA
```

### RQ11 → RQA

```
RQ11 choices:
- R9.1 (KURANG DARI 1 BULAN) ──→ RQA
- R9.2 (LEBIH DARI 1 BULAN) ──→ RQA
```

### RQ12 → RQA

```
RQ12 choices:
- R10.1 (KURANG DARI 1 BULAN) ──→ RQA
- R10.2 (LEBIH DARI 1 BULAN) ──→ RQA
```

### RQ13 → RQA

```
RQ13 choices:
- R11 (DUKUNGAN STAF 24 JAM) ──→ RQA
- R12 (DUKUNGAN STAF ≥5 HARI/MINGGU) ──→ RQA
- R13 (DUKUNGAN STAF <5 HARI/MINGGU) ──→ RQA
```

---

## DAY CARE (FASKSES): Answer-Based Flow

### DQ1 — First Branch: AKUT vs NON-AKUT

```
DQ1: LAYANAN PERAWATAN HARIAN MENERIMA PASIEN?
│
 ├──[AKUT]──────────────────────────────→ DQ2
 │                                           │
 │                                    ┌──────┴──────┐
 │                              DO (EPISODIK)   D1 (BERKELANJUTAN)
 │                                   │                │
 │                                   ▼                ▼
 │                                 DQ3              DQ4
 │                                   │                │
 │                            ┌──────┴──────┐  ┌──────┴──────┐
 │                     D0.1 (INTENSIF) D0.2 (NON-INTENSIF)  D1.1 (INTENSIF) D1.2 (NON-INTENSIF)
 │                              │              │              │
 │                              └──────┬───────┘              │
 │                                     ▼                      │
 └──────────────────────────────────────┴──────────────────────▼ DQA
 │
 └──[NON-AKUT]────────────────────────→ DQ5
                                        │
                                 ┌──────┴──────────┬──────────────┐
                            PEKERJAAN     TERSTRUKTUR_NON    PERSIAPAN_KERJA  TIDAK_TERSTRUKTUR
                                  │             │                  │                │
                                  ▼             ▼                  ▼                ▼
                                DQ6          DQ12               DQ9             DQ15
                                  │             │                  │                │
                                  ▼             ▼                  ▼                ▼
                             ┌─────┴─────┐  ┌─────┴────┐     ┌─────┴────┐    ┌──────┴──────┐
                        D2.1 (SESUAI) D2.2 (DISESUAIKAN)  D3.1 (ADA BATAS) D3.2 (TIDAK)  D4 (INTENSITAS TINGGI) D8 (RENDAH)  D4.1 D4.2 D4.3 D4.4  D8.1 D8.2 D8.3 D8.4
                              │              │               │           │         │           │            │               │
                              └──────┬───────┘               └─────┬─────┘         └─────┬─────┘           └───────┬───────┘
                                     ▼                               ▼                 ▼                       ▼
                                   DQA                             DQA               DQA                    DQA
```

### DQ2 → DQ3/DQ4 → DQA

```
DQ2 choices:
- DO (EPISODIK) ──→ DQ3
- D1 (BERKELANJUTAN) ──→ DQ4
```

### DQ3 → DQA

```
DQ3 choices:
- D0.1 (INTENSIF) ──→ DQA
- D0.2 (NON INTENSIF) ──→ DQA
```

### DQ4 → DQA

```
DQ4 choices:
- D1.1 (INTENSIF, ALTERNATIF RAWAT INAP) ──→ DQA
- D1.2 (NON INTENSIF, BUKAN ALTERNATIF) ──→ DQA
```

### DQ5 → DQ6/DQ12/DQ9/DQ15 (NON-AKUT path)

```
DQ5 choices:
- PEKERJAAN ──→ DQ6
- TERSTRUKTUR_NON_PEKERJAAN ──→ DQ12
- PERSIAPAN_KERJA ──→ DQ9
- TIDAK_TERSTRUKTUR ──→ DQ15
```

### DQ6 → DQ7/DQ8 → DQA

```
DQ6: INTENSITAS?
- D2 (TINGGI ≥4x/minggu) ──→ DQ7
- D6 (RENDAH <4x/minggu) ──→ DQ8

DQ7 → DQA (all choices)
DQ8 → DQA (all choices)
```

### DQ9 → DQ10/DQ11 → DQA

```
DQ9: INTENSITAS PERSIAPAN KERJA?
- D3 (TINGGI ≥4x/minggu) ──→ DQ10
- D7 (RENDAH <4x/minggu) ──→ DQ11

DQ10 → DQA
DQ11 → DQA
```

### DQ12 → DQ13/DQ14 → DQA

```
DQ12: INTENSITAS?
- D4 (TINGGI ≥4x/minggu) ──→ DQ13
- D8 (RENDAH <4x/minggu) ──→ DQ14

DQ13 → DQA
DQ14 → DQA
```

### DQ15 → DQA

```
DQ15: INTENSITAS?
- D5 (TINGGI ≥4x/minggu) ──→ DQA
- D9 (RENDAH <4x/minggu) ──→ DQA
```

---

## RAWAT JALAN (FASKSES): Answer-Based Flow

### OQ1 — First Branch: AKUT vs NON-AKUT

```
OQ1: LAYANAN RAWAT JALAN MENERIMA PASIEN?
│
 ├──[AKUT]──────────────────────────────→ OQ2
 │                                           │
 │                                    ┌──────┴──────┐
 │                           LAYANAN_KUNJUNGAN  LAYANAN_FASILITAS
 │                                   │                │
 │                                   ▼                ▼
 │                                 OQ3              OQ6
 │                                   │                │
 │                    ┌──────────────┴──────────────┐  │
 │              O1 (24 JAM)  O2 (TIDAK 24 JAM)  O3 (24 JAM)  O4 (TIDAK 24 JAM)
 │                    │            │                │                │
 │                    ▼            ▼                ▼                ▼
 │                  OQ4          OQ5              OQ7              OQ8
 │                    │            │                │                │
 │                    └────────────┴────────────────┘                │
 │                                │                                   │
 │                                └──────────┬────────────────────────┘
 │                                           │
 ├──[NON_AKUT]──────────────────────────────→ OQ9
 │                                             │
 │                                      ┌──────┴──────┐
 │                             LAYANAN_KUNJUNGAN  LAYANAN_FASILITAS
 │                                    │                │
 │                                    ▼                ▼
 │                                  OQ10             OQ16
 │                                    │                │
 │                        ┌────────────┴────────────┐  │
 │               O5 (TINGGI ≥3x/minggu) O6 (SEDANG 1x/2minggu) O7 (RENDAH)
 │                      │                   │               │
 │                      ▼                   ▼               ▼
 │                    OQ11               OQ14            OQ15
 │                      │                   │               │
 │           ┌──────────┴──────────┐       │               │
 │    O5.1.1 O5.1.2 O5.1.3     O5.2.1 O5.2.2 O5.2.3  O6.1 O6.2  O7.1 O7.2
 │    (same next: OQA)        (same next: OQA)    (same next: OQA) (same next: OQA)
```

### OQ2 → OQ3/OQ6

```
OQ2: JENIS LAYANAN?
- LAYANAN_KUNJUNGAN (ke luar fasilitas) ──→ OQ3
- LAYANAN_FASILITAS (di fasilitas) ──→ OQ6
```

### OQ3 → OQ4/OQ5

```
OQ3: KETERSEDIAAN?
- O1 (TERSEDIA 24 JAM) ──→ OQ4
- O2 (TIDAK TERSEDIA 24 JAM) ──→ OQ5
```

### OQ4 → OQA (via OQ4's choices all go to OQA)

```
OQ4: FOKUS LAYANAN?
- O1.1 (KESEHATAN) ──→ OQA
- O1.2 (NON KESEHATAN) ──→ OQA
```

### OQ5 → OQA

```
OQ5: FOKUS LAYANAN?
- O2.1 (KESEHATAN) ──→ OQA
- O1.2 (NON KESEHATAN) ──→ OQA
```

### OQ6 → OQ7/OQ8

```
OQ6: KETERSEDIAAN?
- O3 (TERSEDIA 24 JAM) ──→ OQ7
- O4 (TIDAK TERSEDIA 24 JAM) ──→ OQ8
```

### OQ7 → OQA

```
OQ7 choices:
- O3.1 (KESEHATAN) ──→ OQA
- O3.2 (NON KESEHATAN) ──→ OQA
```

### OQ8 → OQA or OQ13

```
OQ8 choices:
- O4.1 (KESEHATAN) ──→ OQA
- O5.2 (NON KESEHATAN) ──→ OQ13
```

### OQ9 → OQ10/OQ16 (NON-AKUT path)

```
OQ9: JENIS LAYANAN?
- LAYANAN_KUNJUNGAN ──→ OQ10
- LAYANAN_FASILITAS ──→ OQ16
```

### OQ10 → OQ11/OQ14/OQ15

```
OQ10: INTENSITAS?
- O5 (TINGGI ≥3x/minggu) ──→ OQ11
- O6 (SEDANG 1x/2minggu) ──→ OQ14
- O7 (RENDAH) ──→ OQ15
```

### OQ11 → OQ12/OQ13 → OQA

```
OQ11: FOKUS?
- O5.1 (KESEHATAN) ──→ OQ12
- O5.2 (NON KESEHATAN) ──→ OQ13

OQ12 → OQA (all sub-choices)
OQ13 → OQA (all sub-choices)
```

### OQ14 → OQA

```
OQ14: FOKUS?
- O6.1 (KESEHATAN) ──→ OQA
- O6.2 (NON KESEHATAN) ──→ OQA
```

### OQ15 → OQA

```
OQ15: FOKUS?
- O7.1 (KESEHATAN) ──→ OQA
- O7.2 (NON KESEHATAN) ──→ OQA
```

### OQ16 → OQ17/OQ18/OQ19

```
OQ16: INTENSITAS?
- O8 (TINGGI ≥3x/minggu) ──→ OQ17
- O8 (MEDIUM 1x/2minggu) ──→ OQ18
- O10 (RENDAH) ──→ OQ19
```

### OQ17 → OQA

```
OQ17: FOKUS?
- O8.1 (KESEHATAN) ──→ OQA
- O8.2 (NON KESEHATAN) ──→ OQA
```

### OQ18 → OQA

```
OQ18: FOKUS?
- O9.1 (KESEHATAN) ──→ OQA
- O9.2 (NON KESEHATAN) ──→ OQA
```

### OQ19 → OQA

```
OQ19: FOKUS?
- O10.1 (KESEHATAN) ──→ OQA
- O10.2 (NON KESEHATAN) ──→ OQA
```

### OQC → OQD/OQE

```
OQC: ADA DAFTAR DIAGNOSIS?
- YA ──→ OQD
- TIDAK ──→ OQE
```

---

## DETAIL LAYAN-TIDAK LAYANAN (RQA → RQJ, DQA → DQF, etc.)

After the last FASKSES question in each branch, the flow goes to the detail section (RQA, DQA, OQA, etc.).

### Rawat Inap Detail: RQA → RQJ

```
RQA (NAMA LAYANAN) → RQB (TOTAL BED) → RQC (BED TERISI) → RQD (CARA BAYAR)
                                                                    │
                                                              ┌──────┴──────┐
                                                           (MULTIPLE CHOICE
                                                            no skip, continue)
                                                              │
                                                              ▼
RQE (TARIF) → RQF (STAFF TABLE) → RQG (ADA DAFTAR DIAGNOSIS?)
                                                        │
                                                  ┌──────┴──────┐
                                                YA            TIDAK
                                                  │            │
                                                  ▼            ▼
                                               RQH          RQJ
                                               (SALINAN    (SKIP RQH,
                                                DIAGNOSIS)  LANGSUNG)
                                                  │           
                                                  ▼           
                                               RQI (RENTANG USIA)
                                                  │
                                                  ▼
                                               RQJ (KERJASAMA RUJUKAN)
```

### Day Care Detail: DQA → DQF

```
DQA (NAMA) → DQB (INTERVENSI TABLE) → DQC (STAFF TABLE) → DQD (JENIS KELAMIN)
                                                                       │
                                                                       ▼
                                                                  DQE (BATASAN USIA)
                                                                     │
                                                            ┌────────┴────────┐
                                                          YA              TIDAK
                                                            │              │
                                                            ▼              ▼
                                                         DQF           (end)
                                                         (KETERKAITAN)
```

### Rawat Jalan Detail: OQA → OQE

```
OQA (NAMA) → OQB (INTERVENTION MATRIX) → OQC (ADA DAFTAR DIAGNOSIS?)
                                                          │
                                                    ┌──────┴──────┐
                                                  YA            TIDAK
                                                    │              │
                                                    ▼              ▼
                                                 OQD           OQE
                                                 (SALINAN)    (SKIP OQD,
                                                              LANGSUNG)
                                                    │
                                                    ▼
                                                 OQE (STAFF TABLE)
```

### Aksesibilitas Detail: AQA → AQG

All AQA-AQG are SINGLE_CHOICE with no conditional skip (all choices go to next sequentially).

### Informasi Detail: IQA → IQM

```
IQA (NAMA) → IQB (SOSIAL MEDIA/WEBSITE)
                         │
                  ┌──────┴──────┐
            MULTIPLE CHOICE   (continues)
            (no skip logic)
                 │
                 ▼
            IQC (KONSULTASI BERBAYAR?)
                  │
            ┌──────┴──────┐
          YA            TIDAK
            │              │
            ▼              ▼
         IQD            IQE
         (TARIF)      (INFO BERBAYAR?)
                       │
                 ┌─────┴─────┐
               YA           TIDAK
                 │             │
                 ▼             ▼
              IQF            IQL
              (TARIF)       (JAM OP)
                 │             │
                 └──────┬──────┘
                        ▼
                   IQL (JAM OP)
                        │
                        ▼
                   IQM (KETERKAITAN)
```

---

## COMPLETE BRANCHING SUMMARY

### After Q4 Jawaban → QL1/QL2 selection:

| QL1/QL2 choice | → Next section |
|----------------|----------------|
| R | → RQ1 → (answer-based) → RQA → RQB → ... → RQJ |
| D | → DQ1 → (answer-based) → DQA → DQB → ... → DQF |
| O | → OQ1 → (answer-based) → OQA → OQB → ... → OQE |
| A | → AQ1 → AQ2 → ... → AQ6 → AQA → ... → AQG |
| I | → IQ1 → IQ2 → IQ3 → IQ4 → IQA → ... → IQM |

### Key Answer-Based Branch Points:

| Question | Choice | → Next |
|----------|--------|--------|
| RQ1 | AKUT | RQ2 |
| RQ1 | NON-AKUT | RQ5 |
| RQ2 | Dokter Jaga 24 Jam | RQ3 |
| RQ2 | Tidak Ada | RQ4 |
| RQ3 | R1 / R2 | RQA |
| RQ4 | R3.1.1 / R3.1.2 | RQA |
| RQ5 | DOKTER_24 | RQ6 |
| RQ5 | NON_DOKTER_24 | RQ8 |
| RQ8 | BATASAN_TDK_DITETAPKAN | RQ13 |
| DQ1 | AKUT | DQ2 |
| DQ1 | NON-AKUT | DQ5 |
| DQ2 | DO | DQ3 |
| DQ2 | D1 | DQ4 |
| DQ5 | PEKERJAAN | DQ6 |
| DQ5 | TERSTRUKTUR_NON_PEKERJAAN | DQ12 |
| DQ5 | PERSIAPAN_KERJA | DQ9 |
| DQ5 | TIDAK_TERSTRUKTUR | DQ15 |
| OQ1 | AKUT | OQ2 |
| OQ1 | NON_AKUT | OQ9 |
| OQ2 | LAYANAN_KUNJUNGAN | OQ3 (AKUT) / OQ10 (NON-AKUT) |
| OQ2 | LAYANAN_FASILITAS | OQ6 (AKUT) / OQ16 (NON-AKUT) |
| OQ9 | LAYANAN_KUNJUNGAN | OQ10 |
| OQ9 | LAYANAN_FASILITAS | OQ16 |
