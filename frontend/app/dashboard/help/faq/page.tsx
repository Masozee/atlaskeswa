'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { HugeiconsIcon } from "@hugeicons/react"
import { Search01Icon } from "@hugeicons/core-free-icons";
import { Separator } from '@/components/ui/separator';

const faqs = [
  {
    id: 1,
    category: 'Umum',
    question: 'Bagaimana cara mengatur ulang kata sandi saya?',
    answer: 'Untuk mengatur ulang kata sandi Anda:\n\n1. Klik "Lupa Kata Sandi" pada halaman masuk\n2. Masukkan alamat email Anda\n3. Periksa email Anda untuk tautan pengaturan ulang\n4. Klik tautan tersebut dan masukkan kata sandi baru Anda\n\nJika Anda tidak menerima email dalam 5 menit, periksa folder spam atau hubungi dukungan.',
  },
  {
    id: 2,
    category: 'Umum',
    question: 'Apa saja peran pengguna yang berbeda?',
    answer: '**Administrator**: Akses penuh ke sistem, dapat mengelola semua pengguna dan pengaturan\n\n**Pengelola Data**: Dapat mengelola layanan, survei, dan melakukan verifikasi\n\n**Verifikator**: Dapat memverifikasi dan menyetujui/menolak pengajuan survei\n\n**Enumerator**: Dapat mengirim survei dan mengelola pengajuannya sendiri\n\n**Peninjau**: Akses hanya-baca untuk melihat data dan laporan',
  },
  {
    id: 3,
    category: 'DESDE-LTC',
    question: 'Bagaimana cara mengklasifikasikan layanan menggunakan DESDE-LTC?',
    answer: 'Untuk mengklasifikasikan layanan:\n\n1. Identifikasi **Jenis Perawatan Utama (MTC)**:\n   - R: Residensial\n   - D: Perawatan harian\n   - O: Rawat jalan\n   - A: Aksesibilitas\n   - I: Informasi\n   - W: Kerja/pelatihan\n   - S: Swadaya\n\n2. Tentukan **jenis layanan spesifik** menggunakan kode BSIC\n\n3. Gabungkan keduanya (mis., R2.1 untuk rumah sakit jiwa)\n\nRujuk pada panduan Referensi DESDE-LTC untuk kode terperinci.',
  },
  {
    id: 4,
    category: 'Umum',
    question: 'Berapa lama proses verifikasi berlangsung?',
    answer: 'Proses verifikasi biasanya memakan waktu:\n\n- **Pengajuan standar**: 2-3 hari kerja\n- **Pengajuan kompleks**: 5-7 hari kerja\n- **Pengajuan bermasalah**: Hingga masalah terselesaikan\n\nAnda akan menerima notifikasi email tentang status pengajuan Anda.',
  },
  {
    id: 5,
    category: 'Umum',
    question: 'Bisakah saya mengekspor data dari sistem?',
    answer: 'Ya! Anda dapat mengekspor data dalam beberapa format:\n\n**Format yang tersedia**:\n- Laporan PDF\n- Lembar kerja Excel (.xlsx)\n- Berkas CSV\n\n**Untuk mengekspor**:\n1. Buka data yang ingin Anda ekspor\n2. Klik tombol "Ekspor"\n3. Pilih format yang Anda inginkan\n4. Pilih rentang data dan filter\n5. Klik "Unduh"\n\nIzin ekspor bergantung pada peran pengguna Anda.',
  },
  {
    id: 6,
    category: 'Layanan',
    question: 'Bagaimana cara menambahkan layanan baru ke direktori?',
    answer: '1. Buka **Manajemen Layanan** > **Tambah Layanan Baru**\n2. Isi informasi yang diperlukan:\n   - Nama dan jenis layanan\n   - Lokasi dan detail kontak\n   - Klasifikasi MTC/BSIC\n   - Jam operasional\n   - Sumber daya yang tersedia\n3. Unggah dokumen pendukung\n4. Klik "Simpan" atau "Kirim untuk Verifikasi"',
  },
  {
    id: 7,
    category: 'Layanan',
    question: 'Apa perbedaan antara MTC dan BSIC?',
    answer: '**MTC (Jenis Perawatan Utama)** adalah kategori luas:\n- R (Residensial), D (Perawatan harian), O (Rawat jalan), dll.\n\n**BSIC (Kode Identifikasi Layanan Dasar)** adalah jenis layanan spesifik:\n- Angka seperti 1, 2.1, 3.2 yang memberikan klasifikasi rinci dalam setiap MTC\n\n**Contoh**: R2.1 berarti:\n- R = Perawatan residensial (MTC)\n- 2.1 = Jenis fasilitas residensial spesifik (BSIC)',
  },
  {
    id: 8,
    category: 'Survei',
    question: 'Apa yang terjadi jika survei saya ditolak?',
    answer: 'Jika survei Anda ditolak:\n\n1. Anda akan menerima notifikasi email\n2. Periksa alasan penolakan di sistem\n3. Tinjau masukan dari verifikator\n4. Lakukan koreksi yang diperlukan\n5. Kirim ulang survei\n\nAlasan penolakan umum:\n- Informasi tidak lengkap\n- Koordinat GPS tidak valid\n- Dokumentasi tidak ada\n- Klasifikasi layanan salah',
  },
  {
    id: 9,
    category: 'Survei',
    question: 'Bisakah saya mengedit survei yang telah dikirim?',
    answer: 'Tergantung pada status survei:\n\n- **Draf**: Dapat diedit dengan bebas\n- **Terkirim/Tertunda**: Tidak dapat diedit (harus ditarik terlebih dahulu)\n- **Ditolak**: Dapat diedit dan dikirim ulang\n- **Disetujui**: Tidak dapat diedit (buat survei baru untuk pembaruan)\n\nUntuk menarik survei yang tertunda, hubungi pengelola data atau admin Anda.',
  },
  {
    id: 10,
    category: 'Teknis',
    question: 'Mengapa sistem berjalan lambat?',
    answer: 'Penyebab umum dan solusi:\n\n**Koneksi internet lambat**:\n- Periksa kecepatan internet Anda\n- Coba muat ulang halaman\n\n**Cache peramban**:\n- Bersihkan cache dan cookie peramban Anda\n- Coba gunakan mode penyamaran/pribadi\n\n**Kumpulan data besar**:\n- Gunakan filter untuk membatasi data yang ditampilkan\n- Ekspor kumpulan data besar alih-alih menampilkannya\n\nJika masalah berlanjut, hubungi dukungan teknis.',
  },
  {
    id: 11,
    category: 'Teknis',
    question: 'Peramban mana saja yang didukung?',
    answer: 'Atlas Keswa mendukung peramban modern:\n\n**Direkomendasikan**:\n- Google Chrome (versi terbaru)\n- Mozilla Firefox (versi terbaru)\n- Microsoft Edge (versi terbaru)\n- Safari (versi terbaru)\n\n**Persyaratan minimum**:\n- JavaScript diaktifkan\n- Cookie diaktifkan\n- Resolusi layar: 1024x768 atau lebih tinggi',
  },
];

