# OMMHA_V1 Survey — Complete Step Flow

All branches. Each step shows question code, type, text (abbreviated), and every choice with its destination.

Legend:
- `→ NEXT` = goes to next question in sequence
- `→ CODE` = jumps to that question code
- `→ [DETAIL]` = opens inline detail block
- `→ END` = terminates section/survey
- `_inline_only_` = section only entered via cross-section jump

---

## SECTION 1: DATA_DASAR (Basic Data)

All questions sequential unless stated.

**Q1** TEXT — Nama resmi fasilitas
→ Q2

**Q2** SINGLE_CHOICE — Apakah fasilitas ini beroperasi / aktif?
| Value | Label | Next |
|---|---|---|
| 1 | Ya | → Q3 |
| 0 | Tidak | → END |

**Q3** SINGLE_CHOICE — Bidang pelayanan fasilitas
| Value | Label | Next |
|---|---|---|
| 1 | Kesehatan jiwa | → Q4 |
| 2 | Sosial kemasyarakatan | → Q4 |
| 3 | Pendidikan | → Q4 |
| 4 | Lainnya | → Q4 |

**Q4** SINGLE_CHOICE — Jenis fasilitas *(routes to QL1 or QL2)*
| Value | Label | Next |
|---|---|---|
| 1–5 | (healthcare types) | → Q5, unlock QL1 |
| 6–12 | (non-healthcare types) | → Q5, unlock QL2 |

**Q5** GEO_PROVINSI — Provinsi → Q6

**Q6** GEO_KABUPATEN — Kabupaten/Kota → Q7

**Q7** GEO_KECAMATAN — Kecamatan → Q8

**Q8** GEO_DESA — Desa/Kelurahan → Q9

**Q9** TEXTAREA — Alamat lengkap → Q10

**Q10** PHONE — Nomor telepon → Q11

**Q11** EMAIL — Email → Q12

**Q12** URL — Website → Q13

**Q13** SINGLE_CHOICE — Status badan hukum → Q14

**Q14** SINGLE_CHOICE — Dokumentasi legalitas → Q15

**Q15** SINGLE_CHOICE — Tahun mulai beroperasi → Q16

**Q16** MULTIPLE_CHOICE — Cakupan wilayah layanan → END of section

---

## SECTION 2: JENIS_LAYANAN (Service Type Selection)

### QL1 — Healthcare (shown if Q4 ∈ [1–5])
MULTIPLE_CHOICE — Pilih jenis layanan kesehatan jiwa
| Value | Label | Opens detail for |
|---|---|---|
| R | Rawat Inap | RQ1 → … → [DETAIL R] |
| D | Perawatan Harian | DQ1 → … → [DETAIL D] |
| O | Rawat Jalan | OQ1 → … → [DETAIL O] |
| A | Aksesibilitas | AQ1 → … → [DETAIL A] |
| I | Informasi & Konsultasi | IQ1 → … → [DETAIL I] |

### QL2 — Non-Healthcare (shown if Q4 ∈ [6–12])
MULTIPLE_CHOICE — Pilih jenis layanan sosial
| Value | Label | Opens detail for |
|---|---|---|
| SR | Rawat Inap Sosial | SRQ1 → … → [DETAIL SR] |
| SD | Perawatan Harian Sosial | SDQ1 → … → [DETAIL SD] |
| SO | Rawat Jalan Sosial | SOQ1 → … → [DETAIL SO] |
| SA | Aksesibilitas Sosial | SAQ1 → … → [DETAIL SA] |
| SI | Informasi Sosial | SIQ1 → … → [DETAIL SI] |

Each selected service opens its own intake chain below, then its detail block.

---

## SECTION 3: FASKES — Healthcare Intake Chains

### ─── R: RAWAT INAP (Inpatient) ───

**RQ1** MULTIPLE_CHOICE — Jenis rawat inap
| Value | Label | Next |
|---|---|---|
| 1 | Akut | → RQ2 |
| 2 | Non-Akut | → RQ5 |

**RQ2** SINGLE_CHOICE — Dokter jaga 24 jam?
| Value | Next |
|---|---|
| 1 (Ya) | → RQ3 |
| R3 | → RQ4 |

