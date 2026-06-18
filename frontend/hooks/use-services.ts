/**
 * Service directory hooks using TanStack Query
 * Best practice: Use query key factory and queryOptions for type-safety
 */

import { useQuery, useMutation, useQueryClient, useInfiniteQuery, queryOptions } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import {
  Service,
  ServiceListItem,
  PaginatedResponse,
  MainTypeOfCare,
  BasicStableInputsOfCare,
  TargetPopulation,
  ServiceType,
  KategoriLayanan,
  KategoriFasilitas,
  Question,
  QuestionChoice,
} from '@/lib/types/api';
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

// ============================================
// Query Options (exportable for prefetching)
// ============================================

/**
 * Query options for services list
 */
export const servicesQueryOptions = (params?: Record<string, unknown>) =>
  queryOptions({
    queryKey: queryKeys.services.list(cleanParams(params)),
    queryFn: () =>
      apiClient.get<PaginatedResponse<ServiceListItem>>('/directory/services/', cleanParams(params)),
  });

/**
 * Query options for single service
 */
export const serviceQueryOptions = (id: number) =>
  queryOptions({
    queryKey: queryKeys.services.detail(id),
    queryFn: () => apiClient.get<Service>(`/directory/services/${id}/`),
    enabled: !!id,
  });

/**
 * Query options for service stats
 */
export const serviceStatsQueryOptions = () =>
  queryOptions({
    queryKey: queryKeys.services.stats(),
    queryFn: () => apiClient.get('/directory/services/stats/'),
  });

/**
 * Query options for services map data
 */
export const servicesMapQueryOptions = () =>
  queryOptions({
    queryKey: queryKeys.services.map(),
    queryFn: () => apiClient.get<ServiceListItem[]>('/directory/services/map/'),
    staleTime: 5 * 60 * 1000, // Map data can be stale for 5 minutes
  });

/**
 * Query options for MTC list
 */
export const mtcQueryOptions = () =>
  queryOptions({
    queryKey: queryKeys.mtc.list(),
    queryFn: async () => {
      const response = await apiClient.get<PaginatedResponse<MainTypeOfCare>>('/directory/mtc/');
      return response.results;
    },
    staleTime: 30 * 60 * 1000, // Static data, can be stale for 30 minutes
  });

/**
 * Query options for MTC tree
 */
export const mtcTreeQueryOptions = () =>
  queryOptions({
    queryKey: queryKeys.mtc.tree(),
    queryFn: async () => {
      const response = await apiClient.get<PaginatedResponse<MainTypeOfCare>>('/directory/mtc/tree/');
      return response.results;
    },
    staleTime: 30 * 60 * 1000,
  });

/**
 * Query options for BSIC list
 */
export const bsicQueryOptions = () =>
  queryOptions({
    queryKey: queryKeys.bsic.list(),
    queryFn: () => apiClient.get<BasicStableInputsOfCare[]>('/directory/bsic/'),
    staleTime: 30 * 60 * 1000,
  });

/**
 * Query options for target populations
 */
export const targetPopulationsQueryOptions = () =>
  queryOptions({
    queryKey: queryKeys.targetPopulations.list(),
    queryFn: () => apiClient.get<TargetPopulation[]>('/directory/target-populations/'),
    staleTime: 30 * 60 * 1000,
  });

/**
 * Query options for service types
 */
export const serviceTypesQueryOptions = () =>
  queryOptions({
    queryKey: queryKeys.serviceTypes.list(),
    queryFn: () => apiClient.get<ServiceType[]>('/directory/service-types/'),
    staleTime: 30 * 60 * 1000,
  });

// ============================================
// Hooks
// ============================================

/**
 * List services with optional filters
 */
export function useServices(params?: Record<string, unknown>) {
  return useQuery(servicesQueryOptions(params));
}

/**
 * Infinite scroll services
 */
export function useInfiniteServices(params?: Record<string, unknown>) {
  return useInfiniteQuery({
    queryKey: queryKeys.services.infinite(cleanParams(params)),
    queryFn: ({ pageParam }) =>
      apiClient.get<PaginatedResponse<ServiceListItem>>('/directory/services/', {
        ...cleanParams(params),
        page: pageParam,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.next ? allPages.length + 1 : undefined,
  });
}

/**
 * Get single service by ID
 */
export function useService(id: number) {
  return useQuery(serviceQueryOptions(id));
}

/**
 * Create service mutation
 */
export function useCreateService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<Service>) =>
      apiClient.post<Service>('/directory/services/', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.services.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.services.stats() });
      queryClient.invalidateQueries({ queryKey: queryKeys.services.map() });
    },
  });
}

