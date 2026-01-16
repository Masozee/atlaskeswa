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
import {CheckmarkCircle02Icon,
  Cancel01Icon,
  Clock01Icon,
  Search01Icon,
  Download01Icon,
  ViewIcon,} from "@hugeicons/core-free-icons";

// Mock verification logs
const mockVerificationLogs = [
  {
    id: 1,
    timestamp: '2025-12-15 14:30:00',
    surveyId: 'SV-2025-1247',
    serviceName: 'RSJD Surakarta',
    province: 'Jawa Tengah',
    verifier: 'Dr. Siti Nurhaliza',
    action: 'APPROVED',
    previousStatus: 'SUBMITTED',
    newStatus: 'VERIFIED',
    notes: 'Semua data terverifikasi dengan baik. Dokumentasi lengkap.',
    duration: '15 menit',
  },
  {
    id: 2,
    timestamp: '2025-12-15 14:15:00',
    surveyId: 'SV-2025-1246',
    serviceName: 'Puskesmas Semanggi',
    province: 'Jawa Tengah',
    verifier: 'Dr. Siti Nurhaliza',
    action: 'REJECTED',
    previousStatus: 'SUBMITTED',
    newStatus: 'REJECTED',
    notes: 'Data bed capacity tidak sesuai dengan dokumentasi. Perlu perbaikan.',
    duration: '8 menit',
  },
  {
    id: 3,
    timestamp: '2025-12-15 13:45:00',
    surveyId: 'SV-2025-1245',
    serviceName: 'RSJ Prof. Dr. Soerojo Magelang',
    province: 'Jawa Tengah',
    verifier: 'Ahmad Rizki',
    action: 'APPROVED',
    previousStatus: 'SUBMITTED',
    newStatus: 'VERIFIED',
    notes: 'Verifikasi approved. Data staf medis sudah sesuai standar.',
    duration: '22 menit',
  },
  {
    id: 4,
    timestamp: '2025-12-15 13:30:00',
    surveyId: 'SV-2025-1244',
    serviceName: 'Klinik Pratama Jiwa Sehat',
    province: 'DKI Jakarta',
    verifier: 'Budi Santoso',
    action: 'PENDING',
    previousStatus: 'DRAFT',
    newStatus: 'SUBMITTED',
    notes: 'Menunggu verifikasi dokumen pendukung',
    duration: '-',
  },
  {
    id: 5,
    timestamp: '2025-12-15 12:50:00',
    surveyId: 'SV-2025-1243',
    serviceName: 'Puskesmas Kratonan',
    province: 'Jawa Tengah',
    verifier: 'Dr. Siti Nurhaliza',
    action: 'APPROVED',
    previousStatus: 'SUBMITTED',
    newStatus: 'VERIFIED',
    notes: 'Data valid dan lengkap. Approved untuk publikasi.',
    duration: '12 menit',
  },
  {
    id: 6,
    timestamp: '2025-12-15 12:20:00',
    surveyId: 'SV-2025-1242',
    serviceName: 'RSJ Amino Gondohutomo',
    province: 'Jawa Tengah',
    verifier: 'Ahmad Rizki',
    action: 'REJECTED',
    previousStatus: 'SUBMITTED',
    newStatus: 'REJECTED',
    notes: 'Koordinat GPS tidak akurat. Silakan perbaiki lokasi.',
    duration: '18 menit',
  },
  {
    id: 7,
    timestamp: '2025-12-15 11:55:00',
    surveyId: 'SV-2025-1241',
    serviceName: 'Balai Kesehatan Jiwa Masyarakat',
    province: 'Jawa Barat',
    verifier: 'Dewi Lestari',
    action: 'APPROVED',
    previousStatus: 'SUBMITTED',
    newStatus: 'VERIFIED',
    notes: 'Semua kriteria verifikasi terpenuhi.',
    duration: '25 menit',
  },
  {
    id: 8,
    timestamp: '2025-12-15 11:30:00',
    surveyId: 'SV-2025-1240',
    serviceName: 'Puskesmas Banjarsari',
    province: 'Jawa Tengah',
    verifier: 'Budi Santoso',
    action: 'PENDING',
    previousStatus: 'DRAFT',
    newStatus: 'SUBMITTED',
    notes: 'Menunggu review dari supervisor',
    duration: '-',
  },
];

