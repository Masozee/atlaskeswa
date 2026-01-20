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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ColumnDef } from '@tanstack/react-table';
import { HugeiconsIcon } from "@hugeicons/react"
import {MoreHorizontalIcon,
  ViewIcon,
  Tick02Icon,
  Cancel01Icon,
  Download01Icon,
  Image01Icon} from "@hugeicons/core-free-icons";
import { DataTable } from '@/components/data-table';

interface SurveyAttachment {
  id: number;
  survey: number;
  survey_name: string;
  service_name: string;
  file: string;
  attachment_type: 'PHOTO' | 'DOCUMENT' | 'OTHER';
  description: string;
  uploaded_by: number;
  uploaded_by_name: string;
  uploaded_at: string;
}

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

const breadcrumbs: BreadcrumbItemType[] = [
  { label: 'Verification & QC', href: '/verification' },
  { label: 'Field Evidence Review' },
];

export default function FieldEvidenceReviewPage() {
  const router = useRouter();

  const { data, isLoading } = useQuery({
    queryKey: ['survey-attachments'],
    queryFn: () =>
      apiClient.get<PaginatedResponse<SurveyAttachment>>('/surveys/attachments/', {
        page_size: 100,
        ordering: '-uploaded_at',
      }),
  });

  const columns = useMemo<ColumnDef<SurveyAttachment, any>[]>(
    () => [
      {
        accessorKey: 'id',
        header: 'ID',
        cell: ({ row }) => <div className="w-16 font-medium">#{row.getValue('id')}</div>,
      },
      {
        accessorKey: 'service_name',
        header: 'Service',
        cell: ({ row }) => (
          <div className="max-w-xs">
            <div className="font-medium truncate">{row.getValue('service_name')}</div>
            <div className="text-xs text-muted-foreground">Survey #{row.original.survey}</div>
          </div>
        ),
      },
      {
        accessorKey: 'attachment_type',
        header: 'Type',
        cell: ({ row }) => {
          const type = row.getValue('attachment_type') as string;
          const variant = type === 'PHOTO' ? 'default' : type === 'DOCUMENT' ? 'secondary' : 'outline';
          return <Badge variant={variant}>{type}</Badge>;
        },
      },
      {
        accessorKey: 'description',
        header: 'Description',
        cell: ({ row }) => {
          const desc = row.getValue('description') as string;
          return desc ? (
            <div className="max-w-xs truncate" title={desc}>
              {desc}
            </div>
          ) : (
            <span className="text-muted-foreground">No description</span>
          );
        },
      },
      {
        accessorKey: 'uploaded_by_name',
        header: 'Uploaded By',
        cell: ({ row }) => (
          <div className="text-sm">{row.getValue('uploaded_by_name') || 'Unknown'}</div>
        ),
      },
      {
        accessorKey: 'uploaded_at',
        header: 'Upload Date',
        cell: ({ row }) => {
          const date = new Date(row.getValue('uploaded_at'));
          return (
            <div>
              <div className="font-medium">
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
        id: 'status',
        header: 'Review Status',
        cell: ({ row }) => {
          // You can add review status logic here
          return <Badge variant="secondary">Pending Review</Badge>;
        },
      },
      {
        id: 'actions',
        enableHiding: false,
        cell: ({ row }) => {
          const attachment = row.original;

          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <HugeiconsIcon icon={MoreHorizontalIcon} size={16} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => router.push(`/dashboard/survey/${attachment.survey}`)}>
                  <HugeiconsIcon icon={ViewIcon} size={16} className="mr-2" />
                  View Survey
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => window.open(attachment.file, '_blank')}>
                  {attachment.attachment_type === 'PHOTO' ? (
                    <HugeiconsIcon icon={Image01Icon} size={16} className="mr-2" />
                  ) : (
                    <HugeiconsIcon icon={Download01Icon} size={16} className="mr-2" />
                  )}
                  {attachment.attachment_type === 'PHOTO' ? 'View Image' : 'Download File'}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-green-600">
                  <HugeiconsIcon icon={Tick02Icon} size={16} className="mr-2" />
                  Approve Evidence
                </DropdownMenuItem>
                <DropdownMenuItem className="text-destructive">
                  <HugeiconsIcon icon={Cancel01Icon} size={16} className="mr-2" />
                  Flag Issue
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    [router]
  );

  const photoCount = useMemo(() => {
    return data?.results.filter((a) => a.attachment_type === 'PHOTO').length || 0;
  }, [data]);

  const documentCount = useMemo(() => {
    return data?.results.filter((a) => a.attachment_type === 'DOCUMENT').length || 0;
  }, [data]);

  return (
    <div className="flex flex-col">
      <PageHeader breadcrumbs={breadcrumbs} />

      <div className="flex-1 p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Field Evidence Review</h1>
            <p className="text-muted-foreground mt-1">
              Review photos and documents uploaded from field surveys
            </p>
          </div>
          {data && (
            <Badge variant="outline" className="text-base px-4 py-2">
              {data.count} {data.count === 1 ? 'attachment' : 'attachments'}
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-4 gap-4">
          <div className="rounded-lg border bg-card p-4">
            <div className="text-sm text-muted-foreground">Total Attachments</div>
            <div className="text-2xl font-bold">{data?.count || 0}</div>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <div className="text-sm text-muted-foreground">Photos</div>
            <div className="text-2xl font-bold">{photoCount}</div>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <div className="text-sm text-muted-foreground">Documents</div>
            <div className="text-2xl font-bold">{documentCount}</div>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <div className="text-sm text-muted-foreground">Pending Review</div>
            <div className="text-2xl font-bold text-orange-600">{data?.count || 0}</div>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={data?.results || []}
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