/**
 * Update service mutation with optimistic update
 */
export function useUpdateService(id: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<Service>) =>
      apiClient.patch<Service>(`/directory/services/${id}/`, data),
    // Optimistic update
    onMutate: async (newData) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.services.detail(id) });

      const previousService = queryClient.getQueryData<Service>(queryKeys.services.detail(id));

      if (previousService) {
        queryClient.setQueryData<Service>(queryKeys.services.detail(id), {
          ...previousService,
          ...newData,
        });
      }

      return { previousService };
    },
    onError: (_err, _newData, context) => {
      if (context?.previousService) {
        queryClient.setQueryData(queryKeys.services.detail(id), context.previousService);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.services.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.services.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.services.map() });
    },
  });
}

/**
 * Delete service mutation
 */
export function useDeleteService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) =>
      apiClient.delete(`/directory/services/${id}/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.services.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.services.stats() });
      queryClient.invalidateQueries({ queryKey: queryKeys.services.map() });
    },
  });
}

export interface ServiceImportResult {
  created: number;
  updated: number;
  errors: { row: number; error: string }[];
}

export async function exportServices(ids?: number[], format: 'csv' | 'xlsx' | 'json' = 'csv') {
  const searchParams = new URLSearchParams({ file_format: format });
  if (ids && ids.length > 0) searchParams.set('ids', ids.join(','));
  const token = apiClient.getAccessToken();
  const response = await apiClient.fetchRaw(`/directory/services/export/?${searchParams}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Export failed (${response.status}): ${errorText}`);
  }
  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = objectUrl;
  a.download = `services.${format}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(objectUrl);
}

export function useImportServices() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ file, updateExisting = false }: { file: File; updateExisting?: boolean }): Promise<ServiceImportResult> => {
      const token = apiClient.getAccessToken();
      const formData = new FormData();
      formData.append('file', file);
      formData.append('update_existing', updateExisting ? 'true' : 'false');
      const response = await apiClient.fetchRaw('/directory/services/import/', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || `Upload failed (${response.status})`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.services.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.services.stats() });
      queryClient.invalidateQueries({ queryKey: queryKeys.services.map() });
    },
  });
}

/**
 * Service statistics
 */
export function useServiceStats() {
  return useQuery(serviceStatsQueryOptions());
}

/**
 * Services for map display
 */
export function useServicesMap() {
  return useQuery(servicesMapQueryOptions());
}

// ============================================
// Classification Hooks
// ============================================

/**
 * Main Types of Care (MTC)
 */
export function useMainTypesOfCare() {
  return useQuery(mtcQueryOptions());
}

/**
 * MTC Tree structure
 */
export function useMTCTree() {
  return useQuery(mtcTreeQueryOptions());
}

/**
 * Basic Stable Inputs of Care (BSIC)
 */
export function useBasicStableInputsOfCare() {
  return useQuery(bsicQueryOptions());
}

export function useCreateBSIC() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<BasicStableInputsOfCare>) =>
      apiClient.post<BasicStableInputsOfCare>('/directory/bsic/', data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.bsic.all }),
  });
}

export function useUpdateBSIC() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<BasicStableInputsOfCare> & { id: number }) =>
      apiClient.patch<BasicStableInputsOfCare>(`/directory/bsic/${id}/`, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.bsic.all }),
  });
}

export function useDeleteBSIC() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiClient.delete(`/directory/bsic/${id}/`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.bsic.all }),
  });
}

export function useBulkDeleteBSIC() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: number[]) => apiClient.post('/directory/bsic/bulk-delete/', { ids }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.bsic.all }),
  });
}

export function useBulkUpdateBSIC() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ ids, updates }: { ids: number[]; updates: Partial<BasicStableInputsOfCare> }) =>
      apiClient.post('/directory/bsic/bulk-update/', { ids, updates }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.bsic.all }),
  });
}

