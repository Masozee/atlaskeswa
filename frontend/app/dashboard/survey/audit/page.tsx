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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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

const breadcrumbs = [
  { label: 'Dasbor', href: '/dashboard' },
  { label: 'Log Audit Survei' },
];

interface ActivityLog {
  id: number;
  user: number | null;
  user_name: string;
  username: string;
  action: string;
  action_display: string;
  severity: string;
  severity_display: string;
  description: string;
  model_name: string;
  object_repr: string;
  ip_address: string;
  metadata: Record<string, any> | null;
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
  const [selectedLog, setSelectedLog] = useState<ActivityLog | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['survey-audit-logs', search, actionFilter],
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

      return apiClient.get<PaginatedResponse<ActivityLog>>('/logs/activity/', params);
    },
  });

  // Filter to show only survey-related actions
  const surveyActions = ['CREATE', 'UPDATE', 'SURVEY_SUBMIT', 'SURVEY_VERIFY', 'SURVEY_REJECT'];
  const filteredData = useMemo(() => {
    if (!data?.results) return [];
    return data.results.filter(log =>
      surveyActions.includes(log.action) &&
      (log.model_name === 'DynamicSurveyResponse' || log.model_name === 'Survey')
    );
  }, [data?.results]);

  const columns = useMemo<ColumnDef<ActivityLog, any>[]>(
    () => [
      {
        accessorKey: 'id',
        header: 'ID',
        cell: ({ row }) => <div className="w-12">{row.getValue('id')}</div>,
      },
      {
        accessorKey: 'timestamp',
        header: 'Waktu',
        cell: ({ row }) => {
          const timestamp = row.getValue('timestamp') as string;
          const date = new Date(timestamp);
          return (
            <div className="w-36">
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
        accessorKey: 'description',
        header: 'Deskripsi',
        cell: ({ row }) => (
          <div className="max-w-sm">
            <div className="font-medium truncate">{row.getValue('description')}</div>
          </div>
        ),
      },
      {
        accessorKey: 'action',
        header: 'Aksi',
        cell: ({ row }) => {
          const action = row.getValue('action') as string;
          const actionDisplay = row.original.action_display;
          const variant =
            action === 'SURVEY_VERIFY' ? 'default' :
            action === 'SURVEY_SUBMIT' ? 'secondary' :
            action === 'SURVEY_REJECT' ? 'destructive' :
            action === 'CREATE' ? 'outline' :
            action === 'UPDATE' ? 'outline' :
            'default';

          return (
            <Badge variant={variant} className="w-28 justify-center">
              {actionDisplay}
            </Badge>
          );
        },
      },
      {
        accessorKey: 'user_name',
        header: 'Pengguna',
        cell: ({ row }) => (
          <div>
            <div className="font-medium">{row.getValue('user_name')}</div>
          </div>
        ),
      },
      {
        accessorKey: 'ip_address',
        header: 'IP Address',
        cell: ({ row }) => (
          <div className="text-sm text-muted-foreground">
            {row.getValue('ip_address') || '—'}
          </div>
        ),
      },
    ],
    []
  );

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: {
      sorting,
    },
  });

  if (isLoading) {
    return (
      <>
        <PageHeader breadcrumbs={breadcrumbs} />
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <div className="h-16 w-16 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
            <p className="text-sm text-muted-foreground">Memuat log audit...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader breadcrumbs={breadcrumbs} />

      <div className="flex flex-1 flex-col gap-4 p-8">
        <div>
          <h1 className="text-2xl font-bold">Log Audit Survei</h1>
          <p className="text-muted-foreground">
            Riwayat perubahan dan verifikasi survei
          </p>
        </div>

        <div className="flex gap-2 justify-between items-center">
          <Input
            placeholder="Cari survei atau pengguna..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64"
          />

          <div className="flex gap-2 items-center">
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-48 !h-9">
                <SelectValue placeholder="Filter berdasarkan aksi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Aksi</SelectItem>
                <SelectItem value="CREATE">Dibuat</SelectItem>
                <SelectItem value="UPDATE">Diperbarui</SelectItem>
                <SelectItem value="SURVEY_SUBMIT">Diajukan</SelectItem>
                <SelectItem value="SURVEY_VERIFY">Diverifikasi</SelectItem>
                <SelectItem value="SURVEY_REJECT">Ditolak</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="rounded-lg border">
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
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => {
                      setSelectedLog(row.original);
                      setDetailOpen(true);
                    }}
                  >
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
                    Tidak ada log audit ditemukan.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {filteredData.length > 0 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Menampilkan {filteredData.length} log
            </p>
          </div>
        )}
      </div>

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Detail Log Audit</DialogTitle>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">ID</p>
                  <p className="font-medium">{selectedLog.id}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Waktu</p>
                  <p className="font-medium">
                    {new Date(selectedLog.timestamp).toLocaleString('id-ID', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Aksi</p>
                <Badge
                  variant={
                    selectedLog.action === 'SURVEY_VERIFY' ? 'default' :
                    selectedLog.action === 'SURVEY_SUBMIT' ? 'secondary' :
                    selectedLog.action === 'SURVEY_REJECT' ? 'destructive' :
                    'outline'
                  }
                  className="mt-1"
                >
                  {selectedLog.action_display}
                </Badge>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Deskripsi</p>
                <p className="font-medium">{selectedLog.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Pengguna</p>
                  <p className="font-medium">{selectedLog.user_name}</p>
                  <p className="text-sm text-muted-foreground">{selectedLog.username}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">IP Address</p>
                  <p className="font-medium">{selectedLog.ip_address || '—'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Model</p>
                  <p className="font-medium">{selectedLog.model_name || '—'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Objek</p>
                  <p className="font-medium">{selectedLog.object_repr || '—'}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Tingkat Keparahan</p>
                <Badge
                  variant={
                    selectedLog.severity === 'ERROR' ? 'destructive' :
                    selectedLog.severity === 'WARNING' ? 'secondary' :
                    'outline'
                  }
                  className="mt-1"
                >
                  {selectedLog.severity_display}
                </Badge>
              </div>

              {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Metadata</p>
                  <pre className="bg-muted p-3 rounded-md text-xs overflow-auto max-h-40">
                    {JSON.stringify(selectedLog.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
