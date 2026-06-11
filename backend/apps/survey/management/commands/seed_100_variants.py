"""
Seed 100 DynamicSurveyResponse records, one per distinct MTC leaf variant.

Each variant spec pins specific branching-question answers so the flow walker
deterministically reaches a unique leaf MTC code (cabang_mtc value).

Inherits flow-walking infrastructure from seed_dynamic_responses.

Usage:
    python manage.py seed_100_variants
    python manage.py seed_100_variants --status VERIFIED
"""
import random
from datetime import timedelta
from decimal import Decimal

from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from apps.directory.models import Service
from apps.survey.management.commands.seed_dynamic_responses import Command as BaseSeeder
from apps.survey.models import DynamicSurveyResponse, SurveyTemplate

from django.contrib.auth import get_user_model
User = get_user_model()

# ---------------------------------------------------------------------------
# 100 variant specs — each pinned to a distinct leaf MTC code
# pins = {question_code: forced_value_or_list}
# q4 = Q4 value (determines QL1 vs QL2)
# ql = QL1 or QL2 forced selection (which service types)
# ---------------------------------------------------------------------------
VARIANTS = [
    # ── R: RAWAT INAP HEALTHCARE (18 variants) ──────────────────────────────
    # Akut branch — with 24hr doctor
    {'desc': 'R1 – Akut, dokter jaga 24hr, pemantauan intensif',
     'q4': '1', 'ql': {'QL1': ['R']},
     'pins': {'RQ1': ['1'], 'RQ2': '1', 'RQ3': 'R1'}},
    {'desc': 'R2 – Akut, dokter jaga 24hr, pemantauan sedang',
     'q4': '2', 'ql': {'QL1': ['R']},
     'pins': {'RQ1': ['1'], 'RQ2': '1', 'RQ3': 'R2'}},
    # Akut — no 24hr doctor
    {'desc': 'R3.1.1 – Akut, tanpa dokter jaga, layanan kesehatan',
     'q4': '3', 'ql': {'QL1': ['R']},
     'pins': {'RQ1': ['1'], 'RQ2': 'R3', 'RQ4': 'R3.1.1'}},
    {'desc': 'R3.1.2 – Akut, tanpa dokter jaga, layanan non-kesehatan',
     'q4': '4', 'ql': {'QL1': ['R']},
     'pins': {'RQ1': ['1'], 'RQ2': 'R3', 'RQ4': 'R3.1.2'}},
    # Non-Akut — unlimited (Q4∈[1,2] → RQ6)
    {'desc': 'R4 – Non-Akut, unlimited, ada batasan waktu (Q4=RSU)',
     'q4': '1', 'ql': {'QL1': ['R']},
     'pins': {'RQ1': ['2'], 'RQ5': '1', 'RQ6': 'R4'}},
    {'desc': 'R6 – Non-Akut, unlimited, tidak ada batasan waktu (Q4=RSU)',
     'q4': '2', 'ql': {'QL1': ['R']},
     'pins': {'RQ1': ['2'], 'RQ5': '1', 'RQ6': 'R6'}},
    # Non-Akut — unlimited (Q4∉[1,2] → RQ7)
    {'desc': 'R5 – Non-Akut, unlimited, ada batasan waktu (Q4=Puskesmas)',
     'q4': '3', 'ql': {'QL1': ['R']},
     'pins': {'RQ1': ['2'], 'RQ5': '1', 'RQ7': 'R5'}},
    {'desc': 'R7 – Non-Akut, unlimited, tidak ada batasan waktu (Q4=Puskesmas)',
     'q4': '4', 'ql': {'QL1': ['R']},
     'pins': {'RQ1': ['2'], 'RQ5': '1', 'RQ7': 'R7'}},
    # Non-Akut — limited, staff availability
    {'desc': 'R8.1 – Non-Akut, staf 24hr, <4 minggu',
     'q4': '1', 'ql': {'QL1': ['R']},
     'pins': {'RQ1': ['2'], 'RQ5': '2', 'RQ8': '1', 'RQ9': 'R8', 'RQ10': 'R8.1'}},
    {'desc': 'R8.2 – Non-Akut, staf 24hr, >4 minggu',
     'q4': '2', 'ql': {'QL1': ['R']},
     'pins': {'RQ1': ['2'], 'RQ5': '2', 'RQ8': '1', 'RQ9': 'R8', 'RQ10': 'R8.2'}},
    {'desc': 'R9.1 – Non-Akut, staf 5hr/wk, <4 minggu',
     'q4': '3', 'ql': {'QL1': ['R']},
     'pins': {'RQ1': ['2'], 'RQ5': '2', 'RQ8': '1', 'RQ9': 'R9', 'RQ11': 'R9.1'}},
    {'desc': 'R9.2 – Non-Akut, staf 5hr/wk, >4 minggu',
     'q4': '4', 'ql': {'QL1': ['R']},
     'pins': {'RQ1': ['2'], 'RQ5': '2', 'RQ8': '1', 'RQ9': 'R9', 'RQ11': 'R9.2'}},
    {'desc': 'R10.1 – Non-Akut, staf <5hr/wk, <4 minggu',
     'q4': '5', 'ql': {'QL1': ['R']},
     'pins': {'RQ1': ['2'], 'RQ5': '2', 'RQ8': '1', 'RQ9': 'RQ10', 'RQ12': 'R10.1'}},
    {'desc': 'R10.2 – Non-Akut, staf <5hr/wk, >4 minggu',
     'q4': '1', 'ql': {'QL1': ['R']},
     'pins': {'RQ1': ['2'], 'RQ5': '2', 'RQ8': '1', 'RQ9': 'RQ10', 'RQ12': 'R10.2'}},
    # Non-Akut — limited, medical coordination
    {'desc': 'R11 – Non-Akut, koordinasi medis, staf 24hr',
     'q4': '2', 'ql': {'QL1': ['R']},
     'pins': {'RQ1': ['2'], 'RQ5': '2', 'RQ8': '2', 'RQ13': 'R11'}},
    {'desc': 'R12 – Non-Akut, koordinasi medis, staf 5hr/wk',
     'q4': '3', 'ql': {'QL1': ['R']},
     'pins': {'RQ1': ['2'], 'RQ5': '2', 'RQ8': '2', 'RQ13': 'R12'}},
    {'desc': 'R13 – Non-Akut, koordinasi medis, staf <5hr/wk',
     'q4': '4', 'ql': {'QL1': ['R']},
     'pins': {'RQ1': ['2'], 'RQ5': '2', 'RQ8': '2', 'RQ13': 'R13'}},
    {'desc': 'R14 – Non-Akut, akomodasi sementara',
     'q4': '5', 'ql': {'QL1': ['R']},
     'pins': {'RQ1': ['2'], 'RQ5': 'R14'}},

    # ── D: PERAWATAN HARIAN HEALTHCARE (22 variants) ─────────────────────────
    # Akut
    {'desc': 'D0.1 – Akut, episodik (<5hr/wk), intensif',
     'q4': '1', 'ql': {'QL1': ['D']},
     'pins': {'DQ1': ['1'], 'DQ2': 'DO', 'DQ3': 'D0.1'}},
    {'desc': 'D0.2 – Akut, episodik (<5hr/wk), non-intensif',
     'q4': '2', 'ql': {'QL1': ['D']},
     'pins': {'DQ1': ['1'], 'DQ2': 'DO', 'DQ3': 'D0.2'}},
    {'desc': 'D1.1 – Akut, berkelanjutan (≥5hr/wk), intensif',
     'q4': '3', 'ql': {'QL1': ['D']},
     'pins': {'DQ1': ['1'], 'DQ2': 'D1', 'DQ4': 'D1.1'}},
    {'desc': 'D1.2 – Akut, berkelanjutan (≥5hr/wk), non-intensif',
     'q4': '4', 'ql': {'QL1': ['D']},
     'pins': {'DQ1': ['1'], 'DQ2': 'D1', 'DQ4': 'D1.2'}},
    # Non-Akut — work with salary
    {'desc': 'D2.1 – Non-Akut, kerja dgn gaji ≥16hr, ketentuan umum',
     'q4': '5', 'ql': {'QL1': ['D']},
     'pins': {'DQ1': ['2'], 'DQ5': ['1'], 'DQ6': 'D2', 'DQ7': 'D2.1'}},
    {'desc': 'D2.2 – Non-Akut, kerja dgn gaji ≥16hr, ketentuan khusus',
     'q4': '1', 'ql': {'QL1': ['D']},
     'pins': {'DQ1': ['2'], 'DQ5': ['1'], 'DQ6': 'D2', 'DQ7': 'D2.2'}},
    {'desc': 'D6.1 – Non-Akut, kerja dgn gaji <16hr, ketentuan umum',
     'q4': '2', 'ql': {'QL1': ['D']},
     'pins': {'DQ1': ['2'], 'DQ5': ['1'], 'DQ6': 'D6', 'DQ8': 'D6.1'}},
    {'desc': 'D6.2 – Non-Akut, kerja dgn gaji <16hr, ketentuan khusus',
     'q4': '3', 'ql': {'QL1': ['D']},
     'pins': {'DQ1': ['2'], 'DQ5': ['1'], 'DQ6': 'D6', 'DQ8': 'D6.2'}},
    # Non-Akut — work without salary
    {'desc': 'D3.1 – Non-Akut, tanpa gaji ≥16hr, ada batasan waktu',
     'q4': '4', 'ql': {'QL1': ['D']},
     'pins': {'DQ1': ['2'], 'DQ5': ['2'], 'DQ9': 'D3', 'DQ10': 'D3.1'}},
    {'desc': 'D3.2 – Non-Akut, tanpa gaji ≥16hr, tanpa batasan waktu',
     'q4': '5', 'ql': {'QL1': ['D']},
     'pins': {'DQ1': ['2'], 'DQ5': ['2'], 'DQ9': 'D3', 'DQ10': 'D3.2'}},
    {'desc': 'D7.1 – Non-Akut, tanpa gaji <16hr, ada batasan waktu',
     'q4': '1', 'ql': {'QL1': ['D']},
     'pins': {'DQ1': ['2'], 'DQ5': ['2'], 'DQ9': 'D7', 'DQ11': 'D7.1'}},
    {'desc': 'D7.2 – Non-Akut, tanpa gaji <16hr, tanpa batasan waktu',
     'q4': '2', 'ql': {'QL1': ['D']},
     'pins': {'DQ1': ['2'], 'DQ5': ['2'], 'DQ9': 'D7', 'DQ11': 'D7.2'}},
    # Non-Akut — training/activities (≥16hr)
    {'desc': 'D4.1 – Non-Akut, pelatihan ≥16hr, terkait kesehatan',
     'q4': '3', 'ql': {'QL1': ['D']},
     'pins': {'DQ1': ['2'], 'DQ5': ['3'], 'DQ12': 'D4', 'DQ13': ['D4.1']}},
    {'desc': 'D4.2 – Non-Akut, pelatihan ≥16hr, terkait pendidikan',
     'q4': '4', 'ql': {'QL1': ['D']},
     'pins': {'DQ1': ['2'], 'DQ5': ['3'], 'DQ12': 'D4', 'DQ13': ['D4.2']}},
    {'desc': 'D4.3 – Non-Akut, pelatihan ≥16hr, sosial & budaya',
     'q4': '5', 'ql': {'QL1': ['D']},
     'pins': {'DQ1': ['2'], 'DQ5': ['3'], 'DQ12': 'D4', 'DQ13': ['D4.3']}},
    {'desc': 'D4.4 – Non-Akut, pelatihan ≥16hr, lainnya',
     'q4': '1', 'ql': {'QL1': ['D']},
     'pins': {'DQ1': ['2'], 'DQ5': ['3'], 'DQ12': 'D4', 'DQ13': ['D4.4']}},
    # Non-Akut — training/activities (<16hr)
    {'desc': 'D8.1 – Non-Akut, pelatihan <16hr, terkait kesehatan',
     'q4': '2', 'ql': {'QL1': ['D']},
     'pins': {'DQ1': ['2'], 'DQ5': ['3'], 'DQ12': 'D8', 'DQ14': ['D8.1']}},
    {'desc': 'D8.2 – Non-Akut, pelatihan <16hr, terkait pendidikan',
     'q4': '3', 'ql': {'QL1': ['D']},
     'pins': {'DQ1': ['2'], 'DQ5': ['3'], 'DQ12': 'D8', 'DQ14': ['D8.2']}},
    {'desc': 'D8.3 – Non-Akut, pelatihan <16hr, sosial & budaya',
     'q4': '4', 'ql': {'QL1': ['D']},
     'pins': {'DQ1': ['2'], 'DQ5': ['3'], 'DQ12': 'D8', 'DQ14': ['D8.3']}},
    {'desc': 'D8.4 – Non-Akut, pelatihan <16hr, lainnya',
     'q4': '5', 'ql': {'QL1': ['D']},
     'pins': {'DQ1': ['2'], 'DQ5': ['3'], 'DQ12': 'D8', 'DQ14': ['D8.4']}},
    # Non-Akut — community
    {'desc': 'D5 – Non-Akut, jaringan komunitas ≥16hr',
     'q4': '1', 'ql': {'QL1': ['D']},
     'pins': {'DQ1': ['2'], 'DQ5': ['4'], 'DQ15': 'D5'}},
    {'desc': 'D9 – Non-Akut, jaringan komunitas <16hr',
     'q4': '2', 'ql': {'QL1': ['D']},
     'pins': {'DQ1': ['2'], 'DQ5': ['4'], 'DQ15': 'D9'}},

    # ── O: RAWAT JALAN HEALTHCARE (20 variants) ──────────────────────────────
    # Akut — visit-based 24hr
    {'desc': 'O1.1 – Akut, kunjungan 24hr, layanan kesehatan',
     'q4': '1', 'ql': {'QL1': ['O']},
     'pins': {'OQ1': ['1'], 'OQ2': ['1'], 'OQ3': 'O1', 'OQ4': ['O1.1']}},
    {'desc': 'O1.2 – Akut, kunjungan 24hr, layanan non-kesehatan',
     'q4': '2', 'ql': {'QL1': ['O']},
     'pins': {'OQ1': ['1'], 'OQ2': ['1'], 'OQ3': 'O1', 'OQ4': ['O1.2']}},
    # Akut — visit-based not 24hr
    {'desc': 'O2.1 – Akut, kunjungan tidak 24hr, layanan kesehatan',
     'q4': '3', 'ql': {'QL1': ['O']},
     'pins': {'OQ1': ['1'], 'OQ2': ['1'], 'OQ3': 'O2', 'OQ5': ['O2.1']}},
    {'desc': 'O2.2 – Akut, kunjungan tidak 24hr, layanan non-kesehatan',
     'q4': '4', 'ql': {'QL1': ['O']},
     'pins': {'OQ1': ['1'], 'OQ2': ['1'], 'OQ3': 'O2', 'OQ5': ['O1.2']}},
    # Akut — facility-based 24hr
    {'desc': 'O3.1 – Akut, fasilitas 24hr, layanan kesehatan',
     'q4': '5', 'ql': {'QL1': ['O']},
     'pins': {'OQ1': ['1'], 'OQ2': ['2'], 'OQ6': 'O3', 'OQ7': ['O3.1']}},
    {'desc': 'O3.2 – Akut, fasilitas 24hr, layanan non-kesehatan',
     'q4': '1', 'ql': {'QL1': ['O']},
     'pins': {'OQ1': ['1'], 'OQ2': ['2'], 'OQ6': 'O3', 'OQ7': ['O3.2']}},
    # Akut — facility-based not 24hr
    {'desc': 'O4.1 – Akut, fasilitas tidak 24hr, layanan kesehatan',
     'q4': '2', 'ql': {'QL1': ['O']},
     'pins': {'OQ1': ['1'], 'OQ2': ['2'], 'OQ6': 'O4', 'OQ8': ['O4.1']}},
    # Non-Akut — visit ≥2x/wk, health
    {'desc': 'O5.1.1 – Non-Akut, kunjungan ≥2x/wk, kesehatan, 3-6hr/wk',
     'q4': '3', 'ql': {'QL1': ['O']},
     'pins': {'OQ1': ['2'], 'OQ9': ['1'], 'OQ10': 'O5', 'OQ11': ['O5.1'], 'OQ12': 'O5.1.1'}},
    {'desc': 'O5.1.2 – Non-Akut, kunjungan ≥2x/wk, kesehatan, setiap hari',
     'q4': '4', 'ql': {'QL1': ['O']},
     'pins': {'OQ1': ['2'], 'OQ9': ['1'], 'OQ10': 'O5', 'OQ11': ['O5.1'], 'OQ12': 'O5.1.2'}},
    {'desc': 'O5.1.3 – Non-Akut, kunjungan ≥2x/wk, kesehatan, setiap hari+menginap',
     'q4': '5', 'ql': {'QL1': ['O']},
     'pins': {'OQ1': ['2'], 'OQ9': ['1'], 'OQ10': 'O5', 'OQ11': ['O5.1'], 'OQ12': 'O5.1.3'}},
    # Non-Akut — visit ≥2x/wk, non-health
    {'desc': 'O5.2.1 – Non-Akut, kunjungan ≥2x/wk, non-kesehatan, 3-6hr/wk',
     'q4': '1', 'ql': {'QL1': ['O']},
     'pins': {'OQ1': ['2'], 'OQ9': ['1'], 'OQ10': 'O5', 'OQ11': ['O5.2'], 'OQ13': 'O5.2.1'}},
    # Non-Akut — visit 1x/wk
    {'desc': 'O6.1 – Non-Akut, kunjungan 1x/wk, kesehatan',
     'q4': '2', 'ql': {'QL1': ['O']},
     'pins': {'OQ1': ['2'], 'OQ9': ['1'], 'OQ10': 'O6', 'OQ14': ['O6.1']}},
    {'desc': 'O6.2 – Non-Akut, kunjungan 1x/wk, non-kesehatan',
     'q4': '3', 'ql': {'QL1': ['O']},
     'pins': {'OQ1': ['2'], 'OQ9': ['1'], 'OQ10': 'O6', 'OQ14': ['O6.2']}},
    # Non-Akut — visit ≤2wk
    {'desc': 'O7.1 – Non-Akut, kunjungan ≤2wk, kesehatan',
     'q4': '4', 'ql': {'QL1': ['O']},
     'pins': {'OQ1': ['2'], 'OQ9': ['1'], 'OQ10': 'O7', 'OQ15': ['O7.1']}},
    {'desc': 'O7.2 – Non-Akut, kunjungan ≤2wk, non-kesehatan',
     'q4': '5', 'ql': {'QL1': ['O']},
     'pins': {'OQ1': ['2'], 'OQ9': ['1'], 'OQ10': 'O7', 'OQ15': ['O7.2']}},
    # Non-Akut — facility ≥2x/wk
    {'desc': 'O8.1 – Non-Akut, fasilitas ≥2x/wk, kesehatan',
     'q4': '1', 'ql': {'QL1': ['O']},
     'pins': {'OQ1': ['2'], 'OQ9': ['2'], 'OQ16': 'O8', 'OQ17': ['O8.1']}},
    {'desc': 'O8.2 – Non-Akut, fasilitas ≥2x/wk, non-kesehatan',
     'q4': '2', 'ql': {'QL1': ['O']},
     'pins': {'OQ1': ['2'], 'OQ9': ['2'], 'OQ16': 'O8', 'OQ17': ['O8.2']}},
    # Non-Akut — facility 1x/wk
    {'desc': 'O9.1 – Non-Akut, fasilitas 1x/wk, kesehatan',
     'q4': '3', 'ql': {'QL1': ['O']},
     'pins': {'OQ1': ['2'], 'OQ9': ['2'], 'OQ16': 'O9', 'OQ18': ['O9.1']}},
    # Non-Akut — facility ≤2wk
    {'desc': 'O10.1 – Non-Akut, fasilitas ≤2wk, kesehatan',
     'q4': '4', 'ql': {'QL1': ['O']},
     'pins': {'OQ1': ['2'], 'OQ9': ['2'], 'OQ16': 'O10', 'OQ19': ['O10.1']}},
    {'desc': 'O10.2 – Non-Akut, fasilitas ≤2wk, non-kesehatan',
     'q4': '5', 'ql': {'QL1': ['O']},
     'pins': {'OQ1': ['2'], 'OQ9': ['2'], 'OQ16': 'O10', 'OQ19': ['O10.2']}},

    # ── A: AKSESIBILITAS HEALTHCARE (5 variants) ─────────────────────────────
    {'desc': 'A1 – Aksesibilitas: komunikasi ke layanan',
     'q4': '1', 'ql': {'QL1': ['A']},
     'pins': {'AQ1': ['A1']}},
    {'desc': 'A2 – Aksesibilitas: transportasi/antar-jemput',
     'q4': '2', 'ql': {'QL1': ['A']},
     'pins': {'AQ1': ['A2']}},
    {'desc': 'A3 – Aksesibilitas: pendamping berbayar',
     'q4': '3', 'ql': {'QL1': ['A']},
     'pins': {'AQ1': ['A3']}},
    {'desc': 'A4 – Aksesibilitas: koordinasi kasus',
     'q4': '4', 'ql': {'QL1': ['A']},
     'pins': {'AQ1': ['A4']}},
    {'desc': 'A5 – Aksesibilitas: lainnya',
     'q4': '5', 'ql': {'QL1': ['A']},
     'pins': {'AQ1': ['A5']}},

    # ── I: INFORMASI & KONSULTASI HEALTHCARE (8 variants) ───────────────────
    {'desc': 'I1.1 – Konsultasi terkait kesehatan',
     'q4': '1', 'ql': {'QL1': ['I']},
     'pins': {'IQ1': ['I1'], 'IQ2': ['I1.1']}},
    {'desc': 'I1.2 – Konsultasi terkait pendidikan',
     'q4': '2', 'ql': {'QL1': ['I']},
     'pins': {'IQ1': ['I1'], 'IQ2': ['I1.2']}},
    {'desc': 'I1.3 – Konsultasi terkait sosial & budaya',
     'q4': '3', 'ql': {'QL1': ['I']},
     'pins': {'IQ1': ['I1'], 'IQ2': ['I1.3']}},
    {'desc': 'I1.4 – Konsultasi terkait pekerjaan',
     'q4': '4', 'ql': {'QL1': ['I']},
     'pins': {'IQ1': ['I1'], 'IQ2': ['I1.4']}},
    {'desc': 'I1.5 – Konsultasi terkait non-pekerjaan',
     'q4': '5', 'ql': {'QL1': ['I']},
     'pins': {'IQ1': ['I1'], 'IQ2': ['I1.5']}},
    {'desc': 'I2.1.1 – Informasi interaktif tatap muka',
     'q4': '1', 'ql': {'QL1': ['I']},
     'pins': {'IQ1': ['I2'], 'IQ3': ['I2.1'], 'IQ4': ['I2.1.1']}},
    {'desc': 'I2.1.2 – Informasi interaktif via media',
     'q4': '2', 'ql': {'QL1': ['I']},
     'pins': {'IQ1': ['I2'], 'IQ3': ['I2.1'], 'IQ4': ['I2.1.2']}},
    {'desc': 'I2.2 – Informasi non-interaktif',
     'q4': '3', 'ql': {'QL1': ['I']},
     'pins': {'IQ1': ['I2'], 'IQ3': ['I2.2']}},

    # ── SR: RAWAT INAP SOSIAL (10 variants) ─────────────────────────────────
    {'desc': 'SR1.1 – Akut sosial, ada named/nakes, 1 bulan sekali',
     'q4': '6', 'ql': {'QL2': ['SR']},
     'pins': {'SRQ1': ['1'], 'SRQ2': 'SR1', 'SRQ3': 'SR1.1'}},
    {'desc': 'SR1.2 – Akut sosial, ada named/nakes, jika dibutuhkan',
     'q4': '7', 'ql': {'QL2': ['SR']},
     'pins': {'SRQ1': ['1'], 'SRQ2': 'SR1', 'SRQ3': 'SR1.2'}},
    {'desc': 'SR2 – Akut sosial, tidak ada named/nakes',
     'q4': '8', 'ql': {'QL2': ['SR']},
     'pins': {'SRQ1': ['1'], 'SRQ2': 'SR2'}},
    {'desc': 'SR3.1 – Non-Akut sosial, batasan waktu Ya, staf 24hr',
     'q4': '9', 'ql': {'QL2': ['SR']},
     'pins': {'SRQ1': ['2'], 'SRQ4': ['1'], 'SRQ5': 'SR3', 'SRQ6': 'SR3.1'}},
    {'desc': 'SR3.2 – Non-Akut sosial, batasan waktu Ya, staf <5hr/wk',
     'q4': '10', 'ql': {'QL2': ['SR']},
     'pins': {'SRQ1': ['2'], 'SRQ4': ['1'], 'SRQ5': 'SR3', 'SRQ6': 'SR3.2'}},
    {'desc': 'SR4.1 – Non-Akut sosial, batasan waktu Tidak, staf 24hr',
     'q4': '11', 'ql': {'QL2': ['SR']},
     'pins': {'SRQ1': ['2'], 'SRQ4': ['1'], 'SRQ5': 'SR4', 'SRQ7': 'SR4.1'}},
    {'desc': 'SR4.2 – Non-Akut sosial, batasan waktu Tidak, staf <5hr/wk',
     'q4': '12', 'ql': {'QL2': ['SR']},
     'pins': {'SRQ1': ['2'], 'SRQ4': ['1'], 'SRQ5': 'SR4', 'SRQ7': 'SR4.2'}},
    {'desc': 'SR5.1 – Non-Akut sosial, koordinasi nakes, 1 bulan sekali',
     'q4': '6', 'ql': {'QL2': ['SR']},
     'pins': {'SRQ1': ['2'], 'SRQ4': ['2'], 'SRQ8': 'SR5', 'SRQ9': 'SR5.1'}},
    {'desc': 'SR5.2 – Non-Akut sosial, koordinasi nakes, jika dibutuhkan',
     'q4': '7', 'ql': {'QL2': ['SR']},
     'pins': {'SRQ1': ['2'], 'SRQ4': ['2'], 'SRQ8': 'SR5', 'SRQ9': 'SR5.2'}},
    {'desc': 'SR6 – Non-Akut sosial, tidak ada koordinasi nakes',
     'q4': '8', 'ql': {'QL2': ['SR']},
     'pins': {'SRQ1': ['2'], 'SRQ4': ['2'], 'SRQ8': 'SR6'}},

    # ── SD: PERAWATAN HARIAN SOSIAL (10 variants) ────────────────────────────
    {'desc': 'SD1.1.1 – Sosial, kerja dgn gaji ≥16hr, ketentuan umum',
     'q4': '6', 'ql': {'QL2': ['SD']},
     'pins': {'SDQ1': ['SD1'], 'SDQ2': 'SD1.1', 'SDQ3': 'SD1.1.1'}},
    {'desc': 'SD1.1.2 – Sosial, kerja dgn gaji ≥16hr, ketentuan khusus',
     'q4': '7', 'ql': {'QL2': ['SD']},
     'pins': {'SDQ1': ['SD1'], 'SDQ2': 'SD1.1', 'SDQ3': 'SD1.1.2'}},
    {'desc': 'SD1.2.1 – Sosial, kerja dgn gaji <16hr, ketentuan umum',
     'q4': '8', 'ql': {'QL2': ['SD']},
     'pins': {'SDQ1': ['SD1'], 'SDQ2': 'SD1.2', 'SDQ4': 'SD1.2.1'}},
    {'desc': 'SD2.1.1 – Sosial, tanpa gaji ≥16hr, ada batasan',
     'q4': '9', 'ql': {'QL2': ['SD']},
     'pins': {'SDQ1': ['SD2'], 'SDQ5': 'SD2.1', 'SDQ6': 'SD2.1.1'}},
    {'desc': 'SD2.2.2 – Sosial, tanpa gaji <16hr, tanpa batasan',
     'q4': '10', 'ql': {'QL2': ['SD']},
     'pins': {'SDQ1': ['SD2'], 'SDQ5': 'SD2.2', 'SDQ7': 'SD2.2.2'}},
    {'desc': 'SD3.1.1 – Sosial, pelatihan ≥16hr, terkait kesehatan',
     'q4': '11', 'ql': {'QL2': ['SD']},
     'pins': {'SDQ1': ['SD3'], 'SDQ8': 'SD3.1', 'SDQ9': ['SD3.1.1']}},
    {'desc': 'SD3.1.3 – Sosial, pelatihan ≥16hr, sosial & budaya',
     'q4': '12', 'ql': {'QL2': ['SD']},
     'pins': {'SDQ1': ['SD3'], 'SDQ8': 'SD3.1', 'SDQ9': ['SD3.1.3']}},
    {'desc': 'SD3.2.2 – Sosial, pelatihan <16hr, terkait pendidikan',
     'q4': '6', 'ql': {'QL2': ['SD']},
     'pins': {'SDQ1': ['SD3'], 'SDQ8': 'SD3.2', 'SDQ10': ['SD3.2.2']}},
    {'desc': 'SD3.2.4 – Sosial, pelatihan <16hr, lainnya',
     'q4': '7', 'ql': {'QL2': ['SD']},
     'pins': {'SDQ1': ['SD3'], 'SDQ8': 'SD3.2', 'SDQ10': ['SD3.2.4']}},
    {'desc': 'SD4.1 – Sosial, komunitas ≥16hr',
     'q4': '8', 'ql': {'QL2': ['SD']},
     'pins': {'SDQ1': ['SD4'], 'SDQ11': 'SD4.1'}},

    # ── SO: RAWAT JALAN SOSIAL (7 variants) ──────────────────────────────────
    {'desc': 'SO1.1.1 – Sosial, kunjungan ≥2x/wk, terkait kesehatan',
     'q4': '6', 'ql': {'QL2': ['SO']},
     'pins': {'SOQ1': ['SO1'], 'SOQ2': 'SO1.1', 'SOQ3': ['SO1.1.1']}},
    {'desc': 'SO1.1.2 – Sosial, kunjungan ≥2x/wk, layanan sosial',
     'q4': '7', 'ql': {'QL2': ['SO']},
     'pins': {'SOQ1': ['SO1'], 'SOQ2': 'SO1.1', 'SOQ3': ['SO1.1.2']}},
    {'desc': 'SO1.2.1 – Sosial, kunjungan 1x/wk, terkait kesehatan',
     'q4': '8', 'ql': {'QL2': ['SO']},
     'pins': {'SOQ1': ['SO1'], 'SOQ2': 'SO1.2', 'SOQ4': ['SO1.2.1']}},
    {'desc': 'SO1.3.2 – Sosial, kunjungan ≤2wk, layanan sosial',
     'q4': '9', 'ql': {'QL2': ['SO']},
     'pins': {'SOQ1': ['SO1'], 'SOQ2': 'SO1.3', 'SOQ5': ['SO1.3.2']}},
    {'desc': 'SO2.1.1 – Sosial, fasilitas ≥2x/wk, terkait kesehatan',
     'q4': '10', 'ql': {'QL2': ['SO']},
     'pins': {'SOQ1': ['SO2'], 'SOQ6': 'SO2.1', 'SOQ7': ['SO2.1.1']}},
    {'desc': 'SO2.2.1 – Sosial, fasilitas 1x/wk, terkait kesehatan',
     'q4': '11', 'ql': {'QL2': ['SO']},
     'pins': {'SOQ1': ['SO2'], 'SOQ6': 'SO2.2', 'SOQ8': ['SO2.2.1']}},
    {'desc': 'SO2.3.2 – Sosial, fasilitas ≤2wk, layanan sosial',
     'q4': '12', 'ql': {'QL2': ['SO']},
     'pins': {'SOQ1': ['SO2'], 'SOQ6': 'SO2.3', 'SOQ9': ['SO2.3.2']}},

    # ── SA: AKSESIBILITAS SOSIAL (5 variants) ────────────────────────────────
    {'desc': 'SA1 – Aksesibilitas sosial: komunikasi',
     'q4': '6', 'ql': {'QL2': ['SA']},
     'pins': {'SAQ1': ['SA1']}},
    {'desc': 'SA2 – Aksesibilitas sosial: transportasi',
     'q4': '7', 'ql': {'QL2': ['SA']},
     'pins': {'SAQ1': ['SA2']}},
    {'desc': 'SA3 – Aksesibilitas sosial: pendampingan pribadi',
     'q4': '8', 'ql': {'QL2': ['SA']},
     'pins': {'SAQ1': ['SA3']}},
    {'desc': 'SA4 – Aksesibilitas sosial: koordinasi kasus',
     'q4': '9', 'ql': {'QL2': ['SA']},
     'pins': {'SAQ1': ['SA4']}},
    {'desc': 'SA5 – Aksesibilitas sosial: lainnya',
     'q4': '10', 'ql': {'QL2': ['SA']},
     'pins': {'SAQ1': ['SA5']}},

    # ── SI: INFORMASI SOSIAL (8 variants) ────────────────────────────────────
    {'desc': 'SI1.1 – Informasi sosial: konsultasi kesehatan',
     'q4': '6', 'ql': {'QL2': ['SI']},
     'pins': {'SIQ1': ['SI1'], 'SIQ2': ['SI1.1']}},
    {'desc': 'SI1.2 – Informasi sosial: konsultasi pendidikan',
     'q4': '7', 'ql': {'QL2': ['SI']},
     'pins': {'SIQ1': ['SI1'], 'SIQ2': ['SI1.2']}},
    {'desc': 'SI1.3 – Informasi sosial: konsultasi sosial & budaya',
     'q4': '8', 'ql': {'QL2': ['SI']},
     'pins': {'SIQ1': ['SI1'], 'SIQ2': ['SI1.3']}},
    {'desc': 'SI1.4 – Informasi sosial: konsultasi pekerjaan',
     'q4': '9', 'ql': {'QL2': ['SI']},
     'pins': {'SIQ1': ['SI1'], 'SIQ2': ['SI1.4']}},
    {'desc': 'SI1.5 – Informasi sosial: konsultasi non-pekerjaan',
     'q4': '10', 'ql': {'QL2': ['SI']},
     'pins': {'SIQ1': ['SI1'], 'SIQ2': ['SI1.5']}},
    {'desc': 'SI2.1.1 – Informasi sosial: interaktif tatap muka',
     'q4': '11', 'ql': {'QL2': ['SI']},
     'pins': {'SIQ1': ['SI2'], 'SIQ3': ['SI2.1'], 'SIQ4': ['SI2.1.1']}},
    {'desc': 'SI2.1.2 – Informasi sosial: interaktif via media',
     'q4': '12', 'ql': {'QL2': ['SI']},
     'pins': {'SIQ1': ['SI2'], 'SIQ3': ['SI2.1'], 'SIQ4': ['SI2.1.2']}},
    {'desc': 'SI2.2 – Informasi sosial: non-interaktif',
     'q4': '6', 'ql': {'QL2': ['SI']},
     'pins': {'SIQ1': ['SI2'], 'SIQ3': ['SI2.2']}},
]

