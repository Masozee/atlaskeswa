import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

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

export function useUsers(params?: UsersQueryParams) {
  // Filter out undefined values to prevent sending "undefined" as string
  const cleanParams = params ? Object.fromEntries(
    Object.entries(params).filter(([_, v]) => v !== undefined)
  ) : undefined;

  return useQuery<UsersResponse>({
    queryKey: ['users', cleanParams],
    queryFn: () => apiClient.get('/accounts/users/', cleanParams as Record<string, any>),
  });
}

export function useUser(id: number) {
  return useQuery<User>({
    queryKey: ['users', id],
    queryFn: () => apiClient.get(`/accounts/users/${id}/`),
    enabled: !!id,
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UserCreateData) => apiClient.post('/accounts/users/', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<User> }) =>
      apiClient.patch(`/accounts/users/${id}/`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => apiClient.delete(`/accounts/users/${id}/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}
