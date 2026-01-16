'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
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
import {MoreHorizontalIcon} from "@hugeicons/core-free-icons";
import { DataTable } from '@/components/data-table';
import { useState } from 'react';

interface ActivityLog {
  id: number;
  user: number;
  user_name: string;
  username: string;
  action: string;
  action_display: string;
  severity: string;
  severity_display: string;
  description: string;
  model_name: string;
  object_repr: string;
  ip_address: string | null;
  user_agent: string;
  request_method: string;
  request_path: string;
  changes: any;
  metadata: any;
  timestamp: string;
}

export default function LoginHistoryPage() {
  const router = useRouter();
  const [actionFilter, setActionFilter] = useState<string>('all');

  const { data: activityLogsData, isLoading } = useQuery({
    queryKey: ['login-history', actionFilter],
    queryFn: () =>
      apiClient.get<{ count: number; results: ActivityLog[] }>(
        '/logs/activity/',
        {
          page_size: 200,
          ordering: '-timestamp',
          ...(actionFilter !== 'all' && { action: actionFilter }),
        }
      ),
  });

  const columns = useMemo<ColumnDef<ActivityLog, any>[]>(
    () => [
      {
        accessorKey: 'user_name',
        header: 'User',
        cell: ({ row }) => (
          <div>
            <div className="font-medium">{row.getValue('user_name')}</div>
            <div className="text-xs text-muted-foreground">{row.original.username}</div>
          </div>
        ),
      },
      {
        accessorKey: 'action_display',
        header: 'Action',
        cell: ({ row }) => {
          const action = row.original.action;
          const variant =
            action === 'LOGIN'
              ? 'default'
              : action === 'LOGOUT'
              ? 'secondary'
              : action === 'LOGIN_FAILED'
              ? 'destructive'
              : action === 'CREATE'
              ? 'default'
              : action === 'UPDATE'
              ? 'secondary'
              : action === 'DELETE'
              ? 'destructive'
              : 'outline';

          return <Badge variant={variant}>{row.getValue('action_display')}</Badge>;
        },
      },
      {
        accessorKey: 'description',
        header: 'Description',
        cell: ({ row }) => {
          const desc = row.getValue('description') as string;
          return <div className="max-w-md whitespace-normal break-words">{desc || '-'}</div>;
        },
      },
      {
        accessorKey: 'ip_address',
        header: 'IP Address',
        cell: ({ row }) => {
          return (
            <div className="font-mono text-sm">{row.getValue('ip_address') || '-'}</div>
          );
        },
      },
      {
        accessorKey: 'timestamp',
        header: 'Timestamp',
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
                  second: '2-digit',
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
                  onClick={() => {
                    navigator.clipboard.writeText(log.id.toString());
                  }}
                >
                  Copy ID
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    if (log.ip_address) {
                      navigator.clipboard.writeText(log.ip_address);
                    }
                  }}
                >
                  Copy IP Address
                </DropdownMenuItem>
                {log.user_agent && (
                  <DropdownMenuItem
                    onClick={() => {
                      alert(`User Agent:\n\n${log.user_agent}`);
                    }}
                  >
                    View User Agent
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    []
  );

  const stats = useMemo(() => {
    const logs = activityLogsData?.results || [];
    return {
      total: logs.length,
      login: logs.filter((log) => log.action === 'LOGIN').length,
      logout: logs.filter((log) => log.action === 'LOGOUT').length,
      failed: logs.filter((log) => log.action === 'LOGIN_FAILED').length,
    };
  }, [activityLogsData]);

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Login History</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="ml-auto">
          <DateTime />
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-6">
        <div>
          <h1 className="text-2xl font-bold">Login History</h1>
          <p className="text-muted-foreground">User activity and authentication logs</p>
        </div>

        <div className="grid grid-cols-4 gap-4">
          <div className="rounded-lg border bg-card p-4">
            <div className="text-sm text-muted-foreground">Total Activities</div>
            <div className="text-2xl font-bold">{activityLogsData?.count || 0}</div>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <div className="text-sm text-muted-foreground">Successful Logins</div>
            <div className="text-2xl font-bold text-green-600">{stats.login}</div>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <div className="text-sm text-muted-foreground">Logouts</div>
            <div className="text-2xl font-bold text-blue-600">{stats.logout}</div>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <div className="text-sm text-muted-foreground">Failed Attempts</div>
            <div className="text-2xl font-bold text-destructive">{stats.failed}</div>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={activityLogsData?.results || []}
          searchKey="user_name"
          searchPlaceholder="Search by user or description..."
          showColumnToggle={true}
          showPagination={true}
          pageSize={20}
          filterComponent={
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-56">
                <SelectValue placeholder="Filter by action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="LOGIN">Login</SelectItem>
                <SelectItem value="LOGOUT">Logout</SelectItem>
                <SelectItem value="LOGIN_FAILED">Failed Login</SelectItem>
                <SelectItem value="CREATE">Create</SelectItem>
                <SelectItem value="UPDATE">Update</SelectItem>
                <SelectItem value="DELETE">Delete</SelectItem>
              </SelectContent>
            </Select>
          }
        />
      </div>
    </>
  );
}
