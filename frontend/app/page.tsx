'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { KebumenMap, KATEGORI_COLOR, type KategoriFilter } from '@/components/kebumen-map';
import { PublicNav } from '@/components/public-nav';
import { PublicFooter } from '@/components/public-footer';
import { DevNotice } from '@/components/dev-notice';
import { PARTNER_LOGOS } from '@/lib/partners';
import { useServiceStats } from '@/hooks/use-services';
import { useSurveyMapPoints } from '@/hooks/use-survey-responses';
import { useSecondaryChoropleth } from '@/hooks/use-secondary';
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Hospital01Icon,
  Analytics01Icon,
  Location01Icon,
  ArrowRight01Icon,
  CheckmarkCircle02Icon,
  Alert02Icon,
  Cancel01Icon,
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

const KATEGORI_FILTERS: { value: KategoriFilter; label: string; color?: string }[] = [
  { value: 'Semua', label: 'Semua' },
  { value: 'FASKES', label: 'Faskes', color: KATEGORI_COLOR.FASKES },
  { value: 'NON FASKES', label: 'Non-faskes', color: KATEGORI_COLOR['NON FASKES'] },
];

/**
 * Marker filter in the map header. It replaces the old marker legend: the same
 * two colours are shown, and each swatch is now the control that isolates it.
 */
function KategoriFilterBar({
  value,
  onChange,
  counts,
}: {
  value: KategoriFilter;
  onChange: (value: KategoriFilter) => void;
  counts: Record<KategoriFilter, number>;
}) {
  return (
    <div
      role="group"
      aria-label="Saring titik pada peta"
      className="flex items-center gap-1 rounded-md border bg-background/85 backdrop-blur p-1"
    >
      {KATEGORI_FILTERS.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option.value)}
            className={`flex items-center gap-1.5 rounded px-2 py-1 text-xs transition-colors ${
              active ? 'bg-primary text-primary-foreground' : 'hover:bg-muted text-foreground/80'
            }`}
          >
            {option.color && (
              <span
                className="h-2.5 w-2.5 rounded-full border border-white"
                style={{ backgroundColor: option.color }}
              />
            )}
            <span>{option.label}</span>
            <span className="tabular-nums opacity-70">{counts[option.value]}</span>
          </button>
        );
      })}
    </div>
  );
}

type KecamatanReading = {
  name: string;
  rate: number | null;
  value: number | null;
  population: number | null;
  services: number;
};

function formatNumber(value: number | null, fractionDigits = 0) {
  if (value === null || !Number.isFinite(value)) return '—';
  return value.toLocaleString('id-ID', { maximumFractionDigits: fractionDigits });
}

/**
 * Right side of the map header: the kecamatan under the pointer, read off the
 * same choropleth the polygon is painted from. With nothing hovered it holds
 * the Kebumen-wide reading rather than going blank, so the panel never jumps
 * between two different heights.
 */
