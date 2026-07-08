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
  Edit02Icon,
  Delete02Icon,
  Add01Icon,
  Search01Icon,
  Download01Icon,
  ArrowRight01Icon,
} from "@hugeicons/core-free-icons";
import { Separator } from '@/components/ui/separator';
import { useDataChangeLogs } from '@/hooks/use-logs';

const operationColors: Record<string, string> = {
  INSERT: 'bg-green-100 text-green-800 border-green-200',
  UPDATE: 'bg-blue-100 text-blue-800 border-blue-200',
  DELETE: 'bg-red-100 text-red-800 border-red-200',
  BULK_INSERT: 'bg-green-100 text-green-800 border-green-200',
  BULK_UPDATE: 'bg-blue-100 text-blue-800 border-blue-200',
  BULK_DELETE: 'bg-red-100 text-red-800 border-red-200',
};

const operationIcons: Record<string, typeof Add01Icon> = {
  INSERT: Add01Icon,
  UPDATE: Edit02Icon,
  DELETE: Delete02Icon,
  BULK_INSERT: Add01Icon,
  BULK_UPDATE: Edit02Icon,
  BULK_DELETE: Delete02Icon,
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

function formatValues(values: any): string {
  if (!values) return '-';
  if (typeof values === 'string') return values.slice(0, 80);
  return JSON.stringify(values).slice(0, 80);
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

const OPERATION_OPTIONS = [
  { value: 'INSERT', label: 'Insert' },
  { value: 'UPDATE', label: 'Update' },
  { value: 'DELETE', label: 'Delete' },
  { value: 'BULK_INSERT', label: 'Bulk Insert' },
  { value: 'BULK_UPDATE', label: 'Bulk Update' },
  { value: 'BULK_DELETE', label: 'Bulk Delete' },
];

const ENTITY_OPTIONS = [
  { value: 'service', label: 'Service' },
  { value: 'survey', label: 'Survey' },
  { value: 'user', label: 'User' },
];

const breadcrumbs = [
  { label: 'Dasbor', href: '/dashboard' },
  { label: 'Log & Pemantauan', href: '/dashboard/logs' },
  { label: 'Log Perubahan Data' },
];

const PAGE_SIZE = 50;

export default function DataChangeLogsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [operationFilter, setOperationFilter] = useState<string>('all');
  const [entityFilter, setEntityFilter] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<string>('today');
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, operationFilter, entityFilter, timeRange]);

  const queryParams = useMemo(() => {
    const params: Record<string, unknown> = { page, page_size: PAGE_SIZE };
    if (operationFilter !== 'all') params.operation = operationFilter;
    if (entityFilter !== 'all') params.model_name = entityFilter;
    if (searchQuery) params.search = searchQuery;
    const gte = getTimestampGte(timeRange);
    if (gte) params.timestamp__gte = gte;
    return params;
  }, [operationFilter, entityFilter, searchQuery, timeRange, page]);

  const { data, isLoading, isError } = useDataChangeLogs(queryParams);

  const logs = data?.results ?? [] as any[];
  const total = data?.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const stats = useMemo(() => ({
    total,
    created: logs.filter((l) => l.operation === 'INSERT' || l.operation === 'BULK_INSERT').length,
    updated: logs.filter((l) => l.operation === 'UPDATE' || l.operation === 'BULK_UPDATE').length,
    deleted: logs.filter((l) => l.operation === 'DELETE' || l.operation === 'BULK_DELETE').length,
  }), [logs, total]);

  return (
    <>
      <PageHeader breadcrumbs={breadcrumbs} />

      <div className="flex flex-1 flex-col gap-3">

        <div className="flex items-start justify-between gap-3 px-6 pt-6">
          <div>
            <h1 className="text-xl font-bold">Log Perubahan Data</h1>
            <p className="text-sm text-muted-foreground">Jejak audit perubahan data dalam sistem</p>
          </div>
          <Button size="sm" className="h-9 rounded-sm shadow-none">
            <HugeiconsIcon icon={Download01Icon} size={16} className="mr-2" />
            Ekspor Jejak Audit
          </Button>
        </div>

        <Separator />

        <div className="flex flex-col gap-3 px-6 pb-6">

          {/* Statistics */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="border-0 bg-white shadow-none">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Perubahan</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{total}</div>
                <p className="text-xs text-muted-foreground mt-1">Semua waktu</p>
              </CardContent>
            </Card>
            <Card className="border-0 bg-white shadow-none">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-green-600">Dibuat</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.created}</div>
                <p className="text-xs text-muted-foreground mt-1">Data baru</p>
              </CardContent>
            </Card>
            <Card className="border-0 bg-white shadow-none">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-blue-600">Diperbarui</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{stats.updated}</div>
                <p className="text-xs text-muted-foreground mt-1">Modifikasi data</p>
              </CardContent>
            </Card>
            <Card className="border-0 bg-white shadow-none">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-red-600">Dihapus</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{stats.deleted}</div>
                <p className="text-xs text-muted-foreground mt-1">Data terhapus</p>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <div className="flex gap-2 justify-between items-center">
            <ButtonGroup aria-label="Filter log perubahan data">
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

              {/* Jenis Operasi */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="min-h-9 bg-white shadow-none">
                    {operationFilter === 'all' ? 'Jenis Operasi' : operationFilter}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48">
                  <DropdownMenuLabel>Jenis Operasi</DropdownMenuLabel>
                  {OPERATION_OPTIONS.map((o) => (
                    <DropdownMenuCheckboxItem
                      key={o.value}
                      checked={operationFilter === o.value}
                      onCheckedChange={() => setOperationFilter(o.value)}
                      onSelect={(e) => e.preventDefault()}
                    >
                      {o.label}
                    </DropdownMenuCheckboxItem>
                  ))}
                  {operationFilter !== 'all' && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onSelect={() => setOperationFilter('all')}>Hapus filter</DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Tipe Entitas */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="min-h-9 bg-white shadow-none">
                    {entityFilter === 'all' ? 'Tipe Entitas' : entityFilter}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48">
                  <DropdownMenuLabel>Tipe Entitas</DropdownMenuLabel>
                  {ENTITY_OPTIONS.map((o) => (
                    <DropdownMenuCheckboxItem
                      key={o.value}
                      checked={entityFilter === o.value}
                      onCheckedChange={() => setEntityFilter(o.value)}
                      onSelect={(e) => e.preventDefault()}
                    >
                      {o.label}
                    </DropdownMenuCheckboxItem>
                  ))}
                  {entityFilter !== 'all' && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onSelect={() => setEntityFilter('all')}>Hapus filter</DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </ButtonGroup>

            <div className="relative w-64">
              <HugeiconsIcon icon={Search01Icon} size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Cari entitas, pengguna..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 min-h-9 rounded-sm bg-white shadow-none"
                aria-label="Cari log perubahan data"
              />
            </div>
          </div>

          {/* Change Logs Table */}
          <div>
            <div className="rounded-sm border bg-white overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="border-r last:border-r-0">Waktu</TableHead>
                      <TableHead className="border-r last:border-r-0">Pengguna</TableHead>
                      <TableHead className="border-r last:border-r-0">Entitas & Operasi</TableHead>
                      <TableHead className="border-r last:border-r-0">Nama & Field</TableHead>
                      <TableHead className="border-r last:border-r-0">Perubahan</TableHead>
                      <TableHead className="border-r last:border-r-0">Alasan</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          Memuat data...
                        </TableCell>
                      </TableRow>
                    )}
                    {isError && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-red-500">
                          Gagal memuat data. Periksa koneksi ke server.
                        </TableCell>
                      </TableRow>
                    )}
                    {!isLoading && !isError && logs.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          Tidak ada data perubahan.
                        </TableCell>
                      </TableRow>
                    )}
                    {logs.map((log: any) => {
                      const op = log.operation ?? 'UPDATE';
                      const operationIcon = operationIcons[op] ?? Edit02Icon;
                      const changedFields = Array.isArray(log.changed_fields)
                        ? log.changed_fields.join(', ')
                        : log.changed_fields ?? '-';
                      return (
                        <TableRow key={log.id} className="even:bg-muted">
                          <TableCell className="font-mono text-xs">
                            {new Date(log.timestamp).toLocaleString('id-ID')}
                          </TableCell>
                          <TableCell className="text-sm">{log.user_name ?? log.username}</TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              <Badge variant="outline" className="w-fit">{log.model_name}</Badge>
                              <div
                                className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium w-fit ${
                                  operationColors[op] ?? operationColors.UPDATE
                                }`}
                              >
                                <HugeiconsIcon icon={operationIcon} size={12} />
                                {log.operation_display ?? op}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              <span className="font-medium max-w-[200px] truncate">{log.object_repr ?? `#${log.object_id}`}</span>
                              <code className="rounded bg-muted px-2 py-0.5 text-xs w-fit max-w-[200px] truncate">[{changedFields}]</code>
                            </div>
                          </TableCell>
                          <TableCell>
                            {op === 'UPDATE' || op === 'BULK_UPDATE' ? (
                              <div className="flex items-center gap-2 text-xs">
                                <code className="rounded bg-red-50 px-2 py-1 text-red-700 max-w-[120px] truncate">
                                  {formatValues(log.old_values)}
                                </code>
                                <HugeiconsIcon icon={ArrowRight01Icon} size={12} className="text-muted-foreground" />
                                <code className="rounded bg-green-50 px-2 py-1 text-green-700 max-w-[120px] truncate">
                                  {formatValues(log.new_values)}
                                </code>
                              </div>
                            ) : op === 'INSERT' || op === 'BULK_INSERT' ? (
                              <code className="rounded bg-green-50 px-2 py-1 text-xs text-green-700">
                                Rekord baru dibuat
                              </code>
                            ) : (
                              <code className="rounded bg-red-50 px-2 py-1 text-xs text-red-700">
                                Rekord dihapus
                              </code>
                            )}
                          </TableCell>
                          <TableCell className="max-w-[200px] text-sm text-muted-foreground">
                            <div className="line-clamp-2">{log.reason || '-'}</div>
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
                  {Math.min(page * PAGE_SIZE, total)} dari {total} log perubahan
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
