# Test Flow Report — DQ1 / Day Care (Non-Akut) Path

**QL1 answer**: `['D']` (Day Care / Pelatihan Harian)
**Facility type**: Non-RS (e.g., BALAI_REHABILITASI)

---

## Section: FASKSES — Day Care (DQ) Block

### Entry
QL1 `D` → next: `DQ1` (entry point for Day Care block)

---

## DQ1: Jenis layanan perawatan harian

```
DQ1 (SINGLE_CHOICE)
├──[AKUT] → DQ2
└──[NON-AKUT] → DQ5
```

---

## Branch: AKUT → DQ2

### DQ2: Pola pemberian layanan

```
DQ2 (SINGLE_CHOICE)
├──[DO/EPISODIK] → DQ3
└──[D1/BERKELANJUTAN] → DQ4
```

---

### DQ3: Intensitas untuk episodik

```
DQ3 (SINGLE_CHOICE)
├──[D0.1/INTENSIF] → DQA
└──[D0.2/NON-INTENSIF] → DQA
```

---

### DQ4: Intensitas untuk berkelanjutan

```
DQ4 (SINGLE_CHOICE)
├──[D1.1/INTENSIF] → DQA
└──[D1.2/NON-INTENSIF] → DQA
```

---

## Branch: NON-AKUT → DQ5

### DQ5: Fokus utama layanan (MULTIPLE_CHOICE)

```
DQ5 (MULTIPLE_CHOICE) — each selected answer goes to different path
├──[PEKERJAAN] → DQ6 (Pekerjaan)
├──[TERSTRUKTUR_NON_PEKERJAAN] → DQ12 (Terstruktur Non-Pekerjaan)
├──[PERSIAPAN_KERJA] → DQ9 (Program Persiapan Kerja)
└──[TIDAK_TERSTRUKTUR] → DQ15 (Tidak Terstruktur)

All paths converge at DQA → ... → DQF
```

---

### DQ6: Intensitas — Pekerjaan path

```
DQ6 (SINGLE_CHOICE)
├──[D2/INTENSITAS TINGGI] → DQ7
└──[D6/INTENSITAS RENDAH] → DQ8
```

---

### DQ7: Ketentuan — Intensitas Tinggi

```
DQ7 (SINGLE_CHOICE)
├──[D2.1/KETENTUAN UMUM] → DQA
└──[D2.2/KETENTUAN KHUSUS] → DQA
```

---

### DQ8: Ketentuan — Intensitas Rendah

```
DQ8 (SINGLE_CHOICE)
├──[D6.1/KETENTUAN UMUM] → DQA
└──[D6.2/KETENTUAN KHUSUS] → DQA
```

---

### DQ9: Intensitas — Persiapan Kerja path

```
DQ9 (SINGLE_CHOICE)
├──[D3/INTENSITAS TINGGI] → DQ10
└──[D7/INTENSITAS RENDAH] → DQ11
```

---

### DQ10: Batasan Waktu — Intensitas Tinggi

```
DQ10 (SINGLE_CHOICE)
├──[D3.1/SUDAH DITETAPKAN] → DQA
└──[D3.2/TIDAK DITETAPKAN] → DQA
```

---

### DQ11: Batasan Waktu — Intensitas Rendah

```
DQ11 (SINGLE_CHOICE)
├──[D7.1/SUDAH DITETAPKAN] → DQA
└──[D7.2/TIDAK DITETAPKAN] → DQA
```

---

### DQ12: Intensitas — Terstruktur Non-Pekerjaan path

```
DQ12 (SINGLE_CHOICE)
├──[D4/INTENSITAS TINGGI] → DQ13
└──[D8/INTENSITAS RENDAH] → DQ14
```

---

### DQ13: Fokus — Intensitas Tinggi

```
DQ13 (SINGLE_CHOICE)
├──[D4.1/KESEHATAN] → DQA
├──[D4.2/PENDIDIKAN] → DQA
├──[D4.3/SOSIAL DAN BUDAYA] → DQA
└──[D4.4/LAINNYA] → DQA
```

---

### DQ14: Fokus — Intensitas Rendah

```
DQ14 (SINGLE_CHOICE)
├──[D8.1/KESEHATAN] → DQA
├──[D8.2/PENDIDIKAN] → DQA
├──[D8.3/SOSIAL DAN BUDAYA] → DQA
└──[D8.4/LAINNYA] → DQA
```

---

### DQ15: Intensitas — Tidak Terstruktur path

```
DQ15 (SINGLE_CHOICE)
├──[D5/INTENSITAS TINGGI] → DQA
└──[D9/INTENSITAS RENDAH] → DQA
```

---

## Detail Chain: DQA → DQF → END (same pattern as Rawat Inap RQA→RQJ)

```
DQA (TEXT) — Nama layanan
     ↓
DQB (REPEATING_TABLE) — Program intervensi
     ↓
DQC (STAFF_TABLE) — Jumlah staf
     ↓
DQD (SINGLE_CHOICE) — Jenis kelamin pasien
     ↓
DQE (SINGLE_CHOICE) — Batasan usia
     ↓
DQF (SINGLE_CHOICE) — Keterkaitan dengan layanan lain
     ↓
END OF DAY CARE BLOCK
```

