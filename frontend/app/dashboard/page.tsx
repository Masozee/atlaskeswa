'use client';

import { useDashboardStats } from '@/hooks/use-analytics';
import { useSurveys } from '@/hooks/use-surveys';
import { useQuery } from '@tanstack/react-query';
import { useStore } from '@tanstack/react-store';
import { authStore } from '@/store/auth-store';
import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import { Separator } from "@/components/ui/separator"
import { useState, useMemo } from 'react'
import { surveysQueryOptions } from '@/hooks/use-surveys'
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
  LabelList,
} from 'recharts';

// Chart colors based on primary teal #00979D
const COLORS = ['#00979D', '#4DB6AC', '#FFBF47', '#FF8A65', '#9575CD', '#81C784'];


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

  const selectedDateStr = useMemo(() => {
    if (!date) return undefined;
    return date.toISOString().split('T')[0];
  }, [date]);

  const { data: dateSurveys, isLoading: dateLoading } = useQuery({
    ...surveysQueryOptions({ survey_date: selectedDateStr, page_size: 10 }),
    enabled: !!selectedDateStr,
  });

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
    logins: item.logins,
    submissions: item.submissions,
  }));

  return (
    <>
      <PageHeader breadcrumbs={breadcrumbs} />

      <div className="flex flex-1 flex-col gap-4">
        <div className="px-8 pt-8">
          <h1 className="text-2xl font-bold">Selamat Datang Kembali, {firstName}!</h1>
        </div>

        <Separator />

        <div className="flex flex-col gap-4 px-8 pb-8">
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
            title="Kecamatan"
            secondTitle="Kecamatan dengan layanan"
            value={stats?.geographic_distribution?.length || 0}
            subtitle={`dari ${stats?.services.total || 0} total layanan`}
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
              <div className="flex items-center gap-4 px-4 mb-3">
                <div className="flex items-center gap-1.5">
                  <div className="h-3 w-3 rounded-sm" style={{ backgroundColor: '#00979D' }} />
                  <span className="text-xs text-muted-foreground">Login</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-3 w-3 rounded-sm" style={{ backgroundColor: '#FFBF47' }} />
                  <span className="text-xs text-muted-foreground">Pengajuan Survei</span>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={activityTrendData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }} barGap={2}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted/50" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '10px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                    }}
                    labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 600, marginBottom: 4 }}
                    formatter={(value, name) => [
                      value,
                      name === 'logins' ? 'Login' : 'Pengajuan Survei',
                    ]}
                  />
                  <Bar dataKey="logins" fill="#00979D" radius={[4, 4, 0, 0]} maxBarSize={24} />
                  <Bar dataKey="submissions" fill="#FFBF47" radius={[4, 4, 0, 0]} maxBarSize={24} />
                </BarChart>
              </ResponsiveContainer>
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
              <div className="flex-1 min-w-0 space-y-3">
                <div className="text-sm font-medium">
                  {date?.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
                <div className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Survei</div>
                {dateLoading ? (
                  <p className="text-xs text-muted-foreground">Memuat...</p>
                ) : dateSurveys?.results && dateSurveys.results.length > 0 ? (
                  <div className="space-y-2">
                    {dateSurveys.results.map((survey) => (
                      <div key={survey.id} className="rounded-lg bg-muted/50 p-2 space-y-1">
                        <p className="text-xs font-medium leading-tight truncate">{survey.service_name}</p>
                        <Badge
                          variant="outline"
                          className="text-[10px] px-1.5 py-0"
                        >
                          {survey.verification_status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">Tidak ada survei pada tanggal ini.</p>
                )}
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
            <CardHeader>
              <CardTitle>Distribusi Geografis</CardTitle>
              <CardDescription>Sebaran layanan kesehatan jiwa per kecamatan</CardDescription>
            </CardHeader>
            <CardContent className="pl-2 pb-4">
              <ResponsiveContainer width="100%" height={380}>
                <BarChart
                  data={stats?.geographic_distribution.map(d => ({ name: (d as any).kecamatan ?? (d as any).city, services: d.count }))}
                  margin={{ top: 20, right: 16, left: 0, bottom: 80 }}
                >
                  <defs>
                    <linearGradient id="colorServices" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#00979D" stopOpacity={1}/>
                      <stop offset="100%" stopColor="#00979D" stopOpacity={0.7}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted-foreground))" strokeOpacity={0.15} strokeWidth={0.5} vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                    interval={0}
                    angle={-45}
                    textAnchor="end"
                  />
                  <YAxis
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                    tickMargin={8}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value) => [value, 'Layanan']}
                  />
                  <Bar dataKey="services" fill="url(#colorServices)" radius={[4, 4, 0, 0]} maxBarSize={32}>
                    <LabelList
                      dataKey="services"
                      position="top"
                      fill="hsl(var(--foreground))"
                      fontSize={10}
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
      </div>
    </>
  );
}
