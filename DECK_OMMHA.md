# Deck: OMMHA — Aplikasi Pendataan Fasilitas Kesehatan Jiwa & Layanan Sosial

> Spesifikasi slide untuk Claude for PowerPoint. Bahasa Indonesia. Satu ide per slide.
>
> **Palet warna (pakai konsisten):**
> - Utama / dominan: `#00979D` (teal)
> - Teks utama: `#1A1A1A`
> - Teks sekunder: `#374151`
> - Teks redup / caption: `#6B7280`
> - Aksen / highlight: `#FFBF47` (kuning)
> - Border / pemisah: `#E5E7EB`
> - Latar terang: `#FFFFFF` / `#F5F7F7`
>
> **Aturan visual:** slide judul & penutup latar gelap teal `#00979D` teks putih. Slide isi latar terang. Tiap slide punya 1 elemen visual (ikon/diagram/kartu). Hindari slide teks polos.

---

## Slide 1 — Judul (latar teal gelap)

**Judul:** OMMHA
**Subjudul:** Aplikasi Pendataan & Klasifikasi Fasilitas Kesehatan Jiwa dan Layanan Sosial
**Catatan kaki:** Berbasis standar klasifikasi DESDE-LTC
Visual: logo / ikon besar fasilitas di tengah.

---

## Slide 2 — Apa Itu OMMHA?

**Judul:** Apa Itu OMMHA?

- Aplikasi survey untuk **mendata & mengklasifikasikan** fasilitas layanan kesehatan jiwa dan sosial di Indonesia.
- Memakai standar internasional **DESDE-LTC** — memetakan jenis layanan secara terstruktur.

**Tiga bagian (tampilkan 3 kartu/ikon):**
1. **Aplikasi Mobile** — surveyor isi data di lapangan
2. **Dashboard Web** — admin & verifikator kelola data
3. **Direktori** — data terverifikasi siap diakses

---

## Slide 3 — Siapa Penggunanya? (tabel/4 kartu)

**Judul:** Empat Peran Pengguna

| Pengguna | Tugas |
|---|---|
| **Surveyor** | Isi survey fasilitas di lapangan (mobile) |
| **Verifikator** | Periksa & setujui/tolak data masuk |
| **Admin** | Kelola seluruh data, pengguna, sistem |
| **Viewer** | Lihat data terverifikasi (hanya baca) |

Catatan: tiap pengguna hanya melihat data sesuai perannya — data aman & terpisah.

---

## Slide 4 — Cara Pakai: Surveyor (alur 6 langkah)

**Judul:** Cara Pakai — Surveyor (Aplikasi Mobile)

Tampilkan sebagai 6 langkah bernomor / flow:
1. **Login** ke aplikasi OMMHA
2. **Mulai survey** untuk satu fasilitas
3. **Isi pertanyaan** — form pintar yang menyesuaikan pertanyaan berikut
4. **Unggah foto** bukti/dokumentasi
5. **Simpan** — sinkron otomatis ke server (bisa diisi walau sinyal lemah)
6. **Layar ringkasan** — nama, lokasi, klasifikasi, tanggal, status tersimpan

---

## Slide 5 — Alur Survey Bercabang (konsep)

**Judul:** Form Pintar yang Bercabang Otomatis

- Survey **menyesuaikan jawaban** — surveyor tak perlu isi yang tidak relevan.
- 4 tahap besar (tampilkan diagram alur):

`Data Dasar → Jenis Layanan → Pendalaman Layanan → Detail Operasional`

Aksen kuning `#FFBF47` untuk panah/penanda percabangan.

---

## Slide 6 — Tahap 1: Data Dasar

**Judul:** Tahap 1 — Data Dasar Fasilitas

- Nama fasilitas
- **Masih beroperasi?** → jika *Tidak*, survey langsung selesai
- Bidang pelayanan (keswa / sosial / pendidikan / lainnya)
- **Jenis fasilitas** → menentukan jalur berikutnya (faskes / non-faskes)
- Lokasi berjenjang: **Provinsi → Kabupaten/Kota → Kecamatan → Desa/Kelurahan**
- Alamat, telepon, email, website
- Badan hukum, izin, tahun beroperasi, cakupan wilayah

