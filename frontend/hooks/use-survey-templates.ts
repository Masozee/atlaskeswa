/**
 * React hooks for survey templates API
 */
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { SurveyTemplate, Question, QuestionSection, SurveyAnswers } from '@/lib/types/survey-template';

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// Fetch all templates
export function useSurveyTemplates() {
  return useQuery<SurveyTemplate[]>({
    queryKey: ['survey-templates'],
    queryFn: async () => {
      const data = await apiClient.get<PaginatedResponse<SurveyTemplate> | SurveyTemplate[]>('/surveys/templates/');
      // Handle paginated response - extract results array
      return Array.isArray(data) ? data : data.results;
    },
  });
}

// Fetch single template with all sections and questions
export function useSurveyTemplate(id?: number) {
  return useQuery<SurveyTemplate>({
    queryKey: ['survey-template', id],
    queryFn: async () => {
      if (!id) throw new Error('Template ID is required');
      return apiClient.get<SurveyTemplate>(`/surveys/templates/${id}/`);
    },
    enabled: !!id,
  });
}

// Fetch active questions based on current answers (conditional logic)
export function useActiveQuestions(templateId?: number, currentAnswers?: SurveyAnswers) {
  return useQuery<Question[]>({
    queryKey: ['survey-template', templateId, 'active-questions', currentAnswers],
    queryFn: async () => {
      if (!templateId) throw new Error('Template ID is required');
      const answersParam = currentAnswers ? JSON.stringify(currentAnswers) : '{}';
      return apiClient.get<Question[]>(
        `/surveys/templates/${templateId}/active_questions/`,
        { answers: answersParam }
      );
    },
    enabled: !!templateId,
  });
}

// Fetch active sections based on current answers (conditional logic)
export function useActiveSections(templateId?: number, currentAnswers?: SurveyAnswers) {
  return useQuery<QuestionSection[]>({
    queryKey: ['survey-template', templateId, 'active-sections', currentAnswers],
    queryFn: async () => {
      if (!templateId) throw new Error('Template ID is required');
      const answersParam = currentAnswers ? JSON.stringify(currentAnswers) : '{}';
      return apiClient.get<QuestionSection[]>(
        `/surveys/templates/${templateId}/active_sections/`,
        { answers: answersParam }
      );
    },
    enabled: !!templateId,
  });
}
