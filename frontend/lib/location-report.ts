import {
  type SurveyLocationAnswer,
  type SurveyLocationDetail,
  type SurveyLocationServiceDetail,
} from '@/hooks/use-survey-responses';
import { FACILITY_OTHER, FACILITY_TYPES, facilityIndex, facilityLabels } from '@/lib/facility-types';
import { kategoriLabel, toSentenceCase } from '@/lib/utils/text';

/**
 * The location report: the profile of one surveyed place read the way the
 * research team reads it — each DESDE-LTC branch, the codes under it, and one
 * Layanan/Keterangan table per kind of service. The profile page, the PDF and
 * the XLSX all render this one structure, so the three never disagree.
 */

export const EMPTY = '—';

/* -------------------------------------------------------------- DESDE codes */

/** Splits "SA2 — Layanan …" into its code and its name. */
function splitDesdeCode(entry: string) {
  const sep = entry.indexOf(' — ');
  if (sep < 0) return { code: entry, name: '' };
  return { code: entry.slice(0, sep), name: entry.slice(sep + 3) };
}

/** "SI2.1.1" sorts after "SI1.3": segment by segment, numbers as numbers. */
function compareDesdeCode(a: string, b: string) {
  const segmentsA = a.split('.');
  const segmentsB = b.split('.');
  for (let i = 0; i < Math.max(segmentsA.length, segmentsB.length); i++) {
    const left = segmentsA[i] ?? '';
    const right = segmentsB[i] ?? '';
    const compared = left.localeCompare(right, 'en', { numeric: true });
    if (compared !== 0) return compared;
  }
  return 0;
}

/** "SI2.1.1" → "SI": the family a code belongs to. */
export const branchOf = (code: string) => code.match(/^[A-Za-z]+/)?.[0] ?? code;

/**
 * Branches read from the most intensive care outwards — rawat inap, rawat
 * jalan, perawatan harian, aksesibilitas, informasi — health before social,
 * rather than alphabetically. Anything unlisted follows in code order.
 */
const BRANCH_ORDER = ['R', 'O', 'D', 'A', 'I', 'SR', 'SO', 'SD', 'SA', 'SI'];

function branchRank(code: string) {
  const rank = BRANCH_ORDER.indexOf(code);
  return rank < 0 ? BRANCH_ORDER.length : rank;
}

/**
 * The classification arrives flat — the branch ("SA") next to its leaves
 * ("SA2", "SA4") — and every leaf name repeats its branch name in front of its
 * own. Grouped here so the branch is written once as a heading and each leaf
 * keeps only what it adds.
 */
export type DesdeEntry = { code: string; name: string };
export type DesdeGroup = DesdeEntry & { children: DesdeEntry[] };

export function groupDesdeCodes(entries: string[]): DesdeGroup[] {
  const groups: Record<string, DesdeGroup> = {};

  for (const entry of entries.map(splitDesdeCode)) {
    const branch = branchOf(entry.code);
    const target = (groups[branch] ??= { code: branch, name: '', children: [] });
    if (entry.code === target.code) target.name = entry.name;
    else target.children.push(entry);
  }

  return Object.values(groups)
    .sort((a, b) => branchRank(a.code) - branchRank(b.code) || compareDesdeCode(a.code, b.code))
    .map((group) => {
      // A branch with no row of its own still gets a heading: its children all
      // carry the branch name as the first part of theirs.
      const name = group.name || group.children[0]?.name.split(', ')[0] || '';
      const prefix = name ? `${name}, ` : '';
      return {
        code: group.code,
        name,
        children: group.children
          .sort((a, b) => compareDesdeCode(a.code, b.code))
          .map((child) => ({
            code: child.code,
            name: child.name.startsWith(prefix) ? child.name.slice(prefix.length) : child.name,
          })),
      };
    });
}

/* -------------------------------------------------------------------- rows */

/**
 * What a summary table says about a service: is it there, how big, who it
 * serves, how it is paid for, what it costs, when it runs, whether it works
 * with others.
 *
 * Every family asks these things under its own question code (RQB, OQC,
 * SDQC…), so the rows are found by what the question asks rather than by code.
 */
type RowKey = 'kapasitas' | 'jenisKelamin' | 'usia' | 'pembayaran' | 'biaya' | 'jamOperasional' | 'kerjasama';

