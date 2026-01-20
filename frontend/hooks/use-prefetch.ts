/**
 * Prefetch hook for TanStack Query
 * Best practice: Prefetch on hover/focus for instant navigation
 */

import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  prefetchDashboard,
  prefetchSurveys,
  prefetchSurvey,
  prefetchServices,
  prefetchService,
  prefetchClassifications,
} from '@/lib/prefetch';

/**
 * Hook to prefetch data on demand
 * Usage:
 * const { prefetchDashboard, prefetchSurvey } = usePrefetch();
 *
 * <Link
 *   href="/dashboard"
 *   onMouseEnter={prefetchDashboard}
 *   onFocus={prefetchDashboard}
 * >
 *   Dashboard
 * </Link>
 */
export function usePrefetch() {
  const queryClient = useQueryClient();

  const prefetchDashboardData = useCallback(() => {
    prefetchDashboard(queryClient);
  }, [queryClient]);

  const prefetchSurveysData = useCallback(
    (params?: Record<string, unknown>) => {
      prefetchSurveys(queryClient, params);
    },
    [queryClient]
  );

  const prefetchSurveyData = useCallback(
    (id: number) => {
      prefetchSurvey(queryClient, id);
    },
    [queryClient]
  );

  const prefetchServicesData = useCallback(
    (params?: Record<string, unknown>) => {
      prefetchServices(queryClient, params);
    },
    [queryClient]
  );

  const prefetchServiceData = useCallback(
    (id: number) => {
      prefetchService(queryClient, id);
    },
    [queryClient]
  );

  const prefetchClassificationsData = useCallback(() => {
    prefetchClassifications(queryClient);
  }, [queryClient]);

  return {
    prefetchDashboard: prefetchDashboardData,
    prefetchSurveys: prefetchSurveysData,
    prefetchSurvey: prefetchSurveyData,
    prefetchServices: prefetchServicesData,
    prefetchService: prefetchServiceData,
    prefetchClassifications: prefetchClassificationsData,
  };
}
