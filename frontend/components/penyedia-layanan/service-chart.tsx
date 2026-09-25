'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Text,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipContentProps,
} from 'recharts';
import type { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent';
import type { PenyediaLayananSummary } from '@/hooks/use-penyedia-layanan';
import { facilityIndex } from '@/lib/facility-types';
import { toSentenceCase } from '@/lib/utils/text';
import { SERVICE_TYPES, formatNumber } from './service-types';

function ChartTooltip({ active, payload }: TooltipContentProps<ValueType, NameType>) {
  if (!active || !payload?.length) return null;
  return (
    <div className="max-w-64 rounded-sm border bg-background px-3 py-2 text-xs shadow-sm">
      <p className="font-medium mb-1">{payload[0].payload.label}</p>
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

/** Two lines under each group: the type as the landing page names it, and its total. */
function FacilityTick({
  x,
  y,
  payload,
  totals,
}: {
  x?: number;
  y?: number;
  payload?: { value: string };
  totals: Record<string, number>;
}) {
  const label = payload?.value ?? '';
  return (
    <g transform={`translate(${x},${y})`}>
      <Text
        width={116}
        y={6}
        textAnchor="middle"
        verticalAnchor="start"
        fontSize={11}
        fill="#374151"
        lineHeight={13}
      >
        {/* Text wraps only at spaces; Q4 joins "Panti sosial/lembaga …" with
            slashes, so give it room to break after each one. */}
        {label.replace(/\//g, '/ ')}
      </Text>
      <text y={98} textAnchor="middle" fontSize={11} fill="#6B7280">
        {formatNumber(totals[label] ?? 0)} survei
      </text>
    </g>
  );
}

/**
 * Surveys per Q4 facility type offering each service type — the same rows,
 * labels, order and totals as the landing page's "Jenis fasilitas" panel. A
 * survey that ticked two types counts under both; one that offers several
 * codes of a service type counts once there.
 */
export function ServiceChart({ summary }: { summary: PenyediaLayananSummary }) {
  const data = summary.chart
    .map((row) => ({
      ...row,
      index: facilityIndex(row.facility_type),
      label: toSentenceCase(row.facility_type),
    }))
    .sort((a, b) => a.index - b.index || a.label.localeCompare(b.label, 'id'));
  const totals = Object.fromEntries(data.map((row) => [row.label, row.total]));

  return (
    <figure>
      <figcaption className="text-lg font-semibold">
        Jenis layanan kesehatan jiwa berdasarkan penyedia layanan
      </figcaption>
      <p className="mt-1 text-sm text-muted-foreground">
        Jumlah survei per jenis fasilitas yang menyediakan tiap jenis layanan, dihitung sama
        seperti panel Jenis fasilitas di beranda.
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
        <div className="h-[26rem] min-w-[64rem]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} barGap={2} barCategoryGap="18%" margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="#E5E7EB" />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={{ stroke: '#E5E7EB' }}
                interval={0}
                height={112}
                tick={<FacilityTick totals={totals} />}
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
