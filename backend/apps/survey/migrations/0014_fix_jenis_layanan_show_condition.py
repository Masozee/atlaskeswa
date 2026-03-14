from django.db import migrations


def fix_jenis_layanan_condition(apps, schema_editor):
    """
    JENIS_LAYANAN section was gated on Q3 == "KESEHATAN", but Q3 has 8 choices
    (KESEHATAN, SOSIAL, EKONOMI, etc.). Non-health orgs (Q3 = SOSIAL) would never
    see JENIS_LAYANAN, even though their Q4 choices (LSM, BALAI_REHABILITASI, etc.)
    have next_question_code pointing to QL2 inside that section.

    Fix: remove show_condition so JENIS_LAYANAN always appears. Individual
    question-level show_conditions on QL1 and QL2 already gate correctly by Q4.
    """
    QuestionSection = apps.get_model('survey', 'QuestionSection')
    QuestionSection.objects.filter(code='JENIS_LAYANAN').update(show_condition=None)


def restore_jenis_layanan_condition(apps, schema_editor):
    QuestionSection = apps.get_model('survey', 'QuestionSection')
    QuestionSection.objects.filter(code='JENIS_LAYANAN').update(
        show_condition={'question_code': 'Q3', 'operator': 'equals', 'value': 'KESEHATAN'}
    )


class Migration(migrations.Migration):

    dependencies = [
        ('survey', '0013_add_service_type_show_conditions'),
    ]

    operations = [
        migrations.RunPython(
            fix_jenis_layanan_condition,
            reverse_code=restore_jenis_layanan_condition,
        ),
    ]
