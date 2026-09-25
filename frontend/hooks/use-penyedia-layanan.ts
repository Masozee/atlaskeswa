import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export type ServiceTypeKey = 'R' | 'D' | 'O' | 'A' | 'I';

/** A bucket-table cell: facilities offering it, and their summed capacity or beneficiaries. */
export interface BucketCell {
  fasilitas: number;
  jumlah: number;
}

export type BucketRow<C extends string> = { provider: string } & Record<C, BucketCell>;

export interface BucketTable<C extends string> {
  rows: BucketRow<C>[];
  total: Record<C, BucketCell>;
}

export interface AvailabilityCell {
  tersedia: boolean;
  kapasitas: number;
}

export interface RawatInapRow {
  id: number;
  name: string;
  akut: AvailabilityCell;
  non_akut: AvailabilityCell;
}

export interface PerawatanHarianRow {
  id: number;
  name: string;
  akut: AvailabilityCell;
  non_akut: {
    pekerjaan: boolean;
    persiapan_kerja: boolean;
    terstruktur: boolean;
    tidak_terstruktur: boolean;
    kapasitas: number;
  };
}

export type RawatJalanColumn =
  | 'akut_kunjungan'
  | 'akut_fasilitas'
  | 'non_akut_kunjungan'
  | 'non_akut_fasilitas';
export type AksesibilitasColumn =
  | 'komunikasi'
  | 'mobilitas'
  | 'pendamping'
  | 'manajemen_kasus'
  | 'lainnya';
export type InformasiTopikColumn = 'kesehatan' | 'pendidikan' | 'sosial' | 'pekerjaan' | 'lainnya';
export type InformasiSaluranColumn = 'tatap_muka' | 'media_sosial' | 'non_interaktif';

/**
 * Published facilities counted by provider bucket and DESDE-LTC service type.
 * The backend owns both mappings (Q4 type -> bucket, DESDE code -> column), so
 * the page renders this as-is.
 */
export interface PenyediaLayananSummary {
  total_facilities: number;
  providers: { key: string; label: string }[];
  service_types: { key: ServiceTypeKey; label: string }[];
  /** Every published survey, as the chart counts them (the tables count facilities). */
  total_surveys: number;
  /**
   * Per Q4 facility type as answered (casing varies), over every survey: its
   * total and how many of those offer each service type.
   */
  chart: ({ facility_type: string; total: number } & Record<ServiceTypeKey, number>)[];
  rawat_inap: RawatInapRow[];
  perawatan_harian: PerawatanHarianRow[];
  rawat_jalan: BucketTable<RawatJalanColumn>;
  aksesibilitas: BucketTable<AksesibilitasColumn>;
  informasi_topik: BucketTable<InformasiTopikColumn>;
  informasi_saluran: BucketTable<InformasiSaluranColumn>;
}

export function usePenyediaLayanan() {
  return useQuery<PenyediaLayananSummary>({
    queryKey: ['penyedia-layanan-summary'],
    queryFn: async () =>
      apiClient.get<PenyediaLayananSummary>('/surveys/responses/penyedia-layanan/'),
    staleTime: 5 * 60 * 1000, // same cadence as the map points it is counted from
  });
}
