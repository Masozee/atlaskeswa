from django.db import migrations


# Standard staff position rows for mental health facilities (DESDE-LTC categories)
JABATAN_ROWS = [
    {"code": "DOKTER_SPESIALIS_JIWA", "label": "Dokter Spesialis Jiwa (Psikiater)"},
    {"code": "DOKTER_UMUM", "label": "Dokter Umum"},
    {"code": "PSIKOLOG_KLINIS", "label": "Psikolog Klinis"},
    {"code": "PERAWAT", "label": "Perawat"},
    {"code": "PEKERJA_SOSIAL", "label": "Pekerja Sosial"},
    {"code": "TERAPIS_OKUPASI", "label": "Terapis Okupasi"},
    {"code": "TENAGA_FARMASI", "label": "Tenaga Farmasi"},
    {"code": "TENAGA_GIZI", "label": "Tenaga Gizi"},
    {"code": "TENAGA_ADMINISTRASI", "label": "Tenaga Administrasi"},
    {"code": "TENAGA_LAINNYA", "label": "Tenaga Lainnya"},
]

GENDER_COLUMNS = [
    {"code": "LAKI_LAKI", "label": "Laki-laki", "type": "number"},
    {"code": "PEREMPUAN", "label": "Perempuan", "type": "number"},
]

STAFF_TABLE_CONFIG = {
    "rows": JABATAN_ROWS,
    "columns": GENDER_COLUMNS,
}

STAFF_TABLE_QUESTIONS = [
    # (code, description)
    ("RQF", "Jumlah staf layanan rawat inap berdasarkan jabatan dan jenis kelamin"),
    ("DQC", "Jumlah staf layanan perawatan harian berdasarkan jabatan dan jenis kelamin"),
    ("OQE", "Jabatan staf layanan rawat jalan berdasarkan jenis kelamin"),
    ("IQI", "Jabatan staf layanan informasi berdasarkan jenis kelamin"),
]


def set_staff_table_configs(apps, schema_editor):
    Question = apps.get_model('survey', 'Question')
    for code, desc in STAFF_TABLE_QUESTIONS:
        try:
            q = Question.objects.get(code=code, answer_type='STAFF_TABLE')
            q.table_config = STAFF_TABLE_CONFIG
            q.save(update_fields=['table_config'])
            print(f'[0027] Set table_config for {code} ({desc})')
        except Question.DoesNotExist:
            print(f'[0027] {code} (STAFF_TABLE) not found, skipping')
        except Exception as e:
            print(f'[0027] ERROR setting {code}: {e}')


def clear_staff_table_configs(apps, schema_editor):
    Question = apps.get_model('survey', 'Question')
    for code, _ in STAFF_TABLE_QUESTIONS:
        try:
            q = Question.objects.get(code=code)
            q.table_config = None
            q.save(update_fields=['table_config'])
        except Question.DoesNotExist:
            pass


class Migration(migrations.Migration):

    dependencies = [
        ('survey', '0026_set_intervention_matrix_table_configs'),
    ]

    operations = [
        migrations.RunPython(set_staff_table_configs, reverse_code=clear_staff_table_configs),
    ]
