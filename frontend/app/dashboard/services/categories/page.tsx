'use client';

import { useState, useMemo, forwardRef, useImperativeHandle, useRef } from 'react';
import {
  useBasicStableInputsOfCare,
  useCreateBSIC, useUpdateBSIC, useDeleteBSIC,
  useBulkDeleteBSIC, useBulkUpdateBSIC, exportBSIC, useImportBSIC,
  useKategoriLayanan,
} from '@/hooks/use-services';
import { PageHeader } from "@/components/page-header";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
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
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  SortingState,
  RowSelectionState,
  PaginationState,
  useReactTable,
} from "@tanstack/react-table";
import { BasicStableInputsOfCare } from "@/lib/types/api";
import { Separator } from '@/components/ui/separator';
import { ButtonGroup } from "@/components/ui/button-group";
import { Add01Icon, Upload01Icon, MoreHorizontalIcon, Edit04Icon, Delete01Icon, EyeIcon, Download01Icon, ArrangeByLettersAZIcon } from 'hugeicons-react';

const breadcrumbs = [
  { label: 'Dasbor', href: '/dashboard' },
  { label: 'Layanan', href: '/dashboard/services' },
  { label: 'Kategori Layanan' },
];

type ImportResult = { created: number; updated: number; errors: { row: number; error: string }[] };

