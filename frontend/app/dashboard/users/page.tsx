'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useUsers } from '@/hooks/use-users';
import { PageHeader } from "@/components/page-header";
import { Input } from "@/components/ui/input";
import { ButtonGroup } from "@/components/ui/button-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { HugeiconsIcon } from "@hugeicons/react";
import { MoreHorizontalIcon, ViewIcon, Edit01Icon, LockPasswordIcon, Delete01Icon, SortingZA01Icon, PlusSignIcon } from "@hugeicons/core-free-icons";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import type { User } from '@/hooks/use-users';
import { Separator } from '@/components/ui/separator';

const breadcrumbs = [
  { label: 'Dasbor', href: '/dashboard' },
  { label: 'Semua Pengguna' },
];

const PAGE_SIZE = 50;

// Roles mirror the backend User.Role choices (apps/accounts/models.py):
// ADMIN=Administrator, SURVEYOR=Surveyor/Enumerator, VERIFIER=Verifier, VIEWER=Viewer/Analyst
const ROLE_OPTIONS = [
  { value: 'ADMIN', label: 'Administrator' },
  { value: 'SURVEYOR', label: 'Surveyor/Enumerator' },
  { value: 'VERIFIER', label: 'Verifier' },
  { value: 'VIEWER', label: 'Viewer/Analyst' },
];
const ROLE_LABELS: Record<string, string> = Object.fromEntries(
  ROLE_OPTIONS.map((o) => [o.value, o.label]),
);

const STATUS_OPTIONS = [
  { value: 'active', label: 'Aktif' },
  { value: 'inactive', label: 'Tidak Aktif' },
];
const STATUS_LABELS: Record<string, string> = Object.fromEntries(
  STATUS_OPTIONS.map((o) => [o.value, o.label]),
);

