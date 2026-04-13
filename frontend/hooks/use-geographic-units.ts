import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

interface GeographicUnit {
  id: number;
  code: string;
  name: string;
  level: 'PROVINSI' | 'KABUPATEN_KOTA' | 'KECAMATAN' | 'DESA_KELURAHAN';
  parent?: number | null;
  parent_name?: string;
  full_path?: string;
  is_active: boolean;
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
    staleTime: 5 * 60 * 1000,
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

const KEBUMEN_ID = 2;

export function useKebumenKecamatan() {
  return useGeographicUnits({
    level: 'KECAMATAN',
    parent: KEBUMEN_ID,
    enabled: true,
  });
}
