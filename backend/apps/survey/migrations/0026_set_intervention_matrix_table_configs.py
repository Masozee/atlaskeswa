from django.db import migrations


# Shared day-of-week options for schedule columns
HARI_OPTIONS = [
    {"value": "SENIN", "label": "Senin"},
    {"value": "SELASA", "label": "Selasa"},
    {"value": "RABU", "label": "Rabu"},
    {"value": "KAMIS", "label": "Kamis"},
    {"value": "JUMAT", "label": "Jumat"},
    {"value": "SABTU", "label": "Sabtu"},
    {"value": "MINGGU", "label": "Minggu"},
]

# DQB: Day Care Intervention Matrix
# "APA SAJA PROGRAM INTERVENSI YANG DITAWARKAN KEPADA PASIEN?
#  KAPAN JADWAL PROGRAM INTERVENSI (JAM DAN HARI)?
#  BERAPA LAMA DURASI SETIAP PROGRAM?"
DQB_CONFIG = {
    "rows": [
        {"code": "PSIKOTERAPI_INDIVIDU", "label": "Psikoterapi Individu"},
        {"code": "PSIKOTERAPI_KELOMPOK", "label": "Psikoterapi Kelompok"},
        {"code": "TERAPI_KELUARGA", "label": "Terapi Keluarga"},
        {"code": "TERAPI_OKUPASI", "label": "Terapi Okupasi"},
        {"code": "AKTIVITAS_HARIAN", "label": "Aktivitas Kehidupan Sehari-hari"},
        {"code": "KONSELING", "label": "Konseling"},
        {"code": "KONSULTASI_MEDIS", "label": "Konsultasi Medis/Psikiatri"},
        {"code": "TERAPI_SENI", "label": "Terapi Seni/Ekspresi"},
        {"code": "KETERAMPILAN_KERJA", "label": "Keterampilan Kerja"},
        {"code": "OLAHRAGA", "label": "Olahraga/Terapi Fisik"},
    ],
    "columns": [
        {
            "code": "JADWAL_HARI",
            "label": "Hari",
            "type": "multiple_choice",
            "options": HARI_OPTIONS,
        },
        {"code": "JADWAL_JAM", "label": "Jam (contoh: 08:00-12:00)", "type": "text"},
        {"code": "DURASI", "label": "Durasi (menit)", "type": "number"},
        {"code": "KAPASITAS", "label": "Kapasitas (orang)", "type": "number"},
    ],
}

# OQB: Outpatient Intervention Matrix
# "JENIS INTERVENSI APA SAJA YANG DIBERIKAN DALAM LAYANAN RAWAT JALAN INI?"
OQB_CONFIG = {
    "rows": [
        {"code": "PSIKOTERAPI_INDIVIDU", "label": "Psikoterapi Individu"},
        {"code": "PSIKOTERAPI_KELOMPOK", "label": "Psikoterapi Kelompok"},
        {"code": "TERAPI_KELUARGA", "label": "Terapi Keluarga"},
        {"code": "TERAPI_OKUPASI", "label": "Terapi Okupasi"},
        {"code": "AKTIVITAS_HARIAN", "label": "Aktivitas Kehidupan Sehari-hari"},
        {"code": "KONSELING", "label": "Konseling"},
        {"code": "KONSULTASI_PSIKIATRI", "label": "Konsultasi Psikiatri"},
    ],
    "columns": [
        {"code": "FREKUENSI", "label": "Frekuensi", "type": "text"},
        {"code": "DURASI", "label": "Durasi (menit)", "type": "number"},
        {"code": "KAPASITAS", "label": "Kapasitas", "type": "number"},
    ],
}


def set_table_configs(apps, schema_editor):
    Question = apps.get_model('survey', 'Question')

    configs = [
        ('DQB', 'INTERVENTION_MATRIX', DQB_CONFIG),
        ('OQB', 'INTERVENTION_MATRIX', OQB_CONFIG),
    ]

    for code, answer_type, config in configs:
        try:
            q = Question.objects.get(code=code, answer_type=answer_type)
            q.table_config = config
            q.save(update_fields=['table_config'])
            print(f'[0026] Set table_config for {code}')
        except Question.DoesNotExist:
            print(f'[0026] {code} ({answer_type}) not found, skipping')
        except Exception as e:
            print(f'[0026] ERROR setting {code}: {e}')


def clear_table_configs(apps, schema_editor):
    Question = apps.get_model('survey', 'Question')
    for code in ('DQB', 'OQB'):
        try:
            q = Question.objects.get(code=code)
            q.table_config = None
            q.save(update_fields=['table_config'])
        except Question.DoesNotExist:
            pass


class Migration(migrations.Migration):

    dependencies = [
        ('survey', '0025_add_started_at_field'),
    ]

    operations = [
        migrations.RunPython(set_table_configs, reverse_code=clear_table_configs),
    ]
