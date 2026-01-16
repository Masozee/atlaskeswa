'use client';

import { useMemo } from 'react';
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, Info } from 'lucide-react';
import { DataTable } from '@/components/data-table';
import { ColumnDef } from '@tanstack/react-table';

interface Service {
  id: number;
  name: string;
  city: string;
  province: string;
  mtc_code: string;
  mtc_name: string;
  bsic_code: string;
  bed_capacity: number;
  total_professional_staff: number;
}

interface Gap {
  id: string;
  type: 'MTC_MISSING' | 'BSIC_MISSING' | 'LOW_COVERAGE' | 'NO_BEDS' | 'UNDERSTAFFED';
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  location: string;
  province: string;
  description: string;
  metric: string;
  recommendation: string;
}

export default function ServiceGapsPage() {
  const { data: servicesData } = useQuery({
    queryKey: ['gaps-services'],
    queryFn: () =>
      apiClient.get<{ count: number; results: Service[] }>(
        '/directory/services/',
        {
          page_size: 500,
        }
      ),
  });

  const { data: mtcData } = useQuery({
    queryKey: ['mtc-list'],
    queryFn: () =>
      apiClient.get<{ count: number; results: any[] }>('/directory/mtc/', {
        page_size: 100,
      }),
  });

  // Analyze service gaps
  const gaps = useMemo(() => {
    if (!servicesData?.results || !mtcData?.results) return [];

    const gapsList: Gap[] = [];
    const provinceStats: Record<string, any> = {};

    // Collect province statistics
    servicesData.results.forEach((service) => {
      if (!provinceStats[service.province]) {
        provinceStats[service.province] = {
          serviceCount: 0,
          withBeds: 0,
          totalBeds: 0,
          totalStaff: 0,
          mtcCodes: new Set(),
          bsicCodes: new Set(),
        };
      }

      const stats = provinceStats[service.province];
      stats.serviceCount++;
      if (service.bed_capacity > 0) stats.withBeds++;
      stats.totalBeds += service.bed_capacity;
      stats.totalStaff += service.total_professional_staff;
      stats.mtcCodes.add(service.mtc_code);
      stats.bsicCodes.add(service.bsic_code);
    });

    // Identify gaps
    Object.entries(provinceStats).forEach(([province, stats]: [string, any]) => {
      // Low service coverage
      if (stats.serviceCount < 3) {
        gapsList.push({
          id: `low-coverage-${province}`,
          type: 'LOW_COVERAGE',
          severity: 'HIGH',
          location: province,
          province,
          description: `Only ${stats.serviceCount} service(s) available in the province`,
          metric: `${stats.serviceCount} services`,
          recommendation: 'Expand service network to improve accessibility',
        });
      }

      // Missing MTC categories
      const allMtcCodes = mtcData.results.map((m) => m.code);
      const missingMtc = allMtcCodes.filter((code) => !stats.mtcCodes.has(code));
      if (missingMtc.length > 0) {
        gapsList.push({
          id: `mtc-missing-${province}`,
          type: 'MTC_MISSING',
          severity: 'MEDIUM',
          location: province,
          province,
          description: `Missing ${missingMtc.length} MTC categories: ${missingMtc.join(', ')}`,
          metric: `${missingMtc.length} missing`,
          recommendation: 'Diversify service types to cover all MTC categories',
        });
      }

      // No bed capacity
      if (stats.withBeds === 0) {
        gapsList.push({
          id: `no-beds-${province}`,
          type: 'NO_BEDS',
          severity: 'HIGH',
          location: province,
          province,
          description: 'No inpatient services available (zero bed capacity)',
          metric: '0 beds',
          recommendation: 'Establish inpatient facilities for acute care',
        });
      }

      // Low staffing
      const avgStaffPerService = stats.totalStaff / stats.serviceCount;
      if (avgStaffPerService < 5) {
        gapsList.push({
          id: `understaffed-${province}`,
          type: 'UNDERSTAFFED',
          severity: 'MEDIUM',
          location: province,
          province,
          description: `Low average staffing: ${avgStaffPerService.toFixed(1)} staff per service`,
          metric: `${avgStaffPerService.toFixed(1)} avg`,
          recommendation: 'Increase recruitment and training programs',
        });
      }
    });

    return gapsList;
  }, [servicesData, mtcData]);

  const columns = useMemo<ColumnDef<Gap, any>[]>(
    () => [
      {
        accessorKey: 'severity',
        header: 'Severity',
        cell: ({ row }) => {
          const severity = row.getValue('severity') as string;
          const variant =
            severity === 'HIGH'
              ? 'destructive'
              : severity === 'MEDIUM'
              ? 'default'
              : 'secondary';

          return <Badge variant={variant}>{severity}</Badge>;
        },
      },
      {
        accessorKey: 'location',
        header: 'Location',
        cell: ({ row }) => (
          <div className="font-medium">{row.getValue('location')}</div>
        ),
      },
      {
        accessorKey: 'type',
        header: 'Gap Type',
        cell: ({ row }) => {
          const type = row.getValue('type') as string;
          const label = type.replace(/_/g, ' ');
          return <Badge variant="outline">{label}</Badge>;
        },
      },
      {
        accessorKey: 'description',
        header: 'Description',
        cell: ({ row }) => (
          <div className="max-w-md whitespace-normal break-words">
            {row.getValue('description')}
          </div>
        ),
      },
      {
        accessorKey: 'recommendation',
        header: 'Recommendation',
        cell: ({ row }) => (
          <div className="max-w-md whitespace-normal break-words text-sm text-muted-foreground">
            {row.getValue('recommendation')}
          </div>
        ),
      },
    ],
    []
  );

  const stats = useMemo(() => {
    return {
      total: gaps.length,
      high: gaps.filter((g) => g.severity === 'HIGH').length,
      medium: gaps.filter((g) => g.severity === 'MEDIUM').length,
      low: gaps.filter((g) => g.severity === 'LOW').length,
    };
  }, [gaps]);

  return (
    <div className="flex flex-col">
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <div className="flex flex-1 items-center gap-2">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/data">Data Explorer</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Service Gaps & Needs</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        <DateTime />
      </header>

      <div className="flex-1 p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Service Gaps & Needs Assessment</h1>
          <p className="text-muted-foreground mt-1">
            Identify coverage gaps and service improvement opportunities
          </p>
        </div>

        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Analysis Methodology</AlertTitle>
          <AlertDescription>
            Gaps are identified based on: service density, MTC/BSIC coverage, bed capacity
            availability, and staffing ratios. Recommendations prioritize areas with highest
            impact potential.
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-4 gap-4">
          <div className="rounded-lg border bg-card p-4">
            <div className="text-sm text-muted-foreground">Total Gaps</div>
            <div className="text-2xl font-bold">{stats.total}</div>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <div className="text-sm text-muted-foreground">High Priority</div>
            <div className="text-2xl font-bold text-destructive">{stats.high}</div>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <div className="text-sm text-muted-foreground">Medium Priority</div>
            <div className="text-2xl font-bold text-orange-600">{stats.medium}</div>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <div className="text-sm text-muted-foreground">Low Priority</div>
            <div className="text-2xl font-bold text-blue-600">{stats.low}</div>
          </div>
        </div>

        {stats.high > 0 && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Urgent Attention Required</AlertTitle>
            <AlertDescription>
              {stats.high} high-priority gaps identified that require immediate intervention
              to improve mental health service accessibility and quality.
            </AlertDescription>
          </Alert>
        )}

        <DataTable
          columns={columns}
          data={gaps}
          searchKey="location"
          searchPlaceholder="Search by location or gap type..."
          showColumnToggle={true}
          showPagination={true}
          pageSize={20}
        />
      </div>
    </div>
  );
}
