/**
 * Analytics hooks using TanStack Query
 */

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { DashboardStats, ServiceAnalytics, SurveyAnalytics } from '@/lib/types/api';

export function useDashboardStats() {
  return useQuery({
    queryKey: ['analytics', 'dashboard'],
    queryFn: () => apiClient.get<DashboardStats>('/analytics/dashboard/'),
    refetchInterval: 60000, // Refetch every minute
  });
}

export function useServiceAnalytics() {
  return useQuery({
    queryKey: ['analytics', 'services'],
    queryFn: () => apiClient.get<ServiceAnalytics>('/analytics/services/'),
  });
}

export function useSurveyAnalytics() {
  return useQuery({
    queryKey: ['analytics', 'surveys'],
    queryFn: () => apiClient.get<SurveyAnalytics>('/analytics/surveys/'),
  });
}