type Row = {
  key: RowKey;
  label: string;
  matches: (text: string) => boolean;
  /** Families the row is read for; every family when absent. */
  families?: string[];
};

const ROWS: Row[] = [
  {
    key: 'kapasitas',
    label: 'Kapasitas',
    // Rawat inap counts beds; the occupied-beds question also says "BED", so
    // only the available-beds one is taken.
    matches: (text) => text.includes('KAPASITAS') || text.includes('BED (TEMPAT TIDUR) YANG TERSEDIA'),
  },
  { key: 'jenisKelamin', label: 'Jenis kelamin pemanfaat', matches: (text) => text.includes('APA SAJA JENIS KELAMIN') },
  { key: 'usia', label: 'Usia pemanfaat', matches: (text) => text.includes('RENTANG USIA') },
  { key: 'pembayaran', label: 'Pembayaran', matches: (text) => text.includes('CARA PEMBAYARAN') },
  { key: 'biaya', label: 'Biaya rata-rata', matches: (text) => text.includes('TARIF RATA-RATA') },
  {
    key: 'jamOperasional',
    label: 'Jam operasional',
    matches: (text) => text.includes('JAM OPERASIONAL'),
    // Informasi asks it too, but the research team reads opening hours only
    // for aksesibilitas, whose table would otherwise say almost nothing.
    families: ['A', 'SA'],
  },
  { key: 'kerjasama', label: 'Kerjasama/jejaring', matches: (text) => text.includes('KERJASAMA') },
];

/* ------------------------------------------------------------------- slots */

/**
 * The MTC name of a branch, split into its path and normalised: the catalogue
 * writes "Non-Akut" next to "Non Akut" and once spells "Terrstruktur".
 */
function segments(detail: SurveyLocationServiceDetail): string[] {
  return (detail.name ?? '')
    .split(',')
    .map((segment) =>
      segment
        .trim()
        .toLowerCase()
        .replace(/-/g, ' ')
        .replace(/ter+struktur/g, 'terstruktur')
        .replace(/\s+/g, ' ')
    );
}

const has = (detail: SurveyLocationServiceDetail, segment: string) => segments(detail).includes(segment);
const acuity = (detail: SurveyLocationServiceDetail) => segments(detail)[1];
/** "SI2.1.1" → "2.1.1": the position of the branch inside its family. */
const position = (detail: SurveyLocationServiceDetail) => detail.code.replace(/^[A-Za-z]+/, '');

type Slot = { label: string; matches: (detail: SurveyLocationServiceDetail) => boolean };

const KUNJUNGAN = 'layanan berbasis kunjungan';
const FASILITAS = 'layanan berbasis fasilitas';

const RAWAT_INAP: Slot[] = [
  { label: 'Rawat Inap Akut', matches: (d) => acuity(d) === 'akut' },
  { label: 'Rawat Inap Non Akut', matches: (d) => acuity(d) === 'non akut' },
];

const PERAWATAN_HARIAN_NON_AKUT: Slot[] = [
  { label: 'Terkait Pekerjaan', matches: (d) => has(d, 'pekerjaan') },
  { label: 'Pelatihan Kerja', matches: (d) => has(d, 'program persiapan kerja') },
  { label: 'Terstruktur Non Pekerjaan', matches: (d) => has(d, 'terstruktur non pekerjaan') },
  { label: 'Tidak Terstruktur', matches: (d) => has(d, 'tidak terstruktur') },
];

const AKSESIBILITAS: Slot[] = [
  'Komunikasi',
  'Mobilitas Fisik',
  'Pendampingan Pribadi',
  'Koordinasi Kasus',
  'Aksesibilitas Lainnya',
].map((label, index) => ({ label, matches: (d) => position(d) === String(index + 1) }));

const INFORMASI: Slot[] = [
  // I1.1–I1.5 are the same service for different needs; one table holds them.
  { label: 'Konsultasi & Asesmen', matches: (d) => position(d).startsWith('1') },
  { label: 'Interaktif (Tatap Muka)', matches: (d) => position(d) === '2.1.1' },
  { label: 'Interaktif (Sosial Media)', matches: (d) => position(d) === '2.1.2' },
  { label: 'Non Interaktif', matches: (d) => position(d) === '2.2' },
];

/**
 * One table per slot, always all of them, so a service the place does not run
 * reads as absent rather than forgotten. Health (R, O, D…) and social (SR,
 * SO, SD…) families share the layout; the social ones have no acuity split.
 */
