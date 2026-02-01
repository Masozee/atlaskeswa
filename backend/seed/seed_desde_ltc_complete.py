"""
Seed script for complete DESDE-LTC classification data (All 174 codes)
This includes both healthcare and non-healthcare hierarchical classification codes
Run with: python seed/seed_desde_ltc_complete.py (from backend directory)
"""
import os
import sys
import django

# Add parent directory to path so 'core' module can be found
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from apps.directory.models import MainTypeOfCare

def get_service_delivery_type(code):
    """Determine service delivery type from code prefix"""
    if code.startswith('R') or code.startswith('SR'):
        return 'RESIDENTIAL'
    elif code.startswith('D') or code.startswith('SD'):
        return 'DAY_CARE'
    elif code.startswith('O') or code.startswith('SO'):
        return 'OUTPATIENT'
    elif code.startswith('A') or code.startswith('SA'):
        return 'ACCESSIBILITY'
    elif code.startswith('I') or code.startswith('SI'):
        return 'INFORMATION'
    return 'OUTPATIENT'  # default

def is_healthcare_code(code):
    """Determine if code is healthcare (True) or non-healthcare (False)"""
    # Healthcare codes: R, D, O, A, I
    # Non-healthcare codes: SR, SD, SO, SA, SI
    return not code.startswith('S')

