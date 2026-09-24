'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipContentProps,
} from 'recharts';
import type { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent';
import type { PenyediaLayananSummary } from '@/hooks/use-penyedia-layanan';
import { SERVICE_TYPES, formatNumber } from './service-types';

function ChartTooltip({ active, payload, label }: TooltipContentProps<ValueType, NameType>) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-sm border bg-background px-3 py-2 text-xs shadow-sm">
      <p className="font-medium mb-1">{label}</p>
      <ul className="space-y-0.5">
        {payload.map((entry) => (
          <li key={String(entry.dataKey)} className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-[2px]" style={{ background: entry.color }} aria-hidden />
            <span className="text-muted-foreground">{entry.name}</span>
            <span className="ml-auto pl-3 tabular-nums">{formatNumber(Number(entry.value))}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Facilities per provider bucket offering each service type. A facility that
 * offers several codes of one type counts once in that bar.
 */
export function ServiceChart({ summary }: { summary: PenyediaLayananSummary }) {
  const labels = Object.fromEntries(summary.providers.map((p) => [p.key, p.label]));
  const data = summary.chart.map((row) => ({ ...row, label: labels[row.provider] ?? row.provider }));

  return (
    <figure>
      <figcaption className="text-lg font-semibold">
        Jenis layanan kesehatan jiwa berdasarkan penyedia layanan
      </figcaption>
      <p className="mt-1 text-sm text-muted-foreground">
        Jumlah fasilitas di setiap kelompok penyedia yang menyediakan tiap jenis layanan.
      </p>

      <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm" aria-label="Keterangan">
        {SERVICE_TYPES.map((type) => (
          <li key={type.key} className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-[2px]" style={{ background: type.color }} aria-hidden />
            {type.label}
          </li>
        ))}
      </ul>

      {/* 40 bars need room; on a phone the chart scrolls inside its own box
          rather than squeezing bars below a readable width. */}
      <div className="mt-4 -mx-4 overflow-x-auto px-4">
        <div className="h-80 min-w-[46rem]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} barGap={2} barCategoryGap="18%" margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="#E5E7EB" />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={{ stroke: '#E5E7EB' }}
                interval={0}
                tick={{ fontSize: 12, fill: '#374151' }}
              />
              <YAxis
                allowDecimals={false}
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 12, fill: '#6B7280' }}
              />
              <Tooltip content={ChartTooltip} cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
              {SERVICE_TYPES.map((type) => (
                <Bar
                  key={type.key}
                  dataKey={type.key}
                  name={type.label}
                  fill={type.color}
                  radius={[4, 4, 0, 0]}
                  isAnimationActive={false}
                >
                  <LabelList dataKey={type.key} position="top" fontSize={10} fill="#6B7280" />
                </Bar>
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </figure>
  );
}
