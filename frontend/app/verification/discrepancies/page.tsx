'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useSurveys } from '@/hooks/use-surveys';
import { useServices } from '@/hooks/use-services';
import { PageHeader, BreadcrumbItemType } from '@/components/page-header';
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
  AlertCircleIcon,
  Tick02Icon,} from "@hugeicons/core-free-icons";
import { DataTable } from '@/components/data-table';

interface Discrepancy {
  id: string;
  survey_id: number;
  service_id: number;
  service_name: string;
  type: 'CAPACITY' | 'STAFFING' | 'DATA_QUALITY' | 'MISSING_INFO' | 'INCONSISTENT';
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  field: string;
  expected_value: string | number;
  actual_value: string | number;
  description: string;
  survey_date: string;
  detected_at: string;
}

const breadcrumbs: BreadcrumbItemType[] = [
  { label: 'Verification & QC', href: '/verification' },
  { label: 'Discrepancy Reports' },
];

export default function DiscrepancyReportsPage() {
  const router = useRouter();

  const { data: surveysData } = useSurveys({
    page_size: 100,
    ordering: '-created_at',
  });

  const { data: servicesData } = useServices({
    page_size: 100,
  });

  // Generate discrepancies based on data quality issues
  const discrepancies = useMemo(() => {
    if (!surveysData?.results) return [];

    const issues: Discrepancy[] = [];

    surveysData.results.forEach((survey: any) => {
      // Check for bed capacity discrepancies
      if (survey.current_bed_capacity && survey.beds_occupied) {
        if (survey.beds_occupied > survey.current_bed_capacity) {
          issues.push({
            id: `${survey.id}-capacity`,
            survey_id: survey.id,
            service_id: survey.service,
            service_name: survey.service_name,
            type: 'CAPACITY',
            severity: 'HIGH',
            field: 'beds_occupied',
            expected_value: `≤ ${survey.current_bed_capacity}`,
            actual_value: survey.beds_occupied,
            description: 'Beds occupied exceeds total capacity',
            survey_date: survey.survey_date,
            detected_at: survey.created_at,
          });
        }
      }

      // Check for patient count discrepancies
      const totalByGender = (survey.patients_male || 0) + (survey.patients_female || 0);
      if (survey.total_patients_served && totalByGender > 0) {
        const diff = Math.abs(survey.total_patients_served - totalByGender);
        if (diff > survey.total_patients_served * 0.1) {
          issues.push({
            id: `${survey.id}-patient-gender`,
            survey_id: survey.id,
            service_id: survey.service,
            service_name: survey.service_name,
            type: 'DATA_QUALITY',
            severity: 'MEDIUM',
            field: 'patient_demographics',
            expected_value: survey.total_patients_served,
            actual_value: totalByGender,
            description: 'Patient count by gender does not match total',
            survey_date: survey.survey_date,
            detected_at: survey.created_at,
          });
        }
      }

      // Check for missing critical information
      if (!survey.surveyor_notes && !survey.challenges_faced) {
        issues.push({
          id: `${survey.id}-missing-notes`,
          survey_id: survey.id,
          service_id: survey.service,
          service_name: survey.service_name,
          type: 'MISSING_INFO',
          severity: 'LOW',
          field: 'survey_notes',
          expected_value: 'Notes provided',
          actual_value: 'Empty',
          description: 'No surveyor notes or challenges documented',
          survey_date: survey.survey_date,
          detected_at: survey.created_at,
        });
      }

      // Check for staffing inconsistencies
      const totalProfessionalStaff =
        (survey.current_psychiatrist_count || 0) +
        (survey.current_psychologist_count || 0) +
        (survey.current_nurse_count || 0) +
        (survey.current_social_worker_count || 0);

      if (survey.current_staff_count && totalProfessionalStaff > survey.current_staff_count) {
        issues.push({
          id: `${survey.id}-staffing`,
          survey_id: survey.id,
          service_id: survey.service,
          service_name: survey.service_name,
          type: 'STAFFING',
          severity: 'MEDIUM',
          field: 'staff_count',
          expected_value: survey.current_staff_count,
          actual_value: totalProfessionalStaff,
          description: 'Professional staff count exceeds total staff',
          survey_date: survey.survey_date,
          detected_at: survey.created_at,
        });
      }
    });

    return issues;
  }, [surveysData]);

  const columns = useMemo<ColumnDef<Discrepancy, any>[]>(
    () => [
      {
        accessorKey: 'severity',
        header: 'Severity',
        cell: ({ row }) => {
          const severity = row.getValue('severity') as string;
          const variant =
            severity === 'HIGH' ? 'destructive' :
            severity === 'MEDIUM' ? 'secondary' :
            'outline';
          return <Badge variant={variant}>{severity}</Badge>;
        },
      },
      {
        accessorKey: 'service_name',
        header: 'Service',
        cell: ({ row }) => (
          <div className="max-w-xs">
            <div className="font-medium truncate">{row.getValue('service_name')}</div>
            <div className="text-xs text-muted-foreground">Survey #{row.original.survey_id}</div>
          </div>
        ),
      },
      {
        accessorKey: 'type',
        header: 'Type',
        cell: ({ row }) => {
          const type = row.getValue('type') as string;
          return <Badge variant="outline">{type.replace('_', ' ')}</Badge>;
        },
      },
      {
        accessorKey: 'field',
        header: 'Field',
        cell: ({ row }) => (
          <div className="font-mono text-sm">{row.getValue('field')}</div>
        ),
      },
      {
        accessorKey: 'description',
        header: 'Description',
        cell: ({ row }) => (
          <div className="max-w-md truncate" title={row.getValue('description')}>
            {row.getValue('description')}
          </div>
        ),
      },
      {
        accessorKey: 'expected_value',
        header: 'Expected',
        cell: ({ row }) => (
          <div className="text-sm text-muted-foreground">
            {row.getValue('expected_value')}
          </div>
        ),
      },
      {
        accessorKey: 'actual_value',
        header: 'Actual',
        cell: ({ row }) => (
          <div className="text-sm font-medium">{row.getValue('actual_value')}</div>
        ),
      },
      {
        accessorKey: 'survey_date',
        header: 'Survey Date',
        cell: ({ row }) => {
          const date = new Date(row.getValue('survey_date'));
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
          const discrepancy = row.original;

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
                  onClick={() => router.push(`/dashboard/survey/${discrepancy.survey_id}`)}
                >
                  <HugeiconsIcon icon={ViewIcon} size={16} className="mr-2" />
                  View Survey
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => router.push(`/dashboard/services/${discrepancy.service_id}`)}
                >
                  <HugeiconsIcon icon={ViewIcon} size={16} className="mr-2" />
                  View Service
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-green-600">
                  <HugeiconsIcon icon={Tick02Icon} size={16} className="mr-2" />
                  Mark as Resolved
                </DropdownMenuItem>
                <DropdownMenuItem className="text-destructive">
                  <HugeiconsIcon icon={AlertCircleIcon} size={16} className="mr-2" />
                  Flag for Review
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    [router]
  );

  const highSeverity = useMemo(
    () => discrepancies.filter((d) => d.severity === 'HIGH').length,
    [discrepancies]
  );

  const mediumSeverity = useMemo(
    () => discrepancies.filter((d) => d.severity === 'MEDIUM').length,
    [discrepancies]
  );

  const lowSeverity = useMemo(
    () => discrepancies.filter((d) => d.severity === 'LOW').length,
    [discrepancies]
  );

  return (
    <div className="flex flex-col">
      <PageHeader breadcrumbs={breadcrumbs} />

      <div className="flex-1 p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Discrepancy Reports</h1>
            <p className="text-muted-foreground mt-1">
              Automated detection of data quality issues and inconsistencies
            </p>
          </div>
          {discrepancies.length > 0 && (
            <Badge variant="destructive" className="text-base px-4 py-2">
              {discrepancies.length} {discrepancies.length === 1 ? 'issue' : 'issues'} found
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-4 gap-4">
          <div className="rounded-lg border bg-card p-4">
            <div className="text-sm text-muted-foreground">Total Discrepancies</div>
            <div className="text-2xl font-bold">{discrepancies.length}</div>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <div className="text-sm text-muted-foreground">High Severity</div>
            <div className="text-2xl font-bold text-destructive">{highSeverity}</div>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <div className="text-sm text-muted-foreground">Medium Severity</div>
            <div className="text-2xl font-bold text-orange-600">{mediumSeverity}</div>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <div className="text-sm text-muted-foreground">Low Severity</div>
            <div className="text-2xl font-bold text-yellow-600">{lowSeverity}</div>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={discrepancies}
          searchKey="service_name"
          searchPlaceholder="Search by service name..."
          showColumnToggle={true}
          showPagination={true}
          pageSize={20}
        />
      </div>
    </div>
  );
}
