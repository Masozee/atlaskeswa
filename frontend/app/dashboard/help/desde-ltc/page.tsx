'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';

const mtcCategories = [
  {
    code: 'R',
    name: 'Perawatan Residensial',
    description: 'Layanan yang menyediakan akomodasi dan perawatan 24 jam',
    color: 'bg-blue-100 text-blue-800',
    examples: ['Rumah sakit jiwa', 'Rumah perawatan', 'Perawatan residensial krisis'],
  },
  {
    code: 'D',
    name: 'Perawatan Harian',
    description: 'Layanan yang menyediakan kegiatan terstruktur pada siang hari',
    color: 'bg-green-100 text-green-800',
    examples: ['Pusat harian', 'Rumah sakit harian', 'Lokakarya terapeutik'],
  },
  {
    code: 'O',
    name: 'Perawatan Rawat Jalan',
    description: 'Layanan yang menyediakan konsultasi dan pengobatan terjadwal',
    color: 'bg-purple-100 text-purple-800',
    examples: ['Klinik rawat jalan', 'Pusat kesehatan jiwa', 'Perawatan primer'],
  },
  {
    code: 'A',
    name: 'Aksesibilitas Perawatan',
    description: 'Layanan yang memfasilitasi akses ke perawatan',
    color: 'bg-yellow-100 text-yellow-800',
    examples: ['Layanan darurat', 'Tim bergerak', 'Saluran bantuan'],
  },
  {
    code: 'I',
    name: 'Informasi',
    description: 'Layanan yang menyediakan informasi tentang perawatan yang tersedia',
    color: 'bg-orange-100 text-orange-800',
    examples: ['Layanan informasi', 'Layanan advokasi', 'Registrasi'],
  },
  {
    code: 'W',
    name: 'Kerja dan Pelatihan',
    description: 'Layanan untuk rehabilitasi vokasional',
    color: 'bg-cyan-100 text-cyan-800',
    examples: ['Lokakarya terlindung', 'Pekerjaan transisi', 'Pelatihan kerja'],
  },
  {
    code: 'S',
    name: 'Swadaya dan Kerja Sukarela',
    description: 'Layanan dukungan sebaya dan yang dipimpin pengguna',
    color: 'bg-pink-100 text-pink-800',
    examples: ['Kelompok swadaya', 'Dukungan sebaya', 'Organisasi pengguna'],
  },
];

const breadcrumbs = [
  { label: 'Dasbor', href: '/dashboard' },
  { label: 'Bantuan & Dokumentasi', href: '/dashboard/help' },
  { label: 'Klasifikasi DESDE-LTC' },
];

export default function DESDELTCPage() {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <>
      <PageHeader breadcrumbs={breadcrumbs} />

      <div className="flex flex-1 flex-col gap-4">
        <div className="px-8 pt-8">
          <h1 className="text-2xl font-bold">Referensi Klasifikasi DESDE-LTC</h1>
          <p className="text-muted-foreground">
            Description and Evaluation of Services and DirectoriEs for Long Term Care
          </p>
        </div>

        <Separator />

        <div className="flex flex-col gap-4 px-8 pb-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="overview">Ikhtisar</TabsTrigger>
            <TabsTrigger value="mtc">Jenis Perawatan Utama (MTC)</TabsTrigger>
            <TabsTrigger value="bsic">Kode BSIC</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 mt-6">
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Apa itu DESDE-LTC?</h2>
              <p className="text-sm text-muted-foreground">
                DESDE-LTC (Description and Evaluation of Services and DirectoriEs for Long Term Care) adalah
                instrumen standar untuk mendeskripsikan dan mengklasifikasikan layanan kesehatan jiwa dan perawatan jangka panjang.
              </p>
              <div className="space-y-2">
                <h4 className="font-medium">Fitur Utama:</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Sistem klasifikasi yang terstandardisasi</li>
                  <li>Keterbandingan internasional</li>
                  <li>Deskripsi layanan yang komprehensif</li>
                  <li>Kategorisasi berbasis bukti</li>
                </ul>
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Struktur Klasifikasi</h2>
              <div className="space-y-2">
                <h4 className="font-medium">Format Kode Layanan</h4>
                <div className="bg-muted p-4 rounded-lg font-mono text-sm">
                  <div className="mb-2">Contoh: <strong>R2.1</strong></div>
                  <div className="space-y-1 text-xs">
                    <div><strong>R</strong> = Jenis Perawatan Utama (MTC)</div>
                    <div><strong>2.1</strong> = Kode Identifikasi Layanan Dasar (BSIC)</div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="mtc" className="space-y-4 mt-6">
            <div className="grid gap-4">
              {mtcCategories.map((category) => (
                <div key={category.code} className="p-4 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3 mb-2">
                    <Badge className={`font-mono text-lg px-3 py-1 ${category.color}`}>
                      {category.code}
                    </Badge>
                    <h3 className="text-lg font-semibold">{category.name}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{category.description}</p>
                  <div>
                    <h4 className="text-sm font-medium mb-2">Contoh:</h4>
                    <div className="flex flex-wrap gap-2">
                      {category.examples.map((example, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {example}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="bsic" className="space-y-6 mt-6">
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Kode Identifikasi Layanan Dasar (BSIC)</h2>
              <p className="text-sm text-muted-foreground">
                Kode BSIC menyediakan klasifikasi rinci layanan dalam setiap Jenis Perawatan Utama.
                Setiap kode terdiri dari angka dan desimal untuk menunjukkan jenis layanan spesifik.
              </p>

              <div className="space-y-3">
                <div className="bg-muted/50 rounded-lg p-4">
                  <div className="font-medium mb-2">Contoh: Perawatan Residensial (R)</div>
                  <div className="space-y-1.5 text-sm">
                    <div className="flex items-start gap-2">
                      <code className="bg-muted px-2 py-0.5 rounded text-xs">R1</code>
                      <span className="text-muted-foreground">Perawatan residensial akut/krisis</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <code className="bg-muted px-2 py-0.5 rounded text-xs">R2</code>
                      <span className="text-muted-foreground">Perawatan residensial jangka panjang</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <code className="bg-muted px-2 py-0.5 rounded text-xs">R3</code>
                      <span className="text-muted-foreground">Hunian dengan dukungan</span>
                    </div>
                  </div>
                </div>

                <div className="bg-muted/50 rounded-lg p-4">
                  <div className="font-medium mb-2">Contoh: Perawatan Rawat Jalan (O)</div>
                  <div className="space-y-1.5 text-sm">
                    <div className="flex items-start gap-2">
                      <code className="bg-muted px-2 py-0.5 rounded text-xs">O1</code>
                      <span className="text-muted-foreground">Perawatan rawat jalan akut/krisis</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <code className="bg-muted px-2 py-0.5 rounded text-xs">O2</code>
                      <span className="text-muted-foreground">Perawatan rawat jalan non-akut</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <code className="bg-muted px-2 py-0.5 rounded text-xs">O3</code>
                      <span className="text-muted-foreground">Perawatan kesehatan jiwa masyarakat</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 rounded-lg p-4">
                <div className="text-sm">
                  <p className="font-medium text-blue-900 mb-1">Butuh detail lebih lanjut?</p>
                  <p className="text-blue-700">
                    Untuk daftar kode BSIC lengkap dan definisi rinci, silakan merujuk pada
                    manual resmi DESDE-LTC atau hubungi administrator sistem Anda.
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
        </div>
      </div>
    </>
  );
}
