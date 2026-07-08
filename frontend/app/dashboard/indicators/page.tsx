'use client';

import { useServiceAnalytics, useSurveyAnalytics } from '@/hooks/use-analytics';
import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from '@/components/ui/separator';
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
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
} from 'recharts';
import {
  UserGroupIcon,
  BedIcon,
  UserMultipleIcon,
  Chart01Icon,
} from 'hugeicons-react';

// Validated categorical palette (dataviz skill, light surface #fcfcfb):
// blue #2a78d6 / aqua #1baf7a / yellow #eda100 — all pass; WARN on contrast
// is relieved by the direct value labels rendered on every mark.
const C = {
  blue: '#2a78d6',
  aqua: '#1baf7a',
  yellow: '#eda100',
  blueSoft: '#9ec5f4',
  blueMid: '#6da7ec',
};

const CHART_FONT = 'var(--font-sans), Inter, system-ui, sans-serif';
const AXIS_TICK = { fill: '#52514e', fontSize: 11, fontFamily: CHART_FONT };
const TOOLTIP_STYLE = {
  backgroundColor: '#ffffff',
  border: '1px solid #E5E7EB',
  borderRadius: '10px',
  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
  fontFamily: CHART_FONT,
  fontSize: 12,
};
const TOOLTIP_LABEL = { color: '#0b0b0b', fontWeight: 600, marginBottom: 4, fontFamily: CHART_FONT };

const breadcrumbs = [
  { label: 'Dasbor', href: '/dashboard' },
  { label: 'Indikator Utama' },
];

const fmt = (n: unknown) => (Number(n) || 0).toLocaleString('id-ID');

