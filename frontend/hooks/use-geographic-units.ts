import { useQuery } from '@tanstack/react-query';
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
}): Promise<GeographicUnit[]> {
  const queryParams: Record<string, string> = { page_size: '100' };
  if (params.level) queryParams.level = params.level;
  if (params.parent) queryParams.parent = params.parent.toString();
  if (params.search) queryParams.search = params.search;

  const data = await apiClient.get<GeographicUnitsResponse>('/surveys/geographic-units/', queryParams);
  return data.results;
}

export function useGeographicUnits(params: {
  level?: string;
  parent?: number;
  search?: string;
  enabled?: boolean;
}) {
  return useQuery({
    queryKey: ['geographic-units', params],
    queryFn: () => fetchGeographicUnits(params),
    enabled: params.enabled !== false,
    staleTime: 5 * 60 * 1000,
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
