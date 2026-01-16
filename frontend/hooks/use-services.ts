/**
 * Service directory hooks using TanStack Query
 */

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import {
  Service,
  ServiceListItem,
  PaginatedResponse,
  MainTypeOfCare,
  BasicStableInputsOfCare,
  TargetPopulation,
  ServiceType,
} from '@/lib/types/api';

// Services
export function useServices(params?: Record<string, any>) {
  // Filter out undefined values to prevent sending "undefined" as string
  const cleanParams = params ? Object.fromEntries(
    Object.entries(params).filter(([_, v]) => v !== undefined)
  ) : undefined;

  return useQuery({
    queryKey: ['services', cleanParams],
    queryFn: () =>
      apiClient.get<PaginatedResponse<ServiceListItem>>('/directory/services/', cleanParams),
  });
}

export function useInfiniteServices(params?: Record<string, any>) {
  return useInfiniteQuery({
    queryKey: ['services', 'infinite', params],
    queryFn: ({ pageParam }) =>
      apiClient.get<PaginatedResponse<ServiceListItem>>('/directory/services/', {
        ...params,
        page: pageParam,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.next ? allPages.length + 1 : undefined,
  });
}

export function useService(id: number) {
  return useQuery({
    queryKey: ['services', id],
    queryFn: () => apiClient.get<Service>(`/directory/services/${id}/`),
    enabled: !!id,
  });
}

export function useCreateService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<Service>) =>
      apiClient.post<Service>('/directory/services/', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
    },
  });
}

export function useUpdateService(id: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<Service>) =>
      apiClient.patch<Service>(`/directory/services/${id}/`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services', id] });
      queryClient.invalidateQueries({ queryKey: ['services'] });
    },
  });
}

export function useDeleteService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) =>
      apiClient.delete(`/directory/services/${id}/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
    },
  });
}

export function useServiceStats() {
  return useQuery({
    queryKey: ['services', 'stats'],
    queryFn: () => apiClient.get('/directory/services/stats/'),
  });
}

export function useServicesMap() {
  return useQuery({
    queryKey: ['services', 'map'],
    queryFn: () =>
      apiClient.get<ServiceListItem[]>('/directory/services/map/'),
  });
}

// Main Type of Care (MTC)
export function useMainTypesOfCare() {
  return useQuery({
    queryKey: ['mtc'],
    queryFn: async () => {
      const response = await apiClient.get<PaginatedResponse<MainTypeOfCare>>('/directory/mtc/');
      return response.results;
    },
  });
}

export function useMTCTree() {
  return useQuery({
    queryKey: ['mtc', 'tree'],
    queryFn: async () => {
      const response = await apiClient.get<PaginatedResponse<MainTypeOfCare>>('/directory/mtc/tree/');
      return response.results;
    },
  });
}

// Basic Stable Inputs of Care (BSIC)
export function useBasicStableInputsOfCare() {
  return useQuery({
    queryKey: ['bsic'],
    queryFn: async () => {
      const response = await apiClient.get<PaginatedResponse<BasicStableInputsOfCare>>('/directory/bsic/');
      return response.results;
    },
  });
}

// Target Populations
export function useTargetPopulations() {
  return useQuery({
    queryKey: ['target-populations'],
    queryFn: async () => {
      const response = await apiClient.get<PaginatedResponse<TargetPopulation>>('/directory/target-populations/');
      return response.results;
    },
  });
}

// Service Types
export function useServiceTypes() {
  return useQuery({
    queryKey: ['service-types'],
    queryFn: async () => {
      const response = await apiClient.get<PaginatedResponse<ServiceType>>('/directory/service-types/');
      return response.results;
    },
  });
}
