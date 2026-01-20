"use client"

import { useMemo, useState, useEffect } from "react"
import dynamic from "next/dynamic"
import { PageHeader, BreadcrumbItemType } from "@/components/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { HugeiconsIcon } from "@hugeicons/react"
import {Location01Icon,
  Hospital01Icon,} from "@hugeicons/core-free-icons"
import { mockIndonesianServices, indonesiaLocations } from "@/lib/indonesia-locations"

const LeafletHeatmap = dynamic(() => import("@/components/leaflet-heatmap").then((mod) => mod.LeafletHeatmap), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center bg-slate-100">
      <p className="text-muted-foreground">Loading heatmap...</p>
    </div>
  ),
})

type HeatmapMode = "density" | "capacity" | "staffing"

const breadcrumbs: BreadcrumbItemType[] = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Map', href: '/map' },
  { label: 'Heatmap' },
]

export default function HeatmapPage() {
  const [heatmapMode, setHeatmapMode] = useState<HeatmapMode>("density")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const servicesData = mockIndonesianServices

  // Calculate heatmap data by province
  const heatmapData = useMemo(() => {
    const provinceData: Record<string, { count: number; beds: number; staff: number }> = {}

    servicesData.forEach((service) => {
      if (!provinceData[service.province]) {
        provinceData[service.province] = { count: 0, beds: 0, staff: 0 }
      }
      provinceData[service.province].count += 1
      provinceData[service.province].beds += service.total_beds || 0
      provinceData[service.province].staff += service.total_staff || 0
    })

    // Get max value for normalization
    const maxValue = Math.max(
      ...Object.values(provinceData).map((d) => {
        switch (heatmapMode) {
          case "density":
            return d.count
          case "capacity":
            return d.beds
          case "staffing":
            return d.staff
          default:
            return d.count
        }
      })
    )

    // Convert to heatmap points
    return Object.entries(provinceData)
      .map(([province, data]) => {
        const location = indonesiaLocations[province]
        if (!location) return null

        const value =
          heatmapMode === "density" ? data.count : heatmapMode === "capacity" ? data.beds : data.staff

        return {
          lat: location.lat,
          lng: location.lng,
          intensity: value / maxValue,
        }
      })
      .filter((d): d is NonNullable<typeof d> => d !== null)
  }, [heatmapMode])

  // Regional statistics
  const regionalStats = useMemo(() => {
    const stats: Record<
      string,
      { name: string; count: number; beds: number; staff: number; bedsPerService: number; staffPerService: number }
    > = {}

    servicesData.forEach((service) => {
      if (!stats[service.province]) {
        stats[service.province] = {
          name: service.province,
          count: 0,
          beds: 0,
          staff: 0,
          bedsPerService: 0,
          staffPerService: 0,
        }
      }
      stats[service.province].count += 1
      stats[service.province].beds += service.total_beds || 0
      stats[service.province].staff += service.total_staff || 0
    })

    // Calculate averages
    Object.values(stats).forEach((stat) => {
      stat.bedsPerService = stat.count > 0 ? stat.beds / stat.count : 0
      stat.staffPerService = stat.count > 0 ? stat.staff / stat.count : 0
    })

    return Object.values(stats).sort((a, b) => {
      const aValue = heatmapMode === "density" ? a.count : heatmapMode === "capacity" ? a.beds : a.staff
      const bValue = heatmapMode === "density" ? b.count : heatmapMode === "capacity" ? b.beds : b.staff
      return bValue - aValue
    })
  }, [heatmapMode])

  // Statistics
  const stats = useMemo(() => {
    const totalServices = servicesData.length
    const totalBeds = servicesData.reduce((sum, s) => sum + (s.total_beds || 0), 0)
    const totalStaff = servicesData.reduce((sum, s) => sum + (s.total_staff || 0), 0)
    const regions = new Set(servicesData.map((s) => s.province)).size

    return {
      totalServices,
      totalBeds,
      totalStaff,
      regions,
    }
  }, [])

  return (
    <>
      <PageHeader breadcrumbs={breadcrumbs} />

      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Services</CardTitle>
              <HugeiconsIcon icon={Hospital01Icon} size={16} className="text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalServices}</div>
              <p className="text-xs text-muted-foreground">Across all regions</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Regions</CardTitle>
              <HugeiconsIcon icon={Location01Icon} size={16} className="text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.regions}</div>
              <p className="text-xs text-muted-foreground">Province-level data</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Beds</CardTitle>
              <HugeiconsIcon icon={Hospital01Icon} size={16} className="text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalBeds}</div>
              <p className="text-xs text-muted-foreground">Inpatient capacity</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Staff</CardTitle>
              <HugeiconsIcon icon={Hospital01Icon} size={16} className="text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalStaff}</div>
              <p className="text-xs text-muted-foreground">Healthcare workers</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Service Density Heatmap</CardTitle>
                <CardDescription>
                  {heatmapMode === "density" && "Visualization of service distribution across Indonesia"}
                  {heatmapMode === "capacity" && "Bed capacity distribution across Indonesia"}
                  {heatmapMode === "staffing" && "Healthcare workforce distribution across Indonesia"}
                </CardDescription>
              </div>
              <Select value={heatmapMode} onValueChange={(value) => setHeatmapMode(value as HeatmapMode)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="density">Service Density</SelectItem>
                  <SelectItem value="capacity">Bed Capacity</SelectItem>
                  <SelectItem value="staffing">Staff Count</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="relative w-full h-[600px] rounded-lg overflow-hidden border border-border">
              {mounted && <LeafletHeatmap center={[-2.5, 118]} zoom={5} heatmapData={heatmapData} className="h-full w-full" />}
            </div>

            <div className="mt-4 p-3 bg-muted rounded-lg">
              <div className="text-xs font-medium mb-2">
                {heatmapMode === "density" && "Services Intensity"}
                {heatmapMode === "capacity" && "Beds Intensity"}
                {heatmapMode === "staffing" && "Staff Intensity"}
              </div>
              <div className="flex gap-4 flex-wrap">
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-4 h-4 rounded bg-red-600"></div>
                  <span>Very High (&gt;80%)</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-4 h-4 rounded bg-orange-500"></div>
                  <span>High (60-80%)</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-4 h-4 rounded bg-yellow-500"></div>
                  <span>Medium (40-60%)</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-4 h-4 rounded bg-green-500"></div>
                  <span>Low (20-40%)</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-4 h-4 rounded bg-blue-500"></div>
                  <span>Very Low (&lt;20%)</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Regional Statistics</CardTitle>
            <CardDescription>Detailed breakdown by province</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b">
                  <tr className="text-left">
                    <th className="p-2 font-medium">Province</th>
                    <th className="p-2 font-medium text-right">Services</th>
                    <th className="p-2 font-medium text-right">Beds</th>
                    <th className="p-2 font-medium text-right">Staff</th>
                    <th className="p-2 font-medium text-right">Beds/Service</th>
                    <th className="p-2 font-medium text-right">Staff/Service</th>
                  </tr>
                </thead>
                <tbody>
                  {regionalStats.map((stat, index) => (
                    <tr key={index} className="border-b hover:bg-muted/50">
                      <td className="p-2">{stat.name}</td>
                      <td className="p-2 text-right font-medium">{stat.count}</td>
                      <td className="p-2 text-right">{stat.beds}</td>
                      <td className="p-2 text-right">{stat.staff}</td>
                      <td className="p-2 text-right">{stat.bedsPerService.toFixed(1)}</td>
                      <td className="p-2 text-right">{stat.staffPerService.toFixed(1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
