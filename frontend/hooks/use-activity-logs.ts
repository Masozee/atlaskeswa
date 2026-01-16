import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

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
  changes: any;
  metadata: any;
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

export function useActivityLogs(params?: ActivityLogsParams) {
  return useQuery({
    queryKey: ['activity-logs', params],
    queryFn: () =>
      apiClient.get<{ count: number; results: ActivityLog[] }>(
        '/logs/activity/',
        params
      ),
  });
}
