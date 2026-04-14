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

const breadcrumbs = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Logs & Monitoring', href: '/dashboard/logs' },
  { label: 'Verification Logs' },
];

export default function VerificationLogsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<string>('today');

  const queryParams = useMemo(() => {
    const params: Record<string, unknown> = { page_size: 100 };
    if (actionFilter !== 'all') params.action = actionFilter;
    if (searchQuery) params.search = searchQuery;
    const gte = getTimestampGte(timeRange);
    if (gte) params.timestamp__gte = gte;
    return params;
  }, [actionFilter, searchQuery, timeRange]);

  const { data, isLoading, isError } = useVerificationLogs(queryParams);

  const logs = data?.results ?? [] as any[];
  const total = data?.count ?? 0;

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

      <div className="flex flex-1 flex-col gap-4">

        <div className="px-8 pt-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Verification Logs</h1>
            <p className="text-muted-foreground">Riwayat verifikasi survei dan perubahan status</p>
          </div>
          <Button>
            <HugeiconsIcon icon={Download01Icon} size={16} className="mr-2" />
            Export Logs
          </Button>
        </div>

        <Separator />

        <div className="flex flex-col gap-4 px-8 pb-8">

          {/* Statistics */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Verifikasi</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{total}</div>
                <p className="text-xs text-muted-foreground mt-1">Semua waktu</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-green-600">Disetujui</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
                <p className="text-xs text-muted-foreground mt-1">{stats.approvalRate}% approval rate</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-red-600">Ditolak</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
                <p className="text-xs text-muted-foreground mt-1">Perlu perbaikan</p>
              </CardContent>
            </Card>
            <Card>
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
                    placeholder="Cari ID survei, layanan..."
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
                  <Label htmlFor="status" className="text-xs text-muted-foreground mb-1.5 block">Status Verifikasi</Label>
                  <Select value={actionFilter} onValueChange={setActionFilter}>
                    <SelectTrigger id="status" className="h-10 w-full">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Status</SelectItem>
                      <SelectItem value="VERIFIED">Disetujui</SelectItem>
                      <SelectItem value="REJECTED">Ditolak</SelectItem>
                      <SelectItem value="SUBMITTED">Disubmit</SelectItem>
                      <SelectItem value="ASSIGNED">Ditugaskan</SelectItem>
                      <SelectItem value="REASSIGNED">Dialihkan</SelectItem>
                      <SelectItem value="RESUBMITTED">Disubmit Ulang</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          {/* Logs Table */}
          <Card>
            <CardHeader>
              <CardTitle>Riwayat Verifikasi</CardTitle>
              <p className="text-sm text-muted-foreground">
                Menampilkan {logs.length} dari {total} log verifikasi
              </p>
            </CardHeader>
            <div className="px-6 pb-6">
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Waktu</TableHead>
                      <TableHead>ID Survei</TableHead>
                      <TableHead>Layanan</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Verifikator</TableHead>
                      <TableHead>Catatan</TableHead>
                      <TableHead>Durasi</TableHead>
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
                        <TableRow key={log.id}>
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
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
