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
import { KebumenMap, desdeBranch } from '@/components/kebumen-map';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PublicNav } from '@/components/public-nav';
import { PublicFooter } from '@/components/public-footer';
import { DevNotice } from '@/components/dev-notice';
import { PARTNER_LOGOS } from '@/lib/partners';
import { toSentenceCase } from '@/lib/utils/text';
import {
  FACILITY_TYPES,
  FACILITY_OTHER,
  facilityIndex,
  facilityLabels,
} from '@/lib/facility-types';
import { useSurveyMapPoints, type SurveyMapPoint } from '@/hooks/use-survey-responses';
import { useSecondaryChoropleth } from '@/hooks/use-secondary';
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Location01Icon,
  ArrowRight01Icon,
  Cancel01Icon,
} from "@hugeicons/core-free-icons";

const DONUT_CIRCUMFERENCE = 251.33; // 2 * PI * r, r=40

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

const ALL_LAYANAN = 'Semua';
const UNCLASSIFIED_COLOR = '#9CA3AF';

/**
 * Marker filter in the map header: one DESDE-LTC service type at a time, the
 * same five groups the "Jenis layanan" panel counts. The markers take the
 * chosen type's colour (or, unfiltered, a wedge per type they offer), so the
 * swatches here and in the panel are their key.
 */