function KecamatanPanel({
  reading,
  indicator,
  source,
  kecamatanWithData,
  averageRate,
  onClear,
}: {
  reading: KecamatanReading | null;
  indicator: string | null;
  source: string | null;
  kecamatanWithData: number;
  averageRate: number | null;
  onClear: () => void;
}) {
  return (
    <div className="rounded-md border bg-background/85 backdrop-blur px-3 py-2 text-xs w-60">
      <div className="flex items-center gap-2">
        <HugeiconsIcon icon={Location01Icon} size={14} className="text-muted-foreground" />
        <span className="font-medium flex-1">
          {reading ? `Kec. ${reading.name}` : 'Kabupaten Kebumen'}
        </span>
        {reading && (
          <button
            type="button"
            onClick={onClear}
            aria-label="Hapus pilihan kecamatan"
            className="-mr-1 rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <HugeiconsIcon icon={Cancel01Icon} size={13} />
          </button>
        )}
      </div>
      <p className="text-muted-foreground mt-0.5">
        {reading
          ? 'Kabupaten Kebumen'
          : `${kecamatanWithData || 26} kecamatan · klik kecamatan pada peta`}
      </p>

      <div className="mt-2 pt-2 border-t space-y-1">
        <p className="leading-snug">{indicator ?? 'Gangguan jiwa (gabungan)'}</p>
        {reading ? (
          <dl className="space-y-0.5">
            <div className="flex items-baseline justify-between gap-2">
              <dt className="text-muted-foreground">Per 10.000</dt>
              <dd className="tabular-nums font-medium">{formatNumber(reading.rate, 1)}</dd>
            </div>
            <div className="flex items-baseline justify-between gap-2">
              <dt className="text-muted-foreground">Jumlah kasus</dt>
              <dd className="tabular-nums">{formatNumber(reading.value)}</dd>
            </div>
            <div className="flex items-baseline justify-between gap-2">
              <dt className="text-muted-foreground">Penduduk</dt>
              <dd className="tabular-nums">{formatNumber(reading.population)}</dd>
            </div>
            <div className="flex items-baseline justify-between gap-2">
              <dt className="text-muted-foreground">Layanan tersurvei</dt>
              <dd className="tabular-nums">{formatNumber(reading.services)}</dd>
            </div>
          </dl>
        ) : (
          <p className="text-muted-foreground tabular-nums">
            Rata-rata {formatNumber(averageRate, 1)} per 10.000 penduduk
          </p>
        )}
        {source && <p className="text-muted-foreground leading-snug pt-0.5">Sumber: {source}</p>}
      </div>

      <Link
        href={reading ? `/kecamatan/${encodeURIComponent(reading.name)}` : '/kecamatan'}
        className="mt-2 pt-2 border-t flex items-center gap-1 font-medium text-primary hover:underline"
      >
        {reading ? `Detail Kec. ${reading.name}` : 'Data selengkapnya'}
        <HugeiconsIcon icon={ArrowRight01Icon} size={12} />
      </Link>
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
  const isDesktop = useIsDesktop();
  const { data: serviceStats } = useServiceStats();
  const stats = serviceStats as ServiceStats | undefined;
  const [kategori, setKategori] = useState<KategoriFilter>('Semua');

  // Same query key as the map's own, so counting the points here costs nothing.
  const { data: mapPoints } = useSurveyMapPoints();
  const counts = useMemo(() => {
    const points = mapPoints ?? [];
    return {
      Semua: points.length,
      FASKES: points.filter((point) => point.kategori === 'FASKES').length,
      'NON FASKES': points.filter((point) => point.kategori === 'NON FASKES').length,
    } as Record<KategoriFilter, number>;
  }, [mapPoints]);

  // The kecamatan clicked on the map, read back from the same layer the
  // polygons are painted from. Clicked rather than hovered: the reading has to
  // stay put while it is being read.
  const [selectedKecamatan, setSelectedKecamatan] = useState<string | null>(null);
  const handleSelectKecamatan = useCallback((name: string | null) => {
    setSelectedKecamatan(name);
  }, []);
  const clearKecamatan = useCallback(() => setSelectedKecamatan(null), []);

  const { data: choropleth } = useSecondaryChoropleth();
  const highlight = useMemo(() => {
    const series = choropleth?.series ?? [];
    const rates = series
      .map((row) => row.per_10k)
      .filter((rate): rate is number => rate !== null);
    return {
      indicator: choropleth?.dataset?.name ?? null,
      source: choropleth?.dataset?.source || null,
      kecamatanWithData: rates.length,
      averageRate: rates.length
        ? rates.reduce((sum, rate) => sum + rate, 0) / rates.length
        : null,
    };
  }, [choropleth]);

  const reading = useMemo<KecamatanReading | null>(() => {
    if (!selectedKecamatan) return null;
    const key = selectedKecamatan.trim().toLowerCase();
    const row = (choropleth?.series ?? []).find(
      (entry) => entry.kecamatan.trim().toLowerCase() === key
    );
    // DRF serializes the decimal columns as strings.
    const toNumber = (value: string | null | undefined) => {
      const parsed = Number(value);
      return value !== null && value !== undefined && Number.isFinite(parsed) ? parsed : null;
    };
    return {
      name: selectedKecamatan,
      rate: row?.per_10k ?? null,
      value: toNumber(row?.value),
      population: toNumber(row?.population),
      services: (mapPoints ?? []).filter(
        (point) => (point.kecamatan ?? '').trim().toLowerCase() === key
      ).length,
    };
  }, [selectedKecamatan, choropleth, mapPoints]);

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
            choropleth
            kategoriFilter={kategori}
            onSelectKecamatan={handleSelectKecamatan}
            selectedKecamatan={selectedKecamatan}
          />

          {/* Map header: title and marker filter left, highlighted area right */}
          <div className="absolute inset-x-0 top-0 z-10 pointer-events-none">
            <div className="flex items-start justify-between gap-3 p-4 lg:p-6">
              <div className="flex flex-col gap-2 pointer-events-auto">
                <div className="flex items-center gap-2 self-start rounded-md border bg-background/85 backdrop-blur px-3 py-1.5">
                  <HugeiconsIcon icon={Location01Icon} size={14} className="text-muted-foreground" />
                  {/* The hovered kecamatan rides above the pointer on the map
                      itself, so this chip stays put as the map's title. */}
                  <span className="text-xs">Kabupaten Kebumen, Jawa Tengah</span>
                </div>
                <KategoriFilterBar value={kategori} onChange={setKategori} counts={counts} />
              </div>

              <div className="pointer-events-auto hidden sm:block">
                <KecamatanPanel
                  reading={reading}
                  indicator={highlight.indicator}
                  source={highlight.source}
                  kecamatanWithData={highlight.kecamatanWithData}
                  averageRate={highlight.averageRate}
                  onClear={clearKecamatan}
                />
              </div>
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
                    Atlas layanan kesehatan jiwa Indonesia
                  </h2>
                  <div className="flex items-center gap-3 pt-2">
                    <Button asChild className="gap-2">
                      <Link href="/tentang-kami">
                        Pelajari lebih lanjut
                        <HugeiconsIcon icon={ArrowRight01Icon} size={18} />
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Charts as their own section below the map, not pinned over it */}
      <section className="border-b">
        <div className="container max-w-7xl mx-auto px-4 lg:px-6 py-8 lg:py-10">
          <div className="grid gap-4 lg:gap-6 sm:grid-cols-2">
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
              sizes="(min-width: 1024px) 600px, 100vw"
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
