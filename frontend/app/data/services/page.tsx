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
  Location01Icon,
  HospitalBed02Icon,
  UserMultiple02Icon,} from "@hugeicons/core-free-icons";
import { DataTable } from '@/components/data-table';

interface Service {
  id: number;
  name: string;
  city: string;
  province: string;
  mtc_code: string;
  mtc_name: string;
  bsic_code: string;
  bsic_name: string;
  service_type_name: string;
  bed_capacity: number;
  total_professional_staff: number;
  is_verified: boolean;
  is_active: boolean;
  created_at: string;
}

const breadcrumbs: BreadcrumbItemType[] = [
  { label: 'Data Explorer', href: '/data' },
  { label: 'Services Table' },
];

export default function DataServicesPage() {
  const router = useRouter();

  const { data: servicesData, isLoading } = useQuery({
    queryKey: ['data-services'],
    queryFn: () =>
      apiClient.get<{ count: number; results: Service[] }>(
        '/directory/services/',
        {
          page_size: 200,
          ordering: 'name',
        }
      ),
  });

  const columns = useMemo<ColumnDef<Service, any>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Service Name',
        cell: ({ row }) => (
          <div className="max-w-xs">
            <div className="font-medium">{row.getValue('name')}</div>
            <div className="text-xs text-muted-foreground">{row.original.service_type_name}</div>
          </div>
        ),
      },
      {
        accessorKey: 'city',
        header: 'Location',
        cell: ({ row }) => (
          <div>
            <div className="flex items-center gap-1 text-sm">
              <HugeiconsIcon icon={Location01Icon} size={12} className="text-muted-foreground" />
              {row.getValue('city')}
            </div>
            <div className="text-xs text-muted-foreground">{row.original.province}</div>
          </div>
        ),
      },
      {
        accessorKey: 'mtc_name',
        header: 'MTC',
        cell: ({ row }) => (
          <div>
            <Badge variant="outline" className="text-xs">
              {row.original.mtc_code}
            </Badge>
            <div className="text-xs text-muted-foreground mt-1">{row.getValue('mtc_name')}</div>
          </div>
        ),
      },
      {
        accessorKey: 'bsic_name',
        header: 'BSIC',
        cell: ({ row }) => (
          <div>
            <Badge variant="outline" className="text-xs">
              {row.original.bsic_code}
            </Badge>
            <div className="text-xs text-muted-foreground mt-1">{row.getValue('bsic_name')}</div>
          </div>
        ),
      },
      {
        accessorKey: 'bed_capacity',
        header: 'Beds',
        cell: ({ row }) => {
          const beds = row.getValue('bed_capacity') as number;
          return (
            <div className="flex items-center gap-1">
              <HugeiconsIcon icon={HospitalBed02Icon} size={16} className="text-muted-foreground" />
              <span className="font-medium">{beds}</span>
            </div>
          );
        },
      },
      {
        accessorKey: 'total_professional_staff',
        header: 'Staff',
        cell: ({ row }) => {
          const staff = row.getValue('total_professional_staff') as number;
          return (
            <div className="flex items-center gap-1">
              <HugeiconsIcon icon={UserMultiple02Icon} size={16} className="text-muted-foreground" />
              <span className="font-medium">{staff}</span>
            </div>
          );
        },
      },
      {
        accessorKey: 'is_verified',
        header: 'Status',
        cell: ({ row }) => {
          const isVerified = row.getValue('is_verified') as boolean;
          const isActive = row.original.is_active;

          return (
            <div className="flex flex-col gap-1">
              <Badge variant={isVerified ? 'default' : 'secondary'} className="w-fit">
                {isVerified ? 'Verified' : 'Unverified'}
              </Badge>
              {!isActive && (
                <Badge variant="outline" className="w-fit text-xs">
                  Inactive
                </Badge>
              )}
            </div>
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
                  <span className="sr-only">Open menu</span>
                  <HugeiconsIcon icon={MoreHorizontalIcon} size={16} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => router.push(`/dashboard/services/${service.id}`)}
                >
                  <HugeiconsIcon icon={ViewIcon} size={16} className="mr-2" />
                  View Details
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
    const services = servicesData?.results || [];
    return {
      total: services.length,
      verified: services.filter((s) => s.is_verified).length,
      withBeds: services.filter((s) => s.bed_capacity > 0).length,
      totalBeds: services.reduce((sum, s) => sum + s.bed_capacity, 0),
      totalStaff: services.reduce((sum, s) => sum + s.total_professional_staff, 0),
    };
  }, [servicesData]);

  return (
    <div className="flex flex-col">
      <PageHeader breadcrumbs={breadcrumbs} />

      <div className="flex-1 p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Services Data</h1>
            <p className="text-muted-foreground mt-1">
              Complete directory of mental health services
            </p>
          </div>
        </div>

        <div className="grid grid-cols-5 gap-4">
          <div className="rounded-lg border bg-card p-4">
            <div className="text-sm text-muted-foreground">Total Services</div>
            <div className="text-2xl font-bold">{stats.total}</div>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <div className="text-sm text-muted-foreground">Verified</div>
            <div className="text-2xl font-bold text-green-600">{stats.verified}</div>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <div className="text-sm text-muted-foreground">With Beds</div>
            <div className="text-2xl font-bold text-blue-600">{stats.withBeds}</div>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <div className="text-sm text-muted-foreground">Total Beds</div>
            <div className="text-2xl font-bold text-purple-600">{stats.totalBeds}</div>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <div className="text-sm text-muted-foreground">Total Staff</div>
            <div className="text-2xl font-bold text-orange-600">{stats.totalStaff}</div>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={servicesData?.results || []}
          searchKey="name"
          searchPlaceholder="Search by service name or location..."
          showColumnToggle={true}
          showPagination={true}
          pageSize={20}
        />
      </div>
    </div>
  );
}
