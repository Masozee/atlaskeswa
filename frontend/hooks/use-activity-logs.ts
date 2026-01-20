/**
 * Activity logs hooks using TanStack Query
 * Best practice: Use query key factory for consistency
 */

import { useQuery, queryOptions } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';

export interface ActivityLog {
  id: number;
  user: number;
  user_name: string;
  user_email?: string;
  username: string;
  action: string;
  action_display: string;
  severity: string;
  severity_display: string;
  description: string;
  model_name: string;
  object_repr: string;
  ip_address: string | null;
  user_agent: string;
  request_method: string;
  request_path: string;
  changes: unknown;
  metadata: unknown;
  timestamp: string;
}

interface ActivityLogsParams {
  search?: string;
  action?: string;
  severity?: string;
  user?: string;
  ordering?: string;
  page?: number;
  page_size?: number;
}

/**
 * Helper to clean params
 */
function cleanParams(params?: ActivityLogsParams) {
  if (!params) return undefined;
  return Object.fromEntries(
    Object.entries(params).filter(([_, v]) => v !== undefined && v !== null && v !== '')
  );
}

/**
 * Query options for activity logs
 */
export const activityLogsQueryOptions = (params?: ActivityLogsParams) =>
  queryOptions({
    queryKey: queryKeys.activityLogs.list(cleanParams(params)),
    queryFn: () =>
      apiClient.get<{ count: number; results: ActivityLog[] }>(
        '/logs/activity/',
        cleanParams(params)
      ),
  });

/**
 * Activity logs hook
 */
export function useActivityLogs(params?: ActivityLogsParams) {
  return useQuery(activityLogsQueryOptions(params));
}
