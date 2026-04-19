# Generated migration to populate bsic FK on existing QuestionChoice records

from django.db import migrations


def populate_bsic_fk(apps, schema_editor):
    QuestionChoice = apps.get_model('survey', 'QuestionChoice')
    BasicStableInputsOfCare = apps.get_model('directory', 'BasicStableInputsOfCare')

    # Get all BSIC codes for efficient lookup
    bsic_codes = set(BasicStableInputsOfCare.objects.values_list('code', flat=True))

    # Find choices where value matches a BSIC code but bsic_id is null
    choices_to_update = QuestionChoice.objects.filter(
        bsic_id__isnull=True,
        value__in=bsic_codes
    )

    count = 0
    for choice in choices_to_update:
        bsic = BasicStableInputsOfCare.objects.filter(code=choice.value).first()
        if bsic:
            choice.bsic = bsic
            choice.save(update_fields=['bsic'])
            count += 1

    print(f"Populated bsic FK on {count} QuestionChoice records")


def reverse_populate(apps, schema_editor):
    # No reverse needed - we just clear the bsic FK
    QuestionChoice = apps.get_model('survey', 'QuestionChoice')
    QuestionChoice.objects.filter(bsic__isnull=False).update(bsic=None)


class Migration(migrations.Migration):

    dependencies = [
        ('survey', '0036_questionchoice_bsic_alter_question_answer_type'),
    ]

    operations = [
        migrations.RunPython(populate_bsic_fk, reverse_populate),
    ]