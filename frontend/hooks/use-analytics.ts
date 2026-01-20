/**
 * Analytics hooks using TanStack Query
 * Best practice: Use query key factory for consistency
 */

import { useQuery, queryOptions } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { DashboardStats, ServiceAnalytics, SurveyAnalytics } from '@/lib/types/api';
import { queryKeys } from '@/lib/query-keys';

/**
 * Query options for dashboard stats
 */
export const dashboardStatsQueryOptions = () =>
  queryOptions({
    queryKey: queryKeys.analytics.dashboard(),
    queryFn: () => apiClient.get<DashboardStats>('/analytics/dashboard/'),
    refetchInterval: 60000, // Refetch every minute for real-time dashboard
  });

/**
 * Query options for service analytics
 */
export const serviceAnalyticsQueryOptions = () =>
  queryOptions({
    queryKey: queryKeys.analytics.services(),
    queryFn: () => apiClient.get<ServiceAnalytics>('/analytics/services/'),
    staleTime: 5 * 60 * 1000, // Analytics can be stale for 5 minutes
  });

/**
 * Query options for survey analytics
 */
export const surveyAnalyticsQueryOptions = () =>
  queryOptions({
    queryKey: queryKeys.analytics.surveys(),
    queryFn: () => apiClient.get<SurveyAnalytics>('/analytics/surveys/'),
    staleTime: 5 * 60 * 1000,
  });

/**
 * Dashboard statistics hook
 */
export function useDashboardStats() {
  return useQuery(dashboardStatsQueryOptions());
}

/**
 * Service analytics hook
 */
export function useServiceAnalytics() {
  return useQuery(serviceAnalyticsQueryOptions());
}

/**
 * Survey analytics hook
 */
export function useSurveyAnalytics() {
  return useQuery(surveyAnalyticsQueryOptions());
}
