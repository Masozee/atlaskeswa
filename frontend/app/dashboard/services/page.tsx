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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { Separator } from '@/components/ui/separator';
import { HugeiconsIcon } from "@hugeicons/react";
import {
  SortingZA01Icon,
  ViewIcon,
  Edit01Icon,
  ClipboardIcon,
  ShoppingCart01Icon,
  Delete01Icon,
  MoreHorizontalIcon,
} from "@hugeicons/core-free-icons";

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
        return accepts ? <Badge variant="outline-success">Ya</Badge> : <Badge variant="outline-muted">Tidak</Badge>
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
          return <Badge variant="outline-danger">Tidak Aktif</Badge>;
        }

        return isVerified ?
          <Badge variant="outline-success">Terverifikasi</Badge> :
          <Badge variant="outline-warning">Belum Terverifikasi</Badge>;
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
              <Button variant="outline" className="h-8 w-8 p-0" aria-label="Buka menu aksi">
                <span className="sr-only">Buka menu</span>
                <HugeiconsIcon icon={MoreHorizontalIcon} size={16} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <HugeiconsIcon icon={ViewIcon} size={16} />
                Lihat detail
              </DropdownMenuItem>
              <DropdownMenuItem>
                <HugeiconsIcon icon={Edit01Icon} size={16} />
                Edit layanan
              </DropdownMenuItem>
              <DropdownMenuItem>
                <HugeiconsIcon icon={ClipboardIcon} size={16} />
                Lihat survei
              </DropdownMenuItem>
              <DropdownMenuItem>
                <HugeiconsIcon icon={ShoppingCart01Icon} size={16} />
                Pesan survei
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => console.log('Delete service', service.id)}
              >
                <HugeiconsIcon icon={Delete01Icon} size={16} />
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

      <div className="flex flex-1 flex-col gap-3">

        <div className="px-6 pt-6">
          <h1 className="text-xl font-bold">Semua Layanan</h1>
          <p className="text-sm text-muted-foreground">Direktori layanan kesehatan jiwa</p>
        </div>

        <Separator />

        <div className="flex flex-col gap-3 px-6 pb-6">

        <div className="flex gap-2 justify-between items-center">
          <div className="flex gap-2 items-center">
            <div className="flex items-center rounded-md border">
              <Select value={provinceFilter} onValueChange={setProvinceFilter}>
                <SelectTrigger className="w-40 border-0 rounded-r-none focus:ring-0" aria-label="Filter berdasarkan provinsi">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {provinces.map(province => (
                    <SelectItem key={province} value={province}>{province}</SelectItem>
                  ))}
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
            <Select value={sorting.length > 0 ? `${sorting[0].id}-${sorting[0].desc ? 'desc' : 'asc'}` : 'default'} onValueChange={(value) => {
              if (value === 'default') {
                setSorting([]);
              } else {
                const [id, dir] = value.split('-');
                setSorting([{ id, desc: dir === 'desc' }]);
              }
            }}>
              <SelectTrigger className="w-44 !h-9" aria-label="Urutkan">
                <HugeiconsIcon icon={SortingZA01Icon} size={16} />
                <SelectValue placeholder="Urutkan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Urutkan</SelectItem>
                <SelectItem value="name-asc">Nama A-Z</SelectItem>
                <SelectItem value="name-desc">Nama Z-A</SelectItem>
                <SelectItem value="city-asc">Kota A-Z</SelectItem>
                <SelectItem value="city-desc">Kota Z-A</SelectItem>
                <SelectItem value="bed_capacity-desc">Kapasitas Terbanyak</SelectItem>
                <SelectItem value="bed_capacity-asc">Kapasitas Tersedikit</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Input
            placeholder="Cari layanan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64"
            aria-label="Cari layanan"
          />
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
        </div>
    </>
  );
}
