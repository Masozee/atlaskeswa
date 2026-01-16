'use client';

import { useMemo, useState } from 'react';
import { mockIndonesianServices } from '@/lib/indonesia-locations';
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
import { DateTime } from '@/components/date-time';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/data-table';
import { HugeiconsIcon } from "@hugeicons/react"
import {Hospital01Icon,
  BedIcon,
  UserMultiple02Icon,
  CheckmarkCircle02Icon,
  Search01Icon,
  ViewIcon,} from "@hugeicons/core-free-icons";

interface FacilityService {
  id: number;
  service_name: string;
  province: string;
  city: string;
  mtc_code: string;
  bsic_code: string;
  verification_status: string;
  total_beds: number;
  total_staff: number;
}

export default function FacilityProfilingReportPage() {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedProvince, setSelectedProvince] = useState<string>('all');
  const [selectedMTC, setSelectedMTC] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  const servicesData = mockIndonesianServices;

  // Get unique values
  const provinces = useMemo(() => {
    return ['all', ...new Set(servicesData.map((s) => s.province))].sort();
  }, []);

  const mtcCodes = useMemo(() => {
    return ['all', ...new Set(servicesData.map((s) => s.mtc_code))].sort();
  }, []);

  const statuses = ['all', 'VERIFIED', 'SUBMITTED', 'REJECTED'];

  // Filter services
  const filteredServices = useMemo(() => {
    return servicesData.filter((service) => {
      if (searchQuery && !service.service_name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (selectedProvince !== 'all' && service.province !== selectedProvince) return false;
      if (selectedMTC !== 'all' && service.mtc_code !== selectedMTC) return false;
      if (selectedStatus !== 'all' && service.verification_status !== selectedStatus) return false;
      return true;
    });
  }, [searchQuery, selectedProvince, selectedMTC, selectedStatus]);

  // Calculate statistics
  const stats = useMemo(() => {
    const total = filteredServices.length;
    const verified = filteredServices.filter((s) => s.verification_status === 'VERIFIED').length;
    const totalBeds = filteredServices.reduce((sum, s) => sum + (s.total_beds || 0), 0);
    const totalStaff = filteredServices.reduce((sum, s) => sum + (s.total_staff || 0), 0);

    return {
      total,
      verified,
      totalBeds,
      totalStaff,
    };
  }, [filteredServices]);

  // Facility size classification
  const facilitySizeDistribution = useMemo(() => {
    const small = filteredServices.filter((s) => (s.total_beds || 0) <= 50).length;
    const medium = filteredServices.filter((s) => (s.total_beds || 0) > 50 && (s.total_beds || 0) <= 200).length;
    const large = filteredServices.filter((s) => (s.total_beds || 0) > 200).length;

    return { small, medium, large };
  }, [filteredServices]);

  // Top facilities by capacity
  const topFacilities = useMemo(() => {
    return [...filteredServices]
      .sort((a, b) => (b.total_beds || 0) - (a.total_beds || 0))
      .slice(0, 5);
  }, [filteredServices]);

  // Table columns
  const columns = useMemo<ColumnDef<FacilityService, any>[]>(
    () => [
      {
        accessorKey: 'service_name',
        header: 'Facility Name',
        cell: ({ row }) => (
          <div>
            <div className="font-medium">{row.getValue('service_name')}</div>
            <div className="text-xs text-muted-foreground">
              {row.original.city}, {row.original.province}
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'mtc_code',
        header: 'MTC',
        cell: ({ row }) => (
          <Badge variant="outline" className="bg-blue-50 text-blue-700">
            {row.getValue('mtc_code')}
          </Badge>
        ),
      },
      {
        accessorKey: 'bsic_code',
        header: 'BSIC',
        cell: ({ row }) => (
          <Badge variant="outline" className="bg-purple-50 text-purple-700">
            {row.getValue('bsic_code')}
          </Badge>
        ),
      },
      {
        accessorKey: 'total_beds',
        header: 'Beds',
        cell: ({ row }) => (
          <div className="text-center font-medium">{row.getValue('total_beds')}</div>
        ),
      },
      {
        accessorKey: 'total_staff',
        header: 'Staff',
        cell: ({ row }) => (
          <div className="text-center font-medium">{row.getValue('total_staff')}</div>
        ),
      },
      {
        accessorKey: 'verification_status',
        header: 'Status',
        cell: ({ row }) => {
          const status = row.getValue('verification_status') as string;
          return (
            <Badge
              variant={
                status === 'VERIFIED'
                  ? 'default'
                  : status === 'SUBMITTED'
                  ? 'secondary'
                  : 'destructive'
              }
            >
              {status}
            </Badge>
          );
        },
      },
      {
        id: 'actions',
        enableHiding: false,
        cell: ({ row }) => {
          const service = row.original;
          return (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                // View facility profile
                alert(`View profile for: ${service.service_name}`);
              }}
            >
              <HugeiconsIcon icon={ViewIcon} size={16} className="mr-1" />
              View
            </Button>
          );
        },
      },
    ],
    []
  );

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
              <BreadcrumbLink href="/reports">Reports & Analytics</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Facility Profiling</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="ml-auto">
          <DateTime />
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-6">
        <div>
          <h1 className="text-2xl font-bold">Facility Profiling Report</h1>
          <p className="text-muted-foreground">
            Detailed profiles and characteristics of mental health facilities
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Facilities</CardTitle>
              <HugeiconsIcon icon={Hospital01Icon} size={16} className="text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">Mental health services</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Verified Facilities</CardTitle>
              <HugeiconsIcon icon={CheckmarkCircle02Icon} size={16} className="text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.verified}</div>
              <p className="text-xs text-muted-foreground">
                {stats.total > 0 ? ((stats.verified / stats.total) * 100).toFixed(0) : 0}% of total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Capacity</CardTitle>
              <HugeiconsIcon icon={BedIcon} size={16} className="text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.totalBeds}</div>
              <p className="text-xs text-muted-foreground">Beds available</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Workforce</CardTitle>
              <HugeiconsIcon icon={UserMultiple02Icon} size={16} className="text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{stats.totalStaff}</div>
              <p className="text-xs text-muted-foreground">Staff members</p>
            </CardContent>
          </Card>
        </div>

        {/* Facility Size Distribution */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Small Facilities</CardTitle>
              <CardDescription>Up to 50 beds</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-blue-600">{facilitySizeDistribution.small}</div>
              <p className="text-sm text-muted-foreground mt-2">
                {stats.total > 0
                  ? ((facilitySizeDistribution.small / stats.total) * 100).toFixed(1)
                  : 0}% of total facilities
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Medium Facilities</CardTitle>
              <CardDescription>51-200 beds</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-green-600">{facilitySizeDistribution.medium}</div>
              <p className="text-sm text-muted-foreground mt-2">
                {stats.total > 0
                  ? ((facilitySizeDistribution.medium / stats.total) * 100).toFixed(1)
                  : 0}% of total facilities
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Large Facilities</CardTitle>
              <CardDescription>200+ beds</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-purple-600">{facilitySizeDistribution.large}</div>
              <p className="text-sm text-muted-foreground mt-2">
                {stats.total > 0
                  ? ((facilitySizeDistribution.large / stats.total) * 100).toFixed(1)
                  : 0}% of total facilities
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Top Facilities */}
        <Card>
          <CardHeader>
            <CardTitle>Top 5 Facilities by Capacity</CardTitle>
            <CardDescription>Largest mental health facilities by bed count</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topFacilities.map((facility, index) => (
                <div
                  key={facility.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-semibold">{facility.service_name}</div>
                      <div className="text-xs text-muted-foreground">
                        {facility.city}, {facility.province}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <div className="text-sm text-muted-foreground">Beds</div>
                      <div className="text-lg font-bold text-blue-600">{facility.total_beds}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-muted-foreground">Staff</div>
                      <div className="text-lg font-bold text-green-600">{facility.total_staff}</div>
                    </div>
                    <div className="text-center min-w-[80px]">
                      <Badge variant="outline">{facility.mtc_code}</Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Filters and Search */}
        <Card>
          <CardHeader>
            <CardTitle>All Facilities</CardTitle>
            <CardDescription>Search and filter facilities by various criteria</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search */}
            <div className="relative">
              <HugeiconsIcon icon={Search01Icon} size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search facilities by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-4">
              <Select value={selectedProvince} onValueChange={setSelectedProvince}>
                <SelectTrigger className="w-56">
                  <SelectValue placeholder="Select province" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Provinces</SelectItem>
                  {provinces.slice(1).map((province) => (
                    <SelectItem key={province} value={province}>
                      {province}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedMTC} onValueChange={setSelectedMTC}>
                <SelectTrigger className="w-56">
                  <SelectValue placeholder="Select MTC" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All MTC Categories</SelectItem>
                  {mtcCodes.slice(1).map((mtc) => (
                    <SelectItem key={mtc} value={mtc}>
                      {mtc}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-56">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {statuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status === 'all' ? 'All Statuses' : status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {(searchQuery || selectedProvince !== 'all' || selectedMTC !== 'all' || selectedStatus !== 'all') && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedProvince('all');
                    setSelectedMTC('all');
                    setSelectedStatus('all');
                  }}
                >
                  Clear Filters
                </Button>
              )}
            </div>

            {/* Results count */}
            <div className="text-sm text-muted-foreground">
              Showing {filteredServices.length} of {servicesData.length} facilities
            </div>

            {/* Data Table */}
            <DataTable
              columns={columns as any}
              data={filteredServices}
              searchKey="service_name"
              searchPlaceholder="Search facilities..."
              showColumnToggle={true}
              showPagination={true}
              pageSize={10}
            />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
