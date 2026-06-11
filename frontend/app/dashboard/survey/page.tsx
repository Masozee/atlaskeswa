'use client';

import { useState, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useSurveyResponses, useDeleteSurveyResponse, useBulkDeleteSurveyResponses } from '@/hooks/use-survey-responses';
import { apiClient } from '@/lib/api-client';
import { PageHeader } from "@/components/page-header";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
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
import { MoreHorizontalIcon, ViewIcon, Delete01Icon, Download04Icon } from 'hugeicons-react';
import { toast } from 'sonner';

interface SurveyResponseItem {
  id: number;
  service_name: string;
  service_city: string;
  survey_date: string;
  surveyor_name: string;
  verification_status: string;
  status_display: string;
  kategori: string | null;
  jenis_fasilitas: string | null;
  jenis_layanan: string | null;
  kode_desde_ltc: string[] | null;
  started_at: string | null;
  submitted_at: string | null;
  created_at: string;
}

function formatDuration(startedAt: string | null, submittedAt: string | null): string {
  if (!startedAt || !submittedAt) return '—';
  const ms = new Date(submittedAt).getTime() - new Date(startedAt).getTime();
  if (isNaN(ms) || ms < 0) return '—';
  const totalMinutes = Math.round(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0) return `${hours} jam ${minutes} mnt`;
  return `${minutes} mnt`;
}

const breadcrumbs = [
  { label: 'Dasbor', href: '/dashboard' },
  { label: 'Semua Catatan Survei' },
];

const PAGE_SIZE = 50;

