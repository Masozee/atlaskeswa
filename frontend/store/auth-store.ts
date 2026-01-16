import { Store } from '@tanstack/react-store';
import { apiClient } from '@/lib/api-client';

interface AuthState {
  isAuthenticated: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  user: {
    id: number;
    email: string;
    name: string;
    role?: 'ADMIN' | 'SURVEYOR' | 'VERIFIER' | 'VIEWER';
  } | null;
}

// Initialize auth state from localStorage
const getInitialAuthState = (): AuthState => {
  if (typeof window === 'undefined') {
    return {
      isAuthenticated: false,
      accessToken: null,
      refreshToken: null,
      user: null,
    };
  }

  const accessToken = localStorage.getItem('access_token');
  const refreshToken = localStorage.getItem('refresh_token');
  const userStr = localStorage.getItem('user');

  return {
    isAuthenticated: !!accessToken,
    accessToken,
    refreshToken,
    user: userStr ? JSON.parse(userStr) : null,
  };
};

export const authStore = new Store<AuthState>(getInitialAuthState());

// Auth actions
export const authActions = {
  login: (accessToken: string, refreshToken: string, user: AuthState['user']) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('access_token', accessToken);
      localStorage.setItem('refresh_token', refreshToken);
      if (user) {
        localStorage.setItem('user', JSON.stringify(user));
      }

      // Also set cookies for middleware
      document.cookie = `access_token=${accessToken}; path=/; max-age=${8 * 60 * 60}`; // 8 hours
      document.cookie = `refresh_token=${refreshToken}; path=/; max-age=${7 * 24 * 60 * 60}`; // 7 days
    }

    // Reload tokens in apiClient singleton
    apiClient.reloadTokens();

    authStore.setState(() => ({
      isAuthenticated: true,
      accessToken,
      refreshToken,
      user,
    }));
  },

  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');

      // Clear cookies
      document.cookie = 'access_token=; path=/; max-age=0';
      document.cookie = 'refresh_token=; path=/; max-age=0';
    }

    authStore.setState(() => ({
      isAuthenticated: false,
      accessToken: null,
      refreshToken: null,
      user: null,
    }));
  },

  updateTokens: (accessToken: string, refreshToken: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('access_token', accessToken);
      localStorage.setItem('refresh_token', refreshToken);

      document.cookie = `access_token=${accessToken}; path=/; max-age=${8 * 60 * 60}`;
      document.cookie = `refresh_token=${refreshToken}; path=/; max-age=${7 * 24 * 60 * 60}`;
    }

    authStore.setState((state) => ({
      ...state,
      accessToken,
      refreshToken,
    }));
  },

  checkAuth: () => {
    const state = authStore.state;
    return state.isAuthenticated && !!state.accessToken;
  },
};
