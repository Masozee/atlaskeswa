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
import { ColumnDef } from '@tanstack/react-table';
import { HugeiconsIcon } from "@hugeicons/react"
import {MoreHorizontalIcon,
  ViewIcon,
  Location01Icon,
  Calendar03Icon,} from "@hugeicons/core-free-icons";
import { DataTable } from '@/components/data-table';

interface Survey {
  id: number;
  service: number;
  service_name: string;
  service_city: string;
  survey_date: string;
  surveyor: number;
  surveyor_name: string;
  verification_status: 'DRAFT' | 'SUBMITTED' | 'VERIFIED' | 'REJECTED';
  status_display: string;
  assigned_verifier: number | null;
  verifier_name: string | null;
  occupancy_rate: number | null;
  total_patients_served: number;
  created_at: string;
}

export default function AssignmentsPage() {
  const router = useRouter();

  const { data: surveysData, isLoading } = useQuery({
    queryKey: ['assignments'],
    queryFn: () =>
      apiClient.get<{ count: number; results: Survey[] }>(
        '/surveys/surveys/',
        {
          page_size: 200,
          ordering: '-survey_date',
        }
      ),
  });

  // Group by surveyor
  const assignmentsBySurveyor = useMemo(() => {
    if (!surveysData?.results) return [];

    const grouped = surveysData.results.reduce((acc, survey) => {
      const key = survey.surveyor;
      if (!acc[key]) {
        acc[key] = {
          surveyor_id: survey.surveyor,
          surveyor_name: survey.surveyor_name,
          total: 0,
          draft: 0,
          submitted: 0,
          verified: 0,
          rejected: 0,
          surveys: [],
        };
      }
      acc[key].total++;
      acc[key].surveys.push(survey);

      if (survey.verification_status === 'DRAFT') acc[key].draft++;
      else if (survey.verification_status === 'SUBMITTED') acc[key].submitted++;
      else if (survey.verification_status === 'VERIFIED') acc[key].verified++;
      else if (survey.verification_status === 'REJECTED') acc[key].rejected++;

      return acc;
    }, {} as Record<number, any>);

    return Object.values(grouped);
  }, [surveysData]);

  const columns = useMemo<ColumnDef<Survey, any>[]>(
    () => [
      {
        accessorKey: 'service_name',
        header: 'Service',
        cell: ({ row }) => (
          <div>
            <div className="font-medium">{row.getValue('service_name')}</div>
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <HugeiconsIcon icon={Location01Icon} size={12} />
              {row.original.service_city}
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'surveyor_name',
        header: 'Assigned To',
        cell: ({ row }) => (
          <div className="font-medium">{row.getValue('surveyor_name')}</div>
        ),
      },
      {
        accessorKey: 'survey_date',
        header: 'Survey Date',
        cell: ({ row }) => {
          const date = new Date(row.getValue('survey_date'));
          return (
            <div className="flex items-center gap-2 text-sm">
              <HugeiconsIcon icon={Calendar03Icon} size={16} className="text-muted-foreground" />
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
        accessorKey: 'verification_status',
        header: 'Status',
        cell: ({ row }) => {
          const status = row.getValue('verification_status') as string;
          const variant =
            status === 'VERIFIED'
              ? 'default'
              : status === 'REJECTED'
              ? 'destructive'
              : status === 'SUBMITTED'
              ? 'secondary'
              : 'outline';

          return <Badge variant={variant}>{row.original.status_display}</Badge>;
        },
      },
      {
        accessorKey: 'total_patients_served',
        header: 'Patients',
        cell: ({ row }) => {
          const count = row.getValue('total_patients_served') as number;
          return <div className="text-sm font-medium">{count || 0}</div>;
        },
      },
      {
        accessorKey: 'verifier_name',
        header: 'Verifier',
        cell: ({ row }) => {
          const verifier = row.getValue('verifier_name') as string | null;
          return verifier ? (
            <div className="text-sm">{verifier}</div>
          ) : (
            <span className="text-xs text-muted-foreground">Not assigned</span>
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
                <DropdownMenuItem
                  onClick={() => router.push(`/dashboard/survey/${survey.id}`)}
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
    const surveys = surveysData?.results || [];
    return {
      total: surveys.length,
      draft: surveys.filter((s) => s.verification_status === 'DRAFT').length,
      submitted: surveys.filter((s) => s.verification_status === 'SUBMITTED')
        .length,
      verified: surveys.filter((s) => s.verification_status === 'VERIFIED')
        .length,
      rejected: surveys.filter((s) => s.verification_status === 'REJECTED')
        .length,
    };
  }, [surveysData]);

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
                <BreadcrumbPage>Assignment List</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        <DateTime />
      </header>

      <div className="flex-1 p-6 space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Survey Assignments</h1>
            <p className="text-muted-foreground mt-1">
              Track survey assignments and progress by enumerator
            </p>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4">
          <div className="rounded-lg border bg-card p-4">
            <div className="text-sm text-muted-foreground">Total Assignments</div>
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
            <div className="text-sm text-muted-foreground">Pending</div>
            <div className="text-2xl font-bold text-orange-600">{stats.draft}</div>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={surveysData?.results || []}
          searchKey="service_name"
          searchPlaceholder="Search by service name or enumerator..."
          showColumnToggle={true}
          showPagination={true}
          pageSize={20}
        />
      </div>
    </div>
  );
}