export default function KeyIndicatorsPage() {
  const { data: serviceStats, isLoading: serviceLoading } = useServiceAnalytics();
  const { data: surveyStats, isLoading: surveyLoading } = useSurveyAnalytics();

  const isLoading = serviceLoading || surveyLoading;

  if (isLoading) {
    return (
      <>
        <PageHeader breadcrumbs={breadcrumbs} />
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <div className="h-16 w-16 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
            <p className="text-sm text-muted-foreground">Memuat indikator...</p>
          </div>
        </div>
      </>
    );
  }

  const totalPatients = surveyStats?.patient_demographics.total_patients ?? 0;
  const occupancy = surveyStats?.average_occupancy_rate ?? 0;

  const genderData = [
    { name: 'Laki-laki', value: surveyStats?.patient_demographics.male_patients ?? 0, fill: C.blue },
    { name: 'Perempuan', value: surveyStats?.patient_demographics.female_patients ?? 0, fill: C.aqua },
  ];

  const ageData = [
    { name: '0–17 th', value: surveyStats?.patient_demographics.age_0_17 ?? 0 },
    { name: '18–64 th', value: surveyStats?.patient_demographics.age_18_64 ?? 0 },
    { name: '65+ th', value: surveyStats?.patient_demographics.age_65_plus ?? 0 },
  ];

  const insuranceData = [
    { name: 'BPJS', value: serviceStats?.insurance_coverage.bpjs ?? 0 },
    { name: 'Swasta', value: serviceStats?.insurance_coverage.private ?? 0 },
  ];

  const emergencyData = [
    { name: 'Menerima Darurat', value: serviceStats?.emergency_services.accepts_emergency ?? 0 },
    { name: 'Layanan 24/7', value: serviceStats?.emergency_services.twentyfour_seven ?? 0 },
  ];

  const occupancyData = [{ name: 'Hunian', value: occupancy, fill: C.blue }];

  const capacity = [
    { label: 'Rata-rata Tempat Tidur', value: serviceStats?.average_metrics.beds ?? 0, Icon: BedIcon },
    { label: 'Rata-rata Staf', value: serviceStats?.average_metrics.staff ?? 0, Icon: UserMultipleIcon },
    { label: 'Rata-rata Psikiater', value: serviceStats?.average_metrics.psychiatrists ?? 0, Icon: Chart01Icon },
    { label: 'Rata-rata Psikolog', value: serviceStats?.average_metrics.psychologists ?? 0, Icon: Chart01Icon },
  ];

  return (
    <>
      <PageHeader breadcrumbs={breadcrumbs} />

      <div className="flex flex-1 flex-col gap-4">

        <div className="px-8 pt-8">
          <h1 className="text-2xl font-bold">Indikator Utama</h1>
          <p className="text-muted-foreground">Indikator dan metrik kinerja utama</p>
        </div>

        <Separator />

        <div className="px-8 pb-8">
          {/* Bento grid */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-6 lg:auto-rows-[minmax(0,auto)]">

            {/* Hero: total patients — spans 2 cols */}
            <Card className="border-0 bg-primary text-primary-foreground shadow-none lg:col-span-2">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <UserGroupIcon className="h-5 w-5 opacity-90" />
                  <CardTitle className="text-sm font-medium opacity-90">Total Pasien Dilayani</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold tracking-tight">{fmt(totalPatients)}</div>
                <p className="mt-1 text-xs opacity-80">Jumlah kumulatif pasien dari seluruh survei</p>
              </CardContent>
            </Card>

            {/* Occupancy radial gauge — 2 cols */}
            <Card className="border-0 bg-white shadow-none lg:col-span-2">
              <CardHeader className="pb-0">
                <CardTitle className="text-base">Rata-rata Tingkat Hunian</CardTitle>
                <CardDescription>Pemanfaatan tempat tidur</CardDescription>
              </CardHeader>
              <CardContent className="relative pb-2">
                <ResponsiveContainer width="100%" height={160}>
                  <RadialBarChart
                    innerRadius="72%"
                    outerRadius="100%"
                    data={occupancyData}
                    startAngle={90}
                    endAngle={-270}
                  >
                    <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                    <RadialBar background={{ fill: '#EEF2F6' }} dataKey="value" cornerRadius={8} />
                  </RadialBarChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold" style={{ color: C.blue }}>{occupancy}%</span>
                  <span className="text-xs text-muted-foreground">hunian</span>
                </div>
              </CardContent>
            </Card>

            {/* Gender donut — 2 cols */}
            <Card className="border-0 bg-white shadow-none lg:col-span-2">
              <CardHeader className="pb-0">
                <CardTitle className="text-base">Distribusi Jenis Kelamin</CardTitle>
                <CardDescription>Demografi jenis kelamin pasien</CardDescription>
              </CardHeader>
              <CardContent className="pb-2">
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie
                      data={genderData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={72}
                      paddingAngle={2}
                      dataKey="value"
                      stroke="#ffffff"
                      strokeWidth={2}
                    >
                      {genderData.map((d) => (
                        <Cell key={d.name} fill={d.fill} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v, n) => [fmt(v), n]} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-1 flex items-center justify-center gap-4">
                  {genderData.map((d) => (
                    <div key={d.name} className="flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: d.fill }} />
                      <span className="text-xs text-muted-foreground">{d.name}</span>
                      <span className="text-xs font-medium">{fmt(d.value)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Age distribution bar — 3 cols */}
            <Card className="border-0 bg-white shadow-none lg:col-span-3">
              <CardHeader className="pb-0">
                <CardTitle className="text-base">Distribusi Usia Pasien</CardTitle>
                <CardDescription>Jumlah pasien per kelompok usia</CardDescription>
              </CardHeader>
              <CardContent className="pl-0 pb-2">
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={ageData} margin={{ top: 20, right: 16, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                    <XAxis dataKey="name" tick={AXIS_TICK} axisLine={false} tickLine={false} tickMargin={8} />
                    <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} allowDecimals={false} width={40} />
                    <Tooltip cursor={{ fill: C.blue, fillOpacity: 0.06 }} contentStyle={TOOLTIP_STYLE} labelStyle={TOOLTIP_LABEL} formatter={(v) => [fmt(v), 'Pasien']} />
                    <Bar dataKey="value" fill={C.blue} radius={[4, 4, 0, 0]} maxBarSize={64}>
                      <LabelList dataKey="value" position="top" fill="#52514e" fontSize={11} fontWeight={600} style={{ fontFamily: CHART_FONT }} formatter={(v) => fmt(v)} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Insurance coverage — 3 cols */}
            <Card className="border-0 bg-white shadow-none lg:col-span-3">
              <CardHeader className="pb-0">
                <CardTitle className="text-base">Cakupan Asuransi</CardTitle>
                <CardDescription>Layanan yang menerima tiap jenis asuransi</CardDescription>
              </CardHeader>
              <CardContent className="pl-0 pb-2">
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart layout="vertical" data={insuranceData} margin={{ top: 8, right: 40, left: 8, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" horizontal={false} />
                    <XAxis type="number" tick={AXIS_TICK} axisLine={false} tickLine={false} allowDecimals={false} />
                    <YAxis type="category" dataKey="name" tick={AXIS_TICK} axisLine={false} tickLine={false} width={64} />
                    <Tooltip cursor={{ fill: C.aqua, fillOpacity: 0.06 }} contentStyle={TOOLTIP_STYLE} labelStyle={TOOLTIP_LABEL} formatter={(v) => [fmt(v), 'Layanan']} />
                    <Bar dataKey="value" fill={C.aqua} radius={[0, 4, 4, 0]} maxBarSize={40}>
                      <LabelList dataKey="value" position="right" fill="#52514e" fontSize={11} fontWeight={600} style={{ fontFamily: CHART_FONT }} formatter={(v) => fmt(v)} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Emergency services — 3 cols */}
            <Card className="border-0 bg-white shadow-none lg:col-span-3">
              <CardHeader className="pb-0">
                <CardTitle className="text-base">Layanan Darurat</CardTitle>
                <CardDescription>Ketersediaan layanan darurat dan 24/7</CardDescription>
              </CardHeader>
              <CardContent className="pl-0 pb-2">
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart layout="vertical" data={emergencyData} margin={{ top: 8, right: 40, left: 8, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" horizontal={false} />
                    <XAxis type="number" tick={AXIS_TICK} axisLine={false} tickLine={false} allowDecimals={false} />
                    <YAxis type="category" dataKey="name" tick={AXIS_TICK} axisLine={false} tickLine={false} width={120} />
                    <Tooltip cursor={{ fill: C.yellow, fillOpacity: 0.08 }} contentStyle={TOOLTIP_STYLE} labelStyle={TOOLTIP_LABEL} formatter={(v) => [fmt(v), 'Layanan']} />
                    <Bar dataKey="value" fill={C.yellow} radius={[0, 4, 4, 0]} maxBarSize={40}>
                      <LabelList dataKey="value" position="right" fill="#52514e" fontSize={11} fontWeight={600} style={{ fontFamily: CHART_FONT }} formatter={(v) => fmt(v)} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Average capacity — stat tiles, 3 cols */}
            <Card className="border-0 bg-white shadow-none lg:col-span-3">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Rata-rata Kapasitas Layanan</CardTitle>
                <CardDescription>Rata-rata sumber daya per layanan</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  {capacity.map(({ label, value, Icon }) => (
                    <div key={label} className="rounded-lg bg-muted/50 p-3">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Icon className="h-4 w-4" />
                        <span className="text-xs">{label}</span>
                      </div>
                      <p className="mt-1 text-2xl font-bold">{fmt(value)}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

          </div>
        </div>
      </div>
    </>
  );
}
