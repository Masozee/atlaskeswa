"use client"

import { useMemo, useState, useEffect } from "react"
import dynamic from "next/dynamic"
import { PageHeader, BreadcrumbItemType } from "@/components/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { HugeiconsIcon } from "@hugeicons/react"
import {Location01Icon,
  Hospital01Icon,
  Search01Icon,
  FilterIcon,} from "@hugeicons/core-free-icons"
import { mockIndonesianServices, getServiceCoordinates } from "@/lib/indonesia-locations"

// Facility types based on service name patterns
const FACILITY_TYPES = [
  { value: "all", label: "Semua Fasilitas" },
  { value: "rs_jiwa", label: "RS Jiwa" },
  { value: "rsud", label: "RSUD/RSU" },
  { value: "puskesmas", label: "Puskesmas" },
  { value: "klinik", label: "Klinik" },
  { value: "other", label: "Lainnya" },
]

// Service types based on MTC code
const SERVICE_TYPES = [
  { value: "all", label: "Semua Jenis Layanan" },
  { value: "R1", label: "R1 - RS Jiwa Khusus" },
  { value: "R2", label: "R2 - RS Umum dengan Unit Jiwa" },
  { value: "O1", label: "O1 - Klinik Psikologi" },
  { value: "O2", label: "O2 - Puskesmas" },
  { value: "O3", label: "O3 - Pusat Kesehatan Jiwa" },
  { value: "O4", label: "O4 - Layanan Krisis" },
]

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

  // Filter states
  const [facilityFilter, setFacilityFilter] = useState("all")
  const [serviceTypeFilter, setServiceTypeFilter] = useState("all")
  const [regionFilter, setRegionFilter] = useState("all")

  useEffect(() => {
    setMounted(true)
  }, [])

  // Use mock data for now (fallback to API if available)
  const servicesData = mockIndonesianServices

  // Get unique regions (cities) for filter dropdown
  const regions = useMemo(() => {
    const cities = [...new Set(servicesData.map((s) => s.city))].sort()
    return [{ value: "all", label: "Semua Kecamatan/Kota" }, ...cities.map((c) => ({ value: c, label: c }))]
  }, [])

  // Helper function to determine facility type from service name
  const getFacilityType = (serviceName: string): string => {
    const name = serviceName.toLowerCase()
    if (name.includes("rs jiwa") || name.includes("rsj")) return "rs_jiwa"
    if (name.includes("rsud") || name.includes("rsu ") || name.includes("rsup")) return "rsud"
    if (name.includes("puskesmas")) return "puskesmas"
    if (name.includes("klinik")) return "klinik"
    return "other"
  }

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

  // Filter services based on search and filters
  const filteredServices = useMemo(() => {
    return servicesData.filter((service) => {
      // Search query filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchesSearch =
          service.service_name.toLowerCase().includes(query) ||
          service.province.toLowerCase().includes(query) ||
          service.city.toLowerCase().includes(query)
        if (!matchesSearch) return false
      }

      // Facility type filter
      if (facilityFilter !== "all") {
        const facilityType = getFacilityType(service.service_name)
        if (facilityType !== facilityFilter) return false
      }

      // Service type filter (MTC code)
      if (serviceTypeFilter !== "all") {
        if (service.mtc_code !== serviceTypeFilter) return false
      }

      // Region filter
      if (regionFilter !== "all") {
        if (service.city !== regionFilter) return false
      }

      return true
    })
  }, [searchQuery, facilityFilter, serviceTypeFilter, regionFilter])

  // Reset all filters
  const resetFilters = () => {
    setFacilityFilter("all")
    setServiceTypeFilter("all")
    setRegionFilter("all")
    setSearchQuery("")
  }

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
            ? "#00979D"
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
        <div className="grid gap-4 grid-cols-12">
          {/* Filter Panel - Left Side (2/12) */}
          <Card className="col-span-12 md:col-span-2">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <HugeiconsIcon icon={FilterIcon} size={18} />
                  Filter
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={resetFilters} className="text-xs h-7">
                  Reset
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Facility Type Filter */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Fasilitas</Label>
                <Select value={facilityFilter} onValueChange={setFacilityFilter}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Pilih fasilitas" />
                  </SelectTrigger>
                  <SelectContent>
                    {FACILITY_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Service Type Filter */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Jenis Layanan</Label>
                <Select value={serviceTypeFilter} onValueChange={setServiceTypeFilter}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Pilih jenis layanan" />
                  </SelectTrigger>
                  <SelectContent>
                    {SERVICE_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Region Filter */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Kecamatan/Kota</Label>
                <Select value={regionFilter} onValueChange={setRegionFilter}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Pilih kecamatan" />
                  </SelectTrigger>
                  <SelectContent>
                    {regions.map((region) => (
                      <SelectItem key={region.value} value={region.value}>
                        {region.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Filter Summary */}
              <div className="pt-2 border-t">
                <p className="text-xs text-muted-foreground">
                  Menampilkan {filteredServices.length} dari {servicesData.length} layanan
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Map Container (7/12) */}
          <Card className="col-span-12 md:col-span-7">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Peta Layanan Kesehatan Jiwa</CardTitle>
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
                    <span>Verified ({filteredServices.filter((s) => s.verification_status === "VERIFIED").length})</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <span>Submitted ({filteredServices.filter((s) => s.verification_status === "SUBMITTED").length})</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <span>Rejected ({filteredServices.filter((s) => s.verification_status === "REJECTED").length})</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Service Details Sidebar (3/12) */}
          <Card className="col-span-12 md:col-span-3">
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
