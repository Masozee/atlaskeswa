'use client';

import { useState, useMemo, useEffect, Fragment, type Dispatch, type SetStateAction, useRef } from 'react';
import Link from 'next/link';
import {
  useSurveyResponses,
  useDeleteSurveyResponse,
  useBulkDeleteSurveyResponses,
  useRequestDeletion,
} from '@/hooks/use-survey-responses';
import { useGeographicUnits } from '@/hooks/use-geographic-units';
import { useUsers } from '@/hooks/use-users';
import { useCurrentUser } from '@/hooks/use-auth';
import { apiClient } from '@/lib/api-client';
import { PageHeader } from "@/components/page-header";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  ExpandedState,
  SortingState,
  RowSelectionState,
  useReactTable,
} from "@tanstack/react-table";
import { HugeiconsIcon } from "@hugeicons/react";
import { SortingZA01Icon } from "@hugeicons/core-free-icons";
import { MoreHorizontalIcon, ViewIcon, Delete01Icon, PlusSignIcon, InformationCircleIcon, Edit02Icon, Upload01Icon, Download01Icon } from 'hugeicons-react';
import { toast } from 'sonner';

/** Shape of POST /surveys/responses/import/ */
interface ImportSummary {
  dry_run: boolean;
  rows_read: number;
  updated: number;
  unchanged: number;
  conflicts: number;
  failed: number;
  conflict_details: { line: number; id: number; question: string; error: string }[];
  errors: { line: number; id?: number; error: string }[];
}

