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
        size: 80,
        minSize: 80,
        maxSize: 80,
        cell: ({ row }) => (
          <div className="font-mono font-medium whitespace-nowrap">{row.getValue("code")}</div>
        ),
      },
      {
        accessorKey: "name",
        header: "Nama Layanan",
        size: 320,
        minSize: 320,
        maxSize: 320,
        cell: ({ row }) => (
          <div className="text-sm leading-snug break-words py-1.5 whitespace-normal">
            {row.getValue("name")}
          </div>
        ),
      },
      {
        accessorKey: "is_healthcare",
        header: "Tipe",
        size: 120,
        minSize: 120,
        maxSize: 120,
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
        size: 120,
        minSize: 120,
        maxSize: 120,
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
        size: 70,
        minSize: 70,
        maxSize: 70,
        cell: ({ row }) => (
          <div className="text-center">
            <Badge variant="secondary" className="whitespace-nowrap">{row.getValue("level")}</Badge>
          </div>
        ),
      },
      {
        accessorKey: "parent_code",
        header: "Induk",
        size: 70,
        minSize: 70,
        maxSize: 70,
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
        size: 60,
        minSize: 60,
        maxSize: 60,
        cell: ({ row }) => (
          <div className="text-center text-muted-foreground">
            {row.getValue("children_count")}
          </div>
        ),
      },
      {
        accessorKey: "is_active",
        header: "Status",
        size: 90,
        minSize: 90,
        maxSize: 90,
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
    columnResizeMode: 'onChange',
  });

  return (
    <>
      <PageHeader breadcrumbs={breadcrumbs} />

      <div className="flex flex-1 flex-col gap-3 p-6 pt-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight">DESDE-LTC Classification Codes</h1>
          <p className="text-sm text-muted-foreground">
            Comprehensive classification system for mental health and long-term care services
          </p>
        </div>

        <div className="flex gap-2 justify-between items-center">
          <Input
            placeholder="Search by code or name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64"
            aria-label="Search MTC codes"
          />

          <div className="flex gap-2">
            <Select value={healthcareFilter} onValueChange={setHealthcareFilter}>
              <SelectTrigger className="w-40 !h-9" aria-label="Filter by healthcare type">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="healthcare">Healthcare</SelectItem>
                <SelectItem value="non-healthcare">Non-Healthcare</SelectItem>
              </SelectContent>
            </Select>

            <Select value={deliveryTypeFilter} onValueChange={setDeliveryTypeFilter}>
              <SelectTrigger className="w-44 !h-9" aria-label="Filter by delivery mode">
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
          <Table style={{ tableLayout: 'fixed', width: '100%' }}>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      style={{ width: header.getSize() }}
                    >
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
                  <TableCell colSpan={columns.length} className="h-24 text-center" role="status" aria-live="polite">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell
                        key={cell.id}
                        style={{ width: cell.column.getSize() }}
                      >
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
            <p className="text-sm text-muted-foreground" role="status" aria-live="polite">
              Showing {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} to{' '}
              {Math.min(
                (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                filteredData.length
              )}{' '}
              of {filteredData.length} MTC code{filteredData.length !== 1 ? 's' : ''}
            </p>
            <div className="flex items-center gap-2" role="navigation" aria-label="Pagination">
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                aria-label="Go to previous page"
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground" aria-current="page">
                Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                aria-label="Go to next page"
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
