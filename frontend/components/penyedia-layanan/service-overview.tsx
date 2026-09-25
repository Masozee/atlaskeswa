'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePenyediaLayanan } from '@/hooks/use-penyedia-layanan';
import { ServiceChart } from './service-chart';
import { BucketTableView, PerawatanHarianTable, RawatInapTable } from './service-tables';
import { SERVICE_TYPES } from './service-types';

const color = (key: string) => SERVICE_TYPES.find((type) => type.key === key)!.color;

function Skeleton() {
  return (
    <div className="animate-pulse space-y-4" aria-hidden>
      <div className="h-6 w-2/3 rounded bg-muted" />
      <div className="h-80 rounded bg-muted" />
    </div>
  );
}

/** The kabupaten-wide chart and one table per service type, above the list. */
export function ServiceOverview() {
  const { data: summary, isLoading, isError } = usePenyediaLayanan();

  if (isLoading) return <Skeleton />;
  if (isError || !summary) {
    return (
      <p className="text-[15px] text-foreground/80">
        Ringkasan layanan gagal dimuat. Coba muat ulang halaman ini.
      </p>
    );
  }

  return (
    <div className="space-y-10">
      <ServiceChart summary={summary} />

      <Tabs defaultValue={SERVICE_TYPES[0].tab} className="gap-4 min-w-0 [&>*]:min-w-0">
        <div className="-mx-4 overflow-x-auto px-4">
          <TabsList className="rounded-sm">
            {SERVICE_TYPES.map((type) => (
              <TabsTrigger key={type.tab} value={type.tab} className="rounded-sm px-3 gap-2">
                <span className="h-2 w-2 rounded-[2px]" style={{ background: type.color }} aria-hidden />
                {type.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <TabsContent value="rawat-inap">
          <RawatInapTable summary={summary} color={color('R')} />
        </TabsContent>
        <TabsContent value="perawatan-harian">
          <PerawatanHarianTable summary={summary} color={color('D')} />
        </TabsContent>
        <TabsContent value="rawat-jalan">
          <BucketTableView
            summary={summary}
            table={summary.rawat_jalan}
            measure="Kapasitas"
            color={color('O')}
            groups={[
              {
                label: 'Akut',
                columns: [
                  { key: 'akut_kunjungan', label: 'Berbasis kunjungan' },
                  { key: 'akut_fasilitas', label: 'Berbasis fasilitas' },
                ],
              },
              {
                label: 'Non akut',
                columns: [
                  { key: 'non_akut_kunjungan', label: 'Berbasis kunjungan' },
                  { key: 'non_akut_fasilitas', label: 'Berbasis fasilitas' },
                ],
              },
            ]}
          />
        </TabsContent>
        <TabsContent value="aksesibilitas">
          <BucketTableView
            summary={summary}
            table={summary.aksesibilitas}
            measure="Pemanfaat"
            color={color('A')}
            groups={[
              { label: 'Komunikasi', columns: [{ key: 'komunikasi' }] },
              { label: 'Mobilitas', columns: [{ key: 'mobilitas' }] },
              { label: 'Pendamping berbayar', columns: [{ key: 'pendamping' }] },
              { label: 'Manajemen kasus', columns: [{ key: 'manajemen_kasus' }] },
              { label: 'Lainnya', columns: [{ key: 'lainnya' }] },
            ]}
          />
        </TabsContent>
        <TabsContent value="informasi" className="space-y-6">
          <BucketTableView
            summary={summary}
            table={summary.informasi_topik}
            measure="Pemanfaat"
            color={color('I')}
            groups={[
              { label: 'Kesehatan', columns: [{ key: 'kesehatan' }] },
              { label: 'Pendidikan', columns: [{ key: 'pendidikan' }] },
              { label: 'Sosial', columns: [{ key: 'sosial' }] },
              { label: 'Pekerjaan', columns: [{ key: 'pekerjaan' }] },
              { label: 'Lainnya', columns: [{ key: 'lainnya' }] },
            ]}
          />
          <BucketTableView
            summary={summary}
            table={summary.informasi_saluran}
            measure="Pemanfaat"
            color={color('I')}
            groups={[
              {
                label: 'Interaktif',
                columns: [
                  { key: 'tatap_muka', label: 'Tatap muka' },
                  { key: 'media_sosial', label: 'Media sosial' },
                ],
              },
              { label: 'Non interaktif', columns: [{ key: 'non_interaktif' }] },
            ]}
          />
        </TabsContent>
      </Tabs>

      <p className="text-sm text-muted-foreground max-w-[70ch]">
        Grafik menghitung seluruh {summary.total_surveys} survei, sama seperti beranda. Tabel
        menghitung {summary.total_facilities} fasilitas: fasilitas yang disurvei lebih dari sekali
        dihitung dari survei terakhirnya. Satu fasilitas dapat masuk ke lebih dari satu kelompok
        penyedia.
      </p>
    </div>
  );
}
