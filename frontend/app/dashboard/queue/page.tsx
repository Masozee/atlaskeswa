'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useSurveyResponses, useVerifySurvey, useApproveDeletion } from '@/hooks/use-survey-responses';
import { PageHeader } from '@/components/page-header';
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
import { Separator } from '@/components/ui/separator';
import { HugeiconsIcon } from "@hugeicons/react"
import {Search01Icon,
  MoreHorizontalIcon,
  Tick02Icon,
  Cancel01Icon,
  ViewIcon,
  ArrowUp01Icon,
  ArrowDown01Icon} from "@hugeicons/core-free-icons";

interface QueueItem {
  id: number;
  service_name: string;
  service_city: string;
  survey_date: string;
  surveyor_name: string;
  verification_status: string;
  status_display: string;
  verifier_name: string | null;
  created_at: string;
  submitted_at: string | null;
  deletion_requested?: boolean;
}

type VerificationAction = {
  surveyId: number;
  action: 'verify' | 'reject';
  surveyName: string;
};

type DeletionAction = {
  surveyId: number;
  action: 'approve' | 'reject';
  surveyName: string;
};

const breadcrumbs = [
  { label: 'Verifikasi' },
  { label: 'Antrian' },
];

export default function VerificationQueuePage() {
  const router = useRouter();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [search, setSearch] = useState('');
  const [verificationDialog, setVerificationDialog] = useState<VerificationAction | null>(null);
  const [deletionDialog, setDeletionDialog] = useState<DeletionAction | null>(null);
  const [notes, setNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  const { data, isLoading } = useSurveyResponses({
    search,
    verification_status: 'SUBMITTED',
    ordering: '-created_at',
    page_size: 50,
  });

  const { data: deletionData, isLoading: deletionLoading } = useSurveyResponses({
    deletion_requested: true,
    ordering: '-created_at',
    page_size: 50,
  });

  const verifySurvey = useVerifySurvey(verificationDialog?.surveyId || 0);
  const approveDeletion = useApproveDeletion();

  const handleVerificationAction = (survey: QueueItem, action: 'verify' | 'reject') => {
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

  const handleDeletionAction = (survey: QueueItem, action: 'approve' | 'reject') => {
    setDeletionDialog({
      surveyId: survey.id,
      action,
      surveyName: survey.service_name,
    });
  };

  const handleSubmitDeletion = async () => {
    if (!deletionDialog) return;
    try {
      await approveDeletion.mutateAsync({
        id: deletionDialog.surveyId,
        action: deletionDialog.action,
      });
      setDeletionDialog(null);
    } catch (error) {
      console.error('Deletion action failed:', error);
    }
  };

  const columns = useMemo<ColumnDef<QueueItem, any>[]>(
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
            <div className="text-xs text-muted-foreground">{row.original.service_city}</div>
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
            <Badge variant="outline-muted">Belum Ditugaskan</Badge>
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
                <Button variant="outline" className="h-8 w-8 p-0">
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
    data: (data?.results || []) as QueueItem[],
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
      <PageHeader breadcrumbs={breadcrumbs} />

      <div className="flex flex-1 flex-col gap-3">

        <div className="px-6 pt-6">
          <h1 className="text-xl font-bold">Antrian Verifikasi</h1>
          <p className="text-sm text-muted-foreground">
            Survei yang menunggu verifikasi dan peninjauan
          </p>
        </div>

        <Separator />

        <div className="flex flex-col gap-3 px-6 pb-6">

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
      </div>

      {/* Deletion Requests Section */}
      {deletionData && deletionData.count > 0 && (
        <>
          <Separator />
          <div className="flex flex-1 flex-col gap-3">
            <div className="px-6 pt-4">
              <h2 className="text-xl font-bold">Permintaan Penghapusan</h2>
              <p className="text-sm text-muted-foreground">
                Survei yang diminta untuk dihapus oleh surveyor
              </p>
            </div>

            <div className="flex flex-col gap-3 px-6 pb-6">
              <div className="flex items-center">
                <Badge variant="outline-danger" className="ml-auto">
                  {deletionData.count} permintaan hapus
                </Badge>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Nama Layanan</TableHead>
                      <TableHead>Tanggal Survei</TableHead>
                      <TableHead>Surveyor</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {deletionLoading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center">
                          Memuat...
                        </TableCell>
                      </TableRow>
                    ) : (
                      (deletionData.results as QueueItem[]).map((survey) => (
                        <TableRow key={survey.id}>
                          <TableCell className="w-16 font-medium">#{survey.id}</TableCell>
                          <TableCell>
                            <div className="max-w-xs">
                              <div className="font-medium truncate">{survey.service_name}</div>
                              <div className="text-xs text-muted-foreground">{survey.service_city}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {new Date(survey.survey_date).toLocaleDateString('id-ID', {
                              day: '2-digit', month: 'short', year: 'numeric',
                            })}
                          </TableCell>
                          <TableCell className="text-sm">{survey.surveyor_name || 'N/A'}</TableCell>
                          <TableCell>
                            <Badge variant={
                              survey.verification_status === 'VERIFIED' ? 'outline-success' :
                              survey.verification_status === 'SUBMITTED' ? 'outline-info' :
                              survey.verification_status === 'REJECTED' ? 'outline-danger' :
                              'outline-muted'
                            }>
                              {survey.status_display || survey.verification_status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2 justify-end">
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDeletionAction(survey, 'approve')}
                              >
                                <HugeiconsIcon icon={Tick02Icon} size={14} className="mr-1" />
                                Setujui Hapus
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeletionAction(survey, 'reject')}
                              >
                                <HugeiconsIcon icon={Cancel01Icon} size={14} className="mr-1" />
                                Tolak
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Deletion Confirmation Dialog */}
      <Dialog open={!!deletionDialog} onOpenChange={() => setDeletionDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {deletionDialog?.action === 'approve' ? 'Setujui Penghapusan' : 'Tolak Permintaan Hapus'}
            </DialogTitle>
            <DialogDescription>
              {deletionDialog?.action === 'approve'
                ? `Survei "${deletionDialog?.surveyName}" akan dipindahkan ke Keranjang Sampah dan dapat dipulihkan oleh admin kapan saja.`
                : `Tolak permintaan penghapusan untuk "${deletionDialog?.surveyName}".`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletionDialog(null)}>
              Batal
            </Button>
            <Button
              variant={deletionDialog?.action === 'approve' ? 'destructive' : 'default'}
              onClick={handleSubmitDeletion}
              disabled={approveDeletion.isPending}
            >
              {approveDeletion.isPending
                ? 'Memproses...'
                : deletionDialog?.action === 'approve'
                ? 'Pindahkan ke Sampah'
                : 'Tolak Permintaan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
