from django.db import migrations, models


def fix_soq_siq_chains(apps, schema_editor):
    Question = apps.get_model('survey', 'Question')
    QuestionChoice = apps.get_model('survey', 'QuestionChoice')

    print('[0033] Starting SOQ/SIQ chain fixes...')

    # ── Fix SOQ9: Change SO2.3.1 from SOQ4 to SOQA (avoid loop back) ─────────
    soq9 = Question.objects.get(code='SOQ9')
    # Remove existing choices and add correct ones
    QuestionChoice.objects.filter(question=soq9).delete()
    # SO2.3.1 -> SOQA (not SOQ4 — SOQ4 is not the right destination here)
    QuestionChoice.objects.create(question=soq9, value='SO2.3.1', order=1, next_question_code='SOQA')
    QuestionChoice.objects.create(question=soq9, value='SO2.3.2', order=2, next_question_code='SOQA')
    print('[0033] Fixed SOQ9: SO2.3.1 now points to SOQA (removed loop to SOQ4)')

    # ── Fix SOQ4: Add choices to continue to SOQA ────────────────────────────
    soq4 = Question.objects.get(code='SOQ4')
    # SOQ4 already has choices pointing to SOQA (SO1.2.1, SO1.2.2)
    existing = list(QuestionChoice.objects.filter(question=soq4).values_list('value', 'next_question_code'))
    print(f'[0033] SOQ4 existing choices: {existing}')
    if not existing:
        QuestionChoice.objects.create(question=soq4, value='SO4.1', order=1, next_question_code='SOQA')
        QuestionChoice.objects.create(question=soq4, value='SO4.2', order=2, next_question_code='SOQA')
        print('[0033] Added choices to SOQ4')

    # ── Add missing SOQD-SOQG to DETAIL section ──────────────────────────────
    detail_section = Question.objects.get(code='SAQA').section  # Get DETAIL section

    def create_question(code, order, section):
        existing = Question.objects.filter(code=code).first()
        if existing:
            print(f'[0033] {code} already exists — skipping creation')
            return existing
        return Question.objects.create(
            code=code,
            answer_type='SINGLE_CHOICE',
            is_required=True,
            order=order,
            section=section,
            show_condition={'question_code': 'QL2', 'operator': 'contains', 'value': 'SO'},
            question_text=f'{code} question'
        )

    soqd = create_question('SOQD', 11, detail_section)
    soqe = create_question('SOQE', 12, detail_section)
    sof = create_question('SOQF', 13, detail_section)
    sog = create_question('SOQG', 14, detail_section)

    # Add choices for SOQD -> SOQE
    QuestionChoice.objects.create(question=soqd, value='SOD1', order=1, next_question_code='SOQE')
    QuestionChoice.objects.create(question=soqd, value='SOD2', order=2, next_question_code='SOQE')
    print('[0033] Created SOQD -> SOQE')

    # SOQE -> SOQF (no choices, linear)
    # SOQF -> SOQG
    QuestionChoice.objects.create(question=sof, value='SOF1', order=1, next_question_code='SOQG')
    QuestionChoice.objects.create(question=sof, value='SOF2', order=2, next_question_code='SOQG')
    print('[0033] Created SOQF -> SOQG')

    # SOQG is terminal (no next)
    print('[0033] SOQG is terminal')

    # ── Fix show_condition on SOQA-SOQG (QL1 → QL2) ──────────────────────────
    so_detail_codes = ['SOQA', 'SOQB', 'SOQC', 'SOQD', 'SOQE', 'SOQF', 'SOQG']
    for code in so_detail_codes:
        try:
            q = Question.objects.get(code=code)
            old_cond = q.show_condition
            q.show_condition = {'question_code': 'QL2', 'operator': 'contains', 'value': 'SO'}
            q.save(update_fields=['show_condition'])
            print(f'[0033] Fixed show_condition on {code}')
        except Question.DoesNotExist:
            print(f'[0033] {code} not found — skipping')

    # ── Add missing SIQ detail questions (SIQB-SIQG) ─────────────────────────
    siqb = create_question('SIQB', 12, detail_section)
    siqc = create_question('SIQC', 13, detail_section)
    siqd = create_question('SIQD', 14, detail_section)
    siqe = create_question('SIQE', 15, detail_section)
    siqf = create_question('SIQF', 16, detail_section)
    siqg = create_question('SIQG', 17, detail_section)

    # SIQB -> SIQC (choices)
    QuestionChoice.objects.create(question=siqb, value='SIB1', order=1, next_question_code='SIQC')
    QuestionChoice.objects.create(question=siqb, value='SIB2', order=2, next_question_code='SIQC')
    # SIQC -> SIQD
    QuestionChoice.objects.create(question=siqc, value='SIC1', order=1, next_question_code='SIQD')
    QuestionChoice.objects.create(question=siqc, value='SIC2', order=2, next_question_code='SIQD')
    # SIQD -> SIQE
    QuestionChoice.objects.create(question=siqd, value='SID1', order=1, next_question_code='SIQE')
    QuestionChoice.objects.create(question=siqd, value='SID2', order=2, next_question_code='SIQE')
    # SIQE -> SIQF
    QuestionChoice.objects.create(question=siqe, value='SIE1', order=1, next_question_code='SIQF')
    QuestionChoice.objects.create(question=siqe, value='SIE2', order=2, next_question_code='SIQF')
    # SIQF -> SIQG
    QuestionChoice.objects.create(question=siqf, value='SIF1', order=1, next_question_code='SIQG')
    QuestionChoice.objects.create(question=siqf, value='SIF2', order=2, next_question_code='SIQG')
    # SIQG is terminal

    print('[0033] Created SIQB-SIQG detail chain')

    # ── Fix show_condition on SIQA-SIQG (QL1 → QL2) ─────────────────────────
    si_detail_codes = ['SIQA', 'SIQB', 'SIQC', 'SIQD', 'SIQE', 'SIQF', 'SIQG']
    for code in si_detail_codes:
        try:
            q = Question.objects.get(code=code)
            old_cond = q.show_condition
            q.show_condition = {'question_code': 'QL2', 'operator': 'contains', 'value': 'SI'}
            q.save(update_fields=['show_condition'])
            print(f'[0033] Fixed show_condition on {code}')
        except Question.DoesNotExist:
            print(f'[0033] {code} not found — skipping')

    print('[0033] SOQ/SIQ chain fixes complete')


