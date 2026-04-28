'use client';

import { useState, useMemo, useCallback } from 'react';
import { toast } from 'sonner';
import { PageHeader } from "@/components/page-header";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
  getFilteredRowModel,
  getPaginationRowModel,
  PaginationState,
  useReactTable,
} from "@tanstack/react-table";
import {
  Add01Icon,
  Upload01Icon,
  Download01Icon,
  MoreHorizontalIcon,
  Edit04Icon,
  Delete01Icon,
  EyeIcon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
  Search01Icon,
} from 'hugeicons-react';
import {
  useGeographicUnits,
  useCreateGeographicUnit,
  useUpdateGeographicUnit,
  useDeleteGeographicUnit,
  useImportGeographicUnits,
  exportGeographicUnits,
} from '@/hooks/use-geographic-units';
import { GeographicUnit, GeographicUnitImportResult } from '@/hooks/use-geographic-units';

const LEVEL_LABELS: Record<string, string> = {
  PROVINSI: 'Provinsi',
  KABUPATEN_KOTA: 'Kabupaten/Kota',
  KECAMATAN: 'Kecamatan',
  DESA_KELURAHAN: 'Desa/Kelurahan',
};

const LEVEL_OPTIONS = [
  { value: 'PROVINSI', label: 'Provinsi' },
  { value: 'KABUPATEN_KOTA', label: 'Kabupaten/Kota' },
  { value: 'KECAMATAN', label: 'Kecamatan' },
  { value: 'DESA_KELURAHAN', label: 'Desa/Kelurahan' },
];

const breadcrumbs = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Layanan', href: '/dashboard/services' },
  { label: 'Wilayah Geografis' },
];

