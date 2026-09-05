'use client';

import { Suspense, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { PublicNav } from '@/components/public-nav';
import { PUBLIC_CONTAINER } from '@/lib/public-layout';
import { PublicFooter } from '@/components/public-footer';
import { DevNotice } from '@/components/dev-notice';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useSurveyMapPoints, type SurveyMapPoint } from '@/hooks/use-survey-responses';
import { cn } from '@/lib/utils';
import { kategoriLabel, toSentenceCase } from '@/lib/utils/text';

const ALL = 'Semua';
const PAGE_SIZE = 25;

/** Small radius, no shadow — matches the dashboard's control convention. */
const CONTROL = 'rounded-sm shadow-none';

/**
 * Select defaults to `position="item-aligned"`, which sizes the menu to its
 * widest option: the long DESDE facility names opened it to ~420px against a
 * 224px trigger, running to the edge of the window. `popper` anchors the menu
 * to its trigger and exposes the trigger width, so the menu is pinned there
 * and long labels wrap instead of stretching it.
 */
const MENU = 'w-[var(--radix-select-trigger-width)] rounded-sm [&_[role=option]]:whitespace-normal';

function wilayah(service: SurveyMapPoint) {
  return [service.desa && `Ds. ${service.desa}`, service.kecamatan && `Kec. ${service.kecamatan}`]
    .filter(Boolean)
    .join(', ');
}

function serviceLabel(service: SurveyMapPoint) {
  return service.service_name ?? service.name ?? 'Tanpa nama';
}

/** Options come from the data, so a filter never offers an empty result. */
function optionsFrom(services: SurveyMapPoint[], pick: (s: SurveyMapPoint) => string | null) {
  return [ALL, ...Array.from(new Set(services.map(pick).filter((v): v is string => !!v))).sort()];
}