---

## Expected Paths (Simplified)

### Test 1: QL1 = ['D'], DQ1 = AKUT, DQ2 = DO (Episodik), DQ3 = D0.1 (Intensif)
```
QL1 → DQ1(AKUT) → DQ2(DO) → DQ3(D0.1) → DQA → DQB → DQC → DQD → DQE → DQF → END
```
Questions: 11

### Test 2: QL1 = ['D'], DQ1 = AKUT, DQ2 = D1 (Berkelanjutan), DQ4 = D1.2 (Non-Intensif)
```
QL1 → DQ1(AKUT) → DQ2(D1) → DQ4(D1.2) → DQA → DQB → DQC → DQD → DQE → DQF → END
```
Questions: 11

### Test 3: QL1 = ['D'], DQ1 = NON-AKUT, DQ5 = PEKERJAAN, DQ6 = D2 (Tinggi), DQ7 = D2.1
```
QL1 → DQ1(NON-AKUT) → DQ5(PEKERJAAN) → DQ6(D2) → DQ7(D2.1) → DQA → DQB → DQC → DQD → DQE → DQF → END
```
Questions: 12

### Test 4: QL1 = ['D'], DQ1 = NON-AKUT, DQ5 = [PEKERJAAN, TERSTRUKTUR_NON_PEKERJAAN]
```
QL1 → DQ1(NON-AKUT) → DQ5([PEKERJAAN,TERSTRUKTUR])
  → (PEKERJAAN path) DQ6 → DQ7 → DQA
  → (TERSTRUKTUR path) DQ12 → DQ13 → DQA
  → DQB → DQC → DQD → DQE → DQF → END
```
Questions: 15+ (two detail chains merged)

### Test 5: QL1 = ['D'], DQ1 = NON-AKUT, DQ5 = PERSIAPAN_KERJA, DQ9 = D3 (Tinggi), DQ10 = D3.1
```
QL1 → DQ1(NON-AKUT) → DQ5(PERSIAPAN_KERJA) → DQ9(D3) → DQ10(D3.1) → DQA → DQB → DQC → DQD → DQE → DQF → END
```
Questions: 12

### Test 6: QL1 = ['D'], DQ1 = NON-AKUT, DQ5 = TIDAK_TERSTRUKTUR, DQ15 = D5 (Tinggi)
```
QL1 → DQ1(NON-AKUT) → DQ5(TIDAK_TERSTRUKTUR) → DQ15(D5) → DQA → DQB → DQC → DQD → DQE → DQF → END
```
Questions: 11

---

## Question Count Summary

| Path | Questions (before detail) | Detail chain | Total |
|------|--------------------------|--------------|-------|
| AKUT → Episodik → Intensif | DQ1,DQ2,DQ3 | DQA-DQF (6) | 9 |
| AKUT → Berkeleanjutan → Non-Intensif | DQ1,DQ2,DQ4 | DQA-DQF (6) | 9 |
| NON-AKUT → PEKERJAAN → Tinggi | DQ1,DQ5,DQ6,DQ7 | DQA-DQF (6) | 10 |
| NON-AKUT → PEKERJAAN → Rendah | DQ1,DQ5,DQ6,DQ8 | DQA-DQF (6) | 10 |
| NON-AKUT → TERSTRUKTUR → Tinggi | DQ1,DQ5,DQ12,DQ13 | DQA-DQF (6) | 10 |
| NON-AKUT → TERSTRUKTUR → Rendah | DQ1,DQ5,DQ12,DQ14 | DQA-DQF (6) | 10 |
| NON-AKUT → PERSIAPAN_KERJA → Tinggi | DQ1,DQ5,DQ9,DQ10 | DQA-DQF (6) | 10 |
| NON-AKUT → PERSIAPAN_KERJA → Rendah | DQ1,DQ5,DQ9,DQ11 | DQA-DQF (6) | 10 |
| NON-AKUT → TIDAK_TERSTRUKTUR → Tinggi | DQ1,DQ5,DQ15 | DQA-DQF (6) | 9 |
| NON-AKUT → TIDAK_TERSTRUKTUR → Rendah | DQ1,DQ5,DQ15 | DQA-DQF (6) | 9 |

---

## Key Observations

1. **DQ5 is MULTIPLE_CHOICE** — surveyor can select multiple focus areas, each leading to a different sub-path
2. **All paths converge at DQA** → DQB → DQC → DQD → DQE → DQF
3. **No cross-referencing between DQ paths** — each selected focus area runs independently
4. **After DQF → survey continues to next QL1 entry or ends**

---

## Known Issues (pending verification)

- [ ] Does `findAllEntryPointsForSection` correctly find multiple entry points for DQ5 selections?
- [ ] Does DQ5 `PEKERJAAN` choice correctly set `cabang_mtc = Pekerjaan`?
- [ ] Does DQF (TIDAK) end the Day Care block correctly?
- [ ] Does the flow continue to next service block (OQ/AQ/IQ) after DQF?
