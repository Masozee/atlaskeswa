'use client';

import { use, useMemo } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { PublicNav } from '@/components/public-nav';
import { PUBLIC_CONTAINER } from '@/lib/public-layout';
import { PublicFooter } from '@/components/public-footer';
import { DevNotice } from '@/components/dev-notice';
import { KebumenMap } from '@/components/kebumen-map';
import {
  useKecamatanSecondary,
  type KecamatanIndicatorRow,
  type KecamatanSecondaryDataset,
} from '@/hooks/use-secondary';
import { useSurveyMapPoints, type SurveyMapPoint } from '@/hooks/use-survey-responses';
import { kategoriLabel, toSentenceCase } from '@/lib/utils/text';
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowLeft01Icon, ArrowRight01Icon } from '@hugeicons/core-free-icons';

const EMPTY = '—';

function formatCount(value: string | null) {
  if (value === null) return EMPTY;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed.toLocaleString('id-ID') : value;
}

function formatRate(value: number | null) {
  if (value === null) return EMPTY;
  return value.toLocaleString('id-ID', { maximumFractionDigits: 1 });
}

/** A chapter: heading, then content. Space does the grouping, not a box. */
function Chapter({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-base font-medium mb-4">{title}</h2>
      {children}
    </section>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[13px] text-muted-foreground">{label}</dt>
      <dd className="text-base mt-1 tabular-nums">{value}</dd>
    </div>
  );
}

/**
 * One dataset as a table: indicator down the side, sex across, the rate last.
 *
 * The rate is computed against this kecamatan's own population, so the columns
 * can be compared with another kecamatan's page without doing the arithmetic.
 */
function DatasetTable({ entry }: { entry: KecamatanSecondaryDataset }) {
  const rows: KecamatanIndicatorRow[] = entry.indicators;

  return (
    <section>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 mb-3">
        <h3 className="text-[15px] font-medium">{entry.dataset.name}</h3>
        <p className="text-[13px] text-muted-foreground">
          {[entry.dataset.source, entry.dataset.year].filter(Boolean).join(' · ')}
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] border-collapse text-[15px]">
          <thead>
            <tr className="border-b">
              <th className="py-2 pr-4 text-left font-medium">Indikator</th>
              <th className="py-2 px-3 text-right font-medium w-20">Laki-laki</th>
              <th className="py-2 px-3 text-right font-medium w-20">Perempuan</th>
              <th className="py-2 px-3 text-right font-medium w-20">Total</th>
              <th className="py-2 pl-3 text-right font-medium w-28">Per 10.000</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.code} className="align-top even:bg-foreground/[0.03]">
                <th scope="row" className="py-2 pr-4 text-left text-[14px] font-normal leading-snug">
                  {row.name}
                  {row.is_aggregate && (
                    // The source totalled this column itself, so it is not part
                    // of the combined figure below.
                    <span className="text-muted-foreground"> · agregat sumber</span>
                  )}
                </th>
                <td className="py-2 px-3 text-right tabular-nums">{formatCount(row.male)}</td>
                <td className="py-2 px-3 text-right tabular-nums">{formatCount(row.female)}</td>
                <td className="py-2 px-3 text-right tabular-nums">{formatCount(row.total)}</td>
                <td className="py-2 pl-3 text-right tabular-nums">{formatRate(row.per_10k)}</td>
              </tr>
            ))}
            <tr className="border-t font-medium">
              <th scope="row" className="py-2 pr-4 text-left text-[14px]">
                Gabungan (tanpa agregat sumber)
              </th>
              <td className="py-2 px-3" />
              <td className="py-2 px-3" />
              <td className="py-2 px-3 text-right tabular-nums">
                {formatCount(entry.combined_total)}
              </td>
              <td className="py-2 pl-3 text-right tabular-nums">
                {formatRate(entry.combined_per_10k)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}

/** The services surveyed here, listed on the page rather than linked away to a
 *  filtered index: a kecamatan profile that cannot name its own facilities is
 *  only half a page. */
function ServiceRow({ service }: { service: SurveyMapPoint }) {
  const name = service.name ?? service.service_name ?? 'Tanpa nama';
  return (
    <li className="odd:bg-black/[0.03]">
      <Link
        href={`/lokasi/${service.id}`}
        className="grid gap-1 px-4 py-3 lg:grid-cols-[1fr_15rem_10rem_7rem] lg:items-baseline lg:gap-6 hover:bg-black/[0.05] transition-colors"
      >
        <span className="font-medium">{name}</span>
        <span className="text-sm text-muted-foreground">
          {service.jenis_fasilitas ? toSentenceCase(service.jenis_fasilitas) : EMPTY}
        </span>
        <span className="text-sm text-muted-foreground">
          {service.desa ? `Ds. ${service.desa}` : EMPTY}
        </span>
        <span className="text-sm text-muted-foreground">
          {kategoriLabel(service.kategori) ?? EMPTY}
        </span>
      </Link>
    </li>
  );
}

