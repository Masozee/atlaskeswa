'use client';

import { useDashboardStats } from '@/hooks/use-analytics';
import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Map, MapControls, MapGeoJSON, MapPopup } from "@/components/ui/map"
import { useState } from 'react'

const breadcrumbs = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Peta Distribusi Layanan' },
];

type KecamatanFeature = {
  properties: {
    kd_propinsi: string;
    kd_dati2: string;
    kd_kecamatan: string;
    nm_kecamatan: string;
  };
};

export default function ServiceDistributionMapPage() {
  const { data: stats, isLoading } = useDashboardStats();
  const [selectedKecamatan, setSelectedKecamatan] = useState<{
    name: string;
    coordinates: [number, number];
  } | null>(null);
  const [hoveredKecamatan, setHoveredKecamatan] = useState<string | null>(null);

  const handleFeatureClick = (feature: GeoJSON.Feature, e: { lngLat: { lng: number; lat: number } }) => {
    const kecamatanFeature = feature as unknown as KecamatanFeature;
    setSelectedKecamatan({
      name: kecamatanFeature.properties.nm_kecamatan,
      coordinates: [e.lngLat.lng, e.lngLat.lat],
    });
  };

  const handleFeatureHover = (feature: GeoJSON.Feature | null) => {
    if (feature) {
      const kecamatanFeature = feature as unknown as KecamatanFeature;
      setHoveredKecamatan(kecamatanFeature.properties.nm_kecamatan);
    } else {
      setHoveredKecamatan(null);
    }
  };

  if (isLoading) {
    return (
      <>
        <PageHeader breadcrumbs={breadcrumbs} />
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <div className="h-16 w-16 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
            <p className="text-sm text-muted-foreground">Memuat peta...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader breadcrumbs={breadcrumbs} />

      <div className="flex flex-1 flex-col gap-4 p-4">
        <div>
          <h1 className="text-2xl font-bold">Peta Distribusi Layanan</h1>
          <p className="text-muted-foreground">Visualisasi geografis layanan kesehatan jiwa di Kabupaten Kebumen</p>
        </div>

        <div className="grid gap-4 lg:grid-cols-4">
          {/* Map */}
          <Card className="lg:col-span-3">
            <CardHeader className="pb-2">
              <CardTitle>Peta Kecamatan Kebumen</CardTitle>
              <CardDescription>
                {hoveredKecamatan
                  ? `Kecamatan: ${hoveredKecamatan}`
                  : 'Klik pada kecamatan untuk melihat detail'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[600px] w-full overflow-hidden rounded-lg border">
                <Map
                  center={[109.6090, -7.6385]}
                  zoom={10}
                  minZoom={9}
                  maxZoom={15}
                >
                  <MapControls position="bottom-right" showZoom showCompass showLocate />
                  <MapGeoJSON
                    data="/data/33.05_kecamatan.geojson"
                    fillColor="#00979D"
                    fillOpacity={0.2}
                    strokeColor="#007A80"
                    strokeWidth={2}
                    strokeOpacity={0.8}
                    onFeatureClick={handleFeatureClick}
                    onFeatureHover={handleFeatureHover}
                  />
                  {selectedKecamatan && (
                    <MapPopup
                      longitude={selectedKecamatan.coordinates[0]}
                      latitude={selectedKecamatan.coordinates[1]}
                      onClose={() => setSelectedKecamatan(null)}
                      closeButton
                    >
                      <div className="space-y-2 min-w-[200px]">
                        <h3 className="font-semibold">Kecamatan {selectedKecamatan.name}</h3>
                        <div className="text-sm text-muted-foreground">
                          <p>Layanan tersedia: -</p>
                          <p>Fasilitas kesehatan: -</p>
                        </div>
                      </div>
                    </MapPopup>
                  )}
                </Map>
              </div>
            </CardContent>
          </Card>

          {/* Statistics */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Statistik Cakupan</CardTitle>
                <CardDescription>Metrik distribusi layanan</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Total Kecamatan</p>
                  <p className="text-3xl font-bold">26</p>
                </div>
                <div className="h-px bg-border" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Layanan</p>
                  <p className="text-3xl font-bold">{stats?.services.total || 0}</p>
                </div>
                <div className="h-px bg-border" />
                <div>
                  <p className="text-sm text-muted-foreground">Layanan Terverifikasi</p>
                  <p className="text-3xl font-bold">{stats?.services.verified || 0}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Kecamatan Teratas</CardTitle>
                <CardDescription>Cakupan layanan tertinggi</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats?.geographic_distribution?.slice(0, 5).map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{item.city}</span>
                      <span className="text-sm text-muted-foreground">{item.count} layanan</span>
                    </div>
                  )) || (
                    <p className="text-sm text-muted-foreground">Belum ada data</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Legenda</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 rounded border-2 border-blue-700 bg-blue-500/20" />
                    <span className="text-sm">Batas Kecamatan</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
