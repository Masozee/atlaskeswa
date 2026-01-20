'use client';

/**
 * Dashboard Error Boundary
 * Best practice: Use error.tsx for route-level error handling
 */

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircleIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to error reporting service
    console.error('Dashboard error:', error);
  }, [error]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
      <div className="flex flex-col items-center gap-4 text-center max-w-md">
        <div className="rounded-full bg-destructive/10 p-4">
          <HugeiconsIcon
            icon={AlertCircleIcon}
            size={48}
            className="text-destructive"
          />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-bold">Terjadi Kesalahan</h2>
          <p className="text-muted-foreground">
            Maaf, terjadi kesalahan saat memuat halaman ini. Silakan coba lagi.
          </p>
          {error.digest && (
            <p className="text-xs text-muted-foreground font-mono">
              Error ID: {error.digest}
            </p>
          )}
        </div>

        <div className="flex gap-2">
          <Button onClick={reset}>Coba Lagi</Button>
          <Button variant="outline" onClick={() => window.location.href = '/dashboard'}>
            Kembali ke Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
