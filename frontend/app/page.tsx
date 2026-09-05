'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { KebumenMap } from '@/components/kebumen-map';
import { PublicNav } from '@/components/public-nav';
import { PublicFooter } from '@/components/public-footer';
import { DevNotice } from '@/components/dev-notice';
import { PARTNER_LOGOS } from '@/lib/partners';
import { useServiceStats } from '@/hooks/use-services';
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Hospital01Icon,
  Analytics01Icon,
  Location01Icon,
  ArrowRight01Icon,
  CheckmarkCircle02Icon,
  Alert02Icon,
} from "@hugeicons/core-free-icons";

// Shape of GET /directory/services/stats/ (fields used here)
type ServiceStats = {
  total_services: number;
  verified_services: number;
  unverified_services: number;
  type_distribution: { service_type__name: string | null; count: number }[];
};

const CHART_COLORS = ['#07579E', '#4DB6AC', '#FFBF47', '#9575CD'];
const DONUT_CIRCUMFERENCE = 251.33; // 2 * PI * r, r=40

function typeLabel(name: string | null) {
  if (!name) return 'Tidak diketahui';
  if (name === 'To Be Determined') return 'Belum ditentukan';
  return name;
}

function buildDonutSegments(distribution: ServiceStats['type_distribution']) {
  const total = distribution.reduce((sum, d) => sum + d.count, 0);
  const top = distribution.slice(0, 3).map((d) => ({ label: typeLabel(d.service_type__name), count: d.count }));
  const restCount = distribution.slice(3).reduce((sum, d) => sum + d.count, 0);
  const items = restCount > 0 ? [...top, { label: 'Lainnya', count: restCount }] : top;

  let acc = 0;
  const segments = items.map((item, i) => {
    const dash = total > 0 ? (item.count / total) * DONUT_CIRCUMFERENCE : 0;
    const segment = {
      ...item,
      color: CHART_COLORS[i % CHART_COLORS.length],
      dash,
      offset: -acc,
      pct: total > 0 ? Math.round((item.count / total) * 100) : 0,
    };
    acc += dash;
    return segment;
  });
  return { total, segments };
}

const publications = [
  {
    type: 'Jurnal',
    year: '2024',
    publisher: 'World Health Organization',
    title: 'Mental Health Atlas 2020: WHO Global Report on Mental Health Services',
    description:
      'Laporan komprehensif WHO tentang status layanan kesehatan jiwa global, termasuk ketersediaan sumber daya dan kebijakan di berbagai negara.',
    href: 'https://www.who.int/publications/i/item/9789240036703',
  },
  {
    type: 'Artikel',
    year: '2023',
    publisher: 'European Journal of Psychiatry',
    title: 'DESDE-LTC: A Standardized Tool for Mental Health Service Mapping',
    description:
      'Penjelasan lengkap tentang metodologi DESDE-LTC dan penerapannya dalam pemetaan layanan kesehatan jiwa di berbagai negara Eropa.',
    href: 'https://pubmed.ncbi.nlm.nih.gov/',
  },
  {
    type: 'Laporan',
    year: '2023',
    publisher: 'Kementerian Kesehatan RI',
    title: 'Situasi Kesehatan Jiwa di Indonesia: Data dan Tantangan',
    description:
      'Analisis situasi kesehatan jiwa di Indonesia berdasarkan data Riskesdas dan tantangan dalam penyediaan layanan kesehatan jiwa.',
    href: 'https://www.kemkes.go.id',
  },
];

// Desktop hero view: Kebumen shifted into the free strip between the overlay
// columns (copy/filters left, charts right); wide bounds so the camera is not
// clamp-fitted onto the polygon.
const HERO_MAP_CENTER: [number, number] = [109.61, -7.72];
const HERO_MAP_BOUNDS: [[number, number], [number, number]] = [
  [108.5, -8.4],
  [110.8, -6.9],
];

// Overlays render at lg (1024px); the map camera must follow the same breakpoint.
function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia('(min-width: 1024px)');
    const onChange = () => setIsDesktop(mql.matches);
    mql.addEventListener('change', onChange);
    setIsDesktop(mql.matches);
    return () => mql.removeEventListener('change', onChange);
  }, []);
  return isDesktop;
}

function PanelSkeleton() {
  return (
    <div className="space-y-2 animate-pulse py-1" aria-hidden>
      <div className="h-3 w-3/4 rounded bg-muted" />
      <div className="h-3 w-1/2 rounded bg-muted" />
      <div className="h-3 w-2/3 rounded bg-muted" />
    </div>
  );
}

