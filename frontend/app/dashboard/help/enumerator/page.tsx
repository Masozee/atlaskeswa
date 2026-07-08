'use client';

import { PageHeader } from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

const checklistItems = {
  before: [
    'Tinjau formulir survei dengan saksama',
    'Siapkan dokumen dan identitas yang diperlukan',
    'Isi daya perangkat hingga penuh',
    'Uji koneksi internet',
    'Unduh formulir survei luring (jika diperlukan)',
  ],
  during: [
    'Perkenalkan diri secara profesional',
    'Jelaskan tujuan survei',
    'Minta dan peroleh persetujuan',
    'Ikuti alur survei secara sistematis',
    'Ajukan pertanyaan klarifikasi bila diperlukan',
    'Dokumentasikan bukti (foto, dokumen)',
    'Verifikasi semua informasi yang diberikan',
  ],
  after: [
    'Kirim survei dengan segera',
    'Unggah semua dokumen pendukung',
    'Catat setiap masalah atau kekhawatiran',
    'Tindak lanjuti jika diperlukan informasi tambahan',
    'Tinjau kelengkapannya',
  ],
};

const commonIssues = [
  {
    issue: 'GPS Tidak Berfungsi',
    solutions: [
      'Aktifkan layanan lokasi di pengaturan perangkat',
      'Pindah ke area terbuka dengan pandangan langit yang jelas',
      'Mulai ulang layanan GPS/lokasi',
      'Masukkan koordinat secara manual jika GPS gagal',
    ],
  },
  {
    issue: 'Layanan Tidak Ada di Basis Data',
    solutions: [
      'Gunakan formulir "Tambah Layanan Baru"',
      'Berikan informasi rinci tentang layanan tersebut',
      'Dokumentasikan layanan dengan foto',
      'Catat alasan mengapa belum terdaftar sebelumnya',
    ],
  },
  {
    issue: 'Responden Tidak Tersedia',
    solutions: [
      'Jadwalkan janji temu ulang',
      'Tinggalkan informasi kontak',
      'Dokumentasikan upaya dalam catatan',
      'Coba metode kontak alternatif',
    ],
  },
];

const breadcrumbs = [
  { label: 'Dasbor', href: '/dashboard' },
  { label: 'Bantuan & Dokumentasi', href: '/dashboard/help' },
  { label: 'Buku Panduan Enumerator' },
];

export default function EnumeratorPage() {
  return (
    <>
      <PageHeader breadcrumbs={breadcrumbs} />

      <div className="flex flex-1 flex-col gap-4">
        <div className="px-8 pt-8">
          <h1 className="text-2xl font-bold">Buku Panduan Enumerator</h1>
          <p className="text-muted-foreground">
            Panduan referensi cepat untuk melakukan survei layanan kesehatan jiwa
          </p>
        </div>

        <Separator />

        <div className="flex flex-col gap-4 px-8 pb-8">
        {/* Checklists */}
        <div className="grid gap-4 md:grid-cols-3">
          <div className="p-4 rounded-lg bg-muted/50">
            <h3 className="font-semibold text-base mb-3">Sebelum Memulai</h3>
            <ul className="space-y-2">
              {checklistItems.before.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm">
                  <span className="text-muted-foreground">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="p-4 rounded-lg bg-muted/50">
            <h3 className="font-semibold text-base mb-3">Selama Survei</h3>
            <ul className="space-y-2">
              {checklistItems.during.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm">
                  <span className="text-muted-foreground">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="p-4 rounded-lg bg-muted/50">
            <h3 className="font-semibold text-base mb-3">Setelah Survei</h3>
            <ul className="space-y-2">
              {checklistItems.after.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm">
                  <span className="text-muted-foreground">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Service Details Section */}
        <div className="p-4 rounded-lg bg-muted/50">
          <h2 className="text-lg font-semibold mb-4">Informasi Utama yang Harus Dikumpulkan</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Informasi Dasar</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Nama dan jenis layanan</li>
                <li>• Alamat dan lokasi lengkap</li>
                <li>• Informasi kontak (telepon, email)</li>
                <li>• Koordinat GPS</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Detail Layanan</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Layanan yang disediakan (klasifikasi MTC/BSIC)</li>
                <li>• Jam dan jadwal operasional</li>
                <li>• Sumber daya dan kapasitas yang tersedia</li>
                <li>• Populasi sasaran yang dilayani</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Pemeriksaan Kualitas</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Verifikasi akurasi koordinat GPS</li>
                <li>• Validasi detail kontak</li>
                <li>• Konfirmasi klasifikasi layanan</li>
                <li>• Pastikan semua kolom wajib terisi lengkap</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Dokumentasi</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Foto fasilitas (eksterior/interior)</li>
                <li>• Dokumen pendukung</li>
                <li>• Salinan lisensi atau sertifikasi</li>
                <li>• Detail narahubung</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Common Issues */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Masalah Umum & Solusi</h2>
          <div className="grid gap-4">
            {commonIssues.map((item, idx) => (
              <div key={idx} className="p-4 rounded-lg bg-muted/50">
                <h3 className="font-semibold mb-3">{item.issue}</h3>
                <ul className="space-y-2">
                  {item.solutions.map((solution, sidx) => (
                    <li key={sidx} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <span>•</span>
                      <span>{solution}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Best Practices */}
        <div className="bg-blue-50 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-blue-900 mb-4">Praktik Terbaik</h2>
          <ul className="space-y-2 text-sm text-blue-800">
            <li>• Selalu bersikap profesional dan hormat kepada responden</li>
            <li>• Verifikasi informasi dari berbagai sumber bila memungkinkan</li>
            <li>• Ambil foto yang jelas dan terang untuk dokumentasi</li>
            <li>• Kirim survei pada hari yang sama bila memungkinkan</li>
            <li>• Buat catatan rinci untuk setiap situasi yang tidak biasa</li>
          </ul>
        </div>
        </div>
      </div>
    </>
  );
}
