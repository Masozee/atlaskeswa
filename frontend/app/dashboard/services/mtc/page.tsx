"use client";

import { useMemo, useState, forwardRef, useImperativeHandle, useRef } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  SortingState,
  PaginationState,
  RowSelectionState,
  useReactTable,
} from "@tanstack/react-table";
import {
  useKategoriLayanan,
  useCreateKategoriLayanan, useUpdateKategoriLayanan, useDeleteKategoriLayanan,
  useBulkDeleteKategoriLayanan, useBulkUpdateKategoriLayanan, exportKategoriLayanan, useImportKategoriLayanan,
} from "@/hooks/use-services";
import { KategoriLayanan } from "@/lib/types/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { PageHeader } from "@/components/page-header";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Add01Icon, Upload01Icon, MoreHorizontalIcon, Edit04Icon, Delete01Icon, EyeIcon, Download01Icon, ArrangeByLettersAZIcon, ArrowLeft01Icon, ArrowRight01Icon } from "hugeicons-react";

const breadcrumbs = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Layanan', href: '/dashboard/services' },
  { label: 'Jenis Layanan' },
];

type ImportResult = { created: number; updated: number; errors: { row: number; error: string }[] };

function ImportDialog({
  open, onOpenChange, onImport, isPending, result,
}: {
  open: boolean; onOpenChange: (open: boolean) => void;
  onImport: (file: File, updateExisting: boolean) => void;
  isPending: boolean; result: ImportResult | null;
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
        <DialogHeader><DialogTitle>Import from CSV</DialogTitle></DialogHeader>
        <div className="space-y-4 py-2">
          <p className="text-sm text-muted-foreground">
            Upload a CSV file with columns: <span className="font-mono text-xs bg-muted px-1 rounded">code</span>, <span className="font-mono text-xs bg-muted px-1 rounded">name</span>, <span className="font-mono text-xs bg-muted px-1 rounded">description</span>
          </p>
          <div className="space-y-2">
            <Label>File * <span className="text-muted-foreground font-normal">(CSV, XLSX, JSON)</span></Label>
            <div className="flex rounded-md border overflow-hidden">
              <label htmlFor="kl-csv-file" className="flex items-center justify-center px-4 py-1.5 text-sm font-medium hover:bg-accent transition-colors cursor-pointer whitespace-nowrap">Choose File</label>
              <div className="w-px bg-border" />
              <span className="flex items-center px-3 py-1.5 text-sm text-muted-foreground truncate flex-1">{file ? file.name : 'No file chosen'}</span>
              <input id="kl-csv-file" type="file" accept=".csv,.xlsx,.json" className="sr-only" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="kl-update-existing" checked={updateExisting} onCheckedChange={(v) => setUpdateExisting(!!v)} />
            <Label htmlFor="kl-update-existing" className="text-sm font-normal cursor-pointer">Update existing records (match by code)</Label>
          </div>
          {result && (
            <div className="rounded-lg border p-3 space-y-2">
              {result.created > 0 && <p className="text-sm font-medium text-green-600">{result.created} record(s) created.</p>}
              {result.updated > 0 && <p className="text-sm font-medium text-blue-600">{result.updated} record(s) updated.</p>}
              {result.created === 0 && result.updated === 0 && <p className="text-sm font-medium text-muted-foreground">No records imported.</p>}
              {result.errors.length > 0 && (
                <div className="space-y-1">
                  <p className="text-sm font-medium text-destructive">{result.errors.length} row(s) skipped:</p>
                  <ul className="text-xs text-muted-foreground space-y-0.5 max-h-32 overflow-y-auto">
                    {result.errors.map((e, i) => <li key={i}>Row {e.row}: {e.error}</li>)}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{result ? 'Close' : 'Cancel'}</Button>
          {!result && <Button onClick={() => file && onImport(file, updateExisting)} disabled={!file || isPending}>{isPending ? 'Importing...' : 'Import'}</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface PageActions {
  openAdd: () => void;
  openImport: () => void;
  exportAll: (format?: 'csv' | 'xlsx' | 'json') => void;
}

const KategoriLayananContent = forwardRef<PageActions>(function KategoriLayananContent(_, ref) {
  const [search, setSearch] = useState('');
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<KategoriLayanan | null>(null);
  const [form, setForm] = useState({ code: '', name: '', description: '' });
  const [bulkEditOpen, setBulkEditOpen] = useState(false);
  const [bulkStatus, setBulkStatus] = useState('');
  const [importOpen, setImportOpen] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [filterStatus, setFilterStatus] = useState('');

  const { data, isLoading } = useKategoriLayanan();
  const filteredData = useMemo(() => {
    let result = data ?? [];
    if (filterStatus) result = result.filter(r => filterStatus === 'active' ? r.is_active : !r.is_active);
    return result;
  }, [data, filterStatus]);

  const createKL = useCreateKategoriLayanan();
  const updateKL = useUpdateKategoriLayanan();
  const deleteKL = useDeleteKategoriLayanan();
  const bulkDeleteKL = useBulkDeleteKategoriLayanan();
  const bulkUpdateKL = useBulkUpdateKategoriLayanan();
  const importKL = useImportKategoriLayanan();

  function openAdd() { setEditTarget(null); setForm({ code: '', name: '', description: '' }); setDialogOpen(true); }
  function openEdit(row: KategoriLayanan) { setEditTarget(row); setForm({ code: row.code, name: row.name, description: row.description ?? '' }); setDialogOpen(true); }

  useImperativeHandle(ref, () => ({
    openAdd,
    openImport: () => { setImportResult(null); setImportOpen(true); },
    exportAll: (format = 'csv') => exportKategoriLayanan(undefined, format),
  }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editTarget) await updateKL.mutateAsync({ id: editTarget.id, ...form });
    else await createKL.mutateAsync(form);
    setDialogOpen(false);
  }

  const columns = useMemo<ColumnDef<KategoriLayanan, any>[]>(() => [
    {
      id: 'select',
      header: ({ table }) => <Checkbox checked={table.getIsAllPageRowsSelected()} onCheckedChange={(v) => table.toggleAllPageRowsSelected(!!v)} aria-label="Select all" />,
      cell: ({ row }) => <Checkbox checked={row.getIsSelected()} onCheckedChange={(v) => row.toggleSelected(!!v)} aria-label="Select row" />,
      enableSorting: false, enableGlobalFilter: false,
    },
    { accessorKey: 'code', header: 'Code', cell: ({ row }) => <div className="font-mono font-medium">{row.getValue('code')}</div> },
    { accessorKey: 'name', header: 'Name', cell: ({ row }) => <div className="font-medium max-w-xs whitespace-normal break-words">{row.getValue('name')}</div> },
    { accessorKey: 'description', header: 'Description', cell: ({ row }) => <div className="max-w-xs text-sm text-muted-foreground whitespace-normal break-words">{(row.getValue('description') as string) || '-'}</div> },
    {
      accessorKey: 'is_active', header: 'Status',
      cell: ({ row }) => row.getValue('is_active')
        ? <Badge variant="outline" className="text-green-600 border-green-600">Active</Badge>
        : <Badge variant="outline" className="text-red-600 border-red-600">Inactive</Badge>,
    },
    {
      id: 'actions', header: '',
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 w-8 p-0"><MoreHorizontalIcon className="h-4 w-4" /></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => openEdit(row.original)}><Edit04Icon className="mr-2 h-4 w-4" />Edit</DropdownMenuItem>
            <DropdownMenuItem onClick={() => updateKL.mutateAsync({ id: row.original.id, is_active: !row.original.is_active })}><EyeIcon className="mr-2 h-4 w-4" />{row.original.is_active ? 'Set Inactive' : 'Set Active'}</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => deleteKL.mutateAsync(row.original.id)}><Delete01Icon className="mr-2 h-4 w-4" />Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ], []);

  const table = useReactTable({ data: filteredData, columns, getCoreRowModel: getCoreRowModel(), getSortedRowModel: getSortedRowModel(), getFilteredRowModel: getFilteredRowModel(), getPaginationRowModel: getPaginationRowModel(), onSortingChange: setSorting, onRowSelectionChange: setRowSelection, onPaginationChange: setPagination, state: { sorting, globalFilter: search, rowSelection, pagination }, onGlobalFilterChange: (v) => { setSearch(v); setPagination(p => ({ ...p, pageIndex: 0 })); }, enableRowSelection: true });
  const selectedCount = table.getSelectedRowModel().rows.length;
  const selectedIds = table.getSelectedRowModel().rows.map((r) => r.original.id);

  if (isLoading) return <div className="flex items-center justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Input placeholder="Search by code, name or description..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-64" />
          <Button variant="outline" size="sm" onClick={() => setSorting((s) => s.length && s[0].id === 'name' && !s[0].desc ? [{ id: 'name', desc: true }] : [{ id: 'name', desc: false }])}><ArrangeByLettersAZIcon className="w-4 h-4" /></Button>
        </div>
        <div className="flex rounded-md border overflow-hidden">
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="w-36 px-3 py-1.5 text-sm font-medium bg-transparent outline-none hover:bg-accent transition-colors cursor-pointer">
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {selectedCount > 0 && (
        <div className="flex items-center gap-3 rounded-lg border bg-muted/50 px-4 py-2">
          <span className="text-sm font-medium">{selectedCount} selected</span>
          <Separator orientation="vertical" className="h-4" />
          <Button variant="outline" size="sm" className="w-40 justify-center" onClick={() => { setBulkStatus(''); setBulkEditOpen(true); }}><Edit04Icon className="w-4 h-4 mr-2" />Bulk Edit</Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="w-40 justify-center"><Download01Icon className="w-4 h-4 mr-2" />Export Selected</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => exportKategoriLayanan(selectedIds, 'csv')}>Export as CSV</DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportKategoriLayanan(selectedIds, 'xlsx')}>Export as XLSX</DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportKategoriLayanan(selectedIds, 'json')}>Export as JSON</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="destructive" size="sm" className="w-40 justify-center" onClick={async () => { await bulkDeleteKL.mutateAsync(selectedIds); setRowSelection({}); }} disabled={bulkDeleteKL.isPending}><Delete01Icon className="w-4 h-4 mr-2" />{bulkDeleteKL.isPending ? 'Deleting...' : 'Delete Selected'}</Button>
          <Button variant="ghost" size="sm" onClick={() => setRowSelection({})}>Clear</Button>
        </div>
      )}

      <div className="rounded-lg border">
        <Table>
          <TableHeader>{table.getHeaderGroups().map((hg) => (<TableRow key={hg.id}>{hg.headers.map((h) => <TableHead key={h.id}>{h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}</TableHead>)}</TableRow>))}</TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>{row.getVisibleCells().map((cell) => <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>)}</TableRow>
            )) : <TableRow><TableCell colSpan={columns.length} className="h-24 text-center">No Jenis Layanan found.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {filteredData.length > 0 ? `Showing ${pagination.pageIndex * pagination.pageSize + 1}–${Math.min((pagination.pageIndex + 1) * pagination.pageSize, table.getFilteredRowModel().rows.length)} of ${table.getFilteredRowModel().rows.length}` : 'No results'}
        </p>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}><ArrowLeft01Icon className="h-4 w-4" /></Button>
          <span className="text-sm px-2">Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}</span>
          <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}><ArrowRight01Icon className="h-4 w-4" /></Button>
        </div>
      </div>

      <ImportDialog open={importOpen} onOpenChange={setImportOpen} result={importResult} isPending={importKL.isPending}
        onImport={async (file, updateExisting) => { const r = await importKL.mutateAsync({ file, updateExisting }); setImportResult(r); }} />

      <Dialog open={bulkEditOpen} onOpenChange={setBulkEditOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Bulk Edit — {selectedCount} categories</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Set Status</Label>
              <div className="flex gap-2">
                <button type="button" onClick={() => setBulkStatus('active')} className={`flex-1 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${bulkStatus === 'active' ? 'border-primary bg-primary text-primary-foreground' : 'border-input bg-background hover:bg-accent hover:text-accent-foreground'}`}>Active</button>
                <button type="button" onClick={() => setBulkStatus('inactive')} className={`flex-1 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${bulkStatus === 'inactive' ? 'border-destructive bg-destructive text-destructive-foreground' : 'border-input bg-background hover:bg-accent hover:text-accent-foreground'}`}>Inactive</button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkEditOpen(false)}>Cancel</Button>
            <Button onClick={async () => { await bulkUpdateKL.mutateAsync({ ids: selectedIds, updates: { is_active: bulkStatus === 'active' } }); setBulkEditOpen(false); setRowSelection({}); }} disabled={!bulkStatus || bulkUpdateKL.isPending}>{bulkUpdateKL.isPending ? 'Saving…' : 'Apply'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>{editTarget ? 'Edit Jenis Layanan' : 'Add New Jenis Layanan'}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2"><Label htmlFor="kl-code">Code *</Label><Input id="kl-code" value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} placeholder="e.g. KL-01" required /></div>
            <div className="space-y-2"><Label htmlFor="kl-name">Name *</Label><Input id="kl-name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Category name" required /></div>
            <div className="space-y-2"><Label htmlFor="kl-desc">Description</Label><Textarea id="kl-desc" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Optional description" rows={3} /></div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createKL.isPending || updateKL.isPending}>{createKL.isPending || updateKL.isPending ? 'Saving...' : editTarget ? 'Save Changes' : 'Add Category'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
});

