from django.db import migrations


def set_q15_other_input_types(apps, schema_editor):
    QuestionChoice = apps.get_model('survey', 'QuestionChoice')
    QuestionChoice.objects.filter(
        question__code='Q15',
        value='TANGGAL',
    ).update(
        has_other_input=True,
        other_input_label='Tanggal',
        other_input_type='date',
    )
    QuestionChoice.objects.filter(
        question__code='Q15',
        value='TIDAK_DIKETAHUI',
    ).update(
        has_other_input=True,
        other_input_label='Perkiraan tahun',
        other_input_type='integer',
    )


def reset_q15_other_input_types(apps, schema_editor):
    QuestionChoice = apps.get_model('survey', 'QuestionChoice')
    QuestionChoice.objects.filter(
        question__code='Q15',
        value__in=['TANGGAL', 'TIDAK_DIKETAHUI'],
    ).update(
        other_input_label='Sebutkan',
        other_input_type='text',
    )


class Migration(migrations.Migration):

    dependencies = [
        ('survey', '0044_fill_branch_show_conditions'),
    ]

    operations = [
        migrations.RunPython(set_q15_other_input_types, reset_q15_other_input_types),
    ]
