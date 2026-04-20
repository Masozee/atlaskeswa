from django.db import migrations

MANDIRI_VALUE = 'PEMBAYARAN MANDIRI OLEH KLIEN/PASIEN/KELUARGA'

# Actual choice values as stored in the DB (full text, not shortcodes)
RQH_ORIGINALS = {
    'JAMINAN KESEHATAN NASIONAL (JKN/BPJS KESEHATAN)': 'RQJ',
    'ASURANSI KESEHATAN SWASTA': 'RQJ',
    MANDIRI_VALUE: 'RQI',
    'TIDAK DITENTUKAN (SUKARELA)': 'RQJ',
    'TIDAK BERBAYAR': 'RQJ',
}

SRQH_ORIGINALS = {
    'JAMINAN KESEHATAN NASIONAL (JKN/BPJS KESEHATAN)': 'SRQJ',
    'ASURANSI KESEHATAN SWASTA': 'SRQJ',
    MANDIRI_VALUE: 'SRQI',
    'TIDAK DITENTUKAN (SUKARELA)': 'SRQJ',
    'TIDAK BERBAYAR': 'SRQJ',
}


def forward(apps, schema_editor):
    Question = apps.get_model('survey', 'Question')
    QuestionChoice = apps.get_model('survey', 'QuestionChoice')

    # RQI visible only when RQH answer array contains MANDIRI_VALUE
    Question.objects.filter(code='RQI').update(
        show_condition={"question_code": "RQH", "operator": "contains", "value": MANDIRI_VALUE}
    )

    # SRQI visible only when SRQH answer array contains MANDIRI_VALUE
    Question.objects.filter(code='SRQI').update(
        show_condition={"question_code": "SRQH", "operator": "contains", "value": MANDIRI_VALUE}
    )

    # Remove next_question_code from RQH/SRQH choices — sequential flow takes over
    QuestionChoice.objects.filter(question__code='RQH').update(next_question_code='')
    QuestionChoice.objects.filter(question__code='SRQH').update(next_question_code='')


def reverse(apps, schema_editor):
    Question = apps.get_model('survey', 'Question')
    QuestionChoice = apps.get_model('survey', 'QuestionChoice')

    Question.objects.filter(code='RQI').update(show_condition=None)
    Question.objects.filter(code='SRQI').update(show_condition=None)

    for value, next_code in RQH_ORIGINALS.items():
        QuestionChoice.objects.filter(question__code='RQH', value=value).update(
            next_question_code=next_code
        )

    for value, next_code in SRQH_ORIGINALS.items():
        QuestionChoice.objects.filter(question__code='SRQH', value=value).update(
            next_question_code=next_code
        )


class Migration(migrations.Migration):

    dependencies = [
        ('survey', '0037_populate_questionchoice_bsic_fk'),
    ]

    operations = [
        migrations.RunPython(forward, reverse),
    ]
