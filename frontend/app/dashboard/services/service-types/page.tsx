"use client";

import { useMemo, useState } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { useServiceTypes } from "@/hooks/use-services";
import { ServiceType } from "@/lib/types/api";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Separator } from '@/components/ui/separator';

const breadcrumbs = [
  { label: 'Dasbor', href: '/dashboard' },
  { label: 'Layanan', href: '/dashboard/services' },
  { label: 'Jenis Layanan' },
];

export default function ServiceTypesPage() {
  const { data: serviceTypes, isLoading } = useServiceTypes();
  const [search, setSearch] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);

  const columns = useMemo<ColumnDef<ServiceType, any>[]>(
    () => [
      {
        accessorKey: "id",
        header: "ID",
        cell: ({ row }) => (
          <div className="w-12 font-mono text-muted-foreground">{row.getValue("id")}</div>
        ),
      },
      {
        accessorKey: "name",
        header: "Jenis Layanan",
        cell: ({ row }) => (
          <div className="font-medium">{row.getValue("name")}</div>
        ),
      },
      {
        accessorKey: "description",
        header: "Deskripsi",
        cell: ({ row }) => {
          const description = row.getValue("description") as string;
          return (
            <div className="max-w-[500px] truncate text-muted-foreground">
              {description || "-"}
            </div>
          );
        },
      },
      {
        accessorKey: "is_active",
        header: "Status",
        cell: ({ row }) => {
          const isActive = row.getValue("is_active");
          return (
            <Badge variant={isActive ? "default" : "secondary"}>
              {isActive ? "Aktif" : "Nonaktif"}
            </Badge>
          );
        },
      },
    ],
    []
  );

  // Filter data based on search
  const filteredData = useMemo(() => {
    if (!serviceTypes) return [];
    if (!search) return serviceTypes;

    const searchLower = search.toLowerCase();
    return serviceTypes.filter(
      (item) =>
        item.name.toLowerCase().includes(searchLower) ||
        (item.description && item.description.toLowerCase().includes(searchLower))
    );
  }, [serviceTypes, search]);

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

  return (
    <>
      <PageHeader breadcrumbs={breadcrumbs} />

      <div className="flex flex-1 flex-col gap-3">

        <div className="px-6 pt-6">
          <h1 className="text-xl font-bold tracking-tight">Jenis Layanan</h1>
          <p className="text-sm text-muted-foreground">
            Jenis layanan kesehatan jiwa yang tersedia
          </p>
        </div>

        <Separator />

        <div className="flex flex-col gap-3 px-6 pb-6">

        <div className="flex gap-2 justify-end items-center">
          <Input
            placeholder="Cari jenis layanan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64 min-h-9 rounded-sm bg-white shadow-none"
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
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">
                    Memuat...
                  </TableCell>
                </TableRow>
              ) : table.getRowModel().rows?.length ? (
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
                    Tidak ada jenis layanan ditemukan.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {filteredData && filteredData.length > 0 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Menampilkan {filteredData.length} jenis layanan
            </p>
          </div>
        )}
              </div>
        </div>
    </>
  );
}
