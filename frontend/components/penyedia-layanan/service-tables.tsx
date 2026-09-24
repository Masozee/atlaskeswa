'use client';

import type { CSSProperties, ReactNode } from 'react';
import Link from 'next/link';
import { HugeiconsIcon } from '@hugeicons/react';
import { Tick02Icon } from '@hugeicons/core-free-icons';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type {
  AvailabilityCell,
  BucketTable,
  PenyediaLayananSummary,
} from '@/hooks/use-penyedia-layanan';
import { cn } from '@/lib/utils';
import { formatNumber } from './service-types';

/**
 * The service type's colour marks its group headers as a tint with a solid
 * top rule; header text stays in ink so it never depends on the hue.
 */
const groupStyle = (color: string): CSSProperties => ({
  background: `${color}1f`,
  boxShadow: `inset 0 3px 0 ${color}`,
});

const HEAD = 'h-auto py-2 text-xs font-medium text-foreground/80 whitespace-normal';
const GROUP = cn(HEAD, 'text-center border-l border-white');
const NUM = 'text-right tabular-nums';

function TableFrame({ children, minWidth }: { children: ReactNode; minWidth: string }) {
  return (
    <div className="rounded-sm border">
      <Table className={minWidth}>{children}</Table>
    </div>
  );
}

function Check({ on }: { on: boolean }) {
  if (!on) return <span className="sr-only">Tidak</span>;
  return (
    <>
      <HugeiconsIcon icon={Tick02Icon} size={16} className="inline text-foreground" aria-hidden />
      <span className="sr-only">Ya</span>
    </>
  );
}

function FacilityName({ id, name }: { id: number; name: string }) {
  return (
    <Link href={`/lokasi/${id}`} className="hover:underline underline-offset-4">
      {name}
    </Link>
  );
}

/** Capacity is only meaningful where the service is offered; elsewhere the cell stays empty. */
function capacity(cell: AvailabilityCell) {
  return cell.tersedia ? formatNumber(cell.kapasitas) : '';
}

