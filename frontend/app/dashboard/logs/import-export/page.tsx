'use client';

import { useState, useMemo } from 'react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { DateTime } from '@/components/date-time';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
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
import {Download01Icon,
  Upload01Icon,
  CheckmarkCircle02Icon,
  Cancel01Icon,
  Clock01Icon,
  Search01Icon,
  FileDownloadIcon,
  Pdf01Icon,
  Xls01Icon,
  Csv01Icon,} from "@hugeicons/core-free-icons";

// Mock import/export logs
const mockLogs = [
  {
    id: 1,
    timestamp: '2025-12-15 14:30:00',
    user: 'Ahmad Rizki',
    type: 'EXPORT',
    format: 'PDF',
    fileName: 'laporan-ketersediaan-layanan-2025-12-15.pdf',
    fileSize: '2.4 MB',
    recordCount: 30,
    status: 'COMPLETED',
    duration: '3.2s',
    filters: 'Provinsi: All, Status: Verified',
  },
  {
    id: 2,
    timestamp: '2025-12-15 14:15:00',
    user: 'Dr. Siti Nurhaliza',
    type: 'EXPORT',
    format: 'EXCEL',
    fileName: 'data-layanan-jawa-tengah.xlsx',
    fileSize: '1.8 MB',
    recordCount: 145,
    status: 'COMPLETED',
    duration: '2.1s',
    filters: 'Provinsi: Jawa Tengah',
  },
  {
    id: 3,
    timestamp: '2025-12-15 13:45:00',
    user: 'Budi Santoso',
    type: 'IMPORT',
    format: 'CSV',
    fileName: 'bulk-survey-update.csv',
    fileSize: '850 KB',
    recordCount: 52,
    status: 'COMPLETED',
    duration: '15.8s',
    filters: '-',
  },
  {
    id: 4,
    timestamp: '2025-12-15 13:30:00',
    user: 'Dewi Lestari',
    type: 'EXPORT',
    format: 'CSV',
    fileName: 'mtc-distribution-report.csv',
    fileSize: '650 KB',
    recordCount: 120,
    status: 'COMPLETED',
    duration: '1.5s',
    filters: 'MTC: All',
  },
  {
    id: 5,
    timestamp: '2025-12-15 13:10:00',
    user: 'Ahmad Rizki',
    type: 'IMPORT',
    format: 'EXCEL',
    fileName: 'new-services-batch-1.xlsx',
    fileSize: '1.2 MB',
    recordCount: 28,
    status: 'FAILED',
    duration: '8.2s',
    filters: '-',
    error: '5 records failed validation: Invalid coordinates',
  },
  {
    id: 6,
    timestamp: '2025-12-15 12:55:00',
    user: 'System Cron',
    type: 'EXPORT',
    format: 'PDF',
    fileName: 'automated-monthly-report-december-2025.pdf',
    fileSize: '4.2 MB',
    recordCount: 250,
    status: 'COMPLETED',
    duration: '12.5s',
    filters: 'Automated monthly report',
  },
  {
    id: 7,
    timestamp: '2025-12-15 12:30:00',
    user: 'Budi Santoso',
    type: 'EXPORT',
    format: 'EXCEL',
    fileName: 'workforce-capacity-data.xlsx',
    fileSize: '2.1 MB',
    recordCount: 180,
    status: 'COMPLETED',
    duration: '4.8s',
    filters: 'Provinsi: All, MTC: All',
  },
  {
    id: 8,
    timestamp: '2025-12-15 12:05:00',
    user: 'Dr. Siti Nurhaliza',
    type: 'IMPORT',
    format: 'CSV',
    fileName: 'verification-updates.csv',
    fileSize: '425 KB',
    recordCount: 35,
    status: 'IN_PROGRESS',
    duration: '-',
    filters: '-',
  },
];

const typeColors = {
  IMPORT: 'bg-blue-100 text-blue-800 border-blue-200',
  EXPORT: 'bg-purple-100 text-purple-800 border-purple-200',
};

const typeIcons = {
  IMPORT: Upload01Icon,
  EXPORT: Download01Icon,
};

const statusColors = {
  COMPLETED: 'bg-green-100 text-green-800 border-green-200',
  FAILED: 'bg-red-100 text-red-800 border-red-200',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-800 border-yellow-200',
};

const statusIcons = {
  COMPLETED: CheckmarkCircle02Icon,
  FAILED: Cancel01Icon,
  IN_PROGRESS: Clock01Icon,
};