def revert_soq_siq_chains(apps, schema_editor):
    Question = apps.get_model('survey', 'Question')
    QuestionChoice = apps.get_model('survey', 'QuestionChoice')

    # Revert SOQ9
    soq9 = Question.objects.get(code='SOQ9')
    QuestionChoice.objects.filter(question=soq9).delete()
    QuestionChoice.objects.create(question=soq9, value='SO2.3.1', order=1, next_question_code='SOQ4')
    QuestionChoice.objects.create(question=soq9, value='SO2.3.2', order=2, next_question_code='SOQA')

    # Delete new questions
    for code in ['SOQD', 'SOQE', 'SOQF', 'SOQG', 'SIQB', 'SIQC', 'SIQD', 'SIQE', 'SIQF', 'SIQG']:
        try:
            Question.objects.get(code=code).delete()
        except Question.DoesNotExist:
            pass

    # Revert show_conditions to QL1
    for code in ['SOQA', 'SOQB', 'SOQC', 'SOQD', 'SOQE', 'SOQF', 'SOQG',
                 'SIQA', 'SIQB', 'SIQC', 'SIQD', 'SIQE', 'SIQF', 'SIQG']:
        try:
            q = Question.objects.get(code=code)
            if 'QL1' not in str(q.show_condition):
                continue
            # Determine the correct QL2 value from the code prefix
            prefix = code[:2]  # 'SO' or 'SI'
            q.show_condition = {'question_code': 'QL1', 'operator': 'contains', 'value': prefix}
            q.save(update_fields=['show_condition'])
        except Question.DoesNotExist:
            pass


class Migration(migrations.Migration):

    dependencies = [
        ('survey', '0032_fix_saq_chain'),
    ]

    operations = [
        migrations.RunPython(fix_soq_siq_chains, reverse_code=revert_soq_siq_chains),
    ]