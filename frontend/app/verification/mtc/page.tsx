'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useServices } from '@/hooks/use-services';
import { useMainTypesOfCare } from '@/hooks/use-services';
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
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ColumnDef } from '@tanstack/react-table';
import { HugeiconsIcon } from "@hugeicons/react"
import {MoreHorizontalIcon, ViewIcon, Tick02Icon, Cancel01Icon} from "@hugeicons/core-free-icons";
import { DataTable } from '@/components/data-table';

export default function MTCValidationPage() {
  const router = useRouter();

  const { data, isLoading } = useServices({
    ordering: '-created_at',
    page_size: 100,
  });

  const { data: mtcData } = useMainTypesOfCare();

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
            <div className="text-xs text-muted-foreground">{row.original.city}</div>
          </div>
        ),
      },
      {
        accessorKey: 'mtc_code',
        header: 'MTC Code',
        cell: ({ row }) => {
          const code = row.getValue('mtc_code') as string;
          return code ? (
            <Badge variant="outline" className="font-mono">
              {code}
            </Badge>
          ) : (
            <Badge variant="destructive">Missing</Badge>
          );
        },
      },
      {
        accessorKey: 'mtc_name',
        header: 'MTC Classification',
        cell: ({ row }) => {
          const name = row.getValue('mtc_name') as string;
          return name ? (
            <div className="max-w-xs truncate">{name}</div>
          ) : (
            <span className="text-destructive">Not Assigned</span>
          );
        },
      },
      {
        accessorKey: 'bsic_code',
        header: 'BSIC Code',
        cell: ({ row }) => {
          const code = row.getValue('bsic_code') as string;
          return code ? (
            <Badge variant="outline" className="font-mono">
              {code}
            </Badge>
          ) : (
            <Badge variant="destructive">Missing</Badge>
          );
        },
      },
      {
        accessorKey: 'service_type_name',
        header: 'Service Type',
        cell: ({ row }) => {
          const type = row.getValue('service_type_name') as string;
          return type ? (
            <Badge variant="secondary">{type}</Badge>
          ) : (
            <span className="text-muted-foreground">—</span>
          );
        },
      },
      {
        id: 'validation_status',
        header: 'Validation Status',
        cell: ({ row }) => {
          const hasMTC = row.original.mtc_code;
          const hasBSIC = row.original.bsic_code;

          if (hasMTC && hasBSIC) {
            return <Badge variant="default" className="bg-green-600">Complete</Badge>;
          } else if (hasMTC || hasBSIC) {
            return <Badge variant="secondary">Partial</Badge>;
          } else {
            return <Badge variant="destructive">Incomplete</Badge>;
          }
        },
      },
      {
        id: 'actions',
        enableHiding: false,
        cell: ({ row }) => {
          const service = row.original;
          const hasMTC = service.mtc_code;
          const hasBSIC = service.bsic_code;
          const isComplete = hasMTC && hasBSIC;

          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <HugeiconsIcon icon={MoreHorizontalIcon} size={16} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => router.push(`/dashboard/services/${service.id}`)}>
                  <HugeiconsIcon icon={ViewIcon} size={16} className="mr-2" />
                  View Details
                </DropdownMenuItem>
                {!isComplete && (
                  <DropdownMenuItem onClick={() => router.push(`/dashboard/services/${service.id}/edit`)}>
                    <HugeiconsIcon icon={Tick02Icon} size={16} className="mr-2" />
                    Edit Classifications
                  </DropdownMenuItem>
                )}
                {isComplete && (
                  <DropdownMenuItem className="text-green-600">
                    <HugeiconsIcon icon={Tick02Icon} size={16} className="mr-2" />
                    Validate MTC/BSIC
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    [router]
  );

  // Filter services with missing or incomplete MTC/BSIC
  const incompleteServices = useMemo(() => {
    if (!data?.results) return [];
    return data.results.filter(
      (service: any) => !service.mtc_code || !service.bsic_code
    );
  }, [data]);

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
                <BreadcrumbPage>MTC Validation</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        <DateTime />
      </header>

      <div className="flex-1 p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">MTC Validation</h1>
            <p className="text-muted-foreground mt-1">
              Validate Main Type of Care (MTC) and BSIC classifications for services
            </p>
          </div>
          <div className="flex items-center gap-2">
            {incompleteServices.length > 0 && (
              <Badge variant="destructive" className="text-base px-4 py-2">
                {incompleteServices.length} incomplete
              </Badge>
            )}
            {data && (
              <Badge variant="outline" className="text-base px-4 py-2">
                {data.count} total services
              </Badge>
            )}
          </div>
        </div>

        {mtcData && (
          <div className="grid grid-cols-4 gap-4">
            <div className="rounded-lg border bg-card p-4">
              <div className="text-sm text-muted-foreground">Total MTC Categories</div>
              <div className="text-2xl font-bold">{mtcData.length}</div>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <div className="text-sm text-muted-foreground">Services Classified</div>
              <div className="text-2xl font-bold">
                {data?.results.filter((s: any) => s.mtc_code).length || 0}
              </div>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <div className="text-sm text-muted-foreground">Missing MTC</div>
              <div className="text-2xl font-bold text-destructive">
                {data?.results.filter((s: any) => !s.mtc_code).length || 0}
              </div>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <div className="text-sm text-muted-foreground">Missing BSIC</div>
              <div className="text-2xl font-bold text-destructive">
                {data?.results.filter((s: any) => !s.bsic_code).length || 0}
              </div>
            </div>
          </div>
        )}

        <DataTable
          columns={columns}
          data={data?.results || []}
          searchKey="name"
          searchPlaceholder="Search services..."
          showColumnToggle={true}
          showPagination={true}
          pageSize={20}
        />
      </div>
    </div>
  );
}
