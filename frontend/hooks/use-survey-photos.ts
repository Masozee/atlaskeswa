/**
 * React hooks for survey photos API
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export interface SurveyPhoto {
  id: number;
  survey: number;
  image: string;
  image_url: string;
  caption: string;
  uploaded_by: number | null;
  uploaded_by_name: string | null;
  uploaded_at: string;
}

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// Fetch photos for a survey
export function useSurveyPhotos(surveyId?: number) {
  return useQuery<PaginatedResponse<SurveyPhoto>>({
    queryKey: ['survey-photos', surveyId],
    queryFn: async () => {
      if (!surveyId) throw new Error('Survey ID is required');
      return apiClient.get<PaginatedResponse<SurveyPhoto>>('/surveys/photos/', { survey: surveyId });
    },
    enabled: !!surveyId,
  });
}

// Upload photo for a survey
export function useUploadSurveyPhoto() {
  const queryClient = useQueryClient();

  return useMutation<SurveyPhoto, Error, { surveyId: number; file: File; caption?: string }>({
    mutationFn: async ({ surveyId, file, caption }) => {
      const formData = new FormData();
      formData.append('survey', String(surveyId));
      formData.append('image', file);
      if (caption) {
        formData.append('caption', caption);
      }

      const response = await apiClient.fetchRaw('/surveys/photos/', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Upload failed with status ${response.status}`);
      }

      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['survey-photos', variables.surveyId] });
    },
  });
}

// Delete a survey photo
export function useDeleteSurveyPhoto() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { photoId: number; surveyId: number }>({
    mutationFn: async ({ photoId }) => {
      return apiClient.delete(`/surveys/photos/${photoId}/`);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['survey-photos', variables.surveyId] });
    },
  });
}
