'use client';

import { useDashboardStats } from '@/hooks/use-analytics';
import { useSurveys } from '@/hooks/use-surveys';
import { DateTime } from "@/components/date-time"
import { useStore } from '@tanstack/react-store';
import { authStore } from '@/store/auth-store';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from 'recharts';
import { HugeiconsIcon } from "@hugeicons/react"
import {Hospital01Icon, ClipboardIcon, UserMultiple02Icon, BedIcon} from "@hugeicons/core-free-icons";

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

function StatCard({
  title,
  value,
  subtitle,
  secondTitle,
  trend,
}: {
  title: string;
  value: number | string;
  subtitle?: string;
  secondTitle?: string;
  trend?: string;
}) {
  return (
    <Card>
      <CardHeader className="space-y-0 pb-3">
        <CardTitle className="text-sm font-medium">
          {title}
        </CardTitle>
        {secondTitle && (
          <CardDescription className="text-xs">
            {secondTitle}
          </CardDescription>
        )}
      </CardHeader>
      <Separator />
      <CardContent className="pt-4">
        <div className="text-2xl font-bold">{typeof value === 'number' ? value.toLocaleString() : value}</div>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">
            {subtitle}
          </p>
        )}
        {trend && (
          <p className="text-xs text-green-600 mt-1">
            {trend}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export default function DashboardOverviewPage() {
  const { data: stats, isLoading } = useDashboardStats();
  const { data: pendingSurveys } = useSurveys({ verification_status: 'SUBMITTED', page_size: 5 });
  const user = useStore(authStore, (state) => state.user);

  // Extract first name from user.name
  const firstName = user?.name?.split(' ')[0] || 'Pengguna';

  if (isLoading) {
    return (
      <>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/dashboard">Dasbor</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Ringkasan</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div className="ml-auto">
            <DateTime />
          </div>
        </header>
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <div className="h-16 w-16 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
            <p className="text-sm text-muted-foreground">Memuat dasbor...</p>
          </div>
        </div>
      </>
    );
  }

  // Prepare chart data
  const mtcChartData = stats?.mtc_distribution.slice(0, 5).map((item) => ({
    name: item.mtc__code,
    value: item.count,
  }));

  const provinceChartData = stats?.geographic_distribution.slice(0, 8).map((item) => ({
    name: item.province,
    services: item.count,
  }));

  const activityTrendData = stats?.activity_trends.slice(-14).map((item) => ({
    date: new Date(item.day).toLocaleDateString('id-ID', { month: 'short', day: 'numeric' }),
    activities: item.count,
  }));

  // Calculate y-axis domain for better visualization
  const activityValues = activityTrendData?.map(item => item.activities) || [];
  const maxActivity = Math.max(...activityValues, 10); // Minimum of 10
  const yAxisMax = Math.ceil(maxActivity * 1.2); // Add 20% padding

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard">Dasbor</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Ringkasan</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="ml-auto">
          <DateTime />
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-4">
        {/* Welcome Message */}
        <div>
          <h1 className="text-2xl font-bold">Selamat Datang Kembali, {firstName}!</h1>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Layanan"
            secondTitle="Fasilitas kesehatan jiwa"
            value={stats?.services.total || 0}
            subtitle={`${stats?.services.verified || 0} terverifikasi`}
            trend={`+${stats?.services.recent || 0} minggu ini`}
          />
          <StatCard
            title="Survei Tertunda"
            secondTitle="Menunggu verifikasi"
            value={stats?.surveys.pending || 0}
            subtitle={`${stats?.surveys.total || 0} total survei`}
          />
          <StatCard
            title="Pengguna Aktif"
            secondTitle="Saat ini online"
            value={stats?.users.active || 0}
            subtitle={`${stats?.users.total || 0} total pengguna`}
          />
          <StatCard
            title="Kapasitas Tempat Tidur"
            secondTitle="Total tempat tidur tersedia"
            value={stats?.capacity.total_beds || 0}
            subtitle={`${stats?.capacity.total_staff || 0} anggota staf`}
          />
        </div>

        {/* Charts Row */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Card className="col-span-4">
            <CardHeader>
              <CardTitle>Ikhtisar Aktivitas</CardTitle>
              <CardDescription>Aktivitas pengguna selama 14 hari terakhir</CardDescription>
            </CardHeader>
            <Separator />
            <CardContent className="pl-2 pb-2">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={activityTrendData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <defs>
                    <linearGradient id="colorActivities" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="date"
                    className="text-xs"
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis
                    className="text-xs"
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                    domain={[0, yAxisMax]}
                    allowDataOverflow={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="activities"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    fill="url(#colorActivities)"
                    fillOpacity={1}
                    dot={{ fill: 'hsl(var(--primary))', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
              <p className="text-xs text-muted-foreground mt-4 px-4">
                Pantau aktivitas sistem termasuk login, pengajuan data, dan proses verifikasi di semua peran pengguna selama dua minggu terakhir
              </p>
            </CardContent>
          </Card>

          <Card className="col-span-3">
            <CardHeader>
              <CardTitle>Distribusi Layanan</CardTitle>
              <CardDescription>Berdasarkan jenis perawatan utama (MTC)</CardDescription>
            </CardHeader>
            <Separator />
            <CardContent className="pb-2">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={mtcChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {mtcChartData?.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <p className="text-xs text-muted-foreground mt-4 px-4">
                Distribusi layanan kesehatan jiwa yang dikategorikan berdasarkan kode Jenis Perawatan Utama (MTC) sesuai klasifikasi DESDE-LTC
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Geographic Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Distribusi Geografis</CardTitle>
            <CardDescription>Layanan berdasarkan provinsi</CardDescription>
          </CardHeader>
          <Separator />
          <CardContent className="pl-2">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={provinceChartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="name"
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px'
                  }}
                />
                <Bar dataKey="services" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Bottom Row */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Card className="col-span-4">
            <CardHeader>
              <CardTitle>Survei Tertunda Terbaru</CardTitle>
              <CardDescription>Menunggu verifikasi</CardDescription>
            </CardHeader>
            <Separator />
            <CardContent>
              <div className="space-y-3">
                {pendingSurveys?.results && pendingSurveys.results.length > 0 ? (
                  pendingSurveys.results.map((survey) => (
                    <div
                      key={survey.id}
                      className="flex items-center justify-between rounded-xl border p-3 hover:bg-accent transition-colors"
                    >
                      <div className="space-y-1">
                        <p className="text-sm font-medium leading-none">{survey.service_name}</p>
                        <p className="text-sm text-muted-foreground">oleh {survey.surveyor_name}</p>
                      </div>
                      <div className="ml-auto font-medium">
                        <span className="inline-flex items-center rounded-md bg-orange-50 px-2 py-1 text-xs font-medium text-orange-700 ring-1 ring-inset ring-orange-600/20">
                          Tertunda
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-sm text-muted-foreground py-8">Tidak ada survei tertunda</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="col-span-3">
            <CardHeader>
              <CardTitle>Distribusi Staf</CardTitle>
              <CardDescription>Tenaga kesehatan profesional</CardDescription>
            </CardHeader>
            <Separator />
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center">
                  <div className="ml-4 space-y-1 flex-1">
                    <p className="text-sm font-medium leading-none">Psikiater</p>
                    <p className="text-sm text-muted-foreground">
                      Dokter spesialis kesehatan jiwa
                    </p>
                  </div>
                  <div className="ml-auto font-bold text-2xl">
                    {stats?.capacity.psychiatrists || 0}
                  </div>
                </div>
                <Separator />
                <div className="flex items-center">
                  <div className="ml-4 space-y-1 flex-1">
                    <p className="text-sm font-medium leading-none">Psikolog</p>
                    <p className="text-sm text-muted-foreground">
                      Konselor dan terapis kesehatan jiwa
                    </p>
                  </div>
                  <div className="ml-auto font-bold text-2xl">
                    {stats?.capacity.psychologists || 0}
                  </div>
                </div>
                <Separator />
                <div className="flex items-center">
                  <div className="ml-4 space-y-1 flex-1">
                    <p className="text-sm font-medium leading-none">Perawat</p>
                    <p className="text-sm text-muted-foreground">
                      Perawat terdaftar yang memberikan perawatan
                    </p>
                  </div>
                  <div className="ml-auto font-bold text-2xl">
                    {stats?.capacity.nurses || 0}
                  </div>
                </div>
                <Separator />
                <div className="flex items-center">
                  <div className="ml-4 space-y-1 flex-1">
                    <p className="text-sm font-medium leading-none">Pekerja Sosial</p>
                    <p className="text-sm text-muted-foreground">
                      Spesialis dukungan masyarakat
                    </p>
                  </div>
                  <div className="ml-auto font-bold text-2xl">
                    {stats?.capacity.social_workers || 0}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
