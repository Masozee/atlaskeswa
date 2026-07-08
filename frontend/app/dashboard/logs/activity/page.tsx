'use client';

import { useState, useMemo, useEffect } from 'react';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ButtonGroup } from '@/components/ui/button-group';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
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
  Search01Icon,
  Download01Icon,
  AlertCircleIcon,
  InformationCircleIcon,
} from "@hugeicons/core-free-icons";
import { Separator } from '@/components/ui/separator';
import { useActivityLogs } from '@/hooks/use-logs';

const severityColors: Record<string, string> = {
  INFO: 'bg-blue-100 text-blue-800 border-blue-200',
  WARNING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  ERROR: 'bg-red-100 text-red-800 border-red-200',
  CRITICAL: 'bg-red-100 text-red-800 border-red-200',
};

const severityIcons: Record<string, typeof InformationCircleIcon> = {
  INFO: InformationCircleIcon,
  WARNING: AlertCircleIcon,
  ERROR: AlertCircleIcon,
  CRITICAL: AlertCircleIcon,
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

const SEVERITY_OPTIONS = [
  { value: 'all', label: 'Semua Severity' },
  { value: 'INFO', label: 'Info' },
  { value: 'WARNING', label: 'Peringatan' },
  { value: 'ERROR', label: 'Error' },
  { value: 'CRITICAL', label: 'Critical' },
];

const ACTION_OPTIONS = [
  { value: 'all', label: 'Semua Aksi' },
  { value: 'LOGIN', label: 'Login' },
  { value: 'LOGOUT', label: 'Logout' },
  { value: 'LOGIN_FAILED', label: 'Login Gagal' },
  { value: 'CREATE', label: 'Buat' },
  { value: 'UPDATE', label: 'Ubah' },
  { value: 'DELETE', label: 'Hapus' },
  { value: 'EXPORT', label: 'Ekspor' },
  { value: 'SURVEY_VERIFY', label: 'Verifikasi Survei' },
  { value: 'SURVEY_REJECT', label: 'Tolak Survei' },
];
const ACTION_LABELS: Record<string, string> = Object.fromEntries(
  ACTION_OPTIONS.map((o) => [o.value, o.label]),
);

const breadcrumbs = [
  { label: 'Dasbor', href: '/dashboard' },
  { label: 'Log & Pemantauan', href: '/dashboard/logs' },
  { label: 'Log Aktivitas' },
];

const PAGE_SIZE = 50;

export default function ActivityLogsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<string>('today');
  const [page, setPage] = useState(1);

  // Reset to first page whenever a filter changes
  useEffect(() => {
    setPage(1);
  }, [searchQuery, severityFilter, actionFilter, timeRange]);

  const queryParams = useMemo(() => {
    const params: Record<string, unknown> = { page, page_size: PAGE_SIZE };
    if (severityFilter !== 'all') params.severity = severityFilter;
    if (actionFilter !== 'all') params.action = actionFilter;
    if (searchQuery) params.search = searchQuery;
    const gte = getTimestampGte(timeRange);
    if (gte) params.timestamp__gte = gte;
    return params;
  }, [severityFilter, actionFilter, searchQuery, timeRange, page]);

  const { data, isLoading, isError } = useActivityLogs(queryParams);

  const logs = data?.results ?? [];
  const total = data?.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const stats = useMemo(() => ({
    total,
    INFO: logs.filter((l) => l.severity === 'INFO').length,
    WARNING: logs.filter((l) => l.severity === 'WARNING').length,
    ERROR: logs.filter((l) => l.severity === 'ERROR' || l.severity === 'CRITICAL').length,
  }), [logs, total]);

  return (
    <>
      <PageHeader breadcrumbs={breadcrumbs} />

      <div className="flex flex-1 flex-col gap-3">

        <div className="flex items-start justify-between gap-3 px-6 pt-6">
          <div>
            <h1 className="text-xl font-bold">Log Aktivitas</h1>
            <p className="text-sm text-muted-foreground">Pantau semua aktivitas pengguna dalam sistem</p>
          </div>
          <Button size="sm" className="h-9 rounded-sm shadow-none">
            <HugeiconsIcon icon={Download01Icon} size={16} className="mr-2" />
            Ekspor Log
          </Button>
        </div>

        <Separator />

        <div className="flex flex-col gap-3 px-6 pb-6">

          {/* Statistics Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="border-0 bg-white shadow-none">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Aktivitas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{total}</div>
                <p className="text-xs text-muted-foreground mt-1">Semua waktu</p>
              </CardContent>
            </Card>
            <Card className="border-0 bg-white shadow-none">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-blue-600">Info</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{stats.INFO}</div>
                <p className="text-xs text-muted-foreground mt-1">Informasi sistem</p>
              </CardContent>
            </Card>
            <Card className="border-0 bg-white shadow-none">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-yellow-600">Peringatan</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{stats.WARNING}</div>
                <p className="text-xs text-muted-foreground mt-1">Perlu perhatian</p>
              </CardContent>
            </Card>
            <Card className="border-0 bg-white shadow-none">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-red-600">Error</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{stats.ERROR}</div>
                <p className="text-xs text-muted-foreground mt-1">Aksi gagal</p>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <div className="flex gap-2 justify-between items-center">
            <ButtonGroup aria-label="Filter log aktivitas">
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

              {/* Severity */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="min-h-9 bg-white shadow-none">
                    {severityFilter === 'all' ? 'Severity' : severityFilter}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-44">
                  <DropdownMenuLabel>Tingkat Severity</DropdownMenuLabel>
                  {SEVERITY_OPTIONS.map((o) => (
                    <DropdownMenuCheckboxItem
                      key={o.value}
                      checked={severityFilter === o.value}
                      onCheckedChange={() => setSeverityFilter(o.value)}
                      onSelect={(e) => e.preventDefault()}
                    >
                      {o.label}
                    </DropdownMenuCheckboxItem>
                  ))}
                  {severityFilter !== 'all' && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onSelect={() => setSeverityFilter('all')}>Hapus filter</DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Jenis Aksi */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="min-h-9 bg-white shadow-none">
                    {actionFilter === 'all' ? 'Jenis Aksi' : (ACTION_LABELS[actionFilter] ?? actionFilter)}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="max-h-72 overflow-y-auto w-52">
                  <DropdownMenuLabel>Jenis Aksi</DropdownMenuLabel>
                  {ACTION_OPTIONS.map((o) => (
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
                placeholder="Cari pengguna, aksi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 min-h-9 rounded-sm bg-white shadow-none"
                aria-label="Cari log aktivitas"
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
                      <TableHead className="border-r last:border-r-0">Pengguna</TableHead>
                      <TableHead className="border-r last:border-r-0">Aksi</TableHead>
                      <TableHead className="border-r last:border-r-0">Model</TableHead>
                      <TableHead className="border-r last:border-r-0">Detail</TableHead>
                      <TableHead className="border-r last:border-r-0">Severity</TableHead>
                      <TableHead className="border-r last:border-r-0">Alamat IP</TableHead>
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
                          Tidak ada data aktivitas.
                        </TableCell>
                      </TableRow>
                    )}
                    {logs.map((log) => {
                      const sev = log.severity?.toUpperCase() ?? 'INFO';
                      const severityIcon = severityIcons[sev] ?? InformationCircleIcon;
                      return (
                        <TableRow key={log.id} className="even:bg-muted">
                          <TableCell className="font-mono text-xs">
                            {new Date(log.timestamp).toLocaleString('id-ID')}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium">{(log as any).user_name ?? log.username}</span>
                              <span className="text-xs text-muted-foreground">{log.username}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{log.action_display ?? log.action}</Badge>
                          </TableCell>
                          <TableCell className="font-medium">{log.model_name || '-'}</TableCell>
                          <TableCell className="max-w-xs truncate text-sm text-muted-foreground">
                            {log.description}
                          </TableCell>
                          <TableCell>
                            <div
                              className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium ${
                                severityColors[sev] ?? severityColors.INFO
                              }`}
                            >
                              <HugeiconsIcon icon={severityIcon} size={12} />
                              {sev}
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-xs text-muted-foreground">
                            {log.ip_address ?? '-'}
                          </TableCell>
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
                  {Math.min(page * PAGE_SIZE, total)} dari {total} log
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
