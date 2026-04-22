from django.db import migrations


def fix_rqf1_order(apps, schema_editor):
    Question = apps.get_model('survey', 'Question')

    # Move RQF1 before RQF in the DETAIL section ordering.
    Question.objects.filter(code='RQF').update(order=136)
    Question.objects.filter(code='RQF1').update(order=135)


class Migration(migrations.Migration):

    dependencies = [
        ('survey', '0041_alter_question_answer_type'),
    ]

    operations = [
        migrations.RunPython(fix_rqf1_order, migrations.RunPython.noop),
    ]
