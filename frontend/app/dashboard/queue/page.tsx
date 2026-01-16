'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useSurveys, useVerifySurvey } from '@/hooks/use-surveys';
import { DateTime } from '@/components/date-time';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  ColumnDef,
  SortingState,
} from '@tanstack/react-table';
import { SurveyListItem } from '@/lib/types/api';
import { HugeiconsIcon } from "@hugeicons/react"
import {Search01Icon,
  MoreHorizontalIcon,
  Tick02Icon,
  Cancel01Icon,
  ViewIcon,
  ArrowUp01Icon,
  ArrowDown01Icon} from "@hugeicons/core-free-icons";

type VerificationAction = {
  surveyId: number;
  action: 'verify' | 'reject';
  surveyName: string;
};

export default function VerificationQueuePage() {
  const router = useRouter();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [search, setSearch] = useState('');
  const [verificationDialog, setVerificationDialog] = useState<VerificationAction | null>(null);
  const [notes, setNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  const { data, isLoading } = useSurveys({
    search,
    verification_status: 'SUBMITTED',
    ordering: '-created_at',
    page_size: 50,
  });

  const verifySurvey = useVerifySurvey(verificationDialog?.surveyId || 0);

  const handleVerificationAction = (survey: SurveyListItem, action: 'verify' | 'reject') => {
    setVerificationDialog({
      surveyId: survey.id,
      action,
      surveyName: survey.service_name,
    });
    setNotes('');
    setRejectionReason('');
  };

  const handleSubmitVerification = async () => {
    if (!verificationDialog) return;

    try {
      await verifySurvey.mutateAsync({
        action: verificationDialog.action,
        notes,
        rejection_reason: verificationDialog.action === 'reject' ? rejectionReason : undefined,
      });

      setVerificationDialog(null);
      setNotes('');
      setRejectionReason('');
    } catch (error) {
      console.error('Verification failed:', error);
    }
  };

  const columns = useMemo<ColumnDef<SurveyListItem, any>[]>(
    () => [
      {
        accessorKey: 'id',
        header: 'ID',
        cell: ({ row }) => <div className="w-16 font-medium">#{row.getValue('id')}</div>,
      },
      {
        accessorKey: 'service_name',
        header: 'Nama Layanan',
        cell: ({ row }) => (
          <div className="max-w-xs">
            <div className="font-medium truncate">{row.getValue('service_name')}</div>
            <div className="text-xs text-muted-foreground">{row.original.city}</div>
          </div>
        ),
      },
      {
        accessorKey: 'survey_date',
        header: ({ column }) => (
          <button
            className="flex items-center gap-1 hover:text-foreground"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Tanggal Survei
            {column.getIsSorted() === 'asc' ? (
              <HugeiconsIcon icon={ArrowUp01Icon} size={12} />
            ) : column.getIsSorted() === 'desc' ? (
              <HugeiconsIcon icon={ArrowDown01Icon} size={12} />
            ) : null}
          </button>
        ),
        cell: ({ row }) => {
          const date = new Date(row.getValue('survey_date'));
          return (
            <div>
              {date.toLocaleDateString('id-ID', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              })}
            </div>
          );
        },
      },
      {
        accessorKey: 'surveyor_name',
        header: 'Surveyor',
        cell: ({ row }) => (
          <div className="text-sm">{row.getValue('surveyor_name') || 'N/A'}</div>
        ),
      },
      {
        accessorKey: 'total_patients_served',
        header: ({ column }) => (
          <button
            className="flex items-center gap-1 hover:text-foreground"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Pasien
            {column.getIsSorted() === 'asc' ? (
              <HugeiconsIcon icon={ArrowUp01Icon} size={12} />
            ) : column.getIsSorted() === 'desc' ? (
              <HugeiconsIcon icon={ArrowDown01Icon} size={12} />
            ) : null}
          </button>
        ),
        cell: ({ row }) => {
          const patients = row.getValue('total_patients_served') as number;
          return <div>{patients?.toLocaleString() || 0}</div>;
        },
      },
      {
        accessorKey: 'created_at',
        header: ({ column }) => (
          <button
            className="flex items-center gap-1 hover:text-foreground"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Diajukan Pada
            {column.getIsSorted() === 'asc' ? (
              <HugeiconsIcon icon={ArrowUp01Icon} size={12} />
            ) : column.getIsSorted() === 'desc' ? (
              <HugeiconsIcon icon={ArrowDown01Icon} size={12} />
            ) : null}
          </button>
        ),
        cell: ({ row }) => {
          const date = new Date(row.getValue('created_at'));
          return (
            <div>
              <div className="font-medium">
                {date.toLocaleDateString('id-ID', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })}
              </div>
              <div className="text-xs text-muted-foreground">
                {date.toLocaleTimeString('id-ID', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: 'verifier_name',
        header: 'Ditugaskan Ke',
        cell: ({ row }) => {
          const verifier = row.getValue('verifier_name');
          return verifier ? (
            <div className="text-sm">{verifier as string}</div>
          ) : (
            <Badge variant="outline">Belum Ditugaskan</Badge>
          );
        },
      },
      {
        id: 'actions',
        cell: ({ row }) => {
          const survey = row.original;

          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Buka menu</span>
                  <HugeiconsIcon icon={MoreHorizontalIcon} size={16} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => router.push(`/dashboard/survey/${survey.id}`)}>
                  <HugeiconsIcon icon={ViewIcon} size={16} className="mr-2" />
                  Lihat Detail
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-green-600"
                  onClick={() => handleVerificationAction(survey, 'verify')}
                >
                  <HugeiconsIcon icon={Tick02Icon} size={16} className="mr-2" />
                  Setujui
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => handleVerificationAction(survey, 'reject')}
                >
                  <HugeiconsIcon icon={Cancel01Icon} size={16} className="mr-2" />
                  Tolak
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
    data: data?.results || [],
    columns,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting,
    },
  });

  return (
    <div className="flex flex-col">
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <div className="flex flex-1 items-center gap-2">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>Verifikasi</BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Antrian</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        <DateTime />
      </header>

      <div className="flex-1 p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Antrian Verifikasi</h1>
          <p className="text-muted-foreground mt-1">
            Survei yang menunggu verifikasi dan peninjauan
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <HugeiconsIcon icon={Search01Icon} size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Cari nama layanan..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {data && (
            <Badge variant="outline" className="ml-auto">
              {data.count} survei tertunda
            </Badge>
          )}
        </div>

        <div className="rounded-md border">
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
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">
                    Memuat...
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
                    Tidak ada survei yang menunggu verifikasi.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Verification Dialog */}
      <Dialog open={!!verificationDialog} onOpenChange={() => setVerificationDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {verificationDialog?.action === 'verify' ? 'Setujui Survei' : 'Tolak Survei'}
            </DialogTitle>
            <DialogDescription>
              {verificationDialog?.action === 'verify'
                ? `Setujui survei untuk ${verificationDialog?.surveyName}`
                : `Tolak survei untuk ${verificationDialog?.surveyName}`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {verificationDialog?.action === 'reject' && (
              <div className="space-y-2">
                <label htmlFor="rejection_reason" className="text-sm font-medium">
                  Alasan Penolakan <span className="text-destructive">*</span>
                </label>
                <Textarea
                  id="rejection_reason"
                  placeholder="Jelaskan mengapa survei ini ditolak..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={3}
                />
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="notes" className="text-sm font-medium">
                Catatan {verificationDialog?.action === 'verify' && '(Opsional)'}
              </label>
              <Textarea
                id="notes"
                placeholder="Catatan atau komentar tambahan..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setVerificationDialog(null)}>
              Batal
            </Button>
            <Button
              variant={verificationDialog?.action === 'verify' ? 'default' : 'destructive'}
              onClick={handleSubmitVerification}
              disabled={
                verifySurvey.isPending ||
                (verificationDialog?.action === 'reject' && !rejectionReason.trim())
              }
            >
              {verifySurvey.isPending
                ? 'Memproses...'
                : verificationDialog?.action === 'verify'
                ? 'Setujui'
                : 'Tolak'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
