# OMMHA — Aplikasi Pendataan Fasilitas Kesehatan Jiwa & Layanan Sosial

*Bahan Presentasi*

---

## 1. Apa Itu OMMHA?

- Aplikasi survey untuk **mendata dan mengklasifikasikan** fasilitas layanan kesehatan jiwa dan layanan sosial di Indonesia.
- Memakai standar klasifikasi internasional **DESDE-LTC** (memetakan jenis layanan secara terstruktur).
- Tiga bagian yang bekerja sama:
  - **Aplikasi Mobile** — dipakai surveyor mengisi data langsung di lapangan.
  - **Dashboard Web** — dipakai admin & verifikator memeriksa dan mengelola data.
  - **Direktori** — kumpulan data fasilitas yang sudah terverifikasi.

---

## 2. Siapa Penggunanya?

| Pengguna | Tugas |
|---|---|
| **Surveyor** | Mengisi survey fasilitas di lapangan lewat aplikasi mobile |
| **Verifikator** | Memeriksa & menyetujui/menolak data yang masuk |
| **Admin** | Mengelola seluruh data, pengguna, dan sistem |
| **Viewer** | Melihat data yang sudah terverifikasi (hanya baca) |

- Setiap pengguna hanya melihat data sesuai perannya (data aman & terpisah).

---

## 3. Cara Memakai — Surveyor (Aplikasi Mobile)

1. **Masuk (login)** ke aplikasi OMMHA.
2. **Mulai survey baru** untuk satu fasilitas.
3. **Isi pertanyaan** — form pintar yang menyesuaikan pertanyaan berikutnya berdasarkan jawaban Anda.
4. **Unggah foto** bukti/dokumentasi fasilitas.
5. **Simpan** — data otomatis tersinkron ke server (bisa diisi walau sinyal terbatas, sync menyusul).
6. **Layar Terima Kasih** tampil — menampilkan ringkasan: nama fasilitas, lokasi, klasifikasi layanan, tanggal survey, status tersimpan.

---

## 4. Alur Survey (Bagaimana Pertanyaan Mengalir)

Survey **bercabang otomatis** — pertanyaan menyesuaikan jawaban, jadi surveyor tidak perlu mengisi yang tidak relevan.

### Tahap 1 — Data Dasar Fasilitas
- Nama fasilitas
- **Apakah fasilitas masih beroperasi?** → jika *Tidak*, survey langsung selesai.
- Bidang pelayanan (kesehatan jiwa / sosial / pendidikan / lainnya)
- **Jenis fasilitas** → menentukan jalur pertanyaan selanjutnya (faskes atau non-faskes)
- Lokasi berjenjang: **Provinsi → Kabupaten/Kota → Kecamatan → Desa/Kelurahan**
- Alamat lengkap, telepon, email, website
- Status badan hukum, izin, tahun mulai beroperasi, cakupan wilayah layanan

### Tahap 2 — Jenis Layanan
Sistem otomatis menampilkan pilihan sesuai jenis fasilitas:
- **Faskes (Kesehatan):** Rawat Inap, Perawatan Harian, Rawat Jalan, Aksesibilitas, Informasi & Konsultasi
- **Non-Faskes (Sosial):** versi sosial dari kelima layanan di atas

### Tahap 3 — Pendalaman per Layanan
Untuk **setiap layanan yang dipilih**, muncul rangkaian pertanyaan rinci, misalnya:
- Layanan akut atau non-akut?
- Pemantauan/dokter 24 jam?
- Penanganan krisis, stabilisasi, durasi, dll.

### Tahap 4 — Detail Operasional per Layanan
Untuk tiap layanan, diisi data lengkap:
- Nama layanan, kapasitas (jumlah tempat tidur / terisi)
- Jenis kelamin & rentang usia pasien dilayani
- Estimasi jumlah pasien per tahun
- **Metode pembayaran** → jika *mandiri*, muncul pertanyaan tarif
- Jenis kegiatan layanan (tabel kegiatan)
- Data staf
- Kemitraan dengan pihak lain

---

## 5. Cara Memakai — Verifikator & Admin (Dashboard Web)

1. **Masuk** ke dashboard.
2. Buka **Antrian Verifikasi** — daftar survey yang masuk dari surveyor.
3. **Periksa detail** setiap survey.
4. **Setujui** atau **Tolak** dengan catatan.
5. Data yang disetujui masuk ke **Direktori** dan bisa dilihat publik/viewer.
6. Pantau **Log Aktivitas** untuk jejak siapa mengubah apa.

---

## 6. Fitur Unggulan

- **Form pintar bercabang** — hanya menanyakan yang relevan, hemat waktu surveyor.
- **Klasifikasi otomatis** layanan sesuai standar DESDE-LTC.
- **Pendataan lokasi berjenjang** seluruh Indonesia.
- **Alur verifikasi** — menjamin kualitas data sebelum dipublikasikan.
- **Bisa diisi di lapangan** dengan sinkronisasi otomatis & unggah foto.
- **Ringkasan klasifikasi instan** di akhir survey.
- **Riwayat & audit** — setiap perubahan tercatat.

---

## 7. Contoh Alur Nyata

- **Rumah Sakit dgn Rawat Inap:** Data dasar → pilih Rawat Inap → jenis akut, dokter 24 jam → kapasitas, staf, tarif → selesai.
- **Puskesmas dgn Rawat Jalan + Informasi:** Data dasar → pilih 2 layanan → tiap layanan diisi detailnya satu per satu → selesai.
- **LSM dgn Layanan Informasi Sosial:** Data dasar → pilih info sosial → jenis konsultasi → detail → selesai.

---

## 8. Panduan Warna (Color Code Design)

Sistem memakai warna yang konsisten di seluruh aplikasi:

| Peran Warna | Kode | Dipakai untuk |
|---|---|---|
| **Utama (Aktif)** | `#00979D` | Tombol, link, menu aktif, status aktif |
| **Sekunder** | `#6B7280` | Aksi pendukung, elemen redup |
| **Fokus** | `#FFBF47` | Garis fokus, aksesibilitas |
| **Teks Utama** | `#1A1A1A` | Isi teks, judul |
| **Teks Sekunder** | `#374151` | Label, teks bantuan |
| **Teks Redup** | `#6B7280` | Petunjuk, placeholder |
| **Garis / Border** | `#E5E7EB` | Garis pemisah, kartu, separator |

- **Menu aktif di sidebar:** latar `#00979D`, teks putih.
- Warna utama `#00979D` (teal) = identitas visual aplikasi.

---

*OMMHA — Data fasilitas keswa & sosial yang terstruktur, terverifikasi, dan mudah diakses.*
