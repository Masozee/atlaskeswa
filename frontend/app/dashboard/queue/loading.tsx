/**
 * Verification Queue Loading State
 */

import { Skeleton } from "@/components/ui/skeleton";

export default function QueueLoading() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      {/* Page Header */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-80" />
      </div>

      {/* Filters */}
      <div className="flex gap-2 justify-between items-center">
        <Skeleton className="h-9 w-64" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-40" />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border">
        <div className="p-4 space-y-4">
          <div className="flex gap-4">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-4 flex-1" />
            ))}
          </div>
          {[...Array(8)].map((_, i) => (
            <div key={i} className="flex gap-4">
              {[...Array(6)].map((_, j) => (
                <Skeleton key={j} className="h-10 flex-1" />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-48" />
      </div>
    </div>
  );
}
