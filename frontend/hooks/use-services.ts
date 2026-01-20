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
    queryFn: async () => {
      const response = await apiClient.get<PaginatedResponse<BasicStableInputsOfCare>>('/directory/bsic/');
      return response.results;
    },
    staleTime: 30 * 60 * 1000,
  });

/**
 * Query options for target populations
 */
export const targetPopulationsQueryOptions = () =>
  queryOptions({
    queryKey: queryKeys.targetPopulations.list(),
    queryFn: async () => {
      const response = await apiClient.get<PaginatedResponse<TargetPopulation>>('/directory/target-populations/');
      return response.results;
    },
    staleTime: 30 * 60 * 1000,
  });

/**
 * Query options for service types
 */
export const serviceTypesQueryOptions = () =>
  queryOptions({
    queryKey: queryKeys.serviceTypes.list(),
    queryFn: async () => {
      const response = await apiClient.get<PaginatedResponse<ServiceType>>('/directory/service-types/');
      return response.results;
    },
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
