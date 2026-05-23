from django.db import migrations


Q4_CODE_BY_ORDER = {
    1: 'RSU',
    2: 'RSJ',
    3: 'PUSKESMAS',
    4: 'KLINIK',
    5: 'PRAKTEK_DOKTER',
    6: 'BALAI_REHABILITASI',
    7: 'PANTI_SOSIAL',
    8: 'OBK',
    9: 'LSM',
    10: 'LKS',
    11: 'PRAKTIK_PRIBADI',
    12: 'LAINNYA',
}


def fix_q4_choice_values(apps, schema_editor):
    Question = apps.get_model('survey', 'Question')
    QuestionChoice = apps.get_model('survey', 'QuestionChoice')

    try:
        q4 = Question.objects.get(code='Q4')
    except Question.DoesNotExist:
        return

    for choice in QuestionChoice.objects.filter(question=q4):
        target = Q4_CODE_BY_ORDER.get(choice.order)
        if target and choice.value != target:
            choice.value = target
            choice.save(update_fields=['value'])


def revert_q4_choice_values(apps, schema_editor):
    Question = apps.get_model('survey', 'Question')
    QuestionChoice = apps.get_model('survey', 'QuestionChoice')

    try:
        q4 = Question.objects.get(code='Q4')
    except Question.DoesNotExist:
        return

    for choice in QuestionChoice.objects.filter(question=q4):
        choice.value = str(choice.order)
        choice.save(update_fields=['value'])


class Migration(migrations.Migration):

    dependencies = [
        ('survey', '0047_alter_question_answer_type'),
    ]

    operations = [
        migrations.RunPython(fix_q4_choice_values, revert_q4_choice_values),
    ]