**RQ3** SINGLE_CHOICE — Pemantauan 24 jam?
| Value | Label | Next |
|---|---|---|
| R1 | Ya, intensif | → [DETAIL R] |
| R2 | Ya, sebagian | → [DETAIL R] |

**RQ4** SINGLE_CHOICE — Layanan utama tersedia?
| Value | Label | Next |
|---|---|---|
| R3.1.1 | Penanganan krisis | → [DETAIL R] |
| R3.1.2 | Stabilisasi | → [DETAIL R] |

**RQ5** SINGLE_CHOICE — Karakteristik rawat inap non-akut
| Value | Label | Next |
|---|---|---|
| 1 | Berbasis waktu (ada batas) | → RQ8 |
| 2 | Tanpa batas waktu | → RQ6 or RQ7 |
| R14 | Komunitas terapeutik | → [DETAIL R] |

*(RQ6 shown if Q4∈[1,2]; RQ7 shown if Q4∉[1,2])*

**RQ6** SINGLE_CHOICE
| Value | Label | Next |
|---|---|---|
| R4 | … | → [DETAIL R] |
| R6 | … | → [DETAIL R] |

**RQ7** SINGLE_CHOICE
| Value | Label | Next |
|---|---|---|
| R5 | … | → [DETAIL R] |
| R7 | … | → [DETAIL R] |

**RQ8** SINGLE_CHOICE — Batas waktu ditentukan oleh?
| Value | Label | Next |
|---|---|---|
| 1 | Ketersediaan staf/klinik | → RQ9 |
| 2 | Koordinasi layanan kesehatan | → RQ13 |

**RQ9** SINGLE_CHOICE — Ketersediaan staf
| Value | Next |
|---|---|
| R8 | → RQ10 |
| R9 | → RQ11 |
| R10 | → RQ12 |

**RQ10** SINGLE_CHOICE — Durasi R8
| Value | Next |
|---|---|
| R8.1 | → [DETAIL R] |
| R8.2 | → [DETAIL R] |

**RQ11** SINGLE_CHOICE — Durasi R9
| Value | Next |
|---|---|
| R9.1 | → [DETAIL R] |
| R9.2 | → [DETAIL R] |

**RQ12** SINGLE_CHOICE — Durasi R10
| Value | Next |
|---|---|
| R10.1 | → [DETAIL R] |
| R10.2 | → [DETAIL R] |

**RQ13** MULTIPLE_CHOICE — Koordinasi layanan kesehatan
| Value | Label | Next |
|---|---|---|
| R11 | … | → [DETAIL R] |
| R12 | … | → [DETAIL R] |
| R3.1.2 | … | → [DETAIL R] |

---

### ─── D: PERAWATAN HARIAN (Day Care) ───

**DQ1** MULTIPLE_CHOICE — Jenis perawatan harian
| Value | Label | Next |
|---|---|---|
| 1 | Akut | → DQ2 |
| 2 | Non-Akut | → DQ5 |

**DQ2** SINGLE_CHOICE — Frekuensi
| Value | Label | Next |
|---|---|---|
| D0 | Harian penuh | → DQ3 |
| D1 | Sebagian hari | → DQ4 |

**DQ3** SINGLE_CHOICE — Intensitas
| Value | Next |
|---|---|
| D0.1 | → [DETAIL D] |
| D0.2 | → [DETAIL D] |

**DQ4** SINGLE_CHOICE
| Value | Next |
|---|---|
| D1.1 | → [DETAIL D] |
| D1.2 | → [DETAIL D] |

**DQ5** MULTIPLE_CHOICE — Fokus non-akut (pilih semua yang berlaku)
| Value | Label | Next |
|---|---|---|
| 1 | Bekerja dgn upah | → DQ6 |
| 2 | Bekerja tanpa upah | → DQ9 |
| 3 | Pelatihan/kegiatan | → DQ12 |
| 4 | Jaringan komunitas | → DQ15 |

**DQ6** SINGLE_CHOICE — Bekerja dengan upah
| Value | Next |
|---|---|
| D2 | → DQ7 |
| D6 | → DQ8 |

**DQ7** SINGLE_CHOICE
| Value | Next |
|---|---|
| D2.1 / D2.2 | → [DETAIL D] |

**DQ8** SINGLE_CHOICE
| Value | Next |
|---|---|
| D6.1 / D6.2 | → [DETAIL D] |