const SLOTS: Record<string, Slot[]> = {
  R: RAWAT_INAP,
  SR: RAWAT_INAP,
  O: [
    { label: 'Rawat Jalan Akut Berbasis Kunjungan', matches: (d) => acuity(d) === 'akut' && has(d, KUNJUNGAN) },
    { label: 'Rawat Jalan Akut Berbasis Fasilitas', matches: (d) => acuity(d) === 'akut' && has(d, FASILITAS) },
    { label: 'Rawat Jalan Non Akut Berbasis Kunjungan', matches: (d) => acuity(d) === 'non akut' && has(d, KUNJUNGAN) },
    { label: 'Rawat Jalan Non Akut Berbasis Fasilitas', matches: (d) => acuity(d) === 'non akut' && has(d, FASILITAS) },
  ],
  SO: [
    { label: 'Rawat Jalan Berbasis Kunjungan', matches: (d) => has(d, KUNJUNGAN) },
    { label: 'Rawat Jalan Berbasis Fasilitas', matches: (d) => has(d, FASILITAS) },
  ],
  D: [{ label: 'Perawatan Harian Akut', matches: (d) => acuity(d) === 'akut' }, ...PERAWATAN_HARIAN_NON_AKUT],
  SD: PERAWATAN_HARIAN_NON_AKUT,
  A: AKSESIBILITAS,
  SA: AKSESIBILITAS,
  I: INFORMASI,
  SI: INFORMASI,
};

/* ------------------------------------------------------------------ values */

const rupiah = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
});

function findAnswer(detail: SurveyLocationServiceDetail, row: Row) {
  return detail.answers.find((answer) => row.matches(answer.question_text.toUpperCase()));
}

function numberOf(answer: SurveyLocationAnswer | undefined): number | null {
  if (!answer?.number_value) return null;
  const parsed = Number(answer.number_value);
  return Number.isFinite(parsed) ? parsed : null;
}

/** Choice labels pooled across branches; "LAKI-LAKI" and "Laki-laki" are one. */
function pooledLabels(details: SurveyLocationServiceDetail[], row: Row): string[] {
  const labels = new Map<string, string>();
  for (const detail of details) {
    for (const label of findAnswer(detail, row)?.selected_choice_labels ?? []) {
      if (!labels.has(label.toUpperCase())) labels.set(label.toUpperCase(), toSentenceCase(label));
    }
  }
  return Array.from(labels.values());
}

/**
 * One cell of a summary table. Most are a single line; a list (payment
 * methods) keeps one line per item so every renderer can lay it out as one.
 */
export type ReportValue = string | string[];

/**
 * Several branches can fill one slot (O2.1 and O2.2 are both akut, berbasis
 * kunjungan), so one table speaks for all of them: capacities add up, choices
 * pool, a tariff that differs between branches becomes a range.
 */
function summarise(details: SurveyLocationServiceDetail[], row: Row): ReportValue {
  switch (row.key) {
    case 'kapasitas': {
      const capacities = details.map((detail) => numberOf(findAnswer(detail, row))).filter((n) => n !== null);
      return capacities.length > 0 ? capacities.reduce((sum, n) => sum + n, 0).toLocaleString('id-ID') : EMPTY;
    }
    case 'biaya': {
      const tariffs = details.map((detail) => numberOf(findAnswer(detail, row))).filter((n) => n !== null);
      if (tariffs.length === 0) return EMPTY;
      const low = Math.min(...tariffs);
      const high = Math.max(...tariffs);
      return low === high ? rupiah.format(low) : `${rupiah.format(low)} – ${rupiah.format(high)}`;
    }
    case 'pembayaran': {
      const payments = pooledLabels(details, row);
      return payments.length > 0 ? payments : EMPTY;
    }
    case 'kerjasama': {
      const partnerships = pooledLabels(details, row).map((label) => label.toUpperCase());
      return partnerships.includes('YA') ? 'Ya' : partnerships.includes('TIDAK') ? 'Tidak' : EMPTY;
    }
    default:
      return pooledLabels(details, row).join(', ') || EMPTY;
  }
}

/* ----------------------------------------------------------------- reports */

export type ReportTable = {
  /** The service, e.g. "Rawat Inap Akut". */
  label: string;
  available: boolean;
  /** Absent services keep every row, each a dash, as the printed report does. */
  rows: { label: string; value: ReportValue }[];
};