function ImportDialog({ open, onOpenChange, onImport, isPending, result }: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onImport: (file: File, updateExisting: boolean) => void;
  isPending: boolean;
  result: GeographicUnitImportResult | null;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [updateExisting, setUpdateExisting] = useState(false);

  function handleClose(v: boolean) {
    if (!v) {
      setFile(null);
      setUpdateExisting(false);
    }
    onOpenChange(v);
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Import Wilayah Geografis</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <p className="text-sm text-muted-foreground">
            Upload CSV/XLSX/JSON dengan kolom: <span className="font-mono text-xs bg-muted px-1 rounded">code</span>, <span className="font-mono text-xs bg-muted px-1 rounded">name</span>, <span className="font-mono text-xs bg-muted px-1 rounded">level</span>, <span className="font-mono text-xs bg-muted px-1 rounded">parent</span>
          </p>
          <div className="space-y-2">
            <Label>File * <span className="text-muted-foreground font-normal">(CSV, XLSX, JSON)</span></Label>
            <div className="flex rounded-md border overflow-hidden">
              <label htmlFor="geo-import-file" className="flex items-center justify-center px-4 py-1.5 text-sm font-medium hover:bg-accent transition-colors cursor-pointer whitespace-nowrap">Pilih File</label>
              <div className="w-px bg-border" />
              <span className="flex items-center px-3 py-1.5 text-sm text-muted-foreground truncate flex-1">{file ? file.name : 'Belum ada file'}</span>
              <input id="geo-import-file" type="file" accept=".csv,.xlsx,.json" className="sr-only" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input id="geo-update-existing" type="checkbox" checked={updateExisting} onChange={(e) => setUpdateExisting(e.target.checked)} />
            <Label htmlFor="geo-update-existing" className="text-sm font-normal cursor-pointer">Update data yang sudah ada</Label>
          </div>
          {result && (
            <div className="rounded-lg border p-3 space-y-2">
              {result.created > 0 && <p className="text-sm font-medium text-green-600">{result.created} wilayah dibuat.</p>}
              {result.updated > 0 && <p className="text-sm font-medium text-blue-600">{result.updated} wilayah diperbarui.</p>}
              {result.created === 0 && result.updated === 0 && <p className="text-sm font-medium text-muted-foreground">Tidak ada data yang diimport.</p>}
              {result.errors.length > 0 && (
                <div className="space-y-1">
                  <p className="text-sm font-medium text-destructive">{result.errors.length} baris dilewati:</p>
                  <ul className="text-xs text-muted-foreground space-y-0.5 max-h-32 overflow-y-auto">
                    {result.errors.map((e, i) => <li key={i}>Baris {e.row}: {e.error}</li>)}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{result ? 'Tutup' : 'Batal'}</Button>
          {!result && <Button onClick={() => file && onImport(file, updateExisting)} disabled={!file || isPending}>{isPending ? 'Mengimport...' : 'Import'}</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function GeographicUnitsPage() {
  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 20 });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<GeographicUnit | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [importResult, setImportResult] = useState<GeographicUnitImportResult | null>(null);

  const [form, setForm] = useState({
    code: '',
    name: '',
    level: 'KECAMATAN',
    parent: '' as string,
    is_active: true,
  });

  const { data: parentOptions = [] } = useGeographicUnits({
    level: form.level === 'DESA_KELURAHAN' ? 'KECAMATAN'
      : form.level === 'KECAMATAN' ? 'KABUPATEN_KOTA'
      : form.level === 'KABUPATEN_KOTA' ? 'PROVINSI' : undefined,
    is_active: true,
  });

  const { data: allUnits = [], isLoading } = useGeographicUnits({ is_active: undefined });

  const createMutation = useCreateGeographicUnit();
  const updateMutation = useUpdateGeographicUnit();
  const deleteMutation = useDeleteGeographicUnit();
  const importMutation = useImportGeographicUnits();

  const filteredData = useMemo(() => {
    let result = allUnits;
    if (levelFilter) result = result.filter(r => r.level === levelFilter);
    if (statusFilter === 'active') result = result.filter(r => r.is_active);
    if (statusFilter === 'inactive') result = result.filter(r => !r.is_active);
    return result;
  }, [allUnits, levelFilter, statusFilter]);

  const searchedData = useMemo(() => {
    if (!search.trim()) return filteredData;
    const s = search.toLowerCase();
    return filteredData.filter(r =>
      r.name.toLowerCase().includes(s) ||
      r.code.toLowerCase().includes(s) ||
      (r.parent_name && r.parent_name.toLowerCase().includes(s))
    );
  }, [filteredData, search]);

  function openAdd() {
    setEditTarget(null);
    setForm({ code: '', name: '', level: 'KECAMATAN', parent: '', is_active: true });
    setDialogOpen(true);
  }

  function openEdit(row: GeographicUnit) {
    setEditTarget(row);
    setForm({
      code: row.code,
      name: row.name,
      level: row.level,
      parent: row.parent?.toString() ?? '',
      is_active: row.is_active,
    });
    setDialogOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      code: form.code,
      name: form.name,
      level: form.level,
      parent: form.parent ? Number(form.parent) : null,
      is_active: form.is_active,
    };

    if (editTarget) {
      await updateMutation.mutateAsync({ id: editTarget.id, data: payload });
    } else {
      await createMutation.mutateAsync(payload);
    }
    setDialogOpen(false);
  }

  async function handleDelete(id: number) {
    await deleteMutation.mutateAsync(id);
    setDeleteConfirmId(null);
  }

  const handleToggleActive = useCallback(async (row: GeographicUnit) => {
    await updateMutation.mutateAsync({ id: row.id, data: { is_active: !row.is_active } });
  }, [updateMutation]);

  const columns = useMemo<ColumnDef<GeographicUnit>[]>(() => [
    {
      accessorKey: 'code',
      header: 'Kode',
      cell: ({ row }) => <div className="font-mono font-medium">{row.getValue('code')}</div>,
    },
    {
      accessorKey: 'name',
      header: 'Nama',
      cell: ({ row }) => <div className="font-medium">{row.getValue('name')}</div>,
    },
    {
      accessorKey: 'level',
      header: 'Level',
      cell: ({ row }) => (
        <Badge variant="outline" className="text-xs">
          {LEVEL_LABELS[row.getValue('level') as string] || row.getValue('level') as string}
        </Badge>
      ),
    },
    {
      accessorKey: 'parent_name',
      header: 'Induk',
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.parent_name || '-'}
        </span>
      ),
    },
    {
      accessorKey: 'is_active',
      header: 'Status',
      cell: ({ row }) => row.getValue('is_active')
        ? <Badge variant="outline" className="text-green-600 border-green-600">Aktif</Badge>
        : <Badge variant="outline" className="text-red-600 border-red-600">Tidak Aktif</Badge>,
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 w-8 p-0"><MoreHorizontalIcon className="h-4 w-4" /></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => openEdit(row.original)}><Edit04Icon className="mr-2 h-4 w-4" />Edit</DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleToggleActive(row.original)}>
              <EyeIcon className="mr-2 h-4 w-4" />
              {row.original.is_active ? 'Set Tidak Aktif' : 'Set Aktif'}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => setDeleteConfirmId(row.original.id)}
            >
              <Delete01Icon className="mr-2 h-4 w-4" />Hapus
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ], [handleToggleActive]);

  const table = useReactTable({
    data: searchedData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onPaginationChange: setPagination,
    state: { pagination },
    initialState: {
      pagination: { pageIndex: 0, pageSize: 20 },
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <>
      <PageHeader breadcrumbs={breadcrumbs} />
      <div className="flex flex-1 flex-col gap-4 p-4">
        <div className="border-b pb-4 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold">Wilayah Geografis</h1>
            <p className="text-muted-foreground">Kelola data Provinsi, Kabupaten/Kota, Kecamatan, dan Desa/Kelurahan</p>
          </div>
          <div className="flex items-center rounded-md border overflow-hidden">
            <button onClick={() => { setImportResult(null); setImportOpen(true); }} className="flex items-center justify-center gap-2 w-28 py-1.5 text-sm font-medium hover:bg-accent transition-colors">
              <Upload01Icon className="w-4 h-4" />Import
            </button>
            <div className="w-px bg-border" />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center justify-center gap-2 w-32 py-1.5 text-sm font-medium hover:bg-accent transition-colors">
                  <Download01Icon className="w-4 h-4" />Export All
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => exportGeographicUnits(undefined, 'csv').then(() => toast.success('Export CSV berhasil')).catch((e) => toast.error(e.message))}>Export sebagai CSV</DropdownMenuItem>
                <DropdownMenuItem onClick={() => exportGeographicUnits(undefined, 'xlsx').then(() => toast.success('Export XLSX berhasil')).catch((e) => toast.error(e.message))}>Export sebagai XLSX</DropdownMenuItem>
                <DropdownMenuItem onClick={() => exportGeographicUnits(undefined, 'json').then(() => toast.success('Export JSON berhasil')).catch((e) => toast.error(e.message))}>Export sebagai JSON</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <div className="w-px bg-border" />
            <button onClick={openAdd} className="flex items-center justify-center gap-2 w-36 py-1.5 text-sm font-medium hover:bg-accent transition-colors">
              <Add01Icon className="w-4 h-4" />
              Tambah Wilayah
            </button>
          </div>
        </div>

        <div className="flex gap-2 items-center">
          <div className="relative flex-1 max-w-sm">
            <Search01Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari kode atau nama..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPagination(p => ({ ...p, pageIndex: 0 })); }}
              className="pl-9"
            />
          </div>
          <div className="flex items-center rounded-md border overflow-hidden">
            <select
              value={levelFilter}
              onChange={(e) => { setLevelFilter(e.target.value); setPagination(p => ({ ...p, pageIndex: 0 })); }}
              className="px-3 py-1.5 text-sm font-medium bg-transparent outline-none hover:bg-accent transition-colors cursor-pointer"
            >
              <option value="">Semua Level</option>
              {LEVEL_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <div className="w-px bg-border" />
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPagination(p => ({ ...p, pageIndex: 0 })); }}
              className="px-3 py-1.5 text-sm font-medium bg-transparent outline-none hover:bg-accent transition-colors cursor-pointer"
            >
              <option value="">Semua Status</option>
              <option value="active">Aktif</option>
              <option value="inactive">Tidak Aktif</option>
            </select>
          </div>
        </div>

        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((hg) => (
                <TableRow key={hg.id}>
                  {hg.headers.map((h) => (
                    <TableHead key={h.id}>
                      {h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.length ? (
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
                    Tidak ada data wilayah geografis.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {searchedData.length > 0
              ? `Menampilkan ${pagination.pageIndex * pagination.pageSize + 1}–${Math.min((pagination.pageIndex + 1) * pagination.pageSize, searchedData.length)} dari ${searchedData.length}`
              : 'Tidak ada hasil'}
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <ArrowLeft01Icon className="h-4 w-4" />
            </Button>
            <span className="text-sm px-2">
              Halaman {table.getState().pagination.pageIndex + 1} dari {table.getPageCount()}
            </span>
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <ArrowRight01Icon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editTarget ? 'Edit Wilayah' : 'Tambah Wilayah Baru'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="geo-level">Level *</Label>
              <select
                id="geo-level"
                value={form.level}
                onChange={(e) => setForm((f) => ({ ...f, level: e.target.value, parent: '' }))}
                className="flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-1"
                required
              >
                {LEVEL_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="geo-code">Kode *</Label>
              <Input
                id="geo-code"
                value={form.code}
                onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
                placeholder="Contoh: KEC001"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="geo-name">Nama *</Label>
              <Input
                id="geo-name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Contoh: Kecamatan Ayah"
                required
              />
            </div>

            {form.level !== 'PROVINSI' && (
              <div className="space-y-2">
                <Label htmlFor="geo-parent">
                  {form.level === 'KABUPATEN_KOTA' ? 'Provinsi Induk' :
                   form.level === 'KECAMATAN' ? 'Kabupaten/Kota Induk' :
                   'Kecamatan Induk'}
                </Label>
                <select
                  id="geo-parent"
                  value={form.parent}
                  onChange={(e) => setForm((f) => ({ ...f, parent: e.target.value }))}
                  className="flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-1"
                >
                  <option value="">— Pilih Induk —</option>
                  {parentOptions.map((opt) => (
                    <option key={opt.id} value={opt.id}>{opt.name}</option>
                  ))}
                </select>
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Batal
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {createMutation.isPending || updateMutation.isPending
                  ? 'Menyimpan...'
                  : editTarget
                  ? 'Simpan Perubahan'
                  : 'Tambah'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirmId} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Konfirmasi Hapus</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Apakah Anda yakin ingin menghapus wilayah ini? Tindakan ini tidak dapat dibatalkan.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Menghapus...' : 'Hapus'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        result={importResult}
        isPending={importMutation.isPending}
        onImport={async (file, updateExisting) => {
          try {
            const result = await importMutation.mutateAsync({ file, updateExisting });
            setImportResult(result);
            if (result.created > 0 || result.updated > 0) {
              toast.success(`Import berhasil: ${result.created} dibuat, ${result.updated} diperbarui`);
            } else {
              toast.message('Import selesai tanpa perubahan');
            }
          } catch (e) {
            toast.error(e instanceof Error ? e.message : 'Import gagal');
          }
        }}
      />
    </>
  );
}