export default function AllSurveysPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [page, setPage] = useState(1);

  // Reset page when filters change
  const filterKey = `${search}|${statusFilter}`;
  const lastFilterKey = useRef(filterKey);
  if (lastFilterKey.current !== filterKey) {
    lastFilterKey.current = filterKey;
    if (page !== 1) setPage(1);
  }

  const { data, isLoading } = useSurveyResponses({
    search,
    verification_status: statusFilter !== 'all' ? statusFilter : undefined,
    ordering: '-survey_date',
    page,
    page_size: PAGE_SIZE,
  });

  const totalPages = data ? Math.max(1, Math.ceil(data.count / PAGE_SIZE)) : 1;

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

  const handleExport = async (
    format: 'csv' | 'xlsx',
    valueFormat: 'code' | 'label' = 'code',
  ) => {
    const params = new URLSearchParams();
    params.set('file_format', format);
    params.set('value_format', valueFormat);
    if (search) params.set('search', search);
    if (statusFilter !== 'all') params.set('verification_status', statusFilter);
    const ids = table.getSelectedRowModel().rows.map((r) => r.original.id);
    if (ids.length > 0) params.set('ids', ids.join(','));
    try {
      const res = await apiClient.fetchRaw(`/surveys/responses/export/?${params.toString()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `surveys-${valueFormat}.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success(`Laporan ${format.toUpperCase()} berhasil diunduh`);
    } catch (e) {
      toast.error(`Gagal mengunduh laporan: ${e instanceof Error ? e.message : 'unknown'}`);
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
      header: "Nama Fasilitas",
      cell: ({ row }) => {
        const survey = row.original;
        return (
          <Link
            href={`/dashboard/survey/${survey.id}`}
            className="block font-medium max-w-[200px] whitespace-normal break-words text-primary hover:underline"
          >
            {row.getValue("service_name")}
          </Link>
        );
      },
    },
    {
      accessorKey: "kategori",
      header: "Kategori",
      cell: ({ row }) => {
        const kategori = row.getValue("kategori") as string | null;
        if (!kategori) return <span className="text-muted-foreground">—</span>;
        return (
          <Badge variant={kategori === 'FASKES' ? 'outline-info' : 'outline-muted'}>
            {kategori === 'FASKES' ? 'Faskes' : 'Non-Faskes'}
          </Badge>
        );
      },
    },
    {
      accessorKey: "jenis_fasilitas",
      header: "Jenis Fasilitas",
      cell: ({ row }) => (
        <div className="max-w-[200px] whitespace-normal break-words text-sm">
          {row.getValue("jenis_fasilitas") || '—'}
        </div>
      ),
    },
    {
      accessorKey: "jenis_layanan",
      header: "Jenis Layanan",
      cell: ({ row }) => (
        <div
          className="max-w-[280px] whitespace-normal break-words text-sm line-clamp-3"
          title={(row.getValue("jenis_layanan") as string) ?? undefined}
        >
          {row.getValue("jenis_layanan") || '—'}
        </div>
      ),
    },
    {
      accessorKey: "kode_desde_ltc",
      header: "Kode DESDE-LTC",
      cell: ({ row }) => {
        const raw = row.getValue("kode_desde_ltc") as string[] | string | null;
        const entries = Array.isArray(raw) ? raw : typeof raw === 'string' && raw ? [raw] : null;
        if (!entries || entries.length === 0) return <span className="text-muted-foreground">—</span>;
        return (
          <div className="max-w-[240px] whitespace-normal break-words text-sm flex flex-col gap-0.5">
            {entries.map((entry) => {
              const sep = entry.indexOf(' — ');
              const code = sep >= 0 ? entry.slice(0, sep) : entry;
              const name = sep >= 0 ? entry.slice(sep + 3) : '';
              return (
                <div key={entry} title={entry}>
                  <span className="font-medium">{code}</span>
                  {name && <span className="text-muted-foreground"> — {name}</span>}
                </div>
              );
            })}
          </div>
        );
      },
    },
    {
      accessorKey: "surveyor_name",
      header: "Enumerator",
      cell: ({ row }) => {
        return <div className="text-sm">{row.getValue("surveyor_name")}</div>;
      },
    },
    {
      accessorKey: "survey_date",
      header: "Tgl Wawancara",
      cell: ({ row }) => {
        const date = new Date(row.getValue("survey_date"));
        return <div>{date.toLocaleDateString('id-ID')}</div>;
      },
    },
    {
      id: 'lama_wawancara',
      header: "Lama Wawancara",
      cell: ({ row }) => (
        <div className="text-sm">
          {formatDuration(row.original.started_at, row.original.submitted_at)}
        </div>
      ),
      enableSorting: false,
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 w-8 p-0 shadow-none rounded-sm">
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
    data: (data?.results ?? []) as unknown as SurveyResponseItem[],
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
            <div className="flex items-center gap-3 rounded-sm border bg-muted/50 px-4 py-2">
              <span className="text-sm font-medium">{selectedCount} dipilih</span>
              <Separator orientation="vertical" className="h-4" />
              <Button
                variant="destructive"
                size="sm"
                className="shadow-none rounded-sm"
                onClick={handleBulkDelete}
                disabled={bulkDelete.isPending}
              >
                <Delete01Icon className="w-4 h-4 mr-2" />
                {bulkDelete.isPending ? 'Menghapus...' : 'Hapus Terpilih'}
              </Button>
            </div>
          )}

          <div className="flex gap-2 justify-between items-center">
            <ButtonGroup aria-label="Filter survei">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40 !h-9 rounded-l-sm rounded-r-none border-r-0 bg-white shadow-none" aria-label="Filter berdasarkan status">
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
              <Select value={sorting.length > 0 ? `${sorting[0].id}-${sorting[0].desc ? 'desc' : 'asc'}` : 'default'} onValueChange={(value) => {
                if (value === 'default') {
                  setSorting([]);
                } else {
                  const [id, dir] = value.split('-');
                  setSorting([{ id, desc: dir === 'desc' }]);
                }
              }}>
                <SelectTrigger className="w-44 !h-9 rounded-r-sm rounded-l-none bg-white shadow-none" aria-label="Urutkan">
                  <HugeiconsIcon icon={SortingZA01Icon} size={16} />
                  <SelectValue placeholder="Urutkan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Urutkan</SelectItem>
                  <SelectItem value="service_name-asc">Fasilitas A-Z</SelectItem>
                  <SelectItem value="service_name-desc">Fasilitas Z-A</SelectItem>
                  <SelectItem value="survey_date-desc">Terbaru</SelectItem>
                  <SelectItem value="survey_date-asc">Terlama</SelectItem>
                  <SelectItem value="surveyor_name-asc">Enumerator A-Z</SelectItem>
                  <SelectItem value="surveyor_name-desc">Enumerator Z-A</SelectItem>
                </SelectContent>
              </Select>
            </ButtonGroup>
            <div className="flex gap-2 items-center">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="!h-9 bg-white shadow-none rounded-sm">
                    <Download04Icon className="w-4 h-4 mr-2" />
                    Ekspor
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleExport('xlsx', 'code')}>
                    XLSX — Kode (mis. AKUT)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExport('xlsx', 'label')}>
                    XLSX — Jawaban Lengkap
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleExport('csv', 'code')}>
                    CSV — Kode
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExport('csv', 'label')}>
                    CSV — Jawaban Lengkap
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Input
                placeholder="Cari berdasarkan nama layanan, kota..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-64 bg-white shadow-none rounded-sm"
                aria-label="Cari survei"
              />
            </div>
          </div>

          <div className="rounded-sm border">
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
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && 'selected'}
                      className="even:bg-muted"
                    >
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
                Menampilkan {(page - 1) * PAGE_SIZE + 1}
                {'–'}
                {Math.min(page * PAGE_SIZE, data.count)} dari {data.count} survei
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="shadow-none rounded-sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={!data.previous || page <= 1}
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
                  disabled={!data.next || page >= totalPages}
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
