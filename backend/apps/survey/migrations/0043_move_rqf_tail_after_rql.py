from django.db import migrations


def move_rqf_tail_after_rql(apps, schema_editor):
    Question = apps.get_model('survey', 'Question')

    updates = {
        'RQF1': 135,
        'RQF': 136,
        'RQG': 137,
        'RQH': 138,
        'RQI': 139,
        'RQJ': 140,
        'RQK': 141,
        'RQL': 142,
    }

    for code, order in updates.items():
        Question.objects.filter(code=code).update(order=order)


class Migration(migrations.Migration):

    dependencies = [
        ('survey', '0042_fix_rqf1_order'),
    ]

    operations = [
        migrations.RunPython(move_rqf_tail_after_rql, migrations.RunPython.noop),
    ]
