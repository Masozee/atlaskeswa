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
  Download01Icon,
  Upload01Icon,
  CheckmarkCircle02Icon,
  Cancel01Icon,
  Clock01Icon,
  Search01Icon,
  FileDownloadIcon,
  Pdf01Icon,
  Xls01Icon,
  Csv01Icon,
} from "@hugeicons/core-free-icons";
import { Separator } from '@/components/ui/separator';
import { useImportExportLogs } from '@/hooks/use-logs';

const typeColors: Record<string, string> = {
  IMPORT: 'bg-blue-100 text-blue-800 border-blue-200',
  EXPORT: 'bg-purple-100 text-purple-800 border-purple-200',
};

const typeIcons: Record<string, typeof Upload01Icon> = {
  IMPORT: Upload01Icon,
  EXPORT: Download01Icon,
};

const statusColors: Record<string, string> = {
  COMPLETED: 'bg-green-100 text-green-800 border-green-200',
  FAILED: 'bg-red-100 text-red-800 border-red-200',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  INITIATED: 'bg-gray-100 text-gray-800 border-gray-200',
  PARTIALLY_COMPLETED: 'bg-orange-100 text-orange-800 border-orange-200',
};

const statusIcons: Record<string, typeof CheckmarkCircle02Icon> = {
  COMPLETED: CheckmarkCircle02Icon,
  FAILED: Cancel01Icon,
  IN_PROGRESS: Clock01Icon,
  INITIATED: Clock01Icon,
  PARTIALLY_COMPLETED: CheckmarkCircle02Icon,
};

const formatIcons: Record<string, typeof Pdf01Icon> = {
  PDF: Pdf01Icon,
  EXCEL: Xls01Icon,
  CSV: Csv01Icon,
};

function formatFileSize(bytes: number | null): string {
  if (!bytes) return '-';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return '-';
  return `${seconds}s`;
}

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

const TYPE_OPTIONS = [
  { value: 'IMPORT', label: 'Impor' },
  { value: 'EXPORT', label: 'Ekspor' },
];
const TYPE_LABELS: Record<string, string> = Object.fromEntries(
  TYPE_OPTIONS.map((o) => [o.value, o.label]),
);

const FORMAT_OPTIONS = [
  { value: 'PDF', label: 'PDF' },
  { value: 'EXCEL', label: 'Excel' },
  { value: 'CSV', label: 'CSV' },
  { value: 'JSON', label: 'JSON' },
];

const STATUS_OPTIONS = [
  { value: 'COMPLETED', label: 'Selesai' },
  { value: 'FAILED', label: 'Gagal' },
  { value: 'IN_PROGRESS', label: 'Sedang Berjalan' },
  { value: 'PARTIALLY_COMPLETED', label: 'Selesai Sebagian' },
];
const STATUS_LABELS: Record<string, string> = Object.fromEntries(
  STATUS_OPTIONS.map((o) => [o.value, o.label]),
);

const breadcrumbs = [
  { label: 'Dasbor', href: '/dashboard' },
  { label: 'Log & Pemantauan', href: '/dashboard/logs' },
  { label: 'Log Impor/Ekspor' },
];

const PAGE_SIZE = 50;

