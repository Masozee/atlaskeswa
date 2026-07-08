'use client';

import { useState, useMemo, useEffect } from 'react';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ButtonGroup } from '@/components/ui/button-group';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { HugeiconsIcon } from "@hugeicons/react"
import {
  CheckmarkCircle02Icon,
  Cancel01Icon,
  Clock01Icon,
  Search01Icon,
  Download01Icon,
} from "@hugeicons/core-free-icons";
import { Separator } from '@/components/ui/separator';
import { useVerificationLogs } from '@/hooks/use-logs';

const actionColors: Record<string, string> = {
  VERIFIED: 'bg-green-100 text-green-800 border-green-200',
  REJECTED: 'bg-red-100 text-red-800 border-red-200',
  SUBMITTED: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  ASSIGNED: 'bg-blue-100 text-blue-800 border-blue-200',
  REASSIGNED: 'bg-blue-100 text-blue-800 border-blue-200',
  RESUBMITTED: 'bg-purple-100 text-purple-800 border-purple-200',
  COMMENT_ADDED: 'bg-gray-100 text-gray-800 border-gray-200',
};

const actionIcons: Record<string, typeof CheckmarkCircle02Icon> = {
  VERIFIED: CheckmarkCircle02Icon,
  REJECTED: Cancel01Icon,
  SUBMITTED: Clock01Icon,
  ASSIGNED: Clock01Icon,
  REASSIGNED: Clock01Icon,
  RESUBMITTED: Clock01Icon,
  COMMENT_ADDED: Clock01Icon,
};

function getTimestampGte(timeRange: string): string | undefined {
  const now = new Date();
  switch (timeRange) {
    case 'today': {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      return d.toISOString();
    }
    case 'yesterday': {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
      return d.toISOString();
    }
    case 'week':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    case 'month':
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    default:
      return undefined;
  }
}

const TIME_RANGE_OPTIONS = [
  { value: 'today', label: 'Hari Ini' },
  { value: 'yesterday', label: 'Kemarin' },
  { value: 'week', label: '7 Hari Terakhir' },
  { value: 'month', label: '30 Hari Terakhir' },
  { value: 'all', label: 'Semua Waktu' },
];
const TIME_RANGE_LABELS: Record<string, string> = Object.fromEntries(
  TIME_RANGE_OPTIONS.map((o) => [o.value, o.label]),
);

const STATUS_OPTIONS = [
  { value: 'VERIFIED', label: 'Disetujui' },
  { value: 'REJECTED', label: 'Ditolak' },
  { value: 'SUBMITTED', label: 'Disubmit' },
  { value: 'ASSIGNED', label: 'Ditugaskan' },
  { value: 'REASSIGNED', label: 'Dialihkan' },
  { value: 'RESUBMITTED', label: 'Disubmit Ulang' },
];
const STATUS_LABELS: Record<string, string> = Object.fromEntries(
  STATUS_OPTIONS.map((o) => [o.value, o.label]),
);

const breadcrumbs = [
  { label: 'Dasbor', href: '/dashboard' },
  { label: 'Log & Pemantauan', href: '/dashboard/logs' },
  { label: 'Log Verifikasi' },
];

const PAGE_SIZE = 50;

