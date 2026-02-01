'use client';

import { useState, useMemo } from 'react';
import { useServices } from '@/hooks/use-services';
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal } from "lucide-react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  SortingState,
  PaginationState,
  useReactTable,
} from "@tanstack/react-table";
import { ServiceListItem } from "@/lib/types/api";

const breadcrumbs = [
  { label: "Dasbor", href: "/dashboard" },
  { label: "Semua Layanan" },
];

export default function AllServicesPage() {
  const [search, setSearch] = useState('');
  const [provinceFilter, setProvinceFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 15,
  });

  const { data, isLoading } = useServices({
    search,
    province: provinceFilter !== 'all' ? provinceFilter : undefined,
    is_active: statusFilter === 'all' ? undefined : statusFilter === 'active',
    ordering: '-created_at',
    page_size: 50,
  });

  const columns = useMemo<ColumnDef<ServiceListItem, any>[]>(() => [
    {
      accessorKey: "id",
      header: "ID",
      size: 60,
      minSize: 60,
      maxSize: 60,
      cell: ({ row }) => <div className="font-mono text-sm">{row.getValue("id")}</div>,
    },
    {
      accessorKey: "name",
      header: "Nama Layanan",
      size: 280,
      minSize: 280,
      maxSize: 280,
      cell: ({ row }) => {
        return <div className="font-medium text-sm leading-snug break-words py-1.5 whitespace-normal">{row.getValue("name")}</div>
      },
    },
    {
      accessorKey: "mtc_name",
      header: "Jenis Perawatan",
      size: 200,
      minSize: 200,
      maxSize: 200,
      cell: ({ row }) => {
        return <div className="text-sm leading-snug break-words py-1.5 whitespace-normal">{row.getValue("mtc_name") || '-'}</div>
      },
    },
    {
      accessorKey: "city",
      header: "Kota",
      size: 120,
      minSize: 120,
      maxSize: 120,
      cell: ({ row }) => <div className="text-sm whitespace-nowrap">{row.getValue("city")}</div>,
    },
    {
      accessorKey: "province",
      header: "Provinsi",
      size: 120,
      minSize: 120,
      maxSize: 120,
      cell: ({ row }) => <div className="text-sm whitespace-nowrap">{row.getValue("province")}</div>,
    },
    {
      accessorKey: "bed_capacity",
      header: "Kapasitas",
      size: 80,
      minSize: 80,
      maxSize: 80,
      cell: ({ row }) => {
        const capacity = row.getValue("bed_capacity") as number | null;
        return <div className="text-center text-sm">{capacity !== null ? capacity : '-'}</div>
      },
    },
    {
      accessorKey: "accepts_bpjs",
      header: "BPJS",
      size: 80,
      minSize: 80,
      maxSize: 80,
      cell: ({ row }) => {
        const accepts = row.getValue("accepts_bpjs");
        return accepts ? <Badge variant="default">Ya</Badge> : <Badge variant="outline">Tidak</Badge>
      },
    },
    {
      accessorKey: "is_verified",
      header: "Status",
      size: 130,
      minSize: 130,
      maxSize: 130,
      cell: ({ row }) => {
        const isVerified = row.getValue("is_verified");
        const isActive = row.original.is_active;

        if (!isActive) {
          return <Badge variant="destructive">Tidak Aktif</Badge>;
        }

        return isVerified ?
          <Badge variant="default">Terverifikasi</Badge> :
          <Badge variant="secondary">Belum Terverifikasi</Badge>;
      },
    },
    {
      id: "actions",
      size: 60,
      minSize: 60,
      maxSize: 60,
      cell: ({ row }) => {
        const service = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0" aria-label="Buka menu aksi">
                <span className="sr-only">Buka menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Lihat detail</DropdownMenuItem>
              <DropdownMenuItem>Edit layanan</DropdownMenuItem>
              <DropdownMenuItem>Lihat survei</DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => console.log('Delete service', service.id)}
              >
                Hapus layanan
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
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    state: {
      sorting,
      pagination,
    },
    columnResizeMode: 'onChange',
  });

  // Extract unique provinces from data
  const provinces = useMemo(() => {
    if (!data?.results) return [];
    const uniqueProvinces = Array.from(new Set(data.results.map(s => s.province))).filter(Boolean);
    return uniqueProvinces.sort();
  }, [data]);

  if (isLoading) {
    return (
      <>
        <PageHeader breadcrumbs={breadcrumbs} />
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <div className="h-16 w-16 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
            <p className="text-sm text-muted-foreground">Memuat layanan...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader breadcrumbs={breadcrumbs} />

      <div className="flex flex-1 flex-col gap-3 p-6 pt-4">
        <div>
          <h1 className="text-xl font-bold">Semua Layanan</h1>
          <p className="text-sm text-muted-foreground">Direktori layanan kesehatan jiwa</p>
        </div>

        <div className="flex gap-2 justify-between items-center">
          <Input
            placeholder="Cari berdasarkan nama, kota atau deskripsi..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64"
            aria-label="Cari layanan"
          />
          <div className="flex gap-2">
            <Select value={provinceFilter} onValueChange={setProvinceFilter}>
              <SelectTrigger className="w-40 !h-9" aria-label="Filter berdasarkan provinsi">
                <SelectValue placeholder="Filter berdasarkan provinsi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Provinsi</SelectItem>
                {provinces.map(province => (
                  <SelectItem key={province} value={province}>{province}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40 !h-9" aria-label="Filter berdasarkan status">
                <SelectValue placeholder="Filter berdasarkan status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="active">Aktif</SelectItem>
                <SelectItem value="inactive">Tidak Aktif</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="rounded-lg border">
          <Table style={{ tableLayout: 'fixed', width: '100%' }}>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      style={{ width: header.getSize() }}
                    >
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
                      <TableCell
                        key={cell.id}
                        style={{ width: cell.column.getSize() }}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center" role="status">
                    Tidak ada layanan ditemukan.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {table.getRowModel().rows?.length > 0 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground" role="status" aria-live="polite">
              Menampilkan {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} sampai{' '}
              {Math.min(
                (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                data?.results.length || 0
              )}{' '}
              dari {data?.results.length || 0} layanan
            </p>
            <div className="flex items-center gap-2" role="navigation" aria-label="Pagination">
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                aria-label="Halaman sebelumnya"
              >
                Sebelumnya
              </Button>
              <span className="text-sm text-muted-foreground" aria-current="page">
                Halaman {table.getState().pagination.pageIndex + 1} dari {table.getPageCount()}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                aria-label="Halaman selanjutnya"
              >
                Selanjutnya
              </Button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
