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
import {Edit02Icon,
  Delete02Icon,
  Add01Icon,
  Search01Icon,
  Download01Icon,
  ArrowRight01Icon,} from "@hugeicons/core-free-icons";

// Mock data change logs
const mockChangeLogs = [
  {
    id: 1,
    timestamp: '2025-12-15 14:30:00',
    user: 'Budi Santoso',
    entity: 'Service',
    entityId: 'SVC-1247',
    entityName: 'Puskesmas Semanggi',
    operation: 'UPDATE',
    field: 'total_beds',
    oldValue: '15',
    newValue: '20',
    reason: 'Update kapasitas tempat tidur sesuai renovasi',
  },
  {
    id: 2,
    timestamp: '2025-12-15 14:25:00',
    user: 'Dr. Siti Nurhaliza',
    entity: 'Service',
    entityId: 'SVC-1246',
    entityName: 'RSJD Surakarta',
    operation: 'UPDATE',
    field: 'total_staff',
    oldValue: '85',
    newValue: '92',
    reason: 'Penambahan staf psikolog dan perawat',
  },
  {
    id: 3,
    timestamp: '2025-12-15 14:15:00',
    user: 'Ahmad Rizki',
    entity: 'Service',
    entityId: 'SVC-1248',
    entityName: 'Klinik Pratama Jiwa Sehat',
    operation: 'CREATE',
    field: '-',
    oldValue: null,
    newValue: 'New Service Created',
    reason: 'Registrasi layanan baru',
  },
  {
    id: 4,
    timestamp: '2025-12-15 13:50:00',
    user: 'Budi Santoso',
    entity: 'Service',
    entityId: 'SVC-1245',
    entityName: 'Puskesmas Kratonan',
    operation: 'UPDATE',
    field: 'address',
    oldValue: 'Jl. Ahmad Dahlan No. 10',
    newValue: 'Jl. Ahmad Dahlan No. 10A, Kratonan',
    reason: 'Koreksi alamat detail',
  },
  {
    id: 5,
    timestamp: '2025-12-15 13:30:00',
    user: 'Dewi Lestari',
    entity: 'User',
    entityId: 'USR-045',
    entityName: 'eko.prasetyo@atlaskeswa.id',
    operation: 'UPDATE',
    field: 'role',
    oldValue: 'Enumerator',
    newValue: 'Verifier',
    reason: 'Promosi role pengguna',
  },
  {
    id: 6,
    timestamp: '2025-12-15 13:15:00',
    user: 'Dr. Siti Nurhaliza',
    entity: 'Service',
    entityId: 'SVC-1242',
    entityName: 'RSJ Amino Gondohutomo',
    operation: 'UPDATE',
    field: 'phone',
    oldValue: '024-6710384',
    newValue: '024-6710384, 024-6710385',
    reason: 'Penambahan nomor telepon alternatif',
  },
  {
    id: 7,
    timestamp: '2025-12-15 12:45:00',
    user: 'Ahmad Rizki',
    entity: 'Survey',
    entityId: 'SV-2025-1240',
    entityName: 'Q4 2025 Survey',
    operation: 'DELETE',
    field: '-',
    oldValue: 'Draft Survey',
    newValue: null,
    reason: 'Hapus draft duplikat',
  },
  {
    id: 8,
    timestamp: '2025-12-15 12:20:00',
    user: 'Budi Santoso',
    entity: 'Service',
    entityId: 'SVC-1241',
    entityName: 'Balai Kesehatan Jiwa Masyarakat',
    operation: 'UPDATE',
    field: 'operating_hours',
    oldValue: '08:00 - 16:00',
    newValue: '08:00 - 20:00',
    reason: 'Perpanjangan jam operasional',
  },
];

const operationColors = {
  CREATE: 'bg-green-100 text-green-800 border-green-200',
  UPDATE: 'bg-blue-100 text-blue-800 border-blue-200',
  DELETE: 'bg-red-100 text-red-800 border-red-200',
};