export default function KecamatanDetailPage({
  params,
}: {
  params: Promise<{ nama: string }>;
}) {
  const { nama } = use(params);
  const name = decodeURIComponent(nama);
  const { data, isLoading, isError } = useKecamatanSecondary(name);
  const { data: mapPoints } = useSurveyMapPoints();

  const services = useMemo(
    () =>
      (mapPoints ?? []).filter(
        (point) => (point.kecamatan ?? '').toLowerCase() === name.toLowerCase()
      ),
    [mapPoints, name]
  );
  const surveyCount = services.length;

  const title = data?.kecamatan.name ?? name;

  return (
    <div className="font-geist min-h-screen bg-background">
      <DevNotice />
      <PublicNav />

      <main className={cn(PUBLIC_CONTAINER, 'pb-24')}>
        <div className="pt-8 pb-8">
          <nav aria-label="Breadcrumb" className="text-[13px] text-muted-foreground">
            <ol className="flex flex-wrap items-center gap-1.5">
              <li>
                <Link href="/" className="inline-block py-1 -my-1 hover:text-foreground transition-colors">
                  Peta
                </Link>
              </li>
              <li aria-hidden className="opacity-50">/</li>
              <li>
                <Link href="/kecamatan" className="inline-block py-1 -my-1 hover:text-foreground transition-colors">
                  Kecamatan
                </Link>
              </li>
              <li aria-hidden className="opacity-50">/</li>
              <li className="text-foreground">{title}</li>
            </ol>
          </nav>

          <h1 className="mt-3 text-3xl sm:text-4xl font-semibold tracking-tight leading-[1.08]">
            Kecamatan {title}
          </h1>
          <p className="mt-3 text-base text-muted-foreground">
            Kabupaten Kebumen, Jawa Tengah
          </p>
        </div>

        <div className="border-t" />

        {isError ? (
          <div className="py-24 max-w-[60ch]">
            <h2 className="text-2xl font-semibold tracking-tight">Kecamatan tidak ditemukan</h2>
            <p className="text-base text-foreground/80 mt-3">
              Tidak ada kecamatan dengan nama itu di Kabupaten Kebumen.
            </p>
            <Button asChild variant="outline" className="mt-8 gap-2">
              <Link href="/kecamatan">
                <HugeiconsIcon icon={ArrowLeft01Icon} size={16} />
                Kembali ke daftar kecamatan
              </Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-10 lg:space-y-12 pt-8 lg:pt-10">
            <Chapter title="Ringkasan">
              <dl className="grid gap-x-10 gap-y-5 sm:grid-cols-2 lg:grid-cols-4">
                <Field
                  label="Jumlah penduduk"
                  value={formatCount(data?.datasets[0]?.population ?? null)}
                />
                <Field
                  label="Gangguan jiwa (gabungan)"
                  value={formatCount(data?.datasets[0]?.combined_total ?? null)}
                />
                <Field
                  label="Per 10.000 penduduk"
                  value={formatRate(data?.datasets[0]?.combined_per_10k ?? null)}
                />
                <Field label="Layanan tersurvei" value={surveyCount.toLocaleString('id-ID')} />
              </dl>
            </Chapter>

            <Chapter title="Peta">
              <div className="h-72 lg:h-96 w-full overflow-hidden rounded-lg border">
                <KebumenMap
                  height="h-full"
                  showControls
                  choropleth
                  highlightKecamatan={title}
                  kecamatanFilter={title}
                  // The camera frames this kecamatan, so the Kebumen-wide pan
                  // restriction would fight it.
                  maxBounds={null}
                  cooperativeGestures
                />
              </div>
              <p className="text-[13px] text-muted-foreground mt-2">
                Kecamatan ini disorot; warna menunjukkan angka gangguan jiwa per 10.000 penduduk.
              </p>
            </Chapter>

            <Chapter title="Data sekunder">
              {isLoading ? (
                <p className="text-[15px] text-muted-foreground">Memuat data…</p>
              ) : data && data.datasets.length > 0 ? (
                <div className="space-y-12">
                  {data.datasets.map((entry) => (
                    <DatasetTable key={entry.dataset.slug} entry={entry} />
                  ))}
                </div>
              ) : (
                <p className="text-[15px] text-muted-foreground max-w-[60ch]">
                  Belum ada data sekunder yang dipublikasikan untuk kecamatan ini.
                </p>
              )}
            </Chapter>

            <Chapter title={`Layanan kesehatan jiwa (${surveyCount})`}>
              {services.length > 0 ? (
                <div className="-mx-4">
                  <div className="hidden lg:grid grid-cols-[1fr_15rem_10rem_7rem] gap-6 px-4 pb-2 text-xs text-muted-foreground">
                    <span>Nama layanan</span>
                    <span>Jenis fasilitas</span>
                    <span>Desa/Kelurahan</span>
                    <span>Kategori</span>
                  </div>
                  <ul>
                    {services.map((service) => (
                      <ServiceRow key={service.id} service={service} />
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="text-[15px] text-muted-foreground max-w-[60ch]">
                  Belum ada layanan terbit di kecamatan ini. Survei yang belum diterbitkan
                  tidak tampil di halaman publik.
                </p>
              )}
            </Chapter>
          </div>
        )}

        <div className="border-t mt-12 pt-6 flex flex-wrap gap-x-8 gap-y-3">
          <Link
            href="/kecamatan"
            className="inline-flex items-center gap-2 py-1 -my-1 text-base font-medium hover:underline underline-offset-4"
          >
            Semua kecamatan
            <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
          </Link>
          <Link
            href="/layanan-kesehatan"
            className="inline-flex items-center gap-2 py-1 -my-1 text-base text-muted-foreground hover:text-foreground transition-colors"
          >
            Seluruh layanan di Kebumen
          </Link>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
