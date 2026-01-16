import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export interface SystemSettings {
  id: number;
  // Application Settings
  app_name: string;
  app_description: string;
  app_logo: string | null;
  app_favicon: string | null;
  // Email Settings
  email_notifications_enabled: boolean;
  email_from_address: string;
  email_from_name: string;
  // Security Settings
  session_timeout: number;
  password_min_length: number;
  require_email_verification: boolean;
  enable_two_factor_auth: boolean;
  // Data & Privacy Settings
  data_retention_days: number;
  enable_audit_logs: boolean;
  // Survey Settings
  survey_auto_approval: boolean;
  survey_draft_expiry_days: number;
  // Pagination Settings
  default_page_size: number;
  max_page_size: number;
  // Maintenance Mode
  maintenance_mode: boolean;
  maintenance_message: string;
  // Metadata
  created_at: string;
  updated_at: string;
  updated_by: number | null;
  updated_by_email: string | null;
  updated_by_name: string | null;
}

export interface SystemSettingsUpdate {
  app_name?: string;
  app_description?: string;
  email_notifications_enabled?: boolean;
  email_from_address?: string;
  email_from_name?: string;
  session_timeout?: number;
  password_min_length?: number;
  require_email_verification?: boolean;
  enable_two_factor_auth?: boolean;
  data_retention_days?: number;
  enable_audit_logs?: boolean;
  survey_auto_approval?: boolean;
  survey_draft_expiry_days?: number;
  default_page_size?: number;
  max_page_size?: number;
  maintenance_mode?: boolean;
  maintenance_message?: string;
}

export function useSystemSettings() {
  return useQuery<SystemSettings>({
    queryKey: ['settings', 'system'],
    queryFn: () => apiClient.get('/settings/system/1/'),
  });
}

export function useUpdateSystemSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SystemSettingsUpdate) =>
      apiClient.patch('/settings/system/1/', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'system'] });
    },
  });
}

export function useResetSystemSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => apiClient.post('/settings/system/reset_to_defaults/'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'system'] });
    },
  });
}
