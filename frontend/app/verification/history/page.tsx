'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { PageHeader, BreadcrumbItemType } from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ColumnDef } from '@tanstack/react-table';
import { HugeiconsIcon } from "@hugeicons/react"
import {MoreHorizontalIcon,
  ViewIcon,
  Tick02Icon,
  CancelCircleIcon,
  FileEditIcon,
  SentIcon,} from "@hugeicons/core-free-icons";
import { DataTable } from '@/components/data-table';

interface AuditLog {
  id: number;
  survey: number;
  service_name: string;
  action: 'CREATE' | 'UPDATE' | 'SUBMIT' | 'VERIFY' | 'REJECT';
  user: number;
  user_email: string;
  user_name: string;
  previous_status: string;
  new_status: string;
  notes: string;
  timestamp: string;
}

const breadcrumbs: BreadcrumbItemType[] = [
  { label: 'Verification & QC', href: '/verification' },
  { label: 'Verification History' },
];

export default function VerificationHistoryPage() {
  const router = useRouter();

  const { data: auditLogsData, isLoading } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: () =>
      apiClient.get<{ count: number; results: AuditLog[] }>(
        '/surveys/audit-logs/',
        {
          page_size: 100,
          ordering: '-timestamp',
        }
      ),
  });

  const columns = useMemo<ColumnDef<AuditLog, any>[]>(
    () => [
      {
        accessorKey: 'action',
        header: 'Action',
        cell: ({ row }) => {
          const action = row.getValue('action') as string;
          const variant =
            action === 'VERIFY' ? 'default' :
            action === 'REJECT' ? 'destructive' :
            action === 'SUBMIT' ? 'secondary' :
            'outline';

          const icon =
            action === 'VERIFY' ? <HugeiconsIcon icon={Tick02Icon} size={12} className="mr-1" /> :
            action === 'REJECT' ? <HugeiconsIcon icon={CancelCircleIcon} size={12} className="mr-1" /> :
            action === 'SUBMIT' ? <HugeiconsIcon icon={SentIcon} size={12} className="mr-1" /> :
            action === 'UPDATE' ? <HugeiconsIcon icon={FileEditIcon} size={12} className="mr-1" /> :
            null;

          return (
            <Badge variant={variant} className="flex items-center w-fit">
              {icon}
              {action}
            </Badge>
          );
        },
      },
      {
        accessorKey: 'service_name',
        header: 'Service',
        cell: ({ row }) => (
          <div className="max-w-xs">
            <div className="font-medium truncate">{row.getValue('service_name')}</div>
            <div className="text-xs text-muted-foreground">Survey #{row.original.survey}</div>
          </div>
        ),
      },
      {
        accessorKey: 'user_name',
        header: 'Performed By',
        cell: ({ row }) => (
          <div>
            <div className="font-medium">{row.getValue('user_name')}</div>
            <div className="text-xs text-muted-foreground">{row.original.user_email}</div>
          </div>
        ),
      },
      {
        accessorKey: 'previous_status',
        header: 'Status Change',
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Badge variant="outline">{row.getValue('previous_status')}</Badge>
            <span className="text-muted-foreground">→</span>
            <Badge variant="outline">{row.original.new_status}</Badge>
          </div>
        ),
      },
      {
        accessorKey: 'notes',
        header: 'Notes',
        cell: ({ row }) => {
          const notes = row.getValue('notes') as string;
          return notes ? (
            <div className="max-w-md whitespace-normal break-words">
              {notes}
            </div>
          ) : (
            <span className="text-muted-foreground text-sm">No notes</span>
          );
        },
      },
      {
        accessorKey: 'timestamp',
        header: 'Date & Time',
        cell: ({ row }) => {
          const date = new Date(row.getValue('timestamp'));
          return (
            <div>
              <div className="text-sm">
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
        id: 'actions',
        enableHiding: false,
        cell: ({ row }) => {
          const log = row.original;

          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <HugeiconsIcon icon={MoreHorizontalIcon} size={16} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => router.push(`/dashboard/survey/${log.survey}`)}
                >
                  <HugeiconsIcon icon={ViewIcon} size={16} className="mr-2" />
                  View Survey
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    [router]
  );

  const verificationActions = useMemo(
    () =>
      auditLogsData?.results?.filter((log) =>
        ['VERIFY', 'REJECT'].includes(log.action)
      ).length || 0,
    [auditLogsData]
  );

  const verifiedCount = useMemo(
    () =>
      auditLogsData?.results?.filter((log) => log.action === 'VERIFY').length ||
      0,
    [auditLogsData]
  );

  const rejectedCount = useMemo(
    () =>
      auditLogsData?.results?.filter((log) => log.action === 'REJECT').length ||
      0,
    [auditLogsData]
  );

  const submittedCount = useMemo(
    () =>
      auditLogsData?.results?.filter((log) => log.action === 'SUBMIT').length ||
      0,
    [auditLogsData]
  );

  return (
    <div className="flex flex-col">
      <PageHeader breadcrumbs={breadcrumbs} />

      <div className="flex-1 p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Verification History</h1>
            <p className="text-muted-foreground mt-1">
              Complete audit trail of all verification activities
            </p>
          </div>
          {auditLogsData?.count && (
            <Badge variant="secondary" className="text-base px-4 py-2">
              {auditLogsData.count} {auditLogsData.count === 1 ? 'record' : 'records'}
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-4 gap-4">
          <div className="rounded-lg border bg-card p-4">
            <div className="text-sm text-muted-foreground">Total Activities</div>
            <div className="text-2xl font-bold">{auditLogsData?.count || 0}</div>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <div className="text-sm text-muted-foreground">Verified</div>
            <div className="text-2xl font-bold text-green-600">{verifiedCount}</div>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <div className="text-sm text-muted-foreground">Rejected</div>
            <div className="text-2xl font-bold text-destructive">{rejectedCount}</div>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <div className="text-sm text-muted-foreground">Submitted</div>
            <div className="text-2xl font-bold text-blue-600">{submittedCount}</div>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={auditLogsData?.results || []}
          searchKey="service_name"
          searchPlaceholder="Search by service name or user..."
          showColumnToggle={true}
          showPagination={true}
          pageSize={20}
        />
      </div>
    </div>
  );
}
