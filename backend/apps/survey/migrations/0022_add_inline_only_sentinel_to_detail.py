from django.db import migrations


def add_inline_only_sentinel(apps, schema_editor):
    """Add _inline_only_ sentinel to DETAIL section so it can only be accessed via cross-section jumps."""
    QuestionSection = apps.get_model('survey', 'QuestionSection')

    try:
        detail = QuestionSection.objects.get(code='DETAIL')
        if detail.show_condition is None:
            detail.show_condition = {'question_code': '_inline_only_'}
            detail.save(update_fields=['show_condition'])
            print('[0022] Added _inline_only_ sentinel to DETAIL section.')
        else:
            print('[0022] DETAIL section already has show_condition, not overwriting.')
    except QuestionSection.DoesNotExist:
        print('[0022] DETAIL section not found, skipping.')


def remove_inline_only_sentinel(apps, schema_editor):
    """Remove _inline_only_ sentinel from DETAIL section."""
    QuestionSection = apps.get_model('survey', 'QuestionSection')

    try:
        detail = QuestionSection.objects.get(code='DETAIL')
        if detail.show_condition and detail.show_condition.get('question_code') == '_inline_only_':
            detail.show_condition = None
            detail.save(update_fields=['show_condition'])
            print('[0022] Removed _inline_only_ sentinel from DETAIL section.')
    except QuestionSection.DoesNotExist:
        pass


class Migration(migrations.Migration):

    dependencies = [
        ('survey', '0021_add_choices_to_other_input_type'),
    ]

    operations = [
        migrations.RunPython(add_inline_only_sentinel, reverse_code=remove_inline_only_sentinel),
    ]
