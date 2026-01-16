'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ColumnDef } from '@tanstack/react-table';
import { HugeiconsIcon } from "@hugeicons/react"
import {MoreHorizontalIcon,
  ViewIcon,
  FileEditIcon,
  Delete02Icon,
  UserIcon,
  ChartHistogramIcon,
  TaskDone01Icon,} from "@hugeicons/core-free-icons";
import { DataTable } from '@/components/data-table';
import Link from 'next/link';

interface User {
  id: number;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  full_name: string;
  role: 'ADMIN' | 'SURVEYOR' | 'VERIFIER' | 'VIEWER';
  role_display: string;
  phone_number: string;
  organization: string;
  avatar: string | null;
  is_active: boolean;
  is_staff: boolean;
  created_at: string;
  updated_at: string;
}

export default function EnumeratorsPage() {
  const router = useRouter();

  const { data: usersData, isLoading } = useQuery({
    queryKey: ['enumerators'],
    queryFn: () =>
      apiClient.get<{ count: number; results: User[] }>(
        '/accounts/users/',
        {
          page_size: 100,
        }
      ),
  });

  // Filter only SURVEYOR role users (enumerators)
  const enumerators = useMemo(
    () => usersData?.results?.filter((user) => user.role === 'SURVEYOR') || [],
    [usersData]
  );

  const columns = useMemo<ColumnDef<User, any>[]>(
    () => [
      {
        accessorKey: 'full_name',
        header: 'Name',
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
              {row.original.avatar ? (
                <img
                  src={row.original.avatar}
                  alt={row.getValue('full_name')}
                  className="h-10 w-10 rounded-full object-cover"
                />
              ) : (
                <HugeiconsIcon icon={UserIcon} size={20} className="text-muted-foreground" />
              )}
            </div>
            <div>
              <div className="font-medium">{row.getValue('full_name')}</div>
              <div className="text-xs text-muted-foreground">@{row.original.username}</div>
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'email',
        header: 'Email',
        cell: ({ row }) => (
          <div className="max-w-xs">
            <div className="text-sm">{row.getValue('email')}</div>
            {row.original.phone_number && (
              <div className="text-xs text-muted-foreground">{row.original.phone_number}</div>
            )}
          </div>
        ),
      },
      {
        accessorKey: 'organization',
        header: 'Team/Organization',
        cell: ({ row }) => {
          const org = row.getValue('organization') as string;
          return org ? (
            <span className="text-sm">{org}</span>
          ) : (
            <span className="text-sm text-muted-foreground">Not assigned</span>
          );
        },
      },
      {
        accessorKey: 'is_active',
        header: 'Status',
        cell: ({ row }) => {
          const isActive = row.getValue('is_active') as boolean;
          return (
            <Badge variant={isActive ? 'default' : 'secondary'}>
              {isActive ? 'Active' : 'Inactive'}
            </Badge>
          );
        },
      },
      {
        accessorKey: 'created_at',
        header: 'Joined',
        cell: ({ row }) => {
          const date = new Date(row.getValue('created_at'));
          return (
            <div className="text-sm">
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
        id: 'actions',
        enableHiding: false,
        cell: ({ row }) => {
          const user = row.original;

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
                  onClick={() => router.push(`/enumerators/${user.id}`)}
                >
                  <HugeiconsIcon icon={ViewIcon} size={16} className="mr-2" />
                  View Profile
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => router.push(`/enumerators/activity?user=${user.id}`)}
                >
                  <HugeiconsIcon icon={TaskDone01Icon} size={16} className="mr-2" />
                  View Activity
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => router.push(`/enumerators/performance?user=${user.id}`)}
                >
                  <HugeiconsIcon icon={ChartHistogramIcon} size={16} className="mr-2" />
                  Performance Report
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => router.push(`/enumerators/${user.id}/edit`)}
                >
                  <HugeiconsIcon icon={FileEditIcon} size={16} className="mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem className="text-destructive">
                  <HugeiconsIcon icon={Delete02Icon} size={16} className="mr-2" />
                  Deactivate
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    [router]
  );

  const activeCount = useMemo(
    () => enumerators.filter((user) => user.is_active).length,
    [enumerators]
  );

  const inactiveCount = useMemo(
    () => enumerators.filter((user) => !user.is_active).length,
    [enumerators]
  );

  return (
    <div className="flex flex-col">
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <div className="flex flex-1 items-center gap-2">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>Enumerator Management</BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>All Enumerators</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        <DateTime />
      </header>

      <div className="flex-1 p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Enumerator Management</h1>
            <p className="text-muted-foreground mt-1">
              Manage field surveyors and enumerators
            </p>
          </div>
          <Link href="/enumerators/new">
            <Button>
              <HugeiconsIcon icon={UserIcon} size={16} className="mr-2" />
              Add Enumerator
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-lg border bg-card p-4">
            <div className="text-sm text-muted-foreground">Total Enumerators</div>
            <div className="text-2xl font-bold">{enumerators.length}</div>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <div className="text-sm text-muted-foreground">Active</div>
            <div className="text-2xl font-bold text-green-600">{activeCount}</div>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <div className="text-sm text-muted-foreground">Inactive</div>
            <div className="text-2xl font-bold text-muted-foreground">{inactiveCount}</div>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={enumerators}
          searchKey="full_name"
          searchPlaceholder="Search by name, email, or organization..."
          showColumnToggle={true}
          showPagination={true}
          pageSize={20}
        />
      </div>
    </div>
  );
}
