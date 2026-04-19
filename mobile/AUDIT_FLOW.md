# Survey Audit Flow — SINGLE COMPLETE PATH EXAMPLE

## Example: Standard facility (RSJ), selects [R] in QL1

---

### SECTION 1: DATA_DASAR (linear, Q1–Q16)

```
Q1 → Q2 → Q3 → Q4 → Q5 → Q6 → Q7 → Q8 → Q9 → Q10 → Q11 → Q12 → Q13 → Q14 → Q15 → Q16
                                                                                      │
                                                                                      ▼
                                                                            QL1 [R] selected
                                                                                      │
                                                                                      ▼
```

---

### SECTION 3: FASKES — RAWAT INAP (RQ1–RQ13, then Detail RQA–RQJ)

#### RQ1 Branch: NON-AKUT path

```
RQ1: Layanan rawat inap menerima pasien dengan kondisi apa?
     ○ AKUT
     ● NON-AKUT      ← selected  →  answer = ['NON-AKUT']
                                                 │
                                                 ▼  next_code = RQ5
```

#### RQ5: NON-AKUT → NON_DOKTER_24 path

```
RQ5: Karakteristik layanan rawat inap bagi pasien NON-AKUT?
     ○ DOKTER_24 — dengan dokter jaga 24 jam
     ● NON_DOKTER_24 — tanpa dokter jaga 24 jam  ← selected
                                                 │
                                                 ▼  next_code = RQ6
```

#### RQ6 → RQ7 → RQ8 → RQ10 → RQ11 → RQ12 → RQ13 → detail at each → finish

```
RQ6: Batasan waktu tinggal (dengan dokter jaga 24 jam)?
     ○ BATASAN_TIDAK_ADA
     ● BATASAN_YA — sudah ditetapkan  ← selected
                                         │
                      (no skip) next by order
                                         ▼
RQ7: Batasan waktu tinggal (tanpa dokter jaga 24 jam)?
     ● BATASAN_TIDAK — tidak ditetapkan  ← selected
                                         │
                      (no skip) next by order
                                         ▼
RQ8: Dukungan staf untuk pasien NON-AKUT?
     ● DUKUNGAN_STAF_24JAM — selama 24 jam  ← selected
     ○ DUKUNGAN_STAF_5HARI — ≥5 hari/minggu
     ○ DUKUNGAN_STAF_KURANG — <5 hari/minggu
                                         │
                                         ▼  next_code = RQ10  (skips RQ9)
RQ10: Berapa lama batas waktu tinggal?
      ○ KURANG_DARI_1_BULAN
      ● LEBIH_DARI_1_BULAN  ← selected
                              │
                              ▼  next_code = RQA (detail)
                    ┌──────── DETAIL ────────┐
                    │                        │
                    ▼                        ▼
                  RQA                      RQA
                    │                        │
                    ▼                        ▼
                  RQB                      RQB
                    │                        │
                    ▼                        ▼
                  RQC                      RQC
                    │                        │
                    ▼                        ▼
                  RQD                      RQD
                    │                        │
                    ▼                        ▼
                  RQE                      RQE
                    │                        │
                    ▼                        ▼
                  RQF                      RQF
                    │                        │
                    ▼                        ▼
                  RQG                      RQG
                    │                        │
               ● YA                     ● YA
                    │                        │
                    ▼                        ▼
                  RQH                      RQH
                    │                        │
                    ▼                        ▼
                  RQI                      RQI
                    │                        │
                    ▼                        ▼
                  RQJ                      RQJ
               ● YA                     ● YA
                    │                        │
                    ▼                        ▼
         ── END OF RQ10 DETAIL ──    ── END OF RQ10 DETAIL ──
                    │                        │
                    ▼                        ▼
              next by order             next by order
                    │                        │
                    ▼                        ▼
                 RQ11                     RQ11
                    │                        │
                    ▼                        ▼
            next_code = RQA             next_code = RQA
                    ┌────────────────────────┤
                    │                        │
                    ▼                        ▼
            ┌──────── DETAIL ────────┐  ┌──────── DETAIL ────────┐
            │                        │  │                        │
            ▼                        ▼  ▼                        ▼
          RQA                      RQA RQA                      RQA
            ...                       ... (same detail chain)
            │                        │
            ▼                        ▼
          RQJ                      RQJ
            │                        │
            ▼                        ▼
      ── END OF RQ11 DETAIL ──  ── END OF RQ11 DETAIL ──
                    │                        │
                    ▼                        ▼
              next by order             next by order
                    │                        │
                    ▼                        ▼
                 RQ12                     RQ12
                    │                        │
                    ▼                        ▼
            next_code = RQA             next_code = RQA
                    ┌────────────────────────┤
                    │                        │
                    ▼                        ▼
            ┌──────── DETAIL ────────┐  ┌──────── DETAIL ────────┐
            │                        │  │                        │
            ▼                        ▼  ▼                        ▼
          RQA                      RQA RQA                      RQA
            ...                       ... (same detail chain)
            │                        │
            ▼                        ▼
          RQJ                      RQJ
            │                        │
            ▼                        ▼
      ── END OF RQ12 DETAIL ──  ── END OF RQ12 DETAIL ──
                    │                        │
                    ▼                        ▼
              next by order             next by order
                    │                        │
                    ▼                        ▼
                 RQ13                     RQ13
                    │                        │
                    ▼                        ▼
            next_code = RQA             next_code = RQA
                    ┌────────────────────────┤
                    │                        │
                    ▼                        ▼
            ┌──────── DETAIL ────────┐  ┌──────── DETAIL ────────┐
            │                        │  │                        │
            ▼                        ▼  ▼                        ▼
          RQA                      RQA RQA                      RQA
            ...                       ... (same detail chain)
            │                        │
            ▼                        ▼
          RQJ                      RQJ
            │                        │
            ▼                        ▼
      ── END OF RQ13 DETAIL ──  ── END OF RQ13 DETAIL ──
                    │                        │
                    ▼                        ▼
              ── SELESAI ──           ── SELESAI ──
```