**DQ9** SINGLE_CHOICE — Bekerja tanpa upah
| Value | Next |
|---|---|
| D3 | → DQ10 |
| D7 | → DQ11 |

**DQ10 / DQ11** SINGLE_CHOICE → [DETAIL D]

**DQ12** SINGLE_CHOICE — Pelatihan / kegiatan
| Value | Next |
|---|---|
| D4 | → DQ13 |
| D8 | → DQ14 |

**DQ13** MULTIPLE_CHOICE — Jenis kegiatan (D4 context)
| Value | Context Key | Detail block |
|---|---|---|
| D4.1 | D4.1 | → DQB1 (kesehatan) |
| D4.2 | D4.2 | → DQB2 (pendidikan) |
| D4.3 | D4.3 | → DQB3 (sosial_budaya) |
| D4.4 | D4.4 | → DQB4 (custom) |

**DQ14** MULTIPLE_CHOICE — Jenis kegiatan (D8 context)
| Value | Context Key | Detail block |
|---|---|---|
| D8.1 | D8.1 | → DQB1 |
| D8.2 | D8.2 | → DQB2 |
| D8.3 | D8.3 | → DQB3 |
| D8.4 | D8.4 | → DQB4 |

**DQ15** SINGLE_CHOICE — Jaringan komunitas
| Value | Next |
|---|---|
| D5 / D9 | → [DETAIL D] |

---

### ─── O: RAWAT JALAN (Outpatient) ───

**OQ1** MULTIPLE_CHOICE — Jenis rawat jalan
| Value | Label | Next |
|---|---|---|
| 1 | Akut | → OQ2 |
| 2 | Non-Akut | → OQ9 |

#### Akut branch

**OQ2** MULTIPLE_CHOICE — Berbasis kunjungan atau fasilitas?
| Value | Next |
|---|---|
| 1 (Kunjungan) | → OQ3 |
| 2 (Fasilitas) | → OQ6 |

**OQ3** SINGLE_CHOICE — Ketersediaan kunjungan
| Value | Next |
|---|---|
| O1 | → OQ4 |
| O2 | → OQ5 |

**OQ4** MULTIPLE_CHOICE — Fokus O1
| Value | Context | Next |
|---|---|---|
| O1.1 | O1.1 → OQB1 | → [DETAIL O] |
| O1.2 | O1.2 → OQB2 | → [DETAIL O] |

**OQ5** MULTIPLE_CHOICE — Fokus O2
| Value | Context | Next |
|---|---|---|
| O2.1 | O2.1 → OQB1 | → [DETAIL O] |
| O2.2 | O2.2 → OQB2 | → [DETAIL O] |

**OQ6** SINGLE_CHOICE — Ketersediaan fasilitas
| Value | Next |
|---|---|
| O3 | → OQ7 |
| O4 | → OQ8 |

**OQ7** MULTIPLE_CHOICE — Fokus O3
| Value | Context | Next |
|---|---|---|
| O3.1 | → OQB1 | → [DETAIL O] |
| O3.2 | → OQB2 | → [DETAIL O] |

**OQ8** MULTIPLE_CHOICE — Fokus O4
| Value | Context | Next |
|---|---|---|
| O4.1 | → OQB1 | → [DETAIL O] |
| O4.2 | → OQB2 | → [DETAIL O] |

#### Non-Akut branch

**OQ9** MULTIPLE_CHOICE — Berbasis kunjungan atau fasilitas?
| Value | Next |
|---|---|
| 1 (Kunjungan) | → OQ10 |
| 2 (Fasilitas) | → OQ16 |

**OQ10** SINGLE_CHOICE — Frekuensi kunjungan
| Value | Next |
|---|---|
| O5 | → OQ11 |
| O6 | → OQ14 |
| O7 | → OQ15 |

**OQ11** MULTIPLE_CHOICE — Jenis layanan O5
| Value | Next |
|---|---|
| O5.1 (Kesehatan) | → OQ12 |
| O5.2 (Non-kesehatan) | → OQ13 |

**OQ12** SINGLE_CHOICE — Hari per minggu (O5.1)
| Value | Context | Next |
|---|---|---|
| O5.1.1/O5.1.2/O5.1.3 | → OQB1 | → [DETAIL O] |