export function RawatInapTable({ summary, color }: { summary: PenyediaLayananSummary; color: string }) {
  return (
    <TableFrame minWidth="min-w-[40rem]">
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead rowSpan={2} className={cn(HEAD, 'w-12')}>No</TableHead>
          <TableHead rowSpan={2} className={HEAD}>Nama penyedia layanan</TableHead>
          <TableHead colSpan={2} className={GROUP} style={groupStyle(color)}>Rawat inap akut</TableHead>
          <TableHead colSpan={2} className={GROUP} style={groupStyle(color)}>Rawat inap non akut</TableHead>
        </TableRow>
        <TableRow className="hover:bg-transparent">
          {['Tersedia', 'Kapasitas', 'Tersedia', 'Kapasitas'].map((label, i) => (
            <TableHead key={i} className={cn(HEAD, 'text-center w-24')}>{label}</TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {summary.rawat_inap.map((row, index) => (
          <TableRow key={row.id}>
            <TableCell className="text-muted-foreground tabular-nums">{index + 1}</TableCell>
            <TableCell className="whitespace-normal"><FacilityName id={row.id} name={row.name} /></TableCell>
            <TableCell className="text-center"><Check on={row.akut.tersedia} /></TableCell>
            <TableCell className={NUM}>{capacity(row.akut)}</TableCell>
            <TableCell className="text-center"><Check on={row.non_akut.tersedia} /></TableCell>
            <TableCell className={NUM}>{capacity(row.non_akut)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </TableFrame>
  );
}

const DAY_CARE_KINDS = [
  { key: 'pekerjaan', label: 'Terkait pekerjaan' },
  { key: 'persiapan_kerja', label: 'Persiapan kerja' },
  { key: 'terstruktur', label: 'Terstruktur non pekerjaan' },
  { key: 'tidak_terstruktur', label: 'Tidak terstruktur' },
] as const;

export function PerawatanHarianTable({ summary, color }: { summary: PenyediaLayananSummary; color: string }) {
  return (
    <TableFrame minWidth="min-w-[52rem]">
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead rowSpan={2} className={cn(HEAD, 'w-12')}>No</TableHead>
          <TableHead rowSpan={2} className={HEAD}>Nama penyedia layanan</TableHead>
          <TableHead colSpan={2} className={GROUP} style={groupStyle(color)}>Akut</TableHead>
          <TableHead colSpan={5} className={GROUP} style={groupStyle(color)}>Non akut</TableHead>
        </TableRow>
        <TableRow className="hover:bg-transparent">
          <TableHead className={cn(HEAD, 'text-center w-20')}>Akut</TableHead>
          <TableHead className={cn(HEAD, 'text-center w-20')}>Kapasitas</TableHead>
          {DAY_CARE_KINDS.map((kind) => (
            <TableHead key={kind.key} className={cn(HEAD, 'text-center w-24')}>{kind.label}</TableHead>
          ))}
          <TableHead className={cn(HEAD, 'text-center w-20')}>Kapasitas</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {summary.perawatan_harian.map((row, index) => {
          const offersNonAcute = DAY_CARE_KINDS.some((kind) => row.non_akut[kind.key]);
          return (
            <TableRow key={row.id}>
              <TableCell className="text-muted-foreground tabular-nums">{index + 1}</TableCell>
              <TableCell className="whitespace-normal"><FacilityName id={row.id} name={row.name} /></TableCell>
              <TableCell className="text-center"><Check on={row.akut.tersedia} /></TableCell>
              <TableCell className={NUM}>{capacity(row.akut)}</TableCell>
              {DAY_CARE_KINDS.map((kind) => (
                <TableCell key={kind.key} className="text-center"><Check on={row.non_akut[kind.key]} /></TableCell>
              ))}
              <TableCell className={NUM}>
                {offersNonAcute ? formatNumber(row.non_akut.kapasitas) : ''}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </TableFrame>
  );
}

type Group<C extends string> = {
  label: string;
  /** A column label adds a middle header row; a group of one unlabeled column spans it. */
  columns: { key: C; label?: string }[];
};

/**
 * One row per provider bucket; every column is a (#fasilitas, #measure) pair.
 * Groups nest up to two header levels above that pair, as the report does.
 */
export function BucketTableView<C extends string>({
  summary,
  table,
  groups,
  measure,
  color,
}: {
  summary: PenyediaLayananSummary;
  table: BucketTable<C>;
  groups: Group<C>[];
  measure: string;
  color: string;
}) {
  const labels = Object.fromEntries(summary.providers.map((p) => [p.key, p.label]));
  const columns = groups.flatMap((group) => group.columns);
  const hasMiddle = columns.some((column) => column.label);
  const headRows = hasMiddle ? 3 : 2;
  const cells = (cell: { fasilitas: number; jumlah: number }, key: string) => [
    <TableCell key={`${key}-f`} className={cn(NUM, 'border-l')}>{formatNumber(cell.fasilitas)}</TableCell>,
    <TableCell key={`${key}-j`} className={NUM}>{formatNumber(cell.jumlah)}</TableCell>,
  ];

  return (
    <TableFrame minWidth={columns.length > 3 ? 'min-w-[56rem]' : 'min-w-[40rem]'}>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead rowSpan={headRows} className={cn(HEAD, 'w-12')}>No</TableHead>
          <TableHead rowSpan={headRows} className={HEAD}>Penyedia layanan</TableHead>
          {groups.map((group) => (
            <TableHead
              key={group.label}
              colSpan={group.columns.length * 2}
              rowSpan={hasMiddle && !group.columns[0].label ? 2 : 1}
              className={GROUP}
              style={groupStyle(color)}
            >
              {group.label}
            </TableHead>
          ))}
        </TableRow>
        {hasMiddle && (
          <TableRow className="hover:bg-transparent">
            {columns
              .filter((column) => column.label)
              .map((column) => (
                <TableHead key={column.key} colSpan={2} className={cn(HEAD, 'text-center border-l')}>
                  {column.label}
                </TableHead>
              ))}
          </TableRow>
        )}
        <TableRow className="hover:bg-transparent">
          {columns.map((column) => [
            <TableHead key={`${column.key}-f`} className={cn(HEAD, 'text-right border-l')}># Fasilitas</TableHead>,
            <TableHead key={`${column.key}-j`} className={cn(HEAD, 'text-right')}># {measure}</TableHead>,
          ])}
        </TableRow>
      </TableHeader>
      <TableBody>
        {table.rows.map((row, index) => (
          <TableRow key={row.provider}>
            <TableCell className="text-muted-foreground tabular-nums">{index + 1}</TableCell>
            <TableCell className="whitespace-normal">{labels[row.provider] ?? row.provider}</TableCell>
            {columns.flatMap((column) => cells(row[column.key], column.key))}
          </TableRow>
        ))}
        <TableRow className="bg-muted/50 font-medium hover:bg-muted/50">
          <TableCell />
          <TableCell>Total</TableCell>
          {columns.flatMap((column) => cells(table.total[column.key], column.key))}
        </TableRow>
      </TableBody>
    </TableFrame>
  );
}
