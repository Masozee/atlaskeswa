/**
 * Logs hooks using TanStack Query
 */

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { ActivityLog, SystemError, PaginatedResponse } from '@/lib/types/api';

// Activity Logs
export function useActivityLogs(params?: Record<string, any>) {
  return useQuery({
    queryKey: ['logs', 'activity', params],
    queryFn: () =>
      apiClient.get<PaginatedResponse<ActivityLog>>('/logs/activity/', params),
  });
}

export function useActivityLogStats() {
  return useQuery({
    queryKey: ['logs', 'activity', 'stats'],
    queryFn: () => apiClient.get('/logs/activity/stats/'),
  });
}

// Verification Logs
export function useVerificationLogs(params?: Record<string, any>) {
  return useQuery({
    queryKey: ['logs', 'verification', params],
    queryFn: () =>
      apiClient.get<PaginatedResponse<any>>('/logs/verification/', params),
  });
}

export function useVerificationLogStats() {
  return useQuery({
    queryKey: ['logs', 'verification', 'stats'],
    queryFn: () => apiClient.get('/logs/verification/stats/'),
  });
}

// Data Change Logs
export function useDataChangeLogs(params?: Record<string, any>) {
  return useQuery({
    queryKey: ['logs', 'data-changes', params],
    queryFn: () =>
      apiClient.get<PaginatedResponse<any>>('/logs/data-changes/', params),
  });
}

export function useDataChangeLogStats() {
  return useQuery({
    queryKey: ['logs', 'data-changes', 'stats'],
    queryFn: () => apiClient.get('/logs/data-changes/stats/'),
  });
}

// System Errors
export function useSystemErrors(params?: Record<string, any>) {
  return useQuery({
    queryKey: ['logs', 'errors', params],
    queryFn: () =>
      apiClient.get<PaginatedResponse<SystemError>>('/logs/errors/', params),
  });
}

export function useSystemErrorStats() {
  return useQuery({
    queryKey: ['logs', 'errors', 'stats'],
    queryFn: () => apiClient.get('/logs/errors/stats/'),
  });
}

// Import/Export Logs
export function useImportExportLogs(params?: Record<string, any>) {
  return useQuery({
    queryKey: ['logs', 'import-export', params],
    queryFn: () =>
      apiClient.get<PaginatedResponse<any>>('/logs/import-export/', params),
  });
}

export function useImportExportLogStats() {
  return useQuery({
    queryKey: ['logs', 'import-export', 'stats'],
    queryFn: () => apiClient.get('/logs/import-export/stats/'),
  });
}
