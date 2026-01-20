/**
 * User management hooks using TanStack Query
 * Best practice: Use query key factory and queryOptions for type-safety
 */

import { useQuery, useMutation, useQueryClient, useInfiniteQuery, queryOptions } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';

export interface User {
  id: number;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  full_name: string;
  role: string;
  role_display: string;
  phone_number: string | null;
  organization: string | null;
  avatar: string | null;
  is_active: boolean;
  is_staff: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserCreateData {
  email: string;
  password: string;
  password_confirm: string;
  first_name?: string;
  last_name?: string;
  role: string;
  phone_number?: string;
  organization?: string;
}

export interface UsersResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: User[];
}

export interface UsersQueryParams {
  page?: number;
  page_size?: number;
  search?: string;
  role?: string;
  is_active?: boolean;
  ordering?: string;
}

/**
 * Helper to clean params
 */
function cleanParams(params?: UsersQueryParams) {
  if (!params) return undefined;
  return Object.fromEntries(
    Object.entries(params).filter(([_, v]) => v !== undefined && v !== null && v !== '')
  );
}

/**
 * Query options for users list
 */
export const usersQueryOptions = (params?: UsersQueryParams) =>
  queryOptions({
    queryKey: queryKeys.users.list(cleanParams(params)),
    queryFn: () => apiClient.get<UsersResponse>('/accounts/users/', cleanParams(params)),
  });

/**
 * Query options for single user
 */
export const userQueryOptions = (id: number) =>
  queryOptions({
    queryKey: queryKeys.users.detail(id),
    queryFn: () => apiClient.get<User>(`/accounts/users/${id}/`),
    enabled: !!id,
  });

/**
 * List users with optional filters
 */
export function useUsers(params?: UsersQueryParams) {
  return useQuery(usersQueryOptions(params));
}

/**
 * Infinite scroll users
 * Best practice: Use for paginated lists with load more
 */
export function useInfiniteUsers(params?: UsersQueryParams) {
  return useInfiniteQuery({
    queryKey: queryKeys.users.infinite(cleanParams(params)),
    queryFn: ({ pageParam }) =>
      apiClient.get<UsersResponse>('/accounts/users/', {
        ...cleanParams(params),
        page: pageParam,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.next ? allPages.length + 1 : undefined,
  });
}

/**
 * Get single user by ID
 */
export function useUser(id: number) {
  return useQuery(userQueryOptions(id));
}

/**
 * Create user mutation
 */
export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UserCreateData) => apiClient.post('/accounts/users/', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.lists() });
    },
  });
}

/**
 * Update user mutation with optimistic update
 */
export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<User> }) =>
      apiClient.patch<User>(`/accounts/users/${id}/`, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.users.detail(id) });

      const previousUser = queryClient.getQueryData<User>(queryKeys.users.detail(id));

      if (previousUser) {
        queryClient.setQueryData<User>(queryKeys.users.detail(id), {
          ...previousUser,
          ...data,
        });
      }

      return { previousUser, id };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousUser) {
        queryClient.setQueryData(queryKeys.users.detail(context.id), context.previousUser);
      }
    },
    onSettled: (_data, _err, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.users.lists() });
    },
  });
}

/**
 * Delete user mutation
 */
export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => apiClient.delete(`/accounts/users/${id}/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.lists() });
    },
  });
}
