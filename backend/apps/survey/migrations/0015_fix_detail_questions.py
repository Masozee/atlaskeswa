from django.db import migrations

DETAIL_CODES = [
    'RQA','RQB','RQC','RQD','RQE','RQF','RQG','RQH','RQI','RQJ',
]


def get_service_prefix(code):
    """Same logic as migration 0013 — maps code prefix to QL1 choice value."""
    upper = code.upper()
    if upper.startswith('QL'):
        return None
    two = upper[:2]
    if two in ('SR', 'SD', 'SO', 'SA', 'SI'):
        return two
    one = upper[0]
    if one in ('R', 'D', 'O', 'A', 'I'):
        return one
    return None


def fix_detail_questions(apps, schema_editor):
    QuestionSection = apps.get_model('survey', 'QuestionSection')
    Question = apps.get_model('survey', 'Question')

    # 1. Delete empty FASKSES stubs (RQA-RQJ, SINGLE_CHOICE, 0 choices)
    #    These block the flow: RQ11 next_question_code="RQA" finds the empty stub
    #    instead of the real question in DETAIL section.
    try:
        faskses = QuestionSection.objects.get(code='FASKSES')
        stubs = Question.objects.filter(
            section=faskses,
            code__in=DETAIL_CODES,
            answer_type='SINGLE_CHOICE',
        )
        deleted, _ = stubs.delete()
        print(f'[0015] Deleted {deleted} empty FASKSES stub questions (RQA-RQJ).')
    except QuestionSection.DoesNotExist:
        pass

    # 2. Add show_condition to DETAIL section questions by service prefix
    #    (same QL1-contains logic as migration 0013 applied to FASKSES questions)
    try:
        detail = QuestionSection.objects.get(code='DETAIL')
    except QuestionSection.DoesNotExist:
        return

    updated = 0
    for question in Question.objects.filter(section=detail):
        prefix = get_service_prefix(question.code)
        if prefix:
            question.show_condition = {
                'question_code': 'QL1',
                'operator': 'contains',
                'value': prefix,
            }
            question.save(update_fields=['show_condition'])
            updated += 1

    print(f'[0015] Set show_condition on {updated} DETAIL section questions.')


def reverse_fix(apps, schema_editor):
    # Restore show_condition=None on DETAIL questions; stubs cannot be restored.
    QuestionSection = apps.get_model('survey', 'QuestionSection')
    Question = apps.get_model('survey', 'Question')
    try:
        detail = QuestionSection.objects.get(code='DETAIL')
        Question.objects.filter(section=detail).update(show_condition=None)
    except QuestionSection.DoesNotExist:
        pass


class Migration(migrations.Migration):

    dependencies = [
        ('survey', '0014_fix_jenis_layanan_show_condition'),
    ]

    operations = [
        migrations.RunPython(fix_detail_questions, reverse_code=reverse_fix),
    ]