export async function exportBSIC(ids?: number[], format: 'csv' | 'xlsx' | 'json' = 'csv') {
  const searchParams = new URLSearchParams({ file_format: format });
  if (ids && ids.length > 0) searchParams.set('ids', ids.join(','));
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.atlaskeswa.id';
  const url = `${baseUrl}/v1/directory/bsic/export/?${searchParams}`;
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;

  const response = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Export failed (${response.status}): ${errorText}`);
  }

  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = objectUrl;
  a.download = `bsic_categories.${format}`;
  a.click();
  URL.revokeObjectURL(objectUrl);
}

export function useImportBSIC() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ file, updateExisting = false }: { file: File; updateExisting?: boolean }): Promise<{ created: number; updated: number; errors: { row: number; error: string }[] }> => {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.atlaskeswa.id';
      const url = `${baseUrl}/v1/directory/bsic/import/`;
      const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;

      const formData = new FormData();
      formData.append('file', file);
      formData.append('update_existing', updateExisting ? 'true' : 'false');

      const response = await fetch(url, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || `Upload failed (${response.status})`);
      }
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.bsic.all }),
  });
}

// ============================================
// Kategori Layanan Hooks
// ============================================

export function useKategoriLayanan() {
  return useQuery({
    queryKey: queryKeys.kategoriLayanan.list(),
    queryFn: () => apiClient.get<KategoriLayanan[]>('/directory/kategori-layanan/'),
  });
}

export function useCreateKategoriLayanan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<KategoriLayanan>) =>
      apiClient.post<KategoriLayanan>('/directory/kategori-layanan/', data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.kategoriLayanan.all }),
  });
}

export function useUpdateKategoriLayanan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<KategoriLayanan> & { id: number }) =>
      apiClient.patch<KategoriLayanan>(`/directory/kategori-layanan/${id}/`, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.kategoriLayanan.all }),
  });
}

export function useDeleteKategoriLayanan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiClient.delete(`/directory/kategori-layanan/${id}/`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.kategoriLayanan.all }),
  });
}

export function useBulkDeleteKategoriLayanan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: number[]) => apiClient.post('/directory/kategori-layanan/bulk-delete/', { ids }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.kategoriLayanan.all }),
  });
}

export function useBulkUpdateKategoriLayanan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ ids, updates }: { ids: number[]; updates: Partial<KategoriLayanan> }) =>
      apiClient.post('/directory/kategori-layanan/bulk-update/', { ids, updates }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.kategoriLayanan.all }),
  });
}

export async function exportKategoriLayanan(ids?: number[], format: 'csv' | 'xlsx' | 'json' = 'csv') {
  const searchParams = new URLSearchParams({ file_format: format });
  if (ids && ids.length > 0) searchParams.set('ids', ids.join(','));
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.atlaskeswa.id';
  const url = `${baseUrl}/v1/directory/kategori-layanan/export/?${searchParams}`;
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
  const response = await fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Export failed (${response.status}): ${errorText}`);
  }

  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = objectUrl;
  a.download = `kategori_layanan.${format}`;
  a.click();
  URL.revokeObjectURL(objectUrl);
}

export function useImportKategoriLayanan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ file, updateExisting = false }: { file: File; updateExisting?: boolean }): Promise<{ created: number; updated: number; errors: { row: number; error: string }[] }> => {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.atlaskeswa.id';
      const url = `${baseUrl}/v1/directory/kategori-layanan/import/`;
      const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
      const formData = new FormData();
      formData.append('file', file);
      formData.append('update_existing', updateExisting ? 'true' : 'false');
      const response = await fetch(url, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || `Upload failed (${response.status})`);
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.kategoriLayanan.all }),
  });
}

// ============================================
// Kategori Fasilitas Hooks
// ============================================

export function useKategoriFasilitas() {
  return useQuery({
    queryKey: queryKeys.kategoriFasilitas.list(),
    queryFn: () => apiClient.get<KategoriFasilitas[]>('/directory/kategori-fasilitas/'),
  });
}

export function useCreateKategoriFasilitas() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<KategoriFasilitas>) =>
      apiClient.post<KategoriFasilitas>('/directory/kategori-fasilitas/', data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.kategoriFasilitas.all }),
  });
}

export function useUpdateKategoriFasilitas() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<KategoriFasilitas> & { id: number }) =>
      apiClient.patch<KategoriFasilitas>(`/directory/kategori-fasilitas/${id}/`, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.kategoriFasilitas.all }),
  });
}

export function useDeleteKategoriFasilitas() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiClient.delete(`/directory/kategori-fasilitas/${id}/`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.kategoriFasilitas.all }),
  });
}

export function useBulkDeleteKategoriFasilitas() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: number[]) => apiClient.post('/directory/kategori-fasilitas/bulk-delete/', { ids }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.kategoriFasilitas.all }),
  });
}

export function useBulkUpdateKategoriFasilitas() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ ids, updates }: { ids: number[]; updates: Partial<KategoriFasilitas> }) =>
      apiClient.post('/directory/kategori-fasilitas/bulk-update/', { ids, updates }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.kategoriFasilitas.all }),
  });
}

