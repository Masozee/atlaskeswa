from django.db import migrations


def get_service_prefix(code):
    """
    Returns the QL1 choice value (e.g. 'R', 'SR') if this question belongs
    to a service type group, or None if not.
    Checks 2-letter prefixes before 1-letter to handle SR/SD/SO/SA/SI correctly.
    """
    upper = code.upper()
    # Never touch QL questions (they live in JENIS_LAYANAN, not FASKSES)
    if upper.startswith('QL'):
        return None
    # 2-letter prefixes first
    two = upper[:2]
    if two in ('SR', 'SD', 'SO', 'SA', 'SI'):
        return two
    # 1-letter prefixes
    one = upper[0]
    if one in ('R', 'D', 'O', 'A', 'I'):
        return one
    return None


def set_service_type_conditions(apps, schema_editor):
    QuestionSection = apps.get_model('survey', 'QuestionSection')
    Question = apps.get_model('survey', 'Question')

    try:
        section = QuestionSection.objects.get(code='FASKSES')
    except QuestionSection.DoesNotExist:
        return  # Section not seeded yet — safe no-op

    updated = 0
    for question in Question.objects.filter(section=section):
        prefix = get_service_prefix(question.code)
        if prefix:
            question.show_condition = {
                'question_code': 'QL1',
                'operator': 'contains',
                'value': prefix,
            }
            question.save(update_fields=['show_condition'])
            updated += 1

    print(f'[0013] Set show_condition on {updated} questions in FASKSES section.')


def clear_service_type_conditions(apps, schema_editor):
    QuestionSection = apps.get_model('survey', 'QuestionSection')
    Question = apps.get_model('survey', 'Question')

    try:
        section = QuestionSection.objects.get(code='FASKSES')
    except QuestionSection.DoesNotExist:
        return

    Question.objects.filter(section=section).update(show_condition=None)


class Migration(migrations.Migration):

    dependencies = [
        ('survey', '0012_add_context_key_to_question_answer'),
    ]

    operations = [
        migrations.RunPython(
            set_service_type_conditions,
            reverse_code=clear_service_type_conditions,
        ),
    ]
