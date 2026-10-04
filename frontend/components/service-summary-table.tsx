import {
  type SurveyLocationAnswer,
  type SurveyLocationServiceDetail,
} from '@/hooks/use-survey-responses';
import { toSentenceCase } from '@/lib/utils/text';

const EMPTY = '—';

/**
 * The short version of a service branch's detail block, read under the branch
 * on the profile: is it there, how big, how it is paid for, what it costs,
 * whether it works with others. The full block stays on the "Rincian layanan"
 * tab.
 *
 * Every family asks these four things under its own question code (RQB, OQC,
 * SDQC…), so the rows are found by what the question asks rather than by code.
 */
type RowKey = 'kapasitas' | 'pembayaran' | 'biaya' | 'kerjasama';

const ROWS: { key: RowKey; label: string; matches: (text: string) => boolean }[] = [
  {
    key: 'kapasitas',
    label: 'Kapasitas',
    // Rawat inap counts beds; the occupied-beds question also says "BED", so
    // only the available-beds one is taken.
    matches: (text) => text.includes('KAPASITAS') || text.includes('BED (TEMPAT TIDUR) YANG TERSEDIA'),
  },
  { key: 'pembayaran', label: 'Pembayaran', matches: (text) => text.includes('CARA PEMBAYARAN') },
  { key: 'biaya', label: 'Biaya rata-rata', matches: (text) => text.includes('TARIF RATA-RATA') },
  { key: 'kerjasama', label: 'Kerjasama/jejaring', matches: (text) => text.includes('KERJASAMA') },
];

const ACUITIES = ['Akut', 'Non Akut'] as const;

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

/**
 * Several branches can share an acuity (O2.1 and O4.1 are both akut), so one
 * table speaks for all of them: capacities add up, payment methods pool, a
 * tariff that differs between branches becomes a range.
 */
function summarise(details: SurveyLocationServiceDetail[]): Record<RowKey, React.ReactNode> {
  const capacities = details.map((detail) => numberOf(findAnswer(detail, 'kapasitas'))).filter((n) => n !== null);
  const tariffs = details.map((detail) => numberOf(findAnswer(detail, 'biaya'))).filter((n) => n !== null);
  const payments = Array.from(
    new Set(details.flatMap((detail) => findAnswer(detail, 'pembayaran')?.selected_choice_labels ?? []))
  );
  const partnerships = details
    .flatMap((detail) => findAnswer(detail, 'kerjasama')?.selected_choice_labels ?? [])
    .map((label) => label.toUpperCase());

  const low = Math.min(...tariffs);
  const high = Math.max(...tariffs);

  return {
    kapasitas: capacities.length > 0 ? capacities.reduce((sum, n) => sum + n, 0).toLocaleString('id-ID') : EMPTY,
    pembayaran:
      payments.length > 0 ? (
        <ul className="list-disc pl-4 space-y-0.5">
          {payments.map((label) => (
            <li key={label}>{toSentenceCase(label)}</li>
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
    <table className="w-full max-w-lg border-collapse text-[14px]">
      <thead>
        <tr className="border-b border-foreground/40">
          <th className="w-[38%] py-1.5 pr-3 text-left font-medium">Layanan</th>
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
        {rows.map((row) => (
          <tr key={row.key} className="border-b align-top">
            <th scope="row" className="py-1.5 pr-3 text-left font-normal text-muted-foreground">
              {row.label}
            </th>
            <td className="py-1.5">{values ? values[row.key] : EMPTY}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/**
 * The summary tables for one DESDE-LTC branch. Families that split by acuity
 * (rawat inap, rawat jalan, perawatan harian) always show both halves, so a
 * missing non-akut service reads as absent rather than forgotten.
 */
export function ServiceSummary({
  name,
  details,
}: {
  /** Branch heading, e.g. "Layanan Rawat Inap". */
  name: string;
  details: SurveyLocationServiceDetail[];
}) {
  if (details.length === 0) return null;

  const title = name.replace(/^Layanan\s+/i, '');
  const acuityOf = (detail: SurveyLocationServiceDetail) =>
    (detail.name ?? '').split(', ')[1] as (typeof ACUITIES)[number] | undefined;
  const splitsByAcuity = details.some((detail) => ACUITIES.includes(acuityOf(detail)!));
  // Aksesibilitas never asks for capacity or tariff; a row of dashes there
  // would read as missing data rather than a question that does not apply.
  const rows = ROWS.filter((row) => details.some((detail) => findAnswer(detail, row.key)));

  return (
    <div className="mt-6">
      <h3 className="text-[15px] font-semibold mb-3">{title}</h3>
      <div className="space-y-6">
        {splitsByAcuity ? (
          ACUITIES.map((acuity) => (
            <SummaryTable
              key={acuity}
              label={`${title} ${acuity}`}
              details={details.filter((detail) => acuityOf(detail) === acuity)}
              rows={rows}
            />
          ))
        ) : (
          <SummaryTable label={title} details={details} rows={rows} />
        )}
      </div>
    </div>
  );
}