const breadcrumbs = [
  { label: 'Dasbor', href: '/dashboard' },
  { label: 'Bantuan & Dokumentasi', href: '/dashboard/help' },
  { label: 'FAQ' },
];

export default function FAQPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = ['all', ...Array.from(new Set(faqs.map((faq) => faq.category)))];

  const filteredFAQs = faqs.filter((faq) => {
    const matchesSearch =
      searchQuery === '' ||
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <>
      <PageHeader breadcrumbs={breadcrumbs} />

      <div className="flex flex-1 flex-col gap-4">
        <div className="px-8 pt-8">
          <h1 className="text-2xl font-bold">Pertanyaan yang Sering Diajukan</h1>
          <p className="text-muted-foreground">
            Temukan jawaban atas pertanyaan umum tentang penggunaan Atlas Keswa
          </p>
        </div>

        <Separator />

        <div className="flex flex-col gap-4 px-8 pb-8">
        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <HugeiconsIcon icon={Search01Icon} size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Cari pertanyaan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            {categories.map((category) => (
              <Badge
                key={category}
                variant={selectedCategory === category ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => setSelectedCategory(category)}
              >
                {category === 'all' ? 'Semua' : category}
              </Badge>
            ))}
          </div>
        </div>

        {/* FAQs */}
        {filteredFAQs.length > 0 ? (
          <Accordion type="single" collapsible className="w-full">
            {filteredFAQs.map((faq) => (
              <AccordionItem key={faq.id} value={`faq-${faq.id}`}>
                <AccordionTrigger className="text-left">
                  <span>{faq.question}</span>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="pt-2 space-y-2">
                    <Badge variant="outline" className="mb-2">
                      {faq.category}
                    </Badge>
                    <div className="text-sm text-muted-foreground whitespace-pre-line">
                      {faq.answer}
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              Tidak ada FAQ yang cocok dengan pencarian Anda.
            </p>
          </div>
        )}

        {/* Still have questions */}
        <div className="bg-blue-50 rounded-lg p-6">
          <div className="text-center">
            <h3 className="font-semibold text-blue-900 mb-2">Masih punya pertanyaan?</h3>
            <p className="text-sm text-blue-700 mb-4">
              Tidak menemukan yang Anda cari? Hubungi tim dukungan kami untuk bantuan.
            </p>
            <a
              href="/dashboard/help/support"
              className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Hubungi Dukungan
            </a>
          </div>
        </div>
        </div>
      </div>
    </>
  );
}
