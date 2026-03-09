'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useSurveyResponses, useDeleteSurveyResponse, useBulkDeleteSurveyResponses } from '@/hooks/use-survey-responses';
import { PageHeader } from "@/components/page-header";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from '@/components/ui/separator';
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
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  RowSelectionState,
  useReactTable,
} from "@tanstack/react-table";
import { HugeiconsIcon } from "@hugeicons/react";
import { SortingZA01Icon } from "@hugeicons/core-free-icons";
import { MoreHorizontalIcon, ViewIcon, Delete01Icon } from 'hugeicons-react';
import { toast } from 'sonner';

interface SurveyResponseItem {
  id: number;
  service_name: string;
  service_city: string;
  survey_date: string;
  surveyor_name: string;
  verification_status: string;
  status_display: string;
  created_at: string;
}

const breadcrumbs = [
  { label: 'Dasbor', href: '/dashboard' },
  { label: 'Semua Catatan Survei' },
];

export default function AllSurveysPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const { data, isLoading } = useSurveyResponses({
    search,
    verification_status: statusFilter !== 'all' ? statusFilter : undefined,
    ordering: '-survey_date',
    page_size: 50,
  });

  const deleteSurvey = useDeleteSurveyResponse();
  const bulkDelete = useBulkDeleteSurveyResponses();

  const handleDelete = async (id: number) => {
    try {
      await deleteSurvey.mutateAsync(id);
      toast.success('Survei berhasil dihapus');
    } catch {
      toast.error('Gagal menghapus survei');
    }
  };

  const handleBulkDelete = async () => {
    try {
      const result = await bulkDelete.mutateAsync(selectedIds);
      toast.success(`${result.deleted} survei berhasil dihapus`);
      setRowSelection({});
    } catch {
      toast.error('Gagal menghapus survei');
    }
  };

  const columns = useMemo<ColumnDef<SurveyResponseItem, any>[]>(() => [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(v) => table.toggleAllPageRowsSelected(!!v)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(v) => row.toggleSelected(!!v)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
    },
    {
      accessorKey: "id",
      header: "ID",
      cell: ({ row }) => <div className="w-12">{row.getValue("id")}</div>,
    },
    {
      accessorKey: "service_name",
      header: "Nama Layanan",
      cell: ({ row }) => {
        const survey = row.original;
        return (
          <Link
            href={`/dashboard/survey/${survey.id}`}
            className="font-medium max-w-xs truncate text-primary hover:underline"
          >
            {row.getValue("service_name")}
          </Link>
        );
      },
    },
    {
      accessorKey: "service_city",
      header: "Kota",
    },
    {
      accessorKey: "survey_date",
      header: "Tanggal Survei",
      cell: ({ row }) => {
        const date = new Date(row.getValue("survey_date"));
        return <div>{date.toLocaleDateString('id-ID')}</div>;
      },
    },
    {
      accessorKey: "surveyor_name",
      header: "Surveyor",
      cell: ({ row }) => {
        return <div className="text-sm">{row.getValue("surveyor_name")}</div>;
      },
    },
    {
      accessorKey: "verification_status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("verification_status") as string;
        const statusDisplay = row.original.status_display;

        const variant =
          status === 'VERIFIED' ? 'outline-success' :
          status === 'SUBMITTED' ? 'outline-info' :
          status === 'REJECTED' ? 'outline-danger' :
          'outline-muted';

        return <Badge variant={variant}>{statusDisplay}</Badge>;
      },
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 w-8 p-0">
              <MoreHorizontalIcon className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/dashboard/survey/${row.original.id}`}>
                <ViewIcon className="mr-2 h-4 w-4" />
                Lihat Detail
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => handleDelete(row.original.id)}
            >
              <Delete01Icon className="mr-2 h-4 w-4" />
              Hapus
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ], []);

  const table = useReactTable({
    data: (data?.results ?? []) as SurveyResponseItem[],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      rowSelection,
    },
    enableRowSelection: true,
  });

  const selectedCount = table.getSelectedRowModel().rows.length;
  const selectedIds = table.getSelectedRowModel().rows.map((r) => r.original.id);

  if (isLoading) {
    return (
      <>
        <PageHeader breadcrumbs={breadcrumbs} />
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <div className="h-16 w-16 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
            <p className="text-sm text-muted-foreground">Memuat survei...</p>
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
          <h1 className="text-xl font-bold">Semua Catatan Survei</h1>
          <p className="text-sm text-muted-foreground">Pengumpulan dan pemantauan data survei</p>
        </div>

        <Separator />

        <div className="flex flex-col gap-3 px-6 pb-6">

          {selectedCount > 0 && (
            <div className="flex items-center gap-3 rounded-lg border bg-muted/50 px-4 py-2">
              <span className="text-sm font-medium">{selectedCount} dipilih</span>
              <Separator orientation="vertical" className="h-4" />
              <Button
                variant="destructive"
                size="sm"
                onClick={handleBulkDelete}
                disabled={bulkDelete.isPending}
              >
                <Delete01Icon className="w-4 h-4 mr-2" />
                {bulkDelete.isPending ? 'Menghapus...' : 'Hapus Terpilih'}
              </Button>
            </div>
          )}

          <div className="flex gap-2 justify-between items-center">
            <div className="flex gap-2 items-center">
              <div className="flex items-center rounded-md border">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40 border-0 focus:ring-0" aria-label="Filter berdasarkan status">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="DRAFT">Draf</SelectItem>
                    <SelectItem value="SUBMITTED">Diajukan</SelectItem>
                    <SelectItem value="VERIFIED">Terverifikasi</SelectItem>
                    <SelectItem value="REJECTED">Ditolak</SelectItem>
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
                <SelectTrigger className="w-44" aria-label="Urutkan">
                  <HugeiconsIcon icon={SortingZA01Icon} size={16} />
                  <SelectValue placeholder="Urutkan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Urutkan</SelectItem>
                  <SelectItem value="service_name-asc">Layanan A-Z</SelectItem>
                  <SelectItem value="service_name-desc">Layanan Z-A</SelectItem>
                  <SelectItem value="survey_date-desc">Terbaru</SelectItem>
                  <SelectItem value="survey_date-asc">Terlama</SelectItem>
                  <SelectItem value="service_city-asc">Kota A-Z</SelectItem>
                  <SelectItem value="service_city-desc">Kota Z-A</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Input
              placeholder="Cari berdasarkan nama layanan, kota..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-64"
              aria-label="Cari survei"
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
                    <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
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
                      Tidak ada survei ditemukan.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {data && data.count > 0 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Menampilkan {data.results.length} dari {data.count} survei
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
