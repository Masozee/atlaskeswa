from django.core.management.base import BaseCommand

from apps.survey.models import Question, QuestionSection


def get_service_prefix(code):
    """
    Returns the QL1 choice value (e.g. 'R', 'SR') if this question belongs
    to a service type group, or None otherwise.
    Checks 2-letter prefixes before 1-letter to handle SR/SD/SO/SA/SI correctly.
    """
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


class Command(BaseCommand):
    help = 'Set show_condition on FASKSES questions based on service type prefix (re-runnable)'

    def handle(self, *args, **options):
        try:
            section = QuestionSection.objects.get(code='FASKSES')
        except QuestionSection.DoesNotExist:
            self.stdout.write(self.style.ERROR('FASKSES section not found. Has the database been seeded?'))
            return

        updated = 0
        skipped = 0
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
            else:
                skipped += 1

        self.stdout.write(self.style.SUCCESS(
            f'Done. Updated {updated} questions, skipped {skipped} (no matching prefix).'
        ))
