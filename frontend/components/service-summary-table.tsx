import {
  type SurveyLocationAnswer,
  type SurveyLocationServiceDetail,
} from '@/hooks/use-survey-responses';
import { toSentenceCase } from '@/lib/utils/text';

const EMPTY = '—';

/**
 * The short version of a service branch's detail block, read under the branch
 * on the profile: is it there, how big, who it serves, how it is paid for,
 * what it costs, whether it works with others. The full block stays on the
 * "Rincian layanan" tab.
 *
 * Every family asks these things under its own question code (RQB, OQC,
 * SDQC…), so the rows are found by what the question asks rather than by code.
 */
type RowKey = 'kapasitas' | 'jenisKelamin' | 'usia' | 'pembayaran' | 'biaya' | 'kerjasama';

const ROWS: { key: RowKey; label: string; matches: (text: string) => boolean }[] = [
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

// Konsultasi dan asesmen (I1.x) is listed above the tables but has no table:
// the summary covers the three ways information is provided.
const INFORMASI: Slot[] = [
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

function findAnswer(detail: SurveyLocationServiceDetail, key: RowKey) {
  const row = ROWS.find((item) => item.key === key)!;
  return detail.answers.find((answer) => row.matches(answer.question_text.toUpperCase()));
}

function numberOf(answer: SurveyLocationAnswer | undefined): number | null {
  if (!answer?.number_value) return null;
  const parsed = Number(answer.number_value);
  return Number.isFinite(parsed) ? parsed : null;
}

/** Choice labels pooled across branches; "LAKI-LAKI" and "Laki-laki" are one. */
function pooledLabels(details: SurveyLocationServiceDetail[], key: RowKey): string[] {
  const labels = new Map<string, string>();
  for (const detail of details) {
    for (const label of findAnswer(detail, key)?.selected_choice_labels ?? []) {
      if (!labels.has(label.toUpperCase())) labels.set(label.toUpperCase(), toSentenceCase(label));
    }
  }
  return Array.from(labels.values());
}

/**
 * Several branches can fill one slot (O2.1 and O2.2 are both akut, berbasis
 * kunjungan), so one table speaks for all of them: capacities add up, choices
 * pool, a tariff that differs between branches becomes a range.
 */
function summarise(details: SurveyLocationServiceDetail[]): Record<RowKey, React.ReactNode> {
  const capacities = details.map((detail) => numberOf(findAnswer(detail, 'kapasitas'))).filter((n) => n !== null);
  const tariffs = details.map((detail) => numberOf(findAnswer(detail, 'biaya'))).filter((n) => n !== null);
  const payments = pooledLabels(details, 'pembayaran');
  const partnerships = pooledLabels(details, 'kerjasama').map((label) => label.toUpperCase());

  const low = Math.min(...tariffs);
  const high = Math.max(...tariffs);

  return {
    kapasitas: capacities.length > 0 ? capacities.reduce((sum, n) => sum + n, 0).toLocaleString('id-ID') : EMPTY,
    jenisKelamin: pooledLabels(details, 'jenisKelamin').join(', ') || EMPTY,
    usia: pooledLabels(details, 'usia').join(', ') || EMPTY,
    pembayaran:
      payments.length > 0 ? (
        <ul className="list-disc pl-4 space-y-0.5">
          {payments.map((label) => (
            <li key={label}>{label}</li>
          ))}
        </ul>
      ) : (
        EMPTY
      ),
    biaya:
      tariffs.length === 0
        ? EMPTY
        : low === high
          ? rupiah.format(low)
          : `${rupiah.format(low)} – ${rupiah.format(high)}`,
    kerjasama: partnerships.includes('YA') ? 'Ya' : partnerships.includes('TIDAK') ? 'Tidak' : EMPTY,
  };
}

/* ------------------------------------------------------------------- table */

function SummaryTable({
  label,
  details,
  rows,
}: {
  label: string;
  details: SurveyLocationServiceDetail[];
  rows: typeof ROWS;
}) {
  const available = details.length > 0;
  const values = available ? summarise(details) : null;

  return (
    <table className="w-full border-collapse text-[14px]">
      <thead>
        <tr className="border-b border-foreground/40">
          <th className="w-[42%] py-1.5 pr-3 text-left font-medium">Layanan</th>
          <th className="py-1.5 text-left font-medium">Keterangan</th>
        </tr>
      </thead>
      <tbody>
        <tr className="border-b align-top">
          <th scope="row" className="py-1.5 pr-3 text-left font-medium">
            {label}
          </th>
          <td className="py-1.5">{available ? 'Tersedia' : EMPTY}</td>
        </tr>
        {/* An absent service has nothing to describe: its one dash says so
            without a column of them under it. */}
        {values &&
          rows.map((row) => (
            <tr key={row.key} className="border-b align-top">
              <th scope="row" className="py-1.5 pr-3 text-left font-normal text-muted-foreground">
                {row.label}
              </th>
              <td className="py-1.5">{values[row.key]}</td>
            </tr>
          ))}
      </tbody>
    </table>
  );
}

/** The summary tables for one DESDE-LTC branch: one per slot of its family. */
export function ServiceSummary({
  code,
  name,
  details,
}: {
  /** Branch code, e.g. "R" or "SD". */
  code: string;
  /** Branch heading, e.g. "Layanan Rawat Inap". */
  name: string;
  details: SurveyLocationServiceDetail[];
}) {
  if (details.length === 0) return null;

  const title = name.replace(/^Layanan\s+/i, '');
  const slots = SLOTS[code] ?? [{ label: title, matches: () => true }];
  // Aksesibilitas never asks for capacity or tariff; a row of dashes there
  // would read as missing data rather than a question that does not apply.
  const rows = ROWS.filter((row) => details.some((detail) => findAnswer(detail, row.key)));

  return (
    <div className="mt-6">
      <h3 className="text-[15px] font-semibold mb-3">{title}</h3>
      <div className="grid gap-x-8 gap-y-6 lg:grid-cols-2 lg:items-start">
        {slots.map((slot) => (
          <SummaryTable
            key={slot.label}
            label={slot.label}
            details={details.filter(slot.matches)}
            rows={rows}
          />
        ))}
      </div>
    </div>
  );
}
