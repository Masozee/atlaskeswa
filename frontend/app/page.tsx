'use client';

import { useState } from 'react';
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { KebumenMap, FACILITY_TYPES, SERVICE_TYPES, KEBUMEN_KECAMATAN } from '@/components/kebumen-map';
import { HugeiconsIcon } from "@hugeicons/react"
import {DashboardSquare01Icon,
  Hospital01Icon,
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
  { src: '/atmajaya.png', alt: 'Atma Jaya' },
];

export default function HomePage() {
  // Filter states
  const [facilityFilter, setFacilityFilter] = useState("Semua");
  const [serviceFilter, setServiceFilter] = useState("Semua");
  const [kecamatanFilter, setKecamatanFilter] = useState("Semua");
  const [hoveredKecamatan, setHoveredKecamatan] = useState<string | null>(null);

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
              <Link href="/login">
                Masuk
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
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
            Pemetaan Layanan Kesehatan Jiwa Indonesia
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Atlas Keswa adalah sistem informasi berbasis DESDE-LTC untuk memetakan, mengklasifikasi,
            dan memvisualisasikan layanan kesehatan jiwa (keswa) di Indonesia secara komprehensif
            guna mendukung perencanaan dan pengembangan layanan yang lebih baik.
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

      {/* Map & Stats Section */}
      <section className="bg-muted/30 py-20">
        <div className="container max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3">Peta Layanan Kesehatan Jiwa</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Visualisasi sebaran fasilitas kesehatan jiwa di Kabupaten Kebumen berdasarkan hasil pemetaan DESDE-LTC
            </p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Filter Panel - 2 columns */}
          <div className="lg:col-span-2">
            <Card className="h-full">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Filter</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Facility Type Filter */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-muted-foreground">Fasilitas</Label>
                  <RadioGroup value={facilityFilter} onValueChange={setFacilityFilter} className="space-y-1">
                    {FACILITY_TYPES.map((type) => (
                      <div key={type} className="flex items-center space-x-2">
                        <RadioGroupItem value={type} id={`facility-${type}`} className="h-3 w-3" />
                        <Label htmlFor={`facility-${type}`} className="text-xs font-normal cursor-pointer">
                          {type}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                {/* Service Type Filter */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-muted-foreground">Jenis Layanan</Label>
                  <RadioGroup value={serviceFilter} onValueChange={setServiceFilter} className="space-y-1">
                    {SERVICE_TYPES.slice(0, 6).map((type) => (
                      <div key={type} className="flex items-center space-x-2">
                        <RadioGroupItem value={type} id={`service-${type}`} className="h-3 w-3" />
                        <Label htmlFor={`service-${type}`} className="text-xs font-normal cursor-pointer">
                          {type}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                {/* Kecamatan Filter */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-muted-foreground">Kecamatan</Label>
                  <RadioGroup value={kecamatanFilter} onValueChange={setKecamatanFilter} className="space-y-1 max-h-32 overflow-y-auto">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Semua" id="kecamatan-all" className="h-3 w-3" />
                      <Label htmlFor="kecamatan-all" className="text-xs font-normal cursor-pointer">
                        Semua
                      </Label>
                    </div>
                    {KEBUMEN_KECAMATAN.slice(0, 10).map((kec) => (
                      <div key={kec} className="flex items-center space-x-2">
                        <RadioGroupItem value={kec} id={`kecamatan-${kec}`} className="h-3 w-3" />
                        <Label htmlFor={`kecamatan-${kec}`} className="text-xs font-normal cursor-pointer">
                          {kec}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Map - 7 columns */}
          <div className="lg:col-span-7">
            <div className="relative rounded-xl overflow-hidden border h-full min-h-[450px]">
              <KebumenMap
                height="h-full"
                showControls
                facilityFilter={facilityFilter}
                serviceFilter={serviceFilter}
                kecamatanFilter={kecamatanFilter}
                onHoverKecamatan={setHoveredKecamatan}
              />
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background/90 to-transparent">
                <Badge variant="secondary" className="gap-2 px-3 py-1 bg-background/80 backdrop-blur">
                  <HugeiconsIcon icon={Location01Icon} size={14} className="text-primary" />
                  <span className="text-xs">
                    {hoveredKecamatan
                      ? `Kecamatan ${hoveredKecamatan}, Kebumen`
                      : "Kabupaten Kebumen, Jawa Tengah"}
                  </span>
                </Badge>
              </div>
            </div>
          </div>

          {/* Stats - 3 columns */}
          <div className="lg:col-span-3 flex flex-col gap-4">
            {/* Pie Chart Card */}
            <Card className="flex-1">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Distribusi Layanan</CardTitle>
                <CardDescription className="text-xs">Berdasarkan jenis layanan</CardDescription>
              </CardHeader>
              <CardContent className="pb-4">
                <div className="h-[180px] flex items-center justify-center">
                  <div className="relative">
                    <svg viewBox="0 0 100 100" className="w-36 h-36 -rotate-90">
                      {/* Background circle */}
                      <circle cx="50" cy="50" r="40" fill="none" stroke="hsl(var(--muted))" strokeWidth="12" />
                      {/* Puskesmas - 14 of 48 = 29% */}
                      <circle
                        cx="50" cy="50" r="40"
                        fill="none"
                        stroke="#00979D"
                        strokeWidth="12"
                        strokeDasharray="73.3 251.33"
                        strokeDashoffset="0"
                        strokeLinecap="round"
                      />
                      {/* RSU - 10 of 48 = 21% */}
                      <circle
                        cx="50" cy="50" r="40"
                        fill="none"
                        stroke="#4DB6AC"
                        strokeWidth="12"
                        strokeDasharray="52.4 251.33"
                        strokeDashoffset="-73.3"
                        strokeLinecap="round"
                      />
                      {/* Klinik - 7 of 48 = 15% */}
                      <circle
                        cx="50" cy="50" r="40"
                        fill="none"
                        stroke="#FFBF47"
                        strokeWidth="12"
                        strokeDasharray="36.7 251.33"
                        strokeDashoffset="-125.7"
                        strokeLinecap="round"
                      />
                      {/* Lainnya - 17 of 48 = 35% */}
                      <circle
                        cx="50" cy="50" r="40"
                        fill="none"
                        stroke="#9575CD"
                        strokeWidth="12"
                        strokeDasharray="88.97 251.33"
                        strokeDashoffset="-162.4"
                        strokeLinecap="round"
                      />
                    </svg>
                    {/* Center text */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-2xl font-bold">48</span>
                      <span className="text-[10px] text-muted-foreground">Total</span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#00979D]" />
                    <span className="text-muted-foreground">Puskesmas: 14 (29%)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#4DB6AC]" />
                    <span className="text-muted-foreground">RSU: 10 (21%)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#FFBF47]" />
                    <span className="text-muted-foreground">Klinik: 7 (15%)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#9575CD]" />
                    <span className="text-muted-foreground">Lainnya: 17 (35%)</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Stats Card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Fasilitas Kesehatan Jiwa</CardTitle>
                <CardDescription className="text-xs">Data Kabupaten Kebumen</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <HugeiconsIcon icon={Hospital01Icon} size={16} className="text-primary" />
                    </div>
                    <span className="text-sm">Total Fasilitas</span>
                  </div>
                  <span className="text-xl font-bold">48</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-[#4DB6AC]/10 flex items-center justify-center">
                      <HugeiconsIcon icon={CheckmarkCircle02Icon} size={16} className="text-[#4DB6AC]" />
                    </div>
                    <span className="text-sm">Terverifikasi</span>
                  </div>
                  <span className="text-xl font-bold">42</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-[#FFBF47]/10 flex items-center justify-center">
                      <HugeiconsIcon icon={Hospital01Icon} size={16} className="text-[#FFBF47]" />
                    </div>
                    <span className="text-sm">Jenis Layanan</span>
                  </div>
                  <span className="text-xl font-bold">7</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-[#9575CD]/10 flex items-center justify-center">
                      <HugeiconsIcon icon={Location01Icon} size={16} className="text-[#9575CD]" />
                    </div>
                    <span className="text-sm">Kecamatan</span>
                  </div>
                  <span className="text-xl font-bold">26</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
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

      {/* Publications Section */}
      <section className="bg-muted/30 py-20">
        <div className="container max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-3">Publikasi & Referensi</h2>
          <p className="text-muted-foreground text-lg">
            Jurnal dan artikel ilmiah terkait kesehatan jiwa dan sistem DESDE-LTC
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
          {/* Publication 1 */}
          <Card className="group hover:shadow-lg transition-all">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <Badge variant="secondary" className="text-[10px]">Jurnal</Badge>
                <span className="text-xs text-muted-foreground">2024</span>
              </div>
              <CardTitle className="text-base leading-tight mt-2">
                Mental Health Atlas 2020: WHO Global Report on Mental Health Services
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground line-clamp-3">
                Laporan komprehensif WHO tentang status layanan kesehatan jiwa global, termasuk ketersediaan sumber daya dan kebijakan di berbagai negara.
              </p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>World Health Organization</span>
              </div>
              <Button asChild variant="outline" size="sm" className="w-full gap-2">
                <Link href="https://www.who.int/publications/i/item/9789240036703" target="_blank">
                  Baca Selengkapnya
                  <HugeiconsIcon icon={ArrowRight01Icon} size={14} />
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Publication 2 */}
          <Card className="group hover:shadow-lg transition-all">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <Badge variant="secondary" className="text-[10px]">Artikel</Badge>
                <span className="text-xs text-muted-foreground">2023</span>
              </div>
              <CardTitle className="text-base leading-tight mt-2">
                DESDE-LTC: A Standardized Tool for Mental Health Service Mapping
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground line-clamp-3">
                Penjelasan lengkap tentang metodologi DESDE-LTC dan penerapannya dalam pemetaan layanan kesehatan jiwa di berbagai negara Eropa.
              </p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>European Journal of Psychiatry</span>
              </div>
              <Button asChild variant="outline" size="sm" className="w-full gap-2">
                <Link href="https://pubmed.ncbi.nlm.nih.gov/" target="_blank">
                  Baca Selengkapnya
                  <HugeiconsIcon icon={ArrowRight01Icon} size={14} />
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Publication 3 */}
          <Card className="group hover:shadow-lg transition-all">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <Badge variant="secondary" className="text-[10px]">Laporan</Badge>
                <span className="text-xs text-muted-foreground">2023</span>
              </div>
              <CardTitle className="text-base leading-tight mt-2">
                Situasi Kesehatan Jiwa di Indonesia: Data dan Tantangan
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground line-clamp-3">
                Analisis situasi kesehatan jiwa di Indonesia berdasarkan data Riskesdas dan tantangan dalam penyediaan layanan kesehatan jiwa.
              </p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>Kementerian Kesehatan RI</span>
              </div>
              <Button asChild variant="outline" size="sm" className="w-full gap-2">
                <Link href="https://www.kemkes.go.id" target="_blank">
                  Baca Selengkapnya
                  <HugeiconsIcon icon={ArrowRight01Icon} size={14} />
                </Link>
              </Button>
            </CardContent>
          </Card>

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
