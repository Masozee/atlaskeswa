"use client"

import { useMemo, useState, useEffect } from "react"
import dynamic from "next/dynamic"
import {
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { HugeiconsIcon } from "@hugeicons/react"
import {Location01Icon,
  Hospital01Icon,
  Layers01Icon,
  ViewIcon,} from "@hugeicons/core-free-icons"
import { mockIndonesianServices, getServiceCoordinates } from "@/lib/indonesia-locations"

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
  mtc_code?: string
  bsic_code?: string
  verification_status: string
  total_beds: number | null
  total_staff: number | null
}

export default function MTCLayersPage() {
  const { open } = useSidebar()
  const [selectedLayers, setSelectedLayers] = useState<string[]>([])
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const servicesData = mockIndonesianServices

  // Group services by MTC
  const servicesByMTC = useMemo(() => {
    const grouped = new Map<string, Service[]>()
    servicesData.forEach((service) => {
      const mtcCode = service.mtc_code || "UNKNOWN"
      if (!grouped.has(mtcCode)) {
        grouped.set(mtcCode, [])
      }
      grouped.get(mtcCode)!.push(service)
    })
    return grouped
  }, [])

  // MTC layer configurations with colors
  const mtcLayers = useMemo(() => {
    const colors = [
      { bg: "bg-blue-500", border: "border-blue-500", hex: "#3b82f6" },
      { bg: "bg-green-500", border: "border-green-500", hex: "#22c55e" },
      { bg: "bg-purple-500", border: "border-purple-500", hex: "#a855f7" },
      { bg: "bg-orange-500", border: "border-orange-500", hex: "#f97316" },
      { bg: "bg-pink-500", border: "border-pink-500", hex: "#ec4899" },
      { bg: "bg-cyan-500", border: "border-cyan-500", hex: "#06b6d4" },
      { bg: "bg-yellow-500", border: "border-yellow-500", hex: "#eab308" },
      { bg: "bg-red-500", border: "border-red-500", hex: "#ef4444" },
    ]

    const mtcCodes = Array.from(servicesByMTC.keys()).sort()
    
    return mtcCodes.map((code, index) => ({
      code,
      name: getMTCName(code),
      description: getMTCDescription(code),
      serviceCount: servicesByMTC.get(code)?.length || 0,
      color: colors[index % colors.length],
    }))
  }, [servicesByMTC])

  // Get MTC name and description
  function getMTCName(code: string) {
    const names: Record<string, string> = {
      "R1": "Residential Care - Hospital",
      "R2": "Residential Care - Unit",
      "O1": "Outpatient - Clinic",
      "O2": "Outpatient - Primary Care",
      "O3": "Outpatient - Community Center",
      "O4": "Outpatient - Crisis Service",
    }
    return names[code] || code
  }

  function getMTCDescription(code: string) {
    const descriptions: Record<string, string> = {
      "R1": "Psychiatric hospitals with inpatient beds",
      "R2": "Psychiatric units in general hospitals",
      "O1": "Specialized psychiatric clinics",
      "O2": "Mental health services in primary care",
      "O3": "Community mental health centers",
      "O4": "Crisis intervention and emergency services",
    }
    return descriptions[code] || "Mental health service"
  }

  // Toggle layer visibility
  const toggleLayer = (code: string) => {
    setSelectedLayers((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    )
  }

  // Get visible services based on selected layers
  const visibleServices = useMemo(() => {
    if (selectedLayers.length === 0) return servicesData
    return servicesData.filter((service) =>
      selectedLayers.includes(service.mtc_code || "UNKNOWN")
    )
  }, [selectedLayers])

  // Prepare markers for Leaflet
  const mapMarkers = useMemo(() => {
    return visibleServices
      .map((service) => {
        const coords = getServiceCoordinates(service)
        if (!coords) return null

        const layer = mtcLayers.find((l) => l.code === service.mtc_code)
        const color = layer?.color.hex || "#6b7280"

        return {
          id: service.id,
          position: [coords.lat, coords.lng] as [number, number],
          color,
          popup: `
            <div style="min-width: 200px;">
              <strong>${service.service_name}</strong><br/>
              <span style="font-size: 12px; color: #666;">
                ${service.city}, ${service.province}<br/>
                MTC: ${service.mtc_code || "-"}<br/>
                Type: ${getMTCName(service.mtc_code || "")}
              </span>
            </div>
          `,
          onClick: () => setSelectedService(service),
        }
      })
      .filter((m): m is NonNullable<typeof m> => m !== null)
  }, [visibleServices, mtcLayers])

  // Statistics
  const stats = useMemo(() => {
    return {
      total: servicesData.length,
      visible: visibleServices.length,
      layers: mtcLayers.length,
    }
  }, [visibleServices, mtcLayers])

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="/map">Map</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>MTC Layer View</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        {/* Statistics Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Services</CardTitle>
              <HugeiconsIcon icon={Hospital01Icon} size={16} className="text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">All MTC categories</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Visible Services</CardTitle>
              <HugeiconsIcon icon={ViewIcon} size={16} className="text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.visible}</div>
              <p className="text-xs text-muted-foreground">
                {selectedLayers.length === 0 ? "All layers shown" : `${selectedLayers.length} layer(s) active`}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">MTC Layers</CardTitle>
              <HugeiconsIcon icon={Layers01Icon} size={16} className="text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.layers}</div>
              <p className="text-xs text-muted-foreground">Main Types of Care</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Layers</CardTitle>
              <HugeiconsIcon icon={Layers01Icon} size={16} className="text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {selectedLayers.length === 0 ? stats.layers : selectedLayers.length}
              </div>
              <p className="text-xs text-muted-foreground">Currently displayed</p>
            </CardContent>
          </Card>
        </div>

        {/* Map and Layer Controls */}
        <div className="grid gap-4 md:grid-cols-4">
          {/* Layer Controls */}
          <Card>
            <CardHeader>
              <CardTitle>Layer Controls</CardTitle>
              <CardDescription>Toggle MTC categories to filter map view</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mtcLayers.map((layer) => (
                  <div key={layer.code} className="flex items-start space-x-3 p-2 rounded-lg hover:bg-accent">
                    <Checkbox
                      id={layer.code}
                      checked={selectedLayers.length === 0 || selectedLayers.includes(layer.code)}
                      onCheckedChange={() => toggleLayer(layer.code)}
                    />
                    <div className="flex-1 grid gap-1.5 leading-none">
                      <Label
                        htmlFor={layer.code}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${layer.color.bg}`}></div>
                          <span>{layer.code}</span>
                        </div>
                      </Label>
                      <p className="text-xs text-muted-foreground">{layer.name}</p>
                      <Badge variant="outline" className="w-fit text-xs">
                        {layer.serviceCount} services
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>

              {selectedLayers.length > 0 && (
                <button
                  onClick={() => setSelectedLayers([])}
                  className="mt-4 w-full text-sm text-muted-foreground hover:text-foreground underline"
                >
                  Show all layers
                </button>
              )}
            </CardContent>
          </Card>

          {/* Map */}
          <Card className="md:col-span-3">
            <CardHeader>
              <CardTitle>MTC Layer Visualization</CardTitle>
              <CardDescription>
                Services color-coded by Main Type of Care (MTC) classification
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative w-full h-[600px] rounded-lg overflow-hidden border border-border">
                {mounted && (
                  <LeafletMap center={[-2.5, 118]} zoom={5} markers={mapMarkers} className="h-full w-full" />
                )}
              </div>

              {/* Legend */}
              <div className="mt-4 p-3 bg-muted rounded-lg">
                <div className="text-xs font-medium mb-2">Active Layers</div>
                <div className="flex gap-4 flex-wrap">
                  {mtcLayers
                    .filter((layer) => selectedLayers.length === 0 || selectedLayers.includes(layer.code))
                    .map((layer) => (
                      <div key={layer.code} className="flex items-center gap-2 text-xs">
                        <div className={`w-3 h-3 rounded-full ${layer.color.bg}`}></div>
                        <span>
                          {layer.code} ({layer.serviceCount})
                        </span>
                      </div>
                    ))}
                </div>
              </div>

              {/* Selected service info */}
              {selectedService && (
                <div className="mt-4 p-4 bg-card border border-border rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold">{selectedService.service_name}</h3>
                    <button
                      onClick={() => setSelectedService(null)}
                      className="text-xs text-muted-foreground hover:text-foreground"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{selectedService.mtc_code}</Badge>
                      <Badge variant="outline">{selectedService.bsic_code}</Badge>
                    </div>
                    <p className="text-muted-foreground">
                      {selectedService.city}, {selectedService.province}
                    </p>
                    <p className="text-muted-foreground">{getMTCName(selectedService.mtc_code || "")}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* MTC Category Summary */}
        <Card>
          <CardHeader>
            <CardTitle>MTC Category Distribution</CardTitle>
            <CardDescription>Service count by Main Type of Care</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {mtcLayers.map((layer) => (
                <div
                  key={layer.code}
                  className={`p-4 rounded-lg border-2 ${layer.color.border} ${
                    selectedLayers.length > 0 && !selectedLayers.includes(layer.code)
                      ? "opacity-30"
                      : ""
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-3 h-3 rounded-full ${layer.color.bg}`}></div>
                    <h3 className="font-semibold text-sm">{layer.code}</h3>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">{layer.name}</p>
                  <div className="text-2xl font-bold">{layer.serviceCount}</div>
                  <p className="text-xs text-muted-foreground">services</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
