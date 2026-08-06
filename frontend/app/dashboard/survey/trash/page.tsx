'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import {
  useTrashedSurveyResponses,
  useRestoreSurveyResponse,
  useBulkRestoreSurveyResponses,
} from '@/hooks/use-survey-responses';
import { useSurveyTemplates } from '@/hooks/use-survey-templates';
import { useAuth } from '@/hooks/use-auth';
import { PageHeader } from '@/components/page-header';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  RowSelectionState,
  SortingState,
  useReactTable,
} from '@tanstack/react-table';
import { MoreHorizontalIcon, ViewIcon, RestoreBinIcon } from 'hugeicons-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

const breadcrumbs = [
  { label: 'Dasbor', href: '/dashboard' },
  { label: 'Survei', href: '/dashboard/survey' },
  { label: 'Keranjang Sampah' },
];

const PAGE_SIZE = 50;

// Mirrors DynamicSurveyResponse.verification_status
const STATUS_OPTIONS = [
  { value: 'DRAFT', label: 'Draf' },
  { value: 'SUBMITTED', label: 'Menunggu Verifikasi' },
  { value: 'VERIFIED', label: 'Terverifikasi' },
  { value: 'REJECTED', label: 'Ditolak' },
];

interface TrashedSurveyItem {
  id: number;
  service_name: string | null;
  template_name: string | null;
  surveyor_name: string | null;
  verification_status: string;
  status_display: string | null;
  survey_date: string;
  deleted_at: string | null;
  deleted_by_name: string | null;
}

function formatDateTime(value: string | null): string {
  if (!value) return '—';
  const date = new Date(value);
  if (isNaN(date.getTime())) return '—';
  return `${date.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })} ${date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`;
}

function statusVariant(status: string) {
  if (status === 'VERIFIED') return 'default' as const;
  if (status === 'SUBMITTED') return 'secondary' as const;
  if (status === 'REJECTED') return 'destructive' as const;
  return 'outline' as const;
}

