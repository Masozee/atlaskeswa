from django.db import migrations


DEFAULT_INTERVENTION_ROWS = [
    "Konseling",
    "Psikoterapi",
    "Terapi Farmakologis (Pemberian Obat Psikiatri)",
    "Edukasi Psikososial (Psychoeducation)",
    "Terapi Aktivitas/Rehabilitasi Psikososial",
    "Manajemen Kasus/Pendampingan",
    "Intervensi Krisis Rawat Jalan",
    "Lainnya, Sebutkan: ................",
]


def add_default_rows(apps, schema_editor):
    Question = apps.get_model('survey', 'Question')
    updated = Question.objects.filter(answer_type='INTERVENTION_MATRIX')
    count = 0
    for q in updated:
        config = q.table_config or {}
        config['default_rows'] = DEFAULT_INTERVENTION_ROWS
        q.table_config = config
        q.save(update_fields=['table_config'])
        print(f'[0029] Added default_rows to {q.code}')
        count += 1
    print(f'[0029] Updated {count} INTERVENTION_MATRIX question(s)')


def remove_default_rows(apps, schema_editor):
    Question = apps.get_model('survey', 'Question')
    for q in Question.objects.filter(answer_type='INTERVENTION_MATRIX'):
        config = q.table_config or {}
        config.pop('default_rows', None)
        q.table_config = config
        q.save(update_fields=['table_config'])


class Migration(migrations.Migration):

    dependencies = [
        ('survey', '0028_update_matrix_sub_questions'),
    ]

    operations = [
        migrations.RunPython(add_default_rows, reverse_code=remove_default_rows),
    ]