**OQ13** SINGLE_CHOICE — Hari per minggu (O5.2)
| Value | Context | Next |
|---|---|---|
| O5.2.1/O5.2.2/O5.2.3 | → OQB2 | → [DETAIL O] |

**OQ14** MULTIPLE_CHOICE — Fokus O6
| Value | Context | Next |
|---|---|---|
| O6.1 | → OQB1 | → [DETAIL O] |
| O6.2 | → OQB2 | → [DETAIL O] |

**OQ15** MULTIPLE_CHOICE — Fokus O7
| Value | Context | Next |
|---|---|---|
| O7.1 | → OQB1 | → [DETAIL O] |
| O7.2 | → OQB2 | → [DETAIL O] |

**OQ16** SINGLE_CHOICE — Frekuensi fasilitas
| Value | Next |
|---|---|
| O8 | → OQ17 |
| O9 | → OQ18 |
| O10 | → OQ19 |

**OQ17** MULTIPLE_CHOICE — Fokus O8
| Value | Context | Next |
|---|---|---|
| O8.1 | → OQB1 | → [DETAIL O] |
| O8.2 | → OQB2 | → [DETAIL O] |

**OQ18** MULTIPLE_CHOICE — Fokus O9 → [DETAIL O]

**OQ19** MULTIPLE_CHOICE — Fokus O10 → [DETAIL O]

---

### ─── A: AKSESIBILITAS ───

**AQ1** MULTIPLE_CHOICE — Jenis dukungan aksesibilitas
| Value | Label | Next |
|---|---|---|
| A1 | Transportasi | → AQ2 |
| A2 | Pendampingan | → AQ3 |
| A3 | Alat bantu | → AQ4 |
| A4 | Bahasa isyarat | → AQ5 |
| A5 | Lainnya | → AQ6 |

**AQ2–AQ6** SINGLE_CHOICE (per selected type) → [DETAIL A]

---

### ─── I: INFORMASI & KONSULTASI ───

**IQ1** MULTIPLE_CHOICE — Jenis layanan informasi
| Value | Label | Next |
|---|---|---|
| I1 | Konsultasi/Asesmen | → IQ2 |
| I2 | Penyampaian Informasi | → IQ3 |

**IQ2** MULTIPLE_CHOICE — Jenis konsultasi (I1 context)
| Value | Context | Next |
|---|---|---|
| I1.1 | I1.1 → IQD | → [DETAIL I] |
| I1.2 | I1.2 → IQD | → [DETAIL I] |
| I1.3 | I1.3 → IQD | → [DETAIL I] |
| I1.4 | I1.4 → IQD | → [DETAIL I] |
| I1.5 | I1.5 → IQD | → [DETAIL I] |

**IQ3** MULTIPLE_CHOICE — Mode penyampaian informasi
| Value | Next |
|---|---|
| I2.1 (Interaktif) | → IQ4 |
| I2.2 (Non-interaktif) | → [DETAIL I] via IQG |

**IQ4** MULTIPLE_CHOICE — Metode interaksi
| Value | Context | Next |
|---|---|---|
| I2.1.1 (Tatap muka) | → IQG | → [DETAIL I] |
| I2.1.2 (Via media) | → IQC | → [DETAIL I] |

---

## SECTION 4: NON-FASKES — Social Service Intake Chains

### ─── SR: RAWAT INAP SOSIAL ───

**SRQ1** MULTIPLE_CHOICE — Jenis rawat inap sosial
| Value | Next |
|---|---|
| 1 | → SRQ2 |
| 2 | → SRQ4 |

**SRQ2** SINGLE_CHOICE → SRQ3 → [DETAIL SR]

**SRQ4** MULTIPLE_CHOICE → SRQ5 or SRQ8

**SRQ5–SRQ7** (time-limit branch) → [DETAIL SR]

**SRQ8–SRQ9** (medical coordination branch) → [DETAIL SR]

---

### ─── SD: PERAWATAN HARIAN SOSIAL ───

Mirrors D family. DQ1→SDQ1, etc.

**SDQ1** → SDQ2 or SDQ5 (same logic as DQ1)

**SDQ5** MULTIPLE_CHOICE — same 4 focus areas as DQ5
- SDQ12/SDQ14 → context routing → SDQB1/SDQB2/SDQB3/SDQB4

