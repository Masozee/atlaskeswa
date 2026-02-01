"use client";

import { useMemo, useState } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  SortingState,
  PaginationState,
  useReactTable,
} from "@tanstack/react-table";
import { useMainTypesOfCare } from "@/hooks/use-services";
import { MainTypeOfCare } from "@/lib/types/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const breadcrumbs = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Layanan', href: '/dashboard/services' },
  { label: 'Klasifikasi DESDE-LTC' },
];

export default function MTCPage() {
  const { data: mtcData, isLoading } = useMainTypesOfCare();
  const [search, setSearch] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 15,
  });
  const [healthcareFilter, setHealthcareFilter] = useState<string>("all");
  const [deliveryTypeFilter, setDeliveryTypeFilter] = useState<string>("all");

  const columns = useMemo<ColumnDef<MainTypeOfCare, any>[]>(
    () => [
      {
        accessorKey: "code",
        header: "Kode",
        cell: ({ row }) => (
          <div className="font-mono font-medium whitespace-nowrap">{row.getValue("code")}</div>
        ),
      },
      {
        accessorKey: "name",
        header: "Nama Layanan",
        cell: ({ row }) => (
          <div className="max-w-[400px] text-sm leading-relaxed break-words py-2">
            {row.getValue("name")}
          </div>
        ),
      },
      {
        accessorKey: "is_healthcare",
        header: "Tipe",
        cell: ({ row }) => {
          const isHealthcare = row.getValue("is_healthcare");
          return (
            <Badge variant={isHealthcare ? "default" : "outline"} className="whitespace-nowrap">
              {isHealthcare ? "Kesehatan" : "Non-Kesehatan"}
            </Badge>
          );
        },
      },
      {
        accessorKey: "service_delivery_type",
        header: "Mode Layanan",
        cell: ({ row }) => {
          const type = row.getValue("service_delivery_type") as string;
          const typeLabels: Record<string, string> = {
            RESIDENTIAL: "Rawat Inap",
            DAY_CARE: "Harian",
            OUTPATIENT: "Rawat Jalan",
            ACCESSIBILITY: "Aksesibilitas",
            INFORMATION: "Informasi",
          };
          return (
            <span className="text-sm text-muted-foreground whitespace-nowrap">
              {type ? typeLabels[type] : "-"}
            </span>
          );
        },
      },
      {
        accessorKey: "level",
        header: "Tingkat",
        cell: ({ row }) => (
          <div className="text-center">
            <Badge variant="secondary" className="whitespace-nowrap">{row.getValue("level")}</Badge>
          </div>
        ),
      },
      {
        accessorKey: "parent_code",
        header: "Induk",
        cell: ({ row }) => {
          const parentCode = row.getValue("parent_code") as string;
          return (
            <span className="font-mono text-sm text-muted-foreground whitespace-nowrap">
              {parentCode || "-"}
            </span>
          );
        },
      },
      {
        accessorKey: "children_count",
        header: "Anak",
        cell: ({ row }) => (
          <div className="text-center text-muted-foreground">
            {row.getValue("children_count")}
          </div>
        ),
      },
      {
        accessorKey: "is_active",
        header: "Status",
        cell: ({ row }) => {
          const isActive = row.getValue("is_active");
          return (
            <Badge variant={isActive ? "default" : "secondary"}>
              {isActive ? "Active" : "Inactive"}
            </Badge>
          );
        },
      },
    ],
    []
  );

  // Filter data based on search and filters
  const filteredData = useMemo(() => {
    if (!mtcData) return [];

    let filtered = mtcData;

    // Search filter
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.code.toLowerCase().includes(searchLower) ||
          item.name.toLowerCase().includes(searchLower) ||
          (item.description && item.description.toLowerCase().includes(searchLower))
      );
    }

    // Healthcare type filter
    if (healthcareFilter !== "all") {
      const isHealthcare = healthcareFilter === "healthcare";
      filtered = filtered.filter((item) => item.is_healthcare === isHealthcare);
    }

    // Delivery type filter
    if (deliveryTypeFilter !== "all") {
      filtered = filtered.filter((item) => item.service_delivery_type === deliveryTypeFilter);
    }

    return filtered;
  }, [mtcData, search, healthcareFilter, deliveryTypeFilter]);

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    state: {
      sorting,
      pagination,
    },
  });

  return (
    <>
      <PageHeader breadcrumbs={breadcrumbs} />

      <div className="flex flex-1 flex-col gap-4 p-8 pt-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">DESDE-LTC Classification Codes</h1>
          <p className="text-muted-foreground">
            Comprehensive classification system for mental health and long-term care services
          </p>
        </div>

        <div className="flex gap-2 justify-between items-center">
          <Input
            placeholder="Search by code or name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64"
          />

          <div className="flex gap-2">
            <Select value={healthcareFilter} onValueChange={setHealthcareFilter}>
              <SelectTrigger className="w-40 !h-9">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="healthcare">Healthcare</SelectItem>
                <SelectItem value="non-healthcare">Non-Healthcare</SelectItem>
              </SelectContent>
            </Select>

            <Select value={deliveryTypeFilter} onValueChange={setDeliveryTypeFilter}>
              <SelectTrigger className="w-44 !h-9">
                <SelectValue placeholder="Delivery Mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Modes</SelectItem>
                <SelectItem value="RESIDENTIAL">Residential</SelectItem>
                <SelectItem value="DAY_CARE">Day Care</SelectItem>
                <SelectItem value="OUTPATIENT">Outpatient</SelectItem>
                <SelectItem value="ACCESSIBILITY">Accessibility</SelectItem>
                <SelectItem value="INFORMATION">Information</SelectItem>
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
                    No MTC codes found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {filteredData && filteredData.length > 0 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} to{' '}
              {Math.min(
                (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                filteredData.length
              )}{' '}
              of {filteredData.length} MTC code{filteredData.length !== 1 ? 's' : ''}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
