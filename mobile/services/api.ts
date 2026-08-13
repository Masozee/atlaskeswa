/**
 * API Client for Yakkum Mobile App
 * Handles authentication and API requests to the backend
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import { API_BASE_URL as ENV_API_BASE_URL } from '@env';

export const normalizeApiBaseUrl = (url: string) => {
  const trimmed = url.trim().replace(/\/+$/, '');
  if (!trimmed) return '';
  return trimmed.replace(/\/api\/v1$/, '/v1');
};

// API Configuration
// Configure the API_BASE_URL in the .env file
// For production/mobile builds, use the public API by default.
const API_BASE_URL = normalizeApiBaseUrl(ENV_API_BASE_URL || 'https://api.atlaskeswa.id/v1');

// Export the env-configured URL so App.tsx can determine if .env was explicitly set
export const ENV_CONFIGURED_URL = normalizeApiBaseUrl(ENV_API_BASE_URL || '');

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

type UploadFileSource =
  | string
  | {
      uri: string;
      fileName?: string | null;
      mimeType?: string | null;
      fileSize?: number | null;
    };

// Debug logging helper
const DEBUG = __DEV__;
const debugLog = (...args: any[]) => {
  if (DEBUG) {
    console.log('[API]', new Date().toISOString(), ...args);
  }
};
const debugError = (...args: any[]) => {
  if (DEBUG) {
    console.error('[API ERROR]', new Date().toISOString(), ...args);
  }
};

class ApiClient {
  private baseURL: string;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private onSessionExpired: (() => void) | null = null;
  // Dedupe concurrent token refreshes: many parallel 401s must trigger ONE
  // refresh, not a race that overwrites this.accessToken with stale values.
  private refreshPromise: Promise<'ok' | 'rejected' | 'transient'> | null = null;
  // Resolves once the initial token load from storage completes. request()
  // awaits this so an early request can't fire with accessToken still null.
  private ready: Promise<void>;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = normalizeApiBaseUrl(baseURL);
    debugLog('ApiClient initialized with baseURL:', this.baseURL);
    debugLog('ENV_API_BASE_URL:', ENV_API_BASE_URL);
    debugLog('ENV_CONFIGURED_URL:', ENV_CONFIGURED_URL);
    this.ready = this.loadTokensFromStorage();
  }

  setSessionExpiredCallback(callback: () => void) {
    this.onSessionExpired = callback;
  }

  setBaseURL(url: string) {
    this.baseURL = normalizeApiBaseUrl(url);
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
    this.ready = this.loadTokensFromStorage();
    await this.ready;
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
    // Null in-memory tokens FIRST so any concurrent request during the async
    // storage clear can't grab the outgoing user's token (prevents requests
    // resolving to the wrong user on logout / user switch).
    this.accessToken = null;
    this.refreshToken = null;
    try {
      await AsyncStorage.removeItem('access_token');
      await AsyncStorage.removeItem('refresh_token');
    } catch (error) {
      console.error('Error clearing tokens:', error);
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    // Wait for the initial token load so the first request after boot doesn't
    // fire with accessToken still null.
    await this.ready;

    const url = `${this.baseURL}${endpoint}`;
    const headers: Record<string, string> = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      // Ask any intermediate cache (CDN / proxy) to revalidate. Defends against
      // a shared cache that keys on URL only and could serve one user's
      // authenticated response (e.g. /accounts/users/me/) to another account.
      'Cache-Control': 'no-cache',
      ...(options.headers as Record<string, string> | undefined),
    };

    // Add authorization header if token exists
    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    debugLog(`REQUEST: ${options.method || 'GET'} ${url}`);
    debugLog('Headers:', headers);
    if (options.body) debugLog('Body:', options.body);

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      debugLog(`RESPONSE: ${response.status} ${response.statusText} for ${options.method || 'GET'} ${url}`);

      // Handle 401 Unauthorized - try to refresh token
      if (response.status === 401 && this.refreshToken) {
        const result = await this.refreshAccessToken();
        if (result === 'ok') {
          // Retry the original request with new token
          headers['Authorization'] = `Bearer ${this.accessToken}`;
          const retryResponse = await fetch(url, {
            ...options,
            headers,
          });
          return this.handleResponse<T>(retryResponse);
        }
        if (result === 'transient') {
          // Server/network hiccup during refresh — keep the session, surface a
          // retryable error instead of logging the user out.
          throw new Error('Network error occurred. Please try again.');
        }
        // result === 'rejected' → refresh token genuinely expired/invalid.
        await this.clearTokensFromStorage();
        if (this.onSessionExpired) {
          this.onSessionExpired();
        }
        throw new Error('Session expired. Please login again.');
      }

      // Handle 401 without refresh token - no way to recover the session.
      if (response.status === 401) {
        await this.clearTokensFromStorage();
        if (this.onSessionExpired) {
          this.onSessionExpired();
        }
        throw new Error('Session expired. Please login again.');
      }

      return this.handleResponse<T>(response);
    } catch (error) {
      debugError('Network/fetch error:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network error occurred');
    }
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    const contentType = response.headers.get('content-type');
    const isJson = contentType?.includes('application/json');

    debugLog('Response content-type:', contentType);

    if (!response.ok) {
      const errorText = await response.text();
      debugError('Error response:', response.status, response.statusText, errorText);
      if (isJson) {
        try {
          const errorData = JSON.parse(errorText);
          // Extract first field-level error message if no top-level detail/message
          const fieldErrors = Object.entries(errorData)
            .filter(([k]) => k !== 'detail' && k !== 'message')
            .flatMap(([k, v]) => (Array.isArray(v) ? v.map((e: any) => `${k}: ${e}`) : [`${k}: ${v}`]));
          const apiError: ApiError = {
            message: errorData.detail || errorData.message || fieldErrors[0] || 'An error occurred',
            status: response.status,
            errors: errorData,
          };
          throw apiError;
        } catch (parseErr) {
          if ((parseErr as any)?.status) throw parseErr; // re-throw ApiError
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
      }
    }

    if (response.status === 204) {
      debugLog('204 No Content response');
      return {} as T;
    }

    if (isJson) {
      const json = await response.json();
      debugLog('JSON response keys:', Object.keys(json));
      return json;
    }

    const text = await response.text();
    debugLog('Text response length:', text.length);
    if (contentType?.includes('text/html') || text.trim().startsWith('<!DOCTYPE html') || text.trim().startsWith('<html')) {
      debugError('Received HTML instead of JSON. Base URL might be wrong!');
      throw new Error(`API returned HTML instead of JSON. Check the API base URL: ${this.baseURL}`);
    }

    return text as unknown as T;
  }

  /**
   * Refresh the access token.
   * - 'ok'       → got a new token
   * - 'rejected' → server explicitly rejected the refresh token (real expiry → log out)
   * - 'transient'→ network error / server 5xx (do NOT log out; keep the session)
   */
  private async refreshAccessToken(): Promise<'ok' | 'rejected' | 'transient'> {
    if (!this.refreshToken) return 'rejected';
    // If a refresh is already in flight, await that one instead of starting a
    // second concurrent refresh (which could overwrite tokens with a stale set).
    if (this.refreshPromise) return this.refreshPromise;

    this.refreshPromise = (async (): Promise<'ok' | 'rejected' | 'transient'> => {
      const refreshToken = this.refreshToken;
      try {
        const response = await fetch(`${this.baseURL}/accounts/auth/refresh/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh: refreshToken }),
        });

        if (response.ok) {
          const data = await response.json();
          await this.saveTokensToStorage(data.access, data.refresh || refreshToken);
          return 'ok';
        }
        // Only an explicit auth rejection (401/400) means the refresh token is
        // truly invalid. A 5xx is a server hiccup — keep the session alive.
        if (response.status === 401 || response.status === 400) return 'rejected';
        return 'transient';
      } catch {
        // Network error (offline, timeout, DNS) — transient, never log out.
        return 'transient';
      }
    })();

    try {
      return await this.refreshPromise;
    } finally {
      this.refreshPromise = null;
    }
  }

  // Authentication methods
  async login(email: string, password: string): Promise<LoginResponse> {
    debugLog('LOGIN attempt for:', email);
    debugLog('Using baseURL:', this.baseURL);
    debugLog('Login endpoint:', `${this.baseURL}/accounts/auth/login/`);

    const data = await this.request<LoginResponse>(
      '/accounts/auth/login/',
      {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }
    );

    debugLog('Login response data type:', typeof data);
    debugLog('Login response keys:', data ? Object.keys(data) : 'null/undefined');
    debugLog('Login response:', JSON.stringify(data));

    if (
      !data ||
      typeof data !== 'object' ||
      typeof (data as LoginResponse).access !== 'string' ||
      typeof (data as LoginResponse).refresh !== 'string'
    ) {
      debugError('Login validation FAILED. Data:', data);
      throw new Error('Login endpoint returned an unexpected response. Check the API base URL.');
    }

    await this.saveTokensToStorage(data.access, data.refresh);
    debugLog('LOGIN SUCCESS');
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
    const safeParams = params && typeof params === 'object' ? params : {};
    const filteredParams = Object.fromEntries(
      Object.entries(safeParams).filter(([_, v]) => v !== undefined && v !== null && v !== '')
    );
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

  private buildMultipartFile(source: UploadFileSource, fieldName: string) {
    const uri = typeof source === 'string' ? source : source.uri;
    const safeUri = uri.split('?')[0];
    const nameFromUri = safeUri.split('/').pop() || `${fieldName}_${Date.now()}.jpg`;
    const providedName = typeof source === 'string' ? null : source.fileName;
    const fallbackName = providedName || nameFromUri;
    const inferredExt = (fallbackName.split('.').pop() || 'jpg').toLowerCase();
    const mimeType =
      (typeof source === 'string' ? null : source.mimeType) ||
      (inferredExt === 'png' ? 'image/png' :
      inferredExt === 'heic' ? 'image/heic' :
      inferredExt === 'webp' ? 'image/webp' :
      'image/jpeg');
    const fileName = fallbackName.includes('.') ? fallbackName : `${fallbackName}.jpg`;

    return {
      uri,
      name: fileName,
      type: mimeType,
    } as any;
  }

  async uploadResponseAnswerFile(
    responseId: number,
    questionCode: string,
    imageUri: UploadFileSource,
    contextKey?: string
  ): Promise<any> {
    await this.ready;
    if (!this.accessToken) {
      await this.loadTokensFromStorage();
    }

    const file = this.buildMultipartFile(imageUri, questionCode);
    const url = `${this.baseURL}/surveys/responses/${responseId}/upload-answer-file/`;
    const authHeaders: Record<string, string> = {
      Accept: 'application/json',
      ...(this.accessToken ? { Authorization: `Bearer ${this.accessToken}` } : {}),
    };

    const isLocalFile = typeof file.uri === 'string' && /^(file|content):\/\//i.test(file.uri);

    // RN 0.85 new-arch FormData rejects file parts ("Unsupported FormDataPart
    // implementation"); use the native multipart uploader for local files.
    if (isLocalFile) {
      // Only file:// can be reliably stat'd. content:// is handled natively by
      // uploadAsync and may not resolve via getInfoAsync — don't false-reject it.
      if (file.uri.startsWith('file://')) {
        const info = await FileSystem.getInfoAsync(file.uri).catch(() => null);
        if (!info?.exists) {
          throw new Error(`File tidak ditemukan: ${file.uri} (file mungkin hilang setelah update aplikasi)`);
        }
      }

      let result: FileSystem.FileSystemUploadResult;
      try {
        result = await FileSystem.uploadAsync(url, file.uri, {
          httpMethod: 'POST',
          uploadType: FileSystem.FileSystemUploadType.MULTIPART,
          fieldName: 'file',
          mimeType: file.type,
          parameters: {
            question_code: questionCode,
            ...(contextKey ? { context_key: contextKey } : {}),
          },
          headers: authHeaders,
        });
      } catch (networkErr) {
        throw new Error(`Network error during upload: ${networkErr}`);
      }

      const responseText = result.body ?? '';
      if (result.status < 200 || result.status >= 300) {
        throw new Error(`Upload failed: ${result.status} - ${responseText}`);
      }
      return responseText ? JSON.parse(responseText) : {};
    }

    const formData = new FormData();
    formData.append('file', file as any);
    formData.append('question_code', questionCode);
    if (contextKey) {
      formData.append('context_key', contextKey);
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: authHeaders,
      body: formData,
    });

    const responseText = await response.text();
    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status} - ${responseText}`);
    }

    return responseText ? JSON.parse(responseText) : {};
  }

  async uploadSurveyPhoto(surveyId: number, imageUri: UploadFileSource, caption?: string): Promise<any> {
    await this.ready;
    if (!this.accessToken) {
      await this.loadTokensFromStorage();
    }

    debugLog('uploadSurveyPhoto called', { surveyId, imageUri, caption });

    const file = this.buildMultipartFile(imageUri, 'photo');
    debugLog('Built file object:', { uri: file.uri, name: file.name, type: file.type });

    const url = `${this.baseURL}/surveys/photos/`;
    const authHeaders: Record<string, string> = {
      Accept: 'application/json',
      ...(this.accessToken ? { Authorization: `Bearer ${this.accessToken}` } : {}),
    };

    const isLocalFile = typeof file.uri === 'string' && /^(file|content):\/\//i.test(file.uri);

    // For local files use expo-file-system's native MULTIPART uploader.
    // RN 0.85's JS FormData throws "Unsupported FormDataPart implementation"
    // for file parts under the new architecture, so we bypass it entirely.
    if (isLocalFile) {
      // Guard against stale/missing files (documentDirectory path changes between
      // app builds, leaving old absolute URIs dangling). Only stat file:// —
      // content:// is handled natively by uploadAsync and may not resolve here.
      if (file.uri.startsWith('file://')) {
        const info = await FileSystem.getInfoAsync(file.uri).catch(() => null);
        if (!info?.exists) {
          throw new Error(`File foto tidak ditemukan: ${file.uri} (foto mungkin hilang setelah update aplikasi)`);
        }
      }

      debugLog(`UPLOAD REQUEST (native multipart): POST ${url}`);

      let result: FileSystem.FileSystemUploadResult;
      try {
        result = await FileSystem.uploadAsync(url, file.uri, {
          httpMethod: 'POST',
          uploadType: FileSystem.FileSystemUploadType.MULTIPART,
          fieldName: 'image',
          mimeType: file.type,
          parameters: {
            survey: String(surveyId),
            ...(caption ? { caption } : {}),
          },
          headers: authHeaders,
        });
      } catch (networkErr) {
        debugError('Upload network error:', networkErr);
        throw new Error(`Network error during upload: ${networkErr}`);
      }

      debugLog(`UPLOAD RESPONSE: ${result.status}`);
      const responseText = result.body ?? '';

      if (result.status < 200 || result.status >= 300) {
        debugError('Upload failed:', result.status, responseText);
        try {
          const errData = JSON.parse(responseText);
          throw new Error(errData.detail || errData.message || `Upload failed: ${result.status}`);
        } catch {
          throw new Error(`Upload failed: ${result.status} - ${responseText}`);
        }
      }

      debugLog('Upload success response:', responseText);
      if (responseText) {
        try {
          return JSON.parse(responseText);
        } catch {
          return { id: 0, image_url: file.uri };
        }
      }
      return {};
    }

    // Remote/http URI fallback — use FormData fetch path.
    const formData = new FormData();
    formData.append('image', file as any);
    if (caption) {
      formData.append('caption', caption);
    }
    formData.append('survey', String(surveyId));

    const headers: Record<string, string> = { ...authHeaders };
    delete headers['Content-Type'];

    let response: Response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers,
        body: formData,
      });
    } catch (networkErr) {
      debugError('Upload network error:', networkErr);
      throw new Error(`Network error during upload: ${networkErr}`);
    }

    const contentType = response.headers.get('content-type');
    const isJson = contentType?.includes('application/json');
    const responseText = await response.text();

    if (!response.ok) {
      debugError('Upload failed:', response.status, responseText);
      if (isJson) {
        try {
          const errData = JSON.parse(responseText);
          throw new Error(errData.detail || errData.message || `Upload failed: ${response.status}`);
        } catch {
          throw new Error(`Upload failed: ${response.status} - ${responseText}`);
        }
      }
      throw new Error(`Upload failed: ${response.status} - ${responseText}`);
    }

    if (responseText) {
      try {
        return JSON.parse(responseText);
      } catch {
        return { id: 0, image_url: typeof imageUri === 'string' ? imageUri : imageUri.uri };
      }
    }
    return {};
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
