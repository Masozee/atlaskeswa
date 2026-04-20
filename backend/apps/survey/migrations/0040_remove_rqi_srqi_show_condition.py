from django.db import migrations

MANDIRI_VALUE = 'PEMBAYARAN MANDIRI OLEH KLIEN/PASIEN/KELUARGA'


def forward(apps, schema_editor):
    Question = apps.get_model('survey', 'Question')
    # Routing is now handled in question-logic.ts special case, not show_condition.
    # Clearing show_condition ensures RQI/SRQI are always in visibleQuestions so the
    # code-driven routing (nextCode = 'RQI'/'SRQI') can find them in codeMap.
    Question.objects.filter(code='RQI').update(show_condition=None)
    Question.objects.filter(code='SRQI').update(show_condition=None)


def reverse(apps, schema_editor):
    Question = apps.get_model('survey', 'Question')
    Question.objects.filter(code='RQI').update(
        show_condition={"question_code": "RQH", "operator": "contains", "value": MANDIRI_VALUE}
    )
    Question.objects.filter(code='SRQI').update(
        show_condition={"question_code": "SRQH", "operator": "contains", "value": MANDIRI_VALUE}
    )


class Migration(migrations.Migration):

    dependencies = [
        ('survey', '0039_rq5_dokter24_q4_branch'),
    ]

    operations = [
        migrations.RunPython(forward, reverse),
    ]
