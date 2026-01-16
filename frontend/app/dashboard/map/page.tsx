'use client';

import { useDashboardStats } from '@/hooks/use-analytics';
import { DateTime } from "@/components/date-time"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Map, MapControls, MapMarker, MarkerContent, MarkerPopup, MarkerLabel } from "@/components/ui/map"
import { useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

// Indonesia province coordinates (sample data)
const provinceCoordinates: { [key: string]: [number, number] } = {
  'DI Yogyakarta': [-7.7956, 110.3695],
  'Jawa Tengah': [-7.1508, 110.1403],
  'Jawa Timur': [-7.5361, 112.2384],
  'DKI Jakarta': [-6.2088, 106.8456],
  'Jawa Barat': [-6.9175, 107.6191],
  'Bali': [-8.3405, 115.0920],
  'Sumatera Utara': [3.5952, 98.6722],
  'Sulawesi Selatan': [-5.1477, 119.4327],
};

export default function ServiceDistributionMapPage() {
  const { data: stats, isLoading } = useDashboardStats();

  const provinceData = useMemo(() => {
    if (!stats?.geographic_distribution) return [];

    return stats.geographic_distribution.map(item => ({
      province: item.province,
      count: item.count,
      coordinates: provinceCoordinates[item.province] || [-2.5489, 118.0149], // Default to Indonesia center
    }));
  }, [stats]);

  const chartData = stats?.geographic_distribution.slice(0, 8).map((item) => ({
    name: item.province,
    services: item.count,
  }));

  if (isLoading) {
    return (
      <>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Service Distribution Map</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div className="ml-auto">
            <DateTime />
          </div>
        </header>
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
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Service Distribution Map</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="ml-auto">
          <DateTime />
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-4">
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
            <Separator />
            <CardContent>
              <div className="h-[500px] w-full overflow-hidden rounded-lg">
                <Map center={[118.0149, -2.5489]} zoom={5}>
                  <MapControls position="bottom-right" showZoom showCompass showLocate />
                  {provinceData.map((location, idx) => {
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
                            <p className="font-semibold text-sm">{location.province}</p>
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
              <Separator />
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Total Provinces Covered</p>
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
                <CardTitle>Top Provinces</CardTitle>
                <CardDescription>Highest service coverage</CardDescription>
              </CardHeader>
              <Separator />
              <CardContent>
                <div className="space-y-3">
                  {stats?.geographic_distribution.slice(0, 5).map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{item.province}</span>
                      <span className="text-sm text-muted-foreground">{item.count} services</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Province Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Provincial Distribution</CardTitle>
            <CardDescription>Number of mental health services by province</CardDescription>
          </CardHeader>
          <Separator />
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="name"
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Bar
                  dataKey="services"
                  fill="hsl(var(--primary))"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
