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

    def get_next_code(code):
        """Find the question object by code"""
        try:
            return Question.objects.get(code=code)
        except Question.DoesNotExist:
            return None

    # SAQA exists, use it as target for SAQ7, SAQ8, SAQ9
    saqa = get_next_code('SAQA')

    # SAQF and SAQG don't exist — create them
    def create_question(code, answer_type, is_required, order, section, show_cond=None):
        return Question.objects.create(
            code=code,
            answer_type=answer_type,
            is_required=is_required,
            order=order,
            section=section,
            show_condition=show_cond,
            question_text=f'{code} question'  # placeholder, should be updated in production
        )

    # Create SAQ7
    saq7 = create_question('SAQ7', 'SINGLE_CHOICE', True, max_order + 1, non_faskses)

    # Create SAQ8
    saq8 = create_question('SAQ8', 'SINGLE_CHOICE', True, max_order + 2, non_faskses)

    # Create SAQ9
    saq9 = create_question('SAQ9', 'SINGLE_CHOICE', True, max_order + 3, non_faskses)

    # Create SAQF
    saqf = create_question('SAQF', 'SINGLE_CHOICE', True, max_order + 4, non_faskses)

    # Create SAQG
    saqg = create_question('SAQG', 'SINGLE_CHOICE', True, max_order + 5, non_faskses)

    # Create choices for SAQ7 → SAQA
    QuestionChoice.objects.create(question=saq7, value='SA7.1', order=1, next_question_code='SAQA')
    QuestionChoice.objects.create(question=saq7, value='SA7.2', order=2, next_question_code='SAQA')

    # Create choices for SAQ8 → SAQA
    QuestionChoice.objects.create(question=saq8, value='SA8.1', order=1, next_question_code='SAQA')
    QuestionChoice.objects.create(question=saq8, value='SA8.2', order=2, next_question_code='SAQA')

    # Create choices for SAQ9 → SAQA
    QuestionChoice.objects.create(question=saq9, value='SA9.1', order=1, next_question_code='SAQA')
    QuestionChoice.objects.create(question=saq9, value='SA9.2', order=2, next_question_code='SAQA')

    # Create choices for SAQF (two options leading to SAQG)
    QuestionChoice.objects.create(question=saqf, value='SAF1', order=1, next_question_code='SAQG')
    QuestionChoice.objects.create(question=saqf, value='SAF2', order=2, next_question_code='SAQG')

    # SAQG has no next (terminal question in chain)
    print('[0032] Created SAQ7, SAQ8, SAQ9, SAQF, SAQG in NON-FASKES section')

    # ── Fix 2: Fix show_condition on SAQA–SAQG (QL1 → QL2) ─────────────────
    sa_questions = ['SAQA', 'SAQB', 'SAQC', 'SAQD', 'SAQE']
    for code in sa_questions:
        try:
            q = Question.objects.get(code=code)
            old_cond = q.show_condition
            q.show_condition = {'question_code': 'QL2', 'operator': 'contains', 'value': 'SA'}
            q.save(update_fields=['show_condition'])
            print(f'[0032] Fixed show_condition on {code}: {old_cond} → {q.show_condition}')
        except Question.DoesNotExist:
            print(f'[0032] {code} not found — skipping')

    # Also fix SAQF and SAQG once created
    for code in ['SAQF', 'SAQG']:
        try:
            q = Question.objects.get(code=code)
            q.show_condition = {'question_code': 'QL2', 'operator': 'contains', 'value': 'SA'}
            q.save(update_fields=['show_condition'])
            print(f'[0032] Set show_condition on {code}: {q.show_condition}')
        except Question.DoesNotExist:
            print(f'[0032] {code} not found — skipping')

    # ── Fix 3: Update SAQ6 choices to point to SAQ7 ──────────────────────────
    saq6 = get_next_code('SAQ6')
    if saq6:
        # Clear old choices and add one pointing to SAQ7
        QuestionChoice.objects.filter(question=saq6).delete()
        QuestionChoice.objects.create(question=saq6, value='SA6.1', order=1, next_question_code='SAQ7')
        QuestionChoice.objects.create(question=saq6, value='SA6.2', order=2, next_question_code='SAQ7')
        print('[0032] Updated SAQ6 choices to point to SAQ7')
    else:
        print('[0032] SAQ6 not found — cannot update choices')

    # ── Fix 4: Update SAQ5 to point to SAQ6 ─────────────────────────────────
    saq5 = get_next_code('SAQ5')
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

    # Delete SAQ7, SAQ8, SAQ9, SAQF, SAQG
    for code in ['SAQ7', 'SAQ8', 'SAQ9', 'SAQF', 'SAQG']:
        try:
            q = Question.objects.get(code=code)
            q.delete()
            print(f'[0032-revert] Deleted {code}')
        except Question.DoesNotExist:
            print(f'[0032-revert] {code} not found — skipping')

    # Revert SAQA–SAQE show_condition to QL1
    sa_questions = ['SAQA', 'SAQB', 'SAQC', 'SAQD', 'SAQE', 'SAQF', 'SAQG']
    for code in sa_questions:
        try:
            q = Question.objects.get(code=code)
            q.show_condition = {'question_code': 'QL1', 'operator': 'contains', 'value': 'SA'}
            q.save(update_fields=['show_condition'])
            print(f'[0032-revert] Reverted show_condition on {code}')
        except Question.DoesNotExist:
            print(f'[0032-revert] {code} not found — skipping')

    # Revert SAQ5 and SAQ6 choices to empty
    for code in ['SAQ5', 'SAQ6']:
        try:
            q = Question.objects.get(code=code)
            QuestionChoice.objects.filter(question=q).delete()
            print(f'[0032-revert] Cleared choices on {code}')
        except Question.DoesNotExist:
            print(f'[0032-revert] {code} not found — skipping')


class Migration(migrations.Migration):

    dependencies = [
        ('survey', '0031_update_iqc_skip_logic'),
    ]

    operations = [
        migrations.RunPython(fix_saq_chain, reverse_code=revert_saq_chain),
    ]