export default function SurveyTrashPage() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [templateFilter, setTemplateFilter] = useState('all');
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [page, setPage] = useState(1);

  const [restoreTarget, setRestoreTarget] = useState<TrashedSurveyItem | null>(null);
  const [bulkRestoreOpen, setBulkRestoreOpen] = useState(false);

  const { data: templates = [] } = useSurveyTemplates();

  const ordering = sorting.length > 0
    ? `${sorting[0].desc ? '-' : ''}${sorting[0].id}`
    : undefined;

  // Reset to the first page whenever the result set changes shape
  useEffect(() => {
    setPage(1);
    setRowSelection({});
  }, [search, statusFilter, templateFilter, ordering]);

  const { data, isLoading, isError, error } = useTrashedSurveyResponses({
    search: search || undefined,
    verification_status: statusFilter !== 'all' ? statusFilter : undefined,
    template: templateFilter !== 'all' ? templateFilter : undefined,
    ordering,
    page,
    page_size: PAGE_SIZE,
  });

  const restoreSurvey = useRestoreSurveyResponse();
  const bulkRestore = useBulkRestoreSurveyResponses();

  const totalPages = data ? Math.max(1, Math.ceil(data.count / PAGE_SIZE)) : 1;

  const handleRestore = async () => {
    if (!restoreTarget) return;
    try {
      await restoreSurvey.mutateAsync(restoreTarget.id);
      toast.success('Survei berhasil dipulihkan');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Gagal memulihkan survei');
    } finally {
      setRestoreTarget(null);
    }
  };

  const handleBulkRestore = async () => {
    try {
      const result = await bulkRestore.mutateAsync(selectedIds);
      toast.success(`${result.restored} survei berhasil dipulihkan`);
      setRowSelection({});
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Gagal memulihkan survei');
    } finally {
      setBulkRestoreOpen(false);
    }
  };

  const columns = useMemo<ColumnDef<TrashedSurveyItem, any>[]>(() => [
    {
      id: 'select',
      header: ({ table }) => (
        <div className="px-2">
          <Checkbox
            checked={table.getIsAllPageRowsSelected()}
            onCheckedChange={(v) => table.toggleAllPageRowsSelected(!!v)}
            aria-label="Pilih semua"
          />
        </div>
      ),
      cell: ({ row }) => (
        <div className="px-2">
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(v) => row.toggleSelected(!!v)}
            aria-label="Pilih baris"
          />
        </div>
      ),
      enableSorting: false,
    },
    {
      accessorKey: 'id',
      header: 'ID',
      cell: ({ row }) => <div className="w-12 font-medium">#{row.original.id}</div>,
    },
    {
      accessorKey: 'service_name',
      header: 'Nama Layanan',
      cell: ({ row }) => (
        <div className="max-w-xs truncate font-medium">
          {row.original.service_name || '—'}
        </div>
      ),
    },
    {
      accessorKey: 'template_name',
      header: 'Template',
      cell: ({ row }) => (
        <div className="max-w-[12rem] truncate text-sm text-muted-foreground">
          {row.original.template_name || '—'}
        </div>
      ),
    },
    {
      accessorKey: 'surveyor_name',
      header: 'Surveyor',
      cell: ({ row }) => (
        <div className="text-sm">{row.original.surveyor_name || '—'}</div>
      ),
    },
    {
      accessorKey: 'verification_status',
      header: 'Status',
      cell: ({ row }) => (
        <Badge variant={statusVariant(row.original.verification_status)}>
          {row.original.status_display || row.original.verification_status}
        </Badge>
      ),
    },
    {
      accessorKey: 'deleted_at',
      header: 'Dihapus Pada',
      cell: ({ row }) => (
        <div className="text-sm">{formatDateTime(row.original.deleted_at)}</div>
      ),
    },
    {
      accessorKey: 'deleted_by_name',
      header: 'Dihapus Oleh',
      cell: ({ row }) => (
        <div className="text-sm text-muted-foreground">
          {row.original.deleted_by_name || '—'}
        </div>
      ),
    },
    {
      id: 'actions',
      header: '',
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex justify-end gap-1">
          <Button
            variant="outline"
            size="sm"
            className="h-8 shadow-none rounded-sm"
            onClick={() => setRestoreTarget(row.original)}
          >
            <RestoreBinIcon className="mr-2 h-4 w-4" />
            Pulihkan
          </Button>
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
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ], []);

  const tableData = useMemo(
    () => (data?.results ?? []) as unknown as TrashedSurveyItem[],
    [data?.results],
  );

  const table = useReactTable({
    data: tableData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => String(row.id),
    manualSorting: true,
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    state: { sorting, rowSelection },
    enableRowSelection: true,
  });

  const selectedCount = table.getSelectedRowModel().rows.length;
  const selectedIds = table.getSelectedRowModel().rows.map((r) => r.original.id);

  // The endpoint is ADMIN-only; make that explicit rather than showing an
  // empty table to anyone who reaches the URL directly.
  if (user && user.role !== 'ADMIN') {
    return (
      <>
        <PageHeader breadcrumbs={breadcrumbs} />
        <div className="flex flex-1 items-center justify-center px-6">
          <div className="text-center">
            <h1 className="text-xl font-bold">Akses ditolak</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Hanya admin yang dapat membuka Keranjang Sampah.
            </p>
          </div>
        </div>
      </>
    );
  }

  if (isLoading) {
    return (
      <>
        <PageHeader breadcrumbs={breadcrumbs} />
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <div className="h-16 w-16 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
            <p className="text-sm text-muted-foreground">Memuat keranjang sampah...</p>
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
          <h1 className="text-xl font-bold">Keranjang Sampah</h1>
          <p className="text-sm text-muted-foreground">
            Survei yang dihapus disimpan di sini dan dapat dipulihkan kapan saja
          </p>
        </div>

        <Separator />

        <div className="flex flex-col gap-3 px-6 pb-6">

          {selectedCount > 0 && (
            <div className="flex items-center gap-3 rounded-sm border bg-muted/50 px-4 py-2">
              <span className="text-sm font-medium">{selectedCount} dipilih</span>
              <Separator orientation="vertical" className="h-4" />
              <Button
                size="sm"
                className="shadow-none rounded-sm"
                onClick={() => setBulkRestoreOpen(true)}
                disabled={bulkRestore.isPending}
              >
                <RestoreBinIcon className="mr-2 h-4 w-4" />
                {bulkRestore.isPending ? 'Memulihkan...' : 'Pulihkan Terpilih'}
              </Button>
            </div>
          )}

          <div className="flex gap-2 justify-between items-center">
            <Input
              placeholder="Cari nama layanan..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-64"
              aria-label="Cari survei terhapus"
            />

            <div className="flex gap-2">
              <Select value={templateFilter} onValueChange={setTemplateFilter}>
                <SelectTrigger className="w-40 !h-9" aria-label="Filter template">
                  <SelectValue placeholder="Template" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Template</SelectItem>
                  {templates.map((t) => (
                    <SelectItem key={t.id} value={String(t.id)}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40 !h-9" aria-label="Filter status">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  {STATUS_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
                          : flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {isError ? (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-24 text-center text-destructive">
                      {error instanceof Error ? error.message : 'Gagal memuat keranjang sampah.'}
                    </TableCell>
                  </TableRow>
                ) : table.getRowModel().rows?.length ? (
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
                      Keranjang sampah kosong.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {data && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Menampilkan {data.results.length} dari {data.count} survei terhapus
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

      <AlertDialog open={!!restoreTarget} onOpenChange={(open) => !open && setRestoreTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Pulihkan survei ini?</AlertDialogTitle>
            <AlertDialogDescription>
              Survei{restoreTarget?.service_name ? ` "${restoreTarget.service_name}"` : ''} akan
              kembali muncul di daftar survei, antrean verifikasi, dan ekspor. Permintaan hapus yang
              tertunda pada survei ini juga akan dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleRestore} disabled={restoreSurvey.isPending}>
              {restoreSurvey.isPending ? 'Memulihkan...' : 'Pulihkan'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={bulkRestoreOpen} onOpenChange={setBulkRestoreOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Pulihkan {selectedCount} survei?</AlertDialogTitle>
            <AlertDialogDescription>
              Survei yang dipilih akan kembali muncul di daftar survei, antrean verifikasi, dan
              ekspor. Permintaan hapus yang tertunda pada survei tersebut juga akan dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkRestore} disabled={bulkRestore.isPending}>
              {bulkRestore.isPending ? 'Memulihkan...' : 'Pulihkan'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