function LayananFilter({
  value,
  onChange,
  counts,
}: {
  value: string;
  onChange: (value: string) => void;
  counts: Record<string, number>;
}) {
  return (
    // No taller than the button bar it replaced: the map pins its choropleth
    // legend just below this header at a fixed offset.
    <div className="self-start rounded-md border bg-background/85 backdrop-blur p-1">
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger
          aria-label="Saring titik menurut jenis layanan"
          className="w-52 !h-7 rounded-sm shadow-none bg-background text-xs"
        >
          <SelectValue placeholder="Jenis layanan" />
        </SelectTrigger>
        <SelectContent position="popper" className="w-[var(--radix-select-trigger-width)] rounded-sm">
          {[{ label: ALL_LAYANAN, color: undefined }, ...SERVICE_GROUPS].map((option) => (
            <SelectItem key={option.label} value={option.label} className="text-xs">
              {option.color && (
                <span className="h-2 w-2 rounded-[2px]" style={{ backgroundColor: option.color }} aria-hidden />
              )}
              <span>{option.label === ALL_LAYANAN ? 'Semua jenis layanan' : option.label}</span>
              <span className="tabular-nums text-muted-foreground">{counts[option.label] ?? 0}</span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
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
    <div className="rounded-md border bg-background/85 backdrop-blur px-3 py-2 text-xs h-full">
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
          // The wide cell of the bento, so the four readings sit side by side
          // as figures rather than stacking into a list.
          <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5 lg:grid-cols-4">
            {[
              { label: 'Per 10.000', value: formatNumber(reading.rate, 1) },
              { label: 'Jumlah kasus', value: formatNumber(reading.value) },
              { label: 'Penduduk', value: formatNumber(reading.population) },
              { label: 'Layanan', value: formatNumber(reading.services) },
            ].map((figure) => (
              <div key={figure.label}>
                <dt className="text-[10px] text-muted-foreground leading-tight">{figure.label}</dt>
                <dd className="text-sm font-semibold tabular-nums leading-tight mt-0.5">
                  {figure.value}
                </dd>
              </div>
            ))}
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

/**
 * QL1 and QL2 as the five DESDE-LTC branches they classify into. The main
 * branch (R) and its social counterpart (SR) are one line: a reader asking
 * "how many places take people overnight" does not care which of the two.
 */
const SERVICE_GROUPS: { label: string; branches: string[]; color: string }[] = [
  { label: 'Rawat inap', branches: ['R', 'SR'], color: '#07579E' },
  { label: 'Perawatan harian', branches: ['D', 'SD'], color: '#4DB6AC' },
  { label: 'Rawat jalan', branches: ['O', 'SO'], color: '#FFBF47' },
  { label: 'Aksesibilitas', branches: ['A', 'SA'], color: '#9575CD' },
  { label: 'Informasi', branches: ['I', 'SI'], color: '#00979D' },
];

/** Whether any of a survey's DESDE-LTC entries classifies under one of `branches`. */
function offersAny(entries: string[] | null, branches: string[]) {
  return (entries ?? []).some((entry) => branches.includes(desdeBranch(entry)));
}


type CountRow = { label: string; count: number; color?: string };

/**
 * The same breakdown as a ring. A facility is classified under several
 * branches at once, so the slices are shares of the counted classifications,
 * not of the facilities — the centre carries the count they add up to.
 */
function breakdownSegments(rows: CountRow[], total: number) {
  let acc = 0;
  return rows.map((row) => {
    const dash = (row.count / total) * DONUT_CIRCUMFERENCE;
    const segment = { ...row, dash, offset: -acc };
    acc += dash;
    return segment;
  });
}

/**
 * Slices are services, so they can add up past the facility count: one
 * facility offering three types is in three slices. The centre therefore
 * counts facilities, the thing the map is plotting.
 */
function BreakdownDonut({
  rows,
  facilities,
  highlight,
}: {
  rows: CountRow[];
  facilities: number;
  highlight: string | null;
}) {
  const total = rows.reduce((sum, row) => sum + row.count, 0);
  if (total === 0) return null;
  const segments = breakdownSegments(rows, total);

  return (
    <div className="relative mx-auto my-2 w-28">
      <svg viewBox="0 0 100 100" className="w-28 h-28 -rotate-90">
        {segments.map((segment) => (
          <circle
            key={segment.label}
            cx="50" cy="50" r="40"
            fill="none"
            stroke={segment.color ?? '#00979D'}
            strokeWidth="16"
            strokeDasharray={`${segment.dash} ${DONUT_CIRCUMFERENCE}`}
            strokeDashoffset={segment.offset}
            opacity={highlight && segment.label !== highlight ? 0.3 : 1}
          />
        ))}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-semibold leading-none tabular-nums">
          {facilities.toLocaleString('id-ID')}
        </span>
        <span className="text-[10px] text-muted-foreground mt-0.5">Fasilitas</span>
      </div>
    </div>
  );
}

/**
 * A counted breakdown under the kecamatan reading: same scope, same filter, so
 * the three panels always describe one selection.
 */
function BreakdownPanel({
  title,
  kecamatan,
  rows,
  empty,
  chart = false,
  facilities = 0,
  highlight = null,
}: {
  title: string;
  kecamatan: string | null;
  rows: CountRow[];
  empty: string;
  chart?: boolean;
  /** Facilities in scope, for the donut's centre. */
  facilities?: number;
  /** The row the map is filtered to; the others fade behind it. */
  highlight?: string | null;
}) {
  const max = rows.reduce((highest, row) => Math.max(highest, row.count), 0);

  return (
    <div className="rounded-md border bg-background/85 backdrop-blur px-3 py-2 text-xs h-full overflow-y-auto">
      <h3 className="font-medium">{title}</h3>
      <p className="text-muted-foreground mt-0.5">
        Kab. Kebumen
        {kecamatan && <span className="text-primary">, Kec. {kecamatan}</span>}
      </p>

      {rows.length === 0 ? (
        <p className="text-muted-foreground mt-2 pt-2 border-t leading-snug">{empty}</p>
      ) : (
        <div className="mt-2 pt-2 border-t">
          {chart && <BreakdownDonut rows={rows} facilities={facilities} highlight={highlight} />}
          <dl className="space-y-0.5">
            {rows.map((row) => (
              <div
                key={row.label}
                className={`relative flex items-baseline justify-between gap-2 px-1 py-1 transition-opacity ${
                  highlight && row.label !== highlight ? 'opacity-50' : ''
                }`}
              >
                {/* The bar is the row's background, scaled against the largest
                    count in this panel, so the shape reads without a second
                    column of chrome. */}
                <span
                  aria-hidden
                  className="absolute inset-y-0 left-0 rounded-sm opacity-20"
                  style={{
                    width: `${max > 0 ? Math.max((row.count / max) * 100, 2) : 0}%`,
                    backgroundColor: row.color ?? '#00979D',
                  }}
                />
                <dt className="relative flex items-center gap-1.5 leading-snug">
                  {row.color && (
                    <span
                      aria-hidden
                      className="h-2 w-2 flex-shrink-0 rounded-full"
                      style={{ backgroundColor: row.color }}
                    />
                  )}
                  {row.label}
                </dt>
                <dd className="relative tabular-nums font-medium">
                  {row.count.toLocaleString('id-ID')}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </div>
  );
}

export default function HomePage() {
  const isDesktop = useIsDesktop();
  const [layanan, setLayanan] = useState(ALL_LAYANAN);
  const group = SERVICE_GROUPS.find((entry) => entry.label === layanan);
  const branches = group?.branches ?? null;
  const markerColors = useCallback(
    (point: SurveyMapPoint) => {
      if (group) return [group.color];
      const colors = SERVICE_GROUPS.filter((entry) =>
        offersAny(point.kode_desde_ltc, entry.branches)
      ).map((entry) => entry.color);
      // Not yet classified under any type: grey, not a colour that means one.
      return colors.length ? colors : [UNCLASSIFIED_COLOR];
    },
    [group]
  );

  // Same query key as the map's own, so counting the points here costs nothing.
  const { data: mapPoints } = useSurveyMapPoints();
  const counts = useMemo(() => {
    const points = mapPoints ?? [];
    return Object.fromEntries([
      [ALL_LAYANAN, points.length],
      ...SERVICE_GROUPS.map((group) => [
        group.label,
        points.filter((point) => offersAny(point.kode_desde_ltc, group.branches)).length,
      ]),
    ]) as Record<string, number>;
  }, [mapPoints]);

  // The kecamatan clicked on the map, read back from the same layer the
  // polygons are painted from. Clicked rather than hovered: the reading has to
  // stay put while it is being read.
  const [selectedKecamatan, setSelectedKecamatan] = useState<string | null>(null);
  const handleSelectKecamatan = useCallback((name: string | null) => {
    setSelectedKecamatan(name);
  }, []);
  const clearKecamatan = useCallback(() => setSelectedKecamatan(null), []);

  // Both breakdowns describe exactly what the map is showing: the same
  // jenis layanan filter, narrowed to the clicked kecamatan when there is one.
  const scopedPoints = useMemo(() => {
    const key = selectedKecamatan?.trim().toLowerCase();
    return (mapPoints ?? []).filter(
      (point) =>
        (!branches || offersAny(point.kode_desde_ltc, branches)) &&
        (!key || (point.kecamatan ?? '').trim().toLowerCase() === key)
    );
  }, [mapPoints, branches, selectedKecamatan]);

  const serviceRows = useMemo<CountRow[]>(
    () =>
      SERVICE_GROUPS.map((group) => ({
        label: group.label,
        color: group.color,
        count: scopedPoints.filter((point) => offersAny(point.kode_desde_ltc, group.branches)).length,
      })).filter((row) => row.count > 0),
    [scopedPoints]
  );

  const facilityRows = useMemo<CountRow[]>(() => {
    // Q4 is multi-select and the API joins the chosen labels with a comma, so a
    // facility can land on more than one row.
    const counts: Record<string, number> = {};
    for (const point of scopedPoints) {
      for (const label of facilityLabels(point.jenis_fasilitas)) {
        counts[label] = (counts[label] ?? 0) + 1;
      }
    }
    return Object.entries(counts)
      .map(([label, count]) => {
        // A type the questionnaire has since renamed still gets a row, it just
        // sorts after the ones Q4 knows about.
        const index = facilityIndex(label);
        return {
          label: toSentenceCase(label),
          count,
          color: FACILITY_TYPES[index]?.color ?? FACILITY_OTHER.color,
          index,
        };
      })
      .sort((a, b) => a.index - b.index || a.label.localeCompare(b.label, 'id'));
  }, [scopedPoints]);

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
            desdeBranches={branches}
            markerColors={markerColors}
            onSelectKecamatan={handleSelectKecamatan}
            selectedKecamatan={selectedKecamatan}
          />

          {/* Map header: title and marker filter left, highlighted area right */}
          <div className="absolute inset-0 z-10 pointer-events-none">
            <div className="flex h-full items-start justify-between gap-3 p-4 lg:p-6">
              <div className="flex flex-col gap-2 pointer-events-auto">
                <div className="flex items-center gap-2 self-start rounded-md border bg-background/85 backdrop-blur px-3 py-1.5">
                  <HugeiconsIcon icon={Location01Icon} size={14} className="text-muted-foreground" />
                  {/* The hovered kecamatan rides above the pointer on the map
                      itself, so this chip stays put as the map's title. */}
                  <span className="text-xs">Kabupaten Kebumen, Jawa Tengah</span>
                </div>
                <LayananFilter value={layanan} onChange={setLayanan} counts={counts} />
              </div>

              {/* Bento: the reading spans the top, the two breakdowns share
                  the row under it. One column until there is room for two. */}
              <div className="pointer-events-auto hidden sm:grid h-full grid-cols-1 lg:grid-cols-2 grid-rows-[auto_minmax(0,1fr)_minmax(0,1fr)] lg:grid-rows-[auto_minmax(0,1fr)] gap-2 w-60 lg:w-[30rem]">
                <div className="lg:col-span-2">
                  <KecamatanPanel
                    reading={reading}
                    indicator={highlight.indicator}
                    source={highlight.source}
                    kecamatanWithData={highlight.kecamatanWithData}
                    averageRate={highlight.averageRate}
                    onClear={clearKecamatan}
                  />
                </div>
                <BreakdownPanel
                  title="Jenis fasilitas"
                  kecamatan={selectedKecamatan}
                  rows={facilityRows}
                  empty="Belum ada fasilitas tersurvei di sini."
                />
                <BreakdownPanel
                  title="Jenis layanan"
                  kecamatan={selectedKecamatan}
                  rows={serviceRows}
                  empty="Belum ada layanan terklasifikasi di sini."
                  chart
                  facilities={scopedPoints.length}
                  highlight={layanan === ALL_LAYANAN ? null : layanan}
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
