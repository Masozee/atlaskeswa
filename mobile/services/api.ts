/**
 * API Client for Yakkum Mobile App
 * Handles authentication and API requests to the backend
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL as ENV_API_BASE_URL } from '@env';

// API Configuration
// Configure the API_BASE_URL in the .env file
// For local development, use your computer's local IP address (not localhost)
const API_BASE_URL = ENV_API_BASE_URL || 'http://192.168.0.101:8000/v1';

// Export the env-configured URL so App.tsx can determine if .env was explicitly set
export const ENV_CONFIGURED_URL = ENV_API_BASE_URL || '';

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

  setBaseURL(url: string) {
    this.baseURL = url;
  }

  getBaseURL(): string {
    return this.baseURL;
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
  async get<T>(endpoint: string, params?: Record<string, any>, headers?: Record<string, string>): Promise<T> {
    const filteredParams = params
      ? Object.fromEntries(
          Object.entries(params).filter(([_, v]) => v !== undefined && v !== null && v !== '')
        )
      : {};
    const queryString = Object.keys(filteredParams).length > 0
      ? `?${new URLSearchParams(filteredParams).toString()}`
      : '';
    return this.request<T>(`${endpoint}${queryString}`, { method: 'GET', headers });
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  async uploadSurveyPhoto(surveyId: number, imageUri: string, caption?: string): Promise<any> {
    const formData = new FormData();
    // Get file extension from URI
    const uriParts = imageUri.split('.');
    const fileType = uriParts[uriParts.length - 1];

    formData.append('image', {
      uri: imageUri,
      name: `photo_${Date.now()}.${fileType}`,
      type: `image/${fileType}`,
    } as any);
    if (caption) {
      formData.append('caption', caption);
    }
    formData.append('survey', String(surveyId));

    const url = `${this.baseURL}/surveys/photos/`;
    const headers: Record<string, string> = {
      ...(this.accessToken ? { Authorization: `Bearer ${this.accessToken}` } : {}),
    };

    // Don't set Content-Type for multipart - browser will set it with boundary
    delete headers['Content-Type'];

    console.log('Upload request to:', url);
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: formData,
    });

    console.log('Upload response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Upload error response:', errorText);
      throw new Error(`Upload failed: ${response.status} - ${errorText}`);
    }

    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      return response.json();
    }
    return {};
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
