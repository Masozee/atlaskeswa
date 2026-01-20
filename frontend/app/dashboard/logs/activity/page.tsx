'use client';

import { useState, useMemo } from 'react';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import {Activity01Icon,
  Search01Icon,
  Download01Icon,
  Calendar01Icon,
  UserIcon,
  CheckmarkCircle02Icon,
  AlertCircleIcon,
  InformationCircleIcon,} from "@hugeicons/core-free-icons";

// Mock activity logs data
const mockActivityLogs = [
  {
    id: 1,
    timestamp: '2025-12-15 14:30:45',
    user: 'Dr. Siti Nurhaliza',
    email: 'siti.nurhaliza@atlaskeswa.id',
    action: 'Login',
    resource: 'System',
    details: 'Berhasil login dari IP 192.168.1.100',
    severity: 'info',
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
  },
  {
    id: 2,
    timestamp: '2025-12-15 14:28:12',
    user: 'Ahmad Rizki',
    email: 'ahmad.rizki@atlaskeswa.id',
    action: 'Create',
    resource: 'Survey',
    details: 'Membuat survei baru: "RSJD Surakarta - Q4 2025"',
    severity: 'success',
    ipAddress: '192.168.1.105',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
  },
  {
    id: 3,
    timestamp: '2025-12-15 14:25:33',
    user: 'Budi Santoso',
    email: 'budi.santoso@atlaskeswa.id',
    action: 'Update',
    resource: 'Service',
    details: 'Memperbarui data layanan: Puskesmas Semanggi',
    severity: 'success',
    ipAddress: '192.168.1.108',
    userAgent: 'Mozilla/5.0 (X11; Linux x86_64)',
  },
  {
    id: 4,
    timestamp: '2025-12-15 14:22:18',
    user: 'Dr. Siti Nurhaliza',
    email: 'siti.nurhaliza@atlaskeswa.id',
    action: 'Verify',
    resource: 'Survey',
    details: 'Memverifikasi survei ID #1247',
    severity: 'success',
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
  },
  {
    id: 5,
    timestamp: '2025-12-15 14:20:05',
    user: 'Dewi Lestari',
    email: 'dewi.lestari@atlaskeswa.id',
    action: 'Delete',
    resource: 'Draft',
    details: 'Menghapus draft survei yang tidak terpakai',
    severity: 'warning',
    ipAddress: '192.168.1.112',
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)',
  },
  {
    id: 6,
    timestamp: '2025-12-15 14:15:42',
    user: 'System',
    email: 'system@atlaskeswa.id',
    action: 'Backup',
    resource: 'Database',
    details: 'Backup otomatis database berhasil dilakukan',
    severity: 'info',
    ipAddress: '127.0.0.1',
    userAgent: 'System Cron Job',
  },
  {
    id: 7,
    timestamp: '2025-12-15 14:12:29',
    user: 'Ahmad Rizki',
    email: 'ahmad.rizki@atlaskeswa.id',
    action: 'Export',
    resource: 'Report',
    details: 'Mengekspor laporan ketersediaan layanan (PDF)',
    severity: 'info',
    ipAddress: '192.168.1.105',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
  },
  {
    id: 8,
    timestamp: '2025-12-15 14:08:55',
    user: 'Eko Prasetyo',
    email: 'eko.prasetyo@atlaskeswa.id',
    action: 'Failed Login',
    resource: 'System',
    details: 'Percobaan login gagal - password salah',
    severity: 'error',
    ipAddress: '192.168.1.120',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
  },
  {
    id: 9,
    timestamp: '2025-12-15 14:05:33',
    user: 'Dr. Siti Nurhaliza',
    email: 'siti.nurhaliza@atlaskeswa.id',
    action: 'Update',
    resource: 'User Profile',
    details: 'Memperbarui informasi profil pengguna',
    severity: 'success',
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
  },
  {
    id: 10,
    timestamp: '2025-12-15 14:02:17',
    user: 'Budi Santoso',
    email: 'budi.santoso@atlaskeswa.id',
    action: 'Upload',
    resource: 'File',
    details: 'Mengunggah dokumen pendukung untuk survei #1245',
    severity: 'success',
    ipAddress: '192.168.1.108',
    userAgent: 'Mozilla/5.0 (X11; Linux x86_64)',
  },
];

