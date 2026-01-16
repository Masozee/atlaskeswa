'use client';

import { useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  LineChart,
  Line,
} from 'recharts';
import { Button } from '@/components/ui/button';

interface Survey {
  id: number;
  service: number;
  service_name: string;
  survey_date: string;
  surveyor: number;
  surveyor_name: string;
  verification_status: 'DRAFT' | 'SUBMITTED' | 'VERIFIED' | 'REJECTED';
  total_patients_served: number;
  created_at: string;
}

interface User {
  id: number;
  full_name: string;
  role: string;
}

const STATUS_COLORS = {
  VERIFIED: '#22c55e',
  SUBMITTED: '#3b82f6',
  DRAFT: '#f59e0b',
  REJECTED: '#ef4444',
};

export default function PerformanceReportPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedUserId = searchParams.get('user');

  const { data: usersData } = useQuery({
    queryKey: ['enumerators'],
    queryFn: () =>
      apiClient.get<{ count: number; results: User[] }>('/accounts/users/', {
        page_size: 100,
      }),
  });

  const { data: surveysData } = useQuery({
    queryKey: ['performance-surveys', selectedUserId],
    queryFn: () =>
      apiClient.get<{ count: number; results: Survey[] }>(
        '/surveys/surveys/',
        {
          page_size: 500,
          ordering: '-survey_date',
          ...(selectedUserId && { surveyor: selectedUserId }),
        }
      ),
  });

  const enumerators = useMemo(
    () => usersData?.results?.filter((user) => user.role === 'SURVEYOR') || [],
    [usersData]
  );

  const selectedUser = useMemo(() => {
    if (!selectedUserId) return null;
    return enumerators.find((u) => u.id === parseInt(selectedUserId));
  }, [selectedUserId, enumerators]);

  // Performance metrics by enumerator
  const performanceByEnumerator = useMemo(() => {
    if (!surveysData?.results) return [];

    const grouped = surveysData.results.reduce((acc, survey) => {
      const key = survey.surveyor_name;
      if (!acc[key]) {
        acc[key] = {
          name: survey.surveyor_name,
          total: 0,
          verified: 0,
          submitted: 0,
          draft: 0,
          rejected: 0,
          totalPatients: 0,
        };
      }
      acc[key].total++;
      acc[key].totalPatients += survey.total_patients_served || 0;

      if (survey.verification_status === 'VERIFIED') acc[key].verified++;
      else if (survey.verification_status === 'SUBMITTED') acc[key].submitted++;
      else if (survey.verification_status === 'DRAFT') acc[key].draft++;
      else if (survey.verification_status === 'REJECTED') acc[key].rejected++;

      return acc;
    }, {} as Record<string, any>);

    return Object.values(grouped);
  }, [surveysData]);

  // Status distribution for pie chart
  const statusDistribution = useMemo(() => {
    if (!surveysData?.results) return [];

    const stats = surveysData.results.reduce(
      (acc, survey) => {
        acc[survey.verification_status] = (acc[survey.verification_status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    return [
      { name: 'Verified', value: stats.VERIFIED || 0, color: STATUS_COLORS.VERIFIED },
      { name: 'Submitted', value: stats.SUBMITTED || 0, color: STATUS_COLORS.SUBMITTED },
      { name: 'Draft', value: stats.DRAFT || 0, color: STATUS_COLORS.DRAFT },
      { name: 'Rejected', value: stats.REJECTED || 0, color: STATUS_COLORS.REJECTED },
    ].filter((item) => item.value > 0);
  }, [surveysData]);

  // Monthly trend
  const monthlyTrend = useMemo(() => {
    if (!surveysData?.results) return [];

    const grouped = surveysData.results.reduce((acc, survey) => {
      const month = new Date(survey.survey_date).toLocaleDateString('id-ID', {
        month: 'short',
        year: 'numeric',
      });

      if (!acc[month]) {
        acc[month] = {
          month,
          surveys: 0,
          verified: 0,
          patients: 0,
        };
      }

      acc[month].surveys++;
      if (survey.verification_status === 'VERIFIED') acc[month].verified++;
      acc[month].patients += survey.total_patients_served || 0;

      return acc;
    }, {} as Record<string, any>);

    return Object.values(grouped).reverse().slice(0, 6);
  }, [surveysData]);

  const totalStats = useMemo(() => {
    if (!surveysData?.results) return null;

    const surveys = surveysData.results;
    return {
      total: surveys.length,
      verified: surveys.filter((s) => s.verification_status === 'VERIFIED').length,
      submitted: surveys.filter((s) => s.verification_status === 'SUBMITTED').length,
      draft: surveys.filter((s) => s.verification_status === 'DRAFT').length,
      rejected: surveys.filter((s) => s.verification_status === 'REJECTED').length,
      totalPatients: surveys.reduce((sum, s) => sum + (s.total_patients_served || 0), 0),
      avgPatients: Math.round(
        surveys.reduce((sum, s) => sum + (s.total_patients_served || 0), 0) / surveys.length
      ),
      successRate: surveys.length
        ? Math.round(
            (surveys.filter((s) => s.verification_status === 'VERIFIED').length /
              surveys.length) *
              100
          )
        : 0,
    };
  }, [surveysData]);

  const handleUserChange = (userId: string) => {
    if (userId === 'all') {
      router.push('/enumerators/performance');
    } else {
      router.push(`/enumerators/performance?user=${userId}`);
    }
  };

  return (
    <div className="flex flex-col">
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <div className="flex flex-1 items-center gap-2">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/enumerators">
                  Enumerator Management
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Performance Report</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        <DateTime />
      </header>

      <div className="flex-1 p-6 space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Performance Report</h1>
            <p className="text-muted-foreground mt-1">
              Analyze enumerator performance and survey statistics
            </p>
          </div>
          <div className="flex items-center gap-3">
            {selectedUser && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-muted text-sm">
                <span className="text-muted-foreground">Viewing:</span>
                <span className="font-medium">{selectedUser.full_name}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 w-5 p-0 hover:bg-transparent"
                  onClick={() => router.push('/enumerators/performance')}
                >
                  ✕
                </Button>
              </div>
            )}
            <Select value={selectedUserId || 'all'} onValueChange={handleUserChange}>
              <SelectTrigger className="w-56">
                <SelectValue placeholder="Select enumerator" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Enumerators</SelectItem>
                {enumerators.map((user) => (
                  <SelectItem key={user.id} value={user.id.toString()}>
                    {user.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {totalStats && (
          <div className="grid grid-cols-4 gap-4">
            <div className="rounded-lg border bg-card p-4">
              <div className="text-sm text-muted-foreground">Total Surveys</div>
              <div className="text-2xl font-bold">{totalStats.total}</div>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <div className="text-sm text-muted-foreground">Verified Rate</div>
              <div className="text-2xl font-bold text-green-600">
                {totalStats.successRate}%
              </div>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <div className="text-sm text-muted-foreground">Total Patients</div>
              <div className="text-2xl font-bold text-blue-600">
                {totalStats.totalPatients.toLocaleString()}
              </div>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <div className="text-sm text-muted-foreground">Avg Patients/Survey</div>
              <div className="text-2xl font-bold text-purple-600">
                {totalStats.avgPatients}
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Status Distribution</CardTitle>
              <CardDescription>Survey status breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`
                    }
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Monthly Trend</CardTitle>
              <CardDescription>Survey completion over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="surveys"
                    stroke="#3b82f6"
                    name="Total Surveys"
                  />
                  <Line
                    type="monotone"
                    dataKey="verified"
                    stroke="#22c55e"
                    name="Verified"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {!selectedUserId && (
          <Card>
            <CardHeader>
              <CardTitle>Performance by Enumerator</CardTitle>
              <CardDescription>Survey completion and verification rates</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={performanceByEnumerator}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="verified" fill="#22c55e" name="Verified" />
                  <Bar dataKey="submitted" fill="#3b82f6" name="Submitted" />
                  <Bar dataKey="draft" fill="#f59e0b" name="Draft" />
                  <Bar dataKey="rejected" fill="#ef4444" name="Rejected" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
