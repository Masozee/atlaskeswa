from django.db import migrations


def set_oqb_table_config(apps, schema_editor):
    """Set table_config for OQB (INTERVENTION_MATRIX) question."""
    Question = apps.get_model('survey', 'Question')

    # OQB: JENIS INTERVENSI APA SAJA YANG DIBERIKAN DALAM LAYANAN RAWAT JALAN INI?
    # Based on DESDE-LTC outpatient intervention types
    table_config = {
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
        ]
    }

    try:
        oqb = Question.objects.get(code='OQB', answer_type='INTERVENTION_MATRIX')
        oqb.table_config = table_config
        oqb.save(update_fields=['table_config'])
        print('[0023] Set table_config for OQB')
    except Question.DoesNotExist:
        print('[0023] OQB question not found, skipping')


def clear_oqb_table_config(apps, schema_editor):
    """Clear table_config for OQB question."""
    Question = apps.get_model('survey', 'Question')
    try:
        oqb = Question.objects.get(code='OQB')
        oqb.table_config = None
        oqb.save(update_fields=['table_config'])
        print('[0023] Cleared table_config for OQB')
    except Question.DoesNotExist:
        pass


class Migration(migrations.Migration):

    dependencies = [
        ('survey', '0022_add_inline_only_sentinel_to_detail'),
    ]

    operations = [
        migrations.RunPython(set_oqb_table_config, reverse_code=clear_oqb_table_config),
    ]
