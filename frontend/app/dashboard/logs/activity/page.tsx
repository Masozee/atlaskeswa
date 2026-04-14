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
  Search01Icon,
  Download01Icon,
  CheckmarkCircle02Icon,
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

const breadcrumbs = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Logs & Monitoring', href: '/dashboard/logs' },
  { label: 'Activity Logs' },
];

export default function ActivityLogsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<string>('today');

  const queryParams = useMemo(() => {
    const params: Record<string, unknown> = { page_size: 100 };
    if (severityFilter !== 'all') params.severity = severityFilter;
    if (actionFilter !== 'all') params.action = actionFilter;
    if (searchQuery) params.search = searchQuery;
    const gte = getTimestampGte(timeRange);
    if (gte) params.timestamp__gte = gte;
    return params;
  }, [severityFilter, actionFilter, searchQuery, timeRange]);

  const { data, isLoading, isError } = useActivityLogs(queryParams);

  const logs = data?.results ?? [];
  const total = data?.count ?? 0;

  const stats = useMemo(() => ({
    total,
    INFO: logs.filter((l) => l.severity === 'INFO').length,
    WARNING: logs.filter((l) => l.severity === 'WARNING').length,
    ERROR: logs.filter((l) => l.severity === 'ERROR' || l.severity === 'CRITICAL').length,
  }), [logs, total]);

  return (
    <>
      <PageHeader breadcrumbs={breadcrumbs} />

      <div className="flex flex-1 flex-col gap-4">

        <div className="px-8 pt-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Activity Logs</h1>
            <p className="text-muted-foreground">Monitor semua aktivitas pengguna dalam sistem</p>
          </div>
          <Button>
            <HugeiconsIcon icon={Download01Icon} size={16} className="mr-2" />
            Export Logs
          </Button>
        </div>

        <Separator />

        <div className="flex flex-col gap-4 px-8 pb-8">

          {/* Statistics Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Aktivitas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{total}</div>
                <p className="text-xs text-muted-foreground mt-1">Semua waktu</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-blue-600">Info</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{stats.INFO}</div>
                <p className="text-xs text-muted-foreground mt-1">Informasi sistem</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-yellow-600">Warning</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{stats.WARNING}</div>
                <p className="text-xs text-muted-foreground mt-1">Perlu perhatian</p>
              </CardContent>
            </Card>
            <Card>
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
                    placeholder="Cari pengguna, aksi..."
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
                  <Label htmlFor="severity" className="text-xs text-muted-foreground mb-1.5 block">Tingkat Severity</Label>
                  <Select value={severityFilter} onValueChange={setSeverityFilter}>
                    <SelectTrigger id="severity" className="h-10 w-full">
                      <SelectValue placeholder="Severity" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Severity</SelectItem>
                      <SelectItem value="INFO">Info</SelectItem>
                      <SelectItem value="WARNING">Warning</SelectItem>
                      <SelectItem value="ERROR">Error</SelectItem>
                      <SelectItem value="CRITICAL">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-56">
                  <Label htmlFor="action" className="text-xs text-muted-foreground mb-1.5 block">Jenis Aksi</Label>
                  <Select value={actionFilter} onValueChange={setActionFilter}>
                    <SelectTrigger id="action" className="h-10 w-full">
                      <SelectValue placeholder="Action" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Aksi</SelectItem>
                      <SelectItem value="LOGIN">Login</SelectItem>
                      <SelectItem value="LOGOUT">Logout</SelectItem>
                      <SelectItem value="LOGIN_FAILED">Login Gagal</SelectItem>
                      <SelectItem value="CREATE">Create</SelectItem>
                      <SelectItem value="UPDATE">Update</SelectItem>
                      <SelectItem value="DELETE">Delete</SelectItem>
                      <SelectItem value="EXPORT">Export</SelectItem>
                      <SelectItem value="SURVEY_VERIFY">Verifikasi Survei</SelectItem>
                      <SelectItem value="SURVEY_REJECT">Tolak Survei</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          {/* Logs Table */}
          <Card>
            <CardHeader>
              <CardTitle>Riwayat Aktivitas</CardTitle>
              <p className="text-sm text-muted-foreground">
                Menampilkan {logs.length} dari {total} log aktivitas
              </p>
            </CardHeader>
            <div className="px-6 pb-6">
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Waktu</TableHead>
                      <TableHead>Pengguna</TableHead>
                      <TableHead>Aksi</TableHead>
                      <TableHead>Model</TableHead>
                      <TableHead>Detail</TableHead>
                      <TableHead>Severity</TableHead>
                      <TableHead>IP Address</TableHead>
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
                        <TableRow key={log.id}>
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
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
