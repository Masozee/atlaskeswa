'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useServices } from '@/hooks/use-services';
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
import {MoreHorizontalIcon, ViewIcon, Tick02Icon, Cancel01Icon} from "@hugeicons/core-free-icons";
import { DataTable } from '@/components/data-table';

export default function VerifyServicesPage() {
  const router = useRouter();

  const { data, isLoading } = useServices({
    ordering: '-created_at',
    page_size: 100,
  });

  const columns = useMemo<ColumnDef<any, any>[]>(
    () => [
      {
        accessorKey: 'id',
        header: 'ID',
        cell: ({ row }) => <div className="w-16 font-medium">#{row.getValue('id')}</div>,
      },
      {
        accessorKey: 'name',
        header: 'Service Name',
        cell: ({ row }) => (
          <div className="max-w-xs">
            <div className="font-medium truncate">{row.getValue('name')}</div>
            <div className="text-xs text-muted-foreground">{row.original.mtc_name || 'No MTC'}</div>
          </div>
        ),
      },
      {
        accessorKey: 'city',
        header: 'Location',
        cell: ({ row }) => (
          <div>
            <div className="font-medium">{row.getValue('city')}</div>
            <div className="text-xs text-muted-foreground">{row.original.province}</div>
          </div>
        ),
      },
      {
        accessorKey: 'service_type_name',
        header: 'Service Type',
        cell: ({ row }) => {
          const type = row.getValue('service_type_name');
          return type ? <Badge variant="outline">{type as string}</Badge> : <span className="text-muted-foreground">—</span>;
        },
      },
      {
        accessorKey: 'bed_capacity',
        header: 'Capacity',
        cell: ({ row }) => {
          const capacity = row.getValue('bed_capacity') as number;
          return capacity ? `${capacity} beds` : <span className="text-muted-foreground">—</span>;
        },
      },
      {
        accessorKey: 'is_verified',
        header: 'Status',
        cell: ({ row }) => {
          const isVerified = row.original.is_verified;
          return isVerified ? (
            <Badge variant="default" className="bg-green-600">Verified</Badge>
          ) : (
            <Badge variant="outline">Unverified</Badge>
          );
        },
      },
      {
        id: 'actions',
        enableHiding: false,
        cell: ({ row }) => {
          const service = row.original;
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <HugeiconsIcon icon={MoreHorizontalIcon} size={16} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => router.push(`/dashboard/services/${service.id}`)}>
                  <HugeiconsIcon icon={ViewIcon} size={16} className="mr-2" />
                  View Details
                </DropdownMenuItem>
                {!service.is_verified && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-green-600">
                      <HugeiconsIcon icon={Tick02Icon} size={16} className="mr-2" />
                      Verify Service
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive">
                      <HugeiconsIcon icon={Cancel01Icon} size={16} className="mr-2" />
                      Reject Service
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    [router]
  );

  return (
    <div className="flex flex-col">
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <div className="flex flex-1 items-center gap-2">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>Verification & QC</BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Verify Service Details</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        <DateTime />
      </header>
      <div className="flex-1 p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Verify Service Details</h1>
            <p className="text-muted-foreground mt-1">
              Review and verify service information
            </p>
          </div>
          {data && <Badge variant="outline" className="text-base px-4 py-2">{data.count} services</Badge>}
        </div>
        <DataTable columns={columns} data={data?.results || []} searchKey="name" searchPlaceholder="Search services..." showColumnToggle={true} showPagination={true} pageSize={20} />
      </div>
    </div>
  );
}
