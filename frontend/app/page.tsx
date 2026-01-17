'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { HugeiconsIcon } from "@hugeicons/react"
import {DashboardSquare01Icon,
  Hospital01Icon,
  ClipboardIcon,
  Analytics01Icon,
  Location01Icon,
  ShieldUserIcon,
  ArrowRight01Icon,
  CheckmarkCircle02Icon,
  Database01Icon,
  FileAttachmentIcon,
  HelpCircleIcon,
  BookOpen01Icon,
  Menu01Icon,
  Alert02Icon} from "@hugeicons/core-free-icons";

const partnerLogos = [
  { src: '/yakkum.png', alt: 'Yakkum' },
  { src: '/kebumen.png', alt: 'Kebumen' },
  { src: '/koneksi.png', alt: 'Koneksi' },
  { src: '/brin.png', alt: 'BRIN' },
  { src: '/kemenkes.png', alt: 'Kemenkes' },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Development Notice Banner */}
      <div className="bg-amber-500/90 text-amber-950 py-3 px-4">
        <div className="container max-w-7xl mx-auto flex items-center justify-center gap-3">
          <HugeiconsIcon icon={Alert02Icon} size={20} className="flex-shrink-0" />
          <p className="text-sm font-medium text-center">
            Situs ini masih dalam tahap pengembangan. Beberapa fitur mungkin belum tersedia atau berfungsi dengan sempurna.
          </p>
        </div>
      </div>

      {/* Navigasi */}
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative h-10 w-10">
              <Image
                src="/logo.png"
                alt="Logo Atlas Keswa"
                fill
                className="object-contain"
              />
            </div>
            <div>
              <h1 className="font-bold text-lg">Atlas Keswa</h1>
              <p className="text-xs text-muted-foreground">Sistem DESDE-LTC</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-6">
              <Link
                href="#features"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Fitur
              </Link>
              <Link
                href="/dashboard/help/user-guide"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Dokumentasi
              </Link>
              <Link
                href="/dashboard/help/faq"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                FAQ
              </Link>
              <Link
                href="/dashboard/help/support"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Dukungan
              </Link>
            </div>
            <Button asChild>
              <Link href="/dashboard" className="gap-2">
                Ke Dasbor
                <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
              </Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Bagian Hero */}
      <section className="container max-w-7xl mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <Badge variant="secondary" className="gap-2 px-4 py-1.5">
            <HugeiconsIcon icon={CheckmarkCircle02Icon} size={16} className="text-primary" />
            <span>Sistem Layanan Kesehatan Jiwa DESDE-LTC</span>
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
            Direktori Layanan Kesehatan Jiwa & Manajemen Survei
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Platform komprehensif untuk mengelola direktori layanan kesehatan jiwa, melakukan survei,
            dan memantau kualitas layanan di seluruh Indonesia.
          </p>
          <div className="flex items-center justify-center gap-4 pt-4">
            <Button asChild size="lg" className="gap-2">
              <Link href="/dashboard">
                Mulai Sekarang
                <HugeiconsIcon icon={ArrowRight01Icon} size={20} />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/dashboard/help/user-guide">
                Pelajari Lebih Lanjut
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Partner Logo Slider */}
      <section className="container max-w-7xl mx-auto px-4 py-12">
        <div className="overflow-hidden">
          <div className="flex animate-scroll gap-16 items-center justify-center">
            {[...partnerLogos, ...partnerLogos].map((logo, index) => (
              <div
                key={index}
                className="flex-shrink-0 h-20 w-40 relative grayscale hover:grayscale-0 transition-all duration-300"
              >
                <Image
                  src={logo.src}
                  alt={logo.alt}
                  fill
                  className="object-contain"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Grid Fitur */}
      <section id="features" className="container max-w-7xl mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-3">Fitur Utama</h2>
          <p className="text-muted-foreground text-lg">
            Semua yang Anda butuhkan untuk mengelola layanan kesehatan jiwa secara efisien
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
          {/* Dasbor & Analitik */}
          <Card className="group relative overflow-hidden transition-all hover:shadow-lg hover:border-primary/50">
            <CardHeader>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 mb-4">
                <HugeiconsIcon icon={DashboardSquare01Icon} size={24} className="text-primary" />
              </div>
              <CardTitle className="text-lg">Dasbor & Wawasan</CardTitle>
              <CardDescription>
                Ikhtisar real-time dari indikator utama, distribusi layanan, dan pengajuan terbaru dengan analitik komprehensif.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="link" className="p-0 h-auto gap-1 text-sm font-medium">
                <Link href="/dashboard" className="inline-flex items-center hover:gap-2 transition-all">
                  Lihat Dasbor
                  <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Manajemen Layanan */}
          <Card className="group relative overflow-hidden transition-all hover:shadow-lg hover:border-primary/50">
            <CardHeader>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 mb-4">
                <HugeiconsIcon icon={Hospital01Icon} size={24} className="text-primary" />
              </div>
              <CardTitle className="text-lg">Direktori Layanan</CardTitle>
              <CardDescription>
                Kelola layanan kesehatan jiwa, kategori (BSIC), jenis perawatan utama (MTC), dan populasi sasaran.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="link" className="p-0 h-auto gap-1 text-sm font-medium">
                <Link href="/dashboard/services" className="inline-flex items-center hover:gap-2 transition-all">
                  Telusuri Layanan
                  <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Manajemen Survei */}
          <Card className="group relative overflow-hidden transition-all hover:shadow-lg hover:border-primary/50">
            <CardHeader>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 mb-4">
                <HugeiconsIcon icon={ClipboardIcon} size={24} className="text-primary" />
              </div>
              <CardTitle className="text-lg">Manajemen Survei</CardTitle>
              <CardDescription>
                Buat, kelola, dan analisis survei dengan kemampuan unggah massal dan log audit komprehensif.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="link" className="p-0 h-auto gap-1 text-sm font-medium">
                <Link href="/dashboard/survey" className="inline-flex items-center hover:gap-2 transition-all">
                  Kelola Survei
                  <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Verifikasi & QC */}
          <Card className="group relative overflow-hidden transition-all hover:shadow-lg hover:border-primary/50">
            <CardHeader>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 mb-4">
                <HugeiconsIcon icon={ShieldUserIcon} size={24} className="text-primary" />
              </div>
              <CardTitle className="text-lg">Verifikasi & Kontrol Kualitas</CardTitle>
              <CardDescription>
                Tinjau pengajuan, verifikasi detail layanan, validasi klasifikasi MTC, dan kelola bukti.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="link" className="p-0 h-auto gap-1 text-sm font-medium">
                <Link href="/dashboard/queue" className="inline-flex items-center hover:gap-2 transition-all">
                  Lihat Antrian
                  <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Peta & Geospasial */}
          <Card className="group relative overflow-hidden transition-all hover:shadow-lg hover:border-primary/50">
            <CardHeader>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 mb-4">
                <HugeiconsIcon icon={Location01Icon} size={24} className="text-primary" />
              </div>
              <CardTitle className="text-lg">Peta & Analisis Geospasial</CardTitle>
              <CardDescription>
                Visualisasikan lokasi layanan, analisis pola distribusi, dan bandingkan cakupan regional.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="link" className="p-0 h-auto gap-1 text-sm font-medium">
                <Link href="/dashboard/map" className="inline-flex items-center hover:gap-2 transition-all">
                  Lihat Peta
                  <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Laporan & Analitik */}
          <Card className="group relative overflow-hidden transition-all hover:shadow-lg hover:border-primary/50">
            <CardHeader>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 mb-4">
                <HugeiconsIcon icon={Analytics01Icon} size={24} className="text-primary" />
              </div>
              <CardTitle className="text-lg">Laporan & Analitik</CardTitle>
              <CardDescription>
                Buat laporan komprehensif tentang ketersediaan layanan, distribusi MTC, tenaga kerja, dan fasilitas.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="link" className="p-0 h-auto gap-1 text-sm font-medium">
                <Link href="/dashboard/indicators" className="inline-flex items-center hover:gap-2 transition-all">
                  Lihat Laporan
                  <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* DESDE-LTC Kebumen Section */}
      <section className="container max-w-7xl mx-auto px-4 py-20">
        <div className="grid gap-12 lg:grid-cols-2 items-center">
          {/* Stacked Images */}
          <div className="relative h-[400px] lg:h-[500px]">
            <div className="absolute top-0 left-0 w-72 h-52 rounded-xl overflow-hidden shadow-2xl border-4 border-background z-10">
              <Image
                src="/tim-mossholder-8R-mXppeakM-unsplash.jpg"
                alt="Layanan Kesehatan Jiwa"
                fill
                className="object-cover"
              />
            </div>
            <div className="absolute top-24 left-36 w-72 h-52 rounded-xl overflow-hidden shadow-2xl border-4 border-background z-20">
              <Image
                src="/priscilla-du-preez-aPa843frIzI-unsplash.jpg"
                alt="Kolaborasi Tim Kesehatan"
                fill
                className="object-cover"
              />
            </div>
            <div className="absolute bottom-0 left-12 w-72 h-52 rounded-xl overflow-hidden shadow-2xl border-4 border-background z-30">
              <Image
                src="/a-c-ROSZ6bxrhnk-unsplash.jpg"
                alt="Pendampingan Masyarakat"
                fill
                className="object-cover"
              />
            </div>
          </div>

          {/* Narrative Content */}
          <div className="space-y-6">
            <Badge variant="secondary" className="gap-2 px-4 py-1.5">
              <HugeiconsIcon icon={Location01Icon} size={16} className="text-primary" />
              <span>Kabupaten Kebumen</span>
            </Badge>
            <h2 className="text-3xl font-bold">
              Implementasi DESDE-LTC di Kabupaten Kebumen
            </h2>
            <div className="space-y-4 text-muted-foreground">
              <p>
                DESDE-LTC (Description and Evaluation of Services and DirectoriEs for Long-Term Care)
                adalah sistem klasifikasi internasional yang dikembangkan untuk memetakan dan mengevaluasi
                layanan kesehatan jangka panjang, termasuk layanan kesehatan jiwa.
              </p>
              <p>
                Kabupaten Kebumen menjadi salah satu daerah percontohan implementasi sistem DESDE-LTC
                di Indonesia. Melalui kolaborasi antara YAKKUM, Pemerintah Kabupaten Kebumen, BRIN,
                Kementerian Kesehatan, dan jaringan KONEKSI, pemetaan layanan kesehatan jiwa dilakukan
                secara komprehensif untuk mendukung perencanaan dan pengembangan layanan yang lebih baik.
              </p>
              <p>
                Atlas Keswa hadir sebagai platform digital yang memfasilitasi pengumpulan data,
                verifikasi informasi, dan visualisasi hasil pemetaan layanan kesehatan jiwa
                menggunakan standar DESDE-LTC.
              </p>
            </div>
            <Button asChild size="lg" className="gap-2">
              <Link href="/dashboard/help/user-guide">
                Pelajari DESDE-LTC
                <HugeiconsIcon icon={ArrowRight01Icon} size={20} />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="container max-w-7xl mx-auto px-4 py-20">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3">Pertanyaan yang Sering Diajukan</h2>
            <p className="text-muted-foreground text-lg">
              Temukan jawaban untuk pertanyaan umum tentang Atlas Keswa dan DESDE-LTC
            </p>
          </div>

          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger className="text-left">
                Apa itu DESDE-LTC?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                DESDE-LTC (Description and Evaluation of Services and DirectoriEs for Long-Term Care)
                adalah sistem klasifikasi internasional yang dikembangkan untuk memetakan dan mengevaluasi
                layanan kesehatan jangka panjang. Sistem ini menggunakan kode MTC (Main Type of Care) dan
                BSIC (Basic Service Identification Code) untuk mengklasifikasikan berbagai jenis layanan
                kesehatan jiwa secara standar dan terstruktur.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2">
              <AccordionTrigger className="text-left">
                Siapa yang dapat menggunakan Atlas Keswa?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Atlas Keswa dapat digunakan oleh berbagai pemangku kepentingan termasuk: petugas Dinas Kesehatan,
                pengelola fasilitas kesehatan jiwa, peneliti, pembuat kebijakan, dan enumerator lapangan.
                Setiap pengguna memiliki peran dan akses yang berbeda sesuai dengan kebutuhan dan tanggung jawabnya.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3">
              <AccordionTrigger className="text-left">
                Bagaimana cara mendaftar sebagai pengguna?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Untuk mendaftar sebagai pengguna Atlas Keswa, Anda perlu menghubungi administrator sistem
                melalui email di support@atlaskeswa.id. Tim kami akan memverifikasi identitas dan afiliasi
                Anda, kemudian memberikan akses sesuai dengan peran yang dibutuhkan.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4">
              <AccordionTrigger className="text-left">
                Apa saja jenis layanan yang dipetakan?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Atlas Keswa memetakan berbagai jenis layanan kesehatan jiwa berdasarkan klasifikasi DESDE-LTC,
                meliputi: layanan residensial (R), layanan harian (D), layanan rawat jalan (O), layanan
                aksesibilitas (A), layanan informasi (I), layanan kerja/pelatihan (W), dan layanan swadaya (S).
                Setiap kategori memiliki sub-klasifikasi yang lebih detail.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-5">
              <AccordionTrigger className="text-left">
                Bagaimana data dijaga kerahasiaannya?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Atlas Keswa menerapkan standar keamanan data yang ketat. Semua data dienkripsi, akses dibatasi
                berdasarkan peran pengguna, dan setiap aktivitas tercatat dalam log audit. Data pribadi pasien
                tidak dikumpulkan dalam sistem ini - hanya data tentang layanan dan fasilitas kesehatan jiwa.
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <div className="text-center mt-8">
            <Button asChild variant="outline" size="lg" className="gap-2">
              <Link href="/dashboard/help/faq">
                Lihat Semua FAQ
                <HugeiconsIcon icon={ArrowRight01Icon} size={20} />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/30 py-8">
        <div className="container max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="relative h-8 w-8">
                <Image
                  src="/logo.png"
                  alt="Logo Atlas Keswa"
                  fill
                  className="object-contain"
                />
              </div>
              <div>
                <div className="font-semibold">Atlas Keswa DESDE-LTC</div>
                <div className="text-xs text-muted-foreground">Sistem Layanan Kesehatan Jiwa</div>
              </div>
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link href="/dashboard/help/user-guide" className="hover:text-foreground transition-colors">
                Panduan Pengguna
              </Link>
              <Link href="/dashboard/help/faq" className="hover:text-foreground transition-colors">
                FAQ
              </Link>
              <Link href="/dashboard/help/support" className="hover:text-foreground transition-colors">
                Dukungan
              </Link>
            </div>
            <div className="text-sm text-muted-foreground">
              © 2025 Atlas Keswa. Hak cipta dilindungi.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
