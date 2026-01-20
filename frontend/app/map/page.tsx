"use client"

import { useMemo, useState, useEffect, Suspense } from "react"
import dynamic from "next/dynamic"
import { useQuery } from "@tanstack/react-query"
import { apiClient } from "@/lib/api-client"
import { PageHeader, BreadcrumbItemType } from "@/components/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { HugeiconsIcon } from "@hugeicons/react"
import {Location01Icon,
  Hospital01Icon,
  Search01Icon,} from "@hugeicons/core-free-icons"
import { mockIndonesianServices, getServiceCoordinates } from "@/lib/indonesia-locations"

// Dynamically import Leaflet map to avoid SSR issues
const LeafletMap = dynamic(() => import("@/components/leaflet-map").then((mod) => mod.LeafletMap), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center bg-slate-100">
      <p className="text-muted-foreground">Loading map...</p>
    </div>
  ),
})

interface Service {
  id: number
  service_name: string
  province: string
  city: string
  address?: string
  mtc_code?: string
  bsic_code?: string
  verification_status: string
  total_beds: number | null
  total_staff: number | null
}

const breadcrumbs: BreadcrumbItemType[] = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Service Location Map' },
]

export default function ServiceLocationMapPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Use mock data for now (fallback to API if available)
  const servicesData = mockIndonesianServices

  // Statistics
  const stats = useMemo(() => {
    const provinces = new Set(servicesData.map((s) => s.province))
    const cities = new Set(servicesData.map((s) => s.city))
    const verified = servicesData.filter((s) => s.verification_status === "VERIFIED").length

    return {
      totalServices: servicesData.length,
      provinces: provinces.size,
      cities: cities.size,
      verified,
    }
  }, [])

  // Filter services based on search
  const filteredServices = useMemo(() => {
    if (!searchQuery) return servicesData

    const query = searchQuery.toLowerCase()
    return servicesData.filter(
      (service) =>
        service.service_name.toLowerCase().includes(query) ||
        service.province.toLowerCase().includes(query) ||
        service.city.toLowerCase().includes(query)
    )
  }, [searchQuery])

  // Prepare markers for Leaflet with real Indonesian coordinates
  const mapMarkers = useMemo(() => {
    return filteredServices
      .map((service) => {
        const coords = getServiceCoordinates(service)
        if (!coords) return null

        const color =
          service.verification_status === "VERIFIED"
            ? "#22c55e"
            : service.verification_status === "SUBMITTED"
            ? "#3b82f6"
            : "#ef4444"

        return {
          id: service.id,
          position: [coords.lat, coords.lng] as [number, number],
          color,
          popup: `
            <div style="min-width: 200px;">
              <strong>${service.service_name}</strong><br/>
              <span style="font-size: 12px; color: #666;">
                ${service.city}, ${service.province}<br/>
                MTC: ${service.mtc_code || "-"} | BSIC: ${service.bsic_code || "-"}<br/>
                Status: ${service.verification_status}
              </span>
            </div>
          `,
          onClick: () => setSelectedService(service),
        }
      })
      .filter((m): m is NonNullable<typeof m> => m !== null)
  }, [filteredServices])

  return (
    <>
      <PageHeader breadcrumbs={breadcrumbs} />

      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        {/* Statistics Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Services</CardTitle>
              <HugeiconsIcon icon={Hospital01Icon} size={16} className="text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalServices}</div>
              <p className="text-xs text-muted-foreground">Services mapped</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Provinces</CardTitle>
              <HugeiconsIcon icon={Location01Icon} size={16} className="text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.provinces}</div>
              <p className="text-xs text-muted-foreground">Geographic coverage</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cities</CardTitle>
              <HugeiconsIcon icon={Location01Icon} size={16} className="text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.cities}</div>
              <p className="text-xs text-muted-foreground">City-level data</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Verified</CardTitle>
              <HugeiconsIcon icon={Hospital01Icon} size={16} className="text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.verified}</div>
              <p className="text-xs text-muted-foreground">
                {stats.totalServices > 0
                  ? `${((stats.verified / stats.totalServices) * 100).toFixed(1)}% verified`
                  : "No data"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Map and Service List */}
        <div className="grid gap-4 md:grid-cols-3">
          {/* Map Container */}
          <Card className="md:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Interactive Service Map</CardTitle>
                  <CardDescription>Mental health services across Indonesia</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="relative w-full h-[600px] rounded-lg overflow-hidden border border-border">
                {mounted && (
                  <LeafletMap center={[-2.5, 118]} zoom={5} markers={mapMarkers} className="h-full w-full" />
                )}
              </div>

              {/* Legend */}
              <div className="mt-4 p-3 bg-muted rounded-lg">
                <div className="text-xs font-medium mb-2">Status</div>
                <div className="flex gap-4">
                  <div className="flex items-center gap-2 text-xs">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span>Verified ({servicesData.filter((s) => s.verification_status === "VERIFIED").length})</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <span>Submitted ({servicesData.filter((s) => s.verification_status === "SUBMITTED").length})</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <span>Rejected ({servicesData.filter((s) => s.verification_status === "REJECTED").length})</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Service Details Sidebar */}
          <Card>
            <CardHeader>
              <CardTitle>Service Details</CardTitle>
              <CardDescription>
                {selectedService ? "Selected service information" : "Click a marker to view details"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Search */}
              <div className="relative mb-4">
                <HugeiconsIcon icon={Search01Icon} size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search services..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              {/* Selected service details */}
              {selectedService ? (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">{selectedService.service_name}</h3>
                    <Badge
                      variant={selectedService.verification_status === "VERIFIED" ? "default" : "secondary"}
                    >
                      {selectedService.verification_status}
                    </Badge>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Location:</span>
                      <p className="font-medium">
                        {selectedService.city}, {selectedService.province}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">MTC Code:</span>
                      <p className="font-medium">{selectedService.mtc_code || "-"}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">BSIC Code:</span>
                      <p className="font-medium">{selectedService.bsic_code || "-"}</p>
                    </div>
                    {selectedService.total_beds !== null && (
                      <div>
                        <span className="text-muted-foreground">Beds:</span>
                        <p className="font-medium">{selectedService.total_beds}</p>
                      </div>
                    )}
                    {selectedService.total_staff !== null && (
                      <div>
                        <span className="text-muted-foreground">Staff:</span>
                        <p className="font-medium">{selectedService.total_staff}</p>
                      </div>
                    )}
                  </div>

                  <Button className="w-full" onClick={() => setSelectedService(null)}>
                    Clear Selection
                  </Button>
                </div>
              ) : (
                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                  {filteredServices.slice(0, 20).map((service) => (
                    <button
                      key={service.id}
                      onClick={() => setSelectedService(service)}
                      className="w-full text-left p-3 rounded-lg border border-border hover:bg-accent transition-colors"
                    >
                      <div className="font-medium text-sm mb-1">{service.service_name}</div>
                      <div className="text-xs text-muted-foreground">
                        {service.city}, {service.province}
                      </div>
                      <div className="mt-1">
                        <Badge variant="outline" className="text-xs">
                          {service.mtc_code}
                        </Badge>
                      </div>
                    </button>
                  ))}
                  {filteredServices.length > 20 && (
                    <p className="text-xs text-muted-foreground text-center py-2">
                      Showing 20 of {filteredServices.length} services. Use search to filter.
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}