export default function AllUsersPage() {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sorting, setSorting] = useState<SortingState>([]);
  const [sortValue, setSortValue] = useState('default');
  const [page, setPage] = useState(1);

  const handleSortChange = (value: string) => {
    setSortValue(value);
    switch (value) {
      case 'name-asc':
        setSorting([{ id: 'full_name', desc: false }]);
        break;
      case 'name-desc':
        setSorting([{ id: 'full_name', desc: true }]);
        break;
      case 'email-asc':
        setSorting([{ id: 'email', desc: false }]);
        break;
      case 'email-desc':
        setSorting([{ id: 'email', desc: true }]);
        break;
      default:
        setSorting([]);
        break;
    }
  };

  // Reset to first page whenever any filter or search changes
  useEffect(() => {
    setPage(1);
  }, [search, roleFilter, statusFilter]);

  const { data, isLoading } = useUsers({
    search,
    role: roleFilter !== 'all' ? roleFilter : undefined,
    is_active: statusFilter !== 'all' ? statusFilter === 'active' : undefined,
    ordering: '-created_at',
    page,
    page_size: PAGE_SIZE,
  });

  const totalPages = data ? Math.max(1, Math.ceil(data.count / PAGE_SIZE)) : 1;

  const columns = useMemo<ColumnDef<User, any>[]>(() => [
    {
      accessorKey: "id",
      header: "ID",
      cell: ({ row }) => <div className="w-12">{row.getValue("id")}</div>,
    },
    {
      accessorKey: "full_name",
      header: "Nama",
      cell: ({ row }) => {
        return <div className="font-medium">{row.getValue("full_name")}</div>
      },
    },
    {
      accessorKey: "email",
      header: "Email",
    },
    {
      accessorKey: "role_display",
      header: "Peran",
      cell: ({ row }) => {
        const role = row.original.role;
        return (
          <Badge variant={
            role === 'ADMIN' ? 'outline-info' :
            role === 'SURVEYOR' ? 'outline-purple' :
            role === 'VERIFIER' ? 'outline-warning' :
            'outline'
          }>
            {row.getValue("role_display")}
          </Badge>
        );
      },
    },
    {
      accessorKey: "organization",
      header: "Organisasi",
      cell: ({ row }) => {
        return <div>{row.getValue("organization") || '-'}</div>
      },
    },
    {
      accessorKey: "phone_number",
      header: "Telepon",
      cell: ({ row }) => {
        return <div>{row.getValue("phone_number") || '-'}</div>
      },
    },
    {
      accessorKey: "is_active",
      header: "Status",
      cell: ({ row }) => {
        const isActive = row.getValue("is_active");
        return (
          <Badge variant={isActive ? "outline-success" : "outline-danger"}>
            {isActive ? 'Aktif' : 'Tidak Aktif'}
          </Badge>
        );
      },
    },
    {
      accessorKey: "created_at",
      header: "Dibuat",
      cell: ({ row }) => {
        return new Date(row.getValue("created_at")).toLocaleDateString('id-ID');
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const user = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="h-8 w-8 p-0 rounded-sm">
                <span className="sr-only">Buka menu</span>
                <HugeiconsIcon icon={MoreHorizontalIcon} size={16} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem><HugeiconsIcon icon={ViewIcon} size={16} />Lihat detail</DropdownMenuItem>
              <DropdownMenuItem><HugeiconsIcon icon={Edit01Icon} size={16} />Edit pengguna</DropdownMenuItem>
              <DropdownMenuItem><HugeiconsIcon icon={LockPasswordIcon} size={16} />Reset kata sandi</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => console.log('Delete user', user.id)}
              >
                <HugeiconsIcon icon={Delete01Icon} size={16} />Hapus pengguna
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ], []);

  const table = useReactTable({
    data: data?.results ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: {
      sorting,
    },
  });

  if (isLoading) {
    return (
      <>
        <PageHeader breadcrumbs={breadcrumbs} />
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <div className="h-16 w-16 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
            <p className="text-sm text-muted-foreground">Memuat pengguna...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader breadcrumbs={breadcrumbs} />

      <div className="flex flex-1 flex-col gap-3">

        <div className="flex items-start justify-between gap-3 px-6 pt-6">
          <div>
            <h1 className="text-xl font-bold">Semua Pengguna</h1>
            <p className="text-sm text-muted-foreground">Kelola akun pengguna dan izin</p>
          </div>
          <Button asChild size="sm" className="h-9 border border-input rounded-sm shadow-none box-border">
            <Link href="/dashboard/users/new">
              <HugeiconsIcon icon={PlusSignIcon} size={16} className="mr-2" />
              Tambah Pengguna
            </Link>
          </Button>
        </div>

        <Separator />

        <div className="flex flex-col gap-3 px-6 pb-6">

        <div className="flex gap-2 justify-between items-center">
          <ButtonGroup aria-label="Filter pengguna">
            {/* Peran */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="min-h-9 bg-white shadow-none">
                  {roleFilter === 'all' ? 'Peran' : (ROLE_LABELS[roleFilter] ?? roleFilter)}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-44">
                <DropdownMenuLabel>Peran</DropdownMenuLabel>
                {ROLE_OPTIONS.map((o) => (
                  <DropdownMenuCheckboxItem
                    key={o.value}
                    checked={roleFilter === o.value}
                    onCheckedChange={() => setRoleFilter(o.value)}
                    onSelect={(e) => e.preventDefault()}
                  >
                    {o.label}
                  </DropdownMenuCheckboxItem>
                ))}
                {roleFilter !== 'all' && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onSelect={() => setRoleFilter('all')}>Hapus filter</DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Status */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="min-h-9 bg-white shadow-none">
                  {statusFilter === 'all' ? 'Status' : (STATUS_LABELS[statusFilter] ?? statusFilter)}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-44">
                <DropdownMenuLabel>Status</DropdownMenuLabel>
                {STATUS_OPTIONS.map((o) => (
                  <DropdownMenuCheckboxItem
                    key={o.value}
                    checked={statusFilter === o.value}
                    onCheckedChange={() => setStatusFilter(o.value)}
                    onSelect={(e) => e.preventDefault()}
                  >
                    {o.label}
                  </DropdownMenuCheckboxItem>
                ))}
                {statusFilter !== 'all' && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onSelect={() => setStatusFilter('all')}>Hapus filter</DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </ButtonGroup>
          <div className="flex gap-2 items-center">
            <Select value={sortValue} onValueChange={handleSortChange}>
              <SelectTrigger className="w-44 min-h-9 rounded-sm bg-white shadow-none" aria-label="Urutkan">
                <HugeiconsIcon icon={SortingZA01Icon} size={16} />
                <SelectValue placeholder="Urutkan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Urutkan</SelectItem>
                <SelectItem value="name-asc">Nama A-Z</SelectItem>
                <SelectItem value="name-desc">Nama Z-A</SelectItem>
                <SelectItem value="email-asc">Email A-Z</SelectItem>
                <SelectItem value="email-desc">Email Z-A</SelectItem>
              </SelectContent>
            </Select>
            <Input
              placeholder="Cari pengguna..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-64 min-h-9 bg-white shadow-none rounded-sm"
            />
          </div>
        </div>

        <div className="rounded-sm border bg-white overflow-hidden">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="bg-muted/50">
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id} className="border-r last:border-r-0">
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id} className="even:bg-muted">
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">
                    Tidak ada pengguna ditemukan.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {data && data.count > 0 && (
          <div className="flex items-center justify-between mt-3">
            <p className="text-sm text-muted-foreground">
              Menampilkan {(page - 1) * PAGE_SIZE + 1}
              {'–'}
              {Math.min(page * PAGE_SIZE, data.count)} dari {data.count} pengguna
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
    </>
  );
}