function DistributionPanel({ stats, className }: { stats?: ServiceStats; className?: string }) {
  const donut = stats ? buildDonutSegments(stats.type_distribution) : null;

  return (
    <div className={`rounded-lg border bg-background/90 backdrop-blur p-4 ${className ?? ''}`}>
      <h3 className="text-sm font-medium">Distribusi layanan</h3>
      <p className="text-xs text-muted-foreground mt-0.5">Berdasarkan jenis layanan</p>
      {!donut ? (
        <div className="mt-3"><PanelSkeleton /></div>
      ) : (
        <div className="flex items-center gap-4 mt-3">
          <div className="relative flex-shrink-0">
            <svg viewBox="0 0 100 100" className="w-24 h-24 -rotate-90">
              {donut.segments.map((seg) => (
                <circle
                  key={seg.label}
                  cx="50" cy="50" r="40"
                  fill="none"
                  stroke={seg.color}
                  strokeWidth="12"
                  strokeDasharray={`${seg.dash} ${DONUT_CIRCUMFERENCE}`}
                  strokeDashoffset={seg.offset}
                />
              ))}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-lg font-semibold leading-none">{donut.total}</span>
              <span className="text-[10px] text-muted-foreground">Total</span>
            </div>
          </div>
          <div className="space-y-1.5 text-xs min-w-0">
            {donut.segments.map((seg) => (
              <div key={seg.label} className="flex items-center gap-2">
                <div
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: seg.color }}
                />
                <span className="text-muted-foreground leading-tight">
                  {seg.label}: {seg.count} ({seg.pct}%)
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatsPanel({ stats, className }: { stats?: ServiceStats; className?: string }) {
  const rows = stats
    ? [
        { icon: Hospital01Icon, label: 'Total fasilitas', value: stats.total_services },
        { icon: CheckmarkCircle02Icon, label: 'Terverifikasi', value: stats.verified_services },
        { icon: Alert02Icon, label: 'Belum terverifikasi', value: stats.unverified_services },
        { icon: Analytics01Icon, label: 'Jenis layanan', value: stats.type_distribution.length },
      ]
    : null;

  return (
    <div className={`rounded-lg border bg-background/90 backdrop-blur p-4 ${className ?? ''}`}>
      <h3 className="text-sm font-medium">Fasilitas kesehatan jiwa</h3>
      <p className="text-xs text-muted-foreground mt-0.5 mb-3">Data Kabupaten Kebumen</p>
      {!rows ? (
        <PanelSkeleton />
      ) : (
        <div className="space-y-2.5">
          {rows.map((stat) => (
            <div key={stat.label} className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <HugeiconsIcon icon={stat.icon} size={15} className="text-muted-foreground" />
                <span className="text-sm">{stat.label}</span>
              </div>
              <span className="text-lg font-semibold tabular-nums leading-none">{stat.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function HomePage() {
  const [hoveredKecamatan, setHoveredKecamatan] = useState<string | null>(null);
  const isDesktop = useIsDesktop();
  const { data: serviceStats } = useServiceStats();
  const stats = serviceStats as ServiceStats | undefined;

  return (
    <div className="font-geist min-h-screen bg-background">
      <DevNotice />

      <PublicNav brandAsHeading />

      {/* Hero: full-bleed map with overlaid copy and charts */}
      <section className="relative border-b">
        <div className="relative h-[65vh] min-h-[520px] lg:h-[80vh] lg:min-h-[640px]">
          <KebumenMap
            key={isDesktop ? 'hero-map-desktop' : 'hero-map-mobile'}
            height="h-full"
            showControls
            center={isDesktop ? HERO_MAP_CENTER : undefined}
            maxBounds={isDesktop ? HERO_MAP_BOUNDS : undefined}
            cooperativeGestures
            showLegend
            onHoverKecamatan={setHoveredKecamatan}
          />

          {/* Location indicator */}
          <div className="absolute top-4 left-4 lg:top-6 lg:left-1/2 lg:-translate-x-1/2">
            <div className="flex items-center gap-2 rounded-md border bg-background/85 backdrop-blur px-3 py-1.5">
              <HugeiconsIcon icon={Location01Icon} size={14} className="text-muted-foreground" />
              <span className="text-xs">
                {hoveredKecamatan
                  ? `Kecamatan ${hoveredKecamatan}, Kebumen`
                  : "Kabupaten Kebumen, Jawa Tengah"}
              </span>
            </div>
          </div>

          {/* Bottom scrim + hero copy: neutral dark gradient keeps the white title legible over map tiles */}
          <div className="absolute inset-x-0 bottom-0 pointer-events-none">
            <div className="bg-gradient-to-t from-black/70 via-black/35 to-transparent pt-28 pb-8 lg:pb-10">
              <div className="container max-w-7xl mx-auto px-4 lg:px-6">
                <div className="max-w-2xl space-y-3 pointer-events-auto">
                  <p className="text-sm font-medium text-white/80">
                    Sistem layanan kesehatan jiwa berbasis DESDE-LTC
                  </p>
                  <h2 className="text-3xl lg:text-5xl font-semibold tracking-tight leading-[1.1] text-white">
                    Pemetaan layanan kesehatan jiwa Indonesia
                  </h2>
                  <div className="flex items-center gap-3 pt-2">
                    <Button asChild className="gap-2">
                      <Link href="/dashboard">
                        Mulai sekarang
                        <HugeiconsIcon icon={ArrowRight01Icon} size={18} />
                      </Link>
                    </Button>
                    <Button asChild variant="outline">
                      <Link href="/dashboard/help/user-guide">
                        Pelajari lebih lanjut
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Desktop overlays — charts pinned to the empty corner outside the Kebumen polygon */}
          <div className="absolute inset-0 pointer-events-none hidden lg:block">
            <div className="absolute bottom-6 right-6 w-80 space-y-3 pointer-events-auto">
              <DistributionPanel stats={stats} />
              <StatsPanel stats={stats} />
            </div>
          </div>
        </div>

        {/* Mobile: charts below the map */}
        <div className="lg:hidden container max-w-7xl mx-auto px-4 py-8">
          <div className="grid gap-6 sm:grid-cols-2">
            <DistributionPanel stats={stats} />
            <StatsPanel stats={stats} />
          </div>
        </div>
      </section>

      {/* DESDE-LTC Kebumen Section */}
      <section className="container max-w-7xl mx-auto px-4 py-24">
        <div className="grid gap-12 lg:grid-cols-2 items-center">
          {/* Dominant image */}
          <div className="relative aspect-[4/3] rounded-lg overflow-hidden">
            <Image
              src="/priscilla-du-preez-aPa843frIzI-unsplash.jpg"
              alt="Kolaborasi Tim Kesehatan"
              fill
              className="object-cover"
            />
          </div>

          {/* Narrative Content */}
          <div className="space-y-6">
            <p className="text-sm font-medium text-muted-foreground">Kabupaten Kebumen</p>
            <h2 className="text-3xl font-semibold tracking-tight">
              Implementasi DESDE-LTC di Kabupaten Kebumen
            </h2>
            <div className="space-y-4 text-muted-foreground leading-relaxed">
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
      <section className="bg-muted/30 py-24">
        <div className="container max-w-7xl mx-auto px-4">
          <div className="max-w-2xl mb-10">
            <h2 className="text-3xl font-semibold tracking-tight mb-3">Publikasi & referensi</h2>
            <p className="text-muted-foreground text-lg">
              Jurnal dan artikel ilmiah terkait kesehatan jiwa dan sistem DESDE-LTC
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {publications.map((pub) => (
              <article
                key={pub.title}
                className="flex flex-col rounded-md border border-border/60 bg-background p-5 transition-colors hover:border-border"
              >
                <p className="text-xs text-muted-foreground mb-2">
                  {pub.type} · {pub.year} · {pub.publisher}
                </p>
                <h3 className="text-base font-medium leading-snug mb-1.5">
                  {pub.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                  {pub.description}
                </p>
                <Link
                  href={pub.href}
                  target="_blank"
                  className="mt-auto inline-flex items-center gap-1.5 text-sm font-medium hover:underline underline-offset-4"
                >
                  Baca selengkapnya
                  <HugeiconsIcon icon={ArrowRight01Icon} size={14} />
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Partner Logos — infinite carousel */}
      <section className="py-20 overflow-hidden">
        <div className="container max-w-7xl mx-auto px-4">
          <p className="text-center text-lg font-semibold mb-10">Didukung oleh</p>
        </div>
        {/* Edge fade so logos enter/leave without a hard cut */}
        <div className="relative [mask-image:linear-gradient(to_right,transparent,black_6rem,black_calc(100%-6rem),transparent)]">
          <div className="flex w-max animate-marquee items-center">
            {/* Two copies: the track scrolls exactly one copy's width, then loops */}
            {[0, 1].map((copy) => (
              <div key={copy} className="flex shrink-0 items-center gap-x-14 pr-14">
                {PARTNER_LOGOS.map((logo) => (
                  <div
                    key={logo.src}
                    aria-hidden={copy === 1}
                    className="relative h-14 w-32 shrink-0 grayscale opacity-70 hover:grayscale-0 hover:opacity-100 transition-all duration-300"
                  >
                    <Image
                      src={logo.src}
                      alt={copy === 1 ? '' : logo.alt}
                      fill
                      sizes="128px"
                      className="object-contain"
                    />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="container max-w-7xl mx-auto px-4 py-24">
        <div className="grid gap-12 lg:grid-cols-[1fr_minmax(0,26rem)] lg:items-start">
          <div>
            <div className="mb-10">
              <h2 className="text-3xl font-semibold tracking-tight mb-3">Pertanyaan yang sering diajukan</h2>
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

            <div className="mt-8">
              <Button asChild variant="outline" size="lg" className="gap-2">
                <Link href="/dashboard/help/faq">
                  Lihat semua FAQ
                  <HugeiconsIcon icon={ArrowRight01Icon} size={20} />
                </Link>
              </Button>
            </div>
          </div>

          {/* Sticky companion image — stays in view while the accordion grows */}
          <div className="relative hidden lg:block lg:sticky lg:top-24 aspect-[4/5] rounded-md overflow-hidden">
            <Image
              src="/tim-mossholder-8R-mXppeakM-unsplash.jpg"
              alt="Balon senyum kuning"
              fill
              sizes="(min-width: 1024px) 26rem, 100vw"
              className="object-cover"
            />
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