---

### ─── SO: RAWAT JALAN SOSIAL ───

Mirrors O family.

**SOQ1** MULTIPLE_CHOICE → SOQ2 (kunjungan) or SOQ6 (fasilitas)

**SOQ2–SOQ5** — kunjungan branch with frequency levels → SOQB1/SOQB2

**SOQ6–SOQ9** — fasilitas branch → SOQB1/SOQB2

Note: SOQ8 answer SO2.2.2 hardcoded → SOQA (skip SOQB)

---

### ─── SA: AKSESIBILITAS SOSIAL ───

**SAQ1** MULTIPLE_CHOICE — same 5 types as AQ1
→ SAQ2–SAQ6 → [DETAIL SA]

---

### ─── SI: INFORMASI SOSIAL ───

**SIQ1** MULTIPLE_CHOICE
| Value | Next |
|---|---|
| SI1 | → SIQ2 |
| SI2 | → SIQ3 |

**SIQ2** MULTIPLE_CHOICE — 5 types → context → SIQD → [DETAIL SI]

**SIQ3** MULTIPLE_CHOICE
| Value | Next |
|---|---|
| SI2.1 | → SIQ4 |
| SI2.2 | → SIQG → [DETAIL SI] |

**SIQ4** MULTIPLE_CHOICE
| Value | Context | Next |
|---|---|---|
| SI2.1.1 | → SIQG | → [DETAIL SI] |
| SI2.1.2 | → SIQC | → [DETAIL SI] |

---

## SECTION 5: DETAIL (_inline_only_ — entered via cross-section jump)

Each detail block runs once per selected service context.

---

### ─── [DETAIL R] — Rawat Inap Detail ───

Runs once per R-type selected. Context key = R-code from intake chain.

| Step | Code | Type | Description | Logic |
|---|---|---|---|---|
| 1 | RQA | SINGLE_CHOICE | Nama khusus fasilitas rawat inap | → RQB |
| 2 | RQB | NUMBER | Total tempat tidur | → RQC |
| 3 | RQC | NUMBER | Tempat tidur terisi | → RQD |
| 4 | RQD | MULTIPLE_CHOICE | Jenis kelamin pasien dilayani | → RQE |
| 5 | RQE | MULTIPLE_CHOICE | Rentang usia pasien | → RQF1 |
| 6 | RQF1 | NUMBER | Estimasi jumlah per tahun | → RQF |
| 7 | RQF | SINGLE_CHOICE | Catatan pasien tersedia? | 1→RQG, 0→RQH |
| 8 | RQG | SINGLE_CHOICE | Minta rekap? | → RQH |
| 9 | RQH | MULTIPLE_CHOICE | Metode pembayaran | if 3/MANDIRI → RQI, else → RQJ |
| 10 | RQI | NUMBER | Tarif rata-rata mandiri | → RQJ |
| 11 | RQJ | KEGIATAN_TABLE | Kegiatan layanan | → RQK |
| 12 | RQK | STAFF_TABLE | Data staf | → RQL |
| 13 | RQL | SINGLE_CHOICE | Kemitraan? | → END block |

---

### ─── [DETAIL D] — Perawatan Harian Detail ───

Runs once per D-type context. DQB resolved by context:
- Context D4.1/D8.1 → DQB1 (terkait_kesehatan)
- Context D4.2/D8.2 → DQB2 (pendidikan)
- Context D4.3/D8.3 → DQB3 (sosial_budaya)
- Context D4.4/D8.4 → DQB4 (custom)

| Step | Code | Type | Description | Logic |
|---|---|---|---|---|
| 1 | DQA | SINGLE_CHOICE | Nama khusus | → DQB |
| 2 | DQB/DQB1-4 | MATRIX_KEGIATAN | Kegiatan (preset per context) | → DQC |
| 3 | DQC | SINGLE_CHOICE | ... | → DQD |
| 4 | DQD | SINGLE_CHOICE | ... | → DQE |
| 5 | DQE | SINGLE_CHOICE | ... | → DQF |
| 6 | DQF | MULTIPLE_CHOICE | Jenis kelamin | → DQG |
| 7 | DQG | MULTIPLE_CHOICE | Rentang usia | → DQH |
| 8 | DQH | NUMBER | Estimasi per tahun | → DQI |
| 9 | DQI | SINGLE_CHOICE | Catatan tersedia? | 1→DQJ, 0→DQK |
| 10 | DQJ | SINGLE_CHOICE | Minta rekap? | → DQK |
| 11 | DQK | MULTIPLE_CHOICE | Metode pembayaran | if MANDIRI → DQL, else → DQM |
| 12 | DQL | NUMBER | Tarif rata-rata | → DQM |
| 13 | DQM | STAFF_TABLE | Data staf | → DQN |
| 14 | DQN | SINGLE_CHOICE | Kemitraan? | → END block |

