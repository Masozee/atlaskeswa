'use client';

import { useState, useMemo } from 'react';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  DropdownMenuContent,
  DropdownMenuItem,
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

const breadcrumbs = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Logs & Monitoring', href: '/dashboard/logs' },
  { label: 'System Errors' },
];

export default function SystemErrorsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [errorTypeFilter, setErrorTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<string>('today');

  const queryParams = useMemo(() => {
    const params: Record<string, unknown> = { page_size: 100 };
    if (levelFilter !== 'all') params.severity = levelFilter;
    if (errorTypeFilter !== 'all') params.error_type = errorTypeFilter;
    if (statusFilter === 'resolved') params.is_resolved = true;
    if (statusFilter === 'unresolved') params.is_resolved = false;
    if (searchQuery) params.search = searchQuery;
    const gte = getTimestampGte(timeRange);
    if (gte) params.timestamp__gte = gte;
    return params;
  }, [levelFilter, errorTypeFilter, statusFilter, searchQuery, timeRange]);

  const { data, isLoading, isError, refetch } = useSystemErrors(queryParams);

  const logs = data?.results ?? [];
  const total = data?.count ?? 0;

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

      <div className="flex flex-1 flex-col gap-4">

        <div className="px-8 pt-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">System Errors</h1>
            <p className="text-muted-foreground">Monitor error dan warning dalam sistem</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => refetch()}>
              <HugeiconsIcon icon={RefreshIcon} size={16} className="mr-2" />
              Refresh
            </Button>
            <Button>
              <HugeiconsIcon icon={Download01Icon} size={16} className="mr-2" />
              Export Logs
            </Button>
          </div>
        </div>

        <Separator />

        <div className="flex flex-col gap-4 px-8 pb-8">

          {/* Statistics */}
          <div className="grid gap-4 md:grid-cols-5">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Logs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{total}</div>
                <p className="text-xs text-muted-foreground mt-1">Semua waktu</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-red-600">Errors</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{stats.errors}</div>
                <p className="text-xs text-muted-foreground mt-1">Perlu penanganan</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-yellow-600">Warnings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{stats.warnings}</div>
                <p className="text-xs text-muted-foreground mt-1">Perlu perhatian</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-green-600">Resolved</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.resolved}</div>
                <p className="text-xs text-muted-foreground mt-1">Sudah ditangani</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-orange-600">Unresolved</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{stats.unresolved}</div>
                <p className="text-xs text-muted-foreground mt-1">Belum ditangani</p>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-3">
            <div className="flex items-center rounded-md border">
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="h-10 w-44 border-0 rounded-r-none">
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
              <div className="w-px h-5 bg-border" />
              <Select value={levelFilter} onValueChange={setLevelFilter}>
                <SelectTrigger className="h-10 w-36 border-0 rounded-none">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Level</SelectItem>
                  <SelectItem value="ERROR">Error</SelectItem>
                  <SelectItem value="CRITICAL">Critical</SelectItem>
                  <SelectItem value="WARNING">Warning</SelectItem>
                  <SelectItem value="INFO">Info</SelectItem>
                  <SelectItem value="DEBUG">Debug</SelectItem>
                </SelectContent>
              </Select>
              <div className="w-px h-5 bg-border" />
              <Select value={errorTypeFilter} onValueChange={setErrorTypeFilter}>
                <SelectTrigger className="h-10 w-44 border-0 rounded-none">
                  <SelectValue placeholder="All Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Type</SelectItem>
                  <SelectItem value="DATABASE">Database</SelectItem>
                  <SelectItem value="API">API</SelectItem>
                  <SelectItem value="AUTHENTICATION">Authentication</SelectItem>
                  <SelectItem value="VALIDATION">Validation</SelectItem>
                  <SelectItem value="PERMISSION">Permission</SelectItem>
                  <SelectItem value="FILE_SYSTEM">File System</SelectItem>
                  <SelectItem value="EXTERNAL_SERVICE">External Service</SelectItem>
                  <SelectItem value="RUNTIME">Runtime</SelectItem>
                </SelectContent>
              </Select>
              <div className="w-px h-5 bg-border" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-10 w-36 border-0 rounded-l-none">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="unresolved">Unresolved</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-px h-5 bg-border" />
            <div className="relative flex-1 max-w-md">
              <HugeiconsIcon icon={Search01Icon} size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Cari error, endpoint..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-10"
              />
            </div>
          </div>

          {/* Error Logs Table */}
          <Card>
            <CardHeader>
              <CardTitle>System Error Logs</CardTitle>
              <p className="text-sm text-muted-foreground">
                Menampilkan {logs.length} dari {total} error logs
              </p>
            </CardHeader>
            <div className="px-6 pb-6">
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Waktu</TableHead>
                      <TableHead>Level</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Error Message</TableHead>
                      <TableHead>Endpoint</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Aksi</TableHead>
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
                        <TableRow key={log.id}>
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
                                Resolved
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="border-red-300 text-red-700 bg-red-50">
                                Unresolved
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <HugeiconsIcon icon={MoreHorizontalIcon} size={16} />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>
                                  <HugeiconsIcon icon={CodeIcon} size={16} className="mr-2" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => navigator.clipboard.writeText(log.error_message)}
                                >
                                  <HugeiconsIcon icon={Copy01Icon} size={16} className="mr-2" />
                                  Copy Error Message
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
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
