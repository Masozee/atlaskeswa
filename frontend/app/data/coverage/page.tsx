'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { DateTime } from '@/components/date-time';
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
} from 'recharts';

interface Service {
  id: number;
  name: string;
  city: string;
  province: string;
  bed_capacity: number;
  total_professional_staff: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export default function CoverageAnalysisPage() {
  const { data: servicesData } = useQuery({
    queryKey: ['coverage-services'],
    queryFn: () =>
      apiClient.get<{ count: number; results: Service[] }>(
        '/directory/services/',
        {
          page_size: 500,
        }
      ),
  });

  // Province-level analysis
  const provinceAnalysis = useMemo(() => {
    if (!servicesData?.results) return [];

    const analysis: Record<string, any> = {};
    servicesData.results.forEach((service) => {
      if (!analysis[service.province]) {
        analysis[service.province] = {
          province: service.province,
          serviceCount: 0,
          totalBeds: 0,
          totalStaff: 0,
          cities: new Set(),
        };
      }

      analysis[service.province].serviceCount++;
      analysis[service.province].totalBeds += service.bed_capacity;
      analysis[service.province].totalStaff += service.total_professional_staff;
      analysis[service.province].cities.add(service.city);
    });

    return Object.values(analysis)
      .map((item: any) => ({
        ...item,
        cityCount: item.cities.size,
      }))
      .sort((a: any, b: any) => b.serviceCount - a.serviceCount);
  }, [servicesData]);

  // City-level analysis
  const cityAnalysis = useMemo(() => {
    if (!servicesData?.results) return [];

    const analysis: Record<string, any> = {};
    servicesData.results.forEach((service) => {
      if (!analysis[service.city]) {
        analysis[service.city] = {
          city: service.city,
          province: service.province,
          serviceCount: 0,
          totalBeds: 0,
          totalStaff: 0,
        };
      }

      analysis[service.city].serviceCount++;
      analysis[service.city].totalBeds += service.bed_capacity;
      analysis[service.city].totalStaff += service.total_professional_staff;
    });

    return Object.values(analysis).sort(
      (a: any, b: any) => b.serviceCount - a.serviceCount
    );
  }, [servicesData]);

  const totalStats = useMemo(() => {
    if (!servicesData?.results) return null;

    return {
      totalServices: servicesData.count,
      totalBeds: servicesData.results.reduce(
        (sum, s) => sum + s.bed_capacity,
        0
      ),
      totalStaff: servicesData.results.reduce(
        (sum, s) => sum + s.total_professional_staff,
        0
      ),
      totalProvinces: new Set(servicesData.results.map((s) => s.province)).size,
      totalCities: new Set(servicesData.results.map((s) => s.city)).size,
    };
  }, [servicesData]);

  return (
    <div className="flex flex-col">
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <div className="flex flex-1 items-center gap-2">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/data">Data Explorer</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Population Coverage Analysis</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        <DateTime />
      </header>

      <div className="flex-1 p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Population Coverage Analysis</h1>
          <p className="text-muted-foreground mt-1">
            Geographic distribution and service coverage metrics
          </p>
        </div>

        {totalStats && (
          <div className="grid grid-cols-5 gap-4">
            <div className="rounded-lg border bg-card p-4">
              <div className="text-sm text-muted-foreground">Total Services</div>
              <div className="text-2xl font-bold">{totalStats.totalServices}</div>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <div className="text-sm text-muted-foreground">Provinces Covered</div>
              <div className="text-2xl font-bold text-blue-600">
                {totalStats.totalProvinces}
              </div>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <div className="text-sm text-muted-foreground">Cities Covered</div>
              <div className="text-2xl font-bold text-green-600">
                {totalStats.totalCities}
              </div>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <div className="text-sm text-muted-foreground">Total Beds</div>
              <div className="text-2xl font-bold text-purple-600">
                {totalStats.totalBeds}
              </div>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <div className="text-sm text-muted-foreground">Total Staff</div>
              <div className="text-2xl font-bold text-orange-600">
                {totalStats.totalStaff}
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Services by Province</CardTitle>
              <CardDescription>Top provinces by service count</CardDescription>
            </CardHeader>
            <Separator />
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={provinceAnalysis.slice(0, 10)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="province" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="serviceCount" fill="#3b82f6" name="Services" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Bed Capacity by Province</CardTitle>
              <CardDescription>Total beds available per province</CardDescription>
            </CardHeader>
            <Separator />
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={provinceAnalysis.slice(0, 10)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="province" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="totalBeds" fill="#22c55e" name="Beds" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Top Cities by Service Count</CardTitle>
            <CardDescription>Cities with most mental health services</CardDescription>
          </CardHeader>
          <Separator />
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={cityAnalysis.slice(0, 15)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="city" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="serviceCount" fill="#8b5cf6" name="Services" />
                <Bar dataKey="totalBeds" fill="#f59e0b" name="Beds" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Service Distribution (Top 6 Provinces)</CardTitle>
            <CardDescription>Percentage share of total services</CardDescription>
          </CardHeader>
          <Separator />
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie
                  data={provinceAnalysis.slice(0, 6)}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ payload, percent }: { payload?: { province?: string; serviceCount?: number }; percent?: number }) =>
                    `${payload?.province ?? ''}: ${payload?.serviceCount ?? 0} (${((percent ?? 0) * 100).toFixed(0)}%)`
                  }
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="serviceCount"
                >
                  {provinceAnalysis.slice(0, 6).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
