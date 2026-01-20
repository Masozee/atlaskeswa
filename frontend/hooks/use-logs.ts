/**
 * Logs hooks using TanStack Query
 * Best practice: Use query key factory for consistency
 */

import { useQuery, queryOptions } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { ActivityLog, SystemError, PaginatedResponse } from '@/lib/types/api';
import { queryKeys } from '@/lib/query-keys';

/**
 * Helper to clean params
 */
function cleanParams(params?: Record<string, unknown>) {
  if (!params) return undefined;
  return Object.fromEntries(
    Object.entries(params).filter(([_, v]) => v !== undefined && v !== null && v !== '')
  );
}

// ============================================
// Activity Logs
// ============================================

export const activityLogsQueryOptions = (params?: Record<string, unknown>) =>
  queryOptions({
    queryKey: queryKeys.logs.activityList(cleanParams(params)),
    queryFn: () =>
      apiClient.get<PaginatedResponse<ActivityLog>>('/logs/activity/', cleanParams(params)),
  });

export const activityLogStatsQueryOptions = () =>
  queryOptions({
    queryKey: queryKeys.logs.activityStats(),
    queryFn: () => apiClient.get('/logs/activity/stats/'),
  });

export function useActivityLogs(params?: Record<string, unknown>) {
  return useQuery(activityLogsQueryOptions(params));
}

export function useActivityLogStats() {
  return useQuery(activityLogStatsQueryOptions());
}

// ============================================
// Verification Logs
// ============================================

export const verificationLogsQueryOptions = (params?: Record<string, unknown>) =>
  queryOptions({
    queryKey: queryKeys.logs.verificationList(cleanParams(params)),
    queryFn: () =>
      apiClient.get<PaginatedResponse<unknown>>('/logs/verification/', cleanParams(params)),
  });

export const verificationLogStatsQueryOptions = () =>
  queryOptions({
    queryKey: queryKeys.logs.verificationStats(),
    queryFn: () => apiClient.get('/logs/verification/stats/'),
  });

export function useVerificationLogs(params?: Record<string, unknown>) {
  return useQuery(verificationLogsQueryOptions(params));
}

export function useVerificationLogStats() {
  return useQuery(verificationLogStatsQueryOptions());
}

// ============================================
// Data Change Logs
// ============================================

export const dataChangeLogsQueryOptions = (params?: Record<string, unknown>) =>
  queryOptions({
    queryKey: queryKeys.logs.dataChangesList(cleanParams(params)),
    queryFn: () =>
      apiClient.get<PaginatedResponse<unknown>>('/logs/data-changes/', cleanParams(params)),
  });

export const dataChangeLogStatsQueryOptions = () =>
  queryOptions({
    queryKey: queryKeys.logs.dataChangesStats(),
    queryFn: () => apiClient.get('/logs/data-changes/stats/'),
  });

export function useDataChangeLogs(params?: Record<string, unknown>) {
  return useQuery(dataChangeLogsQueryOptions(params));
}

export function useDataChangeLogStats() {
  return useQuery(dataChangeLogStatsQueryOptions());
}

// ============================================
// System Errors
// ============================================

export const systemErrorsQueryOptions = (params?: Record<string, unknown>) =>
  queryOptions({
    queryKey: queryKeys.logs.errorsList(cleanParams(params)),
    queryFn: () =>
      apiClient.get<PaginatedResponse<SystemError>>('/logs/errors/', cleanParams(params)),
  });

export const systemErrorStatsQueryOptions = () =>
  queryOptions({
    queryKey: queryKeys.logs.errorsStats(),
    queryFn: () => apiClient.get('/logs/errors/stats/'),
  });

export function useSystemErrors(params?: Record<string, unknown>) {
  return useQuery(systemErrorsQueryOptions(params));
}

export function useSystemErrorStats() {
  return useQuery(systemErrorStatsQueryOptions());
}

// ============================================
// Import/Export Logs
// ============================================

export const importExportLogsQueryOptions = (params?: Record<string, unknown>) =>
  queryOptions({
    queryKey: queryKeys.logs.importExportList(cleanParams(params)),
    queryFn: () =>
      apiClient.get<PaginatedResponse<unknown>>('/logs/import-export/', cleanParams(params)),
  });

export const importExportLogStatsQueryOptions = () =>
  queryOptions({
    queryKey: queryKeys.logs.importExportStats(),
    queryFn: () => apiClient.get('/logs/import-export/stats/'),
  });

export function useImportExportLogs(params?: Record<string, unknown>) {
  return useQuery(importExportLogsQueryOptions(params));
}

export function useImportExportLogStats() {
  return useQuery(importExportLogStatsQueryOptions());
}
