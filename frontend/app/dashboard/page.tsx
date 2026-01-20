'use client';

import { useDashboardStats } from '@/hooks/use-analytics';
import { useSurveys } from '@/hooks/use-surveys';
import { useStore } from '@tanstack/react-store';
import { authStore } from '@/store/auth-store';
import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar } from "@/components/ui/calendar"
import { useState } from 'react'
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
  AreaChart,
  Area,
  LabelList,
} from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

// Dummy data for Kebumen kecamatan distribution
const KEBUMEN_KECAMATAN_DATA = [
  { name: 'Kebumen', services: 8 },
  { name: 'Gombong', services: 6 },
  { name: 'Kutowinangun', services: 5 },
  { name: 'Karanganyar', services: 4 },
  { name: 'Prembun', services: 4 },
  { name: 'Pejagoan', services: 3 },
  { name: 'Sruweng', services: 3 },
  { name: 'Petanahan', services: 3 },
  { name: 'Klirong', services: 2 },
  { name: 'Buluspesantren', services: 2 },
  { name: 'Ambal', services: 2 },
  { name: 'Alian', services: 2 },
  { name: 'Sempor', services: 1 },
  { name: 'Rowokele', services: 1 },
  { name: 'Kuwarasan', services: 1 },
  { name: 'Adimulyo', services: 1 },
];

const breadcrumbs = [
  { label: "Dasbor" },
];

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

export default function DashboardPage() {
  const { data: stats, isLoading } = useDashboardStats();
  const { data: pendingSurveys } = useSurveys({ verification_status: 'SUBMITTED', page_size: 5 });
  const user = useStore(authStore, (state) => state.user);
  const [date, setDate] = useState<Date | undefined>(new Date());

  // Extract first name from user.name
  const firstName = user?.name?.split(' ')[0] || 'Pengguna';

  if (isLoading) {
    return (
      <>
        <PageHeader breadcrumbs={breadcrumbs} />
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
      <PageHeader breadcrumbs={breadcrumbs} />

      <div className="flex flex-1 flex-col gap-4 p-8">
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

        {/* Activity Overview + Calendar Row */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Card className="col-span-4">
            <CardHeader>
              <CardTitle>Ikhtisar Aktivitas</CardTitle>
              <CardDescription>Aktivitas pengguna selama 14 hari terakhir</CardDescription>
            </CardHeader>
            <CardContent className="pl-2 pb-2">
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={activityTrendData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                  <defs>
                    <linearGradient id="colorActivities" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4}/>
                      <stop offset="50%" stopColor="hsl(var(--primary))" stopOpacity={0.15}/>
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.02}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted/50" vertical={false} />
                  <XAxis
                    dataKey="date"
                    className="text-xs"
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    className="text-xs"
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                    domain={[0, yAxisMax]}
                    allowDataOverflow={false}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '12px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                    }}
                    labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 600 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="activities"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2.5}
                    fill="url(#colorActivities)"
                    dot={false}
                    activeDot={{
                      r: 6,
                      fill: 'hsl(var(--primary))',
                      stroke: 'hsl(var(--background))',
                      strokeWidth: 2
                    }}
                  />
                </AreaChart>
              </ResponsiveContainer>
              <p className="text-xs text-muted-foreground mt-4 px-4">
                Pantau aktivitas sistem termasuk login, pengajuan data, dan proses verifikasi di semua peran pengguna selama dua minggu terakhir
              </p>
            </CardContent>
          </Card>

          <Card className="col-span-3">
            <CardHeader>
              <CardTitle>Kalender</CardTitle>
              <CardDescription>Jadwal dan tanggal penting</CardDescription>
            </CardHeader>
            <CardContent className="flex gap-4 pt-0">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                captionLayout="dropdown"
                className="rounded-md [--cell-size:theme(spacing.10)] text-base"
              />
              <div className="w-px bg-border" />
              <div className="flex-1 space-y-3">
                <div className="text-sm font-medium">
                  {date?.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
                <div className="space-y-3 divide-y divide-border">
                  <div className="pt-3 first:pt-0">
                    <p className="text-sm font-medium">Verifikasi Survei</p>
                    <p className="text-xs text-muted-foreground">3 survei menunggu verifikasi</p>
                  </div>
                  <div className="pt-3">
                    <p className="text-sm font-medium">Deadline Laporan</p>
                    <p className="text-xs text-muted-foreground">Laporan bulanan jatuh tempo</p>
                  </div>
                  <div className="pt-3">
                    <p className="text-sm font-medium">Pelatihan Enumerator</p>
                    <p className="text-xs text-muted-foreground">09:00 - 12:00 WIB</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Distribusi Layanan + Geographic Distribution Row */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-12">
          <Card className="lg:col-span-4">
            <CardHeader>
              <CardTitle>Distribusi Layanan</CardTitle>
              <CardDescription>Berdasarkan jenis perawatan utama (MTC)</CardDescription>
            </CardHeader>
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

          <Card className="lg:col-span-8">
            <CardContent className="pl-2 pt-4 relative h-full">
              <div className="absolute top-4 right-4 text-right z-10">
                <div className="text-base font-semibold">Distribusi Geografis</div>
                <div className="text-xs text-muted-foreground">Sebaran layanan kesehatan jiwa<br />berdasarkan kecamatan di Kabupaten Kebumen</div>
              </div>
              <ResponsiveContainer width="100%" height={430}>
                <BarChart data={KEBUMEN_KECAMATAN_DATA.slice(0, 10)} margin={{ top: 20, right: 10, left: 0, bottom: 5 }}>
                  <defs>
                    <linearGradient id="colorServices" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#4DA1DB" stopOpacity={1}/>
                      <stop offset="100%" stopColor="#4DA1DB" stopOpacity={0.7}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted-foreground))" strokeOpacity={0.15} strokeWidth={0.5} />
                  <XAxis
                    dataKey="name"
                    className="text-xs"
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                    interval={0}
                  />
                  <YAxis
                    className="text-xs"
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    orientation="left"
                    tickMargin={8}
                  />
                  <Bar dataKey="services" fill="url(#colorServices)" radius={[6, 6, 0, 0]}>
                    <LabelList
                      dataKey="services"
                      position="top"
                      fill="hsl(var(--foreground))"
                      fontSize={11}
                      fontWeight={600}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Bottom Row */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Card className="col-span-4">
            <CardHeader>
              <CardTitle>Survei Tertunda Terbaru</CardTitle>
              <CardDescription>Menunggu verifikasi</CardDescription>
            </CardHeader>
                  <CardContent>
              <div className="space-y-3">
                {pendingSurveys?.results && pendingSurveys.results.length > 0 ? (
                  pendingSurveys.results.map((survey) => (
                    <div
                      key={survey.id}
                      className="flex items-center justify-between rounded-xl bg-muted/50 p-3 hover:bg-accent transition-colors"
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