const severityColors = {
  info: 'bg-blue-100 text-blue-800 border-blue-200',
  success: 'bg-green-100 text-green-800 border-green-200',
  warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  error: 'bg-red-100 text-red-800 border-red-200',
};

const severityIcons = {
  info: InformationCircleIcon,
  success: CheckmarkCircle02Icon,
  warning: AlertCircleIcon,
  error: AlertCircleIcon,
};

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

  const filteredLogs = useMemo(() => {
    return mockActivityLogs.filter((log) => {
      const matchesSearch =
        searchQuery === '' ||
        log.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.resource.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.details.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesSeverity = severityFilter === 'all' || log.severity === severityFilter;
      const matchesAction = actionFilter === 'all' || log.action === actionFilter;

      return matchesSearch && matchesSeverity && matchesAction;
    });
  }, [searchQuery, severityFilter, actionFilter]);

  const stats = {
    total: mockActivityLogs.length,
    info: mockActivityLogs.filter((l) => l.severity === 'info').length,
    success: mockActivityLogs.filter((l) => l.severity === 'success').length,
    warning: mockActivityLogs.filter((l) => l.severity === 'warning').length,
    error: mockActivityLogs.filter((l) => l.severity === 'error').length,
  };

  return (
    <>
      <PageHeader breadcrumbs={breadcrumbs} />

      <div className="flex flex-1 flex-col gap-4 p-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Activity Logs</h1>
            <p className="text-muted-foreground">Monitor semua aktivitas pengguna dalam sistem</p>
          </div>
          <Button>
            <HugeiconsIcon icon={Download01Icon} size={16} className="mr-2" />
            Export Logs
          </Button>
        </div>

        {/* Statistics Cards */}
        <div className="grid gap-4 md:grid-cols-5">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Aktivitas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground mt-1">Hari ini</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-blue-600">Info</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.info}</div>
              <p className="text-xs text-muted-foreground mt-1">Informasi sistem</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-green-600">Sukses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.success}</div>
              <p className="text-xs text-muted-foreground mt-1">Aksi berhasil</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-yellow-600">Peringatan</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.warning}</div>
              <p className="text-xs text-muted-foreground mt-1">Perlu perhatian</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-red-600">Error</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.error}</div>
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
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
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
                  <SelectItem value="Login">Login</SelectItem>
                  <SelectItem value="Create">Create</SelectItem>
                  <SelectItem value="Update">Update</SelectItem>
                  <SelectItem value="Delete">Delete</SelectItem>
                  <SelectItem value="Export">Export</SelectItem>
                  <SelectItem value="Verify">Verify</SelectItem>
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
            <CardDescription>
              Menampilkan {filteredLogs.length} dari {stats.total} log aktivitas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Waktu</TableHead>
                  <TableHead>Pengguna</TableHead>
                  <TableHead>Aksi</TableHead>
                  <TableHead>Resource</TableHead>
                  <TableHead>Detail</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>IP Address</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map((log) => {
                  const severityIcon = severityIcons[log.severity as keyof typeof severityIcons];
                  return (
                    <TableRow key={log.id}>
                      <TableCell className="font-mono text-xs">{log.timestamp}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{log.user}</span>
                          <span className="text-xs text-muted-foreground">{log.email}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{log.action}</Badge>
                      </TableCell>
                      <TableCell className="font-medium">{log.resource}</TableCell>
                      <TableCell className="max-w-xs truncate text-sm text-muted-foreground">
                        {log.details}
                      </TableCell>
                      <TableCell>
                        <div
                          className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium ${
                            severityColors[log.severity as keyof typeof severityColors]
                          }`}
                        >
                          <HugeiconsIcon icon={severityIcon} size={12} />
                          {log.severity.toUpperCase()}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {log.ipAddress}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