const operationIcons = {
  CREATE: Add01Icon,
  UPDATE: Edit02Icon,
  DELETE: Delete02Icon,
};

export default function DataChangeLogsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [operationFilter, setOperationFilter] = useState<string>('all');
  const [entityFilter, setEntityFilter] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<string>('today');

  const filteredLogs = useMemo(() => {
    return mockChangeLogs.filter((log) => {
      const matchesSearch =
        searchQuery === '' ||
        log.entityName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.field.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesOperation = operationFilter === 'all' || log.operation === operationFilter;
      const matchesEntity = entityFilter === 'all' || log.entity === entityFilter;

      return matchesSearch && matchesOperation && matchesEntity;
    });
  }, [searchQuery, operationFilter, entityFilter]);

  const stats = {
    total: mockChangeLogs.length,
    created: mockChangeLogs.filter((l) => l.operation === 'CREATE').length,
    updated: mockChangeLogs.filter((l) => l.operation === 'UPDATE').length,
    deleted: mockChangeLogs.filter((l) => l.operation === 'DELETE').length,
  };

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
              <BreadcrumbPage>Data Change Logs</BreadcrumbPage>
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
            <h1 className="text-2xl font-bold">Data Change Logs</h1>
            <p className="text-muted-foreground">
              Audit trail perubahan data dalam sistem
            </p>
          </div>
          <Button>
            <HugeiconsIcon icon={Download01Icon} size={16} className="mr-2" />
            Export Audit Trail
          </Button>
        </div>

        {/* Statistics */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Perubahan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground mt-1">Hari ini</p>
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
                  <SelectItem value="CREATE">Create</SelectItem>
                  <SelectItem value="UPDATE">Update</SelectItem>
                  <SelectItem value="DELETE">Delete</SelectItem>
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
                  <SelectItem value="Service">Service</SelectItem>
                  <SelectItem value="Survey">Survey</SelectItem>
                  <SelectItem value="User">User</SelectItem>
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
            <CardDescription>
              Menampilkan {filteredLogs.length} dari {stats.total} log perubahan
            </CardDescription>
          </CardHeader>
          <CardContent>
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
                {filteredLogs.map((log) => {
                  const operationIcon = operationIcons[log.operation as keyof typeof operationIcons];
                  return (
                    <TableRow key={log.id}>
                      <TableCell className="font-mono text-xs">{log.timestamp}</TableCell>
                      <TableCell className="text-sm">{log.user}</TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <Badge variant="outline" className="w-fit">{log.entity}</Badge>
                          <div
                            className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium w-fit ${
                              operationColors[log.operation as keyof typeof operationColors]
                            }`}
                          >
                            <HugeiconsIcon icon={operationIcon} size={12} />
                            {log.operation}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <span className="font-medium max-w-[200px] truncate">{log.entityName}</span>
                          <code className="rounded bg-muted px-2 py-0.5 text-xs w-fit">[{log.field}]</code>
                        </div>
                      </TableCell>
                      <TableCell>
                        {log.operation === 'UPDATE' ? (
                          <div className="flex items-center gap-2 text-xs">
                            <code className="rounded bg-red-50 px-2 py-1 text-red-700 max-w-[120px] truncate">
                              {log.oldValue}
                            </code>
                            <HugeiconsIcon icon={ArrowRight01Icon} size={12} className="text-muted-foreground" />
                            <code className="rounded bg-green-50 px-2 py-1 text-green-700 max-w-[120px] truncate">
                              {log.newValue}
                            </code>
                          </div>
                        ) : log.operation === 'CREATE' ? (
                          <code className="rounded bg-green-50 px-2 py-1 text-xs text-green-700">
                            {log.newValue}
                          </code>
                        ) : (
                          <code className="rounded bg-red-50 px-2 py-1 text-xs text-red-700">
                            {log.oldValue}
                          </code>
                        )}
                      </TableCell>
                      <TableCell className="max-w-[200px] text-sm text-muted-foreground">
                        <div className="line-clamp-2">{log.reason}</div>
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
