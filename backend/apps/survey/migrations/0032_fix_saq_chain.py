from django.db import migrations, models


def fix_saq_chain(apps, schema_editor):
    Question = apps.get_model('survey', 'Question')
    QuestionChoice = apps.get_model('survey', 'QuestionChoice')

    # ── Fix 1: Add missing SAQ7, SAQ8, SAQ9, SAQF, SAQG ──────────────────────
    non_faskses = Question.objects.filter(section__code='NON-FASKES').first().section

    # Get max order in NON-FASKES to continue sequence
    max_order = Question.objects.filter(section=non_faskses).aggregate(
        max_order=models.Max('order')
    )['max_order'] or 0

    def get_or_create_question(code, answer_type, is_required, order, section, show_cond=None):
        """Idempotent: return existing question or create a new one."""
        existing = Question.objects.filter(code=code).first()
        if existing:
            print(f'[0032] {code} already exists — skipping creation')
            return existing
        q = Question.objects.create(
            code=code,
            answer_type=answer_type,
            is_required=is_required,
            order=order,
            section=section,
            show_condition=show_cond,
            question_text=f'{code} question'
        )
        print(f'[0032] Created {code}')
        return q

    saq7 = get_or_create_question('SAQ7', 'SINGLE_CHOICE', True, max_order + 1, non_faskses)
    saq8 = get_or_create_question('SAQ8', 'SINGLE_CHOICE', True, max_order + 2, non_faskses)
    saq9 = get_or_create_question('SAQ9', 'SINGLE_CHOICE', True, max_order + 3, non_faskses)
    saqf = get_or_create_question('SAQF', 'SINGLE_CHOICE', True, max_order + 4, non_faskses)
    saqg = get_or_create_question('SAQG', 'SINGLE_CHOICE', True, max_order + 5, non_faskses)

    # Create choices only if they don't already exist
    if not QuestionChoice.objects.filter(question=saq7).exists():
        QuestionChoice.objects.create(question=saq7, value='SA7.1', order=1, next_question_code='SAQA')
        QuestionChoice.objects.create(question=saq7, value='SA7.2', order=2, next_question_code='SAQA')

    if not QuestionChoice.objects.filter(question=saq8).exists():
        QuestionChoice.objects.create(question=saq8, value='SA8.1', order=1, next_question_code='SAQA')
        QuestionChoice.objects.create(question=saq8, value='SA8.2', order=2, next_question_code='SAQA')

    if not QuestionChoice.objects.filter(question=saq9).exists():
        QuestionChoice.objects.create(question=saq9, value='SA9.1', order=1, next_question_code='SAQA')
        QuestionChoice.objects.create(question=saq9, value='SA9.2', order=2, next_question_code='SAQA')

    if not QuestionChoice.objects.filter(question=saqf).exists():
        QuestionChoice.objects.create(question=saqf, value='SAF1', order=1, next_question_code='SAQG')
        QuestionChoice.objects.create(question=saqf, value='SAF2', order=2, next_question_code='SAQG')

    print('[0032] SAQ7, SAQ8, SAQ9, SAQF, SAQG ensured in NON-FASKES section')

    # ── Fix 2: Fix show_condition on SAQA–SAQG (QL1 → QL2) — use filter().update() ──
    sa_questions = ['SAQA', 'SAQB', 'SAQC', 'SAQD', 'SAQE', 'SAQF', 'SAQG']
    for code in sa_questions:
        updated = Question.objects.filter(code=code).update(
            show_condition={'question_code': 'QL2', 'operator': 'contains', 'value': 'SA'}
        )
        print(f'[0032] Fixed show_condition on {code} (rows: {updated})')

    # ── Fix 3: Update SAQ6 choices to point to SAQ7 ──────────────────────────
    saq6 = Question.objects.filter(code='SAQ6').first()
    if saq6:
        QuestionChoice.objects.filter(question=saq6).delete()
        QuestionChoice.objects.create(question=saq6, value='SA6.1', order=1, next_question_code='SAQ7')
        QuestionChoice.objects.create(question=saq6, value='SA6.2', order=2, next_question_code='SAQ7')
        print('[0032] Updated SAQ6 choices to point to SAQ7')
    else:
        print('[0032] SAQ6 not found — cannot update choices')

    # ── Fix 4: Update SAQ5 choices to point to SAQ6 ─────────────────────────
    saq5 = Question.objects.filter(code='SAQ5').first()
    if saq5:
        QuestionChoice.objects.filter(question=saq5).delete()
        QuestionChoice.objects.create(question=saq5, value='SA5.1', order=1, next_question_code='SAQ6')
        QuestionChoice.objects.create(question=saq5, value='SA5.2', order=2, next_question_code='SAQ6')
        print('[0032] Updated SAQ5 choices to point to SAQ6')
    else:
        print('[0032] SAQ5 not found — cannot update choices')

    print('[0032] NON-FASKES SAQ chain fix complete')


def revert_saq_chain(apps, schema_editor):
    Question = apps.get_model('survey', 'Question')
    QuestionChoice = apps.get_model('survey', 'QuestionChoice')

    for code in ['SAQ7', 'SAQ8', 'SAQ9', 'SAQF', 'SAQG']:
        Question.objects.filter(code=code).delete()
        print(f'[0032-revert] Deleted {code}')

    for code in ['SAQA', 'SAQB', 'SAQC', 'SAQD', 'SAQE', 'SAQF', 'SAQG']:
        Question.objects.filter(code=code).update(
            show_condition={'question_code': 'QL1', 'operator': 'contains', 'value': 'SA'}
        )
        print(f'[0032-revert] Reverted show_condition on {code}')

    for code in ['SAQ5', 'SAQ6']:
        q = Question.objects.filter(code=code).first()
        if q:
            QuestionChoice.objects.filter(question=q).delete()
            print(f'[0032-revert] Cleared choices on {code}')


class Migration(migrations.Migration):

    dependencies = [
        ('survey', '0031_update_iqc_skip_logic'),
    ]

    operations = [
        migrations.RunPython(fix_saq_chain, reverse_code=revert_saq_chain),
    ]
