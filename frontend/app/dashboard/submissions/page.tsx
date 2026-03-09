'use client';

import { useSurveys } from '@/hooks/use-surveys';
import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
  ColumnDef,
  SortingState,
  ColumnFiltersState,
} from '@tanstack/react-table'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { HugeiconsIcon } from "@hugeicons/react";
import { MoreHorizontalIcon, ViewIcon, Edit01Icon, Delete01Icon, Search01Icon, SortingZA01Icon, Copy01Icon } from "@hugeicons/core-free-icons";
import { SurveyListItem } from '@/lib/types/api'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from '@/components/ui/separator';

const getStatusBadge = (status: string) => {
  const variants: Record<string, "outline-muted" | "outline-info" | "outline-success" | "outline-danger"> = {
    DRAFT: "outline-muted",
    SUBMITTED: "outline-info",
    VERIFIED: "outline-success",
    REJECTED: "outline-danger",
  };
  return (
    <Badge variant={variants[status] || "outline-muted"}>
      {status}
    </Badge>
  );
};

const breadcrumbs = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Latest Submissions' },
];

export default function LatestSubmissionsPage() {
  const router = useRouter();
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])

  const { data, isLoading } = useSurveys({ ordering: '-created_at', page_size: 50 });

  const columns: ColumnDef<SurveyListItem>[] = [
    {
      accessorKey: "id",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            ID
            <HugeiconsIcon icon={SortingZA01Icon} size={16} className="ml-2" />
          </Button>
        )
      },
      cell: ({ row }) => <div className="font-medium">#{row.getValue("id")}</div>,
    },
    {
      accessorKey: "service_name",
      header: "Service Name",
      cell: ({ row }) => {
        return <div className="font-medium">{row.getValue("service_name") || 'N/A'}</div>
      },
    },
    {
      accessorKey: "survey_date",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Survey Date
            <HugeiconsIcon icon={SortingZA01Icon} size={16} className="ml-2" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const date = new Date(row.getValue("survey_date"))
        return <div>{date.toLocaleDateString()}</div>
      },
    },
    {
      accessorKey: "surveyor_name",
      header: "Surveyor",
      cell: ({ row }) => {
        return <div className="text-sm">{row.getValue("surveyor_name") || 'N/A'}</div>
      },
    },
    {
      accessorKey: "verification_status",
      header: "Status",
      cell: ({ row }) => getStatusBadge(row.getValue("verification_status")),
    },
    {
      accessorKey: "total_patients_served",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Patients
            <HugeiconsIcon icon={SortingZA01Icon} size={16} className="ml-2" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const patients = row.getValue("total_patients_served") as number
        return <div>{patients?.toLocaleString() || 0}</div>
      },
    },
    {
      accessorKey: "created_at",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Created At
            <HugeiconsIcon icon={SortingZA01Icon} size={16} className="ml-2" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const date = new Date(row.getValue("created_at"))
        return <div className="text-sm text-muted-foreground">{date.toLocaleString()}</div>
      },
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const survey = row.original

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <HugeiconsIcon icon={MoreHorizontalIcon} size={16} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => navigator.clipboard.writeText(survey.id.toString())}
              >
                <HugeiconsIcon icon={Copy01Icon} size={16} className="mr-2" />
                Copy survey ID
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push(`/dashboard/submissions/${survey.id}`)}>
                <HugeiconsIcon icon={ViewIcon} size={16} className="mr-2" />
                View details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push(`/dashboard/survey/${survey.id}`)}>
                <HugeiconsIcon icon={Edit01Icon} size={16} className="mr-2" />
                Edit survey
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive">
                <HugeiconsIcon icon={Delete01Icon} size={16} className="mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  const table = useReactTable({
    data: data?.results || [],
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnFilters,
    },
  })

  if (isLoading) {
    return (
      <>
        <PageHeader breadcrumbs={breadcrumbs} />
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <div className="h-16 w-16 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
            <p className="text-sm text-muted-foreground">Loading submissions...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader breadcrumbs={breadcrumbs} />

      <div className="flex flex-1 flex-col gap-4">

        <div className="px-8 pt-8">
          <h1 className="text-2xl font-bold">Latest Submissions</h1>
          <p className="text-muted-foreground">Recent survey submissions and data entries</p>
        </div>

        <Separator />

        <div className="flex flex-col gap-4 px-8 pb-8">

        {/* Filters */}
        <div className="flex gap-2 justify-between items-center">
          <div className="flex gap-2 items-center">
            <div className="flex items-center rounded-md border">
              <Select
                value={(table.getColumn("verification_status")?.getFilterValue() as string) ?? "all"}
                onValueChange={(value) =>
                  table.getColumn("verification_status")?.setFilterValue(value === "all" ? "" : value)
                }
              >
                <SelectTrigger className="w-44 border-0 focus:ring-0">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="SUBMITTED">Submitted</SelectItem>
                  <SelectItem value="VERIFIED">Verified</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-px h-5 bg-border" />
            <Select defaultValue="default">
              <SelectTrigger className="w-44">
                <HugeiconsIcon icon={SortingZA01Icon} size={16} />
                <SelectValue placeholder="Urutkan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Urutkan</SelectItem>
                <SelectItem value="created_at-desc">Terbaru</SelectItem>
                <SelectItem value="created_at-asc">Terlama</SelectItem>
                <SelectItem value="service_name-asc">Layanan A-Z</SelectItem>
                <SelectItem value="service_name-desc">Layanan Z-A</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="relative w-64">
            <HugeiconsIcon icon={Search01Icon} size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by service name..."
              value={(table.getColumn("service_name")?.getFilterValue() as string) ?? ""}
              onChange={(event) =>
                table.getColumn("service_name")?.setFilterValue(event.target.value)
              }
              className="pl-9"
            />
          </div>
        </div>

        <div className="rounded-lg border">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    {table.getHeaderGroups().map((headerGroup) => (
                      <tr key={headerGroup.id} className="border-b bg-muted/50">
                        {headerGroup.headers.map((header) => (
                          <th
                            key={header.id}
                            className="h-12 px-4 text-left align-middle font-medium text-muted-foreground"
                          >
                            {header.isPlaceholder
                              ? null
                              : flexRender(
                                  header.column.columnDef.header,
                                  header.getContext()
                                )}
                          </th>
                        ))}
                      </tr>
                    ))}
                  </thead>
                  <tbody>
                    {table.getRowModel().rows?.length ? (
                      table.getRowModel().rows.map((row) => (
                        <tr
                          key={row.id}
                          className="border-b transition-colors hover:bg-muted/50"
                        >
                          {row.getVisibleCells().map((cell) => (
                            <td key={cell.id} className="p-4 align-middle">
                              {flexRender(
                                cell.column.columnDef.cell,
                                cell.getContext()
                              )}
                            </td>
                          ))}
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={columns.length}
                          className="h-24 text-center text-muted-foreground"
                        >
                          No submissions found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

        {/* Pagination */}
        <div className="flex items-center justify-between space-x-2">
          <div className="text-sm text-muted-foreground">
            {table.getFilteredRowModel().rows.length} submission(s) total
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Previous
            </Button>
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
              </div>
        </div>
    </>
  );
}
