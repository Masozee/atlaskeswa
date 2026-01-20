/**
 * Global Loading State
 * Best practice: Use loading.tsx for route-level Suspense boundaries
 */

export default function GlobalLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="h-12 w-12 rounded-full border-4 border-muted animate-spin border-t-primary" />
        </div>
        <p className="text-sm text-muted-foreground">Memuat...</p>
      </div>
    </div>
  );
}
