'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSurveyResponses, useVerifySurvey } from '@/hooks/use-survey-responses';
import { PageHeader } from "@/components/page-header";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { HugeiconsIcon } from "@hugeicons/react";
import { MoreHorizontalIcon, ViewIcon, Tick02Icon, Cancel01Icon, SortingZA01Icon } from "@hugeicons/core-free-icons";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import type { SurveyResponse } from '@/lib/types/survey-template';
import { Separator } from '@/components/ui/separator';

type VerificationAction = {
  surveyId: number;
  action: 'verify' | 'reject';
  surveyName: string;
};

const breadcrumbs = [
  { label: 'Dasbor', href: '/dashboard' },
  { label: 'Survei', href: '/dashboard/survey' },
  { label: 'Menunggu Verifikasi' },
];

const PAGE_SIZE = 50;

export default function PendingSurveysPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [sorting, setSorting] = useState<SortingState>([]);
  const [page, setPage] = useState(1);
  const [verificationDialog, setVerificationDialog] = useState<VerificationAction | null>(null);
  const [notes, setNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    setPage(1);
  }, [search, sorting]);

  const ordering = sorting.length > 0
    ? `${sorting[0].desc ? '-' : ''}${sorting[0].id}`
    : '-created_at';

  const { data, isLoading } = useSurveyResponses({
    search,
    verification_status: 'SUBMITTED',
    ordering,
    page,
    page_size: PAGE_SIZE,
  });

  const totalPages = data ? Math.max(1, Math.ceil(data.count / PAGE_SIZE)) : 1;

  const verifySurvey = useVerifySurvey(verificationDialog?.surveyId || 0);

  const handleVerificationAction = (survey: SurveyResponse, action: 'verify' | 'reject') => {
    setVerificationDialog({
      surveyId: survey.id!,
      action,
      surveyName: survey.service_name || 'Tidak diketahui',
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

  const columns = useMemo<ColumnDef<SurveyResponse, any>[]>(() => [
    {
      accessorKey: "id",
      header: "ID",
      cell: ({ row }) => <div className="w-12">{row.getValue("id")}</div>,
    },
    {
      accessorKey: "service_name",
      header: "Nama Layanan",
      cell: ({ row }) => {
        return <div className="font-medium max-w-xs truncate">{row.getValue("service_name")}</div>
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
        return <div>{date.toLocaleDateString('id-ID')}</div>
      },
    },
    {
      accessorKey: "surveyor_name",
      header: "Surveyor",
      cell: ({ row }) => {
        return <div className="text-sm">{row.getValue("surveyor_name")}</div>
      },
    },
    {
      accessorKey: "verifier_name",
      header: "Verifikator",
      cell: ({ row }) => {
        const verifier = row.getValue("verifier_name") as string | null;
        return verifier ? (
          <div className="text-sm">{verifier}</div>
        ) : (
          <Badge variant="outline-muted">Belum ditugaskan</Badge>
        );
      },
    },
    {
      accessorKey: "created_at",
      header: "Dikirim",
      cell: ({ row }) => {
        const date = new Date(row.getValue("created_at"));
        return <div className="text-sm text-muted-foreground">{date.toLocaleDateString('id-ID')}</div>
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const survey = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 w-8 p-0 shadow-none rounded-sm">
                <span className="sr-only">Buka menu</span>
                <HugeiconsIcon icon={MoreHorizontalIcon} size={16} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => router.push(`/dashboard/survey/${survey.id}`)}>
                <HugeiconsIcon icon={ViewIcon} size={16} />
                Lihat Detail
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-green-600"
                onClick={() => handleVerificationAction(survey, 'verify')}
              >
                <HugeiconsIcon icon={Tick02Icon} size={16} />
                Setujui
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => handleVerificationAction(survey, 'reject')}
              >
                <HugeiconsIcon icon={Cancel01Icon} size={16} />
                Tolak
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ], [router]);

  const table = useReactTable({
    data: (data?.results ?? []) as SurveyResponse[],
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualSorting: true,
    onSortingChange: setSorting,
    state: {
      sorting,
    },
  });

  if (isLoading) {
    return (
      <>
        <PageHeader breadcrumbs={breadcrumbs} />
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <div className="h-16 w-16 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
            <p className="text-sm text-muted-foreground">Memuat survei menunggu verifikasi...</p>
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
            <h1 className="text-xl font-bold">Menunggu Verifikasi</h1>
            <p className="text-sm text-muted-foreground">Survei yang menunggu verifikasi dan persetujuan</p>
          </div>
        </div>

        <Separator />

        <div className="flex flex-col gap-3 px-6 pb-6">

        <div className="flex gap-2 justify-between items-center">
          <div />
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
                <SelectItem value="service_name-asc">Layanan A-Z</SelectItem>
                <SelectItem value="service_name-desc">Layanan Z-A</SelectItem>
                <SelectItem value="created_at-desc">Terbaru</SelectItem>
                <SelectItem value="created_at-asc">Terlama</SelectItem>
                <SelectItem value="survey_date-desc">Tgl Survei Terbaru</SelectItem>
                <SelectItem value="survey_date-asc">Tgl Survei Terlama</SelectItem>
              </SelectContent>
            </Select>
            <Input
              placeholder="Cari berdasarkan nama layanan, kota..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-64 min-h-9 rounded-sm bg-white shadow-none"
              aria-label="Cari survei menunggu verifikasi"
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
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id} className="even:bg-muted">
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
                    Tidak ada survei menunggu verifikasi.
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
    </>
  );
}
