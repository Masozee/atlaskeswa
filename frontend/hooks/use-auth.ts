/**
 * Authentication hooks using TanStack Query and TanStack Store
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useStore } from '@tanstack/react-store';
import { apiClient } from '@/lib/api-client';
import { LoginCredentials, User } from '@/lib/types/api';
import { authStore, authActions } from '@/store/auth-store';

export function useAuth() {
  const isAuthenticated = useStore(authStore, (state) => state.isAuthenticated);
  const user = useStore(authStore, (state) => state.user);
  const accessToken = useStore(authStore, (state) => state.accessToken);

  return {
    isAuthenticated,
    user,
    accessToken,
    login: authActions.login,
    logout: authActions.logout,
    checkAuth: authActions.checkAuth,
  };
}

export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ email, password }: LoginCredentials) =>
      apiClient.login(email, password),
    onSuccess: (data) => {
      // Update auth store
      authActions.login(data.access, data.refresh, null);

      // Invalidate and refetch user data
      queryClient.invalidateQueries({ queryKey: ['user', 'me'] });
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => {
      authActions.logout();
      return apiClient.logout();
    },
    onSuccess: () => {
      // Clear all queries on logout
      queryClient.clear();
    },
  });
}

export function useCurrentUser() {
  return useQuery({
    queryKey: ['user', 'me'],
    queryFn: () => apiClient.get<User>('/accounts/users/me/'),
    enabled: apiClient.isAuthenticated(),
    retry: false,
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (data: { old_password: string; new_password: string; new_password_confirm: string }) =>
      apiClient.post('/accounts/users/change_password/', data),
  });
}
