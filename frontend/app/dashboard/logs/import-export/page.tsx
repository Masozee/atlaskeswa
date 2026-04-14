'use client';

import { useState, useMemo } from 'react';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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

const breadcrumbs = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Logs & Monitoring', href: '/dashboard/logs' },
  { label: 'Import/Export Logs' },
];

export default function ImportExportLogsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [formatFilter, setFormatFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<string>('today');

  const queryParams = useMemo(() => {
    const params: Record<string, unknown> = { page_size: 100 };
    if (typeFilter !== 'all') params.operation = typeFilter;
    if (formatFilter !== 'all') params.file_format = formatFilter;
    if (statusFilter !== 'all') params.status = statusFilter;
    if (searchQuery) params.search = searchQuery;
    const gte = getTimestampGte(timeRange);
    if (gte) params.started_at__gte = gte;
    return params;
  }, [typeFilter, formatFilter, statusFilter, searchQuery, timeRange]);

  const { data, isLoading, isError } = useImportExportLogs(queryParams);

  const logs = data?.results ?? [] as any[];
  const total = data?.count ?? 0;

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

      <div className="flex flex-1 flex-col gap-4">

        <div className="px-8 pt-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Import/Export Logs</h1>
            <p className="text-muted-foreground">Riwayat import dan export data</p>
          </div>
          <Button>
            <HugeiconsIcon icon={FileDownloadIcon} size={16} className="mr-2" />
            Export Logs
          </Button>
        </div>

        <Separator />

        <div className="flex flex-col gap-4 px-8 pb-8">

          {/* Statistics */}
          <div className="grid gap-4 md:grid-cols-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Operasi</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{total}</div>
                <p className="text-xs text-muted-foreground mt-1">Semua waktu</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-blue-600">Imports</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{stats.imports}</div>
                <p className="text-xs text-muted-foreground mt-1">Data masuk</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-purple-600">Exports</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">{stats.exports}</div>
                <p className="text-xs text-muted-foreground mt-1">Data keluar</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-green-600">Completed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
                <p className="text-xs text-muted-foreground mt-1">{stats.successRate}% success rate</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-red-600">Failed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
                <p className="text-xs text-muted-foreground mt-1">Perlu review</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Records</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalRecords}</div>
                <p className="text-xs text-muted-foreground mt-1">Records diproses</p>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <div className="space-y-3">
            <div>
              <h3 className="text-sm font-medium">Filter & Pencarian</h3>
              <p className="text-xs text-muted-foreground">Gunakan filter di bawah untuk mempersempit hasil pencarian</p>
            </div>
            <div className="flex items-end justify-between gap-4">
              <div className="flex-1 max-w-md">
                <Label htmlFor="search" className="text-xs text-muted-foreground mb-1.5 block">Pencarian</Label>
                <div className="relative">
                  <HugeiconsIcon icon={Search01Icon} size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Cari file, pengguna..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-10"
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-56">
                  <Label htmlFor="timeRange" className="text-xs text-muted-foreground mb-1.5 block">Rentang Waktu</Label>
                  <Select value={timeRange} onValueChange={setTimeRange}>
                    <SelectTrigger id="timeRange" className="h-10 w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="today">Hari Ini</SelectItem>
                      <SelectItem value="yesterday">Kemarin</SelectItem>
                      <SelectItem value="week">7 Hari Terakhir</SelectItem>
                      <SelectItem value="month">30 Hari Terakhir</SelectItem>
                      <SelectItem value="all">Semua Waktu</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-56">
                  <Label htmlFor="type" className="text-xs text-muted-foreground mb-1.5 block">Tipe Operasi</Label>
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger id="type" className="h-10 w-full">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Type</SelectItem>
                      <SelectItem value="IMPORT">Import</SelectItem>
                      <SelectItem value="EXPORT">Export</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-56">
                  <Label htmlFor="format" className="text-xs text-muted-foreground mb-1.5 block">Format File</Label>
                  <Select value={formatFilter} onValueChange={setFormatFilter}>
                    <SelectTrigger id="format" className="h-10 w-full">
                      <SelectValue placeholder="Format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Format</SelectItem>
                      <SelectItem value="PDF">PDF</SelectItem>
                      <SelectItem value="EXCEL">Excel</SelectItem>
                      <SelectItem value="CSV">CSV</SelectItem>
                      <SelectItem value="JSON">JSON</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-56">
                  <Label htmlFor="status" className="text-xs text-muted-foreground mb-1.5 block">Status</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger id="status" className="h-10 w-full">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Status</SelectItem>
                      <SelectItem value="COMPLETED">Completed</SelectItem>
                      <SelectItem value="FAILED">Failed</SelectItem>
                      <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                      <SelectItem value="PARTIALLY_COMPLETED">Partially Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          {/* Logs Table */}
          <Card>
            <CardHeader>
              <CardTitle>Riwayat Import/Export</CardTitle>
              <p className="text-sm text-muted-foreground">
                Menampilkan {logs.length} dari {total} log operasi
              </p>
            </CardHeader>
            <div className="px-6 pb-6">
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Waktu</TableHead>
                      <TableHead>Pengguna</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Format</TableHead>
                      <TableHead>Nama File</TableHead>
                      <TableHead>Size</TableHead>
                      <TableHead>Records</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Durasi</TableHead>
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
                        <TableRow key={log.id}>
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
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
