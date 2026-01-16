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
import { ColumnDef } from '@tanstack/react-table';
import { SurveyListItem } from '@/lib/types/api';
import { HugeiconsIcon } from "@hugeicons/react"
import {MoreHorizontalIcon, Tick02Icon, Cancel01Icon, ViewIcon} from "@hugeicons/core-free-icons";
import { DataTable } from '@/components/data-table';

type VerificationAction = {
  surveyId: number;
  action: 'verify' | 'reject';
  surveyName: string;
};

export default function VerificationQueuePage() {
  const router = useRouter();
  const [verificationDialog, setVerificationDialog] = useState<VerificationAction | null>(null);
  const [notes, setNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  const { data, isLoading } = useSurveys({
    verification_status: 'SUBMITTED',
    ordering: '-created_at',
    page_size: 100,
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
        header: 'Service Name',
        cell: ({ row }) => (
          <div className="max-w-xs">
            <div className="font-medium truncate">{row.getValue('service_name')}</div>
            <div className="text-xs text-muted-foreground">{row.original.city}</div>
          </div>
        ),
      },
      {
        accessorKey: 'survey_date',
        header: 'Survey Date',
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
        header: 'Patients',
        cell: ({ row }) => {
          const patients = row.getValue('total_patients_served') as number;
          return <div>{patients?.toLocaleString() || 0}</div>;
        },
      },
      {
        accessorKey: 'created_at',
        header: 'Submitted At',
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
        header: 'Assigned To',
        cell: ({ row }) => {
          const verifier = row.getValue('verifier_name');
          return verifier ? (
            <div className="text-sm">{verifier as string}</div>
          ) : (
            <Badge variant="outline">Unassigned</Badge>
          );
        },
      },
      {
        id: 'actions',
        enableHiding: false,
        cell: ({ row }) => {
          const survey = row.original;

          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <HugeiconsIcon icon={MoreHorizontalIcon} size={16} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => router.push(`/dashboard/survey/${survey.id}`)}>
                  <HugeiconsIcon icon={ViewIcon} size={16} className="mr-2" />
                  View Details
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-green-600"
                  onClick={() => handleVerificationAction(survey, 'verify')}
                >
                  <HugeiconsIcon icon={Tick02Icon} size={16} className="mr-2" />
                  Approve
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => handleVerificationAction(survey, 'reject')}
                >
                  <HugeiconsIcon icon={Cancel01Icon} size={16} className="mr-2" />
                  Reject
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    [router]
  );

  if (isLoading) {
    return (
      <div className="flex flex-col">
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <div className="flex flex-1 items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>Verification</BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Queue</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <DateTime />
        </header>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="h-16 w-16 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
            <p className="text-sm text-muted-foreground">Loading queue...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <div className="flex flex-1 items-center gap-2">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>Verification</BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Queue</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        <DateTime />
      </header>

      <div className="flex-1 p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Verification Queue</h1>
            <p className="text-muted-foreground mt-1">
              Surveys pending verification and review
            </p>
          </div>
          {data && (
            <Badge variant="outline" className="text-base px-4 py-2">
              {data.count} {data.count === 1 ? 'survey' : 'surveys'} pending
            </Badge>
          )}
        </div>

        <DataTable
          columns={columns}
          data={data?.results || []}
          searchKey="service_name"
          searchPlaceholder="Search by service name..."
          showColumnToggle={true}
          showPagination={true}
          pageSize={20}
        />
      </div>

      {/* Verification Dialog */}
      <Dialog open={!!verificationDialog} onOpenChange={() => setVerificationDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {verificationDialog?.action === 'verify' ? 'Approve Survey' : 'Reject Survey'}
            </DialogTitle>
            <DialogDescription>
              {verificationDialog?.action === 'verify'
                ? `Approve survey for ${verificationDialog?.surveyName}`
                : `Reject survey for ${verificationDialog?.surveyName}`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {verificationDialog?.action === 'reject' && (
              <div className="space-y-2">
                <label htmlFor="rejection_reason" className="text-sm font-medium">
                  Rejection Reason <span className="text-destructive">*</span>
                </label>
                <Textarea
                  id="rejection_reason"
                  placeholder="Explain why this survey is being rejected..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={3}
                />
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="notes" className="text-sm font-medium">
                Notes {verificationDialog?.action === 'verify' && '(Optional)'}
              </label>
              <Textarea
                id="notes"
                placeholder="Additional notes or comments..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setVerificationDialog(null)}>
              Cancel
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
                ? 'Processing...'
                : verificationDialog?.action === 'verify'
                ? 'Approve'
                : 'Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
