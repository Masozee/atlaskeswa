'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useSurveys } from '@/hooks/use-surveys';
import { PageHeader } from "@/components/page-header";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal } from "lucide-react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { SurveyListItem } from "@/lib/types/api";

const breadcrumbs = [
  { label: 'Dasbor', href: '/dashboard' },
  { label: 'Semua Catatan Survei' },
];

export default function AllSurveysPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sorting, setSorting] = useState<SortingState>([]);

  const { data, isLoading } = useSurveys({
    search,
    verification_status: statusFilter !== 'all' ? statusFilter : undefined,
    ordering: '-survey_date',
    page_size: 50,
  });

  const columns = useMemo<ColumnDef<SurveyListItem, any>[]>(() => [
    {
      accessorKey: "id",
      header: "ID",
      cell: ({ row }) => <div className="w-12">{row.getValue("id")}</div>,
    },
    {
      accessorKey: "service_name",
      header: "Nama Layanan",
      cell: ({ row }) => {
        return <div className="font-medium max-w-xs truncate">{row.getValue("service_name")}</div>
      },
    },
    {
      accessorKey: "service_city",
      header: "Kota",
    },
    {
      accessorKey: "survey_date",
      header: "Tanggal Survei",
      cell: ({ row }) => {
        const date = new Date(row.getValue("survey_date"));
        return <div>{date.toLocaleDateString('id-ID')}</div>
      },
    },
    {
      accessorKey: "surveyor_name",
      header: "Surveyor",
      cell: ({ row }) => {
        return <div className="text-sm">{row.getValue("surveyor_name")}</div>
      },
    },
    {
      accessorKey: "total_patients_served",
      header: "Pasien",
      cell: ({ row }) => {
        return <div className="text-center">{row.getValue("total_patients_served")}</div>
      },
    },
    {
      accessorKey: "occupancy_rate",
      header: "Okupansi",
      cell: ({ row }) => {
        const rate = row.getValue("occupancy_rate") as number | null;
        return rate !== null ? (
          <div className="text-center">{rate.toFixed(1)}%</div>
        ) : (
          <div className="text-center text-muted-foreground">-</div>
        );
      },
    },
    {
      accessorKey: "verification_status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("verification_status") as string;
        const statusDisplay = row.original.status_display;

        const variant =
          status === 'VERIFIED' ? 'default' :
          status === 'SUBMITTED' ? 'secondary' :
          status === 'REJECTED' ? 'destructive' :
          'outline';

        return <Badge variant={variant}>{statusDisplay}</Badge>;
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const survey = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Buka menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => router.push(`/dashboard/survey/${survey.id}`)}>
                Lihat detail
              </DropdownMenuItem>
              <DropdownMenuItem>Edit survei</DropdownMenuItem>
              <DropdownMenuItem>Lihat lampiran</DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => console.log('Delete survey', survey.id)}
              >
                Hapus survei
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ], []);

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

  if (isLoading) {
    return (
      <>
        <PageHeader breadcrumbs={breadcrumbs} />
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <div className="h-16 w-16 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
            <p className="text-sm text-muted-foreground">Memuat survei...</p>
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
          <h1 className="text-2xl font-bold">Semua Catatan Survei</h1>
          <p className="text-muted-foreground">Pengumpulan dan pemantauan data survei</p>
        </div>

        <div className="flex gap-2 justify-between items-center">
          <Input
            placeholder="Cari berdasarkan nama layanan, kota..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64"
          />
          <div className="flex gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40 !h-9">
                <SelectValue placeholder="Filter berdasarkan status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="DRAFT">Draf</SelectItem>
                <SelectItem value="SUBMITTED">Diajukan</SelectItem>
                <SelectItem value="VERIFIED">Terverifikasi</SelectItem>
                <SelectItem value="REJECTED">Ditolak</SelectItem>
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
                    Tidak ada survei ditemukan.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {data && data.count > 0 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Menampilkan {data.results.length} dari {data.count} survei
            </p>
          </div>
        )}
      </div>
    </>
  );
}
