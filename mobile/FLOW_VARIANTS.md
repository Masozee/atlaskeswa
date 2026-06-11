# Mobile Survey Flow Variants

All branching + special-case routing rules implemented in [mobile/lib/question-logic.ts](lib/question-logic.ts). Counts: **5 sections**, **11 detail-block families**, **6 payment-tariff toggles**, **8 context-driven routing rules**, **1 stale-target patch**, **1 consent sentinel**, **4 matrix-kegiatan variants**.

## Sections (top-level branching)

Driven by `show_condition` JSON on each section. Evaluated by `getActiveSections` → `evaluateShowCondition`.

| Section | Code | Gate |
|---|---|---|
| Data Dasar | `DATA_DASAR` | always |
| Jenis Layanan | `JENIS_LAYANAN` | always |
| Faskes detail | `FASKSES` | `Q4 in ['1','2','3','4','5']` |
| Non-Faskes detail | `NON-FASKES` | `Q4 in ['6','7','8','9','10','11','12']` |
| Detail (inline-only) | `DETAIL` | `_inline_only_` sentinel — never visited directly; reached only via cross-section jump |

## Detail block families

Triggered by `QL1` (faskes) or `QL2` (non-faskes) MULTIPLE_CHOICE answers. Each selected branch opens its own inline detail block. All blocks live in section `DETAIL` (sentinel).

| Trigger value | Family | Entry question |
|---|---|---|
| `QL1` contains `R` | Rawat inap (faskes) | `RQ1` chain |
| `QL1` contains `D` | Daily care (faskes) | `DQ1` chain |
| `QL1` contains `O` | Outpatient (faskes) | `OQ1` chain |
| `QL1` contains `A` | Access (faskes) | `AQ1` chain |
| `QL1` contains `I` | Info (faskes) | `IQ1` chain |
| `QL2` contains `SR` | Social rawat inap | `SRQ1` chain |
| `QL2` contains `SD` | Social daily | `SDQ1` chain |
| `QL2` contains `SO` | Social outpatient | `SOQ1` chain |
| `QL2` contains `SA` | Social access | `SAQ1` chain |
| `QL2` contains `SI` | Social info | `SIQ1` chain |

Each family loops one block per selected branch (cross-section jump via `next_question_code` into the `DETAIL` sentinel section).

## Context-driven sub-routing inside detail blocks

Hardcoded in `getFlowItems` because the next-target depends on `_contextKey` (the value of the question that triggered the cross-section jump), not on the current answer.

| At question | Branch on contextKey | Target |
|---|---|---|
| `IQ3` (answer = `I2.1`) | n/a | `IQ4` |
| `IQB` | `/^I1\./` | `IQD` |
| `IQB` | `I2.1.2` | `IQC` |
| `IQB` | `I2.1.1` or `I2.2` | `IQG` |
| `IQC` | (always) | `IQG` |
| `DQA` | `D(?:4\|8)\.(1\|2\|3\|4)` | `DQB${1..4}` |
| `SDQA` | `SD3\.[12]\.(1\|2\|3\|4)` | `SDQB${1..4}` |
| `OQA` | `O\d+\.(1\|2)(?:\.\d+)?` | `OQB${1..2}` |
| `SOQA` | `SO2\.[123]\.(1\|2)` | `SOQB${1..2}` |
| `SIQB` | `/^SI1\./` | `SIQD` |
| `SIQB` | `SI2.1.2` | `SIQC` |
| `SIQB` | `SI2.1.1` or `SI2.2` | `SIQG` |
| `SIQC` | (always) | `SIQG` |

## Stale template patch

| At question | Trigger | Override |
|---|---|---|
| `SOQ8` | answer = `SO2.2.2` | force `nextCode = 'SOQA'` (template's `SOQ8A` target doesn't exist) |

## Payment-tariff toggles

6 sibling payment MULTIPLE_CHOICE questions. Tariff sub-question only shown when PEMBAYARAN MANDIRI is among selected values. Match either current value `'3'` or legacy label string `'PEMBAYARAN MANDIRI OLEH KLIEN/PASIEN/KELUARGA'`.

| Payment question | If mandiri → | Else → |
|---|---|---|
| `RQH` | `RQI` (tariff) → `RQJ` | `RQJ` |
| `SRQH` | `SRQI` → `SRQJ` | `SRQJ` |
| `DQK` | `DQL` → `DQM` | `DQM` |
| `SDQK` | `SDQL` → `SDQM` | `SDQM` |
| `OQK` | `OQL` → `OQM` | `OQM` |
| `SOQK` | `SOQL` → `SOQM` | `SOQM` |

## Consent sentinel

| Sentinel value | Behavior |
|---|---|
| `_END_` (returned as `next_question_code`) | Emit `{ kind: 'end_survey' }`, terminate flow — survey saves on next tap |

## MATRIX_KEGIATAN variants

`config.matrix_variant` on `Question.table_config` selects preset activities. All variants render the same UI (activity name list — **no day selector** since 2026-05-24). All 14 MATRIX_KEGIATAN questions use one of these.

| Variant | Preset activities | Questions |
|---|---|---|
| `kesehatan` | PSIKOTERAPI / KONSELING / TERAPI KELOMPOK / PEMANTAUAN PENGGUNAAN OBAT / EDUKASI KESEHATAN JIWA | `DQB1`, `SDQB1` |
| `pendidikan` | PELATIHAN MENJAHIT / MEMASAK / KERAJINAN / KESIAPAN KERJA / PENDIDIKAN NON FORMAL | `DQB2`, `SDQB2` |
| `sosial_budaya` | KELOMPOK DUKUNGAN SEBAYA / KEGIATAN REKREASI / OLAHRAGA / KEGIATAN KOMUNITAS / KEAGAMAAN | `DQB3`, `SDQB3` |
| `custom` | (none — user adds rows) | `DQB`, `DQB4`, `OQB1`, `OQB2`, `SDQB`, `SDQB4`, `SOQB1`, `SOQB2` |

Stored shape: `Array<{ nama_kegiatan: string }>` (legacy answers may still carry a `hari: string[]` field which is read-tolerated but never updated).

## Generic flow primitives (no special-case)

For everything outside the tables above, navigation is driven by data on the Question + QuestionChoice rows:

| Field | Source | Effect |
|---|---|---|
| `show_condition` (Question / Section) | JSON: `{ operator: 'in'\|'not_in'\|'contains'\|'and'\|'or'\|'equals'\|'not_equals', value, question_code, conditions[] }` | Evaluated by `evaluateShowCondition` to gate visibility |
| `next_question_code` (Choice) | string | Within-section jump after the choice is picked |
| `skip_logic[0].goto` (Question) | string (when no choices) | Sequential forward-jump |
| `introduction_text` (Question) | string | Prepended as a separate `{ kind: 'hint' }` flow item before the question |

## Verification cheat sheet

End-to-end test order to cover all branches: faskes-RSU → walk RQ family → MANDIRI both branches; faskes-PUSKESMAS with `D` → DQ family covering D4.1/4.2/4.3/4.4 + D8.x; faskes with `I` → IQ3 = `I2.1` → IQ4 → IQB context covering I1.x/I2.1.1/I2.1.2/I2.2; non-faskes-LSM → SR/SD/SO/SA/SI families; deny consent → `_END_` sentinel.
