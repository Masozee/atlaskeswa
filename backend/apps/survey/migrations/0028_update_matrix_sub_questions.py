from django.db import migrations


# Shared sub-questions for all INTERVENTION_MATRIX questions.
# Each selected intervention row stores answers to these 9 questions.
INTERVENTION_SUB_QUESTIONS = [
    {
        "code": "KAPASITAS",
        "label": "Berapa kapasitas layanan intervensi tersebut?",
        "type": "number",
    },
    {
        "code": "JUMLAH_PASIEN",
        "label": "Berapa jumlah pasien saat ini?",
        "type": "number",
    },
    {
        "code": "WAKTU_TUNGGU",
        "label": "Berapa waktu tunggu rata-rata untuk melayani setiap pasien? (menit)",
        "type": "number",
    },
    {
        "code": "SUMBER_PEMBIAYAAN",
        "label": "Dari mana sumber pembiayaannya?",
        "type": "multiple_choice",
        "options": [
            "Jaminan Kesehatan Nasional (JKN/BPJS Kesehatan)",
            "Asuransi Kesehatan Swasta",
            "Pembayaran Mandiri/Keluarga",
        ],
    },
    {
        "code": "TARIF_RATA",
        "label": "Berapa tarif rata-rata per pasien? (Rp)",
        "type": "number",
    },
    {
        "code": "JENIS_KELAMIN",
        "label": "Jenis kelamin pasien yang dilayani?",
        "type": "multiple_choice",
        "options": ["Laki-laki", "Perempuan"],
    },
    {
        "code": "BATASAN_USIA",
        "label": "Batasan usia pasien yang dilayani?",
        "type": "multiple_choice",
        "options": ["Anak (0-15)", "Dewasa (15-59)", "Lansia (≥59)", "Tidak ada batasan usia"],
    },
    {
        "code": "JAM_OPERASIONAL",
        "label": "Kapan jam operasional dari intervensi tersebut?",
        "type": "operating_hours",
        "days": ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"],
    },
    {
        "code": "KETERKAITAN",
        "label": "Apakah layanan intervensi tersebut memiliki keterkaitan dengan fasilitas lain?",
        "type": "boolean",
    },
]

# New config format: no predefined rows (user-defined), only sub_questions
NEW_MATRIX_CONFIG = {
    "sub_questions": INTERVENTION_SUB_QUESTIONS,
}


def update_matrix_configs(apps, schema_editor):
    Question = apps.get_model('survey', 'Question')

    updated = Question.objects.filter(answer_type='INTERVENTION_MATRIX')
    count = 0
    for q in updated:
        q.table_config = NEW_MATRIX_CONFIG
        q.save(update_fields=['table_config'])
        print(f'[0028] Updated table_config for {q.code}')
        count += 1

    print(f'[0028] Updated {count} INTERVENTION_MATRIX question(s)')


def revert_matrix_configs(apps, schema_editor):
    """Reverse: restore old DQB/OQB configs with fixed rows and columns."""
    Question = apps.get_model('survey', 'Question')

    HARI_OPTIONS = [
        {"value": "SENIN", "label": "Senin"},
        {"value": "SELASA", "label": "Selasa"},
        {"value": "RABU", "label": "Rabu"},
        {"value": "KAMIS", "label": "Kamis"},
        {"value": "JUMAT", "label": "Jumat"},
        {"value": "SABTU", "label": "Sabtu"},
        {"value": "MINGGU", "label": "Minggu"},
    ]

    old_configs = {
        'DQB': {
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
                {"code": "JADWAL_HARI", "label": "Hari", "type": "multiple_choice", "options": HARI_OPTIONS},
                {"code": "JADWAL_JAM", "label": "Jam (contoh: 08:00-12:00)", "type": "text"},
                {"code": "DURASI", "label": "Durasi (menit)", "type": "number"},
                {"code": "KAPASITAS", "label": "Kapasitas (orang)", "type": "number"},
            ],
        },
        'OQB': {
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
        },
    }

    for code, config in old_configs.items():
        try:
            q = Question.objects.get(code=code, answer_type='INTERVENTION_MATRIX')
            q.table_config = config
            q.save(update_fields=['table_config'])
        except Question.DoesNotExist:
            pass


class Migration(migrations.Migration):

    dependencies = [
        ('survey', '0027_set_staff_table_configs'),
    ]

    operations = [
        migrations.RunPython(update_matrix_configs, reverse_code=revert_matrix_configs),
    ]
