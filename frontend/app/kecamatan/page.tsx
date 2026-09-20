'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { PublicNav } from '@/components/public-nav';
import { PublicFooter } from '@/components/public-footer';
import { DevNotice } from '@/components/dev-notice';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { PUBLIC_CONTAINER } from '@/lib/public-layout';
import { useSurveyMapPoints, type SurveyMapPoint } from '@/hooks/use-survey-responses';
import {
  FACILITY_TYPES,
  FACILITY_OTHER,
  facilityIndex,
  facilityLabels,
} from '@/lib/facility-types';
import { cn } from '@/lib/utils';

const CONTROL = 'rounded-sm shadow-none';

type KecamatanRow = {
  name: string;
  total: number;
  /** Count per index into FACILITY_TYPES; the last slot holds unknown types. */
  byType: number[];
};

/** A facility can answer Q4 more than once, so a column is a count of answers. */
const TYPE_SLOTS = FACILITY_TYPES.length + 1;

/** Rolls the survey points up per kecamatan, broken down the way Q4 asks. */
function summarise(services: SurveyMapPoint[]): KecamatanRow[] {
  const rows = new Map<string, KecamatanRow>();
  for (const service of services) {
    if (!service.kecamatan) continue;
    const row =
      rows.get(service.kecamatan) ??
      { name: service.kecamatan, total: 0, byType: Array<number>(TYPE_SLOTS).fill(0) };
    row.total += 1;
    for (const label of facilityLabels(service.jenis_fasilitas)) {
      row.byType[facilityIndex(label)] += 1;
    }
    rows.set(service.kecamatan, row);
  }
  return Array.from(rows.values()).sort((a, b) => a.name.localeCompare(b.name, 'id'));
}

/**
 * Only the types someone actually surveyed get a column: twelve empty columns
 * would cost the kecamatan name the width it needs.
 */
function usedColumns(rows: KecamatanRow[]) {
  return [...FACILITY_TYPES, FACILITY_OTHER]
    .map((type, index) => ({ ...type, index }))
    .filter((type) => rows.some((row) => row.byType[type.index] > 0));
}

function ListSkeleton() {
  return (
    <div className="animate-pulse space-y-3 pt-4" aria-hidden>
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="h-5 rounded bg-muted" style={{ width: `${88 - i * 5}%` }} />
      ))}
    </div>
  );
}

export default function KecamatanPage() {
  const { data, isLoading, isError } = useSurveyMapPoints();
  const [search, setSearch] = useState('');

  const services = useMemo(() => data ?? [], [data]);
  const rows = useMemo(() => summarise(services), [services]);

  // Sum of the rows rather than services.length: a survey with no kecamatan
  // recorded belongs to no row, so quoting the full total would not add up.
  const attributed = useMemo(() => rows.reduce((sum, row) => sum + row.total, 0), [rows]);
  const unattributed = services.length - attributed;

  // Columns follow the data, so a kecamatan search never reshapes the table.
  const columns = useMemo(() => usedColumns(rows), [rows]);
  const columnTemplate = useMemo(
    () => `minmax(8rem, 1fr) 5rem ${columns.map(() => '4.5rem').join(' ')}`,
    [columns]
  );

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter((row) => row.name.toLowerCase().includes(term));
  }, [rows, search]);

  return (
    <div className="font-geist min-h-screen bg-background">
      <DevNotice />
      <PublicNav />

      <main className={cn(PUBLIC_CONTAINER, 'pb-24')}>
        <div className="pt-10 pb-12">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight leading-[1.08]">
            Kecamatan
          </h1>
          <p className="mt-4 text-[15px] text-foreground/80 max-w-[62ch]">
            Sebaran layanan kesehatan jiwa yang sudah disurvei di setiap kecamatan di Kabupaten
            Kebumen. Pilih satu kecamatan untuk melihat data sekunder dan layanannya.
          </p>
        </div>

        <div className="border-t" />

        <div className="pt-10 space-y-6">
          <Input
            placeholder="Cari kecamatan"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Cari kecamatan"
            className={cn('sm:w-80', CONTROL)}
          />

          {isLoading ? (
            <ListSkeleton />
          ) : isError ? (
            <p className="text-[15px] text-foreground/80 py-10">
              Data kecamatan gagal dimuat. Coba muat ulang halaman ini.
            </p>
          ) : (
            <>
              <p className="text-sm text-muted-foreground" role="status" aria-live="polite">
                {search.trim()
                  ? `${filtered.length} dari ${rows.length} kecamatan`
                  : `${rows.length} kecamatan · ${attributed} layanan`}
              </p>

              {unattributed > 0 && !search.trim() && (
                <p className="text-sm text-muted-foreground">
                  {unattributed} layanan belum mencatat kecamatan sehingga tidak masuk tabel ini.
                </p>
              )}

              {filtered.length === 0 ? (
                <div className="py-10">
                  <p className="text-[15px]">Tidak ada kecamatan yang cocok.</p>
                  <Button
                    variant="outline"
                    onClick={() => setSearch('')}
                    className={cn('mt-4', CONTROL)}
                  >
                    Hapus pencarian
                  </Button>
                </div>
              ) : (
                <div className="-mx-4 overflow-x-auto">
                  <div className="min-w-full sm:min-w-[52rem]">
                    <div
                      className="hidden sm:grid gap-3 px-4 pb-2 text-xs text-muted-foreground"
                      style={{ gridTemplateColumns: columnTemplate }}
                    >
                      <span>Kecamatan</span>
                      <span className="text-right">Layanan</span>
                      {columns.map((type) => (
                        // The header is abbreviated; the full Q4 label is on the
                        // title so it is still readable on hover and to a reader.
                        <span key={type.label} className="text-right" title={type.label}>
                          {type.short}
                        </span>
                      ))}
                    </div>
                    <ul>
                      {filtered.map((row) => (
                        <li key={row.name} className="odd:bg-black/[0.03]">
                          <Link
                            href={`/kecamatan/${encodeURIComponent(row.name)}`}
                            className="grid gap-1 px-4 py-3 sm:items-baseline sm:gap-3 hover:bg-black/[0.05] transition-colors"
                            style={{ gridTemplateColumns: columnTemplate }}
                          >
                            <span className="font-medium">{row.name}</span>
                            {/* One wrapped meta line on mobile, where the column
                                headers are hidden and a line per facility type
                                made 26 rows very tall. `sm:contents` dissolves
                                the wrapper so the spans become grid cells. */}
                            <span className="flex flex-wrap gap-x-2 text-sm text-muted-foreground sm:contents">
                              <span className="sm:text-right">
                                <span className="tabular-nums">{row.total}</span>
                                <span className="sm:hidden"> layanan</span>
                              </span>
                              {columns.map((type) => {
                                const count = row.byType[type.index];
                                return (
                                  <span
                                    key={type.label}
                                    className={cn(
                                      'sm:text-right',
                                      // An empty cell is written as a dash on
                                      // desktop and left out of the mobile line.
                                      count === 0 && 'hidden sm:inline text-muted-foreground'
                                    )}
                                  >
                                    <span className="sm:hidden" aria-hidden>· </span>
                                    <span className="tabular-nums">{count === 0 ? '—' : count}</span>
                                    <span className="sm:hidden"> {type.short.toLowerCase()}</span>
                                  </span>
                                );
                              })}
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
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