interface SurveyResponseItem {
  id: number;
  service_name: string;
  service_city: string;
  service_kecamatan: string | null;
  service_desa: string | null;
  q1_nama_fasilitas: string | null;
  status_badan_hukum: string | null;
  thumbnail: string | null;
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

// Survey verification statuses (backend DynamicSurveyResponse.verification_status).
const STATUS_OPTIONS = [
  { value: 'DRAFT', label: 'Draf' },
  { value: 'SUBMITTED', label: 'Menunggu Verifikasi' },
  { value: 'VERIFIED', label: 'Terverifikasi' },
  { value: 'REJECTED', label: 'Ditolak' },
];
const STATUS_LABELS: Record<string, string> = Object.fromEntries(
  STATUS_OPTIONS.map((o) => [o.value, o.label]),
);

function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export default function AllSurveysPage() {
  const [search, setSearch] = useState('');
  // Export download state: isExporting gates the button; exportProgress is a
  // 0–100 percentage when Content-Length is known, or null for indeterminate.
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState<number | null>(null);
  // Import: update-only, matched on the "ID SURVEY" column the export emits.
  const [importOpen, setImportOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportSummary | null>(null);
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [kategoriFilter, setKategoriFilter] = useState<string[]>([]);
  const [dateFilter, setDateFilter] = useState<Date | undefined>(undefined);
  const [kecamatanFilter, setKecamatanFilter] = useState<number[]>([]);
  const [desaFilter, setDesaFilter] = useState<number[]>([]);
  const [enumeratorFilter, setEnumeratorFilter] = useState<number[]>([]);

  // Toggle a value in a multi-select filter array
  const toggleIn = <T,>(setter: Dispatch<SetStateAction<T[]>>, value: T) =>
    setter((prev) => (prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]));
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [expanded, setExpanded] = useState<ExpandedState>({});
  const [page, setPage] = useState(1);

  // Filter option data
  const { data: kecamatanList = [] } = useGeographicUnits({ level: 'KECAMATAN' });
  // Desa options are scoped to the first selected kecamatan (nested filter).
  const desaParentId = kecamatanFilter[0];
  const { data: desaList = [] } = useGeographicUnits({
    level: 'DESA_KELURAHAN',
    parent: desaParentId,
    enabled: !!desaParentId,
  });
  const { data: enumeratorData } = useUsers({ page_size: 200 });
  const enumeratorList = enumeratorData?.results ?? [];

  const selectedDateIso = dateFilter ? toISODate(dateFilter) : undefined;

  const ordering = sorting.length > 0
    ? `${sorting[0].desc ? '-' : ''}${sorting[0].id}`
    : '-survey_date';

  const statusParam = statusFilter.length > 0 ? statusFilter.join(',') : undefined;
  const kategoriParam = kategoriFilter.length > 0 ? kategoriFilter.join(',') : undefined;
  const kecamatanParam = kecamatanFilter.length > 0 ? kecamatanFilter.join(',') : undefined;
  const desaParam = desaFilter.length > 0 ? desaFilter.join(',') : undefined;
  const surveyorParam = enumeratorFilter.length > 0 ? enumeratorFilter.join(',') : undefined;

  // Reset to first page whenever any filter or sort changes
  useEffect(() => {
    setPage(1);
  }, [search, statusParam, kategoriParam, selectedDateIso, kecamatanParam, desaParam, surveyorParam, ordering]);

  const { data, isLoading, refetch } = useSurveyResponses({
    search,
    verification_status: statusParam,
    kategori: kategoriParam,
    survey_date: selectedDateIso,
    kecamatan: kecamatanParam,
    desa: desaParam,
    surveyor: surveyorParam,
    ordering,
    page,
    page_size: PAGE_SIZE,
  });

  const totalPages = data ? Math.max(1, Math.ceil(data.count / PAGE_SIZE)) : 1;

  const deleteSurvey = useDeleteSurveyResponse();
  const bulkDelete = useBulkDeleteSurveyResponses();
  const requestDeletion = useRequestDeletion();

  // Deleting is soft: an ADMIN moves the survey to the trash bin, any other
  // role can only file a deletion request for a verifier/admin to approve.
  const { data: user } = useCurrentUser();
  const isAdmin = user?.role === 'ADMIN';

  // Pending confirmation targets (null = dialog closed)
  const [deleteTarget, setDeleteTarget] = useState<SurveyResponseItem | null>(null);
  const [requestTarget, setRequestTarget] = useState<SurveyResponseItem | null>(null);
  const [requestReason, setRequestReason] = useState('');
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteSurvey.mutateAsync(deleteTarget.id);
      toast.success('Survei dipindahkan ke keranjang sampah');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Gagal memindahkan survei ke keranjang sampah');
    } finally {
      setDeleteTarget(null);
    }
  };

  const handleRequestDeletion = async () => {
    if (!requestTarget) return;
    try {
      await requestDeletion.mutateAsync({ id: requestTarget.id, reason: requestReason });
      toast.success('Permintaan hapus berhasil diajukan');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Gagal mengajukan permintaan hapus');
    } finally {
      setRequestTarget(null);
      setRequestReason('');
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
    if (statusParam) params.set('verification_status', statusParam);
    if (kategoriParam) params.set('kategori', kategoriParam);
    if (selectedDateIso) params.set('survey_date', selectedDateIso);
    if (kecamatanParam) params.set('kecamatan', kecamatanParam);
    if (desaParam) params.set('desa', desaParam);
    if (surveyorParam) params.set('surveyor', surveyorParam);
    const ids = table.getSelectedRowModel().rows.map((r) => r.original.id);
    if (ids.length > 0) params.set('ids', ids.join(','));

    setIsExporting(true);
    setExportProgress(null);
    try {
      const res = await apiClient.fetchRaw(`/surveys/responses/export/?${params.toString()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      // Stream the body so we can show download progress. Content-Length is
      // present for buffered responses; if absent (chunked), stay indeterminate.
      const total = Number(res.headers.get('Content-Length')) || 0;
      let blob: Blob;
      if (res.body && typeof res.body.getReader === 'function') {
        const reader = res.body.getReader();
        const chunks: Uint8Array[] = [];
        let received = 0;
        setExportProgress(total > 0 ? 0 : null);
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          if (value) {
            chunks.push(value);
            received += value.length;
            if (total > 0) setExportProgress(Math.min(100, Math.round((received / total) * 100)));
          }
        }
        blob = new Blob(chunks as BlobPart[], {
          type: res.headers.get('Content-Type') || 'application/octet-stream',
        });
      } else {
        blob = await res.blob();
      }
      setExportProgress(100);

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
    } finally {
      setIsExporting(false);
      setExportProgress(null);
    }
  };

  const runImport = async (dryRun: boolean) => {
    if (!importFile) return;
    setIsImporting(true);
    setImportResult(null);
    try {
      const body = new FormData();
      body.append('file', importFile);
      if (dryRun) body.append('dry_run', 'true');
      const res = await apiClient.fetchRaw('/surveys/responses/import/', { method: 'POST', body });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.detail || `Impor gagal (HTTP ${res.status})`);
        return;
      }
      setImportResult(data as ImportSummary);
      if (dryRun) {
        toast.success(`Pratinjau: ${data.updated} baris akan diperbarui`);
      } else {
        toast.success(`${data.updated} survei diperbarui`);
        refetch();
      }
    } catch (e) {
      toast.error(`Impor gagal: ${e instanceof Error ? e.message : 'unknown'}`);
    } finally {
      setIsImporting(false);
    }
  };

  const closeImport = () => {
    setImportOpen(false);
    setImportFile(null);
    setImportResult(null);
    if (importInputRef.current) importInputRef.current.value = '';
  };

  const handleBulkDelete = async () => {
    try {
      const result = await bulkDelete.mutateAsync(selectedIds);
      toast.success(`${result.deleted} survei dipindahkan ke keranjang sampah`);
      setRowSelection({});
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Gagal memindahkan survei ke keranjang sampah');
    } finally {
      setBulkDeleteOpen(false);
    }
  };

  const columns = useMemo<ColumnDef<SurveyResponseItem, any>[]>(() => [
    {
      id: 'select',
      header: ({ table }) => (
        <div className="px-2">
          <Checkbox
            checked={table.getIsAllPageRowsSelected()}
            onCheckedChange={(v) => table.toggleAllPageRowsSelected(!!v)}
            aria-label="Select all"
          />
        </div>
      ),
      cell: ({ row }) => (
        <div className="px-2">
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(v) => row.toggleSelected(!!v)}
            aria-label="Select row"
          />
        </div>
      ),
      enableSorting: false,
    },
    {
      accessorKey: "id",
      header: "ID",
      cell: ({ row }) => {
        const status = row.original.verification_status;
        const label = row.original.status_display || status;
        const variant =
          status === 'VERIFIED' ? 'default' :
          status === 'SUBMITTED' ? 'secondary' :
          status === 'REJECTED' ? 'destructive' :
          'outline';
        return (
          <div className="flex flex-col items-start gap-1">
            <Badge variant={variant} className="text-[10px] px-1.5 py-0">{label}</Badge>
            <span className="w-12 font-medium">{row.getValue("id")}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "thumbnail",
      header: "Foto Thumbnail",
      enableSorting: false,
      cell: ({ row }) => {
        const src = row.getValue("thumbnail") as string | null;
        if (!src) {
          return (
            <div className="h-12 w-12 rounded-sm border bg-muted flex items-center justify-center text-[10px] text-muted-foreground">
              —
            </div>
          );
        }
        return (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt="Foto fasilitas"
            className="h-12 w-12 rounded-sm border object-cover"
            loading="lazy"
          />
        );
      },
    },
    {
      accessorKey: "service_name",
      header: "Nama Fasilitas",
      cell: ({ row }) => {
        const survey = row.original;
        const kategori = survey.kategori;
        return (
          <div className="max-w-[200px] flex flex-col gap-1">
            {kategori && (
              <Badge
                variant={kategori === 'FASKES' ? 'outline-info' : 'outline-muted'}
                className="w-fit"
              >
                {kategori === 'FASKES' ? 'Faskes' : 'Non-Faskes'}
              </Badge>
            )}
            <Link
              href={`/dashboard/survey/${survey.id}`}
              className="block font-medium whitespace-normal break-words text-primary hover:underline"
            >
              {row.getValue("service_name")}
            </Link>
          </div>
        );
      },
    },
    {
      accessorKey: "q1_nama_fasilitas",
      header: "Q1 - Nama Fasilitas",
      enableSorting: false,
      cell: ({ row }) => (
        <div className="max-w-[200px] whitespace-normal break-words text-sm">
          {row.getValue("q1_nama_fasilitas") || '—'}
        </div>
      ),
    },
    {
      id: "wilayah",
      header: "Wilayah",
      enableSorting: false,
      cell: ({ row }) => {
        const kec = row.original.service_kecamatan;
        const ds = row.original.service_desa;
        if (!kec && !ds) return <span className="text-muted-foreground">—</span>;
        return (
          <div className="max-w-[180px] whitespace-normal break-words text-sm">
            {kec && <span>Kec. {kec}</span>}
            {kec && ds && <span>, </span>}
            {ds && <span>Ds. {ds}</span>}
          </div>
        );
      },
    },
    {
      accessorKey: "jenis_fasilitas",
      header: "Q4 - Jenis Fasilitas",
      cell: ({ row }) => (
        <div className="max-w-[200px] whitespace-normal break-words text-sm">
          {row.getValue("jenis_fasilitas") || '—'}
        </div>
      ),
    },
    {
      accessorKey: "status_badan_hukum",
      header: "Q13 - Status Badan Hukum",
      enableSorting: false,
      cell: ({ row }) => (
        <div className="max-w-[200px] whitespace-normal break-words text-sm">
          {row.getValue("status_badan_hukum") || '—'}
        </div>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="outline"
            size="sm"
            className={`h-8 w-8 p-0 shadow-none rounded-sm ${row.getIsExpanded() ? 'bg-primary text-primary-foreground' : ''}`}
            onClick={() => row.toggleExpanded()}
            aria-label="Info survei"
            aria-expanded={row.getIsExpanded()}
          >
            <InformationCircleIcon className="h-4 w-4" />
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
            <DropdownMenuItem asChild>
              <Link href={`/dashboard/survey/${row.original.id}/edit`}>
                <Edit02Icon className="mr-2 h-4 w-4" />
                Edit
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {isAdmin ? (
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => setDeleteTarget(row.original)}
              >
                <Delete01Icon className="mr-2 h-4 w-4" />
                Hapus
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => {
                  setRequestReason('');
                  setRequestTarget(row.original);
                }}
              >
                <Delete01Icon className="mr-2 h-4 w-4" />
                Ajukan Hapus
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
        </div>
      ),
    },
  ], [isAdmin]);

  const tableData = useMemo(
    () => (data?.results ?? []) as unknown as SurveyResponseItem[],
    [data?.results],
  );

  const table = useReactTable({
    data: tableData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    manualSorting: true,
    enableSorting: false,
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    onExpandedChange: setExpanded,
    state: {
      sorting,
      rowSelection,
      expanded,
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

        <div className="flex items-start justify-between gap-3 px-6 pt-6">
          <div>
            <h1 className="text-xl font-bold">Semua Catatan Survei</h1>
            <p className="text-sm text-muted-foreground">Pengumpulan dan pemantauan data survei</p>
          </div>
          <div className="flex items-center gap-2">
            {/* Ekspor + Impor read as one segmented control, matching the
                toolbar on Model Kuisioner. */}
            <div className="relative flex h-9 rounded-md border overflow-hidden">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    disabled={isExporting}
                    className="flex h-full items-center justify-center gap-2 w-36 text-sm font-medium transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isExporting ? (
                      <>
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                        {exportProgress !== null ? `${exportProgress}%` : 'Mengekspor…'}
                      </>
                    ) : (
                      <>
                        <Download01Icon className="w-4 h-4" />
                        Ekspor
                      </>
                    )}
                  </button>
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

              {isAdmin && (
                <>
                  <div className="w-px bg-border" />
                  <button
                    type="button"
                    onClick={() => setImportOpen(true)}
                    className="flex h-full items-center justify-center gap-2 w-28 text-sm font-medium transition-colors hover:bg-accent"
                  >
                    <Upload01Icon className="w-4 h-4" />
                    Impor
                  </button>
                </>
              )}

              {isExporting && (
                <div className="absolute bottom-0 left-0 h-0.5 w-full overflow-hidden bg-muted">
                  <div
                    className={
                      exportProgress !== null
                        ? 'h-full bg-primary transition-all duration-200'
                        : 'h-full w-full animate-pulse bg-primary'
                    }
                    style={exportProgress !== null ? { width: `${exportProgress}%` } : undefined}
                  />
                </div>
              )}
            </div>
            <Button asChild size="sm" className="h-9 border border-input rounded-sm shadow-none box-border">
              <Link href="/survey/new">
                <PlusSignIcon className="w-4 h-4 mr-2" />
                Survei Baru
              </Link>
            </Button>
          </div>
        </div>

        <Separator />

        <div className="flex flex-col gap-3 px-6 pb-6">

          {selectedCount > 0 && isAdmin && (
            <div className="flex items-center gap-3 rounded-sm border bg-muted/50 px-4 py-2">
              <span className="text-sm font-medium">{selectedCount} dipilih</span>
              <Separator orientation="vertical" className="h-4" />
              <Button
                variant="destructive"
                size="sm"
                className="shadow-none rounded-sm"
                onClick={() => setBulkDeleteOpen(true)}
                disabled={bulkDelete.isPending}
              >
                <Delete01Icon className="w-4 h-4 mr-2" />
                {bulkDelete.isPending ? 'Memindahkan...' : 'Hapus Terpilih'}
              </Button>
            </div>
          )}

          <div className="flex gap-2 justify-between items-center">
            <ButtonGroup aria-label="Filter survei">
              {/* Status */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="min-h-9 bg-white shadow-none">
                    {statusFilter.length === 0
                      ? 'Status'
                      : statusFilter.length === 1
                        ? (STATUS_LABELS[statusFilter[0]] ?? statusFilter[0])
                        : `Status (${statusFilter.length})`}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-52">
                  <DropdownMenuLabel>Status Verifikasi</DropdownMenuLabel>
                  {STATUS_OPTIONS.map((o) => (
                    <DropdownMenuCheckboxItem
                      key={o.value}
                      checked={statusFilter.includes(o.value)}
                      onCheckedChange={() => toggleIn<string>(setStatusFilter, o.value)}
                      onSelect={(e) => e.preventDefault()}
                    >
                      {o.label}
                    </DropdownMenuCheckboxItem>
                  ))}
                  {statusFilter.length > 0 && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onSelect={() => setStatusFilter([])}>
                        Hapus filter
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Kategori */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="min-h-9 bg-white shadow-none">
                    {kategoriFilter.length === 0
                      ? 'Kategori'
                      : kategoriFilter.length === 1
                        ? (kategoriFilter[0] === 'FASKES' ? 'Faskes' : 'Non-Faskes')
                        : `Kategori (${kategoriFilter.length})`}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-44">
                  <DropdownMenuLabel>Kategori</DropdownMenuLabel>
                  <DropdownMenuCheckboxItem
                    checked={kategoriFilter.includes('FASKES')}
                    onCheckedChange={() => toggleIn<string>(setKategoriFilter, 'FASKES')}
                    onSelect={(e) => e.preventDefault()}
                  >
                    Faskes
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={kategoriFilter.includes('NON FASKES')}
                    onCheckedChange={() => toggleIn<string>(setKategoriFilter, 'NON FASKES')}
                    onSelect={(e) => e.preventDefault()}
                  >
                    Non-Faskes
                  </DropdownMenuCheckboxItem>
                  {kategoriFilter.length > 0 && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onSelect={() => setKategoriFilter([])}>
                        Hapus filter
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Tanggal */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="min-h-9 bg-white shadow-none">
                    {dateFilter ? dateFilter.toLocaleDateString('id-ID') : 'Tanggal'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dateFilter}
                    onSelect={setDateFilter}
                  />
                  {dateFilter && (
                    <div className="border-t p-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full"
                        onClick={() => setDateFilter(undefined)}
                      >
                        Hapus Tanggal
                      </Button>
                    </div>
                  )}
                </PopoverContent>
              </Popover>

              {/* Kecamatan */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="min-h-9 bg-white shadow-none">
                    {kecamatanFilter.length === 0
                      ? 'Kecamatan'
                      : kecamatanFilter.length === 1
                        ? kecamatanList.find((k) => k.id === kecamatanFilter[0])?.name ?? 'Kecamatan'
                        : `Kecamatan (${kecamatanFilter.length})`}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="max-h-72 overflow-y-auto w-52">
                  <DropdownMenuLabel>Kecamatan</DropdownMenuLabel>
                  {kecamatanList.map((k) => (
                    <DropdownMenuCheckboxItem
                      key={k.id}
                      checked={kecamatanFilter.includes(k.id)}
                      onCheckedChange={() => {
                        toggleIn(setKecamatanFilter, k.id);
                        setDesaFilter([]);
                      }}
                      onSelect={(e) => e.preventDefault()}
                    >
                      {k.name}
                    </DropdownMenuCheckboxItem>
                  ))}
                  {kecamatanFilter.length > 0 && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onSelect={() => { setKecamatanFilter([]); setDesaFilter([]); }}>
                        Hapus filter
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Desa (nested from Kecamatan) */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="min-h-9 bg-white shadow-none"
                    disabled={kecamatanFilter.length === 0}
                  >
                    {desaFilter.length === 0
                      ? 'Desa'
                      : desaFilter.length === 1
                        ? desaList.find((d) => d.id === desaFilter[0])?.name ?? 'Desa'
                        : `Desa (${desaFilter.length})`}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="max-h-72 overflow-y-auto w-52">
                  <DropdownMenuLabel>Desa</DropdownMenuLabel>
                  {desaList.map((d) => (
                    <DropdownMenuCheckboxItem
                      key={d.id}
                      checked={desaFilter.includes(d.id)}
                      onCheckedChange={() => toggleIn(setDesaFilter, d.id)}
                      onSelect={(e) => e.preventDefault()}
                    >
                      {d.name}
                    </DropdownMenuCheckboxItem>
                  ))}
                  {desaFilter.length > 0 && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onSelect={() => setDesaFilter([])}>
                        Hapus filter
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Enumerator */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="min-h-9 bg-white shadow-none">
                    {enumeratorFilter.length === 0
                      ? 'Enumerator'
                      : enumeratorFilter.length === 1
                        ? (() => {
                            const u = enumeratorList.find((e) => e.id === enumeratorFilter[0]);
                            return u ? (u.full_name || u.email) : 'Enumerator';
                          })()
                        : `Enumerator (${enumeratorFilter.length})`}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="max-h-72 overflow-y-auto w-56">
                  <DropdownMenuLabel>Enumerator</DropdownMenuLabel>
                  {enumeratorList.map((u) => (
                    <DropdownMenuCheckboxItem
                      key={u.id}
                      checked={enumeratorFilter.includes(u.id)}
                      onCheckedChange={() => toggleIn(setEnumeratorFilter, u.id)}
                      onSelect={(e) => e.preventDefault()}
                    >
                      {u.full_name || u.email}
                    </DropdownMenuCheckboxItem>
                  ))}
                  {enumeratorFilter.length > 0 && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onSelect={() => setEnumeratorFilter([])}>
                        Hapus filter
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </ButtonGroup>
            <div className="flex gap-2 items-center">
              <Select value={sorting.length > 0 ? `${sorting[0].id}-${sorting[0].desc ? 'desc' : 'asc'}` : 'default'} onValueChange={(value) => {
                if (value === 'default') {
                  setSorting([]);
                } else {
                  const [id, dir] = value.split('-');
                  setSorting([{ id, desc: dir === 'desc' }]);
                }
              }}>
                <SelectTrigger className="w-44 min-h-9 rounded-sm bg-white shadow-none" aria-label="Urutkan">
                  <HugeiconsIcon icon={SortingZA01Icon} size={16} />
                  <SelectValue placeholder="Urutkan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Urutkan</SelectItem>
                  <SelectItem value="service__name-asc">Fasilitas A-Z</SelectItem>
                  <SelectItem value="service__name-desc">Fasilitas Z-A</SelectItem>
                  <SelectItem value="survey_date-desc">Terbaru</SelectItem>
                  <SelectItem value="survey_date-asc">Terlama</SelectItem>
                  <SelectItem value="surveyor__email-asc">Enumerator A-Z</SelectItem>
                  <SelectItem value="surveyor__email-desc">Enumerator Z-A</SelectItem>
                </SelectContent>
              </Select>
              <Input
                placeholder="Cari berdasarkan nama layanan, kota..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-64 min-h-9 bg-white shadow-none rounded-sm"
                aria-label="Cari survei"
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
                  table.getRowModel().rows.map((row) => {
                    const rawDate = (row.original as { survey_date?: string | null }).survey_date;
                    const surveyDate = rawDate ? new Date(rawDate).toLocaleDateString('id-ID') : '—';
                    return (
                      <Fragment key={row.id}>
                        <TableRow
                          data-state={row.getIsSelected() && 'selected'}
                          className={row.getIsExpanded() ? 'bg-muted/60' : 'even:bg-muted'}
                        >
                          {row.getVisibleCells().map((cell) => (
                            <TableCell key={cell.id}>
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </TableCell>
                          ))}
                        </TableRow>
                        {row.getIsExpanded() && (
                          <TableRow className="bg-muted/30 hover:bg-muted/30">
                            <TableCell colSpan={row.getVisibleCells().length} className="py-3">
                              <div className="flex flex-wrap gap-x-10 gap-y-2 px-2 text-sm">
                                <div>
                                  <span className="text-xs text-muted-foreground block">Tgl Wawancara</span>
                                  <span className="font-medium">{surveyDate}</span>
                                </div>
                                <div>
                                  <span className="text-xs text-muted-foreground block">Lama Wawancara</span>
                                  <span className="font-medium">{formatDuration(row.original.started_at, row.original.submitted_at)}</span>
                                </div>
                                <div>
                                  <span className="text-xs text-muted-foreground block">Enumerator</span>
                                  <span className="font-medium">{row.original.surveyor_name || '—'}</span>
                                </div>
                                <div className="min-w-0">
                                  <span className="text-xs text-muted-foreground block">Kode DESDE-LTC</span>
                                  {(() => {
                                    const raw = (row.original as { kode_desde_ltc?: string[] | string | null }).kode_desde_ltc;
                                    const entries = Array.isArray(raw) ? raw : typeof raw === 'string' && raw ? [raw] : null;
                                    if (!entries || entries.length === 0) return <span className="text-muted-foreground">—</span>;
                                    return (
                                      <div className="flex flex-col gap-0.5">
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
                                  })()}
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </Fragment>
                    );
                  })
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

      {/* ADMIN: patch existing surveys from an exported sheet */}
      <Dialog open={importOpen} onOpenChange={(open: boolean) => (open ? setImportOpen(true) : closeImport())}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Impor pembaruan survei</DialogTitle>
            <DialogDescription>
              Unggah berkas hasil Ekspor (.xlsx atau .csv). Baris dicocokkan lewat kolom
              <span className="font-medium"> ID SURVEY</span>, jadi impor hanya memperbarui
              survei yang sudah ada — tidak pernah membuat yang baru. Sel yang dikosongkan
              dibiarkan apa adanya.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Input
              ref={importInputRef}
              type="file"
              accept=".csv,.xlsx"
              onChange={(e) => {
                setImportFile(e.target.files?.[0] ?? null);
                setImportResult(null);
              }}
              className="h-9 rounded-sm shadow-none"
            />

            {importResult && (
              <div className="rounded-sm border p-3 text-sm space-y-2">
                <p className="font-medium">
                  {importResult.dry_run ? 'Pratinjau (belum disimpan)' : 'Selesai'}
                </p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-muted-foreground">
                  <span>Baris dibaca</span><span className="tabular-nums">{importResult.rows_read}</span>
                  <span>Diperbarui</span><span className="tabular-nums">{importResult.updated}</span>
                  <span>Tidak berubah</span><span className="tabular-nums">{importResult.unchanged}</span>
                  <span>Konflik</span><span className="tabular-nums">{importResult.conflicts}</span>
                  <span>Gagal</span><span className="tabular-nums">{importResult.failed}</span>
                </div>
                {(importResult.errors.length > 0 || importResult.conflict_details.length > 0) && (
                  <ul className="max-h-40 overflow-y-auto space-y-1 border-t pt-2 text-xs text-muted-foreground">
                    {importResult.errors.map((e, i) => (
                      <li key={`e${i}`}>Baris {e.line}: {e.error}</li>
                    ))}
                    {importResult.conflict_details.map((e, i) => (
                      <li key={`c${i}`}>Baris {e.line} ({e.question}): {e.error}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeImport} className="rounded-sm shadow-none">
              Tutup
            </Button>
            <Button
              variant="outline"
              onClick={() => runImport(true)}
              disabled={!importFile || isImporting}
              className="rounded-sm shadow-none"
            >
              Periksa dulu
            </Button>
            <Button
              onClick={() => runImport(false)}
              disabled={!importFile || isImporting}
              className="rounded-sm shadow-none"
            >
              {isImporting ? 'Memproses…' : 'Terapkan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ADMIN: move a single survey to the trash bin */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Pindahkan survei ke keranjang sampah?</AlertDialogTitle>
            <AlertDialogDescription>
              Survei{deleteTarget?.service_name ? ` "${deleteTarget.service_name}"` : ''} akan
              dipindahkan ke Keranjang Sampah dan tidak lagi muncul di daftar, antrean verifikasi,
              maupun ekspor. Anda dapat memulihkannya kapan saja dari menu Keranjang Sampah.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteSurvey.isPending}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {deleteSurvey.isPending ? 'Memindahkan...' : 'Pindahkan ke Sampah'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ADMIN: move the selected surveys to the trash bin */}
      <AlertDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Pindahkan {selectedCount} survei ke keranjang sampah?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Survei yang dipilih akan dipindahkan ke Keranjang Sampah dan tidak lagi muncul di
              daftar, antrean verifikasi, maupun ekspor. Anda dapat memulihkannya kapan saja.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              disabled={bulkDelete.isPending}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {bulkDelete.isPending ? 'Memindahkan...' : 'Pindahkan ke Sampah'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Non-admin: file a deletion request for a verifier/admin to approve */}
      <AlertDialog open={!!requestTarget} onOpenChange={(open) => !open && setRequestTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ajukan permintaan hapus</AlertDialogTitle>
            <AlertDialogDescription>
              Survei{requestTarget?.service_name ? ` "${requestTarget.service_name}"` : ''} tidak
              langsung dihapus. Permintaan Anda akan ditinjau oleh verifikator atau admin terlebih
              dahulu.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="grid gap-2">
            <label htmlFor="deletion-reason" className="text-sm font-medium">
              Alasan penghapusan
            </label>
            <Textarea
              id="deletion-reason"
              value={requestReason}
              onChange={(e) => setRequestReason(e.target.value)}
              placeholder="Jelaskan alasan survei ini perlu dihapus"
              rows={4}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRequestDeletion}
              disabled={requestDeletion.isPending || requestReason.trim().length === 0}
            >
              {requestDeletion.isPending ? 'Mengajukan...' : 'Ajukan Hapus'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
