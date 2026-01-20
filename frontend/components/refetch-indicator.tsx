'use client';

/**
 * Background Refetch Indicator
 * Best practice: Show subtle indicator when data is being refreshed in background
 */

import { useIsFetching } from '@tanstack/react-query';
import { cn } from '@/lib/utils';

interface RefetchIndicatorProps {
  className?: string;
}

/**
 * Shows a subtle indicator when any queries are fetching in the background
 * Place this in your layout to indicate background data refreshing
 */
export function RefetchIndicator({ className }: RefetchIndicatorProps) {
  const isFetching = useIsFetching();

  if (!isFetching) return null;

  return (
    <div
      className={cn(
        'fixed top-0 left-0 right-0 z-50 h-0.5 bg-primary/20',
        className
      )}
    >
      <div className="h-full bg-primary animate-pulse" style={{ width: '100%' }} />
    </div>
  );
}

/**
 * Hook to check if specific queries are fetching
 * Best practice: Use to show inline loading states
 */
export function useIsRefetching(filters?: { queryKey?: readonly unknown[] }) {
  return useIsFetching(filters) > 0;
}
