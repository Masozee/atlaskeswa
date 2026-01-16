'use client';

import { useMemo, useState } from 'react';
import { mockIndonesianServices } from '@/lib/indonesia-locations';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { DateTime } from '@/components/date-time';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  LineChart,
  Line,
} from 'recharts';
import { HugeiconsIcon } from "@hugeicons/react"
import {Location01Icon, ArrowUpRight01Icon, ArrowDownRight01Icon} from "@hugeicons/core-free-icons";

interface RegionStats {
  name: string;
  services: number;
  beds: number;
  staff: number;
  verified: number;
  mtcCategories: number;
  bsicCategories: number;
  avgBedsPerService: number;
  avgStaffPerService: number;
}

export default function RegionalComparisonReportPage() {
  const [region1, setRegion1] = useState<string>('DKI Jakarta');
  const [region2, setRegion2] = useState<string>('Jawa Barat');

  const servicesData = mockIndonesianServices;

  // Get unique provinces
  const provinces = useMemo(() => {
    return [...new Set(servicesData.map((s) => s.province))].sort();
  }, []);

  // Calculate region statistics
  const getRegionStats = (provinceName: string): RegionStats => {
    const regionServices = servicesData.filter((s) => s.province === provinceName);
    const mtcCategories = new Set(regionServices.map((s) => s.mtc_code).filter(Boolean)).size;
    const bsicCategories = new Set(regionServices.map((s) => s.bsic_code).filter(Boolean)).size;
    const totalBeds = regionServices.reduce((sum, s) => sum + (s.total_beds || 0), 0);
    const totalStaff = regionServices.reduce((sum, s) => sum + (s.total_staff || 0), 0);

    return {
      name: provinceName,
      services: regionServices.length,
      beds: totalBeds,
      staff: totalStaff,
      verified: regionServices.filter((s) => s.verification_status === 'VERIFIED').length,
      mtcCategories,
      bsicCategories,
      avgBedsPerService: regionServices.length > 0 ? Math.round(totalBeds / regionServices.length) : 0,
      avgStaffPerService: regionServices.length > 0 ? Math.round(totalStaff / regionServices.length) : 0,
    };
  };

  const stats1 = useMemo(() => getRegionStats(region1), [region1]);
  const stats2 = useMemo(() => getRegionStats(region2), [region2]);

  // Comparison data for bar chart
  const comparisonData = useMemo(() => {
    return [
      { metric: 'Services', [region1]: stats1.services, [region2]: stats2.services },
      { metric: 'Total Beds', [region1]: stats1.beds, [region2]: stats2.beds },
      { metric: 'Total Staff', [region1]: stats1.staff, [region2]: stats2.staff },
      { metric: 'Verified', [region1]: stats1.verified, [region2]: stats2.verified },
      { metric: 'MTC Categories', [region1]: stats1.mtcCategories, [region2]: stats2.mtcCategories },
      { metric: 'BSIC Categories', [region1]: stats1.bsicCategories, [region2]: stats2.bsicCategories },
    ];
  }, [region1, region2, stats1, stats2]);

  // Radar chart data (normalized)
  const radarData = useMemo(() => {
    const maxValues = {
      services: Math.max(stats1.services, stats2.services),
      beds: Math.max(stats1.beds, stats2.beds),
      staff: Math.max(stats1.staff, stats2.staff),
      verified: Math.max(stats1.verified, stats2.verified),
      mtcCategories: Math.max(stats1.mtcCategories, stats2.mtcCategories),
      bsicCategories: Math.max(stats1.bsicCategories, stats2.bsicCategories),
    };

    return [
      {
        metric: 'Services',
        [region1]: maxValues.services > 0 ? (stats1.services / maxValues.services) * 100 : 0,
        [region2]: maxValues.services > 0 ? (stats2.services / maxValues.services) * 100 : 0,
      },
      {
        metric: 'Beds',
        [region1]: maxValues.beds > 0 ? (stats1.beds / maxValues.beds) * 100 : 0,
        [region2]: maxValues.beds > 0 ? (stats2.beds / maxValues.beds) * 100 : 0,
      },
      {
        metric: 'Staff',
        [region1]: maxValues.staff > 0 ? (stats1.staff / maxValues.staff) * 100 : 0,
        [region2]: maxValues.staff > 0 ? (stats2.staff / maxValues.staff) * 100 : 0,
      },
      {
        metric: 'Verified',
        [region1]: maxValues.verified > 0 ? (stats1.verified / maxValues.verified) * 100 : 0,
        [region2]: maxValues.verified > 0 ? (stats2.verified / maxValues.verified) * 100 : 0,
      },
      {
        metric: 'MTC Diversity',
        [region1]: maxValues.mtcCategories > 0 ? (stats1.mtcCategories / maxValues.mtcCategories) * 100 : 0,
        [region2]: maxValues.mtcCategories > 0 ? (stats2.mtcCategories / maxValues.mtcCategories) * 100 : 0,
      },
      {
        metric: 'BSIC Diversity',
        [region1]: maxValues.bsicCategories > 0 ? (stats1.bsicCategories / maxValues.bsicCategories) * 100 : 0,
        [region2]: maxValues.bsicCategories > 0 ? (stats2.bsicCategories / maxValues.bsicCategories) * 100 : 0,
      },
    ];
  }, [region1, region2, stats1, stats2]);

  // MTC distribution comparison
  const mtcComparison = useMemo(() => {
    const getMTCDistribution = (province: string) => {
      const regionServices = servicesData.filter((s) => s.province === province);
      const grouped = new Map<string, number>();
      regionServices.forEach((service) => {
        const mtc = service.mtc_code || 'Unknown';
        grouped.set(mtc, (grouped.get(mtc) || 0) + 1);
      });
      return grouped;
    };

    const dist1 = getMTCDistribution(region1);
    const dist2 = getMTCDistribution(region2);
    const allMTCs = new Set([...dist1.keys(), ...dist2.keys()]);

    return Array.from(allMTCs)
      .map((mtc) => ({
        mtc,
        [region1]: dist1.get(mtc) || 0,
        [region2]: dist2.get(mtc) || 0,
      }))
      .sort((a, b) => ((b[region1] as number) + (b[region2] as number)) - ((a[region1] as number) + (a[region2] as number)));
  }, [region1, region2]);

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
              <BreadcrumbLink href="/reports">Reports & Analytics</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Regional Comparison</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="ml-auto">
          <DateTime />
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-6">
        <div>
          <h1 className="text-2xl font-bold">Regional Comparison Report</h1>
          <p className="text-muted-foreground">
            Compare mental health service metrics across Indonesian provinces
          </p>
        </div>

        {/* Region Selectors */}
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="text-sm font-medium mb-2 block">Region 1</label>
            <Select value={region1} onValueChange={setRegion1}>
              <SelectTrigger>
                <SelectValue placeholder="Select province" />
              </SelectTrigger>
              <SelectContent>
                {provinces.map((province) => (
                  <SelectItem key={province} value={province} disabled={province === region2}>
                    {province}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-end pb-2">
            <span className="text-2xl font-bold text-muted-foreground">VS</span>
          </div>

          <div className="flex-1">
            <label className="text-sm font-medium mb-2 block">Region 2</label>
            <Select value={region2} onValueChange={setRegion2}>
              <SelectTrigger>
                <SelectValue placeholder="Select province" />
              </SelectTrigger>
              <SelectContent>
                {provinces.map((province) => (
                  <SelectItem key={province} value={province} disabled={province === region1}>
                    {province}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Comparison Cards */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* Region 1 Stats */}
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HugeiconsIcon icon={Location01Icon} size={20} className="text-blue-600" />
                {region1}
              </CardTitle>
              <CardDescription>Regional statistics and metrics</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total Services</span>
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  {stats1.services}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total Beds</span>
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  {stats1.beds}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total Staff</span>
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  {stats1.staff}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Verified Services</span>
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  {stats1.verified} ({stats1.services > 0 ? ((stats1.verified / stats1.services) * 100).toFixed(0) : 0}%)
                </Badge>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Avg Beds/Service</span>
                <span className="font-semibold">{stats1.avgBedsPerService}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Avg Staff/Service</span>
                <span className="font-semibold">{stats1.avgStaffPerService}</span>
              </div>
            </CardContent>
          </Card>

          {/* Region 2 Stats */}
          <Card className="border-l-4 border-l-green-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HugeiconsIcon icon={Location01Icon} size={20} className="text-green-600" />
                {region2}
              </CardTitle>
              <CardDescription>Regional statistics and metrics</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total Services</span>
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  {stats2.services}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total Beds</span>
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  {stats2.beds}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total Staff</span>
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  {stats2.staff}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Verified Services</span>
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  {stats2.verified} ({stats2.services > 0 ? ((stats2.verified / stats2.services) * 100).toFixed(0) : 0}%)
                </Badge>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Avg Beds/Service</span>
                <span className="font-semibold">{stats2.avgBedsPerService}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Avg Staff/Service</span>
                <span className="font-semibold">{stats2.avgStaffPerService}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* Bar Chart Comparison */}
          <Card>
            <CardHeader>
              <CardTitle>Metric Comparison</CardTitle>
              <CardDescription>Side-by-side comparison of key metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={comparisonData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="metric" angle={-45} textAnchor="end" height={100} fontSize={12} />
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
              <CardTitle>Normalized Performance</CardTitle>
              <CardDescription>Relative strengths across metrics (0-100%)</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="metric" fontSize={12} />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} />
                  <Radar name={region1} dataKey={region1} stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
                  <Radar name={region2} dataKey={region2} stroke="#22c55e" fill="#22c55e" fillOpacity={0.6} />
                  <Legend />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* MTC Distribution Comparison */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>MTC Category Distribution</CardTitle>
              <CardDescription>Service distribution across Main Type of Care categories</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={mtcComparison}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mtc" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey={region1} fill="#3b82f6" name={region1} />
                  <Bar dataKey={region2} fill="#22c55e" name={region2} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Comparison Table */}
        <Card>
          <CardHeader>
            <CardTitle>Detailed Comparison</CardTitle>
            <CardDescription>Comprehensive metrics comparison</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="p-3 text-left font-semibold">Metric</th>
                    <th className="p-3 text-right font-semibold text-blue-600">{region1}</th>
                    <th className="p-3 text-right font-semibold text-green-600">{region2}</th>
                    <th className="p-3 text-center font-semibold">Difference</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b hover:bg-muted/50">
                    <td className="p-3">Total Services</td>
                    <td className="p-3 text-right font-medium">{stats1.services}</td>
                    <td className="p-3 text-right font-medium">{stats2.services}</td>
                    <td className="p-3 text-center">
                      {stats1.services > stats2.services ? (
                        <Badge variant="outline" className="bg-blue-50 text-blue-700">
                          <HugeiconsIcon icon={ArrowUpRight01Icon} size={12} className="mr-1 inline" />
                          +{stats1.services - stats2.services}
                        </Badge>
                      ) : stats1.services < stats2.services ? (
                        <Badge variant="outline" className="bg-green-50 text-green-700">
                          <HugeiconsIcon icon={ArrowDownRight01Icon} size={12} className="mr-1 inline" />
                          -{stats2.services - stats1.services}
                        </Badge>
                      ) : (
                        <Badge variant="outline">Equal</Badge>
                      )}
                    </td>
                  </tr>
                  <tr className="border-b hover:bg-muted/50">
                    <td className="p-3">Total Beds</td>
                    <td className="p-3 text-right font-medium">{stats1.beds}</td>
                    <td className="p-3 text-right font-medium">{stats2.beds}</td>
                    <td className="p-3 text-center">
                      {stats1.beds > stats2.beds ? (
                        <Badge variant="outline" className="bg-blue-50 text-blue-700">
                          <HugeiconsIcon icon={ArrowUpRight01Icon} size={12} className="mr-1 inline" />
                          +{stats1.beds - stats2.beds}
                        </Badge>
                      ) : stats1.beds < stats2.beds ? (
                        <Badge variant="outline" className="bg-green-50 text-green-700">
                          <HugeiconsIcon icon={ArrowDownRight01Icon} size={12} className="mr-1 inline" />
                          -{stats2.beds - stats1.beds}
                        </Badge>
                      ) : (
                        <Badge variant="outline">Equal</Badge>
                      )}
                    </td>
                  </tr>
                  <tr className="border-b hover:bg-muted/50">
                    <td className="p-3">Total Staff</td>
                    <td className="p-3 text-right font-medium">{stats1.staff}</td>
                    <td className="p-3 text-right font-medium">{stats2.staff}</td>
                    <td className="p-3 text-center">
                      {stats1.staff > stats2.staff ? (
                        <Badge variant="outline" className="bg-blue-50 text-blue-700">
                          <HugeiconsIcon icon={ArrowUpRight01Icon} size={12} className="mr-1 inline" />
                          +{stats1.staff - stats2.staff}
                        </Badge>
                      ) : stats1.staff < stats2.staff ? (
                        <Badge variant="outline" className="bg-green-50 text-green-700">
                          <HugeiconsIcon icon={ArrowDownRight01Icon} size={12} className="mr-1 inline" />
                          -{stats2.staff - stats1.staff}
                        </Badge>
                      ) : (
                        <Badge variant="outline">Equal</Badge>
                      )}
                    </td>
                  </tr>
                  <tr className="border-b hover:bg-muted/50">
                    <td className="p-3">Verified Services</td>
                    <td className="p-3 text-right font-medium">{stats1.verified}</td>
                    <td className="p-3 text-right font-medium">{stats2.verified}</td>
                    <td className="p-3 text-center">
                      {stats1.verified > stats2.verified ? (
                        <Badge variant="outline" className="bg-blue-50 text-blue-700">
                          <HugeiconsIcon icon={ArrowUpRight01Icon} size={12} className="mr-1 inline" />
                          +{stats1.verified - stats2.verified}
                        </Badge>
                      ) : stats1.verified < stats2.verified ? (
                        <Badge variant="outline" className="bg-green-50 text-green-700">
                          <HugeiconsIcon icon={ArrowDownRight01Icon} size={12} className="mr-1 inline" />
                          -{stats2.verified - stats1.verified}
                        </Badge>
                      ) : (
                        <Badge variant="outline">Equal</Badge>
                      )}
                    </td>
                  </tr>
                  <tr className="border-b hover:bg-muted/50">
                    <td className="p-3">Avg Beds per Service</td>
                    <td className="p-3 text-right font-medium">{stats1.avgBedsPerService}</td>
                    <td className="p-3 text-right font-medium">{stats2.avgBedsPerService}</td>
                    <td className="p-3 text-center">
                      {stats1.avgBedsPerService > stats2.avgBedsPerService ? (
                        <Badge variant="outline" className="bg-blue-50 text-blue-700">
                          <HugeiconsIcon icon={ArrowUpRight01Icon} size={12} className="mr-1 inline" />
                          +{stats1.avgBedsPerService - stats2.avgBedsPerService}
                        </Badge>
                      ) : stats1.avgBedsPerService < stats2.avgBedsPerService ? (
                        <Badge variant="outline" className="bg-green-50 text-green-700">
                          <HugeiconsIcon icon={ArrowDownRight01Icon} size={12} className="mr-1 inline" />
                          -{stats2.avgBedsPerService - stats1.avgBedsPerService}
                        </Badge>
                      ) : (
                        <Badge variant="outline">Equal</Badge>
                      )}
                    </td>
                  </tr>
                  <tr className="border-b hover:bg-muted/50">
                    <td className="p-3">Avg Staff per Service</td>
                    <td className="p-3 text-right font-medium">{stats1.avgStaffPerService}</td>
                    <td className="p-3 text-right font-medium">{stats2.avgStaffPerService}</td>
                    <td className="p-3 text-center">
                      {stats1.avgStaffPerService > stats2.avgStaffPerService ? (
                        <Badge variant="outline" className="bg-blue-50 text-blue-700">
                          <HugeiconsIcon icon={ArrowUpRight01Icon} size={12} className="mr-1 inline" />
                          +{stats1.avgStaffPerService - stats2.avgStaffPerService}
                        </Badge>
                      ) : stats1.avgStaffPerService < stats2.avgStaffPerService ? (
                        <Badge variant="outline" className="bg-green-50 text-green-700">
                          <HugeiconsIcon icon={ArrowDownRight01Icon} size={12} className="mr-1 inline" />
                          -{stats2.avgStaffPerService - stats1.avgStaffPerService}
                        </Badge>
                      ) : (
                        <Badge variant="outline">Equal</Badge>
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
