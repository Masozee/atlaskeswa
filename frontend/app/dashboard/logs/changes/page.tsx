'use client';

import { useState, useMemo } from 'react';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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

const breadcrumbs = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Logs & Monitoring', href: '/dashboard/logs' },
  { label: 'Data Change Logs' },
];

export default function DataChangeLogsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [operationFilter, setOperationFilter] = useState<string>('all');
  const [entityFilter, setEntityFilter] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<string>('today');

  const queryParams = useMemo(() => {
    const params: Record<string, unknown> = { page_size: 100 };
    if (operationFilter !== 'all') params.operation = operationFilter;
    if (entityFilter !== 'all') params.model_name = entityFilter;
    if (searchQuery) params.search = searchQuery;
    const gte = getTimestampGte(timeRange);
    if (gte) params.timestamp__gte = gte;
    return params;
  }, [operationFilter, entityFilter, searchQuery, timeRange]);

  const { data, isLoading, isError } = useDataChangeLogs(queryParams);

  const logs = data?.results ?? [] as any[];
  const total = data?.count ?? 0;

  const stats = useMemo(() => ({
    total,
    created: logs.filter((l) => l.operation === 'INSERT' || l.operation === 'BULK_INSERT').length,
    updated: logs.filter((l) => l.operation === 'UPDATE' || l.operation === 'BULK_UPDATE').length,
    deleted: logs.filter((l) => l.operation === 'DELETE' || l.operation === 'BULK_DELETE').length,
  }), [logs, total]);

  return (
    <>
      <PageHeader breadcrumbs={breadcrumbs} />

      <div className="flex flex-1 flex-col gap-4">

        <div className="px-8 pt-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Data Change Logs</h1>
            <p className="text-muted-foreground">Audit trail perubahan data dalam sistem</p>
          </div>
          <Button>
            <HugeiconsIcon icon={Download01Icon} size={16} className="mr-2" />
            Export Audit Trail
          </Button>
        </div>

        <Separator />

        <div className="flex flex-col gap-4 px-8 pb-8">

          {/* Statistics */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Perubahan</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{total}</div>
                <p className="text-xs text-muted-foreground mt-1">Semua waktu</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-green-600">Dibuat</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.created}</div>
                <p className="text-xs text-muted-foreground mt-1">Data baru</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-blue-600">Diperbarui</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{stats.updated}</div>
                <p className="text-xs text-muted-foreground mt-1">Modifikasi data</p>
              </CardContent>
            </Card>
            <Card>
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
                    placeholder="Cari entitas, pengguna..."
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
                  <Label htmlFor="operation" className="text-xs text-muted-foreground mb-1.5 block">Jenis Operasi</Label>
                  <Select value={operationFilter} onValueChange={setOperationFilter}>
                    <SelectTrigger id="operation" className="h-10 w-full">
                      <SelectValue placeholder="Operasi" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Operasi</SelectItem>
                      <SelectItem value="INSERT">Insert</SelectItem>
                      <SelectItem value="UPDATE">Update</SelectItem>
                      <SelectItem value="DELETE">Delete</SelectItem>
                      <SelectItem value="BULK_INSERT">Bulk Insert</SelectItem>
                      <SelectItem value="BULK_UPDATE">Bulk Update</SelectItem>
                      <SelectItem value="BULK_DELETE">Bulk Delete</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-56">
                  <Label htmlFor="entity" className="text-xs text-muted-foreground mb-1.5 block">Tipe Entitas</Label>
                  <Select value={entityFilter} onValueChange={setEntityFilter}>
                    <SelectTrigger id="entity" className="h-10 w-full">
                      <SelectValue placeholder="Entitas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Entitas</SelectItem>
                      <SelectItem value="service">Service</SelectItem>
                      <SelectItem value="survey">Survey</SelectItem>
                      <SelectItem value="user">User</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          {/* Change Logs Table */}
          <Card>
            <CardHeader>
              <CardTitle>Riwayat Perubahan Data</CardTitle>
              <p className="text-sm text-muted-foreground">
                Menampilkan {logs.length} dari {total} log perubahan
              </p>
            </CardHeader>
            <div className="px-6 pb-6">
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Waktu</TableHead>
                      <TableHead>Pengguna</TableHead>
                      <TableHead>Entitas & Operasi</TableHead>
                      <TableHead>Nama & Field</TableHead>
                      <TableHead>Perubahan</TableHead>
                      <TableHead>Alasan</TableHead>
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
                        <TableRow key={log.id}>
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
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
