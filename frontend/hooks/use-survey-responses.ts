/**
 * React hooks for survey responses API
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type {
  SurveyResponse,
  SurveyResponseCreate,
  SurveyResponseUpdate,
} from '@/lib/types/survey-template';

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// Fetch all survey responses
export function useSurveyResponses(params?: Record<string, any>) {
  return useQuery<PaginatedResponse<SurveyResponse>>({
    queryKey: ['survey-responses', params],
    queryFn: async () => {
      return apiClient.get<PaginatedResponse<SurveyResponse>>('/surveys/responses/', params);
    },
  });
}

// Fetch single survey response
export function useSurveyResponse(id?: number) {
  return useQuery<SurveyResponse>({
    queryKey: ['survey-response', id],
    queryFn: async () => {
      if (!id) throw new Error('Survey response ID is required');
      return apiClient.get<SurveyResponse>(`/surveys/responses/${id}/`);
    },
    enabled: !!id,
  });
}

// Create survey response
export function useCreateSurveyResponse() {
  const queryClient = useQueryClient();

  return useMutation<SurveyResponse, Error, SurveyResponseCreate>({
    mutationFn: async (data) => {
      return apiClient.post<SurveyResponse>('/surveys/responses/', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['survey-responses'] });
    },
  });
}

// Update survey response
export function useUpdateSurveyResponse(id: number) {
  const queryClient = useQueryClient();

  return useMutation<SurveyResponse, Error, SurveyResponseUpdate>({
    mutationFn: async (data) => {
      return apiClient.patch<SurveyResponse>(`/surveys/responses/${id}/`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['survey-response', id] });
      queryClient.invalidateQueries({ queryKey: ['survey-responses'] });
    },
  });
}

// Save progress (draft mode)
export function useSaveProgress(id: number) {
  const queryClient = useQueryClient();

  return useMutation<SurveyResponse, Error, SurveyResponseUpdate>({
    mutationFn: async (data) => {
      return apiClient.post<SurveyResponse>(`/surveys/responses/${id}/save_progress/`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['survey-response', id] });
    },
  });
}

// Submit survey for verification
export function useSubmitSurvey(id: number) {
  const queryClient = useQueryClient();

  return useMutation<SurveyResponse, Error, void>({
    mutationFn: async () => {
      return apiClient.post<SurveyResponse>(`/surveys/responses/${id}/submit/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['survey-response', id] });
      queryClient.invalidateQueries({ queryKey: ['survey-responses'] });
    },
  });
}

// Verify or reject survey
export function useVerifySurvey(id: number) {
  const queryClient = useQueryClient();

  return useMutation<
    SurveyResponse,
    Error,
    { action: 'verify' | 'reject'; notes?: string; rejection_reason?: string }
  >({
    mutationFn: async (data) => {
      return apiClient.post<SurveyResponse>(`/surveys/responses/${id}/verify/`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['survey-response', id] });
      queryClient.invalidateQueries({ queryKey: ['survey-responses'] });
    },
  });
}
