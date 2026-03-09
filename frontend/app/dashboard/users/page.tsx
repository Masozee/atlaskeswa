'use client';

import { useState, useMemo } from 'react';
import { useUsers } from '@/hooks/use-users';
import { PageHeader } from "@/components/page-header";
import { Input } from "@/components/ui/input";
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
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { HugeiconsIcon } from "@hugeicons/react";
import { MoreHorizontalIcon, ViewIcon, Edit01Icon, LockPasswordIcon, Delete01Icon, SortingZA01Icon } from "@hugeicons/core-free-icons";
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

export default function AllUsersPage() {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sorting, setSorting] = useState<SortingState>([]);
  const [sortValue, setSortValue] = useState('default');

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

  const { data, isLoading } = useUsers({
    search,
    role: roleFilter !== 'all' ? roleFilter : undefined,
    is_active: statusFilter !== 'all' ? statusFilter === 'active' : undefined,
    ordering: '-created_at',
    page_size: 50,
  });

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
            role === 'STAFF' ? 'outline-purple' :
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
              <Button variant="outline" className="h-8 w-8 p-0">
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

      <div className="flex flex-1 flex-col gap-4">

        <div className="px-8 pt-8">
          <h1 className="text-2xl font-bold">Semua Pengguna</h1>
          <p className="text-muted-foreground">Kelola akun pengguna dan izin</p>
        </div>

        <Separator />

        <div className="flex flex-col gap-4 px-8 pb-8">

        <div className="flex gap-2 justify-between items-center">
          <div className="flex gap-2 items-center">
            <div className="flex items-center rounded-md border">
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-40 border-0 rounded-r-none focus:ring-0" aria-label="Filter berdasarkan peran">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="STAFF">Staf</SelectItem>
                  <SelectItem value="VIEWER">Penampil</SelectItem>
                </SelectContent>
              </Select>
              <div className="w-px self-stretch bg-border" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40 border-0 rounded-l-none focus:ring-0" aria-label="Filter berdasarkan status">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="active">Aktif</SelectItem>
                  <SelectItem value="inactive">Tidak Aktif</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-px h-5 bg-border" />
            <Select value={sortValue} onValueChange={handleSortChange}>
              <SelectTrigger className="w-44" aria-label="Urutkan">
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
          </div>
          <Input
            placeholder="Cari pengguna..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64"
          />
        </div>

        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
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
                  <TableRow key={row.id}>
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
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Menampilkan {data.results.length} dari {data.count} pengguna
            </p>
          </div>
        )}
              </div>
        </div>
    </>
  );
}
