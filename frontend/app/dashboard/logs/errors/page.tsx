'use client';

import { useState, useMemo, useEffect } from 'react';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ButtonGroup } from '@/components/ui/button-group';
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
  AlertCircleIcon,
  Alert02Icon,
  InformationCircleIcon,
  Search01Icon,
  Download01Icon,
  CodeIcon,
  RefreshIcon,
  MoreHorizontalIcon,
  Copy01Icon,
} from "@hugeicons/core-free-icons";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { useSystemErrors } from '@/hooks/use-logs';

const levelColors: Record<string, string> = {
  ERROR: 'bg-red-100 text-red-800 border-red-200',
  WARNING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  INFO: 'bg-blue-100 text-blue-800 border-blue-200',
  CRITICAL: 'bg-red-100 text-red-800 border-red-200',
  DEBUG: 'bg-gray-100 text-gray-800 border-gray-200',
};

const levelIcons: Record<string, typeof AlertCircleIcon> = {
  ERROR: AlertCircleIcon,
  WARNING: Alert02Icon,
  INFO: InformationCircleIcon,
  CRITICAL: AlertCircleIcon,
  DEBUG: InformationCircleIcon,
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

const LEVEL_OPTIONS = [
  { value: 'ERROR', label: 'Error' },
  { value: 'CRITICAL', label: 'Critical' },
  { value: 'WARNING', label: 'Warning' },
  { value: 'INFO', label: 'Info' },
  { value: 'DEBUG', label: 'Debug' },
];

const ERROR_TYPE_OPTIONS = [
  { value: 'DATABASE', label: 'Database' },
  { value: 'API', label: 'API' },
  { value: 'AUTHENTICATION', label: 'Autentikasi' },
  { value: 'VALIDATION', label: 'Validasi' },
  { value: 'PERMISSION', label: 'Izin' },
  { value: 'FILE_SYSTEM', label: 'Sistem File' },
  { value: 'EXTERNAL_SERVICE', label: 'Layanan Eksternal' },
  { value: 'RUNTIME', label: 'Runtime' },
];
const ERROR_TYPE_LABELS: Record<string, string> = Object.fromEntries(
  ERROR_TYPE_OPTIONS.map((o) => [o.value, o.label]),
);

const STATUS_OPTIONS = [
  { value: 'resolved', label: 'Terselesaikan' },
  { value: 'unresolved', label: 'Belum Selesai' },
];
const STATUS_LABELS: Record<string, string> = Object.fromEntries(
  STATUS_OPTIONS.map((o) => [o.value, o.label]),
);

const breadcrumbs = [
  { label: 'Dasbor', href: '/dashboard' },
  { label: 'Log & Pemantauan', href: '/dashboard/logs' },
  { label: 'Error Sistem' },
];

const PAGE_SIZE = 50;

export default function SystemErrorsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [errorTypeFilter, setErrorTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<string>('today');
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, levelFilter, errorTypeFilter, statusFilter, timeRange]);

  const queryParams = useMemo(() => {
    const params: Record<string, unknown> = { page, page_size: PAGE_SIZE };
    if (levelFilter !== 'all') params.severity = levelFilter;
    if (errorTypeFilter !== 'all') params.error_type = errorTypeFilter;
    if (statusFilter === 'resolved') params.is_resolved = true;
    if (statusFilter === 'unresolved') params.is_resolved = false;
    if (searchQuery) params.search = searchQuery;
    const gte = getTimestampGte(timeRange);
    if (gte) params.timestamp__gte = gte;
    return params;
  }, [levelFilter, errorTypeFilter, statusFilter, searchQuery, timeRange, page]);

  const { data, isLoading, isError, refetch } = useSystemErrors(queryParams);

  const logs = data?.results ?? [];
  const total = data?.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const stats = useMemo(() => ({
    total,
    errors: logs.filter((l) => l.severity === 'ERROR' || l.severity === 'CRITICAL').length,
    warnings: logs.filter((l) => l.severity === 'WARNING').length,
    resolved: logs.filter((l) => l.is_resolved).length,
    unresolved: logs.filter((l) => !l.is_resolved).length,
  }), [logs, total]);

  return (
    <>
      <PageHeader breadcrumbs={breadcrumbs} />

      <div className="flex flex-1 flex-col gap-3">

        <div className="flex items-start justify-between gap-3 px-6 pt-6">
          <div>
            <h1 className="text-xl font-bold">Error Sistem</h1>
            <p className="text-sm text-muted-foreground">Pantau error dan peringatan dalam sistem</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="h-9 rounded-sm shadow-none" onClick={() => refetch()}>
              <HugeiconsIcon icon={RefreshIcon} size={16} className="mr-2" />
              Muat Ulang
            </Button>
            <Button size="sm" className="h-9 rounded-sm shadow-none">
              <HugeiconsIcon icon={Download01Icon} size={16} className="mr-2" />
              Ekspor Log
            </Button>
          </div>
        </div>

        <Separator />

        <div className="flex flex-col gap-3 px-6 pb-6">

          {/* Statistics */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="border-0 bg-white shadow-none">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Log</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{total}</div>
                <p className="text-xs text-muted-foreground mt-1">Semua waktu</p>
              </CardContent>
            </Card>
            <Card className="border-0 bg-white shadow-none">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-red-600">Error</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{stats.errors}</div>
                <p className="text-xs text-muted-foreground mt-1">Perlu penanganan</p>
              </CardContent>
            </Card>
            <Card className="border-0 bg-white shadow-none">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-yellow-600">Peringatan</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{stats.warnings}</div>
                <p className="text-xs text-muted-foreground mt-1">Perlu perhatian</p>
              </CardContent>
            </Card>
            <Card className="border-0 bg-white shadow-none">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-green-600">Terselesaikan</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.resolved}</div>
                <p className="text-xs text-muted-foreground mt-1">Sudah ditangani</p>
              </CardContent>
            </Card>
            <Card className="border-0 bg-white shadow-none">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-orange-600">Belum Selesai</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{stats.unresolved}</div>
                <p className="text-xs text-muted-foreground mt-1">Belum ditangani</p>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <div className="flex gap-2 justify-between items-center">
            <ButtonGroup aria-label="Filter error sistem">
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

              {/* Level */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="min-h-9 bg-white shadow-none">
                    {levelFilter === 'all' ? 'Level' : levelFilter}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-44">
                  <DropdownMenuLabel>Level</DropdownMenuLabel>
                  {LEVEL_OPTIONS.map((o) => (
                    <DropdownMenuCheckboxItem
                      key={o.value}
                      checked={levelFilter === o.value}
                      onCheckedChange={() => setLevelFilter(o.value)}
                      onSelect={(e) => e.preventDefault()}
                    >
                      {o.label}
                    </DropdownMenuCheckboxItem>
                  ))}
                  {levelFilter !== 'all' && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onSelect={() => setLevelFilter('all')}>Hapus filter</DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Tipe Error */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="min-h-9 bg-white shadow-none">
                    {errorTypeFilter === 'all' ? 'Tipe Error' : (ERROR_TYPE_LABELS[errorTypeFilter] ?? errorTypeFilter)}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-52">
                  <DropdownMenuLabel>Tipe Error</DropdownMenuLabel>
                  {ERROR_TYPE_OPTIONS.map((o) => (
                    <DropdownMenuCheckboxItem
                      key={o.value}
                      checked={errorTypeFilter === o.value}
                      onCheckedChange={() => setErrorTypeFilter(o.value)}
                      onSelect={(e) => e.preventDefault()}
                    >
                      {o.label}
                    </DropdownMenuCheckboxItem>
                  ))}
                  {errorTypeFilter !== 'all' && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onSelect={() => setErrorTypeFilter('all')}>Hapus filter</DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Status */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="min-h-9 bg-white shadow-none">
                    {statusFilter === 'all' ? 'Status' : (STATUS_LABELS[statusFilter] ?? statusFilter)}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-44">
                  <DropdownMenuLabel>Status</DropdownMenuLabel>
                  {STATUS_OPTIONS.map((o) => (
                    <DropdownMenuCheckboxItem
                      key={o.value}
                      checked={statusFilter === o.value}
                      onCheckedChange={() => setStatusFilter(o.value)}
                      onSelect={(e) => e.preventDefault()}
                    >
                      {o.label}
                    </DropdownMenuCheckboxItem>
                  ))}
                  {statusFilter !== 'all' && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onSelect={() => setStatusFilter('all')}>Hapus filter</DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </ButtonGroup>

            <div className="relative w-64">
              <HugeiconsIcon icon={Search01Icon} size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Cari error, endpoint..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 min-h-9 rounded-sm bg-white shadow-none"
                aria-label="Cari error sistem"
              />
            </div>
          </div>

          {/* Error Logs Table */}
          <div>
            <div className="rounded-sm border bg-white overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="border-r last:border-r-0">Waktu</TableHead>
                      <TableHead className="border-r last:border-r-0">Level</TableHead>
                      <TableHead className="border-r last:border-r-0">Tipe</TableHead>
                      <TableHead className="border-r last:border-r-0">Pesan Error</TableHead>
                      <TableHead className="border-r last:border-r-0">Endpoint</TableHead>
                      <TableHead className="border-r last:border-r-0">Kode</TableHead>
                      <TableHead className="border-r last:border-r-0">Pengguna</TableHead>
                      <TableHead className="border-r last:border-r-0">Status</TableHead>
                      <TableHead className="border-r last:border-r-0">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading && (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                          Memuat data...
                        </TableCell>
                      </TableRow>
                    )}
                    {isError && (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-8 text-red-500">
                          Gagal memuat data. Periksa koneksi ke server.
                        </TableCell>
                      </TableRow>
                    )}
                    {!isLoading && !isError && logs.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                          Tidak ada data error.
                        </TableCell>
                      </TableRow>
                    )}
                    {logs.map((log) => {
                      const sev = log.severity?.toUpperCase() ?? 'ERROR';
                      const levelIcon = levelIcons[sev] ?? AlertCircleIcon;
                      return (
                        <TableRow key={log.id} className="even:bg-muted">
                          <TableCell className="font-mono text-xs">
                            {new Date(log.timestamp).toLocaleString('id-ID')}
                          </TableCell>
                          <TableCell>
                            <div
                              className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium ${
                                levelColors[sev] ?? levelColors.ERROR
                              }`}
                            >
                              <HugeiconsIcon icon={levelIcon} size={12} />
                              {sev}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">{(log as any).error_type_display ?? log.error_type}</TableCell>
                          <TableCell className="max-w-xs">
                            <div className="font-medium">{log.error_message}</div>
                            {log.stack_trace && (
                              <div className="text-xs text-muted-foreground mt-1 truncate">{log.stack_trace}</div>
                            )}
                          </TableCell>
                          <TableCell className="font-mono text-xs max-w-[200px] truncate">
                            {(log as any).request_path ?? log.endpoint ?? '-'}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{log.error_code ?? '-'}</Badge>
                          </TableCell>
                          <TableCell className="text-sm">{(log as any).user_name ?? (log as any).username ?? '-'}</TableCell>
                          <TableCell>
                            {log.is_resolved ? (
                              <Badge variant="outline" className="border-green-300 text-green-700 bg-green-50">
                                Terselesaikan
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="border-red-300 text-red-700 bg-red-50">
                                Belum Selesai
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" className="h-8 w-8 p-0 rounded-sm">
                                  <HugeiconsIcon icon={MoreHorizontalIcon} size={16} />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>
                                  <HugeiconsIcon icon={CodeIcon} size={16} className="mr-2" />
                                  Lihat Detail
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => navigator.clipboard.writeText(log.error_message)}
                                >
                                  <HugeiconsIcon icon={Copy01Icon} size={16} className="mr-2" />
                                  Salin Pesan Error
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
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
                  {Math.min(page * PAGE_SIZE, total)} dari {total} log error
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