---

### ─── [DETAIL O] — Rawat Jalan Detail ───

Runs once per O-type context. OQB resolved by context:
- Context ends in .1 (health) → OQB1 (terkait_kesehatan preset)
- Context ends in .2 (social) → OQB2 (terkait_sosial preset)

| Step | Code | Type | Description | Logic |
|---|---|---|---|---|
| 1 | OQA | SINGLE_CHOICE | Nama khusus | → OQB |
| 2 | OQB1/OQB2 | MATRIX_KEGIATAN | Kegiatan (preset per context) | → OQC |
| 3 | OQC | SINGLE_CHOICE | ... | → OQD |
| 4 | OQD | SINGLE_CHOICE | ... | → OQE |
| 5 | OQE | SINGLE_CHOICE | ... | → OQF |
| 6 | OQF | MULTIPLE_CHOICE | Jenis kelamin | → OQG |
| 7 | OQG | MULTIPLE_CHOICE | Rentang usia | → OQH |
| 8 | OQH | NUMBER | Estimasi per tahun | → OQI |
| 9 | OQI | SINGLE_CHOICE | Catatan tersedia? | 1→OQJ, 0→OQK |
| 10 | OQJ | SINGLE_CHOICE | Minta rekap? | → OQK |
| 11 | OQK | MULTIPLE_CHOICE | Metode pembayaran | if MANDIRI → OQL, else → OQM |
| 12 | OQL | NUMBER | Tarif rata-rata | → OQM |
| 13 | OQM | STAFF_TABLE | Data staf | → OQN |
| 14 | OQN | SINGLE_CHOICE | Kemitraan? | → END block |

---

### ─── [DETAIL A] — Aksesibilitas Detail ───

| Step | Code | Type | Description | Logic |
|---|---|---|---|---|
| 1 | AQA | SINGLE_CHOICE | Nama dukungan | → AQB |
| 2 | AQB | SINGLE_CHOICE | ... | → AQC |
| 3 | AQC | SINGLE_CHOICE | ... | → AQD or AQE |
| 4 | AQD | SINGLE_CHOICE | ... | → AQE |
| 5 | AQE | SINGLE_CHOICE | ... | → AQF |
| 6 | AQF | STAFF_TABLE | Data staf | → AQG |
| 7 | AQG | SINGLE_CHOICE | Kemitraan? | → END block |

---

### ─── [DETAIL I] — Informasi & Konsultasi Detail ───

Context routing at IQB:
- Context `/^I1\./` → IQD (konsultasi/asesmen path)
- Context `I2.1.2` → IQC (via media path)
- Context `I2.1.1` or `I2.2` → IQG (tatap muka / non-interaktif path)

| Step | Code | Type | Description | Logic |
|---|---|---|---|---|
| 1 | IQA | SINGLE_CHOICE | Nama layanan | → IQB |
| 2 | IQB | — | Context router | → IQC / IQD / IQG |
| 3a | IQC | SINGLE_CHOICE | (via media) | → IQG |
| 3b | IQD | SINGLE_CHOICE | (konsultasi) | → IQE |
| 4 | IQE | SINGLE_CHOICE | ... | → IQF |
| 5 | IQF | SINGLE_CHOICE | ... | → IQG |
| 6 | IQG | SINGLE_CHOICE | ... | → IQH |
| 7 | IQH | MULTIPLE_CHOICE | Jenis kelamin | → IQI |
| 8 | IQI | MULTIPLE_CHOICE | Rentang usia | → IQJ |
| 9 | IQJ | NUMBER | Estimasi per tahun | → IQK |
| 10 | IQK | SINGLE_CHOICE | Catatan? | 1→IQL, 0→IQM |
| 11 | IQL | SINGLE_CHOICE | Rekap? | → IQM |
| 12 | IQM | STAFF_TABLE | Data staf | → IQN |
| 13 | IQN | SINGLE_CHOICE | Kemitraan? | → END block |