const actionColors = {
  APPROVED: 'bg-green-100 text-green-800 border-green-200',
  REJECTED: 'bg-red-100 text-red-800 border-red-200',
  PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
};

const actionIcons = {
  APPROVED: CheckmarkCircle02Icon,
  REJECTED: Cancel01Icon,
  PENDING: Clock01Icon,
};

export default function VerificationLogsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [provinceFilter, setProvinceFilter] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<string>('today');

  const filteredLogs = useMemo(() => {
    return mockVerificationLogs.filter((log) => {
      const matchesSearch =
        searchQuery === '' ||
        log.surveyId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.serviceName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.verifier.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesAction = actionFilter === 'all' || log.action === actionFilter;
      const matchesProvince = provinceFilter === 'all' || log.province === provinceFilter;

      return matchesSearch && matchesAction && matchesProvince;
    });
  }, [searchQuery, actionFilter, provinceFilter]);

  const stats = {
    total: mockVerificationLogs.length,
    approved: mockVerificationLogs.filter((l) => l.action === 'APPROVED').length,
    rejected: mockVerificationLogs.filter((l) => l.action === 'REJECTED').length,
    pending: mockVerificationLogs.filter((l) => l.action === 'PENDING').length,
  };

  const approvalRate = ((stats.approved / stats.total) * 100).toFixed(1);

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
              <BreadcrumbPage>Verification Logs</BreadcrumbPage>
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
            <h1 className="text-2xl font-bold">Verification Logs</h1>
            <p className="text-muted-foreground">
              Riwayat verifikasi survei dan perubahan status
            </p>
          </div>
          <Button>
            <HugeiconsIcon icon={Download01Icon} size={16} className="mr-2" />
            Export Logs
          </Button>
        </div>

        {/* Statistics */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Verifikasi
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground mt-1">Hari ini</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-green-600">Disetujui</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
              <p className="text-xs text-muted-foreground mt-1">{approvalRate}% approval rate</p>
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
                  placeholder="Cari ID, layanan..."
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
              <Label htmlFor="status" className="text-xs text-muted-foreground mb-1.5 block">Status Verifikasi</Label>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger id="status" className="h-10 w-full">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="APPROVED">Disetujui</SelectItem>
                  <SelectItem value="REJECTED">Ditolak</SelectItem>
                  <SelectItem value="PENDING">Menunggu</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-56">
              <Label htmlFor="province" className="text-xs text-muted-foreground mb-1.5 block">Provinsi</Label>
              <Select value={provinceFilter} onValueChange={setProvinceFilter}>
                <SelectTrigger id="province" className="h-10 w-full">
                  <SelectValue placeholder="Provinsi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Provinsi</SelectItem>
                  <SelectItem value="Jawa Tengah">Jawa Tengah</SelectItem>
                  <SelectItem value="DKI Jakarta">DKI Jakarta</SelectItem>
                  <SelectItem value="Jawa Barat">Jawa Barat</SelectItem>
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
            <CardDescription>
              Menampilkan {filteredLogs.length} dari {stats.total} log verifikasi
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Waktu</TableHead>
                  <TableHead>ID Survei</TableHead>
                  <TableHead>Layanan</TableHead>
                  <TableHead>Provinsi</TableHead>
                  <TableHead>Verifikator</TableHead>
                  <TableHead>Catatan</TableHead>
                  <TableHead>Durasi</TableHead>
                  <TableHead>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map((log) => {
                  const actionIcon = actionIcons[log.action as keyof typeof actionIcons];
                  return (
                    <TableRow key={log.id}>
                      <TableCell className="font-mono text-xs">{log.timestamp}</TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <span className="font-mono font-medium">{log.surveyId}</span>
                          <div
                            className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium w-fit ${
                              actionColors[log.action as keyof typeof actionColors]
                            }`}
                          >
                            <HugeiconsIcon icon={actionIcon} size={12} />
                            {log.action === 'APPROVED'
                              ? 'Disetujui'
                              : log.action === 'REJECTED'
                              ? 'Ditolak'
                              : 'Menunggu'}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium max-w-[200px] truncate">
                        {log.serviceName}
                      </TableCell>
                      <TableCell>{log.province}</TableCell>
                      <TableCell className="text-sm">{log.verifier}</TableCell>
                      <TableCell className="max-w-xs truncate text-sm text-muted-foreground">
                        {log.notes}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{log.duration}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          <HugeiconsIcon icon={ViewIcon} size={16} />
                        </Button>
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
