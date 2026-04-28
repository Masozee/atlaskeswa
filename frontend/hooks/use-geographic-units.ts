import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export interface GeographicUnit {
  id: number;
  code: string;
  name: string;
  level: 'PROVINSI' | 'KABUPATEN_KOTA' | 'KECAMATAN' | 'DESA_KELURAHAN';
  parent?: number | null;
  parent_name?: string;
  full_path?: string;
  is_active: boolean;
}

export interface GeographicUnitImportResult {
  created: number;
  updated: number;
  errors: { row: number; error: string }[];
}

interface GeographicUnitsResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: GeographicUnit[];
}

async function fetchGeographicUnits(params: {
  level?: string;
  parent?: number;
  search?: string;
  is_active?: boolean;
}): Promise<GeographicUnit[]> {
  const queryParams: Record<string, string> = { page_size: '500' };
  if (params.level) queryParams.level = params.level;
  if (params.parent) queryParams.parent = params.parent.toString();
  if (params.search) queryParams.search = params.search;
  if (params.is_active !== undefined) queryParams.is_active = String(params.is_active);

  const data = await apiClient.get<GeographicUnitsResponse>('/surveys/geographic-units/', queryParams);
  return data.results;
}

async function createGeographicUnit(data: {
  code: string;
  name: string;
  level: string;
  parent?: number | null;
  latitude?: number | null;
  longitude?: number | null;
  is_active?: boolean;
}): Promise<GeographicUnit> {
  return apiClient.post<GeographicUnit>('/surveys/geographic-units/', data);
}

async function updateGeographicUnit(id: number, data: Partial<{
  code: string;
  name: string;
  level: string;
  parent: number | null;
  latitude: number | null;
  longitude: number | null;
  is_active: boolean;
}>): Promise<GeographicUnit> {
  return apiClient.patch<GeographicUnit>(`/surveys/geographic-units/${id}/`, data);
}

async function deleteGeographicUnit(id: number): Promise<void> {
  return apiClient.delete(`/surveys/geographic-units/${id}/`);
}

export function useGeographicUnits(params: {
  level?: string;
  parent?: number;
  search?: string;
  is_active?: boolean;
  enabled?: boolean;
}) {
  return useQuery({
    queryKey: ['geographic-units', params],
    queryFn: () => fetchGeographicUnits(params),
    enabled: params.enabled !== false,
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });
}

export function useCreateGeographicUnit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createGeographicUnit,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['geographic-units'] });
    },
  });
}

export function useUpdateGeographicUnit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Parameters<typeof updateGeographicUnit>[1] }) =>
      updateGeographicUnit(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['geographic-units'] });
    },
  });
}

export function useDeleteGeographicUnit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteGeographicUnit,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['geographic-units'] });
    },
  });
}

export async function exportGeographicUnits(ids?: number[], format: 'csv' | 'xlsx' | 'json' = 'csv') {
  const searchParams = new URLSearchParams({ file_format: format });
  if (ids && ids.length > 0) searchParams.set('ids', ids.join(','));
  const token = apiClient.getAccessToken();
  const response = await apiClient.fetchRaw(`/surveys/geographic-units/export/?${searchParams}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Export failed (${response.status}): ${errorText}`);
  }
  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = objectUrl;
  a.download = `geographic-units.${format}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(objectUrl);
}

export function useImportGeographicUnits() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ file, updateExisting = false }: { file: File; updateExisting?: boolean }): Promise<GeographicUnitImportResult> => {
      const token = apiClient.getAccessToken();
      const formData = new FormData();
      formData.append('file', file);
      formData.append('update_existing', updateExisting ? 'true' : 'false');
      const response = await apiClient.fetchRaw('/surveys/geographic-units/import/', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || `Upload failed (${response.status})`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['geographic-units'] });
    },
  });
}

export function useProvinsi() {
  return useGeographicUnits({ level: 'PROVINSI' });
}

export function useKabupaten(provinsiId?: number) {
  return useGeographicUnits({
    level: 'KABUPATEN_KOTA',
    parent: provinsiId,
    enabled: !!provinsiId,
  });
}

export function useKecamatan(kabupatenId?: number) {
  return useGeographicUnits({
    level: 'KECAMATAN',
    parent: kabupatenId,
    enabled: !!kabupatenId,
  });
}

export function useDesa(kecamatanId?: number) {
  return useGeographicUnits({
    level: 'DESA_KELURAHAN',
    parent: kecamatanId,
    enabled: !!kecamatanId,
  });
}

export function useKebumenKecamatan() {
  const { data: kabupatenList = [], isLoading: isLoadingKabupaten } = useGeographicUnits({
    level: 'KABUPATEN_KOTA',
    enabled: true,
  });

  const kebumen = kabupatenList.find(
    (unit) => unit.code === '3305' || unit.name.toLowerCase() === 'kebumen'
  );

  const kecamatanQuery = useGeographicUnits({
    level: 'KECAMATAN',
    parent: kebumen?.id,
    enabled: !!kebumen?.id,
  });

  return {
    ...kecamatanQuery,
    isLoading: isLoadingKabupaten || kecamatanQuery.isLoading,
  };
}
