from django.db import migrations


def fix_nonfaskes_show_conditions(apps, schema_editor):
    Question = apps.get_model('survey', 'Question')

    # ── SA chain (Accessibility NON-FASKES) ──────────────────────────────────
    # SAQA was already fixed to QL2. Fix the remaining questions.
    sa_ql1_codes = ['SAQB', 'SAQC', 'SAQD', 'SAQE']
    for code in sa_ql1_codes:
        updated = Question.objects.filter(code=code).update(
            show_condition={'value': 'SA', 'operator': 'contains', 'question_code': 'QL2'}
        )
        print(f'[0034] SA: {code} → QL2 (rows updated: {updated})')

    # SAQF has show_condition=None — add QL2 guard
    updated = Question.objects.filter(code='SAQF').update(
        show_condition={'value': 'SA', 'operator': 'contains', 'question_code': 'QL2'}
    )
    print(f'[0034] SA: SAQF show_condition set to QL2 (rows updated: {updated})')

    # ── SD chain (Day Care NON-FASKES) ───────────────────────────────────────
    # SDQA was already fixed to QL2. Fix the remaining questions.
    sd_ql1_codes = ['SDQB', 'SDQC', 'SDQD', 'SDQE']
    for code in sd_ql1_codes:
        updated = Question.objects.filter(code=code).update(
            show_condition={'value': 'SD', 'operator': 'contains', 'question_code': 'QL2'}
        )
        print(f'[0034] SD: {code} → QL2 (rows updated: {updated})')

    # ── SI chain tail questions — add QL2 guard ──────────────────────────────
    # SIQA–SIQG were fixed by migration 0033. SIQH–SIQM still have show=None.
    si_tail_codes = ['SIQH', 'SIQI', 'SIQJ', 'SIQK', 'SIQL', 'SIQM']
    for code in si_tail_codes:
        updated = Question.objects.filter(code=code).update(
            show_condition={'value': 'SI', 'operator': 'contains', 'question_code': 'QL2'}
        )
        print(f'[0034] SI: {code} show_condition set to QL2 (rows updated: {updated})')

    # ── SR chain tail questions — add QL2 guard ──────────────────────────────
    # SRQA–SRQH already have QL2. SRQI–SRQL still have show=None.
    sr_tail_codes = ['SRQI', 'SRQJ', 'SRQK', 'SRQL']
    for code in sr_tail_codes:
        updated = Question.objects.filter(code=code).update(
            show_condition={'value': 'SR', 'operator': 'contains', 'question_code': 'QL2'}
        )
        print(f'[0034] SR: {code} show_condition set to QL2 (rows updated: {updated})')

    print('[0034] NON-FASKES detail show_condition fixes complete')


def revert_nonfaskes_show_conditions(apps, schema_editor):
    Question = apps.get_model('survey', 'Question')

    # Revert SA chain back to QL1
    for code in ['SAQB', 'SAQC', 'SAQD', 'SAQE']:
        Question.objects.filter(code=code).update(
            show_condition={'value': 'SA', 'operator': 'contains', 'question_code': 'QL1'}
        )
    Question.objects.filter(code='SAQF').update(show_condition=None)

    # Revert SD chain back to QL1
    for code in ['SDQB', 'SDQC', 'SDQD', 'SDQE']:
        Question.objects.filter(code=code).update(
            show_condition={'value': 'SD', 'operator': 'contains', 'question_code': 'QL1'}
        )

    # Revert SI tail back to None
    for code in ['SIQH', 'SIQI', 'SIQJ', 'SIQK', 'SIQL', 'SIQM']:
        Question.objects.filter(code=code).update(show_condition=None)

    # Revert SR tail back to None
    for code in ['SRQI', 'SRQJ', 'SRQK', 'SRQL']:
        Question.objects.filter(code=code).update(show_condition=None)


class Migration(migrations.Migration):

    dependencies = [
        ('survey', '0033_fix_soq_siq_chains'),
    ]

    operations = [
        migrations.RunPython(
            fix_nonfaskes_show_conditions,
            reverse_code=revert_nonfaskes_show_conditions,
        ),
    ]