---

### COMPLETE AUDIT PATH

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                          │
│  DATA_DASAR                                                            │
│  Q1→Q2→Q3→Q4→Q5→Q6→Q7→Q8→Q9→Q10→Q11→Q12→Q13→Q14→Q15→Q16             │
│                                                         │              │
│                                                         ▼              │
│                                                   QL1 [R]              │
│                                                         │              │
│                                                         ▼              │
│                                              FASKES                     │
│                                              RQ1[NON-AKUT]              │
│                                                         │              │
│                                                         ▼              │
│                                         RQ5[NON_DOKTER_24]              │
│                                                         │              │
│                                                         ▼              │
│                                             RQ6[BATASAN_YA]             │
│                                                         │              │
│                                                         ▼              │
│                                         RQ7[BATASAN_TIDAK]              │
│                                                         │              │
│                                                         ▼              │
│                                        RQ8[DUKUNGAN_STAF_24JAM]        │
│                                                         │              │
│                                                         ▼              │
│                                                   RQ10                   │
│                                                         │              │
│                                                         ▼              │
│                                              DETAIL (RQA→RQJ)          │
│                                                         │              │
│                                                         ▼              │
│                                                   RQ11                    │
│                                                         │              │
│                                                         ▼              │
│                                              DETAIL (RQA→RQJ)          │
│                                                         │              │
│                                                         ▼              │
│                                                   RQ12                    │
│                                                         │              │
│                                                         ▼              │
│                                              DETAIL (RQA→RQJ)          │
│                                                         │              │
│                                                         ▼              │
│                                                   RQ13                    │
│                                                         │              │
│                                                         ▼              │
│                                              DETAIL (RQA→RQJ)          │
│                                                         │              │
│                                                         ▼              │
│                                                   ── SELESAI ──         │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

### QUESTIONS VISITED IN THIS PATH

| # | Code | Question summary | Answer |
|---|------|-----------------|--------|
| 1 | Q1 | Nama fasilitas | "RSJ Yakkum" |
| 2 | Q2 | Pernah layani ODGJ? | YA |
| 3 | Q3 | Bidang utama | KESEHATAN JIWA |
| 4 | Q4 | Bentuk kelembagaan | RSJ |
| 5–16 | Q5–Q16 | Alamat, telepon, email, dll. | ... |
| 17 | QL1 | Jenis layanan | [R] |
| 18 | RQ1 | Kondisi pasien? | [NON-AKUT] |
| 19 | RQ5 | Karakteristik NON-AKUT? | NON_DOKTER_24 |
| 20 | RQ6 | Batasan (dgn dokter 24j)? | BATASAN_YA |
| 21 | RQ7 | Batasan (tanpa dokter 24j)? | BATASAN_TIDAK |
| 22 | RQ8 | Dukungan staf? | DUKUNGAN_STAF_24JAM |
| 23 | RQ10 | Durasi batas waktu? | LEBIH_DARI_1_BULAN |
| 24 | RQA | Nama layanan | "Unit Rawat Inap" |
| 25 | RQB | Total bed | "30" |
| 26 | RQC | Bed terisi | "22" |
| 27 | RQD | Cara bayar | [UMUM] |
| 28 | RQE | Tarif rata-rata | "2500000" |
| 29 | RQF | Staf (STAFF_TABLE) | ... rows ... |
| 30 | RQG | Ada daftar diagnosis? | YA |
| 31 | RQH | Salinan diagnosis | "2024: ODGJ 15" |
| 32 | RQI | Rentang usia | [18-40] |
| 33 | RQJ | Kerja sama rujukan? | YA |
| 34–46 | RQ11 + DETAIL | (detail for RQ11) | ... |
| 47–59 | RQ12 + DETAIL | (detail for RQ12) | ... |
| 60–72 | RQ13 + DETAIL | (detail for RQ13) | ... |

**Total: 72 question visits (33 base + 13×3 detail groups)**

---

### QUESTIONS NOT VISITED (in this path)

| Code | Why not visited |
|------|-----------------|
| RQ2, RQ3, RQ4 | AKUT path — RQ1 answer was NON-AKUT |
| RQ9 | Only reached after RQ8[DUKUNGAN_STAF_5HARI] or RQ8[DUKUNGAN_STAF_KURANG] |

---

### BRANCH DECISION TABLE (this audit path)

| Question | Answer | next_code | After Detail → |
|----------|--------|-----------|----------------|
| RQ1 | [NON-AKUT] | RQ5 | — |
| RQ5 | NON_DOKTER_24 | RQ6 | — |
| RQ6 | BATASAN_YA | (next by order: RQ7) | — |
| RQ7 | BATASAN_TIDAK | (next by order: RQ8) | — |
| RQ8 | DUKUNGAN_STAF_24JAM | RQ10 | — |
| RQ10 | LEBIH_DARI_1_BULAN | RQA (detail) | → RQ11 |
| RQ11 | (any) | RQA (detail) | → RQ12 |
| RQ12 | (any) | RQA (detail) | → RQ13 |
| RQ13 | (any) | RQA (detail) | → SELESAI |

---

### KEY FLOW RULE

> **The main chain is RQ1→RQ13. Whenever any RQ question's choice points to RQA (detail), the surveyor completes the full detail chain (RQA→RQJ), then returns to continue with the next RQ question in sequence.**

Example: RQ10→detail→RQ11→detail→RQ12→detail→RQ13→detail→SELESAI
