'use client';

import { useState, useMemo } from 'react';
import { PageHeader } from '@/components/page-header';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from '@tanstack/react-table';
import { HugeiconsIcon } from "@hugeicons/react"
import {Search01Icon, ArrowUp01Icon, ArrowDown01Icon} from "@hugeicons/core-free-icons";

const breadcrumbs = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Survey Management', href: '/dashboard/survey' },
  { label: 'Audit Log' },
];

interface AuditLog {
  id: number;
  survey: number;
  survey_name: string;
  action: string;
  user: number;
  user_name: string;
  previous_status: string;
  new_status: string;
  notes: string;
  timestamp: string;
}

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export default function AuditLogPage() {
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [sorting, setSorting] = useState<SortingState>([]);

  const { data, isLoading } = useQuery({
    queryKey: ['audit-logs', search, actionFilter],
    queryFn: () => {
      const params: Record<string, any> = {
        page_size: 100,
      };

      if (search) {
        params.search = search;
      }

      if (actionFilter !== 'all') {
        params.action = actionFilter;
      }

      return apiClient.get<PaginatedResponse<AuditLog>>('/surveys/audit-logs/', params);
    },
  });

  const columns = useMemo<ColumnDef<AuditLog, any>[]>(
    () => [
      {
        accessorKey: 'id',
        header: 'ID',
        cell: ({ row }) => <div className="w-16">{row.getValue('id')}</div>,
      },
      {
        accessorKey: 'timestamp',
        header: ({ column }) => {
          return (
            <button
              className="flex items-center gap-1 hover:text-foreground"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            >
              Timestamp
              {column.getIsSorted() === 'asc' ? (
                <HugeiconsIcon icon={ArrowUp01Icon} size={12} />
              ) : column.getIsSorted() === 'desc' ? (
                <HugeiconsIcon icon={ArrowDown01Icon} size={12} />
              ) : null}
            </button>
          );
        },
        cell: ({ row }) => {
          const timestamp = row.getValue('timestamp') as string;
          const date = new Date(timestamp);
          return (
            <div className="w-40">
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
        accessorKey: 'survey_name',
        header: 'Survey',
        cell: ({ row }) => (
          <div className="max-w-xs">
            <div className="font-medium truncate">{row.getValue('survey_name')}</div>
            <div className="text-xs text-muted-foreground">ID: {row.original.survey}</div>
          </div>
        ),
      },
      {
        accessorKey: 'action',
        header: 'Action',
        cell: ({ row }) => {
          const action = row.getValue('action') as string;
          const variant =
            action === 'VERIFIED' ? 'default' :
            action === 'SUBMITTED' ? 'secondary' :
            action === 'REJECTED' ? 'destructive' :
            action === 'CREATED' ? 'outline' :
            action === 'UPDATED' ? 'outline' :
            'default';

          return (
            <Badge variant={variant} className="w-28 justify-center">
              {action}
            </Badge>
          );
        },
      },
      {
        accessorKey: 'user_name',
        header: 'User',
        cell: ({ row }) => (
          <div>
            <div className="font-medium">{row.getValue('user_name')}</div>
            <div className="text-xs text-muted-foreground">ID: {row.original.user}</div>
          </div>
        ),
      },
      {
        accessorKey: 'previous_status',
        header: 'Previous Status',
        cell: ({ row }) => {
          const status = row.getValue('previous_status') as string;
          if (!status) return <span className="text-muted-foreground">—</span>;

          const variant =
            status === 'VERIFIED' ? 'default' :
            status === 'SUBMITTED' ? 'secondary' :
            status === 'REJECTED' ? 'destructive' :
            'outline';

          return <Badge variant={variant}>{status}</Badge>;
        },
      },
      {
        accessorKey: 'new_status',
        header: 'New Status',
        cell: ({ row }) => {
          const status = row.getValue('new_status') as string;
          if (!status) return <span className="text-muted-foreground">—</span>;

          const variant =
            status === 'VERIFIED' ? 'default' :
            status === 'SUBMITTED' ? 'secondary' :
            status === 'REJECTED' ? 'destructive' :
            'outline';

          return <Badge variant={variant}>{status}</Badge>;
        },
      },
      {
        accessorKey: 'notes',
        header: 'Notes',
        cell: ({ row }) => {
          const notes = row.getValue('notes') as string;
          if (!notes) return <span className="text-muted-foreground">—</span>;

          return (
            <div className="max-w-sm truncate" title={notes}>
              {notes}
            </div>
          );
        },
      },
    ],
    []
  );

  const table = useReactTable({
    data: data?.results ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: {
      sorting,
    },
  });

  return (
    <>
      <PageHeader breadcrumbs={breadcrumbs} />

      <div className="flex flex-1 flex-col gap-4 p-8">
        <div>
          <h1 className="text-3xl font-bold">Audit Log</h1>
          <p className="text-muted-foreground mt-1">
            View all survey changes and verification workflow history
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <HugeiconsIcon icon={Search01Icon} size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search survey or user..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by action" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              <SelectItem value="CREATED">Created</SelectItem>
              <SelectItem value="UPDATED">Updated</SelectItem>
              <SelectItem value="SUBMITTED">Submitted</SelectItem>
              <SelectItem value="ASSIGNED">Assigned</SelectItem>
              <SelectItem value="VERIFIED">Verified</SelectItem>
              <SelectItem value="REJECTED">Rejected</SelectItem>
              <SelectItem value="RESUBMITTED">Resubmitted</SelectItem>
            </SelectContent>
          </Select>

          {data && (
            <Badge variant="outline" className="ml-auto">
              {data.count} {data.count === 1 ? 'record' : 'records'}
            </Badge>
          )}
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">
                    No audit logs found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </>
  );
}