---

### ─── [DETAIL SR] — Rawat Inap Sosial Detail ───

Same structure as [DETAIL R] with SR-prefix codes.
SRQA → SRQB → … → SRQL

---

### ─── [DETAIL SD] — Perawatan Harian Sosial Detail ───

Same structure as [DETAIL D] with SD-prefix codes.
SDQB context routing:
- SD3.1.1/SD3.2.1 → SDQB1 (terkait_kesehatan)
- SD3.1.2/SD3.2.2 → SDQB2 (pendidikan)
- SD3.1.3/SD3.2.3 → SDQB3 (sosial_budaya)
- SD3.1.4/SD3.2.4 → SDQB4 (custom)

---

### ─── [DETAIL SO] — Rawat Jalan Sosial Detail ───

Same structure as [DETAIL O] with SO-prefix codes.
SOQB context routing:
- Context ends in .1 → SOQB1
- Context ends in .2 → SOQB2

---

### ─── [DETAIL SA] — Aksesibilitas Sosial Detail ───

Same structure as [DETAIL A] with SA-prefix codes.
SAQA → … → SAQG

---

### ─── [DETAIL SI] — Informasi Sosial Detail ───

Same structure as [DETAIL I] with SI-prefix codes.
SIQB context routing mirrors IQB:
- Context `/^SI1\./` → SIQD
- Context `SI2.1.2` → SIQC
- Context `SI2.1.1` / `SI2.2` → SIQG

---

## Matrix Kegiatan Presets

| Variant key | Used in | Items |
|---|---|---|
| `kesehatan` | (legacy, DQB1/SDQB1 now use terkait_kesehatan) | PSIKOTERAPI, KONSELING, TERAPI KELOMPOK, PEMANTAUAN PENGGUNAAN OBAT, EDUKASI KESEHATAN JIWA |
| `terkait_kesehatan` | DQB1, SDQB1, OQB1, SOQB1 | KONSELING, PSIKOTERAPI, TERAPI FARMAKOLOGIS (PEMBERIAN OBAT PSIKIATRI), EDUKASI PSIKOSOSIAL (PSYCHOEDUCATION), TERAPI AKTIVITAS/REHABILITASI PSIKOSOSIAL, MANAJEMEN KASUS/PENDAMPINGAN |
| `terkait_sosial` | OQB2, SOQB2 | PEMBERIAN NASIHAT, DOA RITUAL ATAU PENDEKATAN SPIRITUAL, PENGOBATAN TRADISIONAL/ALTERNATIF, MENGARAHKAN ATAU MERUJUK KE LAYANAN LAIN |
| `pendidikan` | DQB2, SDQB2 | PELATIHAN MENJAHIT, PELATIHAN MEMASAK, PELATIHAN KERAJINAN, PELATIHAN KESIAPAN KERJA, PENDIDIKAN NON FORMAL |
| `sosial_budaya` | DQB3, SDQB3 | KELOMPOK DUKUNGAN SEBAYA, KEGIATAN REKREASI, OLAHRAGA, KEGIATAN KOMUNITAS, KEGIATAN KEAGAMAAN/SPIRITUAL |
| `custom` | DQB/DQB4/SDQB/SDQB4, OQB1/OQB2, SOQB1/SOQB2 | User-entered rows (blank by default) |

---

## Payment MANDIRI Rule (Hardcoded)

Applies to: RQH, DQK, OQK, SRQH, SDQK, SOQK

If user selects value `3` OR any choice with label containing `PEMBAYARAN MANDIRI` → tariff question shown (RQI/DQL/OQL/etc.)

Otherwise tariff question skipped.

---

## Thank-You Summary Screen

After submit, shows:
- Nama Fasilitas
- Lokasi (city, province)
- **Klasifikasi** — bullet list of leaf MTC codes from answers (e.g. `• R3.1.2 — Layanan Rawat Inap, Akut`)
- Bentuk Kelembagaan (Q4 label or service kategori)
- Tanggal Survei
- Status: Tersimpan
