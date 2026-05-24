"""Rewrite show_conditions that target Q4 to use the integer-string values
('1'..'12') used in the canonical 23mei dataset.

The previous template authoring used semantic codes like 'RSU', 'PUSKESMAS',
etc. in show_conditions, but the QuestionChoice rows on Q4 store value as the
order index ('1'..'12'). This mismatch broke the flow after Q16, because
QL1/QL2 (and sections FASKSES/NON-FASKES, and questions RQ6/RQ7) never
matched any selected Q4 answer.

Mapping:
    1=RSU 2=RSJ 3=PUSKESMAS 4=KLINIK 5=PRAKTEK_DOKTER
    6=BALAI_REHABILITASI 7=PANTI_SOSIAL 8=OBK 9=LSM 10=LKS 11=PRAKTIK_PRIBADI
    12=LAINNYA
"""
from django.db import migrations


FASKES = ['1', '2', '3', '4', '5']
NON_FASKES = ['6', '7', '8', '9', '10', '11', '12']
RSU_RSJ = ['1', '2']

QUESTION_NEW_CONDITIONS = {
    'QL1': {
        'value': FASKES,
        'operator': 'in',
        'question_code': 'Q4',
    },
    'QL2': {
        'value': NON_FASKES,
        'operator': 'in',
        'question_code': 'Q4',
    },
    'RQ6': {
        'operator': 'and',
        'conditions': [
            {'value': 'R', 'operator': 'contains', 'question_code': 'QL1'},
            {'value': RSU_RSJ, 'operator': 'in', 'question_code': 'Q4'},
        ],
    },
    'RQ7': {
        'operator': 'and',
        'conditions': [
            {'value': 'R', 'operator': 'contains', 'question_code': 'QL1'},
            {'value': RSU_RSJ, 'operator': 'not_in', 'question_code': 'Q4'},
        ],
    },
}

SECTION_NEW_CONDITIONS = {
    'FASKSES': {
        'value': FASKES,
        'operator': 'in',
        'question_code': 'Q4',
    },
    'NON-FASKES': {
        'value': NON_FASKES,
        'operator': 'in',
        'question_code': 'Q4',
    },
}

QUESTION_OLD_CONDITIONS = {
    'QL1': {
        'value': ['RSU', 'RSJ', 'PUSKESMAS', 'KLINIK', 'PRAKTEK_DOKTER'],
        'operator': 'in',
        'question_code': 'Q4',
    },
    'QL2': {
        'value': ['BALAI_REHABILITASI', 'PANTI_SOSIAL', 'OBK', 'LSM', 'LKS', 'PRAKTIK_PRIBADI', 'LAINNYA'],
        'operator': 'in',
        'question_code': 'Q4',
    },
    'RQ6': {
        'operator': 'and',
        'conditions': [
            {'value': 'R', 'operator': 'contains', 'question_code': 'QL1'},
            {'value': ['RSU', 'RSJ'], 'operator': 'in', 'question_code': 'Q4'},
        ],
    },
    'RQ7': {
        'operator': 'and',
        'conditions': [
            {'value': 'R', 'operator': 'contains', 'question_code': 'QL1'},
            {'value': ['RSU', 'RSJ'], 'operator': 'not_in', 'question_code': 'Q4'},
        ],
    },
}

SECTION_OLD_CONDITIONS = {
    'FASKSES': {
        'value': ['RSU', 'RSJ', 'PUSKESMAS', 'KLINIK', 'PRAKTEK_DOKTER'],
        'operator': 'in',
        'question_code': 'Q4',
    },
    'NON-FASKES': {
        'value': ['BALAI_REHABILITASI', 'PANTI_SOSIAL', 'OBK', 'LSM', 'LKS', 'PRAKTIK_PRIBADI', 'LAINNYA'],
        'operator': 'in',
        'question_code': 'Q4',
    },
}


def apply_integer_conditions(apps, schema_editor):
    Question = apps.get_model('survey', 'Question')
    QuestionSection = apps.get_model('survey', 'QuestionSection')

    for code, cond in QUESTION_NEW_CONDITIONS.items():
        Question.objects.filter(code=code).update(show_condition=cond)

    for code, cond in SECTION_NEW_CONDITIONS.items():
        QuestionSection.objects.filter(code=code).update(show_condition=cond)


def revert_to_string_conditions(apps, schema_editor):
    Question = apps.get_model('survey', 'Question')
    QuestionSection = apps.get_model('survey', 'QuestionSection')

    for code, cond in QUESTION_OLD_CONDITIONS.items():
        Question.objects.filter(code=code).update(show_condition=cond)

    for code, cond in SECTION_OLD_CONDITIONS.items():
        QuestionSection.objects.filter(code=code).update(show_condition=cond)


class Migration(migrations.Migration):

    dependencies = [
        ('survey', '0045_q15_other_input_types'),
    ]

    operations = [
        migrations.RunPython(apply_integer_conditions, revert_to_string_conditions),
    ]