function Filters({
  search,
  setSearch,
  kecamatan,
  setKecamatan,
  jenis,
  setJenis,
  kecamatanOptions,
  jenisOptions,
}: {
  search: string;
  setSearch: (v: string) => void;
  kecamatan: string;
  setKecamatan: (v: string) => void;
  jenis: string;
  setJenis: (v: string) => void;
  kecamatanOptions: string[];
  jenisOptions: string[];
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <Input
        placeholder="Cari nama, wilayah, atau jenis fasilitas"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        aria-label="Cari layanan kesehatan"
        className={cn('sm:w-80', CONTROL)}
      />
      <div className="flex flex-col gap-2 sm:flex-row">
        <Select value={kecamatan} onValueChange={setKecamatan}>
          <SelectTrigger className={cn('w-full sm:w-44 !h-9', CONTROL)} aria-label="Filter kecamatan">
            <SelectValue placeholder="Kecamatan" />
          </SelectTrigger>
          <SelectContent position="popper" className={MENU}>
            {kecamatanOptions.map((option) => (
              <SelectItem key={option} value={option}>
                {option === ALL ? 'Semua kecamatan' : option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={jenis} onValueChange={setJenis}>
          <SelectTrigger className={cn('w-full sm:w-56 !h-9', CONTROL)} aria-label="Filter jenis fasilitas">
            <SelectValue placeholder="Jenis fasilitas" />
          </SelectTrigger>
          <SelectContent position="popper" className={MENU}>
            {jenisOptions.map((option) => (
              <SelectItem key={option} value={option}>
                {option === ALL ? 'Semua jenis' : toSentenceCase(option)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

function ServiceRow({ service }: { service: SurveyMapPoint }) {
  const area = wilayah(service);
  return (
    // Alternating fill rather than a hairline per row: on a list this long it
    // costs no vertical space and paints no rule, and kategori is left as
    // quiet text because 180 coloured marks on one axis read as a ruled line.
    <li className="odd:bg-black/[0.03]">
      <Link
        href={`/lokasi/${service.id}`}
        className="grid gap-1 px-4 py-3 lg:grid-cols-[1fr_15rem_14rem_6rem] lg:items-baseline lg:gap-6 hover:bg-black/[0.05] transition-colors"
      >
        <span className="font-medium">{serviceLabel(service)}</span>
        <span className="text-sm text-muted-foreground">
          {service.jenis_fasilitas ? toSentenceCase(service.jenis_fasilitas) : '—'}
        </span>
        <span className="text-sm text-muted-foreground">{area || '—'}</span>
        <span className="text-sm text-muted-foreground">
          {kategoriLabel(service.kategori) ?? '—'}
        </span>
      </Link>
    </li>
  );
}

function ListSkeleton() {
  return (
    <div className="animate-pulse space-y-3 pt-4" aria-hidden>
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="h-5 rounded bg-muted" style={{ width: `${90 - i * 4}%` }} />
      ))}
    </div>
  );
}

function LayananKesehatanContent() {
  const { data, isLoading, isError } = useSurveyMapPoints();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState('');
  // Seeded from ?kecamatan= so the Kecamatan page can deep-link into a filtered
  // list. Read once as the initial value; the Select owns it afterwards.
  const [kecamatan, setKecamatan] = useState(() => searchParams.get('kecamatan') ?? ALL);
  const [jenis, setJenis] = useState(ALL);
  const [rawPage, setRawPage] = useState(1);

  const services = useMemo(() => data ?? [], [data]);

  const kecamatanOptions = useMemo(() => optionsFrom(services, (s) => s.kecamatan), [services]);
  const jenisOptions = useMemo(() => optionsFrom(services, (s) => s.jenis_fasilitas), [services]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return services
      .filter((service) => {
        if (kecamatan !== ALL && service.kecamatan !== kecamatan) return false;
        if (jenis !== ALL && service.jenis_fasilitas !== jenis) return false;
        if (!term) return true;
        return [
          service.service_name,
          service.name,
          service.kecamatan,
          service.desa,
          service.jenis_fasilitas,
        ]
          .filter(Boolean)
          .some((field) => (field as string).toLowerCase().includes(term));
      })
      .sort((a, b) => serviceLabel(a).localeCompare(serviceLabel(b), 'id'));
  }, [services, search, kecamatan, jenis]);

  const isFiltered = search.trim() !== '' || kecamatan !== ALL || jenis !== ALL;

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  // A filter change can leave the current page past the end of the new result
  // set, which would render an empty list with rows still available. Clamping
  // on render keeps the two in step without an effect.
  const page = Math.min(rawPage, totalPages);
  const start = (page - 1) * PAGE_SIZE;
  const pageItems = filtered.slice(start, start + PAGE_SIZE);

  const reset = () => {
    setSearch('');
    setKecamatan(ALL);
    setJenis(ALL);
    setRawPage(1);
  };

  // Narrowing the list should show its first page, not hold the old offset.
  const onFilterChange = <T,>(setter: (value: T) => void) => (value: T) => {
    setter(value);
    setRawPage(1);
  };

  return (
    <div className="font-geist min-h-screen bg-background">
      <DevNotice />
      <PublicNav />

      <main className={cn(PUBLIC_CONTAINER, 'pb-24')}>
        <div className="pt-10 pb-12">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight leading-[1.08]">
            Layanan kesehatan
          </h1>
          <p className="mt-4 text-[15px] text-foreground/80 max-w-[62ch]">
            Seluruh layanan kesehatan jiwa yang sudah disurvei di Kabupaten Kebumen, dipetakan
            menurut standar DESDE-LTC.
          </p>
        </div>

        <div className="border-t" />

        <div className="pt-10 space-y-6">
          <Filters
            search={search}
            setSearch={onFilterChange(setSearch)}
            kecamatan={kecamatan}
            setKecamatan={onFilterChange(setKecamatan)}
            jenis={jenis}
            setJenis={onFilterChange(setJenis)}
            kecamatanOptions={kecamatanOptions}
            jenisOptions={jenisOptions}
          />

          {isLoading ? (
            <ListSkeleton />
          ) : isError ? (
            <p className="text-[15px] text-foreground/80 py-10">
              Data layanan gagal dimuat. Coba muat ulang halaman ini.
            </p>
          ) : (
            <>
              <p className="text-sm text-muted-foreground" role="status" aria-live="polite">
                {isFiltered
                  ? `${filtered.length} dari ${services.length} layanan`
                  : `${services.length} layanan`}
              </p>

              {filtered.length === 0 ? (
                <div className="py-10">
                  <p className="text-[15px]">Tidak ada layanan yang cocok dengan filter ini.</p>
                  <Button variant="outline" onClick={reset} className={cn('mt-4', CONTROL)}>
                    Hapus filter
                  </Button>
                </div>
              ) : (
                <div className="-mx-4">
                  {/* Column headers only where the row is actually a grid. */}
                  <div className="hidden lg:grid grid-cols-[1fr_15rem_14rem_6rem] gap-6 px-4 pb-2 text-xs text-muted-foreground">
                    <span>Nama layanan</span>
                    <span>Jenis fasilitas</span>
                    <span>Wilayah</span>
                    <span>Kategori</span>
                  </div>
                  <ul>
                    {pageItems.map((service) => (
                      <ServiceRow key={service.id} service={service} />
                    ))}
                  </ul>
                </div>
              )}

              {filtered.length > 0 && (
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-muted-foreground">
                    Menampilkan {start + 1}
                    {'–'}
                    {Math.min(start + PAGE_SIZE, filtered.length)} dari {filtered.length} layanan
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className={CONTROL}
                      onClick={() => setRawPage(Math.max(1, page - 1))}
                      disabled={page <= 1}
                    >
                      Sebelumnya
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Halaman {page} dari {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      className={CONTROL}
                      onClick={() => setRawPage(Math.min(totalPages, page + 1))}
                      disabled={page >= totalPages}
                    >
                      Selanjutnya
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}

export default function LayananKesehatanPage() {
  // useSearchParams opts the tree into a Suspense boundary at prerender time.
  return (
    <Suspense fallback={null}>
      <LayananKesehatanContent />
    </Suspense>
  );
}
