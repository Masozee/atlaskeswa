'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useSurveyResponses } from '@/hooks/use-survey-responses';
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { Separator } from '@/components/ui/separator';

interface SurveyResponseItem {
  id: number;
  service_name: string;
  service_city: string;
  survey_date: string;
  surveyor_name: string;
  verification_status: string;
  status_display: string;
  created_at: string;
}

const breadcrumbs = [
  { label: 'Dasbor', href: '/dashboard' },
  { label: 'Survei Terverifikasi' },
];

const PAGE_SIZE = 50;

export default function ApprovedSurveysPage() {
  const [search, setSearch] = useState('');
  const [sorting, setSorting] = useState<SortingState>([]);
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [search]);

  const { data, isLoading } = useSurveyResponses({
    search,
    verification_status: 'VERIFIED',
    ordering: '-survey_date',
    page,
    page_size: PAGE_SIZE,
  });

  const totalPages = data ? Math.max(1, Math.ceil(data.count / PAGE_SIZE)) : 1;

  const columns = useMemo<ColumnDef<SurveyResponseItem, any>[]>(() => [
    {
      accessorKey: "id",
      header: "ID",
      cell: ({ row }) => <div className="w-12">{row.getValue("id")}</div>,
    },
    {
      accessorKey: "service_name",
      header: "Nama Layanan",
      cell: ({ row }) => {
        const survey = row.original;
        return (
          <Link
            href={`/dashboard/survey/${survey.id}`}
            className="font-medium max-w-xs truncate text-primary hover:underline"
          >
            {row.getValue("service_name")}
          </Link>
        );
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
      accessorKey: "verification_status",
      header: "Status",
      cell: ({ row }) => {
        const statusDisplay = row.original.status_display;
        return <Badge variant="default">{statusDisplay}</Badge>;
      },
    },
  ], []);

  const table = useReactTable({
    data: (data?.results ?? []) as SurveyResponseItem[],
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

      <div className="flex flex-1 flex-col gap-3">

        <div className="flex items-start justify-between gap-3 px-6 pt-6">
          <div>
            <h1 className="text-xl font-bold">Survei Terverifikasi</h1>
            <p className="text-sm text-muted-foreground">Daftar survei yang sudah diverifikasi</p>
          </div>
        </div>

        <Separator />

        <div className="flex flex-col gap-3 px-6 pb-6">

        <div className="flex gap-2 justify-between items-center">
          <Input
            placeholder="Cari berdasarkan nama layanan, kota..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64 h-9 rounded-sm bg-white shadow-none"
          />
        </div>

        <div className="rounded-sm border bg-white overflow-hidden">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="bg-muted/50">
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id} className="border-r last:border-r-0">
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
                  <TableRow key={row.id} className="even:bg-muted">
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
                    Tidak ada survei terverifikasi.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {data && data.count > 0 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Menampilkan {(page - 1) * PAGE_SIZE + 1}
              {'–'}
              {Math.min(page * PAGE_SIZE, data.count)} dari {data.count} survei
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="shadow-none rounded-sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={!data.previous || page <= 1}
              >
                Sebelumnya
              </Button>
              <span className="text-sm text-muted-foreground">
                Halaman {page} dari {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                className="shadow-none rounded-sm"
                onClick={() => setPage((p) => p + 1)}
                disabled={!data.next || page >= totalPages}
              >
                Selanjutnya
              </Button>
            </div>
          </div>
        )}
              </div>
        </div>
    </>
  );
}
