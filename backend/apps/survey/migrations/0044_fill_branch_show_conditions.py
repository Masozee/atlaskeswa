from django.db import migrations


def fill_branch_show_conditions(apps, schema_editor):
    Question = apps.get_model('survey', 'Question')

    branch_conditions = {
        'RQ': {'question_code': 'QL1', 'operator': 'contains', 'value': 'R'},
        'DQ': {'question_code': 'QL1', 'operator': 'contains', 'value': 'D'},
        'OQ': {'question_code': 'QL1', 'operator': 'contains', 'value': 'O'},
        'AQ': {'question_code': 'QL1', 'operator': 'contains', 'value': 'A'},
        'IQ': {'question_code': 'QL1', 'operator': 'contains', 'value': 'I'},
        'SRQ': {'question_code': 'QL2', 'operator': 'contains', 'value': 'SR'},
        'SDQ': {'question_code': 'QL2', 'operator': 'contains', 'value': 'SD'},
        'SOQ': {'question_code': 'QL2', 'operator': 'contains', 'value': 'SO'},
        'SAQ': {'question_code': 'QL2', 'operator': 'contains', 'value': 'SA'},
        'SIQ': {'question_code': 'QL2', 'operator': 'contains', 'value': 'SI'},
    }

    for prefix, condition in branch_conditions.items():
        Question.objects.filter(
            code__startswith=prefix,
            show_condition__isnull=True,
        ).update(show_condition=condition)


class Migration(migrations.Migration):

    dependencies = [
        ('survey', '0043_move_rqf_tail_after_rql'),
    ]

    operations = [
        migrations.RunPython(fill_branch_show_conditions, migrations.RunPython.noop),
    ]