N_VARIANTS = len(VARIANTS)  # 113 distinct leaf variants across all tracks


class Command(BaseSeeder):
    help = f'Seed {N_VARIANTS} DynamicSurveyResponse rows — one per distinct MTC leaf variant.'

    def add_arguments(self, parser):
        parser.add_argument('--status', type=str, default=None,
                            help='Force verification_status for all records (DRAFT/SUBMITTED/VERIFIED).')
        parser.add_argument('--seed', type=int, default=42, help='Random seed for non-pinned choices.')

    def handle(self, *args, **opts):
        random.seed(opts.get('seed', 42))

        self.faskes_ratio = None
        self.ql1_probs = {}
        self.ql2_probs = {}
        self._slot = None
        self._status_override = opts.get('status')

        templates = list(SurveyTemplate.objects.filter(is_active=True, code='OMMHA_V1'))
        if not templates:
            self.stdout.write(self.style.ERROR('OMMHA_V1 template not found.'))
            return
        template = templates[0]

        services = list(Service.objects.filter(is_active=True))
        if not services:
            self.stdout.write(self.style.ERROR('No active services. Run seed_data first.'))
            return

        self._ensure_surveyors()
        surveyors = list(User.objects.filter(role=User.Role.SURVEYOR))
        verifiers = list(User.objects.filter(role=User.Role.VERIFIER))

        created = 0
        for i, variant in enumerate(VARIANTS):
            service = services[i % len(services)]
            surveyor = random.choice(surveyors)
            verifier = random.choice(verifiers) if verifiers else None
            self._pins = {**variant.get('pins', {}), 'Q4': variant['q4'], **variant.get('ql', {})}
            try:
                with transaction.atomic():
                    self._create_response_variant(template, service, surveyor, verifier, variant)
                created += 1
                self.stdout.write(f'  [{i+1:3d}/{N_VARIANTS}] {variant["desc"]}')
            except Exception as e:
                import traceback
                self.stdout.write(self.style.WARNING(
                    f'  ! [{i+1:3d}] SKIPPED {variant["desc"]}: {e}\n{traceback.format_exc()}'
                ))

        self.stdout.write(self.style.SUCCESS(f'Done. {created}/{N_VARIANTS} variants created.'))

    def _create_response_variant(self, template, service, surveyor, verifier, variant):
        sections = list(template.sections.prefetch_related('questions__choices').order_by('order'))
        all_questions = [q for s in sections for q in s.questions.all()]

        self.code_to_question = {q.code: q for q in all_questions}
        self.inline_section_for_code = {}
        for s in sections:
            sc = s.show_condition or {}
            if sc.get('question_code') == '_inline_only_':
                for q in s.questions.all():
                    self.inline_section_for_code[q.code] = s

        self.raw_answers: dict = {}

        days_ago = random.randint(1, 180)
        survey_dt = timezone.now() - timedelta(days=days_ago)

        if self._status_override:
            status = self._status_override
        else:
            status = random.choices(
                [DynamicSurveyResponse.Status.DRAFT,
                 DynamicSurveyResponse.Status.SUBMITTED,
                 DynamicSurveyResponse.Status.VERIFIED,
                 DynamicSurveyResponse.Status.REJECTED],
                weights=[1, 2, 5, 1], k=1,
            )[0]

        lat = float(service.latitude) if service.latitude else -7.6
        lng = float(service.longitude) if service.longitude else 109.7

        response = DynamicSurveyResponse.objects.create(
            template=template,
            service=service,
            surveyor=surveyor,
            survey_date=survey_dt,
            verification_status=status,
            assigned_verifier=verifier if status != DynamicSurveyResponse.Status.DRAFT else None,
            verified_by=verifier if status == DynamicSurveyResponse.Status.VERIFIED else None,
            verified_at=timezone.now() - timedelta(days=random.randint(0, 10))
                if status == DynamicSurveyResponse.Status.VERIFIED else None,
            latitude=Decimal(str(lat + random.uniform(-0.05, 0.05))),
            longitude=Decimal(str(lng + random.uniform(-0.05, 0.05))),
            location_accuracy=Decimal(str(random.uniform(5.0, 25.0))),
            surveyor_notes=f'Seed: {variant["desc"]}',
            started_at=survey_dt,
            submitted_at=survey_dt + timedelta(hours=random.randint(1, 4))
                if status != DynamicSurveyResponse.Status.DRAFT else None,
        )

        self.response = response
        self.recorded = []
        self.section_visit_count = {}

        for section in sections:
            sc = section.show_condition or {}
            if sc.get('question_code') == '_inline_only_':
                continue
            if not self._eval_show_condition(sc):
                continue
            self._walk_section(section, start_code=None, context_key='')

        self._persist_answers()

    def _generate_value(self, q):
        """Return pinned value if set, otherwise fall back to base random logic."""
        if hasattr(self, '_pins') and q.code in self._pins:
            return self._pins[q.code]
        return super()._generate_value(q)

    def _persist_answers(self):
        """Delegate to base implementation."""
        super()._persist_answers()
