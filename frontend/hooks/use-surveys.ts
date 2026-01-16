/**
 * Survey hooks using TanStack Query
 */

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { Survey, SurveyListItem, SurveyCreateData, PaginatedResponse } from '@/lib/types/api';

export function useSurveys(params?: Record<string, any>) {
  // Filter out undefined values to prevent sending "undefined" as string
  const cleanParams = params
    ? Object.fromEntries(Object.entries(params).filter(([_, v]) => v !== undefined))
    : undefined;

  return useQuery({
    queryKey: ['surveys', cleanParams],
    queryFn: () =>
      apiClient.get<PaginatedResponse<SurveyListItem>>('/surveys/surveys/', cleanParams),
  });
}

export function useInfiniteSurveys(params?: Record<string, any>) {
  return useInfiniteQuery({
    queryKey: ['surveys', 'infinite', params],
    queryFn: ({ pageParam }) =>
      apiClient.get<PaginatedResponse<SurveyListItem>>('/surveys/surveys/', {
        ...params,
        page: pageParam,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.next ? allPages.length + 1 : undefined,
  });
}

export function useSurvey(id: number) {
  return useQuery({
    queryKey: ['surveys', id],
    queryFn: () => apiClient.get<Survey>(`/surveys/surveys/${id}/`),
    enabled: !!id,
  });
}

export function useCreateSurvey() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SurveyCreateData) =>
      apiClient.post<Survey>('/surveys/surveys/', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['surveys'] });
    },
  });
}

export function useUpdateSurvey(id: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<Survey>) =>
      apiClient.patch<Survey>(`/surveys/surveys/${id}/`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['surveys', id] });
      queryClient.invalidateQueries({ queryKey: ['surveys'] });
    },
  });
}

export function useDeleteSurvey() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) =>
      apiClient.delete(`/surveys/surveys/${id}/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['surveys'] });
    },
  });
}

export function useSubmitSurvey(id: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data?: { assigned_verifier?: number }) =>
      apiClient.post<Survey>(`/surveys/surveys/${id}/submit/`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['surveys', id] });
      queryClient.invalidateQueries({ queryKey: ['surveys'] });
    },
  });
}

export function useVerifySurvey(id: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { action: 'verify' | 'reject'; notes?: string; rejection_reason?: string }) =>
      apiClient.post<Survey>(`/surveys/surveys/${id}/verify/`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['surveys', id] });
      queryClient.invalidateQueries({ queryKey: ['surveys'] });
    },
  });
}

export function useSurveyStats() {
  return useQuery({
    queryKey: ['surveys', 'stats'],
    queryFn: () => apiClient.get('/surveys/surveys/stats/'),
  });
}

export function useSurveyAttachments(surveyId: number) {
  return useQuery({
    queryKey: ['surveys', surveyId, 'attachments'],
    queryFn: () => apiClient.get(`/surveys/surveys/${surveyId}/attachments/`),
    enabled: !!surveyId,
  });
}

export function useSurveyAuditLogs(surveyId: number) {
  return useQuery({
    queryKey: ['surveys', surveyId, 'audit-logs'],
    queryFn: () => apiClient.get(`/surveys/surveys/${surveyId}/audit_logs/`),
    enabled: !!surveyId,
  });
}
