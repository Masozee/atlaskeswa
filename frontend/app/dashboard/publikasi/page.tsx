'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { PageHeader } from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table';
import { useCurrentUser } from '@/hooks/use-auth';
import { useDeletePublication, usePublications } from '@/hooks/use-publications';
import {
  formatPublicationDate,
  PUBLICATION_STATUSES,
  PUBLICATION_TYPES,
  type PublicationRecord,
} from '@/lib/publications';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  Add01Icon,
  ArrowDown01Icon,
  ArrowUp01Icon,
  Delete02Icon,
  Edit01Icon,
  LinkSquare02Icon,
  MoreHorizontalIcon,
} from '@hugeicons/core-free-icons';

const ALL = 'ALL';

export default function PublicationsAdminPage() {
  const router = useRouter();
  const { data: user } = useCurrentUser();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState(ALL);
  const [type, setType] = useState(ALL);
  const [sorting, setSorting] = useState<SortingState>([{ id: 'date', desc: true }]);
  const [toDelete, setToDelete] = useState<PublicationRecord | null>(null);

  const { data, isLoading, isError } = usePublications({
    search: search.trim() || undefined,
    status: status === ALL ? undefined : status,
    type: type === ALL ? undefined : type,
  });
  const remove = useDeletePublication();

  const columns = useMemo<ColumnDef<PublicationRecord>[]>(
    () => [
      {
        accessorKey: 'title',
        header: 'Judul',
        cell: ({ row }) => (
          <div className="max-w-[44ch]">
            <Link href={`/dashboard/publikasi/${row.original.slug}`} className="font-medium hover:underline underline-offset-4">
              {row.original.title}
            </Link>
            <p className="text-xs text-muted-foreground truncate">/{row.original.slug}</p>
          </div>
        ),
      },
      { accessorKey: 'type_label', header: 'Jenis' },
      {
        accessorKey: 'date',
        header: 'Tanggal',
        cell: ({ row }) => <span className="whitespace-nowrap">{formatPublicationDate(row.original.date)}</span>,
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-1">
            <Badge variant={row.original.status === 'PUBLISHED' ? 'default' : 'secondary'}>{row.original.status_label}</Badge>
            {row.original.external_url && <Badge variant="outline">Eksternal</Badge>}
          </div>
        ),
      },
      {
        accessorKey: 'updated_at',
        header: 'Diubah',
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            {new Date(row.original.updated_at).toLocaleDateString('id-ID')}
          </span>
        ),
      },
      {
        id: 'actions',
        header: '',
        enableSorting: false,
        cell: ({ row }) => {
          const publication = row.original;
          const publicHref = publication.external_url || `/publikasi/${publication.slug}`;
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Aksi">
                  <HugeiconsIcon icon={MoreHorizontalIcon} size={16} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => router.push(`/dashboard/publikasi/${publication.slug}`)}>
                  <HugeiconsIcon icon={Edit01Icon} size={16} /> Edit
                </DropdownMenuItem>
                {publication.status === 'PUBLISHED' && (
                  <DropdownMenuItem onClick={() => window.open(publicHref, '_blank', 'noopener')}>
                    <HugeiconsIcon icon={LinkSquare02Icon} size={16} /> Lihat halaman publik
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onClick={() => setToDelete(publication)}>
                  <HugeiconsIcon icon={Delete02Icon} size={16} /> Hapus
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    [router]
  );

  const table = useReactTable({
    data: data ?? [],
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  async function confirmDelete() {
    if (!toDelete) return;
    try {
      await remove.mutateAsync(toDelete.slug);
      toast.success('Publikasi dihapus');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal menghapus publikasi.');
    } finally {
      setToDelete(null);
    }
  }

  const isAdmin = user?.role === 'ADMIN';

  return (
    <>
      <PageHeader breadcrumbs={[{ label: 'Dasbor', href: '/dashboard' }, { label: 'Publikasi' }]} />
      <div className="flex flex-1 flex-col gap-4 p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Publikasi</h1>
            <p className="text-muted-foreground">Kelola siaran pers, laporan, dan artikel yang tampil di halaman publik /publikasi.</p>
          </div>
          {isAdmin && (
            <Button asChild className="gap-2 shrink-0">
              <Link href="/dashboard/publikasi/new">
                <HugeiconsIcon icon={Add01Icon} size={16} />
                Publikasi baru
              </Link>
            </Button>
          )}
        </div>

        <div className="flex gap-2 justify-between items-center">
          <Input placeholder="Cari judul atau ringkasan…" value={search} onChange={(e) => setSearch(e.target.value)} className="w-64" />
          <div className="flex gap-2">
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="w-40 !h-9">
                <SelectValue placeholder="Jenis" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Semua jenis</SelectItem>
                {PUBLICATION_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-40 !h-9">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Semua status</SelectItem>
                {PUBLICATION_STATUSES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((group) => (
                <TableRow key={group.id}>
                  {group.headers.map((header) => {
                    const sorted = header.column.getIsSorted();
                    return (
                      <TableHead key={header.id}>
                        {header.column.getCanSort() ? (
                          <button
                            type="button"
                            className="inline-flex items-center gap-1"
                            onClick={header.column.getToggleSortingHandler()}
                          >
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            {sorted === 'asc' && <HugeiconsIcon icon={ArrowUp01Icon} size={14} />}
                            {sorted === 'desc' && <HugeiconsIcon icon={ArrowDown01Icon} size={14} />}
                          </button>
                        ) : (
                          flexRender(header.column.columnDef.header, header.getContext())
                        )}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                    Memuat…
                  </TableCell>
                </TableRow>
              ) : isError ? (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center text-destructive">
                    Gagal memuat publikasi.
                  </TableCell>
                </TableRow>
              ) : table.getRowModel().rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                    Tidak ada publikasi.
                  </TableCell>
                </TableRow>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Menampilkan {data?.length ?? 0} publikasi</p>
        </div>
      </div>

      <AlertDialog open={!!toDelete} onOpenChange={(open) => !open && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus publikasi?</AlertDialogTitle>
            <AlertDialogDescription>
              “{toDelete?.title}” akan dihapus permanen dan hilang dari halaman publik. Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-white hover:bg-destructive/90">
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