export type ReportBranch = DesdeGroup & {
  /** Branch heading without "Layanan", e.g. "Rawat Inap". */
  title: string;
  tables: ReportTable[];
};

/** One line of the record's metadata: "Kecamatan — Gombong". */
export type ReportFact = { label: string; value: string };

export type LocationReport = {
  id: number;
  title: string;
  description: string | null;
  /** Q4 facility types with their map colours, e.g. Rumah sakit umum. */
  types: { label: string; color: string }[];
  /** Where the place is, in one line: "Desa Patemon, Kec. Gombong, Kab. Kebumen". */
  place: string;
  /** Who the place is and how the record was made. */
  facts: ReportFact[];
  branches: ReportBranch[];
};

export function formatReportDate(value: string | Date | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}

function coordinates(location: SurveyLocationDetail) {
  const lat = Number.parseFloat(location.latitude);
  const lng = Number.parseFloat(location.longitude);
  return Number.isFinite(lat) && Number.isFinite(lng) ? `${lat.toFixed(5)}, ${lng.toFixed(5)}` : null;
}

function factsOf(location: SurveyLocationDetail): ReportFact[] {
  const facts: [string, string | null | undefined][] = [
    ['Kategori', kategoriLabel(location.kategori)],
    ['Bidang utama', location.bidang_utama && toSentenceCase(location.bidang_utama)],
    ['Status badan hukum', location.status_badan_hukum && toSentenceCase(location.status_badan_hukum)],
    ['Desa/Kelurahan', location.desa],
    ['Kecamatan', location.kecamatan],
    ['Kabupaten/Kota', location.service_city],
    ['Koordinat', coordinates(location)],
    ['Tanggal survei', formatReportDate(location.survey_date)],
    ['Status data', location.status_display],
  ];
  return facts.map(([label, value]) => ({ label, value: value || EMPTY }));
}

/** The summary tables for one DESDE-LTC branch: one per slot of its family. */
export function summariseBranch(
  code: string,
  name: string,
  details: SurveyLocationServiceDetail[]
): ReportTable[] {
  if (details.length === 0) return [];

  const title = name.replace(/^Layanan\s+/i, '');
  const slots = SLOTS[code] ?? [{ label: title, matches: () => true }];
  // Aksesibilitas never asks for capacity or tariff; a row of dashes there
  // would read as missing data rather than a question that does not apply.
  const rows = ROWS.filter(
    (row) =>
      (!row.families || row.families.includes(code)) && details.some((detail) => findAnswer(detail, row))
  );

  return slots.map((slot) => {
    const filling = details.filter(slot.matches);
    return {
      label: slot.label,
      available: filling.length > 0,
      rows: rows.map((row) => ({
        label: row.label,
        value: filling.length > 0 ? summarise(filling, row) : EMPTY,
      })),
    };
  });
}

export function buildLocationReport(location: SurveyLocationDetail): LocationReport {
  const details = location.service_details ?? [];
  return {
    id: location.id,
    title: location.service_name ?? location.name ?? 'Tanpa nama',
    description: location.jenis_layanan ? toSentenceCase(location.jenis_layanan) : null,
    types: facilityLabels(location.jenis_fasilitas).map((label) => ({
      label: toSentenceCase(label),
      color: (FACILITY_TYPES[facilityIndex(label)] ?? FACILITY_OTHER).color,
    })),
    place: [
      location.desa && `Desa/Kel. ${location.desa}`,
      location.kecamatan && `Kec. ${location.kecamatan}`,
      location.service_city && `Kab. ${location.service_city}`,
    ]
      .filter(Boolean)
      .join(', '),
    facts: factsOf(location),
    branches: groupDesdeCodes(location.kode_desde_ltc ?? []).map((group) => ({
      ...group,
      title: group.name.replace(/^Layanan\s+/i, ''),
      tables: summariseBranch(
        group.code,
        group.name,
        details.filter((detail) => branchOf(detail.code) === group.code)
      ),
    })),
  };
}

/** A file name safe on every OS: "Laporan - RS PKU Muhammadiyah Gombong". */
export function reportFileName(report: LocationReport, extension: string) {
  const safe = report.title.replace(/[\\/:*?"<>|]+/g, ' ').replace(/\s+/g, ' ').trim();
  return `Laporan - ${safe}.${extension}`;
}
