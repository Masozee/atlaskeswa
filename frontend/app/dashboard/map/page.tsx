'use client';

import { useDashboardStats } from '@/hooks/use-analytics';
import { PageHeader } from "@/components/page-header"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Map, MapControls, MapMarker, MarkerContent, MarkerPopup, MarkerLabel } from "@/components/ui/map"
import { useMemo } from 'react'

// City/region coordinates (sample data)
const cityCoordinates: { [key: string]: [number, number] } = {
  'DI Yogyakarta': [-7.7956, 110.3695],
  'Jawa Tengah': [-7.1508, 110.1403],
  'Jawa Timur': [-7.5361, 112.2384],
  'DKI Jakarta': [-6.2088, 106.8456],
  'Jawa Barat': [-6.9175, 107.6191],
  'Bali': [-8.3405, 115.0920],
  'Sumatera Utara': [3.5952, 98.6722],
  'Sulawesi Selatan': [-5.1477, 119.4327],
  'Kebumen': [-7.6680, 109.6523],
};

const breadcrumbs = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Service Distribution Map' },
];

export default function ServiceDistributionMapPage() {
  const { data: stats, isLoading } = useDashboardStats();

  const locationData = useMemo(() => {
    if (!stats?.geographic_distribution) return [];

    return stats.geographic_distribution.map(item => ({
      city: item.city,
      count: item.count,
      coordinates: cityCoordinates[item.city] || [-2.5489, 118.0149], // Default to Indonesia center
    }));
  }, [stats]);

  // Fallback data if API returns empty - sorted by services descending
  const fallbackChartData = [
    { name: 'DKI Jakarta', services: 45 },
    { name: 'Jawa Barat', services: 38 },
    { name: 'Jawa Tengah', services: 32 },
    { name: 'Jawa Timur', services: 28 },
    { name: 'DI Yogyakarta', services: 22 },
    { name: 'Bali', services: 15 },
    { name: 'Sumatera Utara', services: 12 },
    { name: 'Sulawesi Selatan', services: 8 },
  ];

  const chartData = stats?.geographic_distribution?.length
    ? stats.geographic_distribution.slice(0, 8).map((item) => ({
        name: item.city,
        services: item.count,
      }))
    : fallbackChartData;

  if (isLoading) {
    return (
      <>
        <PageHeader breadcrumbs={breadcrumbs} />
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <div className="h-16 w-16 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
            <p className="text-sm text-muted-foreground">Loading map...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader breadcrumbs={breadcrumbs} />

      <div className="flex flex-1 flex-col gap-4 p-8">
        <div>
          <h1 className="text-2xl font-bold">Service Distribution Map</h1>
          <p className="text-muted-foreground">Geographic visualization of mental health services across Indonesia</p>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {/* Map */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Indonesia Service Coverage</CardTitle>
              <CardDescription>Mental health service locations by province</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[500px] w-full overflow-hidden rounded-lg">
                <Map center={[118.0149, -2.5489]} zoom={5}>
                  <MapControls position="bottom-right" showZoom showCompass showLocate />
                  {locationData.map((location, idx) => {
                    const markerSize = Math.sqrt(location.count) * 6;
                    return (
                      <MapMarker
                        key={idx}
                        longitude={location.coordinates[1]}
                        latitude={location.coordinates[0]}
                      >
                        <MarkerContent>
                          <div
                            className="rounded-full bg-primary/60 border-2 border-primary shadow-lg backdrop-blur-sm"
                            style={{
                              width: `${markerSize}px`,
                              height: `${markerSize}px`
                            }}
                          />
                        </MarkerContent>
                        <MarkerPopup>
                          <div className="space-y-1">
                            <p className="font-semibold text-sm">{location.city}</p>
                            <p className="text-xs text-muted-foreground">
                              {location.count} {location.count === 1 ? 'service' : 'services'}
                            </p>
                          </div>
                        </MarkerPopup>
                      </MapMarker>
                    );
                  })}
                </Map>
              </div>
              <p className="text-xs text-muted-foreground mt-4 px-4">
                Circle size represents the number of mental health services available in each province. Click markers for details.
              </p>
            </CardContent>
          </Card>

          {/* Statistics */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Coverage Statistics</CardTitle>
                <CardDescription>Service distribution metrics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Total Cities Covered</p>
                  <p className="text-3xl font-bold">{stats?.geographic_distribution.length || 0}</p>
                </div>
                <Separator />
                <div>
                  <p className="text-sm text-muted-foreground">Total Services</p>
                  <p className="text-3xl font-bold">{stats?.services.total || 0}</p>
                </div>
                <Separator />
                <div>
                  <p className="text-sm text-muted-foreground">Verified Services</p>
                  <p className="text-3xl font-bold">{stats?.services.verified || 0}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Cities</CardTitle>
                <CardDescription>Highest service coverage</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats?.geographic_distribution.slice(0, 5).map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{item.city}</span>
                      <span className="text-sm text-muted-foreground">{item.count} services</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

      </div>
    </>
  );
}