const formatIcons = {
  PDF: Pdf01Icon,
  EXCEL: Xls01Icon,
  CSV: Csv01Icon,
};

export default function ImportExportLogsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [formatFilter, setFormatFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<string>('today');

  const filteredLogs = useMemo(() => {
    return mockLogs.filter((log) => {
      const matchesSearch =
        searchQuery === '' ||
        log.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.user.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesType = typeFilter === 'all' || log.type === typeFilter;
      const matchesFormat = formatFilter === 'all' || log.format === formatFilter;
      const matchesStatus = statusFilter === 'all' || log.status === statusFilter;

      return matchesSearch && matchesType && matchesFormat && matchesStatus;
    });
  }, [searchQuery, typeFilter, formatFilter, statusFilter]);

  const stats = {
    total: mockLogs.length,
    imports: mockLogs.filter((l) => l.type === 'IMPORT').length,
    exports: mockLogs.filter((l) => l.type === 'EXPORT').length,
    completed: mockLogs.filter((l) => l.status === 'COMPLETED').length,
    failed: mockLogs.filter((l) => l.status === 'FAILED').length,
    totalRecords: mockLogs.reduce((sum, log) => sum + log.recordCount, 0),
  };

  const successRate = ((stats.completed / stats.total) * 100).toFixed(1);

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard/logs">Logs & Monitoring</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Import/Export Logs</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="ml-auto">
          <DateTime />
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Import/Export Logs</h1>
            <p className="text-muted-foreground">
              Riwayat import dan export data
            </p>
          </div>
          <Button>
            <HugeiconsIcon icon={FileDownloadIcon} size={16} className="mr-2" />
            Export Logs
          </Button>
        </div>

        {/* Statistics */}
        <div className="grid gap-4 md:grid-cols-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Operasi
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground mt-1">Hari ini</p>
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
              <p className="text-xs text-muted-foreground mt-1">{successRate}% success rate</p>
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
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Records
              </CardTitle>
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
            <CardDescription>
              Menampilkan {filteredLogs.length} dari {stats.total} log operasi
            </CardDescription>
          </CardHeader>
          <CardContent>
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
                  <TableHead>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map((log) => {
                  const typeIcon = typeIcons[log.type as keyof typeof typeIcons];
                  const statusIcon = statusIcons[log.status as keyof typeof statusIcons];
                  const formatIcon = formatIcons[log.format as keyof typeof formatIcons];
                  return (
                    <TableRow key={log.id}>
                      <TableCell className="font-mono text-xs">{log.timestamp}</TableCell>
                      <TableCell className="text-sm">{log.user}</TableCell>
                      <TableCell>
                        <div
                          className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium ${
                            typeColors[log.type as keyof typeof typeColors]
                          }`}
                        >
                          <HugeiconsIcon icon={typeIcon} size={12} />
                          {log.type}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <HugeiconsIcon icon={formatIcon} size={16} />
                          <span className="text-xs">{log.format}</span>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs truncate font-medium">
                        {log.fileName}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{log.fileSize}</TableCell>
                      <TableCell className="text-center font-medium">{log.recordCount}</TableCell>
                      <TableCell>
                        <div
                          className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium ${
                            statusColors[log.status as keyof typeof statusColors]
                          }`}
                        >
                          <HugeiconsIcon icon={statusIcon} size={12} />
                          {log.status === 'COMPLETED'
                            ? 'Selesai'
                            : log.status === 'FAILED'
                            ? 'Gagal'
                            : 'Proses'}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{log.duration}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          <HugeiconsIcon icon={Download01Icon} size={16} />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Active Operations */}
        {mockLogs.some((log) => log.status === 'IN_PROGRESS') && (
          <Card>
            <CardHeader>
              <CardTitle>Operasi Sedang Berjalan</CardTitle>
              <CardDescription>Proses import/export yang sedang berlangsung</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {mockLogs
                .filter((log) => log.status === 'IN_PROGRESS')
                .map((log) => (
                  <div key={log.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <HugeiconsIcon icon={Clock01Icon} size={16} className="text-yello" />
                        <span className="font-medium">{log.fileName}</span>
                      </div>
                      <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                        In Progress
                      </Badge>
                    </div>
                    <Progress value={65} className="h-2" />
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>Processing {log.recordCount} records...</span>
                      <span>65%</span>
                    </div>
                  </div>
                ))}
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
