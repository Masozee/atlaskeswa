/**
 * API Client for Yakkum Mobile App
 * Handles authentication and API requests to the backend
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL as ENV_API_BASE_URL } from '@env';

// API Configuration
// Configure the API_BASE_URL in the .env file
// For local development, use your computer's local IP address (not localhost)
const API_BASE_URL = ENV_API_BASE_URL || 'http://192.168.1.45:8004/api';

export interface ApiError {
  message: string;
  status?: number;
  errors?: Record<string, string[]>;
}

export interface LoginResponse {
  access: string;
  refresh: string;
}

export interface User {
  id: string;
  email: string;
  full_name?: string;
  role?: string;
}

class ApiClient {
  private baseURL: string;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private onSessionExpired: (() => void) | null = null;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
    this.loadTokensFromStorage();
  }

  setSessionExpiredCallback(callback: () => void) {
    this.onSessionExpired = callback;
  }

  private async loadTokensFromStorage() {
    try {
      this.accessToken = await AsyncStorage.getItem('access_token');
      this.refreshToken = await AsyncStorage.getItem('refresh_token');
    } catch (error) {
      console.error('Error loading tokens:', error);
    }
  }

  async reloadTokens() {
    await this.loadTokensFromStorage();
  }

  private async saveTokensToStorage(accessToken: string, refreshToken: string) {
    try {
      await AsyncStorage.setItem('access_token', accessToken);
      await AsyncStorage.setItem('refresh_token', refreshToken);
      this.accessToken = accessToken;
      this.refreshToken = refreshToken;
    } catch (error) {
      console.error('Error saving tokens:', error);
    }
  }

  async clearTokensFromStorage() {
    try {
      await AsyncStorage.removeItem('access_token');
      await AsyncStorage.removeItem('refresh_token');
      this.accessToken = null;
      this.refreshToken = null;
    } catch (error) {
      console.error('Error clearing tokens:', error);
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // Add authorization header if token exists
    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      // Handle 401 Unauthorized - try to refresh token
      if (response.status === 401 && this.refreshToken) {
        const refreshed = await this.refreshAccessToken();
        if (refreshed) {
          // Retry the original request with new token
          headers['Authorization'] = `Bearer ${this.accessToken}`;
          const retryResponse = await fetch(url, {
            ...options,
            headers,
          });
          return this.handleResponse<T>(retryResponse);
        } else {
          // Token refresh failed - clear tokens and trigger callback
          await this.clearTokensFromStorage();
          if (this.onSessionExpired) {
            this.onSessionExpired();
          }
          throw new Error('Session expired. Please login again.');
        }
      }

      // Handle 401 without refresh token
      if (response.status === 401) {
        await this.clearTokensFromStorage();
        if (this.onSessionExpired) {
          this.onSessionExpired();
        }
        throw new Error('Session expired. Please login again.');
      }

      return this.handleResponse<T>(response);
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network error occurred');
    }
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    const contentType = response.headers.get('content-type');
    const isJson = contentType?.includes('application/json');

    if (!response.ok) {
      if (isJson) {
        const errorData = await response.json();
        const apiError: ApiError = {
          message: errorData.detail || errorData.message || 'An error occurred',
          status: response.status,
          errors: errorData,
        };
        throw apiError;
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    }

    if (response.status === 204) {
      return {} as T;
    }

    return isJson ? response.json() : (response.text() as unknown as T);
  }

  private async refreshAccessToken(): Promise<boolean> {
    if (!this.refreshToken) return false;

    try {
      const response = await fetch(`${this.baseURL}/accounts/auth/refresh/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh: this.refreshToken }),
      });

      if (response.ok) {
        const data = await response.json();
        await this.saveTokensToStorage(data.access, data.refresh || this.refreshToken);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  // Authentication methods
  async login(email: string, password: string): Promise<LoginResponse> {
    const data = await this.request<LoginResponse>(
      '/accounts/auth/login/',
      {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }
    );
    await this.saveTokensToStorage(data.access, data.refresh);
    return data;
  }

  async logout() {
    await this.clearTokensFromStorage();
  }

  isAuthenticated(): boolean {
    return !!this.accessToken;
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }

  // HTTP methods
  async get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    const filteredParams = params
      ? Object.fromEntries(
          Object.entries(params).filter(([_, v]) => v !== undefined && v !== null && v !== '')
        )
      : {};
    const queryString = Object.keys(filteredParams).length > 0
      ? `?${new URLSearchParams(filteredParams).toString()}`
      : '';
    return this.request<T>(`${endpoint}${queryString}`, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