export default function VerificationLogsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<string>('today');
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, actionFilter, timeRange]);

  const queryParams = useMemo(() => {
    const params: Record<string, unknown> = { page, page_size: PAGE_SIZE };
    if (actionFilter !== 'all') params.action = actionFilter;
    if (searchQuery) params.search = searchQuery;
    const gte = getTimestampGte(timeRange);
    if (gte) params.timestamp__gte = gte;
    return params;
  }, [actionFilter, searchQuery, timeRange, page]);

  const { data, isLoading, isError } = useVerificationLogs(queryParams);

  const logs = data?.results ?? [] as any[];
  const total = data?.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const stats = useMemo(() => {
    const approved = logs.filter((l) => l.action === 'VERIFIED').length;
    return {
      total,
      approved,
      rejected: logs.filter((l) => l.action === 'REJECTED').length,
      pending: logs.filter((l) => l.action === 'SUBMITTED').length,
      approvalRate: approved > 0 && logs.length > 0
        ? ((approved / logs.length) * 100).toFixed(1)
        : '0.0',
    };
  }, [logs, total]);

  return (
    <>
      <PageHeader breadcrumbs={breadcrumbs} />

      <div className="flex flex-1 flex-col gap-3">

        <div className="flex items-start justify-between gap-3 px-6 pt-6">
          <div>
            <h1 className="text-xl font-bold">Log Verifikasi</h1>
            <p className="text-sm text-muted-foreground">Riwayat verifikasi survei dan perubahan status</p>
          </div>
          <Button size="sm" className="h-9 rounded-sm shadow-none">
            <HugeiconsIcon icon={Download01Icon} size={16} className="mr-2" />
            Ekspor Log
          </Button>
        </div>

        <Separator />

        <div className="flex flex-col gap-3 px-6 pb-6">

          {/* Statistics */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="border-0 bg-white shadow-none">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Verifikasi</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{total}</div>
                <p className="text-xs text-muted-foreground mt-1">Semua waktu</p>
              </CardContent>
            </Card>
            <Card className="border-0 bg-white shadow-none">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-green-600">Disetujui</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
                <p className="text-xs text-muted-foreground mt-1">{stats.approvalRate}% tingkat persetujuan</p>
              </CardContent>
            </Card>
            <Card className="border-0 bg-white shadow-none">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-red-600">Ditolak</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
                <p className="text-xs text-muted-foreground mt-1">Perlu perbaikan</p>
              </CardContent>
            </Card>
            <Card className="border-0 bg-white shadow-none">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-yellow-600">Menunggu</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
                <p className="text-xs text-muted-foreground mt-1">Dalam antrian</p>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <div className="flex gap-2 justify-between items-center">
            <ButtonGroup aria-label="Filter log verifikasi">
              {/* Rentang Waktu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="min-h-9 bg-white shadow-none">
                    {TIME_RANGE_LABELS[timeRange] ?? 'Rentang Waktu'}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48">
                  <DropdownMenuLabel>Rentang Waktu</DropdownMenuLabel>
                  {TIME_RANGE_OPTIONS.map((o) => (
                    <DropdownMenuCheckboxItem
                      key={o.value}
                      checked={timeRange === o.value}
                      onCheckedChange={() => setTimeRange(o.value)}
                      onSelect={(e) => e.preventDefault()}
                    >
                      {o.label}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Status Verifikasi */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="min-h-9 bg-white shadow-none">
                    {actionFilter === 'all' ? 'Status Verifikasi' : (STATUS_LABELS[actionFilter] ?? actionFilter)}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-52">
                  <DropdownMenuLabel>Status Verifikasi</DropdownMenuLabel>
                  {STATUS_OPTIONS.map((o) => (
                    <DropdownMenuCheckboxItem
                      key={o.value}
                      checked={actionFilter === o.value}
                      onCheckedChange={() => setActionFilter(o.value)}
                      onSelect={(e) => e.preventDefault()}
                    >
                      {o.label}
                    </DropdownMenuCheckboxItem>
                  ))}
                  {actionFilter !== 'all' && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onSelect={() => setActionFilter('all')}>Hapus filter</DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </ButtonGroup>

            <div className="relative w-64">
              <HugeiconsIcon icon={Search01Icon} size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Cari ID survei, layanan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 min-h-9 rounded-sm bg-white shadow-none"
                aria-label="Cari log verifikasi"
              />
            </div>
          </div>

          {/* Logs Table */}
          <div>
            <div className="rounded-sm border bg-white overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="border-r last:border-r-0">Waktu</TableHead>
                      <TableHead className="border-r last:border-r-0">ID Survei</TableHead>
                      <TableHead className="border-r last:border-r-0">Layanan</TableHead>
                      <TableHead className="border-r last:border-r-0">Status</TableHead>
                      <TableHead className="border-r last:border-r-0">Verifikator</TableHead>
                      <TableHead className="border-r last:border-r-0">Catatan</TableHead>
                      <TableHead className="border-r last:border-r-0">Durasi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          Memuat data...
                        </TableCell>
                      </TableRow>
                    )}
                    {isError && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-red-500">
                          Gagal memuat data. Periksa koneksi ke server.
                        </TableCell>
                      </TableRow>
                    )}
                    {!isLoading && !isError && logs.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          Tidak ada data verifikasi.
                        </TableCell>
                      </TableRow>
                    )}
                    {logs.map((log: any) => {
                      const action = log.action ?? 'SUBMITTED';
                      const actionIcon = actionIcons[action] ?? Clock01Icon;
                      const duration = log.time_taken_minutes
                        ? `${log.time_taken_minutes} menit`
                        : '-';
                      return (
                        <TableRow key={log.id} className="even:bg-muted">
                          <TableCell className="font-mono text-xs">
                            {new Date(log.timestamp).toLocaleString('id-ID')}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              <span className="font-mono font-medium">#{log.survey_id ?? log.survey}</span>
                            </div>
                          </TableCell>
                          <TableCell className="font-medium max-w-[200px] truncate">
                            {log.service_name ?? '-'}
                          </TableCell>
                          <TableCell>
                            <div
                              className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium w-fit ${
                                actionColors[action] ?? actionColors.SUBMITTED
                              }`}
                            >
                              <HugeiconsIcon icon={actionIcon} size={12} />
                              {log.action_display ?? action}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">{log.performed_by_name ?? '-'}</TableCell>
                          <TableCell className="max-w-xs truncate text-sm text-muted-foreground">
                            {log.notes || log.rejection_reason || '-'}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">{duration}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
            </div>

            {total > 0 && (
              <div className="flex items-center justify-between mt-3">
                <p className="text-sm text-muted-foreground">
                  Menampilkan {(page - 1) * PAGE_SIZE + 1}
                  {'–'}
                  {Math.min(page * PAGE_SIZE, total)} dari {total} log verifikasi
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="shadow-none rounded-sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
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
                    className="shadow-none rounded-sm"
                    onClick={() => setPage((p) => p + 1)}
                    disabled={page >= totalPages}
                  >
                    Selanjutnya
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