export default function KategoriLayananPage() {
  const contentRef = useRef<PageActions>(null);

  return (
    <>
      <PageHeader breadcrumbs={breadcrumbs} />
      <div className="flex flex-1 flex-col gap-4 p-4">
        <div className="border-b pb-4 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold">Jenis Layanan</h1>
            <p className="text-muted-foreground">Manage service types</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex rounded-md border overflow-hidden">
              <button onClick={() => contentRef.current?.openImport()} className="flex items-center justify-center gap-2 w-28 py-1.5 text-sm font-medium hover:bg-accent transition-colors"><Upload01Icon className="w-4 h-4" />Import</button>
              <div className="w-px bg-border" />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center justify-center gap-2 w-28 py-1.5 text-sm font-medium hover:bg-accent transition-colors"><Download01Icon className="w-4 h-4" />Export All</button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => contentRef.current?.exportAll('csv')}>Export as CSV</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => contentRef.current?.exportAll('xlsx')}>Export as XLSX</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => contentRef.current?.exportAll('json')}>Export as JSON</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <Button size="sm" onClick={() => contentRef.current?.openAdd()}><Add01Icon className="w-4 h-4 mr-2" />Add New</Button>
          </div>
        </div>
        <KategoriLayananContent ref={contentRef} />
      </div>
    </>
  );
}