export default function ImportExportLogsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [formatFilter, setFormatFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<string>('today');
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, typeFilter, formatFilter, statusFilter, timeRange]);

  const queryParams = useMemo(() => {
    const params: Record<string, unknown> = { page, page_size: PAGE_SIZE };
    if (typeFilter !== 'all') params.operation = typeFilter;
    if (formatFilter !== 'all') params.file_format = formatFilter;
    if (statusFilter !== 'all') params.status = statusFilter;
    if (searchQuery) params.search = searchQuery;
    const gte = getTimestampGte(timeRange);
    if (gte) params.started_at__gte = gte;
    return params;
  }, [typeFilter, formatFilter, statusFilter, searchQuery, timeRange, page]);

  const { data, isLoading, isError } = useImportExportLogs(queryParams);

  const logs = data?.results ?? [] as any[];
  const total = data?.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const stats = useMemo(() => {
    const completed = logs.filter((l) => l.status === 'COMPLETED').length;
    const failed = logs.filter((l) => l.status === 'FAILED').length;
    return {
      total,
      imports: logs.filter((l) => l.operation === 'IMPORT').length,
      exports: logs.filter((l) => l.operation === 'EXPORT').length,
      completed,
      failed,
      totalRecords: logs.reduce((sum: number, l: any) => sum + (l.total_records ?? 0), 0),
      successRate: logs.length > 0 ? ((completed / logs.length) * 100).toFixed(1) : '0.0',
    };
  }, [logs, total]);

  return (
    <>
      <PageHeader breadcrumbs={breadcrumbs} />

      <div className="flex flex-1 flex-col gap-3">

        <div className="flex items-start justify-between gap-3 px-6 pt-6">
          <div>
            <h1 className="text-xl font-bold">Log Impor/Ekspor</h1>
            <p className="text-sm text-muted-foreground">Riwayat impor dan ekspor data</p>
          </div>
          <Button size="sm" className="h-9 rounded-sm shadow-none">
            <HugeiconsIcon icon={FileDownloadIcon} size={16} className="mr-2" />
            Ekspor Log
          </Button>
        </div>

        <Separator />

        <div className="flex flex-col gap-3 px-6 pb-6">

          {/* Statistics */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="border-0 bg-white shadow-none">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Operasi</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{total}</div>
                <p className="text-xs text-muted-foreground mt-1">Semua waktu</p>
              </CardContent>
            </Card>
            <Card className="border-0 bg-white shadow-none">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-blue-600">Impor</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{stats.imports}</div>
                <p className="text-xs text-muted-foreground mt-1">Data masuk</p>
              </CardContent>
            </Card>
            <Card className="border-0 bg-white shadow-none">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-purple-600">Ekspor</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">{stats.exports}</div>
                <p className="text-xs text-muted-foreground mt-1">Data keluar</p>
              </CardContent>
            </Card>
            <Card className="border-0 bg-white shadow-none">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-green-600">Selesai</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
                <p className="text-xs text-muted-foreground mt-1">{stats.successRate}% tingkat keberhasilan</p>
              </CardContent>
            </Card>
            <Card className="border-0 bg-white shadow-none">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-red-600">Gagal</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
                <p className="text-xs text-muted-foreground mt-1">Perlu ditinjau</p>
              </CardContent>
            </Card>
            <Card className="border-0 bg-white shadow-none">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Rekord</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalRecords}</div>
                <p className="text-xs text-muted-foreground mt-1">Rekord diproses</p>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <div className="flex gap-2 justify-between items-center">
            <ButtonGroup aria-label="Filter log impor/ekspor">
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

              {/* Tipe Operasi */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="min-h-9 bg-white shadow-none">
                    {typeFilter === 'all' ? 'Tipe Operasi' : (TYPE_LABELS[typeFilter] ?? typeFilter)}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48">
                  <DropdownMenuLabel>Tipe Operasi</DropdownMenuLabel>
                  {TYPE_OPTIONS.map((o) => (
                    <DropdownMenuCheckboxItem
                      key={o.value}
                      checked={typeFilter === o.value}
                      onCheckedChange={() => setTypeFilter(o.value)}
                      onSelect={(e) => e.preventDefault()}
                    >
                      {o.label}
                    </DropdownMenuCheckboxItem>
                  ))}
                  {typeFilter !== 'all' && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onSelect={() => setTypeFilter('all')}>Hapus filter</DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Format File */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="min-h-9 bg-white shadow-none">
                    {formatFilter === 'all' ? 'Format File' : formatFilter}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48">
                  <DropdownMenuLabel>Format File</DropdownMenuLabel>
                  {FORMAT_OPTIONS.map((o) => (
                    <DropdownMenuCheckboxItem
                      key={o.value}
                      checked={formatFilter === o.value}
                      onCheckedChange={() => setFormatFilter(o.value)}
                      onSelect={(e) => e.preventDefault()}
                    >
                      {o.label}
                    </DropdownMenuCheckboxItem>
                  ))}
                  {formatFilter !== 'all' && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onSelect={() => setFormatFilter('all')}>Hapus filter</DropdownMenuItem>
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
                <DropdownMenuContent align="start" className="w-52">
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
                placeholder="Cari file, pengguna..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 min-h-9 rounded-sm bg-white shadow-none"
                aria-label="Cari log impor/ekspor"
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
                      <TableHead className="border-r last:border-r-0">Tipe</TableHead>
                      <TableHead className="border-r last:border-r-0">Format</TableHead>
                      <TableHead className="border-r last:border-r-0">Nama File</TableHead>
                      <TableHead className="border-r last:border-r-0">Ukuran</TableHead>
                      <TableHead className="border-r last:border-r-0">Rekord</TableHead>
                      <TableHead className="border-r last:border-r-0">Status</TableHead>
                      <TableHead className="border-r last:border-r-0">Durasi</TableHead>
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
                          Tidak ada data import/export.
                        </TableCell>
                      </TableRow>
                    )}
                    {logs.map((log: any) => {
                      const op = log.operation ?? 'EXPORT';
                      const status = log.status ?? 'COMPLETED';
                      const fmt = log.file_format ?? 'CSV';
                      const typeIcon = typeIcons[op] ?? Download01Icon;
                      const statusIcon = statusIcons[status] ?? CheckmarkCircle02Icon;
                      const formatIcon = formatIcons[fmt] ?? Csv01Icon;
                      return (
                        <TableRow key={log.id} className="even:bg-muted">
                          <TableCell className="font-mono text-xs">
                            {new Date(log.started_at).toLocaleString('id-ID')}
                          </TableCell>
                          <TableCell className="text-sm">{log.user_name ?? log.username}</TableCell>
                          <TableCell>
                            <div
                              className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium ${
                                typeColors[op] ?? typeColors.EXPORT
                              }`}
                            >
                              <HugeiconsIcon icon={typeIcon} size={12} />
                              {log.operation_display ?? op}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <HugeiconsIcon icon={formatIcon} size={16} />
                              <span className="text-xs">{log.format_display ?? fmt}</span>
                            </div>
                          </TableCell>
                          <TableCell className="max-w-xs truncate font-medium">
                            {log.file_name}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatFileSize(log.file_size)}
                          </TableCell>
                          <TableCell className="text-center font-medium">{log.total_records ?? 0}</TableCell>
                          <TableCell>
                            <div
                              className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium ${
                                statusColors[status] ?? statusColors.COMPLETED
                              }`}
                            >
                              <HugeiconsIcon icon={statusIcon} size={12} />
                              {log.status_display ?? status}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatDuration(log.duration_seconds)}
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
                  {Math.min(page * PAGE_SIZE, total)} dari {total} log operasi
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
