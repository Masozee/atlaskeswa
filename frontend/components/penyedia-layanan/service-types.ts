import type { ServiceTypeKey } from '@/hooks/use-penyedia-layanan';

/**
 * One colour per DESDE-LTC service type, shared by the chart series, the tab
 * that opens its table and that table's group headers, so a reader carries the
 * legend from the chart into the tables.
 *
 * Categorical slots 1–5 of the dataviz reference palette, validated on the
 * light surface (CVD ΔE ≥ 9.1). Aqua, yellow and magenta sit under 3:1 against
 * the page, which is why every bar carries its value and every series has a
 * table beneath it.
 */
export const SERVICE_TYPES: { key: ServiceTypeKey; tab: string; label: string; color: string }[] = [
  { key: 'R', tab: 'rawat-inap', label: 'Rawat inap', color: '#2a78d6' },
  { key: 'D', tab: 'perawatan-harian', label: 'Perawatan harian', color: '#eb6834' },
  { key: 'O', tab: 'rawat-jalan', label: 'Rawat jalan', color: '#1baf7a' },
  { key: 'A', tab: 'aksesibilitas', label: 'Aksesibilitas', color: '#eda100' },
  { key: 'I', tab: 'informasi', label: 'Informasi', color: '#e87ba4' },
];

const numberFormat = new Intl.NumberFormat('id-ID');

/** Indonesian grouping (1.625), as the report prints it. */
export const formatNumber = (value: number) => numberFormat.format(value);
