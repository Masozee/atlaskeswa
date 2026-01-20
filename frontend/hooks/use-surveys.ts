/**
 * Survey hooks using TanStack Query
 * Best practice: Use query key factory and queryOptions for type-safety
 */

import { useQuery, useMutation, useQueryClient, useInfiniteQuery, queryOptions } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { Survey, SurveyListItem, SurveyCreateData, PaginatedResponse } from '@/lib/types/api';
import { queryKeys } from '@/lib/query-keys';

/**
 * Helper to clean params (remove undefined/null values)
 */
function cleanParams(params?: Record<string, unknown>) {
  if (!params) return undefined;
  return Object.fromEntries(
    Object.entries(params).filter(([_, v]) => v !== undefined && v !== null && v !== '')
  );
}

/**
 * Query options for surveys list
 * Best practice: Export queryOptions for prefetching and SSR
 */
export const surveysQueryOptions = (params?: Record<string, unknown>) =>
  queryOptions({
    queryKey: queryKeys.surveys.list(cleanParams(params)),
    queryFn: () =>
      apiClient.get<PaginatedResponse<SurveyListItem>>('/surveys/surveys/', cleanParams(params)),
  });

/**
 * Query options for single survey
 */
export const surveyQueryOptions = (id: number) =>
  queryOptions({
    queryKey: queryKeys.surveys.detail(id),
    queryFn: () => apiClient.get<Survey>(`/surveys/surveys/${id}/`),
    enabled: !!id,
  });

/**
 * Query options for survey stats
 */
export const surveyStatsQueryOptions = () =>
  queryOptions({
    queryKey: queryKeys.surveys.stats(),
    queryFn: () => apiClient.get('/surveys/surveys/stats/'),
  });

/**
 * List surveys with optional filters
 */
export function useSurveys(params?: Record<string, unknown>) {
  return useQuery(surveysQueryOptions(params));
}

/**
 * Infinite scroll surveys
 * Best practice: Use for paginated lists with load more
 */
export function useInfiniteSurveys(params?: Record<string, unknown>) {
  return useInfiniteQuery({
    queryKey: queryKeys.surveys.infinite(cleanParams(params)),
    queryFn: ({ pageParam }) =>
      apiClient.get<PaginatedResponse<SurveyListItem>>('/surveys/surveys/', {
        ...cleanParams(params),
        page: pageParam,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.next ? allPages.length + 1 : undefined,
  });
}

/**
 * Get single survey by ID
 */
export function useSurvey(id: number) {
  return useQuery(surveyQueryOptions(id));
}

/**
 * Create survey mutation
 * Best practice: Invalidate list queries on success
 */
export function useCreateSurvey() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SurveyCreateData) =>
      apiClient.post<Survey>('/surveys/surveys/', data),
    onSuccess: () => {
      // Invalidate all survey lists
      queryClient.invalidateQueries({ queryKey: queryKeys.surveys.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.surveys.stats() });
    },
  });
}

/**
 * Update survey mutation
 * Best practice: Optimistic update for better UX
 */
export function useUpdateSurvey(id: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<Survey>) =>
      apiClient.patch<Survey>(`/surveys/surveys/${id}/`, data),
    // Optimistic update
    onMutate: async (newData) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.surveys.detail(id) });

      // Snapshot previous value
      const previousSurvey = queryClient.getQueryData<Survey>(queryKeys.surveys.detail(id));

      // Optimistically update
      if (previousSurvey) {
        queryClient.setQueryData<Survey>(queryKeys.surveys.detail(id), {
          ...previousSurvey,
          ...newData,
        });
      }

      return { previousSurvey };
    },
    onError: (_err, _newData, context) => {
      // Rollback on error
      if (context?.previousSurvey) {
        queryClient.setQueryData(queryKeys.surveys.detail(id), context.previousSurvey);
      }
    },
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: queryKeys.surveys.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.surveys.lists() });
    },
  });
}

/**
 * Delete survey mutation
 */
export function useDeleteSurvey() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) =>
      apiClient.delete(`/surveys/surveys/${id}/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.surveys.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.surveys.stats() });
    },
  });
}

/**
 * Submit survey for verification
 */
export function useSubmitSurvey(id: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data?: { assigned_verifier?: number }) =>
      apiClient.post<Survey>(`/surveys/surveys/${id}/submit/`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.surveys.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.surveys.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.surveys.stats() });
    },
  });
}

/**
 * Verify or reject survey
 */
export function useVerifySurvey(id: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { action: 'verify' | 'reject'; notes?: string; rejection_reason?: string }) =>
      apiClient.post<Survey>(`/surveys/surveys/${id}/verify/`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.surveys.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.surveys.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.surveys.stats() });
    },
  });
}

/**
 * Survey statistics
 */
export function useSurveyStats() {
  return useQuery(surveyStatsQueryOptions());
}

/**
 * Survey attachments
 */
export function useSurveyAttachments(surveyId: number) {
  return useQuery({
    queryKey: queryKeys.surveys.attachments(surveyId),
    queryFn: () => apiClient.get(`/surveys/surveys/${surveyId}/attachments/`),
    enabled: !!surveyId,
  });
}

/**
 * Survey audit logs
 */
export function useSurveyAuditLogs(surveyId: number) {
  return useQuery({
    queryKey: queryKeys.surveys.auditLogs(surveyId),
    queryFn: () => apiClient.get(`/surveys/surveys/${surveyId}/audit_logs/`),
    enabled: !!surveyId,
  });
}
