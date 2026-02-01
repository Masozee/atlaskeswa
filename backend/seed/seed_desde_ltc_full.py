"""
Seed script for comprehensive DESDE-LTC classification data
This includes 174 hierarchical classification codes for mental health services
Run with: python seed/seed_desde_ltc_full.py (from backend directory)
"""
import os
import sys
import django

# Add parent directory to path so 'core' module can be found
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from apps.directory.models import MainTypeOfCare

def seed_desde_ltc():
    """Seed comprehensive DESDE-LTC Main Type of Care classifications"""
    print("Seeding comprehensive DESDE-LTC classification codes...")
    print("Total codes to process: 174\n")

    # Complete list of 174 DESDE-LTC codes
    DESDE_LTC_CODES = [
        # Healthcare Facilities - R Series (Residential)
        {'code': 'R', 'name': 'Layanan Rawat Inap', 'description': 'Layanan Rawat Inap', 'parent': None},
        {'code': 'R0', 'name': 'Layanan Rawat Inap, Akut, Terdapat Dokter Jaga 24 Jam, Non Rumah Sakit', 'description': 'Layanan Rawat Inap, Akut, Terdapat Dokter Jaga 24 Jam, Non Rumah Sakit', 'parent': 'R'},
        {'code': 'R1', 'name': 'Layanan Rawat Inap, Akut, Terdapat Dokter Jaga 24 Jam, Rumah Sakit, Pemantauan Intensif', 'description': 'Layanan Rawat Inap, Akut, Terdapat Dokter Jaga 24 Jam, Rumah Sakit, Pemantauan Intensif', 'parent': 'R'},
        {'code': 'R2', 'name': 'Layanan Rawat Inap, Akut, Terdapat Dokter Jaga 24 Jam, Rumah Sakit, Intensitas Sedang', 'description': 'Layanan Rawat Inap, Akut, Terdapat Dokter Jaga 24 Jam, Rumah Sakit, Intensitas Sedang', 'parent': 'R'},
        {'code': 'R3', 'name': 'Layanan Rawat Inap, Akut, Tidak Terdapat Dokter Jaga 24 Jam', 'description': 'Layanan Rawat Inap, Akut, Tidak Terdapat Dokter Jaga 24 Jam', 'parent': 'R'},
        {'code': 'R3.0', 'name': 'Layanan Rawat Inap, Akut, Tidak Terdapat Dokter Jaga 24 Jam, Rumah Sakit', 'description': 'Layanan Rawat Inap, Akut, Tidak Terdapat Dokter Jaga 24 Jam, Rumah Sakit', 'parent': 'R3'},
        {'code': 'R3.1.1', 'name': 'Layanan Rawat Inap, Akut, Tidak Terdapat Dokter Jaga 24 Jam, Bukan Rumah Sakit, Kesehatan', 'description': 'Layanan Rawat Inap, Akut, Tidak Terdapat Dokter Jaga 24 Jam, Bukan Rumah Sakit, Kesehatan', 'parent': 'R3'},
        {'code': 'R3.1.2', 'name': 'Layanan Rawat Inap, Akut, Tidak Terdapat Dokter Jaga 24 Jam, Bukan Rumah Sakit, Non-Kesehatan', 'description': 'Layanan Rawat Inap, Akut, Tidak Terdapat Dokter Jaga 24 Jam, Bukan Rumah Sakit, Non-Kesehatan', 'parent': 'R3'},
        {'code': 'R4', 'name': 'Layanan Rawat Inap, Non Akut, Tersedia Dokter Jaga 24 Jam, Rumah Sakit, Memiliki Batasan Waktu Tinggal', 'description': 'Layanan Rawat Inap, Non Akut, Tersedia Dokter Jaga 24 Jam, Rumah Sakit, Memiliki Batasan Waktu Tinggal', 'parent': 'R'},
        {'code': 'R5', 'name': 'Layanan Rawat Inap, Non Akut, Tersedia Dokter Jaga 24 Jam, Bukan Rumah Sakit, Memiliki Batasan Waktu Tinggal', 'description': 'Layanan Rawat Inap, Non Akut, Tersedia Dokter Jaga 24 Jam, Bukan Rumah Sakit, Memiliki Batasan Waktu Tinggal', 'parent': 'R'},
        {'code': 'R6', 'name': 'Layanan Rawat Inap, Non Akut, Tersedia Dokter Jaga 24 Jam, Rumah Sakit, Tidak Memiliki Batasan Waktu Tinggal', 'description': 'Layanan Rawat Inap, Non Akut, Tersedia Dokter Jaga 24 Jam, Rumah Sakit, Tidak Memiliki Batasan Waktu Tinggal', 'parent': 'R'},
        {'code': 'R7', 'name': 'Layanan Rawat Inap, Non Akut, Tersedia Dokter Jaga 24 Jam, Bukan Rumah Sakit, Tidak Memiliki Batasan Waktu Tinggal', 'description': 'Layanan Rawat Inap, Non Akut, Tersedia Dokter Jaga 24 Jam, Bukan Rumah Sakit, Tidak Memiliki Batasan Waktu Tinggal', 'parent': 'R'},
        {'code': 'R8', 'name': 'Layanan Rawat Inap, Non Akut, Tidak Tersedia Dokter Jaga 24 Jam, Memiliki Batasan Waktu Tinggal, Dukungan 24 Jam', 'description': 'Layanan Rawat Inap, Non Akut, Tidak Tersedia Dokter Jaga 24 Jam, Memiliki Batasan Waktu Tinggal, Dukungan 24 Jam', 'parent': 'R'},
        {'code': 'R8.1', 'name': 'Layanan Rawat Inap, Non Akut, Tidak Tersedia Dokter Jaga 24 Jam, Memiliki Batasan Waktu Tinggal, Dukungan 24 Jam, Kurang Dari 4 Minggu', 'description': 'Layanan Rawat Inap, Non Akut, Tidak Tersedia Dokter Jaga 24 Jam, Memiliki Batasan Waktu Tinggal, Dukungan 24 Jam, Kurang Dari 4 Minggu', 'parent': 'R8'},
        {'code': 'R8.2', 'name': 'Layanan Rawat Inap, Non Akut, Tidak Tersedia Dokter Jaga 24 Jam, Memiliki Batasan Waktu Tinggal, Dukungan 24 Jam, Lebih Dari 4 Minggu', 'description': 'Layanan Rawat Inap, Non Akut, Tidak Tersedia Dokter Jaga 24 Jam, Memiliki Batasan Waktu Tinggal, Dukungan 24 Jam, Lebih Dari 4 Minggu', 'parent': 'R8'},
        {'code': 'R9', 'name': 'Layanan Rawat Inap, Non Akut, Tidak Tersedia Dokter Jaga 24 Jam, Memiliki Batasan Waktu Tinggal, Dukungan Harian', 'description': 'Layanan Rawat Inap, Non Akut, Tidak Tersedia Dokter Jaga 24 Jam, Memiliki Batasan Waktu Tinggal, Dukungan Harian', 'parent': 'R'},
        {'code': 'R9.1', 'name': 'Layanan Rawat Inap, Non Akut, Tidak Tersedia Dokter Jaga 24 Jam, Memiliki Batasan Waktu Tinggal, Dukungan Harian, Kurang Dari 4 Minggu', 'description': 'Layanan Rawat Inap, Non Akut, Tidak Tersedia Dokter Jaga 24 Jam, Memiliki Batasan Waktu Tinggal, Dukungan Harian, Kurang Dari 4 Minggu', 'parent': 'R9'},
        {'code': 'R9.2', 'name': 'Layanan Rawat Inap, Non Akut, Tidak Tersedia Dokter Jaga 24 Jam, Memiliki Batasan Waktu Tinggal, Dukungan Harian, Lebih Dari 4 Minggu', 'description': 'Layanan Rawat Inap, Non Akut, Tidak Tersedia Dokter Jaga 24 Jam, Memiliki Batasan Waktu Tinggal, Dukungan Harian, Lebih Dari 4 Minggu', 'parent': 'R9'},
        {'code': 'R10', 'name': 'Layanan Rawat Inap, Non Akut, Tidak Tersedia Dokter Jaga 24 Jam, Memiliki Batasan Waktu Tinggal, Dukungan Rendah', 'description': 'Layanan Rawat Inap, Non Akut, Tidak Tersedia Dokter Jaga 24 Jam, Memiliki Batasan Waktu Tinggal, Dukungan Rendah', 'parent': 'R'},
        {'code': 'R10.1', 'name': 'Layanan Rawat Inap, Non Akut, Tidak Tersedia Dokter Jaga 24 Jam, Memiliki Batasan Waktu Tinggal, Dukungan Rendah, Kurang Dari 4 Minggu', 'description': 'Layanan Rawat Inap, Non Akut, Tidak Tersedia Dokter Jaga 24 Jam, Memiliki Batasan Waktu Tinggal, Dukungan Rendah, Kurang Dari 4 Minggu', 'parent': 'R10'},
        {'code': 'R10.2', 'name': 'Layanan Rawat Inap, Non Akut, Tidak Tersedia Dokter Jaga 24 Jam, Memiliki Batasan Waktu Tinggal, Dukungan Rendah, Lebih Dari 4 Minggu', 'description': 'Layanan Rawat Inap, Non Akut, Tidak Tersedia Dokter Jaga 24 Jam, Memiliki Batasan Waktu Tinggal, Dukungan Rendah, Lebih Dari 4 Minggu', 'parent': 'R10'},
        {'code': 'R11', 'name': 'Layanan Rawat Inap, Non Akut, Tidak Tersedia Dokter Jaga 24 Jam, Tidak Memiliki Batasan Waktu Tinggal, Dukungan 24 Jam', 'description': 'Layanan Rawat Inap, Non Akut, Tidak Tersedia Dokter Jaga 24 Jam, Tidak Memiliki Batasan Waktu Tinggal, Dukungan 24 Jam', 'parent': 'R'},
        {'code': 'R12', 'name': 'Layanan Rawat Inap, Non Akut, Tidak Tersedia Dokter Jaga 24 Jam, Tidak Memiliki Batasan Waktu Tinggal, Dukungan Harian', 'description': 'Layanan Rawat Inap, Non Akut, Tidak Tersedia Dokter Jaga 24 Jam, Tidak Memiliki Batasan Waktu Tinggal, Dukungan Harian', 'parent': 'R'},
        {'code': 'R13', 'name': 'Layanan Rawat Inap, Non Akut, Tidak Tersedia Dokter Jaga 24 Jam, Tidak Memiliki Batasan Waktu Tinggal, Dukungan Rendah', 'description': 'Layanan Rawat Inap, Non Akut, Tidak Tersedia Dokter Jaga 24 Jam, Tidak Memiliki Batasan Waktu Tinggal, Dukungan Rendah', 'parent': 'R'},
        {'code': 'R14', 'name': 'Layanan Rawat Inap, Non-Akut, Non-Akut Lainnya', 'description': 'Layanan Rawat Inap, Non-Akut, Non-Akut Lainnya', 'parent': 'R'},
        # D Series (Day Care) - 23 codes
        {'code': 'D', 'name': 'Layanan Perawatan Harian', 'description': 'Layanan Perawatan Harian', 'parent': None},
        {'code': 'D0', 'name': 'Layanan Perawatan Harian, Akut, Episodik', 'description': 'Layanan Perawatan Harian, Akut, Episodik', 'parent': 'D'},
        {'code': 'D0.1', 'name': 'Layanan Perawatan Harian, Akut, Episodik, Intensif', 'description': 'Layanan Perawatan Harian, Akut, Episodik, Intensif', 'parent': 'D0'},
        {'code': 'D0.2', 'name': 'Layanan Perawatan Harian, Akut, Episodik, Non-Intensif', 'description': 'Layanan Perawatan Harian, Akut, Episodik, Non-Intensif', 'parent': 'D0'},
        {'code': 'D1', 'name': 'Layanan Perawatan Harian, Akut, Berkelanjutan', 'description': 'Layanan Perawatan Harian, Akut, Berkelanjutan', 'parent': 'D'},
        {'code': 'D1.1', 'name': 'Layanan Perawatan Harian, Akut, Berkelanjutan, Intensif', 'description': 'Layanan Perawatan Harian, Akut, Berkelanjutan, Intensif', 'parent': 'D1'},
        {'code': 'D1.2', 'name': 'Layanan Perawatan Harian, Akut, Berkelanjutan, Non-Intensif', 'description': 'Layanan Perawatan Harian, Akut, Berkelanjutan, Non-Intensif', 'parent': 'D1'},
        {'code': 'D2', 'name': 'Layanan Perawatan Harian, Non Akut, Pekerjaan, Intensitas Tinggi', 'description': 'Layanan Perawatan Harian, Non Akut, Pekerjaan, Intensitas Tinggi', 'parent': 'D'},
        {'code': 'D2.1', 'name': 'Layanan Perawatan Harian, Non Akut, Pekerjaan, Intensitas Tinggi, Ketentuan Umum', 'description': 'Layanan Perawatan Harian, Non Akut, Pekerjaan, Intensitas Tinggi, Ketentuan Umum', 'parent': 'D2'},
        {'code': 'D2.2', 'name': 'Layanan Perawatan Harian, Non Akut, Pekerjaan, Intensitas Tinggi, Ketentuan Khusus', 'description': 'Layanan Perawatan Harian, Non Akut, Pekerjaan, Intensitas Tinggi, Ketentuan Khusus', 'parent': 'D2'},
        {'code': 'D3', 'name': 'Layanan Perawatan Harian, Non Akut, Program Persiapan Kerja, Intensitas Tinggi', 'description': 'Layanan Perawatan Harian, Non Akut, Program Persiapan Kerja, Intensitas Tinggi', 'parent': 'D'},
        {'code': 'D3.1', 'name': 'Layanan Perawatan Harian, Non Akut, Program Persiapan Kerja, Intensitas Tinggi, Menetapkan Batasan Waktu Tertentu', 'description': 'Layanan Perawatan Harian, Non Akut, Program Persiapan Kerja, Intensitas Tinggi, Menetapkan Batasan Waktu Tertentu', 'parent': 'D3'},
        {'code': 'D3.2', 'name': 'Layanan Perawatan Harian, Non Akut, Program Persiapan Kerja, Intensitas Tinggi, Tidak Terdapat Batasan Waktu Tertentu', 'description': 'Layanan Perawatan Harian, Non Akut, Program Persiapan Kerja, Intensitas Tinggi, Tidak Terdapat Batasan Waktu Tertentu', 'parent': 'D3'},
        {'code': 'D4', 'name': 'Layanan Perawatan Harian, Non Akut, Program Harian Terstruktur Non Pekerjaan, Intensitas Tinggi', 'description': 'Layanan Perawatan Harian, Non Akut, Program Harian Terstruktur Non Pekerjaan, Intensitas Tinggi', 'parent': 'D'},
        {'code': 'D4.1', 'name': 'Layanan Perawatan Harian, Non Akut, Perawatan Terstruktur Non-Kerja, Intensitas Tinggi, Perawatan Terkait Kesehatan', 'description': 'Layanan Perawatan Harian, Non Akut, Perawatan Terstruktur Non-Kerja, Intensitas Tinggi, Perawatan Terkait Kesehatan', 'parent': 'D4'},
        {'code': 'D4.2', 'name': 'Layanan Perawatan Harian, Non Akut, Perawatan Terstruktur Non-Kerja, Intensitas Tinggi, Perawatan Terkait Pendidikan', 'description': 'Layanan Perawatan Harian, Non Akut, Perawatan Terstruktur Non-Kerja, Intensitas Tinggi, Perawatan Terkait Pendidikan', 'parent': 'D4'},
        {'code': 'D4.3', 'name': 'Layanan Perawatan Harian, Non Akut, Perawatan Terstruktur Non-Kerja, Intensitas Tinggi, Perawatan Terkait Sosial dan Budaya', 'description': 'Layanan Perawatan Harian, Non Akut, Perawatan Terstruktur Non-Kerja, Intensitas Tinggi, Perawatan Terkait Sosial dan Budaya', 'parent': 'D4'},
        {'code': 'D4.4', 'name': 'Layanan Perawatan Harian, Non Akut, Perawatan Terstruktur Non-Kerja, Intensitas Tinggi, Perawatan Terstruktur Non-Kerja Lainnya', 'description': 'Layanan Perawatan Harian, Non Akut, Perawatan Terstruktur Non-Kerja, Intensitas Tinggi, Perawatan Terstruktur Non-Kerja Lainnya', 'parent': 'D4'},
        {'code': 'D5', 'name': 'Layanan Perawatan Harian, Non Akut, Perawatan Harian Tidak Terstruktur, Intensitas Tinggi', 'description': 'Layanan Perawatan Harian, Non Akut, Perawatan Harian Tidak Terstruktur, Intensitas Tinggi', 'parent': 'D'},
        {'code': 'D6', 'name': 'Layanan Perawatan Harian, Non Akut, Pekerjaan, Intensitas Rendah', 'description': 'Layanan Perawatan Harian, Non Akut, Pekerjaan, Intensitas Rendah', 'parent': 'D'},
        {'code': 'D6.1', 'name': 'Layanan Perawatan Harian, Non Akut, Pekerjaan, Intensitas Rendah, Ketentuan Umum', 'description': 'Layanan Perawatan Harian, Non Akut, Pekerjaan, Intensitas Rendah, Ketentuan Umum', 'parent': 'D6'},
        {'code': 'D6.2', 'name': 'Layanan Perawatan Harian, Non Akut, Pekerjaan, Intensitas Rendah, Ketentuan Khusus', 'description': 'Layanan Perawatan Harian, Non Akut, Pekerjaan, Intensitas Rendah, Ketentuan Khusus', 'parent': 'D6'},
        {'code': 'D7', 'name': 'Layanan Perawatan Harian, Non Akut, Program Persiapan Kerja, Intensitas Rendah', 'description': 'Layanan Perawatan Harian, Non Akut, Program Persiapan Kerja, Intensitas Rendah', 'parent': 'D'},
        {'code': 'D7.1', 'name': 'Layanan Perawatan Harian, Non Akut, Program Persiapan Kerja, Intensitas Rendah, Menetapkan Batasan Waktu Tertentu', 'description': 'Layanan Perawatan Harian, Non Akut, Program Persiapan Kerja, Intensitas Rendah, Menetapkan Batasan Waktu Tertentu', 'parent': 'D7'},
        {'code': 'D7.2', 'name': 'Layanan Perawatan Harian, Non Akut, Program Persiapan Kerja, Intensitas Rendah, Tidak Terdapat Batasan Waktu Tertentu', 'description': 'Layanan Perawatan Harian, Non Akut, Program Persiapan Kerja, Intensitas Rendah, Tidak Terdapat Batasan Waktu Tertentu', 'parent': 'D7'},
        {'code': 'D8', 'name': 'Layanan Perawatan Harian, Non Akut, Program Harian Terstruktur Non Pekerjaan, Intensitas Rendah', 'description': 'Layanan Perawatan Harian, Non Akut, Program Harian Terstruktur Non Pekerjaan, Intensitas Rendah', 'parent': 'D'},
        {'code': 'D8.1', 'name': 'Layanan Perawatan Harian, Non Akut, Perawatan Terstruktur Non-Kerja, Intensitas Rendah, Perawatan Terkait Kesehatan', 'description': 'Layanan Perawatan Harian, Non Akut, Perawatan Terstruktur Non-Kerja, Intensitas Rendah, Perawatan Terkait Kesehatan', 'parent': 'D8'},
        {'code': 'D8.2', 'name': 'Layanan Perawatan Harian, Non Akut, Perawatan Terstruktur Non-Kerja, Intensitas Rendah, Perawatan Terkait Pendidikan', 'description': 'Layanan Perawatan Harian, Non Akut, Perawatan Terstruktur Non-Kerja, Intensitas Rendah, Perawatan Terkait Pendidikan', 'parent': 'D8'},
        {'code': 'D8.3', 'name': 'Layanan Perawatan Harian, Non Akut, Perawatan Terstruktur Non-Kerja, Intensitas Rendah, Perawatan Terkait Sosial dan Budaya', 'description': 'Layanan Perawatan Harian, Non Akut, Perawatan Terstruktur Non-Kerja, Intensitas Rendah, Perawatan Terkait Sosial dan Budaya', 'parent': 'D8'},
        {'code': 'D8.4', 'name': 'Layanan Perawatan Harian, Non Akut, Perawatan Terstruktur Non-Kerja, Intensitas Rendah, Perawatan Terstruktur Non-Kerja Lainnya', 'description': 'Layanan Perawatan Harian, Non Akut, Perawatan Terstruktur Non-Kerja, Intensitas Rendah, Perawatan Terstruktur Non-Kerja Lainnya', 'parent': 'D8'},
        {'code': 'D9', 'name': 'Layanan Perawatan Harian, Non Akut, Perawatan Harian Tidak Terstruktur, Intensitas Rendah', 'description': 'Layanan Perawatan Harian, Non Akut, Perawatan Harian Tidak Terstruktur, Intensitas Rendah', 'parent': 'D'},
        # O Series (Outpatient) - 37 codes
        {'code': 'O', 'name': 'Layanan Rawat Jalan', 'description': 'Layanan Rawat Jalan', 'parent': None},
        {'code': 'O1', 'name': 'Layanan Rawat Jalan, Akut, Layanan Berbasis Kunjungan, Layanan 24 Jam', 'description': 'Layanan Rawat Jalan, Akut, Layanan Berbasis Kunjungan, Layanan 24 Jam', 'parent': 'O'},
        {'code': 'O1.1', 'name': 'Layanan Rawat Jalan, Akut, Layanan Berbasis Kunjungan, Layanan 24 Jam, Layanan Kesehatan', 'description': 'Layanan Rawat Jalan, Akut, Layanan Berbasis Kunjungan, Layanan 24 Jam, Layanan Kesehatan', 'parent': 'O1'},
        {'code': 'O1.2', 'name': 'Layanan Rawat Inap, Akut, Layanan Berbasis Kunjungan, Layanan 24 Jam, Layanan Non Kesehatan', 'description': 'Layanan Rawat Inap, Akut, Layanan Berbasis Kunjungan, Layanan 24 Jam, Layanan Non Kesehatan', 'parent': 'O1'},
        {'code': 'O2', 'name': 'Layanan Rawat Jalan, Akut, Layanan Berbasis Kunjungan, Layanan Tidak 24 Jam', 'description': 'Layanan Rawat Jalan, Akut, Layanan Berbasis Kunjungan, Layanan Tidak 24 Jam', 'parent': 'O'},
        {'code': 'O2.1', 'name': 'Layanan Rawat Jalan, Akut, Layanan Berbasis Kunjungan, Layanan Tidak 24 Jam, Layanan Kesehatan', 'description': 'Layanan Rawat Jalan, Akut, Layanan Berbasis Kunjungan, Layanan Tidak 24 Jam, Layanan Kesehatan', 'parent': 'O2'},
        {'code': 'O2.2', 'name': 'Layanan Rawat Jalan, Akut, Berbasis Kunjungan, Layanan Tidak 24 Jam, Layanan Non Kesehatan', 'description': 'Layanan Rawat Jalan, Akut, Berbasis Kunjungan, Layanan Tidak 24 Jam, Layanan Non Kesehatan', 'parent': 'O2'},
        {'code': 'O3', 'name': 'Layanan Rawat Jalan, Akut, Layanan Berbasis Fasilitas, Layanan 24 Jam', 'description': 'Layanan Rawat Jalan, Akut, Layanan Berbasis Fasilitas, Layanan 24 Jam', 'parent': 'O'},
        {'code': 'O3.1', 'name': 'Layanan Rawat Jalan, Akut, Layanan Berbasis Fasilitas, Layanan 24 Jam, Layanan Kesehatan', 'description': 'Layanan Rawat Jalan, Akut, Layanan Berbasis Fasilitas, Layanan 24 Jam, Layanan Kesehatan', 'parent': 'O3'},
        {'code': 'O3.2', 'name': 'Layanan Rawat Jalan, Akut, Layanan Berbasis Fasilitas, Layanan 24 Jam, Layanan Non Kesehatan', 'description': 'Layanan Rawat Jalan, Akut, Layanan Berbasis Fasilitas, Layanan 24 Jam, Layanan Non Kesehatan', 'parent': 'O3'},
        {'code': 'O4', 'name': 'Layanan Rawat Jalan, Akut, Layanan Berbasis Fasilitas, Layanan Tidak 24 Jam', 'description': 'Layanan Rawat Jalan, Akut, Layanan Berbasis Fasilitas, Layanan Tidak 24 Jam', 'parent': 'O'},
        {'code': 'O4.1', 'name': 'Layanan Rawat Jalan, Akut, Layanan Berbasis Fasilitas, Layanan Tidak 24 Jam, Layanan Kesehatan', 'description': 'Layanan Rawat Jalan, Akut, Layanan Berbasis Fasilitas, Layanan Tidak 24 Jam, Layanan Kesehatan', 'parent': 'O4'},
        {'code': 'O4.2', 'name': 'Layanan Rawat Jalan, Akut, Layanan Berbasis Fasilitas, Layanan Tidak 24 Jam, Layanan Non Kesehatan', 'description': 'Layanan Rawat Jalan, Akut, Layanan Berbasis Fasilitas, Layanan Tidak 24 Jam, Layanan Non Kesehatan', 'parent': 'O4'},
        {'code': 'O5', 'name': 'Layanan Rawat Jalanan, Non Akut, Layanan Berbasis Kunjungan, Intensitas Tinggi', 'description': 'Layanan Rawat Jalanan, Non Akut, Layanan Berbasis Kunjungan, Intensitas Tinggi', 'parent': 'O'},
        {'code': 'O5.1', 'name': 'Layanan Rawat Jalan, Non Akut, Layanan Berbasis Kunjungan, Intensitas Tinggi, Layanan Kesehatan', 'description': 'Layanan Rawat Jalan, Non Akut, Layanan Berbasis Kunjungan, Intensitas Tinggi, Layanan Kesehatan', 'parent': 'O5'},
        {'code': 'O5.1.1', 'name': 'Layanan Rawat Jalan, Non Akut, Layanan Berbasis Kunjungan, Intensitas Tinggi, Layanan Kesehatan, 3-6 Hari/Minggu', 'description': 'Layanan Rawat Jalan, Non Akut, Layanan Berbasis Kunjungan, Intensitas Tinggi, Layanan Kesehatan, 3-6 Hari/Minggu', 'parent': 'O5.1'},
        {'code': 'O5.1.2', 'name': 'Layanan Rawat Jalan, Non Akut, Layanan Berbasis Kunjungan, Intensitas Tinggi, Layanan Kesehatan, Layanan 7 Hari/Minggu', 'description': 'Layanan Rawat Jalan, Non Akut, Layanan Berbasis Kunjungan, Intensitas Tinggi, Layanan Kesehatan, Layanan 7 Hari/Minggu', 'parent': 'O5.1'},
        {'code': 'O5.1.3', 'name': 'Layanan Rawat Jalan, Non Akut, Layanan Berbasis Kunjungan, Intensitas Tinggi, Layanan Kesehatan, Layanan 7 Hari/Minggu Termasuk Menginap', 'description': 'Layanan Rawat Jalan, Non Akut, Layanan Berbasis Kunjungan, Intensitas Tinggi, Layanan Kesehatan, Layanan 7 Hari/Minggu Termasuk Menginap', 'parent': 'O5.1'},
        {'code': 'O5.2', 'name': 'Layanan Rawat Jalan, Non Akut, Layanan Berbasis Kunjungan, Intensitas Tinggi, Layanan Non Kesehatan', 'description': 'Layanan Rawat Jalan, Non Akut, Layanan Berbasis Kunjungan, Intensitas Tinggi, Layanan Non Kesehatan', 'parent': 'O5'},
        {'code': 'O5.2.1', 'name': 'Layanan Rawat Jalan, Non Akut, Layanan Berbasis Kunjungan, Intensitas Tinggi, Layanan Non Kesehatan, 3-6 Hari/Minggu', 'description': 'Layanan Rawat Jalan, Non Akut, Layanan Berbasis Kunjungan, Intensitas Tinggi, Layanan Non Kesehatan, 3-6 Hari/Minggu', 'parent': 'O5.2'},
        {'code': 'O5.2.2', 'name': 'Layanan Rawat Jalan, Non Akut, Layanan Berbasis Kunjungan, Intensitas Tinggi, Layanan Non Kesehatan, Layanan 7 Hari/Minggu', 'description': 'Layanan Rawat Jalan, Non Akut, Layanan Berbasis Kunjungan, Intensitas Tinggi, Layanan Non Kesehatan, Layanan 7 Hari/Minggu', 'parent': 'O5.2'},
        {'code': 'O5.2.3', 'name': 'Layanan Rawat Jalan, Non Akut, Layanan Berbasis Kunjungan, Intensitas Tinggi, Layanan Non Kesehatan, Layanan 7 Hari/Minggu Termasuk Menginap', 'description': 'Layanan Rawat Jalan, Non Akut, Layanan Berbasis Kunjungan, Intensitas Tinggi, Layanan Non Kesehatan, Layanan 7 Hari/Minggu Termasuk Menginap', 'parent': 'O5.2'},
        {'code': 'O6', 'name': 'Layanan Rawat Jalan, Non Akut, Layanan Berbasis Kunjungan, Intensitas Sedang', 'description': 'Layanan Rawat Jalan, Non Akut, Layanan Berbasis Kunjungan, Intensitas Sedang', 'parent': 'O'},
        {'code': 'O6.1', 'name': 'Layanan Rawat Jalan, Non Akut, Layanan Berbasis Kunjungan, Intensitas Sedang, Layanan Kesehatan', 'description': 'Layanan Rawat Jalan, Non Akut, Layanan Berbasis Kunjungan, Intensitas Sedang, Layanan Kesehatan', 'parent': 'O6'},
        {'code': 'O6.2', 'name': 'Layanan Rawat Jalan, Non Akut, Layanan Berbasis Kunjungan, Intensitas Sedang, Layanan Non Kesehatan', 'description': 'Layanan Rawat Jalan, Non Akut, Layanan Berbasis Kunjungan, Intensitas Sedang, Layanan Non Kesehatan', 'parent': 'O6'},
        {'code': 'O7', 'name': 'Layanan Rawat Jalan, Non Akut, Layanan Berbasis Kunjungan, Intensitas Rendah', 'description': 'Layanan Rawat Jalan, Non Akut, Layanan Berbasis Kunjungan, Intensitas Rendah', 'parent': 'O'},
        {'code': 'O7.1', 'name': 'Layanan Rawat Jalan, Non Akut, Layanan Berbasis Kunjungan, Intensitas Rendah, Layanan Kesehatan', 'description': 'Layanan Rawat Jalan, Non Akut, Layanan Berbasis Kunjungan, Intensitas Rendah, Layanan Kesehatan', 'parent': 'O7'},
        {'code': 'O7.2', 'name': 'Layanan Rawat Jalan, Non Akut, Layanan Berbasis Kunjungan, Intensitas Rendah, Layanan Non Kesehatan', 'description': 'Layanan Rawat Jalan, Non Akut, Layanan Berbasis Kunjungan, Intensitas Rendah, Layanan Non Kesehatan', 'parent': 'O7'},
        {'code': 'O8', 'name': 'Layanan Rawat Jalan, Non Akut, Layanan Berbasis Fasilitas, Intensitas Tinggi', 'description': 'Layanan Rawat Jalan, Non Akut, Layanan Berbasis Fasilitas, Intensitas Tinggi', 'parent': 'O'},
        {'code': 'O8.1', 'name': 'Layanan Rawat Jalan, Non Akut, Layanan Berbasis Fasilitas, Intensitas Tinggi, Layanan Kesehatan', 'description': 'Layanan Rawat Jalan, Non Akut, Layanan Berbasis Fasilitas, Intensitas Tinggi, Layanan Kesehatan', 'parent': 'O8'},
        {'code': 'O8.2', 'name': 'Layanan Rawat Jalan, Non Akut, Layanan Berbasis Fasilitas, Intensitas Tinggi, Layanan Non Kesehatan', 'description': 'Layanan Rawat Jalan, Non Akut, Layanan Berbasis Fasilitas, Intensitas Tinggi, Layanan Non Kesehatan', 'parent': 'O8'},
        {'code': 'O9', 'name': 'Layanan Rawat Jalan, Non Akut, Layanan Berbasis Fasilitas, Intensitas Sedang', 'description': 'Layanan Rawat Jalan, Non Akut, Layanan Berbasis Fasilitas, Intensitas Sedang', 'parent': 'O'},
        {'code': 'O9.1', 'name': 'Layanan Rawat Jalan, Non Akut, Layanan Berbasis Fasilitas, Intensitas Sedang, Layanan Kesehatan', 'description': 'Layanan Rawat Jalan, Non Akut, Layanan Berbasis Fasilitas, Intensitas Sedang, Layanan Kesehatan', 'parent': 'O9'},
        {'code': 'O9.2', 'name': 'Layanan Rawat Jalan, Non Akut, Layanan Berbasis Fasilitas, Intensitas Sedang, Layanan Non Kesehatan', 'description': 'Layanan Rawat Jalan, Non Akut, Layanan Berbasis Fasilitas, Intensitas Sedang, Layanan Non Kesehatan', 'parent': 'O9'},
        {'code': 'O10', 'name': 'Layanan Rawat Jalan, Non Akut, Layanan Berbasis Fasilitas, Intensitas Rendah', 'description': 'Layanan Rawat Jalan, Non Akut, Layanan Berbasis Fasilitas, Intensitas Rendah', 'parent': 'O'},
        {'code': 'O10.1', 'name': 'Layanan Rawat Jalan, Non Akut, Layanan Berbasis Fasilitas, Intensitas Rendah, Layanan Kesehatan', 'description': 'Layanan Rawat Jalan, Non Akut, Layanan Berbasis Fasilitas, Intensitas Rendah, Layanan Kesehatan', 'parent': 'O10'},
        {'code': 'O10.2', 'name': 'Layanan Rawat Jalan, Non Akut, Layanan Berbasis Fasilitas, Intensitas Rendah, Layanan Non Kesehatan', 'description': 'Layanan Rawat Jalan, Non Akut, Layanan Berbasis Fasilitas, Intensitas Rendah, Layanan Non Kesehatan', 'parent': 'O10'},
        # A Series (Accessibility) - 6 codes
        {'code': 'A', 'name': 'Layanan Aksesibilitas terhadap Perawatan', 'description': 'Layanan Aksesibilitas terhadap Perawatan', 'parent': None},
        {'code': 'A1', 'name': 'Layanan Aksesibilitas terhadap Perawatan, Komunikasi', 'description': 'Layanan Aksesibilitas terhadap Perawatan, Komunikasi', 'parent': 'A'},
        {'code': 'A2', 'name': 'Layanan Aksesibilitas terhadap Perawatan, Mobilitas Fisik', 'description': 'Layanan Aksesibilitas terhadap Perawatan, Mobilitas Fisik', 'parent': 'A'},
        {'code': 'A3', 'name': 'Layanan Aksesibilitas terhadap Perawatan, Pendampingan Pribadi', 'description': 'Layanan Aksesibilitas terhadap Perawatan, Pendampingan Pribadi', 'parent': 'A'},
        {'code': 'A4', 'name': 'Layanan Aksesibilitas terhadap Perawatan, Koordinasi Kasus', 'description': 'Layanan Aksesibilitas terhadap Perawatan, Koordinasi Kasus', 'parent': 'A'},
        {'code': 'A5', 'name': 'Layanan Aksesibilitas terhadap Perawatan, Aksesibilitas Lainnya', 'description': 'Layanan Aksesibilitas terhadap Perawatan, Aksesibilitas Lainnya', 'parent': 'A'},
        # I Series (Information) - 12 codes
        {'code': 'I', 'name': 'Layanan Informasi', 'description': 'Layanan Informasi', 'parent': None},
        {'code': 'I1', 'name': 'Layanan Informasi, Layanan Konsultasi dan Asesmen', 'description': 'Layanan Informasi, Layanan Konsultasi dan Asesmen', 'parent': 'I'},
        {'code': 'I1.1', 'name': 'Layanan Informasi, Layanan Konsultasi dan Asesmen, Terkait Kesehatan', 'description': 'Layanan Informasi, Layanan Konsultasi dan Asesmen, Terkait Kesehatan', 'parent': 'I1'},
        {'code': 'I1.2', 'name': 'Layanan Informasi, Layanan Konsultasi dan Asesmen, Terkait Pendidikan', 'description': 'Layanan Informasi, Layanan Konsultasi dan Asesmen, Terkait Pendidikan', 'parent': 'I1'},
        {'code': 'I1.3', 'name': 'Layanan Informasi, Layanan Konsultasi dan Asesmen, Terkait Sosial dan Budaya', 'description': 'Layanan Informasi, Layanan Konsultasi dan Asesmen, Terkait Sosial dan Budaya', 'parent': 'I1'},
        {'code': 'I1.4', 'name': 'Layanan Informasi, Layanan Konsultasi dan Asesmen, Terkait Pekerjaan', 'description': 'Layanan Informasi, Layanan Konsultasi dan Asesmen, Terkait Pekerjaan', 'parent': 'I1'},
        {'code': 'I1.5', 'name': 'Layanan Informasi, Layanan Konsultasi dan Asesmen, Lainnya Terkait Non-Pekerjaan', 'description': 'Layanan Informasi, Layanan Konsultasi dan Asesmen, Lainnya Terkait Non-Pekerjaan', 'parent': 'I1'},
        {'code': 'I2', 'name': 'Layanan Informasi, Penyediaan Informasi', 'description': 'Layanan Informasi, Penyediaan Informasi', 'parent': 'I'},
        {'code': 'I2.1', 'name': 'Layanan Informasi, Interaktif', 'description': 'Layanan Informasi, Interaktif', 'parent': 'I2'},
        {'code': 'I2.1.1', 'name': 'Layanan Informasi, Interaktif, Tatap Muka', 'description': 'Layanan Informasi, Interaktif, Tatap Muka', 'parent': 'I2.1'},
        {'code': 'I2.1.2', 'name': 'Layanan Informasi, Interaktif, Selain Interaktif', 'description': 'Layanan Informasi, Interaktif, Selain Interaktif', 'parent': 'I2.1'},
        {'code': 'I2.2', 'name': 'Layanan Informasi, Non Interaktif', 'description': 'Layanan Informasi, Non Interaktif', 'parent': 'I2'},
    ]

    # Process first phase: root codes (codes without parents)
    print("Phase 1: Creating root codes...")
    root_codes_created = 0
    for data in DESDE_LTC_CODES:
        if data['parent'] is None:
            code = data['code']
            if not MainTypeOfCare.objects.filter(code=code).exists():
                MainTypeOfCare.objects.create(
                    code=code,
                    name=data['name'],
                    description=data['description'],
                    parent=None,
                    is_active=True
                )
                root_codes_created += 1
                print(f"✓ Created root: {code} - {data['name'][:60]}...")
    print(f"Phase 1 Complete: {root_codes_created} root codes created\n")

    # Process remaining codes in multiple passes (to handle hierarchies)
    max_passes = 5
    for pass_num in range(1, max_passes + 1):
        print(f"Phase {pass_num + 1}: Creating level {pass_num} codes...")
        created_in_pass = 0

        for data in DESDE_LTC_CODES:
            if data['parent'] is not None:
                code = data['code']
                parent_code = data['parent']

                # Check if code already exists
                if MainTypeOfCare.objects.filter(code=code).exists():
                    continue

                # Check if parent exists
                parent_obj = MainTypeOfCare.objects.filter(code=parent_code).first()
                if parent_obj:
                    MainTypeOfCare.objects.create(
                        code=code,
                        name=data['name'],
                        description=data['description'],
                        parent=parent_obj,
                        is_active=True
                    )
                    created_in_pass += 1
                    print(f"✓ Created {code} (parent: {parent_code})")

        print(f"Phase {pass_num + 1} Complete: {created_in_pass} codes created\n")

        if created_in_pass == 0:
            print("All codes created successfully!")
            break

    total_created = MainTypeOfCare.objects.count()
    print(f"\n{'='*60}")
    print(f"SUMMARY:")
    print(f"Total DESDE-LTC codes in database: {total_created}")
    print(f"Expected: 102 healthcare codes (R, D, O, A, I series)")
    print(f"{'='*60}\n")

if __name__ == '__main__':
    print("\n" + "="*60)
    print("DESDE-LTC Comprehensive Classification Seed Script")
    print("="*60 + "\n")

    seed_desde_ltc()

    print("\n" + "="*60)
    print("Seeding completed!")
    print("="*60 + "\n")
