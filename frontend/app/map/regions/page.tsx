"use client"

import { useMemo, useState } from "react"
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
  ArrowRight01Icon,} from "@hugeicons/core-free-icons"
import { mockIndonesianServices } from "@/lib/indonesia-locations"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from "recharts"

interface RegionStats {
  name: string
  services: number
  beds: number
  staff: number
  verified: number
  mtcCategories: number
  bsicCategories: number
}

export default function RegionComparisonPage() {
  const { open } = useSidebar()
  const [region1, setRegion1] = useState<string>("")
  const [region2, setRegion2] = useState<string>("")

  const servicesData = mockIndonesianServices

  // Get unique provinces
  const provinces = useMemo(() => {
    const uniqueProvinces = [...new Set(servicesData.map((s) => s.province))].sort()
    return uniqueProvinces
  }, [])

  // Calculate stats for a region
  const getRegionStats = (provinceName: string): RegionStats => {
    const regionServices = servicesData.filter((s) => s.province === provinceName)
    const mtcCategories = new Set(regionServices.map((s) => s.mtc_code).filter(Boolean)).size
    const bsicCategories = new Set(regionServices.map((s) => s.bsic_code).filter(Boolean)).size

    return {
      name: provinceName,
      services: regionServices.length,
      beds: regionServices.reduce((sum, s) => sum + (s.total_beds || 0), 0),
      staff: regionServices.reduce((sum, s) => sum + (s.total_staff || 0), 0),
      verified: regionServices.filter((s) => s.verification_status === "VERIFIED").length,
      mtcCategories,
      bsicCategories,
    }
  }

  // Get comparison data
  const region1Stats = useMemo(() => (region1 ? getRegionStats(region1) : null), [region1])
  const region2Stats = useMemo(() => (region2 ? getRegionStats(region2) : null), [region2])

  // Prepare chart data
  const comparisonData = useMemo(() => {
    if (!region1Stats || !region2Stats) return []

    return [
      {
        metric: "Services",
        [region1]: region1Stats.services,
        [region2]: region2Stats.services,
      },
      {
        metric: "Beds",
        [region1]: region1Stats.beds,
        [region2]: region2Stats.beds,
      },
      {
        metric: "Staff",
        [region1]: region1Stats.staff,
        [region2]: region2Stats.staff,
      },
      {
        metric: "Verified",
        [region1]: region1Stats.verified,
        [region2]: region2Stats.verified,
      },
      {
        metric: "MTC Categories",
        [region1]: region1Stats.mtcCategories,
        [region2]: region2Stats.mtcCategories,
      },
      {
        metric: "BSIC Categories",
        [region1]: region1Stats.bsicCategories,
        [region2]: region2Stats.bsicCategories,
      },
    ]
  }, [region1Stats, region2Stats, region1, region2])

  // Prepare radar chart data (normalized)
  const radarData = useMemo(() => {
    if (!region1Stats || !region2Stats) return []

    const maxServices = Math.max(region1Stats.services, region2Stats.services) || 1
    const maxBeds = Math.max(region1Stats.beds, region2Stats.beds) || 1
    const maxStaff = Math.max(region1Stats.staff, region2Stats.staff) || 1
    const maxVerified = Math.max(region1Stats.verified, region2Stats.verified) || 1
    const maxMTC = Math.max(region1Stats.mtcCategories, region2Stats.mtcCategories) || 1

    return [
      {
        metric: "Services",
        [region1]: (region1Stats.services / maxServices) * 100,
        [region2]: (region2Stats.services / maxServices) * 100,
      },
      {
        metric: "Beds",
        [region1]: (region1Stats.beds / maxBeds) * 100,
        [region2]: (region2Stats.beds / maxBeds) * 100,
      },
      {
        metric: "Staff",
        [region1]: (region1Stats.staff / maxStaff) * 100,
        [region2]: (region2Stats.staff / maxStaff) * 100,
      },
      {
        metric: "Verified",
        [region1]: (region1Stats.verified / maxVerified) * 100,
        [region2]: (region2Stats.verified / maxVerified) * 100,
      },
      {
        metric: "MTC Categories",
        [region1]: (region1Stats.mtcCategories / maxMTC) * 100,
        [region2]: (region2Stats.mtcCategories / maxMTC) * 100,
      },
    ]
  }, [region1Stats, region2Stats, region1, region2])

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
                <BreadcrumbPage>Region Comparison</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        {/* Region Selector */}
        <Card>
          <CardHeader>
            <CardTitle>Select Regions to Compare</CardTitle>
            <CardDescription>Choose two provinces to compare their mental health service data</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">Region 1</label>
                <Select value={region1} onValueChange={setRegion1}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select first region" />
                  </SelectTrigger>
                  <SelectContent>
                    {provinces
                      .filter((p) => p !== region2)
                      .map((province) => (
                        <SelectItem key={province} value={province}>
                          {province}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="pt-6">
                <HugeiconsIcon icon={ArrowRight01Icon} size={24} className="text-muted-foreground" />
              </div>

              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">Region 2</label>
                <Select value={region2} onValueChange={setRegion2}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select second region" />
                  </SelectTrigger>
                  <SelectContent>
                    {provinces
                      .filter((p) => p !== region1)
                      .map((province) => (
                        <SelectItem key={province} value={province}>
                          {province}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {region1Stats && region2Stats && (
          <>
            {/* Comparison Cards */}
            <div className="grid gap-4 md:grid-cols-2">
              {/* Region 1 */}
              <Card className="border-blue-200 bg-blue-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <HugeiconsIcon icon={Location01Icon} size={20} className="text-blue-600" />
                    {region1}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Services</p>
                      <p className="text-2xl font-bold text-blue-600">{region1Stats.services}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Beds</p>
                      <p className="text-2xl font-bold text-blue-600">{region1Stats.beds}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Staff</p>
                      <p className="text-2xl font-bold text-blue-600">{region1Stats.staff}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Verified</p>
                      <p className="text-2xl font-bold text-blue-600">{region1Stats.verified}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">MTC Categories</p>
                      <p className="text-2xl font-bold text-blue-600">{region1Stats.mtcCategories}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">BSIC Categories</p>
                      <p className="text-2xl font-bold text-blue-600">{region1Stats.bsicCategories}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Region 2 */}
              <Card className="border-green-200 bg-green-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <HugeiconsIcon icon={Location01Icon} size={20} className="text-green-600" />
                    {region2}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Services</p>
                      <p className="text-2xl font-bold text-green-600">{region2Stats.services}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Beds</p>
                      <p className="text-2xl font-bold text-green-600">{region2Stats.beds}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Staff</p>
                      <p className="text-2xl font-bold text-green-600">{region2Stats.staff}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Verified</p>
                      <p className="text-2xl font-bold text-green-600">{region2Stats.verified}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">MTC Categories</p>
                      <p className="text-2xl font-bold text-green-600">{region2Stats.mtcCategories}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">BSIC Categories</p>
                      <p className="text-2xl font-bold text-green-600">{region2Stats.bsicCategories}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Bar Chart Comparison */}
            <Card>
              <CardHeader>
                <CardTitle>Side-by-Side Comparison</CardTitle>
                <CardDescription>Absolute values comparison across key metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={comparisonData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="metric" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey={region1} fill="#3b82f6" name={region1} />
                    <Bar dataKey={region2} fill="#22c55e" name={region2} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Radar Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Normalized Comparison</CardTitle>
                <CardDescription>Relative performance across metrics (scaled to 100%)</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <RadarChart data={radarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="metric" />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} />
                    <Radar name={region1} dataKey={region1} stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
                    <Radar name={region2} dataKey={region2} stroke="#22c55e" fill="#22c55e" fillOpacity={0.6} />
                    <Legend />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Detailed Comparison Table */}
            <Card>
              <CardHeader>
                <CardTitle>Detailed Metrics</CardTitle>
                <CardDescription>Per-service averages and coverage ratios</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b">
                      <tr className="text-left">
                        <th className="p-2 font-medium">Metric</th>
                        <th className="p-2 font-medium text-right text-blue-600">{region1}</th>
                        <th className="p-2 font-medium text-right text-green-600">{region2}</th>
                        <th className="p-2 font-medium text-right">Difference</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b hover:bg-muted/50">
                        <td className="p-2">Total Services</td>
                        <td className="p-2 text-right">{region1Stats.services}</td>
                        <td className="p-2 text-right">{region2Stats.services}</td>
                        <td className="p-2 text-right font-medium">
                          {region1Stats.services > region2Stats.services ? "+" : ""}
                          {region1Stats.services - region2Stats.services}
                        </td>
                      </tr>
                      <tr className="border-b hover:bg-muted/50">
                        <td className="p-2">Beds per Service</td>
                        <td className="p-2 text-right">
                          {region1Stats.services > 0 ? (region1Stats.beds / region1Stats.services).toFixed(2) : "0"}
                        </td>
                        <td className="p-2 text-right">
                          {region2Stats.services > 0 ? (region2Stats.beds / region2Stats.services).toFixed(2) : "0"}
                        </td>
                        <td className="p-2 text-right font-medium">
                          {(
                            (region1Stats.services > 0 ? region1Stats.beds / region1Stats.services : 0) -
                            (region2Stats.services > 0 ? region2Stats.beds / region2Stats.services : 0)
                          ).toFixed(2)}
                        </td>
                      </tr>
                      <tr className="border-b hover:bg-muted/50">
                        <td className="p-2">Staff per Service</td>
                        <td className="p-2 text-right">
                          {region1Stats.services > 0 ? (region1Stats.staff / region1Stats.services).toFixed(2) : "0"}
                        </td>
                        <td className="p-2 text-right">
                          {region2Stats.services > 0 ? (region2Stats.staff / region2Stats.services).toFixed(2) : "0"}
                        </td>
                        <td className="p-2 text-right font-medium">
                          {(
                            (region1Stats.services > 0 ? region1Stats.staff / region1Stats.services : 0) -
                            (region2Stats.services > 0 ? region2Stats.staff / region2Stats.services : 0)
                          ).toFixed(2)}
                        </td>
                      </tr>
                      <tr className="border-b hover:bg-muted/50">
                        <td className="p-2">Verification Rate</td>
                        <td className="p-2 text-right">
                          {region1Stats.services > 0
                            ? ((region1Stats.verified / region1Stats.services) * 100).toFixed(1) + "%"
                            : "0%"}
                        </td>
                        <td className="p-2 text-right">
                          {region2Stats.services > 0
                            ? ((region2Stats.verified / region2Stats.services) * 100).toFixed(1) + "%"
                            : "0%"}
                        </td>
                        <td className="p-2 text-right font-medium">
                          {(
                            (region1Stats.services > 0 ? (region1Stats.verified / region1Stats.services) * 100 : 0) -
                            (region2Stats.services > 0 ? (region2Stats.verified / region2Stats.services) * 100 : 0)
                          ).toFixed(1)}
                          %
                        </td>
                      </tr>
                      <tr className="border-b hover:bg-muted/50">
                        <td className="p-2">MTC Diversity</td>
                        <td className="p-2 text-right">{region1Stats.mtcCategories} categories</td>
                        <td className="p-2 text-right">{region2Stats.mtcCategories} categories</td>
                        <td className="p-2 text-right font-medium">
                          {region1Stats.mtcCategories > region2Stats.mtcCategories ? "+" : ""}
                          {region1Stats.mtcCategories - region2Stats.mtcCategories}
                        </td>
                      </tr>
                      <tr className="border-b hover:bg-muted/50">
                        <td className="p-2">BSIC Diversity</td>
                        <td className="p-2 text-right">{region1Stats.bsicCategories} categories</td>
                        <td className="p-2 text-right">{region2Stats.bsicCategories} categories</td>
                        <td className="p-2 text-right font-medium">
                          {region1Stats.bsicCategories > region2Stats.bsicCategories ? "+" : ""}
                          {region1Stats.bsicCategories - region2Stats.bsicCategories}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {!region1 || !region2 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center h-64">
              <HugeiconsIcon icon={Location01Icon} size={48} className="text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-center">
                Please select two regions to compare their mental health service data
              </p>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </>
  )
}
