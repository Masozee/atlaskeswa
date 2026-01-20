/**
 * Prefetch utilities for TanStack Query
 * Best practice: Prefetch data before navigation for instant loading
 */

import { QueryClient } from '@tanstack/react-query';
import { queryKeys } from './query-keys';
import { apiClient } from './api-client';
import type { PaginatedResponse, SurveyListItem, ServiceListItem, DashboardStats } from './types/api';

/**
 * Create a shared QueryClient for prefetching
 * Note: This should be used server-side or in a provider
 */
let prefetchClient: QueryClient | null = null;

export function getPrefetchClient(): QueryClient {
  if (!prefetchClient) {
    prefetchClient = new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 60 * 1000,
        },
      },
    });
  }
  return prefetchClient;
}

/**
 * Prefetch dashboard data
 * Use on dashboard link hover or before navigation
 */
export async function prefetchDashboard(queryClient: QueryClient) {
  await queryClient.prefetchQuery({
    queryKey: queryKeys.analytics.dashboard(),
    queryFn: () => apiClient.get<DashboardStats>('/analytics/dashboard/'),
    staleTime: 60 * 1000,
  });
}

/**
 * Prefetch surveys list
 */
export async function prefetchSurveys(
  queryClient: QueryClient,
  params?: Record<string, unknown>
) {
  await queryClient.prefetchQuery({
    queryKey: queryKeys.surveys.list(params),
    queryFn: () =>
      apiClient.get<PaginatedResponse<SurveyListItem>>('/surveys/surveys/', params),
    staleTime: 60 * 1000,
  });
}

/**
 * Prefetch single survey
 */
export async function prefetchSurvey(queryClient: QueryClient, id: number) {
  await queryClient.prefetchQuery({
    queryKey: queryKeys.surveys.detail(id),
    queryFn: () => apiClient.get(`/surveys/surveys/${id}/`),
    staleTime: 60 * 1000,
  });
}

/**
 * Prefetch services list
 */
export async function prefetchServices(
  queryClient: QueryClient,
  params?: Record<string, unknown>
) {
  await queryClient.prefetchQuery({
    queryKey: queryKeys.services.list(params),
    queryFn: () =>
      apiClient.get<PaginatedResponse<ServiceListItem>>('/directory/services/', params),
    staleTime: 60 * 1000,
  });
}

/**
 * Prefetch single service
 */
export async function prefetchService(queryClient: QueryClient, id: number) {
  await queryClient.prefetchQuery({
    queryKey: queryKeys.services.detail(id),
    queryFn: () => apiClient.get(`/directory/services/${id}/`),
    staleTime: 60 * 1000,
  });
}

/**
 * Prefetch classification data (MTC, BSIC, etc.)
 * These rarely change, so prefetch with longer stale time
 */
export async function prefetchClassifications(queryClient: QueryClient) {
  const staleTime = 30 * 60 * 1000; // 30 minutes

  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: queryKeys.mtc.list(),
      queryFn: () => apiClient.get('/directory/mtc/'),
      staleTime,
    }),
    queryClient.prefetchQuery({
      queryKey: queryKeys.bsic.list(),
      queryFn: () => apiClient.get('/directory/bsic/'),
      staleTime,
    }),
    queryClient.prefetchQuery({
      queryKey: queryKeys.targetPopulations.list(),
      queryFn: () => apiClient.get('/directory/target-populations/'),
      staleTime,
    }),
    queryClient.prefetchQuery({
      queryKey: queryKeys.serviceTypes.list(),
      queryFn: () => apiClient.get('/directory/service-types/'),
      staleTime,
    }),
  ]);
}
