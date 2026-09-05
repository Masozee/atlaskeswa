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

// Delete survey response (soft delete — moves it to the trash bin)
export function useDeleteSurveyResponse() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, number>({
    mutationFn: async (id) => {
      return apiClient.delete(`/surveys/responses/${id}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['survey-responses'] });
      queryClient.invalidateQueries({ queryKey: ['trashed-survey-responses'] });
    },
  });
}

// Bulk delete survey responses (soft delete — moves them to the trash bin)
export function useBulkDeleteSurveyResponses() {
  const queryClient = useQueryClient();

  return useMutation<{ deleted: number }, Error, number[]>({
    mutationFn: async (ids) => {
      return apiClient.post<{ deleted: number }>('/surveys/responses/bulk-delete/', { ids });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['survey-responses'] });
      queryClient.invalidateQueries({ queryKey: ['trashed-survey-responses'] });
    },
  });
}

// Fetch trashed (soft-deleted) survey responses — ADMIN only
export function useTrashedSurveyResponses(params?: Record<string, any>) {
  return useQuery<PaginatedResponse<SurveyResponse>>({
    queryKey: ['trashed-survey-responses', params],
    queryFn: async () => {
      return apiClient.get<PaginatedResponse<SurveyResponse>>('/surveys/responses/trash/', params);
    },
  });
}

// Restore a single survey response from the trash bin — ADMIN only
export function useRestoreSurveyResponse() {
  const queryClient = useQueryClient();

  return useMutation<SurveyResponse, Error, number>({
    mutationFn: async (id) => {
      return apiClient.post<SurveyResponse>(`/surveys/responses/${id}/restore/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trashed-survey-responses'] });
      queryClient.invalidateQueries({ queryKey: ['survey-responses'] });
    },
  });
}

// Restore multiple survey responses from the trash bin — ADMIN only
export function useBulkRestoreSurveyResponses() {
  const queryClient = useQueryClient();

  return useMutation<{ restored: number }, Error, number[]>({
    mutationFn: async (ids) => {
      return apiClient.post<{ restored: number }>('/surveys/responses/bulk-restore/', { ids });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trashed-survey-responses'] });
      queryClient.invalidateQueries({ queryKey: ['survey-responses'] });
    },
  });
}

// Surveyor requests deletion — needs verifier/admin approval
export function useRequestDeletion() {
  const queryClient = useQueryClient();

  return useMutation<SurveyResponse, Error, { id: number; reason?: string }>({
    mutationFn: async ({ id, reason }) => {
      return apiClient.post<SurveyResponse>(`/surveys/responses/${id}/request-deletion/`, {
        reason: reason ?? '',
      });
    },
    onSuccess: (_data, { id }) => {
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

// Approve or reject deletion request
export function useApproveDeletion() {
  const queryClient = useQueryClient();

  return useMutation<
    any,
    Error,
    { id: number; action: 'approve' | 'reject' }
  >({
    mutationFn: async ({ id, action }) => {
      return apiClient.post(`/surveys/responses/${id}/approve-deletion/`, { action });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['survey-responses'] });
      queryClient.invalidateQueries({ queryKey: ['trashed-survey-responses'] });
    },
  });
}

/**
 * A survey reduced to a map point — GET /surveys/responses/map/.
 * Public endpoint: works without a token, so the landing-page map can use it.
 */
export interface SurveyMapPoint {
  id: number;
  /** DecimalField, so DRF serializes these as strings. */
  latitude: string;
  longitude: string;
  name: string | null;
  kecamatan: string | null;
  desa: string | null;
  kategori: 'FASKES' | 'NON FASKES' | null;
  jenis_fasilitas: string | null;
  jenis_layanan: string | null;
  kode_desde_ltc: string[] | null;
  thumbnail: string | null;
  survey_date: string;
  verification_status: 'DRAFT' | 'SUBMITTED' | 'VERIFIED' | 'REJECTED';
  status_display: string;
  service: number | null;
  service_name: string | null;
}

// Fetch every surveyed location for map display
export function useSurveyMapPoints() {
  return useQuery<SurveyMapPoint[]>({
    queryKey: ['survey-map-points'],
    queryFn: async () => apiClient.get<SurveyMapPoint[]>('/surveys/responses/map/'),
    staleTime: 5 * 60 * 1000, // locations move rarely; keep the landing page snappy
  });
}

/** A photo attached to a surveyed location, uploader withheld. */
export interface SurveyLocationPhoto {
  id: number;
  image_url: string | null;
  caption: string;
}

/**
 * The public profile of one surveyed location —
 * GET /surveys/responses/:id/public/. Drafts 404.
 */
export interface SurveyLocationDetail extends SurveyMapPoint {
  status_badan_hukum: string | null;
  service_city: string | null;
  photos: SurveyLocationPhoto[];
}

export function useSurveyLocation(id?: number) {
  return useQuery<SurveyLocationDetail>({
    queryKey: ['survey-location', id],
    queryFn: async () => {
      if (!id) throw new Error('Survey location ID is required');
      return apiClient.get<SurveyLocationDetail>(`/surveys/responses/${id}/public/`);
    },
    enabled: !!id,
    retry: false, // a 404 means the location is not public; do not hammer it
  });
}
