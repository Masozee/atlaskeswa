from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('survey', '0015_fix_detail_questions'),
    ]

    operations = [
        migrations.AlterField(
            model_name='question',
            name='answer_type',
            field=models.CharField(
                max_length=30,
                choices=[
                    ('TEXT', 'Teks'),
                    ('TEXTAREA', 'Teks Panjang'),
                    ('NUMBER', 'Angka'),
                    ('INTEGER', 'Bilangan Bulat'),
                    ('DATE', 'Tanggal'),
                    ('TIME', 'Waktu'),
                    ('BOOLEAN', 'Ya/Tidak'),
                    ('SINGLE_CHOICE', 'Pilihan Tunggal'),
                    ('MULTIPLE_CHOICE', 'Pilihan Ganda'),
                    ('GEO_PROVINSI', 'Pilih Provinsi'),
                    ('GEO_KABUPATEN', 'Pilih Kabupaten/Kota'),
                    ('GEO_KECAMATAN', 'Pilih Kecamatan'),
                    ('GEO_DESA', 'Pilih Desa/Kelurahan'),
                    ('GEO_FULL', 'Alamat Lengkap (Provinsi s/d Desa)'),
                    ('COVERAGE_LEVEL', 'Tingkat Cakupan Wilayah'),
                    ('PHONE', 'Nomor Telepon'),
                    ('EMAIL', 'Email'),
                    ('URL', 'Website'),
                    ('FILE', 'Upload File'),
                    ('GPS', 'Koordinat GPS'),
                    ('STAFF_TABLE', 'Tabel Data Staf'),
                    ('DIAGNOSIS_TABLE', 'Tabel Diagnosis'),
                    ('REPEATING_TABLE', 'Tabel Dinamis (baris berulang)'),
                    ('INTERVENTION_MATRIX', 'Matriks Intervensi (baris pilih + kolom detail)'),
                ],
            ),
        ),
    ]
