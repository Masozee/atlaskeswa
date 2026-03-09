#!/usr/bin/env python
"""
Seed script: Add QL1 (Pertanyaan Layanan) to the questionnaire.
QL1 asks which service types a facility provides, with choices linked to MTC codes.

Run from backend/ directory:
    uv run python seed/seed_questions.py
"""
import os
import sys
import django

# Setup Django
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings.base')
django.setup()

from apps.survey.models import Question, QuestionChoice, QuestionSection, SurveyTemplate
from apps.directory.models import MainTypeOfCare


def run():
    # Get template
    template = SurveyTemplate.objects.get(code='OMMHA_V1')
    print(f"Template: {template}")

    # Get DATA_DASAR section (QL1 logically belongs after Q-series basics)
    # Create a dedicated LAYANAN section if it doesn't exist
    layanan_section, created = QuestionSection.objects.get_or_create(
        code='LAYANAN',
        template=template,
        defaults={
            'name': 'Pertanyaan Layanan',
            'order': 15,
            'description': 'Pertanyaan untuk menentukan jenis layanan yang diberikan fasilitas',
        }
    )
    if created:
        print(f"Created section: {layanan_section}")
    else:
        print(f"Section already exists: {layanan_section}")

    # Get MTC root codes
    mtc_codes = {
        mtc.code: mtc
        for mtc in MainTypeOfCare.objects.filter(code__in=['R', 'D', 'O', 'A', 'W'])
    }
    print(f"MTC codes found: {list(mtc_codes.keys())}")

    # Create/update QL1
    q, created = Question.objects.get_or_create(
        code='QL1',
        section=layanan_section,
        defaults={
            'question_text': 'Apakah fasilitas ini memberikan jenis layanan berikut?',
            'answer_type': Question.AnswerType.MULTIPLE_CHOICE,
            'is_required': True,
            'order': 1,
            'desde_ltc_description': 'QL1 — Pertanyaan layanan untuk menentukan MTC code fasilitas berdasarkan DESDE-LTC',
            'keterangan': 'Pilihan jawaban bisa lebih dari satu. Setiap pilihan terkait dengan kode MTC DESDE-LTC.',
        }
    )
    if created:
        print(f"Created question: {q.code}")
    else:
        print(f"Question already exists: {q.code}")

    # Define QL1 choices (value, label, mtc_code, mtc_description, order)
    choices_data = [
        ('R', 'Layanan Rawat Inap (Residential Care)',    'R', 'Perawatan berbasis tempat tinggal untuk ODGJ', 1),
        ('D', 'Layanan Perawatan Harian (Day Care)',       'D', 'Perawatan harian tanpa menginap', 2),
        ('O', 'Layanan Rawat Jalan (Outpatient Care)',     'O', 'Layanan rawat jalan untuk ODGJ', 3),
        ('A', 'Layanan Aksesibilitas (Accessibility)',     'A', 'Layanan aksesibilitas dan darurat', 4),
        ('W', 'Layanan Ketenagakerjaan (Work-Related)',    'W', 'Layanan yang berkaitan dengan pekerjaan', 5),
    ]

    for value, label, mtc_key, keterangan, order in choices_data:
        mtc = mtc_codes.get(mtc_key)
        if not mtc:
            print(f"  WARNING: MTC code '{mtc_key}' not found, skipping '{label}'")
            continue

        choice, created = QuestionChoice.objects.get_or_create(
            question=q,
            value=value,
            defaults={
                'label': label,
                'order': order,
                'mtc_code': mtc,
                'keterangan': keterangan,
            }
        )
        if created:
            print(f"  Created choice: {value} - {label} (MTC: {mtc.code})")
        else:
            # Update if exists
            choice.label = label
            choice.order = order
            choice.mtc_code = mtc
            choice.keterangan = keterangan
            choice.save()
            print(f"  Updated choice: {value} - {label} (MTC: {mtc.code})")

    print(f"\nDone! QL1 now has {QuestionChoice.objects.filter(question=q).count()} choices.")
    print(f"Total questions: {Question.objects.count()}")
    print(f"Total choices: {QuestionChoice.objects.count()}")


if __name__ == '__main__':
    run()
