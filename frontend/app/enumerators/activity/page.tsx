'use client';

import { useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { DateTime } from '@/components/date-time';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ColumnDef } from '@tanstack/react-table';
import { HugeiconsIcon } from "@hugeicons/react"
import {MoreHorizontalIcon,
  ViewIcon,
  TaskDone01Icon,
  FileEditIcon,
  FileValidationIcon,
  CancelCircleIcon,} from "@hugeicons/core-free-icons";
import { DataTable } from '@/components/data-table';

interface AuditLog {
  id: number;
  survey: number;
  action: 'CREATED' | 'UPDATED' | 'SUBMITTED' | 'ASSIGNED' | 'VERIFIED' | 'REJECTED';
  action_display: string;
  user: number;
  user_name: string;
  previous_status: string;
  new_status: string;
  changes: any;
  notes: string;
  timestamp: string;
}

interface User {
  id: number;
  full_name: string;
  role: string;
}

export default function EnumeratorActivityPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedUserId = searchParams.get('user');

  const { data: usersData } = useQuery({
    queryKey: ['enumerators'],
    queryFn: () =>
      apiClient.get<{ count: number; results: User[] }>('/accounts/users/', {
        page_size: 100,
      }),
  });

  const { data: auditLogsData, isLoading } = useQuery({
    queryKey: ['enumerator-activity', selectedUserId],
    queryFn: () =>
      apiClient.get<{ count: number; results: AuditLog[] }>(
        '/surveys/audit-logs/',
        {
          page_size: 200,
          ordering: '-timestamp',
          ...(selectedUserId && { user: selectedUserId }),
        }
      ),
  });

  // Filter only SURVEYOR role users
  const enumerators = useMemo(
    () => usersData?.results?.filter((user) => user.role === 'SURVEYOR') || [],
    [usersData]
  );

  const columns = useMemo<ColumnDef<AuditLog, any>[]>(
    () => [
      {
        accessorKey: 'action',
        header: 'Action',
        cell: ({ row }) => {
          const action = row.getValue('action') as string;
          const variant =
            action === 'VERIFIED'
              ? 'default'
              : action === 'REJECTED'
              ? 'destructive'
              : action === 'SUBMITTED'
              ? 'secondary'
              : 'outline';

          const icon =
            action === 'VERIFIED' ? (
              <HugeiconsIcon icon={FileValidationIcon} size={12} className="mr-1" />
            ) : action === 'REJECTED' ? (
              <HugeiconsIcon icon={CancelCircleIcon} size={12} className="mr-1" />
            ) : action === 'SUBMITTED' ? (
              <HugeiconsIcon icon={TaskDone01Icon} size={12} className="mr-1" />
            ) : action === 'UPDATED' ? (
              <HugeiconsIcon icon={FileEditIcon} size={12} className="mr-1" />
            ) : null;

          return (
            <Badge variant={variant} className="flex items-center w-fit">
              {icon}
              {row.original.action_display}
            </Badge>
          );
        },
      },
      {
        accessorKey: 'survey',
        header: 'Survey ID',
        cell: ({ row }) => (
          <div className="font-mono text-sm">#{row.getValue('survey')}</div>
        ),
      },
      {
        accessorKey: 'user_name',
        header: 'User',
        cell: ({ row }) => (
          <div className="font-medium">{row.getValue('user_name')}</div>
        ),
      },
      {
        accessorKey: 'previous_status',
        header: 'Status Change',
        cell: ({ row }) => {
          const prevStatus = row.getValue('previous_status') as string;
          const newStatus = row.original.new_status;

          if (!prevStatus) {
            return <Badge variant="outline">{newStatus}</Badge>;
          }

          return (
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {prevStatus}
              </Badge>
              <span className="text-muted-foreground">→</span>
              <Badge variant="outline" className="text-xs">
                {newStatus}
              </Badge>
            </div>
          );
        },
      },
      {
        accessorKey: 'notes',
        header: 'Notes',
        cell: ({ row }) => {
          const notes = row.getValue('notes') as string;
          return notes ? (
            <div className="max-w-md whitespace-normal break-words text-sm">
              {notes}
            </div>
          ) : (
            <span className="text-muted-foreground text-sm">-</span>
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

  const stats = useMemo(() => {
    const logs = auditLogsData?.results || [];
    return {
      total: logs.length,
      created: logs.filter((log) => log.action === 'CREATED').length,
      updated: logs.filter((log) => log.action === 'UPDATED').length,
      submitted: logs.filter((log) => log.action === 'SUBMITTED').length,
      verified: logs.filter((log) => log.action === 'VERIFIED').length,
      rejected: logs.filter((log) => log.action === 'REJECTED').length,
    };
  }, [auditLogsData]);

  const handleUserChange = (userId: string) => {
    if (userId === 'all') {
      router.push('/enumerators/activity');
    } else {
      router.push(`/enumerators/activity?user=${userId}`);
    }
  };

  const selectedUser = useMemo(() => {
    if (!selectedUserId) return null;
    return enumerators.find((u) => u.id === parseInt(selectedUserId));
  }, [selectedUserId, enumerators]);

  return (
    <div className="flex flex-col">
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <div className="flex flex-1 items-center gap-2">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/enumerators">
                  Enumerator Management
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Activity Log</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        <DateTime />
      </header>

      <div className="flex-1 p-6 space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Enumerator Activity Log</h1>
            <p className="text-muted-foreground mt-1">
              Track all survey-related activities by enumerators
            </p>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4">
          <div className="rounded-lg border bg-card p-4">
            <div className="text-sm text-muted-foreground">Total Activities</div>
            <div className="text-2xl font-bold">{stats.total}</div>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <div className="text-sm text-muted-foreground">Submitted</div>
            <div className="text-2xl font-bold text-blue-600">{stats.submitted}</div>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <div className="text-sm text-muted-foreground">Verified</div>
            <div className="text-2xl font-bold text-green-600">{stats.verified}</div>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <div className="text-sm text-muted-foreground">Rejected</div>
            <div className="text-2xl font-bold text-destructive">{stats.rejected}</div>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={auditLogsData?.results || []}
          searchKey="user_name"
          searchPlaceholder="Search by user name or notes..."
          showColumnToggle={true}
          showPagination={true}
          pageSize={20}
          filterComponent={
            <div className="flex items-center gap-2">
              {selectedUser && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-muted text-sm">
                  <span className="text-muted-foreground">Filtered:</span>
                  <span className="font-medium">{selectedUser.full_name}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 w-5 p-0 hover:bg-transparent"
                    onClick={() => router.push('/enumerators/activity')}
                  >
                    ✕
                  </Button>
                </div>
              )}
              <Select
                value={selectedUserId || 'all'}
                onValueChange={handleUserChange}
              >
                <SelectTrigger className="w-56">
                  <SelectValue placeholder="Filter by enumerator" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Enumerators</SelectItem>
                  {enumerators.map((user) => (
                    <SelectItem key={user.id} value={user.id.toString()}>
                      {user.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          }
        />
      </div>
    </div>
  );
}