Visual: ikon-ikon kecil per kategori data.

---

## Slide 7 — Tahap 2: Jenis Layanan (2 kolom)

**Judul:** Tahap 2 — Pilih Jenis Layanan

Sistem otomatis menampilkan sesuai jenis fasilitas:

**Faskes (Kesehatan)**
- Rawat Inap
- Perawatan Harian
- Rawat Jalan
- Aksesibilitas
- Informasi & Konsultasi

**Non-Faskes (Sosial)**
- Versi sosial dari kelima layanan di atas

Visual: dua kolom, kolom kiri teal, kolom kanan abu/kuning.

---

## Slide 8 — Tahap 3 & 4: Pendalaman + Detail

**Judul:** Tahap 3 & 4 — Detail per Layanan

**Tahap 3 — Pendalaman (contoh pertanyaan):**
- Layanan akut atau non-akut?
- Pemantauan / dokter 24 jam?
- Penanganan krisis, stabilisasi, durasi

**Tahap 4 — Detail Operasional:**
- Kapasitas (tempat tidur / terisi)
- Jenis kelamin & usia pasien dilayani
- Estimasi pasien per tahun
- **Metode pembayaran** → jika *mandiri*, muncul tarif
- Kegiatan layanan, data staf, kemitraan

---

## Slide 9 — Cara Pakai: Verifikator & Admin

**Judul:** Cara Pakai — Verifikator & Admin (Dashboard Web)

1. **Login** ke dashboard
2. Buka **Antrian Verifikasi** — daftar survey masuk
3. **Periksa detail** tiap survey
4. **Setujui / Tolak** dengan catatan
5. Data disetujui → masuk **Direktori**
6. Pantau **Log Aktivitas** — jejak siapa ubah apa

---

## Slide 10 — Fitur Unggulan (grid 2x3 / ikon)

**Judul:** Fitur Unggulan

- **Form pintar bercabang** — hemat waktu surveyor
- **Klasifikasi otomatis** standar DESDE-LTC
- **Pendataan lokasi berjenjang** seluruh Indonesia
- **Alur verifikasi** — jaminan kualitas data
- **Isi di lapangan** — sync otomatis + unggah foto
- **Riwayat & audit** — setiap perubahan tercatat

Tampilkan tiap fitur sebagai ikon dalam lingkaran teal + judul + 1 baris.

---

## Slide 11 — Contoh Alur Nyata (3 kartu)

**Judul:** Contoh Alur Nyata

- **Rumah Sakit (Rawat Inap):** Data dasar → pilih Rawat Inap → akut, dokter 24 jam → kapasitas, staf, tarif → selesai
- **Puskesmas (Rawat Jalan + Informasi):** Data dasar → pilih 2 layanan → tiap layanan diisi detailnya → selesai
- **LSM (Informasi Sosial):** Data dasar → pilih info sosial → jenis konsultasi → detail → selesai

---

## Slide 12 — Panduan Warna (Color Code)

**Judul:** Sistem Warna Aplikasi

| Peran Warna | Kode | Dipakai untuk |
|---|---|---|
| Utama (Aktif) | `#00979D` | Tombol, link, menu aktif |
| Sekunder | `#6B7280` | Aksi pendukung, elemen redup |
| Fokus | `#FFBF47` | Garis fokus, aksesibilitas |
| Teks Utama | `#1A1A1A` | Isi teks, judul |
| Teks Sekunder | `#374151` | Label, teks bantuan |
| Garis / Border | `#E5E7EB` | Pemisah, kartu, separator |

Visual: tampilkan kotak swatch warna asli untuk tiap baris.

---

## Slide 13 — Penutup (latar teal gelap)

**Judul:** OMMHA
**Pesan:** Data fasilitas keswa & sosial yang terstruktur, terverifikasi, dan mudah diakses.
Visual: ikon centang / direktori, teks putih di latar teal `#00979D`.