def seed_desde_ltc():
    """Seed complete DESDE-LTC Main Type of Care classifications (174 codes)"""
    print("Seeding complete DESDE-LTC classification codes...")
    print("Total codes to process: 174 (102 healthcare + 72 non-healthcare)\n")

    # Complete list of 174 DESDE-LTC codes
    DESDE_LTC_CODES = [
        # ========================================
        # HEALTHCARE FACILITIES (102 codes)
        # ========================================

        # R Series - Residential (25 codes)
        {'code': 'R', 'name': 'Layanan Rawat Inap', 'parent': None},
        {'code': 'R0', 'name': 'Layanan Rawat Inap, Akut, Terdapat Dokter Jaga 24 Jam, Non Rumah Sakit', 'parent': 'R'},
        {'code': 'R1', 'name': 'Layanan Rawat Inap, Akut, Terdapat Dokter Jaga 24 Jam, Rumah Sakit, Pemantauan Intensif', 'parent': 'R'},
        {'code': 'R2', 'name': 'Layanan Rawat Inap, Akut, Terdapat Dokter Jaga 24 Jam, Rumah Sakit, Intensitas Sedang', 'parent': 'R'},
        {'code': 'R3', 'name': 'Layanan Rawat Inap, Akut, Tidak Terdapat Dokter Jaga 24 Jam', 'parent': 'R'},
        {'code': 'R3.0', 'name': 'Layanan Rawat Inap, Akut, Tidak Terdapat Dokter Jaga 24 Jam, Rumah Sakit', 'parent': 'R3'},
        {'code': 'R3.1.1', 'name': 'Layanan Rawat Inap, Akut, Tidak Terdapat Dokter Jaga 24 Jam, Bukan Rumah Sakit, Kesehatan', 'parent': 'R3'},
        {'code': 'R3.1.2', 'name': 'Layanan Rawat Inap, Akut, Tidak Terdapat Dokter Jaga 24 Jam, Bukan Rumah Sakit, Non-Kesehatan', 'parent': 'R3'},
        {'code': 'R4', 'name': 'Layanan Rawat Inap, Non Akut, Tersedia Dokter Jaga 24 Jam, Rumah Sakit, Memiliki Batasan Waktu Tinggal', 'parent': 'R'},
        {'code': 'R5', 'name': 'Layanan Rawat Inap, Non Akut, Tersedia Dokter Jaga 24 Jam, Bukan Rumah Sakit, Memiliki Batasan Waktu Tinggal', 'parent': 'R'},
        {'code': 'R6', 'name': 'Layanan Rawat Inap, Non Akut, Tersedia Dokter Jaga 24 Jam, Rumah Sakit, Tidak Memiliki Batasan Waktu Tinggal', 'parent': 'R'},
        {'code': 'R7', 'name': 'Layanan Rawat Inap, Non Akut, Tersedia Dokter Jaga 24 Jam, Bukan Rumah Sakit, Tidak Memiliki Batasan Waktu Tinggal', 'parent': 'R'},
        {'code': 'R8', 'name': 'Layanan Rawat Inap, Non Akut, Tidak Tersedia Dokter Jaga 24 Jam, Memiliki Batasan Waktu Tinggal, Dukungan 24 Jam', 'parent': 'R'},
        {'code': 'R8.1', 'name': 'Layanan Rawat Inap, Non Akut, Tidak Tersedia Dokter Jaga 24 Jam, Memiliki Batasan Waktu Tinggal, Dukungan 24 Jam, Kurang Dari 4 Minggu', 'parent': 'R8'},
        {'code': 'R8.2', 'name': 'Layanan Rawat Inap, Non Akut, Tidak Tersedia Dokter Jaga 24 Jam, Memiliki Batasan Waktu Tinggal, Dukungan 24 Jam, Lebih Dari 4 Minggu', 'parent': 'R8'},
        {'code': 'R9', 'name': 'Layanan Rawat Inap, Non Akut, Tidak Tersedia Dokter Jaga 24 Jam, Memiliki Batasan Waktu Tinggal, Dukungan Harian', 'parent': 'R'},
        {'code': 'R9.1', 'name': 'Layanan Rawat Inap, Non Akut, Tidak Tersedia Dokter Jaga 24 Jam, Memiliki Batasan Waktu Tinggal, Dukungan Harian, Kurang Dari 4 Minggu', 'parent': 'R9'},
        {'code': 'R9.2', 'name': 'Layanan Rawat Inap, Non Akut, Tidak Tersedia Dokter Jaga 24 Jam, Memiliki Batasan Waktu Tinggal, Dukungan Harian, Lebih Dari 4 Minggu', 'parent': 'R9'},
        {'code': 'R10', 'name': 'Layanan Rawat Inap, Non Akut, Tidak Tersedia Dokter Jaga 24 Jam, Memiliki Batasan Waktu Tinggal, Dukungan Rendah', 'parent': 'R'},
        {'code': 'R10.1', 'name': 'Layanan Rawat Inap, Non Akut, Tidak Tersedia Dokter Jaga 24 Jam, Memiliki Batasan Waktu Tinggal, Dukungan Rendah, Kurang Dari 4 Minggu', 'parent': 'R10'},
        {'code': 'R10.2', 'name': 'Layanan Rawat Inap, Non Akut, Tidak Tersedia Dokter Jaga 24 Jam, Memiliki Batasan Waktu Tinggal, Dukungan Rendah, Lebih Dari 4 Minggu', 'parent': 'R10'},
        {'code': 'R11', 'name': 'Layanan Rawat Inap, Non Akut, Tidak Tersedia Dokter Jaga 24 Jam, Tidak Memiliki Batasan Waktu Tinggal, Dukungan 24 Jam', 'parent': 'R'},
        {'code': 'R12', 'name': 'Layanan Rawat Inap, Non Akut, Tidak Tersedia Dokter Jaga 24 Jam, Tidak Memiliki Batasan Waktu Tinggal, Dukungan Harian', 'parent': 'R'},
        {'code': 'R13', 'name': 'Layanan Rawat Inap, Non Akut, Tidak Tersedia Dokter Jaga 24 Jam, Tidak Memiliki Batasan Waktu Tinggal, Dukungan Rendah', 'parent': 'R'},
        {'code': 'R14', 'name': 'Layanan Rawat Inap, Non-Akut, Non-Akut Lainnya', 'parent': 'R'},

        # D Series - Day Care (31 codes)
        {'code': 'D', 'name': 'Layanan Perawatan Harian', 'parent': None},
        {'code': 'D0', 'name': 'Layanan Perawatan Harian, Akut, Episodik', 'parent': 'D'},
        {'code': 'D0.1', 'name': 'Layanan Perawatan Harian, Akut, Episodik, Intensif', 'parent': 'D0'},
        {'code': 'D0.2', 'name': 'Layanan Perawatan Harian, Akut, Episodik, Non-Intensif', 'parent': 'D0'},
        {'code': 'D1', 'name': 'Layanan Perawatan Harian, Akut, Berkelanjutan', 'parent': 'D'},
        {'code': 'D1.1', 'name': 'Layanan Perawatan Harian, Akut, Berkelanjutan, Intensif', 'parent': 'D1'},
        {'code': 'D1.2', 'name': 'Layanan Perawatan Harian, Akut, Berkelanjutan, Non-Intensif', 'parent': 'D1'},
        {'code': 'D2', 'name': 'Layanan Perawatan Harian, Non Akut, Pekerjaan, Intensitas Tinggi', 'parent': 'D'},
        {'code': 'D2.1', 'name': 'Layanan Perawatan Harian, Non Akut, Pekerjaan, Intensitas Tinggi, Ketentuan Umum', 'parent': 'D2'},
        {'code': 'D2.2', 'name': 'Layanan Perawatan Harian, Non Akut, Pekerjaan, Intensitas Tinggi, Ketentuan Khusus', 'parent': 'D2'},
        {'code': 'D3', 'name': 'Layanan Perawatan Harian, Non Akut, Program Persiapan Kerja, Intensitas Tinggi', 'parent': 'D'},
        {'code': 'D3.1', 'name': 'Layanan Perawatan Harian, Non Akut, Program Persiapan Kerja, Intensitas Tinggi, Menetapkan Batasan Waktu Tertentu', 'parent': 'D3'},
        {'code': 'D3.2', 'name': 'Layanan Perawatan Harian, Non Akut, Program Persiapan Kerja, Intensitas Tinggi, Tidak Terdapat Batasan Waktu Tertentu', 'parent': 'D3'},
        {'code': 'D4', 'name': 'Layanan Perawatan Harian, Non Akut, Program Harian Terstruktur Non Pekerjaan, Intensitas Tinggi', 'parent': 'D'},
        {'code': 'D4.1', 'name': 'Layanan Perawatan Harian, Non Akut, Perawatan Terstruktur Non-Kerja, Intensitas Tinggi, Perawatan Terkait Kesehatan', 'parent': 'D4'},
        {'code': 'D4.2', 'name': 'Layanan Perawatan Harian, Non Akut, Perawatan Terstruktur Non-Kerja, Intensitas Tinggi, Perawatan Terkait Pendidikan', 'parent': 'D4'},
        {'code': 'D4.3', 'name': 'Layanan Perawatan Harian, Non Akut, Perawatan Terstruktur Non-Kerja, Intensitas Tinggi, Perawatan Terkait Sosial dan Budaya', 'parent': 'D4'},
        {'code': 'D4.4', 'name': 'Layanan Perawatan Harian, Non Akut, Perawatan Terstruktur Non-Kerja, Intensitas Tinggi, Perawatan Terstruktur Non-Kerja Lainnya', 'parent': 'D4'},
        {'code': 'D5', 'name': 'Layanan Perawatan Harian, Non Akut, Perawatan Harian Tidak Terstruktur, Intensitas Tinggi', 'parent': 'D'},
        {'code': 'D6', 'name': 'Layanan Perawatan Harian, Non Akut, Pekerjaan, Intensitas Rendah', 'parent': 'D'},
        {'code': 'D6.1', 'name': 'Layanan Perawatan Harian, Non Akut, Pekerjaan, Intensitas Rendah, Ketentuan Umum', 'parent': 'D6'},
        {'code': 'D6.2', 'name': 'Layanan Perawatan Harian, Non Akut, Pekerjaan, Intensitas Rendah, Ketentuan Khusus', 'parent': 'D6'},
        {'code': 'D7', 'name': 'Layanan Perawatan Harian, Non Akut, Program Persiapan Kerja, Intensitas Rendah', 'parent': 'D'},
        {'code': 'D7.1', 'name': 'Layanan Perawatan Harian, Non Akut, Program Persiapan Kerja, Intensitas Rendah, Menetapkan Batasan Waktu Tertentu', 'parent': 'D7'},
        {'code': 'D7.2', 'name': 'Layanan Perawatan Harian, Non Akut, Program Persiapan Kerja, Intensitas Rendah, Tidak Terdapat Batasan Waktu Tertentu', 'parent': 'D7'},
        {'code': 'D8', 'name': 'Layanan Perawatan Harian, Non Akut, Program Harian Terstruktur Non Pekerjaan, Intensitas Rendah', 'parent': 'D'},
        {'code': 'D8.1', 'name': 'Layanan Perawatan Harian, Non Akut, Perawatan Terstruktur Non-Kerja, Intensitas Rendah, Perawatan Terkait Kesehatan', 'parent': 'D8'},
        {'code': 'D8.2', 'name': 'Layanan Perawatan Harian, Non Akut, Perawatan Terstruktur Non-Kerja, Intensitas Rendah, Perawatan Terkait Pendidikan', 'parent': 'D8'},
        {'code': 'D8.3', 'name': 'Layanan Perawatan Harian, Non Akut, Perawatan Terstruktur Non-Kerja, Intensitas Rendah, Perawatan Terkait Sosial dan Budaya', 'parent': 'D8'},
        {'code': 'D8.4', 'name': 'Layanan Perawatan Harian, Non Akut, Perawatan Terstruktur Non-Kerja, Intensitas Rendah, Perawatan Terstruktur Non-Kerja Lainnya', 'parent': 'D8'},
        {'code': 'D9', 'name': 'Layanan Perawatan Harian, Non Akut, Perawatan Harian Tidak Terstruktur, Intensitas Rendah', 'parent': 'D'},

        # O Series - Outpatient (37 codes)
        {'code': 'O', 'name': 'Layanan Rawat Jalan', 'parent': None},
        {'code': 'O1', 'name': 'Layanan Rawat Jalan, Akut, Layanan Berbasis Kunjungan, Layanan 24 Jam', 'parent': 'O'},
        {'code': 'O1.1', 'name': 'Layanan Rawat Jalan, Akut, Layanan Berbasis Kunjungan, Layanan 24 Jam, Layanan Kesehatan', 'parent': 'O1'},
        {'code': 'O1.2', 'name': 'Layanan Rawat Inap, Akut, Layanan Berbasis Kunjungan, Layanan 24 Jam, Layanan Non Kesehatan', 'parent': 'O1'},
        {'code': 'O2', 'name': 'Layanan Rawat Jalan, Akut, Layanan Berbasis Kunjungan, Layanan Tidak 24 Jam', 'parent': 'O'},
        {'code': 'O2.1', 'name': 'Layanan Rawat Jalan, Akut, Layanan Berbasis Kunjungan, Layanan Tidak 24 Jam, Layanan Kesehatan', 'parent': 'O2'},
        {'code': 'O2.2', 'name': 'Layanan Rawat Jalan, Akut, Berbasis Kunjungan, Layanan Tidak 24 Jam, Layanan Non Kesehatan', 'parent': 'O2'},
        {'code': 'O3', 'name': 'Layanan Rawat Jalan, Akut, Layanan Berbasis Fasilitas, Layanan 24 Jam', 'parent': 'O'},
        {'code': 'O3.1', 'name': 'Layanan Rawat Jalan, Akut, Layanan Berbasis Fasilitas, Layanan 24 Jam, Layanan Kesehatan', 'parent': 'O3'},
        {'code': 'O3.2', 'name': 'Layanan Rawat Jalan, Akut, Layanan Berbasis Fasilitas, Layanan 24 Jam, Layanan Non Kesehatan', 'parent': 'O3'},
        {'code': 'O4', 'name': 'Layanan Rawat Jalan, Akut, Layanan Berbasis Fasilitas, Layanan Tidak 24 Jam', 'parent': 'O'},
        {'code': 'O4.1', 'name': 'Layanan Rawat Jalan, Akut, Layanan Berbasis Fasilitas, Layanan Tidak 24 Jam, Layanan Kesehatan', 'parent': 'O4'},
        {'code': 'O4.2', 'name': 'Layanan Rawat Jalan, Akut, Layanan Berbasis Fasilitas, Layanan Tidak 24 Jam, Layanan Non Kesehatan', 'parent': 'O4'},
        {'code': 'O5', 'name': 'Layanan Rawat Jalanan, Non Akut, Layanan Berbasis Kunjungan, Intensitas Tinggi', 'parent': 'O'},
        {'code': 'O5.1', 'name': 'Layanan Rawat Jalan, Non Akut, Layanan Berbasis Kunjungan, Intensitas Tinggi, Layanan Kesehatan', 'parent': 'O5'},
        {'code': 'O5.1.1', 'name': 'Layanan Rawat Jalan, Non Akut, Layanan Berbasis Kunjungan, Intensitas Tinggi, Layanan Kesehatan, 3-6 Hari/Minggu', 'parent': 'O5.1'},
        {'code': 'O5.1.2', 'name': 'Layanan Rawat Jalan, Non Akut, Layanan Berbasis Kunjungan, Intensitas Tinggi, Layanan Kesehatan, Layanan 7 Hari/Minggu', 'parent': 'O5.1'},
        {'code': 'O5.1.3', 'name': 'Layanan Rawat Jalan, Non Akut, Layanan Berbasis Kunjungan, Intensitas Tinggi, Layanan Kesehatan, Layanan 7 Hari/Minggu Termasuk Menginap', 'parent': 'O5.1'},
        {'code': 'O5.2', 'name': 'Layanan Rawat Jalan, Non Akut, Layanan Berbasis Kunjungan, Intensitas Tinggi, Layanan Non Kesehatan', 'parent': 'O5'},
        {'code': 'O5.2.1', 'name': 'Layanan Rawat Jalan, Non Akut, Layanan Berbasis Kunjungan, Intensitas Tinggi, Layanan Non Kesehatan, 3-6 Hari/Minggu', 'parent': 'O5.2'},
        {'code': 'O5.2.2', 'name': 'Layanan Rawat Jalan, Non Akut, Layanan Berbasis Kunjungan, Intensitas Tinggi, Layanan Non Kesehatan, Layanan 7 Hari/Minggu', 'parent': 'O5.2'},
        {'code': 'O5.2.3', 'name': 'Layanan Rawat Jalan, Non Akut, Layanan Berbasis Kunjungan, Intensitas Tinggi, Layanan Non Kesehatan, Layanan 7 Hari/Minggu Termasuk Menginap', 'parent': 'O5.2'},
        {'code': 'O6', 'name': 'Layanan Rawat Jalan, Non Akut, Layanan Berbasis Kunjungan, Intensitas Sedang', 'parent': 'O'},
        {'code': 'O6.1', 'name': 'Layanan Rawat Jalan, Non Akut, Layanan Berbasis Kunjungan, Intensitas Sedang, Layanan Kesehatan', 'parent': 'O6'},
        {'code': 'O6.2', 'name': 'Layanan Rawat Jalan, Non Akut, Layanan Berbasis Kunjungan, Intensitas Sedang, Layanan Non Kesehatan', 'parent': 'O6'},
        {'code': 'O7', 'name': 'Layanan Rawat Jalan, Non Akut, Layanan Berbasis Kunjungan, Intensitas Rendah', 'parent': 'O'},
        {'code': 'O7.1', 'name': 'Layanan Rawat Jalan, Non Akut, Layanan Berbasis Kunjungan, Intensitas Rendah, Layanan Kesehatan', 'parent': 'O7'},
        {'code': 'O7.2', 'name': 'Layanan Rawat Jalan, Non Akut, Layanan Berbasis Kunjungan, Intensitas Rendah, Layanan Non Kesehatan', 'parent': 'O7'},
        {'code': 'O8', 'name': 'Layanan Rawat Jalan, Non Akut, Layanan Berbasis Fasilitas, Intensitas Tinggi', 'parent': 'O'},
        {'code': 'O8.1', 'name': 'Layanan Rawat Jalan, Non Akut, Layanan Berbasis Fasilitas, Intensitas Tinggi, Layanan Kesehatan', 'parent': 'O8'},
        {'code': 'O8.2', 'name': 'Layanan Rawat Jalan, Non Akut, Layanan Berbasis Fasilitas, Intensitas Tinggi, Layanan Non Kesehatan', 'parent': 'O8'},
        {'code': 'O9', 'name': 'Layanan Rawat Jalan, Non Akut, Layanan Berbasis Fasilitas, Intensitas Sedang', 'parent': 'O'},
        {'code': 'O9.1', 'name': 'Layanan Rawat Jalan, Non Akut, Layanan Berbasis Fasilitas, Intensitas Sedang, Layanan Kesehatan', 'parent': 'O9'},
        {'code': 'O9.2', 'name': 'Layanan Rawat Jalan, Non Akut, Layanan Berbasis Fasilitas, Intensitas Sedang, Layanan Non Kesehatan', 'parent': 'O9'},
        {'code': 'O10', 'name': 'Layanan Rawat Jalan, Non Akut, Layanan Berbasis Fasilitas, Intensitas Rendah', 'parent': 'O'},
        {'code': 'O10.1', 'name': 'Layanan Rawat Jalan, Non Akut, Layanan Berbasis Fasilitas, Intensitas Rendah, Layanan Kesehatan', 'parent': 'O10'},
        {'code': 'O10.2', 'name': 'Layanan Rawat Jalan, Non Akut, Layanan Berbasis Fasilitas, Intensitas Rendah, Layanan Non Kesehatan', 'parent': 'O10'},

        # A Series - Accessibility (6 codes)
        {'code': 'A', 'name': 'Layanan Aksesibilitas terhadap Perawatan', 'parent': None},
        {'code': 'A1', 'name': 'Layanan Aksesibilitas terhadap Perawatan, Komunikasi', 'parent': 'A'},
        {'code': 'A2', 'name': 'Layanan Aksesibilitas terhadap Perawatan, Mobilitas Fisik', 'parent': 'A'},
        {'code': 'A3', 'name': 'Layanan Aksesibilitas terhadap Perawatan, Pendampingan Pribadi', 'parent': 'A'},
        {'code': 'A4', 'name': 'Layanan Aksesibilitas terhadap Perawatan, Koordinasi Kasus', 'parent': 'A'},
        {'code': 'A5', 'name': 'Layanan Aksesibilitas terhadap Perawatan, Aksesibilitas Lainnya', 'parent': 'A'},

        # I Series - Information (12 codes)
        {'code': 'I', 'name': 'Layanan Informasi', 'parent': None},
        {'code': 'I1', 'name': 'Layanan Informasi, Layanan Konsultasi dan Asesmen', 'parent': 'I'},
        {'code': 'I1.1', 'name': 'Layanan Informasi, Layanan Konsultasi dan Asesmen, Terkait Kesehatan', 'parent': 'I1'},
        {'code': 'I1.2', 'name': 'Layanan Informasi, Layanan Konsultasi dan Asesmen, Terkait Pendidikan', 'parent': 'I1'},
        {'code': 'I1.3', 'name': 'Layanan Informasi, Layanan Konsultasi dan Asesmen, Terkait Sosial dan Budaya', 'parent': 'I1'},
        {'code': 'I1.4', 'name': 'Layanan Informasi, Layanan Konsultasi dan Asesmen, Terkait Pekerjaan', 'parent': 'I1'},
        {'code': 'I1.5', 'name': 'Layanan Informasi, Layanan Konsultasi dan Asesmen, Lainnya Terkait Non-Pekerjaan', 'parent': 'I1'},
        {'code': 'I2', 'name': 'Layanan Informasi, Penyediaan Informasi', 'parent': 'I'},
        {'code': 'I2.1', 'name': 'Layanan Informasi, Interaktif', 'parent': 'I2'},
        {'code': 'I2.1.1', 'name': 'Layanan Informasi, Interaktif, Tatap Muka', 'parent': 'I2.1'},
        {'code': 'I2.1.2', 'name': 'Layanan Informasi, Interaktif, Selain Interaktif', 'parent': 'I2.1'},
        {'code': 'I2.2', 'name': 'Layanan Informasi, Non Interaktif', 'parent': 'I2'},

        # ========================================
        # NON-HEALTHCARE FACILITIES (72 codes)
        # ========================================

        # SR Series - Social Residential (17 codes)
        {'code': 'SR', 'name': 'Layanan Rawat Inap', 'parent': None},
        {'code': 'SR1', 'name': 'Layanan Rawat Inap, Akut, Nakes', 'parent': 'SR'},
        {'code': 'SR2', 'name': 'Layanan Rawat Inap, Akut, Non Nakes', 'parent': 'SR'},
        {'code': 'SR3', 'name': 'Layanan Rawat Inap, Non Akut, Nakes', 'parent': 'SR'},
        {'code': 'SR3.1', 'name': 'Layanan Rawat Inap, Non Akut, Nakes, Memiliki Batasan Waktu Tinggal', 'parent': 'SR3'},
        {'code': 'SR3.1.1', 'name': 'Layanan Rawat Inap, Non Akut, Nakes, Memiliki Batasan Waktu Tinggal, Dukungan Staf 24 Jam', 'parent': 'SR3.1'},
        {'code': 'SR3.1.2', 'name': 'Layanan Rawat Inap, Non Akut, Nakes, Memiliki Batasan Waktu Tinggal, Dukungan Staf < 5 Hari/Minggu', 'parent': 'SR3.1'},
        {'code': 'SR3.2', 'name': 'Layanan Rawat Inap, Non Akut, Nakes, Tidak Memiliki Batasan Waktu Tinggal', 'parent': 'SR3'},
        {'code': 'SR3.2.1', 'name': 'Layanan Rawat Inap, Non Akut, Nakes, Tidak Memiliki Batasan Waktu Tinggal, Dukungan Staf 24 Jam', 'parent': 'SR3.2'},
        {'code': 'SR3.2.2', 'name': 'Layanan Rawat Inap, Non Akut, Nakes, Tidak Memiliki Batasan Waktu Tinggal, Dukungan Staf < 5 Hari/Minggu', 'parent': 'SR3.2'},
        {'code': 'SR4', 'name': 'Layanan Rawat Inap, Non Akut, Non Nakes', 'parent': 'SR'},
        {'code': 'SR4.1', 'name': 'Layanan Rawat Inap, Non Akut, Non Nakes, Memiliki Batasan Waktu Tinggal', 'parent': 'SR4'},
        {'code': 'SR4.1.1', 'name': 'Layanan Rawat Inap, Non Akut, Non Nakes, Memiliki Batasan Waktu Tinggal, Dukungan Staf 24 Jam', 'parent': 'SR4.1'},
        {'code': 'SR4.1.2', 'name': 'Layanan Rawat Inap, Non Akut, Non Nakes, Memiliki Batasan Waktu Tinggal, Dukungan Staf < 5 Hari/Minggu', 'parent': 'SR4.1'},
        {'code': 'SR4.2', 'name': 'Layanan Rawat Inap, Non Akut, Non Nakes, Tidak Memiliki Batasan Waktu Tinggal', 'parent': 'SR4'},
        {'code': 'SR4.2.1', 'name': 'Layanan Rawat Inap, Non Akut, Non Nakes, Tidak Memiliki Batasan Waktu Tinggal, Dukungan Staf 24 Jam', 'parent': 'SR4.2'},
        {'code': 'SR4.2.2', 'name': 'Layanan Rawat Inap, Non Akut, Non Nakes, Tidak Memiliki Batasan Waktu Tinggal, Dukungan Staf < 5 Hari/Minggu', 'parent': 'SR4.2'},

        # SD Series - Social Day Care (29 codes)
        {'code': 'SD', 'name': 'Layanan Perawatan Harian', 'parent': None},
        {'code': 'SD1', 'name': 'Layanan Perawatan Harian, Pekerjaan', 'parent': 'SD'},
        {'code': 'SD1.1', 'name': 'Layanan Perawatan Harian, Pekerjaan, Intensitas Tinggi', 'parent': 'SD1'},
        {'code': 'SD1.1.1', 'name': 'Layanan Perawatan Harian, Pekerjaan, Intensitas Tinggi, Ketentuan Umum', 'parent': 'SD1.1'},
        {'code': 'SD1.1.2', 'name': 'Layanan Perawatan Harian, Pekerjaan, Intensitas Tinggi, Ketentuan Khusus', 'parent': 'SD1.1'},
        {'code': 'SD1.2', 'name': 'Layanan Perawatan Harian, Pekerjaan, Intensitas Rendah', 'parent': 'SD1'},
        {'code': 'SD1.2.1', 'name': 'Layanan Perawatan Harian, Pekerjaan, Intensitas Rendah, Ketentuan Umum', 'parent': 'SD1.2'},
        {'code': 'SD1.2.2', 'name': 'Layanan Perawatan Harian, Pekerjaan, Intensitas Rendah, Ketentuan Khusus', 'parent': 'SD1.2'},
        {'code': 'SD2', 'name': 'Layanan Perawatan Harian, Terkait Pekerjaan', 'parent': 'SD'},
        {'code': 'SD2.1', 'name': 'Layanan Perawatan Harian, Terkait Pekerjaan, Intensitas Tinggi', 'parent': 'SD2'},
        {'code': 'SD2.1.1', 'name': 'Layanan Perawatan Harian, Terkait Pekerjaan, Intensitas Tinggi, Menetapkan Batasan Waktu', 'parent': 'SD2.1'},
        {'code': 'SD2.1.2', 'name': 'Layanan Perawatan Harian, Terkait Pekerjaan, Intensitas Tinggi, Tidak Menetapkan Batasan Waktu', 'parent': 'SD2.1'},
        {'code': 'SD2.2', 'name': 'Layanan Perawatan Harian, Terkait Pekerjaan, Intensitas Rendah', 'parent': 'SD2'},
        {'code': 'SD2.2.1', 'name': 'Layanan Perawatan Harian, Terkait Pekerjaan, Intensitas Rendah, Menetapkan Batasan Waktu', 'parent': 'SD2.2'},
        {'code': 'SD2.2.2', 'name': 'Layanan Perawatan Harian, Terkait Pekerjaan, Intensitas Rendah, Tidak Menetapkan Batasan Waktu', 'parent': 'SD2.2'},
        {'code': 'SD3', 'name': 'Layanan Perawatan Harian, Terstruktur Non Pekerjaan', 'parent': 'SD'},
        {'code': 'SD3.1', 'name': 'Layanan Perawatan Harian, Terstruktur Non Pekerjaan, Intensitas Tinggi', 'parent': 'SD3'},
        {'code': 'SD3.1.1', 'name': 'Layanan Perawatan Harian, Terstruktur Non Pekerjaan, Intensitas Tinggi, Terkait Kesehatan', 'parent': 'SD3.1'},
        {'code': 'SD3.1.2', 'name': 'Layanan Perawatan Harian, Terstruktur Non Pekerjaan, Intensitas Tinggi, Terkait Pendidikan', 'parent': 'SD3.1'},
        {'code': 'SD3.1.3', 'name': 'Layanan Perawatan Harian, Terstruktur Non Pekerjaan, Intensitas Tinggi, Terkait Sosial & Budaya', 'parent': 'SD3.1'},
        {'code': 'SD3.1.4', 'name': 'Layanan Perawatan Harian, Terstruktur Non Pekerjaan, Intensitas Tinggi, Terkait Non Pekerjaan Lainnya', 'parent': 'SD3.1'},
        {'code': 'SD3.2', 'name': 'Layanan Perawatan Harian, Terstruktur Non Pekerjaan, Intensitas Rendah', 'parent': 'SD3'},
        {'code': 'SD3.2.1', 'name': 'Layanan Perawatan Harian, Terstruktur Non Pekerjaan, Intensitas Rendah, Terkait Kesehatan', 'parent': 'SD3.2'},
        {'code': 'SD3.2.2', 'name': 'Layanan Perawatan Harian, Terstruktur Non Pekerjaan, Intensitas Rendah, Terkait Pendidikan', 'parent': 'SD3.2'},
        {'code': 'SD3.2.3', 'name': 'Layanan Perawatan Harian, Terstruktur Non Pekerjaan, Intensitas Rendah, Terkait Sosial & Budaya', 'parent': 'SD3.2'},
        {'code': 'SD3.2.4', 'name': 'Layanan Perawatan Harian, Terstruktur Non Pekerjaan, Intensitas Rendah, Terkait Non Pekerjaan Lainnya', 'parent': 'SD3.2'},
        {'code': 'SD4', 'name': 'Layanan Perawatan Harian, Tidak Terstruktur', 'parent': 'SD'},
        {'code': 'SD4.1', 'name': 'Layanan Perawatan Harian, Tidak Terstruktur, Intensitas Tinggi', 'parent': 'SD4'},
        {'code': 'SD4.2', 'name': 'Layanan Perawatan Harian, Tidak Terstruktur, Intensitas Rendah', 'parent': 'SD4'},

        # SO Series - Social Outpatient (21 codes)
        {'code': 'SO', 'name': 'Layanan Rawat Jalan', 'parent': None},
        {'code': 'SO1', 'name': 'Layanan Rawat Jalan, Berbasis Kunjungan', 'parent': 'SO'},
        {'code': 'SO1.1', 'name': 'Layanan Rawat Jalan, Berbasis Kunjungan, Setidaknya 3 Hari Per Minggu', 'parent': 'SO1'},
        {'code': 'SO1.1.1', 'name': 'Layanan Rawat Jalan, Berbasis Kunjungan, Setidaknya 3 Hari Per Minggu, Terkait Kesehatan', 'parent': 'SO1.1'},
        {'code': 'SO1.1.2', 'name': 'Layanan Rawat Jalan, Berbasis Kunjungan, Setidaknya 3 Hari Per Minggu, Terkait Layanan Sosial', 'parent': 'SO1.1'},
        {'code': 'SO1.2', 'name': 'Layanan Rawat Jalan, Berbasis Kunjungan, Setidaknya 1 Kali dalam 2 Minggu', 'parent': 'SO1'},
        {'code': 'SO1.2.1', 'name': 'Layanan Rawat Jalan, Berbasis Kunjungan, Setidaknya 1 Kali dalam 2 Minggu, Terkait Kesehatan', 'parent': 'SO1.2'},
        {'code': 'SO1.2.2', 'name': 'Layanan Rawat Jalan, Berbasis Kunjungan, Setidaknya 1 Kali dalam 2 Minggu, Terkait Layanan Sosial', 'parent': 'SO1.2'},
        {'code': 'SO1.3', 'name': 'Layanan Rawat Jalan, Berbasis Kunjungan, Lebih dari 2 Minggu Sekali', 'parent': 'SO1'},
        {'code': 'SO1.3.1', 'name': 'Layanan Rawat Jalan, Berbasis Kunjungan, Lebih dari 2 Minggu Sekali, Terkait Kesehatan', 'parent': 'SO1.3'},
        {'code': 'SO1.3.2', 'name': 'Layanan Rawat Jalan, Berbasis Kunjungan, Lebih dari 2 Minggu Sekali, Terkait Layanan Sosial', 'parent': 'SO1.3'},
        {'code': 'SO2', 'name': 'Layanan Rawat Jalan, Berbasis Fasilitas', 'parent': 'SO'},
        {'code': 'SO2.1', 'name': 'Layanan Rawat Jalan, Berbasis Fasilitas, Setidaknya 3 Hari Per Minggu', 'parent': 'SO2'},
        {'code': 'SO2.1.1', 'name': 'Layanan Rawat Jalan, Berbasis Fasilitas, Setidaknya 3 Hari Per Minggu, Terkait Kesehatan', 'parent': 'SO2.1'},
        {'code': 'SO2.1.2', 'name': 'Layanan Rawat Jalan, Berbasis Fasilitas, Setidaknya 3 Hari Per Minggu, Terkait Layanan Sosial', 'parent': 'SO2.1'},
        {'code': 'SO2.2', 'name': 'Layanan Rawat Jalan, Berbasis Fasilitas, Setidaknya 1 Kali dalam 2 Minggu', 'parent': 'SO2'},
        {'code': 'SO2.2.1', 'name': 'Layanan Rawat Jalan, Berbasis Fasilitas, Setidaknya 1 Kali dalam 2 Minggu, Terkait Kesehatan', 'parent': 'SO2.2'},
        {'code': 'SO2.2.2', 'name': 'Layanan Rawat Jalan, Berbasis Fasilitas, Setidaknya 1 Kali dalam 2 Minggu, Terkait Layanan Sosial', 'parent': 'SO2.2'},
        {'code': 'SO2.3', 'name': 'Layanan Rawat Jalan, Berbasis Fasilitas, Lebih dari 2 Minggu Sekali', 'parent': 'SO2'},
        {'code': 'SO2.3.1', 'name': 'Layanan Rawat Jalan, Berbasis Fasilitas, Lebih dari 2 Minggu Sekali, Terkait Kesehatan', 'parent': 'SO2.3'},
        {'code': 'SO2.3.2', 'name': 'Layanan Rawat Jalan, Berbasis Fasilitas, Lebih dari 2 Minggu Sekali, Terkait Layanan Sosial', 'parent': 'SO2.3'},

        # SA Series - Social Accessibility (6 codes)
        {'code': 'SA', 'name': 'Layanan Aksesibilitas terhadap Perawatan', 'parent': None},
        {'code': 'SA1', 'name': 'Layanan Aksesibilitas terhadap Perawatan, Komunikasi', 'parent': 'SA'},
        {'code': 'SA2', 'name': 'Layanan Aksesibilitas terhadap Perawatan, Mobilitas Fisik', 'parent': 'SA'},
        {'code': 'SA3', 'name': 'Layanan Aksesibilitas terhadap Perawatan, Pendampingan Pribadi', 'parent': 'SA'},
        {'code': 'SA4', 'name': 'Layanan Aksesibilitas terhadap Perawatan, Koordinasi Kasus', 'parent': 'SA'},
        {'code': 'SA5', 'name': 'Layanan Aksesibilitas terhadap Perawatan, Aksesibilitas Lainnya', 'parent': 'SA'},

        # SI Series - Social Information (12 codes)
        {'code': 'SI', 'name': 'Layanan Informasi', 'parent': None},
        {'code': 'SI1', 'name': 'Layanan Informasi, Layanan Konsultasi dan Asesmen', 'parent': 'SI'},
        {'code': 'SI1.1', 'name': 'Layanan Informasi, Layanan Konsultasi dan Asesmen, Kesehatan', 'parent': 'SI1'},
        {'code': 'SI1.2', 'name': 'Layanan Informasi, Layanan Konsultasi dan Asesmen, Pendidikan', 'parent': 'SI1'},
        {'code': 'SI1.3', 'name': 'Layanan Informasi, Layanan Konsultasi dan Asesmen, Sosial dan Budaya', 'parent': 'SI1'},
        {'code': 'SI1.4', 'name': 'Layanan Informasi, Layanan Konsultasi dan Asesmen, Pekerjaan', 'parent': 'SI1'},
        {'code': 'SI1.5', 'name': 'Layanan Informasi, Layanan Konsultasi dan Asesmen, Non-Pekerjaan', 'parent': 'SI1'},
        {'code': 'SI2', 'name': 'Layanan Informasi, Penyediaan Informasi', 'parent': 'SI'},
        {'code': 'SI2.1', 'name': 'Layanan Informasi, Interaktif', 'parent': 'SI2'},
        {'code': 'SI2.1.1', 'name': 'Layanan Informasi, Interaktif, Tatap Muka', 'parent': 'SI2.1'},
        {'code': 'SI2.1.2', 'name': 'Layanan Informasi, Interaktif, Lainnya', 'parent': 'SI2.1'},
        {'code': 'SI2.2', 'name': 'Layanan Informasi, Non Interaktif', 'parent': 'SI2'},
    ]

    # Verify count
    healthcare_count = sum(1 for item in DESDE_LTC_CODES if is_healthcare_code(item['code']))
    non_healthcare_count = sum(1 for item in DESDE_LTC_CODES if not is_healthcare_code(item['code']))

    print(f"Data validation:")
    print(f"  Healthcare codes (R, D, O, A, I): {healthcare_count}")
    print(f"  Non-healthcare codes (SR, SD, SO, SA, SI): {non_healthcare_count}")
    print(f"  Total: {len(DESDE_LTC_CODES)}\n")

    # Process first phase: root codes (codes without parents)
    print("Phase 1: Creating/Updating root codes...")
    root_codes_created = 0
    root_codes_updated = 0
    for data in DESDE_LTC_CODES:
        if data['parent'] is None:
            code = data['code']
            obj, created = MainTypeOfCare.objects.update_or_create(
                code=code,
                defaults={
                    'name': data['name'],
                    'description': data['name'],  # Use name as description
                    'parent': None,
                    'is_healthcare': is_healthcare_code(code),
                    'service_delivery_type': get_service_delivery_type(code),
                    'is_active': True
                }
            )
            if created:
                root_codes_created += 1
                print(f"✓ Created root: {code} - {data['name'][:60]}...")
            else:
                root_codes_updated += 1
                print(f"✓ Updated root: {code} - {data['name'][:60]}...")
    print(f"Phase 1 Complete: {root_codes_created} created, {root_codes_updated} updated\n")

    # Process remaining codes in multiple passes (to handle hierarchies)
    max_passes = 5
    for pass_num in range(1, max_passes + 1):
        print(f"Phase {pass_num + 1}: Creating/Updating level {pass_num} codes...")
        created_in_pass = 0
        updated_in_pass = 0

        for data in DESDE_LTC_CODES:
            if data['parent'] is not None:
                code = data['code']
                parent_code = data['parent']

                # Check if parent exists
                parent_obj = MainTypeOfCare.objects.filter(code=parent_code).first()
                if parent_obj:
                    obj, created = MainTypeOfCare.objects.update_or_create(
                        code=code,
                        defaults={
                            'name': data['name'],
                            'description': data['name'],  # Use name as description
                            'parent': parent_obj,
                            'is_healthcare': is_healthcare_code(code),
                            'service_delivery_type': get_service_delivery_type(code),
                            'is_active': True
                        }
                    )
                    if created:
                        created_in_pass += 1
                        if created_in_pass <= 10:  # Show first 10 of each phase
                            print(f"✓ Created {code} (parent: {parent_code})")
                    else:
                        updated_in_pass += 1
                        if updated_in_pass <= 10:
                            print(f"✓ Updated {code} (parent: {parent_code})")

        total_changes = created_in_pass + updated_in_pass
        if total_changes > 10:
            print(f"  ... and {total_changes - 10} more codes")
        print(f"Phase {pass_num + 1} Complete: {created_in_pass} created, {updated_in_pass} updated\n")

        if total_changes == 0:
            print("All codes processed successfully!")
            break

    # Update levels for all codes based on parent chain
    print("Updating hierarchy levels...")
    updated_levels = 0
    for mtc in MainTypeOfCare.objects.all():
        calculated_level = mtc.get_hierarchy_level()
        if mtc.level != calculated_level:
            mtc.level = calculated_level
            mtc.save(update_fields=['level'])
            updated_levels += 1
    print(f"✓ Updated {updated_levels} hierarchy levels\n")

    # Final summary
    total_created = MainTypeOfCare.objects.count()
    healthcare_created = MainTypeOfCare.objects.filter(
        code__regex=r'^[RDOAI]'
    ).exclude(code__regex=r'^S').count()
    non_healthcare_created = MainTypeOfCare.objects.filter(
        code__regex=r'^S[RDOAI]'
    ).count()

    print(f"\n{'='*70}")
    print(f"SUMMARY:")
    print(f"{'='*70}")
    print(f"Total DESDE-LTC codes in database: {total_created}")
    print(f"  Healthcare codes (R, D, O, A, I):       {healthcare_created}")
    print(f"  Non-healthcare codes (SR, SD, SO, SA, SI): {non_healthcare_created}")
    print(f"\nExpected: 174 total (102 healthcare + 72 non-healthcare)")
    print(f"{'='*70}\n")

if __name__ == '__main__':
    print("\n" + "="*70)
    print("DESDE-LTC Complete Classification Seed Script")
    print("174 Hierarchical Codes (Healthcare + Non-Healthcare)")
    print("="*70 + "\n")

    seed_desde_ltc()

    print("\n" + "="*70)
    print("Seeding completed!")
    print("="*70 + "\n")
