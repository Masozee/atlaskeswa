/**
 * Secondary data — tables about kecamatan that come from other agencies rather
 * than from the survey. Public endpoints: the landing map and the kecamatan
 * pages are anonymous surfaces.
 */

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export interface SecondaryIndicator {
  id: number;
  code: string;
  name: string;
  unit: string;
  order: number;
  is_population: boolean;
  /** A column the source already totalled — kept out of any sum computed here. */
  is_aggregate: boolean;
}

export interface SecondaryDataset {
  id: number;
  name: string;
  slug: string;
  description: string;
  source: string;
  year: number | null;
  is_published: boolean;
  indicators: SecondaryIndicator[];
  updated_at: string;
}

/** DRF serializes DecimalField as a string. */
export interface ChoroplethRow {
  kecamatan_id: number;
  kecamatan: string;
  population: string | null;
  value: string | null;
  per_10k: number | null;
}

export interface ChoroplethResponse {
  dataset: SecondaryDataset | null;
  indicator?: string;
  series: ChoroplethRow[];
}

export interface KecamatanIndicatorRow {
  code: string;
  name: string;
  unit: string;
  is_aggregate: boolean;
  male: string | null;
  female: string | null;
  total: string | null;
  per_10k: number | null;
}

export interface KecamatanSecondaryDataset {
  dataset: SecondaryDataset;
  population: string | null;
  indicators: KecamatanIndicatorRow[];
  combined_total: string | null;
  combined_per_10k: number | null;
}

export interface KecamatanSecondary {
  kecamatan: { id: number; name: string; code: string };
  datasets: KecamatanSecondaryDataset[];
}

/** Per-kecamatan values for the map. No `indicator` sums the clinical ones. */
export function useSecondaryChoropleth(indicator?: string, dataset?: string) {
  return useQuery<ChoroplethResponse>({
    queryKey: ['secondary-choropleth', indicator ?? 'gabungan', dataset ?? 'latest'],
    queryFn: async () =>
      apiClient.get<ChoroplethResponse>('/secondary/choropleth/', {
        ...(indicator ? { indicator } : {}),
        ...(dataset ? { dataset } : {}),
      }),
    staleTime: 10 * 60 * 1000, // secondary tables change a few times a year
  });
}

/** Every published indicator for one kecamatan, addressed by name. */
export function useKecamatanSecondary(name?: string) {
  return useQuery<KecamatanSecondary>({
    queryKey: ['secondary-kecamatan', name],
    queryFn: async () => {
      if (!name) throw new Error('Kecamatan name is required');
      return apiClient.get<KecamatanSecondary>(
        `/secondary/kecamatan/${encodeURIComponent(name)}/`
      );
    },
    enabled: !!name,
    retry: false,
    staleTime: 10 * 60 * 1000,
  });
}
