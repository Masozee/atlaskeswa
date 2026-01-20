/**
 * Authentication hooks using TanStack Query and TanStack Store
 * Best practice: Separate server state (Query) from client state (Store)
 */

import { useMutation, useQuery, useQueryClient, queryOptions } from '@tanstack/react-query';
import { useStore } from '@tanstack/react-store';
import { apiClient } from '@/lib/api-client';
import { LoginCredentials, User } from '@/lib/types/api';
import { authStore, authActions } from '@/store/auth-store';
import { queryKeys } from '@/lib/query-keys';

/**
 * Query options for current user
 * Best practice: Use queryOptions for type-safe, reusable queries
 */
export const currentUserQueryOptions = () =>
  queryOptions({
    queryKey: queryKeys.auth.me(),
    queryFn: () => apiClient.get<User>('/accounts/users/me/'),
    enabled: apiClient.isAuthenticated(),
    retry: false,
    staleTime: 5 * 60 * 1000, // User data can be stale for 5 minutes
  });

/**
 * Hook to access auth state from TanStack Store
 * Best practice: Use selectors to minimize re-renders
 */
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

/**
 * Login mutation hook
 * Best practice: Invalidate related queries on success
 */
export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ email, password }: LoginCredentials) =>
      apiClient.login(email, password),
    onSuccess: (data) => {
      // Update auth store
      authActions.login(data.access, data.refresh, null);

      // Invalidate and refetch user data
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.me() });
    },
  });
}

/**
 * Logout mutation hook
 * Best practice: Clear all cached data on logout
 */
export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      authActions.logout();
      return apiClient.logout();
    },
    onSuccess: () => {
      // Clear all queries on logout for security
      queryClient.clear();
    },
  });
}

/**
 * Current user query hook
 * Best practice: Use queryOptions for consistency
 */
export function useCurrentUser() {
  return useQuery(currentUserQueryOptions());
}

/**
 * Change password mutation hook
 */
export function useChangePassword() {
  return useMutation({
    mutationFn: (data: { old_password: string; new_password: string; new_password_confirm: string }) =>
      apiClient.post('/accounts/users/change_password/', data),
  });
}
