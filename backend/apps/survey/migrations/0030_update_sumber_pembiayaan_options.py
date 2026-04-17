from django.db import migrations


SUMBER_PEMBIAYAAN_OPTIONS = [
    "Jaminan Kesehatan Nasional (JKN/BPJS Kesehatan)",
    "Asuransi Kesehatan Swasta",
    "Pembayaran Mandiri/Keluarga",
    "Tidak ditentukan (Sukarela)",
    "Tidak berbayar",
]


def update_sumber_pembiayaan(apps, schema_editor):
    Question = apps.get_model('survey', 'Question')
    updated = Question.objects.filter(answer_type='INTERVENTION_MATRIX')
    count = 0
    for q in updated:
        config = q.table_config or {}
        sub_questions = config.get('sub_questions', [])
        for sq in sub_questions:
            if sq.get('code') == 'SUMBER_PEMBIAYAAN':
                sq['options'] = SUMBER_PEMBIAYAAN_OPTIONS
        config['sub_questions'] = sub_questions
        q.table_config = config
        q.save(update_fields=['table_config'])
        print(f'[0030] Updated SUMBER_PEMBIAYAAN options for {q.code}')
        count += 1
    print(f'[0030] Updated {count} INTERVENTION_MATRIX question(s)')


def revert_sumber_pembiayaan(apps, schema_editor):
    ORIGINAL_OPTIONS = [
        "Jaminan Kesehatan Nasional (JKN/BPJS Kesehatan)",
        "Asuransi Kesehatan Swasta",
        "Pembayaran Mandiri/Keluarga",
    ]
    Question = apps.get_model('survey', 'Question')
    for q in Question.objects.filter(answer_type='INTERVENTION_MATRIX'):
        config = q.table_config or {}
        sub_questions = config.get('sub_questions', [])
        for sq in sub_questions:
            if sq.get('code') == 'SUMBER_PEMBIAYAAN':
                sq['options'] = ORIGINAL_OPTIONS
        config['sub_questions'] = sub_questions
        q.table_config = config
        q.save(update_fields=['table_config'])


class Migration(migrations.Migration):

    dependencies = [
        ('survey', '0029_add_default_rows_to_matrix'),
    ]

    operations = [
        migrations.RunPython(update_sumber_pembiayaan, reverse_code=revert_sumber_pembiayaan),
    ]