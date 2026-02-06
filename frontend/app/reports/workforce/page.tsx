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
  ScatterChart,
  Scatter,
  ZAxis,
} from 'recharts';
import { HugeiconsIcon } from "@hugeicons/react"
import {UserMultiple02Icon, BedIcon, Hospital01Icon, UserGroupIcon} from "@hugeicons/core-free-icons";

const breadcrumbs: BreadcrumbItemType[] = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Reports & Analytics', href: '/reports' },
  { label: 'Workforce & Capacity' },
];

export default function WorkforceCapacityReportPage() {
  const [selectedProvince, setSelectedProvince] = useState<string>('all');
  const [selectedMTC, setSelectedMTC] = useState<string>('all');

  const servicesData = mockIndonesianServices;

  // Get unique provinces and MTC codes
  const provinces = useMemo(() => {
    return ['all', ...new Set(servicesData.map((s) => s.province))].sort();
  }, []);

  const mtcCodes = useMemo(() => {
    return ['all', ...new Set(servicesData.map((s) => s.mtc_code))].sort();
  }, []);

  // Filter services
  const filteredServices = useMemo(() => {
    return servicesData.filter((service) => {
      if (selectedProvince !== 'all' && service.province !== selectedProvince) return false;
      if (selectedMTC !== 'all' && service.mtc_code !== selectedMTC) return false;
      return true;
    });
  }, [selectedProvince, selectedMTC]);

  // Calculate statistics
  const stats = useMemo(() => {
    const totalStaff = filteredServices.reduce((sum, s) => sum + (s.total_staff || 0), 0);
    const totalBeds = filteredServices.reduce((sum, s) => sum + (s.total_beds || 0), 0);
    const avgStaffPerService = filteredServices.length > 0 ? (totalStaff / filteredServices.length).toFixed(1) : '0';
    const avgBedsPerService = filteredServices.length > 0 ? (totalBeds / filteredServices.length).toFixed(1) : '0';
    const staffToBedRatio = totalBeds > 0 ? (totalStaff / totalBeds).toFixed(2) : '0';

    return {
      totalStaff,
      totalBeds,
      totalServices: filteredServices.length,
      avgStaffPerService,
      avgBedsPerService,
      staffToBedRatio,
    };
  }, [filteredServices]);

  // Workforce by province
  const workforceByProvince = useMemo(() => {
    const grouped = new Map<string, { staff: number; beds: number; services: number }>();
    filteredServices.forEach((service) => {
      const current = grouped.get(service.province) || { staff: 0, beds: 0, services: 0 };
      grouped.set(service.province, {
        staff: current.staff + (service.total_staff || 0),
        beds: current.beds + (service.total_beds || 0),
        services: current.services + 1,
      });
    });

    return Array.from(grouped.entries())
      .map(([name, data]) => ({
        name,
        staff: data.staff,
        beds: data.beds,
        services: data.services,
        avgStaffPerService: data.services > 0 ? (data.staff / data.services).toFixed(1) : '0',
        staffToBedRatio: data.beds > 0 ? (data.staff / data.beds).toFixed(2) : '0',
      }))
      .sort((a, b) => b.staff - a.staff)
      .slice(0, 10);
  }, [filteredServices]);

  // Workforce by MTC
  const workforceByMTC = useMemo(() => {
    const grouped = new Map<string, { staff: number; beds: number; services: number }>();
    filteredServices.forEach((service) => {
      const mtc = service.mtc_code || 'Unknown';
      const current = grouped.get(mtc) || { staff: 0, beds: 0, services: 0 };
      grouped.set(mtc, {
        staff: current.staff + (service.total_staff || 0),
        beds: current.beds + (service.total_beds || 0),
        services: current.services + 1,
      });
    });

    return Array.from(grouped.entries())
      .map(([name, data]) => ({
        name,
        staff: data.staff,
        beds: data.beds,
        services: data.services,
      }))
      .sort((a, b) => b.staff - a.staff);
  }, [filteredServices]);

  // Staff-to-bed distribution (for scatter plot)
  const staffBedDistribution = useMemo(() => {
    return filteredServices
      .map((service) => ({
        name: service.service_name,
        staff: service.total_staff || 0,
        beds: service.total_beds || 0,
        mtc: service.mtc_code || 'Unknown',
      }))
      .filter((d) => d.staff > 0 && d.beds > 0);
  }, [filteredServices]);

  // Capacity distribution
  const capacityDistribution = useMemo(() => {
    const ranges = [
      { label: '0-50', min: 0, max: 50 },
      { label: '51-100', min: 51, max: 100 },
      { label: '101-200', min: 101, max: 200 },
      { label: '201-300', min: 201, max: 300 },
      { label: '300+', min: 301, max: Infinity },
    ];

    const bedRanges = ranges.map((range) => ({
      range: range.label,
      beds: filteredServices.filter((s) => {
        const beds = s.total_beds || 0;
        return beds >= range.min && beds <= range.max;
      }).length,
    }));

    const staffRanges = ranges.map((range) => ({
      range: range.label,
      staff: filteredServices.filter((s) => {
        const staff = s.total_staff || 0;
        return staff >= range.min && staff <= range.max;
      }).length,
    }));

    return { bedRanges, staffRanges };
  }, [filteredServices]);

  return (
    <>
      <PageHeader breadcrumbs={breadcrumbs} />

      <div className="flex flex-1 flex-col gap-4 p-6">
        <div>
          <h1 className="text-2xl font-bold">Workforce & Capacity Report</h1>
          <p className="text-muted-foreground">
            Analysis of mental health workforce distribution and service capacity
          </p>
        </div>

        {/* Filters */}
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

          <Select value={selectedMTC} onValueChange={setSelectedMTC}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Select MTC" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All MTC Categories</SelectItem>
              {mtcCodes.slice(1).map((mtc) => (
                <SelectItem key={mtc} value={mtc}>
                  {mtc}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Staff</CardTitle>
              <HugeiconsIcon icon={UserMultiple02Icon} size={16} className="text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalStaff}</div>
              <p className="text-xs text-muted-foreground">Across {stats.totalServices} services</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Bed Capacity</CardTitle>
              <HugeiconsIcon icon={BedIcon} size={16} className="text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.totalBeds}</div>
              <p className="text-xs text-muted-foreground">Available beds</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Staff/Service</CardTitle>
              <HugeiconsIcon icon={UserGroupIcon} size={16} className="text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.avgStaffPerService}</div>
              <p className="text-xs text-muted-foreground">Staff per facility</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Staff-to-Bed Ratio</CardTitle>
              <HugeiconsIcon icon={Hospital01Icon} size={16} className="text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{stats.staffToBedRatio}</div>
              <p className="text-xs text-muted-foreground">Staff per bed</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* Workforce by Province */}
          <Card>
            <CardHeader>
              <CardTitle>Workforce by Province</CardTitle>
              <CardDescription>Top 10 provinces by total staff count</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={workforceByProvince}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} fontSize={12} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="staff" fill="#00979D" name="Staff" />
                  <Bar dataKey="beds" fill="#22c55e" name="Beds" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Workforce by MTC */}
          <Card>
            <CardHeader>
              <CardTitle>Workforce by MTC Category</CardTitle>
              <CardDescription>Staff and bed distribution across MTC types</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={workforceByMTC} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={60} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="staff" fill="#00979D" name="Staff" />
                  <Bar dataKey="beds" fill="#22c55e" name="Beds" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Bed Capacity Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Bed Capacity Distribution</CardTitle>
              <CardDescription>Services grouped by bed capacity range</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={capacityDistribution.bedRanges}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="range" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="beds" fill="#00979D" name="Number of Services" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Staff Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Staff Distribution</CardTitle>
              <CardDescription>Services grouped by staff count range</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={capacityDistribution.staffRanges}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="range" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="staff" fill="#22c55e" name="Number of Services" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Staff-to-Bed Scatter Plot */}
        <Card>
          <CardHeader>
            <CardTitle>Staff-to-Bed Correlation</CardTitle>
            <CardDescription>Relationship between staff count and bed capacity across services</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="beds" name="Beds" label={{ value: 'Total Beds', position: 'insideBottom', offset: -5 }} />
                <YAxis dataKey="staff" name="Staff" label={{ value: 'Total Staff', angle: -90, position: 'insideLeft' }} />
                <ZAxis range={[50, 400]} />
                <Tooltip
                  cursor={{ strokeDasharray: '3 3' }}
                  content={({ payload }) => {
                    if (payload && payload.length > 0) {
                      const data = payload[0].payload;
                      return (
                        <div className="rounded-lg border bg-background p-3 shadow-sm">
                          <div className="font-semibold text-sm mb-1">{data.name}</div>
                          <div className="text-xs text-muted-foreground mb-2">MTC: {data.mtc}</div>
                          <div className="text-sm">Staff: {data.staff}</div>
                          <div className="text-sm">Beds: {data.beds}</div>
                          <div className="text-sm">Ratio: {(data.staff / data.beds).toFixed(2)}</div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Scatter name="Services" data={staffBedDistribution} fill="#00979D" />
              </ScatterChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Detailed Table */}
        <Card>
          <CardHeader>
            <CardTitle>Provincial Workforce Metrics</CardTitle>
            <CardDescription>Comprehensive workforce and capacity metrics by province</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="p-2 text-left">Province</th>
                    <th className="p-2 text-right">Services</th>
                    <th className="p-2 text-right">Total Staff</th>
                    <th className="p-2 text-right">Total Beds</th>
                    <th className="p-2 text-right">Avg Staff/Service</th>
                    <th className="p-2 text-right">Staff-to-Bed Ratio</th>
                  </tr>
                </thead>
                <tbody>
                  {workforceByProvince.map((province) => (
                    <tr key={province.name} className="border-b hover:bg-muted/50">
                      <td className="p-2 font-medium">{province.name}</td>
                      <td className="p-2 text-right">{province.services}</td>
                      <td className="p-2 text-right">
                        <Badge variant="outline" className="bg-blue-50 text-blue-700">
                          {province.staff}
                        </Badge>
                      </td>
                      <td className="p-2 text-right">
                        <Badge variant="outline" className="bg-green-50 text-green-700">
                          {province.beds}
                        </Badge>
                      </td>
                      <td className="p-2 text-right">{province.avgStaffPerService}</td>
                      <td className="p-2 text-right">
                        <Badge
                          variant="outline"
                          className={
                            parseFloat(province.staffToBedRatio) >= 0.5
                              ? 'bg-green-50 text-green-700'
                              : parseFloat(province.staffToBedRatio) >= 0.3
                              ? 'bg-yellow-50 text-yellow-700'
                              : 'bg-red-50 text-red-700'
                          }
                        >
                          {province.staffToBedRatio}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