export async function exportKategoriFasilitas(ids?: number[]) {
  const params = ids && ids.length > 0 ? `?ids=${ids.join(',')}` : '';
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.atlaskeswa.id';
  const url = `${baseUrl}/v1/directory/kategori-fasilitas/export/${params}`;
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
  const response = await fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = objectUrl;
  a.download = 'kategori_fasilitas.csv';
  a.click();
  URL.revokeObjectURL(objectUrl);
}

export function useImportKategoriFasilitas() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ file, updateExisting = false }: { file: File; updateExisting?: boolean }): Promise<{ created: number; updated: number; errors: { row: number; error: string }[] }> => {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.atlaskeswa.id';
      const url = `${baseUrl}/v1/directory/kategori-fasilitas/import/`;
      const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
      const formData = new FormData();
      formData.append('file', file);
      formData.append('update_existing', updateExisting ? 'true' : 'false');
      const response = await fetch(url, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || `Upload failed (${response.status})`);
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.kategoriFasilitas.all }),
  });
}

/**
 * Target Populations
 */
export function useTargetPopulations() {
  return useQuery(targetPopulationsQueryOptions());
}

/**
 * Service Types
 */
export function useServiceTypes() {
  return useQuery(serviceTypesQueryOptions());
}

// ============================================
// Questionnaire Hooks
// ============================================

export interface QuestionSectionItem {
  id: number;
  code: string;
  name: string;
  order: number;
  template: number;
}

export function useQuestionSections() {
  return useQuery({
    queryKey: ['question-sections'],
    queryFn: () => apiClient.get<QuestionSectionItem[]>('/surveys/questions/sections/'),
  });
}

export function useQuestions() {
  return useQuery({
    queryKey: queryKeys.questions.list(),
    queryFn: () => apiClient.get<Question[]>('/surveys/questions/'),
  });
}

export function useCreateQuestion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Question>) =>
      apiClient.post<Question>('/surveys/questions/', data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.questions.all }),
  });
}

export function useUpdateQuestion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<Question> & { id: number }) =>
      apiClient.patch<Question>(`/surveys/questions/${id}/`, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.questions.all }),
  });
}

export function useDeleteQuestion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiClient.delete(`/surveys/questions/${id}/`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.questions.all }),
  });
}

export function useQuestionChoices(questionId?: number) {
  return useQuery({
    queryKey: questionId ? queryKeys.questionChoices.byQuestion(questionId) : queryKeys.questionChoices.list(),
    queryFn: () => apiClient.get<QuestionChoice[]>('/surveys/choices/', questionId ? { question: questionId } : undefined),
    enabled: questionId !== undefined,
  });
}

export function useCreateQuestionChoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<QuestionChoice> & { question: number }) =>
      apiClient.post<QuestionChoice>('/surveys/choices/', data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.questionChoices.byQuestion(variables.question) });
      queryClient.invalidateQueries({ queryKey: queryKeys.questions.all });
    },
  });
}

export function useUpdateQuestionChoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<QuestionChoice> & { id: number }) =>
      apiClient.patch<QuestionChoice>(`/surveys/choices/${id}/`, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.questionChoices.all });
      if (variables.question) queryClient.invalidateQueries({ queryKey: queryKeys.questionChoices.byQuestion(variables.question as number) });
      queryClient.invalidateQueries({ queryKey: queryKeys.questions.all });
    },
  });
}

export function useDeleteQuestionChoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, questionId }: { id: number; questionId: number }) =>
      apiClient.delete(`/surveys/choices/${id}/`).then(() => ({ questionId })),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.questionChoices.byQuestion(variables.questionId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.questions.all });
    },
  });
}

export function useBulkDeleteQuestion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: number[]) => apiClient.post('/surveys/questions/bulk-delete/', { ids }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.questions.all }),
  });
}

export async function exportQuestions(ids?: number[], format: 'csv' | 'xlsx' | 'json' = 'csv') {
  const searchParams = new URLSearchParams({ file_format: format });
  if (ids && ids.length > 0) searchParams.set('ids', ids.join(','));
  const token = apiClient.getAccessToken();
  const response = await apiClient.fetchRaw(`/surveys/questions/export/?${searchParams}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Export failed (${response.status}): ${errorText}`);
  }
  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = objectUrl;
  a.download = `questions.${format}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(objectUrl);
}

export function useImportQuestions() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ file, updateExisting = false }: { file: File; updateExisting?: boolean }): Promise<{ created: number; updated: number; errors: { row: number; error: string }[] }> => {
      const token = apiClient.getAccessToken();
      const formData = new FormData();
      formData.append('file', file);
      formData.append('update_existing', updateExisting ? 'true' : 'false');
      const response = await apiClient.fetchRaw('/surveys/questions/import/', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || `Upload failed (${response.status})`);
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.questions.all }),
  });
}
