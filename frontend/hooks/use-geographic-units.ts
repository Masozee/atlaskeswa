import { useQuery } from '@tanstack/react-query';

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
  const searchParams = new URLSearchParams();
  if (params.level) searchParams.set('level', params.level);
  if (params.parent) searchParams.set('parent', params.parent.toString());
  if (params.search) searchParams.set('search', params.search);
  searchParams.set('page_size', '100'); // Get all results

  const response = await fetch(`/api/surveys/geographic-units/?${searchParams.toString()}`);
  if (!response.ok) {
    throw new Error('Failed to fetch geographic units');
  }
  const data: GeographicUnitsResponse = await response.json();
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
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
}

// Helper hooks for specific levels
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

// Hook to get Kebumen kecamatan specifically (for fixed Kebumen surveys)
// Uses the known Kebumen ID (2) directly instead of fetching and searching
const KEBUMEN_ID = 2;

export function useKebumenKecamatan() {
  return useGeographicUnits({
    level: 'KECAMATAN',
    parent: KEBUMEN_ID,
    enabled: true,
  });
}
