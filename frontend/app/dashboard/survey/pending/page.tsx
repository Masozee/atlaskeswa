'use client';

import { useState, useMemo } from 'react';
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
  getSortedRowModel,
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
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Surveys', href: '/dashboard/survey' },
  { label: 'Pending Submissions' },
];

export default function PendingSurveysPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [sorting, setSorting] = useState<SortingState>([]);
  const [verificationDialog, setVerificationDialog] = useState<VerificationAction | null>(null);
  const [notes, setNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  const { data, isLoading } = useSurveyResponses({
    search,
    verification_status: 'SUBMITTED',
    ordering: '-created_at',
    page_size: 50,
  });

  const verifySurvey = useVerifySurvey(verificationDialog?.surveyId || 0);

  const handleVerificationAction = (survey: SurveyResponse, action: 'verify' | 'reject') => {
    setVerificationDialog({
      surveyId: survey.id!,
      action,
      surveyName: survey.service_name || 'Unknown',
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
      header: "Service Name",
      cell: ({ row }) => {
        return <div className="font-medium max-w-xs truncate">{row.getValue("service_name")}</div>
      },
    },
    {
      accessorKey: "service_city",
      header: "City",
    },
    {
      accessorKey: "survey_date",
      header: "Survey Date",
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
      header: "Assigned Verifier",
      cell: ({ row }) => {
        const verifier = row.getValue("verifier_name") as string | null;
        return verifier ? (
          <div className="text-sm">{verifier}</div>
        ) : (
          <Badge variant="outline-muted">Unassigned</Badge>
        );
      },
    },
    {
      accessorKey: "created_at",
      header: "Submitted",
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
              <Button variant="outline" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <HugeiconsIcon icon={MoreHorizontalIcon} size={16} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => router.push(`/dashboard/survey/${survey.id}`)}>
                <HugeiconsIcon icon={ViewIcon} size={16} />
                View details
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-green-600"
                onClick={() => handleVerificationAction(survey, 'verify')}
              >
                <HugeiconsIcon icon={Tick02Icon} size={16} />
                Approve
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => handleVerificationAction(survey, 'reject')}
              >
                <HugeiconsIcon icon={Cancel01Icon} size={16} />
                Reject
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
    getSortedRowModel: getSortedRowModel(),
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
            <p className="text-sm text-muted-foreground">Loading pending surveys...</p>
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
          <h1 className="text-xl font-bold">Pending Submissions</h1>
          <p className="text-sm text-muted-foreground">Surveys waiting for verification and approval</p>
        </div>

        <Separator />

        <div className="flex flex-col gap-3 px-6 pb-6">

        <div className="flex gap-2 justify-between items-center">
          <div className="flex gap-2 items-center">
            <Select value={sorting.length > 0 ? `${sorting[0].id}-${sorting[0].desc ? 'desc' : 'asc'}` : 'default'} onValueChange={(value) => {
              if (value === 'default') {
                setSorting([]);
              } else {
                const [id, dir] = value.split('-');
                setSorting([{ id, desc: dir === 'desc' }]);
              }
            }}>
              <SelectTrigger className="w-44" aria-label="Sort">
                <HugeiconsIcon icon={SortingZA01Icon} size={16} />
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Sort</SelectItem>
                <SelectItem value="service_name-asc">Service A-Z</SelectItem>
                <SelectItem value="service_name-desc">Service Z-A</SelectItem>
                <SelectItem value="created_at-desc">Newest First</SelectItem>
                <SelectItem value="created_at-asc">Oldest First</SelectItem>
                <SelectItem value="survey_date-desc">Survey Date New</SelectItem>
                <SelectItem value="survey_date-asc">Survey Date Old</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Input
            placeholder="Search by service name, city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64"
            aria-label="Search pending surveys"
          />
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
                    No pending surveys found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {data && data.count > 0 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {data.results.length} of {data.count} pending surveys
            </p>
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
