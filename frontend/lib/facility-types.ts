/**
 * Q4's facility types, in the order the questionnaire asks them.
 *
 * Shared because two public surfaces count the same answer: the landing map's
 * breakdown panel and the kecamatan table. Each type keeps one colour and one
 * abbreviation everywhere, so a reader moving between them is not re-learning
 * the legend.
 */
export type FacilityType = {
  /** The label as Q4 authored it. */
  label: string;
  /** Column header where a full label would not fit. */
  short: string;
  color: string;
};

export const FACILITY_TYPES: FacilityType[] = [
  { label: 'Rumah Sakit Umum', short: 'RSU', color: '#07579E' },
  { label: 'Rumah Sakit Jiwa (RSJ)', short: 'RSJ', color: '#5C6BC0' },
  { label: 'Puskesmas', short: 'Puskesmas', color: '#00979D' },
  { label: 'Klinik atau biro psikologi', short: 'Klinik', color: '#4DB6AC' },
  { label: 'Praktek Dokter Mandiri', short: 'Dokter', color: '#66BB6A' },
  { label: 'Balai atau Unit Rehabilitasi', short: 'Balai', color: '#9CCC65' },
  { label: 'Panti Sosial/Lembaga Rehabilitasi Sosial/Pondok Pesantren', short: 'Panti', color: '#FFBF47' },
  { label: 'Organisasi Berbasis Komunitas', short: 'OBK', color: '#FFA726' },
  { label: 'Lembaga Swadaya Masyarakat (LSM)', short: 'LSM', color: '#EF6C60' },
  { label: 'Lembaga Kesejahteraan Sosial (LKS)', short: 'LKS', color: '#EC407A' },
  { label: 'Kader Kesehatan', short: 'Kader', color: '#9575CD' },
  { label: 'TKSK (Tenaga Kesejahteraan Sosial Kecamatan)', short: 'TKSK', color: '#8D6E63' },
];

/** Answers come back in the casing the questionnaire used; match loosely. */
export const facilityKey = (label: string) => label.trim().toLowerCase().replace(/\s+/g, ' ');

/** Earlier or later Q4 labels for the same type, so they sort and colour as one. */
const ALIASES: Record<string, string> = {
  // Q4 later folded "Rumah Sakit Umum" into plain "Rumah Sakit"; both are live.
  'rumah sakit': 'Rumah Sakit Umum',
};

const INDEX: Record<string, number> = Object.fromEntries([
  ...FACILITY_TYPES.map((type, index) => [facilityKey(type.label), index] as const),
  ...Object.entries(ALIASES).map(
    ([alias, label]) =>
      [alias, FACILITY_TYPES.findIndex((type) => type.label === label)] as const
  ),
]);

/** Index into `FACILITY_TYPES`, or its length for a type Q4 no longer names. */
export function facilityIndex(label: string) {
  return INDEX[facilityKey(label)] ?? FACILITY_TYPES.length;
}

/** Q4 is multi-select; the API joins the chosen labels with a comma. */
export function facilityLabels(raw: string | null | undefined) {
  return (raw ?? '')
    .split(',')
    .map((label) => label.trim())
    .filter(Boolean);
}

export const FACILITY_OTHER = { label: 'Lainnya', short: 'Lainnya', color: '#6B7280' };