function ImportDialog({
  open,
  onOpenChange,
  onImport,
  isPending,
  result,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (file: File, updateExisting: boolean) => void;
  isPending: boolean;
  result: ImportResult | null;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [updateExisting, setUpdateExisting] = useState(false);

  function handleClose(open: boolean) {
    if (!open) { setFile(null); setUpdateExisting(false); }
    onOpenChange(open);
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Impor dari CSV</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <p className="text-sm text-muted-foreground">
            Unggah berkas CSV dengan kolom: <span className="font-mono text-xs bg-muted px-1 rounded">code</span>, <span className="font-mono text-xs bg-muted px-1 rounded">name</span>, <span className="font-mono text-xs bg-muted px-1 rounded">description</span>, <span className="font-mono text-xs bg-muted px-1 rounded">is_active</span>
          </p>
          <div className="space-y-2">
            <Label>Berkas * <span className="text-muted-foreground font-normal">(CSV, XLSX, JSON)</span></Label>
            <div className="flex rounded-md border overflow-hidden">
              <label htmlFor="csv-file" className="flex items-center justify-center px-4 py-1.5 text-sm font-medium hover:bg-accent transition-colors cursor-pointer whitespace-nowrap">
                Pilih Berkas
              </label>
              <div className="w-px bg-border" />
              <span className="flex items-center px-3 py-1.5 text-sm text-muted-foreground truncate flex-1">
                {file ? file.name : 'Belum ada berkas dipilih'}
              </span>
              <input id="csv-file" type="file" accept=".csv,.xlsx,.json" className="sr-only" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="update-existing" checked={updateExisting} onCheckedChange={(v) => setUpdateExisting(!!v)} />
            <Label htmlFor="update-existing" className="text-sm font-normal cursor-pointer">
              Perbarui data yang sudah ada (cocokkan berdasarkan kode)
            </Label>
          </div>
          {result && (
            <div className="rounded-lg border p-3 space-y-2">
              {result.created > 0 && <p className="text-sm font-medium text-green-600">{result.created} data dibuat.</p>}
              {result.updated > 0 && <p className="text-sm font-medium text-blue-600">{result.updated} data diperbarui.</p>}
              {result.created === 0 && result.updated === 0 && <p className="text-sm font-medium text-muted-foreground">Tidak ada data yang diimpor.</p>}
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
          {!result && (
            <Button onClick={() => file && onImport(file, updateExisting)} disabled={!file || isPending}>
              {isPending ? 'Mengimpor...' : 'Impor'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface TabActions {
  openAdd: () => void;
  openImport: () => void;
  exportAll: (format?: 'csv' | 'xlsx' | 'json') => void;
}

const BSICTab = forwardRef<TabActions>(function BSICTab(_, ref) {
  const [search, setSearch] = useState('');
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<BasicStableInputsOfCare | null>(null);
  const [form, setForm] = useState<{
    code: string; name: string; description: string;
    kategori_layanan: number | null; kategori_fasilitas: 'KESEHATAN' | 'NON_KESEHATAN' | '';
  }>({ code: '', name: '', description: '', kategori_layanan: null, kategori_fasilitas: '' });
  const [bulkEditOpen, setBulkEditOpen] = useState(false);
  const [bulkStatus, setBulkStatus] = useState('');
  const [importOpen, setImportOpen] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterKF, setFilterKF] = useState('');
  const [filterKL, setFilterKL] = useState('');

  const { data, isLoading } = useBasicStableInputsOfCare();
  const { data: kategoriLayananList } = useKategoriLayanan();

  const filteredData = useMemo(() => {
    let result = data ?? [];
    if (filterStatus) result = result.filter(r => filterStatus === 'active' ? r.is_active : !r.is_active);
    if (filterKF) result = result.filter(r => r.kategori_fasilitas === filterKF);
    if (filterKL) result = result.filter(r => String(r.kategori_layanan) === filterKL);
    return result;
  }, [data, filterStatus, filterKF, filterKL]);

  const createBSIC = useCreateBSIC();
  const updateBSIC = useUpdateBSIC();
  const deleteBSIC = useDeleteBSIC();
  const bulkDeleteBSIC = useBulkDeleteBSIC();
  const bulkUpdateBSIC = useBulkUpdateBSIC();
  const importBSIC = useImportBSIC();

  function openAdd() {
    setEditTarget(null);
    setForm({ code: '', name: '', description: '', kategori_layanan: null, kategori_fasilitas: '' });
    setDialogOpen(true);
  }

  useImperativeHandle(ref, () => ({
    openAdd,
    openImport: () => { setImportResult(null); setImportOpen(true); },
    exportAll: (format = 'csv') => exportBSIC(undefined, format),
  }));

  function openEdit(row: BasicStableInputsOfCare) {
    setEditTarget(row);
    setForm({
      code: row.code, name: row.name, description: row.description ?? '',
      kategori_layanan: row.kategori_layanan ?? null,
      kategori_fasilitas: (row.kategori_fasilitas as 'KESEHATAN' | 'NON_KESEHATAN' | '') ?? '',
    });
    setDialogOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editTarget) await updateBSIC.mutateAsync({ id: editTarget.id, ...form });
    else await createBSIC.mutateAsync(form);
    setDialogOpen(false);
  }

  const columns = useMemo<ColumnDef<BasicStableInputsOfCare, any>[]>(() => [
    {
      id: 'select',
      header: ({ table }) => <Checkbox checked={table.getIsAllPageRowsSelected()} onCheckedChange={(v) => table.toggleAllPageRowsSelected(!!v)} aria-label="Select all" />,
      cell: ({ row }) => <Checkbox checked={row.getIsSelected()} onCheckedChange={(v) => row.toggleSelected(!!v)} aria-label="Select row" />,
      enableSorting: false, enableGlobalFilter: false,
    },
    { accessorKey: 'code', header: 'Kode', cell: ({ row }) => <div className="font-mono font-medium">{row.getValue('code')}</div> },
    { accessorKey: 'name', header: 'Nama', cell: ({ row }) => <div className="font-medium max-w-xs whitespace-normal break-words">{row.getValue('name')}</div> },
    {
      accessorKey: 'kategori_layanan_name', header: 'Kategori Layanan',
      cell: ({ row }) => <div className="text-sm">{row.original.kategori_layanan_name || <span className="text-muted-foreground">-</span>}</div>,
    },
    {
      accessorKey: 'kategori_fasilitas', header: 'Kategori Fasilitas',
      cell: ({ row }) => {
        const kf = row.original.kategori_fasilitas;
        if (!kf) return <span className="text-muted-foreground text-sm">-</span>;
        return kf === 'KESEHATAN'
          ? <Badge variant="outline-info">Fasilitas Kesehatan</Badge>
          : <Badge variant="outline-warning">Non Kesehatan</Badge>;
      },
    },
    { accessorKey: 'description', header: 'Deskripsi', cell: ({ row }) => <div className="max-w-xs text-sm text-muted-foreground">{(row.getValue('description') as string) || '-'}</div> },
    {
      accessorKey: 'is_active', header: 'Status',
      cell: ({ row }) => row.getValue('is_active')
        ? <Badge variant="default">Aktif</Badge>
        : <Badge variant="secondary">Nonaktif</Badge>,
    },
    {
      id: 'actions', header: '',
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 w-8 p-0 rounded-sm"><MoreHorizontalIcon className="h-4 w-4" /></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => openEdit(row.original)}><Edit04Icon className="mr-2 h-4 w-4" />Ubah</DropdownMenuItem>
            <DropdownMenuItem onClick={() => updateBSIC.mutateAsync({ id: row.original.id, is_active: !row.original.is_active })}><EyeIcon className="mr-2 h-4 w-4" />{row.original.is_active ? 'Nonaktifkan' : 'Aktifkan'}</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => deleteBSIC.mutateAsync(row.original.id)}><Delete01Icon className="mr-2 h-4 w-4" />Hapus</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ], []);

  const table = useReactTable({ data: filteredData, columns, getCoreRowModel: getCoreRowModel(), getSortedRowModel: getSortedRowModel(), getFilteredRowModel: getFilteredRowModel(), getPaginationRowModel: getPaginationRowModel(), onSortingChange: setSorting, onRowSelectionChange: setRowSelection, onPaginationChange: setPagination, state: { sorting, globalFilter: search, rowSelection, pagination }, onGlobalFilterChange: (v) => { setSearch(v); setPagination(p => ({ ...p, pageIndex: 0 })); }, enableRowSelection: true });
  const selectedCount = table.getSelectedRowModel().rows.length;
  const selectedIds = table.getSelectedRowModel().rows.map((r) => r.original.id);

  if (isLoading) return <div className="flex items-center justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>;

  const statusLabel = filterStatus === 'active' ? 'Aktif' : filterStatus === 'inactive' ? 'Nonaktif' : 'Status';
  const kfLabel = filterKF === 'KESEHATAN' ? 'Kesehatan' : filterKF === 'NON_KESEHATAN' ? 'Non Kesehatan' : 'Fasilitas';
  const klLabel = filterKL ? ((kategoriLayananList ?? []).find(kl => String(kl.id) === filterKL)?.name ?? 'Kategori Layanan') : 'Kategori Layanan';

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2 justify-between items-center">
        <ButtonGroup aria-label="Filter kategori BSIC">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="min-h-9 bg-white shadow-none">{statusLabel}</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-44">
              <DropdownMenuLabel>Status</DropdownMenuLabel>
              <DropdownMenuCheckboxItem checked={filterStatus === 'active'} onCheckedChange={() => setFilterStatus(filterStatus === 'active' ? '' : 'active')} onSelect={(e) => e.preventDefault()}>Aktif</DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem checked={filterStatus === 'inactive'} onCheckedChange={() => setFilterStatus(filterStatus === 'inactive' ? '' : 'inactive')} onSelect={(e) => e.preventDefault()}>Nonaktif</DropdownMenuCheckboxItem>
              {filterStatus && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={() => setFilterStatus('')}>Hapus filter</DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="min-h-9 bg-white shadow-none">{kfLabel}</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuLabel>Kategori Fasilitas</DropdownMenuLabel>
              <DropdownMenuCheckboxItem checked={filterKF === 'KESEHATAN'} onCheckedChange={() => setFilterKF(filterKF === 'KESEHATAN' ? '' : 'KESEHATAN')} onSelect={(e) => e.preventDefault()}>Kesehatan</DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem checked={filterKF === 'NON_KESEHATAN'} onCheckedChange={() => setFilterKF(filterKF === 'NON_KESEHATAN' ? '' : 'NON_KESEHATAN')} onSelect={(e) => e.preventDefault()}>Non Kesehatan</DropdownMenuCheckboxItem>
              {filterKF && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={() => setFilterKF('')}>Hapus filter</DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="min-h-9 bg-white shadow-none">{klLabel}</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="max-h-72 overflow-y-auto w-56">
              <DropdownMenuLabel>Kategori Layanan</DropdownMenuLabel>
              {(kategoriLayananList ?? []).map(kl => (
                <DropdownMenuCheckboxItem key={kl.id} checked={filterKL === String(kl.id)} onCheckedChange={() => setFilterKL(filterKL === String(kl.id) ? '' : String(kl.id))} onSelect={(e) => e.preventDefault()}>{kl.name}</DropdownMenuCheckboxItem>
              ))}
              {filterKL && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={() => setFilterKL('')}>Hapus filter</DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </ButtonGroup>
        <div className="flex gap-2 items-center">
          <Button variant="outline" size="sm" className="min-h-9 bg-white shadow-none rounded-sm" onClick={() => setSorting((s) => s.length && s[0].id === 'name' && !s[0].desc ? [{ id: 'name', desc: true }] : [{ id: 'name', desc: false }])}><ArrangeByLettersAZIcon className="w-4 h-4" /></Button>
          <Input placeholder="Cari berdasarkan kode, nama atau deskripsi..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-64 min-h-9 rounded-sm bg-white shadow-none" />
        </div>
      </div>

      {selectedCount > 0 && (
        <div className="flex items-center gap-3 rounded-sm border bg-muted/50 px-4 py-2">
          <span className="text-sm font-medium">{selectedCount} dipilih</span>
          <Separator orientation="vertical" className="h-4" />
          <Button variant="outline" size="sm" className="w-40 justify-center rounded-sm shadow-none" onClick={() => { setBulkStatus(''); setBulkEditOpen(true); }}><Edit04Icon className="w-4 h-4 mr-2" />Ubah Massal</Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="w-40 justify-center rounded-sm shadow-none"><Download01Icon className="w-4 h-4 mr-2" />Ekspor Terpilih</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => exportBSIC(selectedIds, 'csv')}>Ekspor sebagai CSV</DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportBSIC(selectedIds, 'xlsx')}>Ekspor sebagai XLSX</DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportBSIC(selectedIds, 'json')}>Ekspor sebagai JSON</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="destructive" size="sm" className="w-40 justify-center rounded-sm shadow-none" onClick={async () => { await bulkDeleteBSIC.mutateAsync(selectedIds); setRowSelection({}); }} disabled={bulkDeleteBSIC.isPending}><Delete01Icon className="w-4 h-4 mr-2" />{bulkDeleteBSIC.isPending ? 'Menghapus...' : 'Hapus Terpilih'}</Button>
          <Button variant="ghost" size="sm" onClick={() => setRowSelection({})}>Bersihkan</Button>
        </div>
      )}

      <div className="rounded-sm border bg-white overflow-hidden">
        <Table>
          <TableHeader>{table.getHeaderGroups().map((hg) => (<TableRow key={hg.id} className="bg-muted/50">{hg.headers.map((h) => <TableHead key={h.id} className="border-r last:border-r-0">{h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}</TableHead>)}</TableRow>))}</TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? table.getRowModel().rows.map((row) => (
              <TableRow key={row.id} className="even:bg-muted">{row.getVisibleCells().map((cell) => <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>)}</TableRow>
            )) : <TableRow><TableCell colSpan={columns.length} className="h-24 text-center">Tidak ada kategori BSIC ditemukan.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {filteredData.length > 0 ? `Menampilkan ${pagination.pageIndex * pagination.pageSize + 1}–${Math.min((pagination.pageIndex + 1) * pagination.pageSize, table.getFilteredRowModel().rows.length)} dari ${table.getFilteredRowModel().rows.length}` : 'Tidak ada hasil'}
        </p>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="shadow-none rounded-sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>Sebelumnya</Button>
          <span className="text-sm text-muted-foreground">Halaman {table.getState().pagination.pageIndex + 1} dari {table.getPageCount()}</span>
          <Button variant="outline" size="sm" className="shadow-none rounded-sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>Selanjutnya</Button>
        </div>
      </div>

      <ImportDialog open={importOpen} onOpenChange={setImportOpen} result={importResult} isPending={importBSIC.isPending}
        onImport={async (file, updateExisting) => { const r = await importBSIC.mutateAsync({ file, updateExisting }); setImportResult(r); }} />

      <Dialog open={bulkEditOpen} onOpenChange={setBulkEditOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Ubah Massal — {selectedCount} kategori</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Atur Status</Label>
              <div className="flex gap-2">
                <button type="button" onClick={() => setBulkStatus('active')} className={`flex-1 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${bulkStatus === 'active' ? 'border-primary bg-primary text-primary-foreground' : 'border-input bg-background hover:bg-accent hover:text-accent-foreground'}`}>Aktif</button>
                <button type="button" onClick={() => setBulkStatus('inactive')} className={`flex-1 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${bulkStatus === 'inactive' ? 'border-destructive bg-destructive text-destructive-foreground' : 'border-input bg-background hover:bg-accent hover:text-accent-foreground'}`}>Nonaktif</button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkEditOpen(false)}>Batal</Button>
            <Button onClick={async () => { await bulkUpdateBSIC.mutateAsync({ ids: selectedIds, updates: { is_active: bulkStatus === 'active' } }); setBulkEditOpen(false); setRowSelection({}); }} disabled={!bulkStatus || bulkUpdateBSIC.isPending}>{bulkUpdateBSIC.isPending ? 'Menyimpan…' : 'Terapkan'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>{editTarget ? 'Ubah Kategori BSIC' : 'Tambah Kategori BSIC'}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2"><Label htmlFor="bsic-code">Kode *</Label><Input id="bsic-code" value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} placeholder="mis. B1.1" required /></div>
            <div className="space-y-2"><Label htmlFor="bsic-name">Nama *</Label><Input id="bsic-name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Nama kategori" required /></div>
            <div className="space-y-2">
              <Label htmlFor="bsic-kl">Kategori Layanan</Label>
              <select
                id="bsic-kl"
                value={form.kategori_layanan ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, kategori_layanan: e.target.value ? Number(e.target.value) : null }))}
                className="flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-1"
              >
                <option value="">— Tidak ada —</option>
                {(kategoriLayananList ?? []).map((kl) => (
                  <option key={kl.id} value={kl.id}>{kl.code} — {kl.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Kategori Fasilitas</Label>
              <div className="flex gap-2">
                {(['KESEHATAN', 'NON_KESEHATAN'] as const).map((kf) => (
                  <button key={kf} type="button"
                    onClick={() => setForm((f) => ({ ...f, kategori_fasilitas: kf }))}
                    className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                      form.kategori_fasilitas === kf
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-input bg-background hover:bg-accent hover:text-accent-foreground'
                    }`}>
                    {kf === 'KESEHATAN' ? 'Kesehatan' : 'Non Kesehatan'}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2"><Label htmlFor="bsic-desc">Deskripsi</Label><Textarea id="bsic-desc" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Deskripsi opsional" rows={3} /></div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Batal</Button>
              <Button type="submit" disabled={createBSIC.isPending || updateBSIC.isPending}>{createBSIC.isPending || updateBSIC.isPending ? 'Menyimpan...' : editTarget ? 'Simpan Perubahan' : 'Tambah Kategori'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
});

export default function ServiceCategoriesPage() {
  const bsicRef = useRef<TabActions>(null);

  return (
    <>
      <PageHeader breadcrumbs={breadcrumbs} />
      <div className="flex flex-1 flex-col gap-3">
        <div className="flex items-start justify-between gap-3 px-6 pt-6">
          <div>
            <h1 className="text-xl font-bold">Kategori BSIC</h1>
            <p className="text-sm text-muted-foreground">Kelola klasifikasi Basic Stable Inputs of Care</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-9 rounded-sm shadow-none" onClick={() => bsicRef.current?.openImport()}><Upload01Icon className="w-4 h-4 mr-2" />Impor</Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 rounded-sm shadow-none"><Download01Icon className="w-4 h-4 mr-2" />Ekspor Semua</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => bsicRef.current?.exportAll('csv')}>Ekspor sebagai CSV</DropdownMenuItem>
                <DropdownMenuItem onClick={() => bsicRef.current?.exportAll('xlsx')}>Ekspor sebagai XLSX</DropdownMenuItem>
                <DropdownMenuItem onClick={() => bsicRef.current?.exportAll('json')}>Ekspor sebagai JSON</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button size="sm" className="h-9 rounded-sm shadow-none" onClick={() => bsicRef.current?.openAdd()}><Add01Icon className="w-4 h-4 mr-2" />Tambah</Button>
          </div>
        </div>
        <Separator />
        <div className="flex flex-col gap-3 px-6 pb-6">
          <BSICTab ref={bsicRef} />
        </div>
      </div>
    </>
  );
}
