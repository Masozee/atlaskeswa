'use client';

import { Fragment, useMemo } from 'react';
import { useUserStats } from '@/hooks/use-users';
import { PageHeader } from "@/components/page-header";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { HugeiconsIcon } from "@hugeicons/react";
import { Tick01Icon, Cancel01Icon } from "@hugeicons/core-free-icons";
import { Separator } from '@/components/ui/separator';

const roles = [
  {
    code: 'ADMIN',
    name: 'Administrator',
    description: 'Akses penuh ke sistem dengan semua izin',
    permissions: {
      'User Management': true,
      'Create Users': true,
      'Edit Users': true,
      'Delete Users': true,
      'View Users': true,
      'Service Management': true,
      'Create Services': true,
      'Edit Services': true,
      'Delete Services': true,
      'View Services': true,
      'Survey Management': true,
      'Create Surveys': true,
      'Edit Surveys': true,
      'Delete Surveys': true,
      'View Surveys': true,
      'Verify Surveys': true,
      'Analytics Access': true,
      'View Analytics': true,
      'Export Data': true,
    },
  },
  {
    code: 'SURVEYOR',
    name: 'Surveyor/Enumerator',
    description: 'Membuat dan mengelola survei serta layanan miliknya',
    permissions: {
      'User Management': false,
      'Create Users': false,
      'Edit Users': false,
      'Delete Users': false,
      'View Users': false,
      'Service Management': true,
      'Create Services': true,
      'Edit Services': true,
      'Delete Services': false,
      'View Services': true,
      'Survey Management': true,
      'Create Surveys': true,
      'Edit Surveys': true,
      'Delete Surveys': false,
      'View Surveys': true,
      'Verify Surveys': false,
      'Analytics Access': false,
      'View Analytics': false,
      'Export Data': false,
    },
  },
  {
    code: 'VERIFIER',
    name: 'Verifier',
    description: 'Memverifikasi survei dan melihat log audit',
    permissions: {
      'User Management': false,
      'Create Users': false,
      'Edit Users': false,
      'Delete Users': false,
      'View Users': true,
      'Service Management': false,
      'Create Services': false,
      'Edit Services': false,
      'Delete Services': false,
      'View Services': true,
      'Survey Management': true,
      'Create Surveys': false,
      'Edit Surveys': false,
      'Delete Surveys': false,
      'View Surveys': true,
      'Verify Surveys': true,
      'Analytics Access': true,
      'View Analytics': true,
      'Export Data': true,
    },
  },
  {
    code: 'VIEWER',
    name: 'Viewer/Analyst',
    description: 'Akses hanya-baca untuk data terverifikasi',
    permissions: {
      'User Management': false,
      'Create Users': false,
      'Edit Users': false,
      'Delete Users': false,
      'View Users': false,
      'Service Management': false,
      'Create Services': false,
      'Edit Services': false,
      'Delete Services': false,
      'View Services': true,
      'Survey Management': false,
      'Create Surveys': false,
      'Edit Surveys': false,
      'Delete Surveys': false,
      'View Surveys': true,
      'Verify Surveys': false,
      'Analytics Access': true,
      'View Analytics': true,
      'Export Data': false,
    },
  },
];

const permissionCategories = [
  { name: 'User Management', permissions: ['Create Users', 'Edit Users', 'Delete Users', 'View Users'] },
  { name: 'Service Management', permissions: ['Create Services', 'Edit Services', 'Delete Services', 'View Services'] },
  { name: 'Survey Management', permissions: ['Create Surveys', 'Edit Surveys', 'Delete Surveys', 'View Surveys', 'Verify Surveys'] },
  { name: 'Analytics Access', permissions: ['View Analytics', 'Export Data'] },
];

// Indonesian display labels for permission categories and individual permissions.
const PERMISSION_LABELS: Record<string, string> = {
  'User Management': 'Manajemen Pengguna',
  'Create Users': 'Buat Pengguna',
  'Edit Users': 'Ubah Pengguna',
  'Delete Users': 'Hapus Pengguna',
  'View Users': 'Lihat Pengguna',
  'Service Management': 'Manajemen Layanan',
  'Create Services': 'Buat Layanan',
  'Edit Services': 'Ubah Layanan',
  'Delete Services': 'Hapus Layanan',
  'View Services': 'Lihat Layanan',
  'Survey Management': 'Manajemen Survei',
  'Create Surveys': 'Buat Survei',
  'Edit Surveys': 'Ubah Survei',
  'Delete Surveys': 'Hapus Survei',
  'View Surveys': 'Lihat Survei',
  'Verify Surveys': 'Verifikasi Survei',
  'Analytics Access': 'Akses Analitik',
  'View Analytics': 'Lihat Analitik',
  'Export Data': 'Ekspor Data',
};

const breadcrumbs = [
  { label: 'Dasbor', href: '/dashboard' },
  { label: 'Peran & Izin' },
];

export default function RolesPermissionsPage() {
  const { data: stats, isLoading } = useUserStats();

  // Live per-role user counts from GET /accounts/users/stats/ (role_distribution).
  const countByRole = useMemo(() => {
    const map: Record<string, number> = {};
    for (const r of stats?.role_distribution ?? []) map[r.role] = r.count;
    return map;
  }, [stats]);

  return (
    <>
      <PageHeader breadcrumbs={breadcrumbs} />

      <div className="flex flex-1 flex-col gap-4">

        <div className="px-8 pt-8">
          <h1 className="text-2xl font-bold">Peran & Izin</h1>
          <p className="text-muted-foreground">Kelola peran pengguna dan izinnya</p>
        </div>

        <Separator />

        <div className="flex flex-col gap-4 px-8 pb-8">

        {/* Role Overview Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {roles.map((role) => (
            <Card key={role.name} className="border-0 bg-white shadow-none">
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle>{role.name}</CardTitle>
                    <CardDescription className="mt-1">{role.description}</CardDescription>
                  </div>
                  <Badge variant="secondary" className="shrink-0">
                    {isLoading ? '…' : `${countByRole[role.code] ?? 0} pengguna`}
                  </Badge>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>

        {/* Permissions Matrix */}
        <div>
          <h2 className="text-lg font-semibold">Matriks Izin</h2>
          <p className="text-sm text-muted-foreground mb-3">Rincian izin untuk setiap peran sesuai aturan RBAC sistem</p>
          <div className="rounded-sm border bg-white overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-[300px] border-r last:border-r-0">Izin</TableHead>
                  {roles.map((role) => (
                    <TableHead key={role.name} className="text-center border-r last:border-r-0">
                      {role.name}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {permissionCategories.map((category) => (
                  <Fragment key={category.name}>
                    <TableRow className="bg-muted/50">
                      <TableCell colSpan={4} className="font-semibold">
                        {PERMISSION_LABELS[category.name] ?? category.name}
                      </TableCell>
                    </TableRow>
                    {category.permissions.map((permission) => (
                      <TableRow key={permission} className="even:bg-muted">
                        <TableCell className="pl-8">{PERMISSION_LABELS[permission] ?? permission}</TableCell>
                        {roles.map((role) => (
                          <TableCell key={role.name} className="text-center">
                            {role.permissions[permission as keyof typeof role.permissions] ? (
                              <HugeiconsIcon icon={Tick01Icon} size={20} className="text-green-600 mx-auto" />
                            ) : (
                              <HugeiconsIcon icon={Cancel01Icon} size={20} className="text-muted-foreground/50 mx-auto" />
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </Fragment>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
              </div>
        </div>
    </>
  );
}
