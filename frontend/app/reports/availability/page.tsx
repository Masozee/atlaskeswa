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
  LineChart,
  Line,
} from 'recharts';
import { HugeiconsIcon } from "@hugeicons/react"
import {Hospital01Icon, CheckmarkCircle02Icon, Time01Icon, Cancel01Icon} from "@hugeicons/core-free-icons";

const breadcrumbs: BreadcrumbItemType[] = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Reports & Analytics', href: '/reports' },
  { label: 'Service Availability' },
];

export default function ServiceAvailabilityReportPage() {
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
    const total = filteredServices.length;
    const verified = filteredServices.filter((s) => s.verification_status === 'VERIFIED').length;
    const pending = filteredServices.filter((s) => s.verification_status === 'SUBMITTED').length;
    const rejected = filteredServices.filter((s) => s.verification_status === 'REJECTED').length;

    return {
      total,
      verified,
      pending,
      rejected,
      verificationRate: total > 0 ? ((verified / total) * 100).toFixed(1) : '0',
    };
  }, [filteredServices]);

  // Services by province
  const servicesByProvince = useMemo(() => {
    const grouped = new Map<string, number>();
    filteredServices.forEach((service) => {
      const count = grouped.get(service.province) || 0;
      grouped.set(service.province, count + 1);
    });
    return Array.from(grouped.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [filteredServices]);

  // Services by MTC
  const servicesByMTC = useMemo(() => {
    const grouped = new Map<string, number>();
    filteredServices.forEach((service) => {
      const mtc = service.mtc_code || 'Unknown';
      const count = grouped.get(mtc) || 0;
      grouped.set(mtc, count + 1);
    });
    return Array.from(grouped.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredServices]);

  // Verification status distribution
  const verificationData = [
    { name: 'Verified', value: stats.verified, color: '#22c55e' },
    { name: 'Pending', value: stats.pending, color: '#00979D' },
    { name: 'Rejected', value: stats.rejected, color: '#ef4444' },
  ];

  // Capacity distribution by province
  const capacityByProvince = useMemo(() => {
    const grouped = new Map<string, { beds: number; staff: number }>();
    filteredServices.forEach((service) => {
      const current = grouped.get(service.province) || { beds: 0, staff: 0 };
      grouped.set(service.province, {
        beds: current.beds + (service.total_beds || 0),
        staff: current.staff + (service.total_staff || 0),
      });
    });
    return Array.from(grouped.entries())
      .map(([name, data]) => ({
        name,
        beds: data.beds,
        staff: data.staff,
      }))
      .sort((a, b) => b.beds - a.beds)
      .slice(0, 10);
  }, [filteredServices]);

  return (
    <>
      <PageHeader breadcrumbs={breadcrumbs} />

      <div className="flex flex-1 flex-col gap-4 p-6">
        <div>
          <h1 className="text-2xl font-bold">Service Availability Report</h1>
          <p className="text-muted-foreground">
            Comprehensive overview of mental health service availability across Indonesia
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
              <CardTitle className="text-sm font-medium">Total Services</CardTitle>
              <HugeiconsIcon icon={Hospital01Icon} size={16} className="text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">Mental health facilities</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Verified</CardTitle>
              <HugeiconsIcon icon={CheckmarkCircle02Icon} size={16} className="text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.verified}</div>
              <p className="text-xs text-muted-foreground">{stats.verificationRate}% verification rate</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
              <HugeiconsIcon icon={Time01Icon} size={16} className="text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.pending}</div>
              <p className="text-xs text-muted-foreground">Awaiting verification</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rejected</CardTitle>
              <HugeiconsIcon icon={Cancel01Icon} size={16} className="text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{stats.rejected}</div>
              <p className="text-xs text-muted-foreground">Requires correction</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* Services by Province */}
          <Card>
            <CardHeader>
              <CardTitle>Services by Province</CardTitle>
              <CardDescription>Top 10 provinces by service count</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={servicesByProvince}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} fontSize={12} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#00979D" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Verification Status */}
          <Card>
            <CardHeader>
              <CardTitle>Verification Status Distribution</CardTitle>
              <CardDescription>Service verification breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={verificationData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {verificationData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* MTC Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Services by MTC Category</CardTitle>
              <CardDescription>Main Type of Care distribution</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={servicesByMTC} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={60} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#22c55e" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Capacity by Province */}
          <Card>
            <CardHeader>
              <CardTitle>Capacity by Province</CardTitle>
              <CardDescription>Total beds and staff distribution</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={capacityByProvince}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} fontSize={12} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="beds" stroke="#00979D" strokeWidth={2} name="Total Beds" />
                  <Line type="monotone" dataKey="staff" stroke="#22c55e" strokeWidth={2} name="Total Staff" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Table */}
        <Card>
          <CardHeader>
            <CardTitle>Service Details</CardTitle>
            <CardDescription>Detailed breakdown of filtered services</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="p-2 text-left">Service Name</th>
                    <th className="p-2 text-left">Province</th>
                    <th className="p-2 text-left">City</th>
                    <th className="p-2 text-left">MTC</th>
                    <th className="p-2 text-left">BSIC</th>
                    <th className="p-2 text-left">Beds</th>
                    <th className="p-2 text-left">Staff</th>
                    <th className="p-2 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredServices.slice(0, 20).map((service) => (
                    <tr key={service.id} className="border-b hover:bg-muted/50">
                      <td className="p-2 font-medium">{service.service_name}</td>
                      <td className="p-2">{service.province}</td>
                      <td className="p-2">{service.city}</td>
                      <td className="p-2">
                        <Badge variant="outline">{service.mtc_code}</Badge>
                      </td>
                      <td className="p-2">
                        <Badge variant="outline">{service.bsic_code}</Badge>
                      </td>
                      <td className="p-2">{service.total_beds}</td>
                      <td className="p-2">{service.total_staff}</td>
                      <td className="p-2">
                        <Badge
                          variant={
                            service.verification_status === 'VERIFIED'
                              ? 'default'
                              : service.verification_status === 'SUBMITTED'
                              ? 'secondary'
                              : 'destructive'
                          }
                        >
                          {service.verification_status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredServices.length > 20 && (
                <p className="mt-4 text-center text-sm text-muted-foreground">
                  Showing 20 of {filteredServices.length} services
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
