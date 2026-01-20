'use client';

import { useMemo, useState } from 'react';
import { mockIndonesianServices } from '@/lib/indonesia-locations';
import { PageHeader, BreadcrumbItemType } from '@/components/page-header';
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
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';
import { HugeiconsIcon } from "@hugeicons/react"
import {Layers01Icon} from "@hugeicons/core-free-icons";

const breadcrumbs: BreadcrumbItemType[] = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Reports & Analytics', href: '/reports' },
  { label: 'MTC Distribution' },
];

const MTC_CATEGORIES = [
  { code: 'R1', name: 'Residential, 24-hour Inpatient Care', color: '#3b82f6' },
  { code: 'R2', name: 'Residential, Non-hospital Care', color: '#22c55e' },
  { code: 'O1', name: 'Outpatient, Ambulatory Mental Health Care', color: '#a855f7' },
  { code: 'O2', name: 'Outpatient, Day Care', color: '#f97316' },
  { code: 'O3', name: 'Outpatient, Community-based Mobile Care', color: '#ec4899' },
  { code: 'O4', name: 'Outpatient, Home-based Treatment Teams', color: '#06b6d4' },
];

export default function MTCDistributionReportPage() {
  const [selectedProvince, setSelectedProvince] = useState<string>('all');
  const servicesData = mockIndonesianServices;

  // Get unique provinces
  const provinces = useMemo(() => {
    return ['all', ...new Set(servicesData.map((s) => s.province))].sort();
  }, []);

  // Filter services
  const filteredServices = useMemo(() => {
    if (selectedProvince === 'all') return servicesData;
    return servicesData.filter((service) => service.province === selectedProvince);
  }, [selectedProvince]);

  // Calculate MTC distribution
  const mtcDistribution = useMemo(() => {
    const grouped = new Map<string, number>();
    filteredServices.forEach((service) => {
      const mtc = service.mtc_code || 'Unknown';
      grouped.set(mtc, (grouped.get(mtc) || 0) + 1);
    });

    return MTC_CATEGORIES.map((category) => ({
      ...category,
      count: grouped.get(category.code) || 0,
    })).sort((a, b) => b.count - a.count);
  }, [filteredServices]);

  // Calculate capacity by MTC
  const capacityByMTC = useMemo(() => {
    const grouped = new Map<string, { beds: number; staff: number }>();
    filteredServices.forEach((service) => {
      const mtc = service.mtc_code || 'Unknown';
      const current = grouped.get(mtc) || { beds: 0, staff: 0 };
      grouped.set(mtc, {
        beds: current.beds + (service.total_beds || 0),
        staff: current.staff + (service.total_staff || 0),
      });
    });

    return MTC_CATEGORIES.map((category) => ({
      name: category.code,
      fullName: category.name,
      beds: grouped.get(category.code)?.beds || 0,
      staff: grouped.get(category.code)?.staff || 0,
    }));
  }, [filteredServices]);

  // Province-wise MTC distribution
  const provinceWiseMTC = useMemo(() => {
    const grouped = new Map<string, Map<string, number>>();
    filteredServices.forEach((service) => {
      if (!grouped.has(service.province)) {
        grouped.set(service.province, new Map());
      }
      const provinceMap = grouped.get(service.province)!;
      const mtc = service.mtc_code || 'Unknown';
      provinceMap.set(mtc, (provinceMap.get(mtc) || 0) + 1);
    });

    return Array.from(grouped.entries())
      .map(([province, mtcMap]) => {
        const result: any = { province };
        MTC_CATEGORIES.forEach((cat) => {
          result[cat.code] = mtcMap.get(cat.code) || 0;
        });
        return result;
      })
      .sort((a, b) => {
        const totalA = MTC_CATEGORIES.reduce((sum, cat) => sum + (a[cat.code] || 0), 0);
        const totalB = MTC_CATEGORIES.reduce((sum, cat) => sum + (b[cat.code] || 0), 0);
        return totalB - totalA;
      })
      .slice(0, 10);
  }, [filteredServices]);

  // Radar chart data (normalized)
  const radarData = useMemo(() => {
    const maxValues = {
      services: Math.max(...mtcDistribution.map((d) => d.count)),
      beds: Math.max(...capacityByMTC.map((d) => d.beds)),
      staff: Math.max(...capacityByMTC.map((d) => d.staff)),
    };

    return MTC_CATEGORIES.map((category) => {
      const dist = mtcDistribution.find((d) => d.code === category.code);
      const cap = capacityByMTC.find((d) => d.name === category.code);

      return {
        category: category.code,
        services: maxValues.services > 0 ? ((dist?.count || 0) / maxValues.services) * 100 : 0,
        beds: maxValues.beds > 0 ? ((cap?.beds || 0) / maxValues.beds) * 100 : 0,
        staff: maxValues.staff > 0 ? ((cap?.staff || 0) / maxValues.staff) * 100 : 0,
      };
    });
  }, [mtcDistribution, capacityByMTC]);

  // Statistics
  const stats = useMemo(() => {
    const totalServices = filteredServices.length;
    const activeMTCCategories = mtcDistribution.filter((d) => d.count > 0).length;
    const totalBeds = filteredServices.reduce((sum, s) => sum + (s.total_beds || 0), 0);
    const totalStaff = filteredServices.reduce((sum, s) => sum + (s.total_staff || 0), 0);

    return {
      totalServices,
      activeMTCCategories,
      totalBeds,
      totalStaff,
    };
  }, [filteredServices, mtcDistribution]);

  return (
    <>
      <PageHeader breadcrumbs={breadcrumbs} />

      <div className="flex flex-1 flex-col gap-4 p-6">
        <div>
          <h1 className="text-2xl font-bold">MTC Distribution Report</h1>
          <p className="text-muted-foreground">
            Analysis of Main Type of Care (MTC) categories across mental health services
          </p>
        </div>

        {/* Filter */}
        <div className="flex gap-4">
          <Select value={selectedProvince} onValueChange={setSelectedProvince}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Select province" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Provinces</SelectItem>
              {provinces.slice(1).map((province) => (
                <SelectItem key={province} value={province}>
                  {province}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Services</CardTitle>
              <HugeiconsIcon icon={Layers01Icon} size={16} className="text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalServices}</div>
              <p className="text-xs text-muted-foreground">Across all MTC categories</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Categories</CardTitle>
              <HugeiconsIcon icon={Layers01Icon} size={16} className="text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.activeMTCCategories}</div>
              <p className="text-xs text-muted-foreground">Out of {MTC_CATEGORIES.length} total</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Bed Capacity</CardTitle>
              <HugeiconsIcon icon={Layers01Icon} size={16} className="text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.totalBeds}</div>
              <p className="text-xs text-muted-foreground">Beds across all services</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Staff</CardTitle>
              <HugeiconsIcon icon={Layers01Icon} size={16} className="text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{stats.totalStaff}</div>
              <p className="text-xs text-muted-foreground">Staff members employed</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* MTC Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Service Distribution by MTC</CardTitle>
              <CardDescription>Number of services in each category</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={mtcDistribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="code" />
                  <YAxis />
                  <Tooltip
                    content={({ payload }) => {
                      if (payload && payload.length > 0) {
                        const data = payload[0].payload;
                        return (
                          <div className="rounded-lg border bg-background p-2 shadow-sm">
                            <div className="font-semibold">{data.code}</div>
                            <div className="text-xs text-muted-foreground">{data.name}</div>
                            <div className="mt-1 text-sm">Services: {data.count}</div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="count" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* MTC Pie Chart */}
          <Card>
            <CardHeader>
              <CardTitle>MTC Category Proportion</CardTitle>
              <CardDescription>Percentage distribution of services</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={mtcDistribution.filter((d) => d.count > 0)}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ payload, percent }: { payload?: { code?: string }; percent?: number }) => `${payload?.code ?? ''}: ${((percent ?? 0) * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {mtcDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Capacity by MTC */}
          <Card>
            <CardHeader>
              <CardTitle>Capacity by MTC Category</CardTitle>
              <CardDescription>Total beds and staff per category</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={capacityByMTC}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip
                    content={({ payload }) => {
                      if (payload && payload.length > 0) {
                        const data = payload[0].payload;
                        return (
                          <div className="rounded-lg border bg-background p-2 shadow-sm">
                            <div className="font-semibold">{data.name}</div>
                            <div className="text-xs text-muted-foreground mb-1">{data.fullName}</div>
                            <div className="text-sm">Beds: {data.beds}</div>
                            <div className="text-sm">Staff: {data.staff}</div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend />
                  <Bar dataKey="beds" fill="#3b82f6" name="Beds" />
                  <Bar dataKey="staff" fill="#22c55e" name="Staff" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Radar Chart */}
          <Card>
            <CardHeader>
              <CardTitle>MTC Performance Metrics</CardTitle>
              <CardDescription>Normalized comparison across metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="category" />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} />
                  <Radar name="Services" dataKey="services" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
                  <Radar name="Beds" dataKey="beds" stroke="#22c55e" fill="#22c55e" fillOpacity={0.6} />
                  <Radar name="Staff" dataKey="staff" stroke="#a855f7" fill="#a855f7" fillOpacity={0.6} />
                  <Legend />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Province-wise MTC Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>MTC Distribution by Province</CardTitle>
            <CardDescription>Top 10 provinces showing service distribution across MTC categories</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={provinceWiseMTC}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="province" angle={-45} textAnchor="end" height={120} fontSize={12} />
                <YAxis />
                <Tooltip />
                <Legend />
                {MTC_CATEGORIES.map((category) => (
                  <Bar key={category.code} dataKey={category.code} stackId="a" fill={category.color} name={category.code} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* MTC Category Reference */}
        <Card>
          <CardHeader>
            <CardTitle>MTC Category Reference</CardTitle>
            <CardDescription>Main Type of Care classification definitions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {MTC_CATEGORIES.map((category) => {
                const dist = mtcDistribution.find((d) => d.code === category.code);
                const cap = capacityByMTC.find((d) => d.name === category.code);
                return (
                  <div
                    key={category.code}
                    className="flex items-start gap-4 rounded-lg border p-4"
                    style={{ borderLeftColor: category.color, borderLeftWidth: '4px' }}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge style={{ backgroundColor: category.color, color: 'white' }}>{category.code}</Badge>
                        <span className="font-semibold">{category.name}</span>
                      </div>
                      <div className="mt-2 flex gap-6 text-sm text-muted-foreground">
                        <div>
                          <span className="font-medium">Services:</span> {dist?.count || 0}
                        </div>
                        <div>
                          <span className="font-medium">Beds:</span> {cap?.beds || 0}
                        </div>
                        <div>
                          <span className="font-medium">Staff:</span> {cap?.staff || 0}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
