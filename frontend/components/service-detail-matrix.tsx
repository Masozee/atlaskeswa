'use client';

import {
  type SurveyLocationAnswer,
  type SurveyLocationServiceDetail,
} from '@/hooks/use-survey-responses';
import { toSentenceCase } from '@/lib/utils/text';

const EMPTY = '—';

/**
 * The questionnaire asks the same detail block once per service branch: SA2,
 * SA4 and SA5 all answer SAQA…SAQG. Rendered one block at a time that is six
 * repetitions of the same six questions, and the reader has to hold a value in
 * their head to compare two branches.
 *
 * So the block is pivoted: one matrix per question family, questions down the
 * side, branches across the top. The question text is written once, the
 * branches sit next to each other, and the chapter fits a screen instead of
 * five.
 */

type Family = {
  /** Question-code prefix shared by the family — SAQ, SIQ. */
  key: string;
  /** MTC path segments every branch in the family shares. */
  title: string | null;
  branches: SurveyLocationServiceDetail[];
  /** Question codes in the order the questionnaire asked them. */
  rows: { code: string; text: string }[];
};

/** Trims the trailing zeros DRF puts on a DecimalField: "2.0000" → "2". */
function formatNumber(value: string): string {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? String(parsed) : value;
}

function formatCell(value: unknown): string {
  if (Array.isArray(value)) return value.join(', ') || EMPTY;
  if (value === null || value === undefined || value === '') return EMPTY;
  if (typeof value === 'boolean') return value ? 'Ya' : 'Tidak';
  if (typeof value === 'object') {
    const slot = value as { hari?: string[]; jam?: string };
    if (slot.hari || slot.jam) return `${slot.hari?.join(', ') || EMPTY} · ${slot.jam || EMPTY}`;
    return JSON.stringify(value);
  }
  return String(value);
}

/**
 * Staff tables (SAQF, SIQM) hold a handful of rows of two or three fields. A
 * table inside a table cell would be unreadable at this width, so each row is
 * written as one line of `field value` pairs — the keys come off the data, so a
 * table with other columns still reads.
 */
function tableLines(rows: Record<string, unknown>[]): string[] {
  return rows.map((row) =>
    Object.entries(row)
      .filter(([key]) => key !== 'id')
      .map(([key, value]) => `${toSentenceCase(key.charAt(0).toUpperCase() + key.slice(1))} ${formatCell(value)}`)
      .join(' · ')
  );
}

function answerContent(answer: SurveyLocationAnswer): React.ReactNode {
  if (answer.selected_choice_labels.length > 0) {
    return toSentenceCase(answer.selected_choice_labels.join(', '));
  }
  if (answer.number_value !== null) return formatNumber(answer.number_value);
  if (answer.boolean_value !== null) return answer.boolean_value ? 'Ya' : 'Tidak';
  if (answer.geographic_unit_display) return answer.geographic_unit_display;
  if (Array.isArray(answer.table_data) && answer.table_data.length > 0) {
    const lines = tableLines(answer.table_data as Record<string, unknown>[]);
    return (
      <ul className="space-y-0.5">
        {lines.map((line, index) => (
          <li key={index}>{line}</li>
        ))}
      </ul>
    );
  }
  if (answer.text_value) return answer.text_value;
  if (answer.date_value) return answer.date_value;
  if (answer.time_value) return answer.time_value;
  return EMPTY;
}

/** Segments shared by every branch name, so the family heading carries them once. */
function sharedSegments(names: (string | null)[]): string[] {
  const paths = names.filter(Boolean).map((name) => (name as string).split(', '));
  if (paths.length === 0) return [];
  const shared: string[] = [];
  for (let i = 0; i < paths[0].length - 1; i++) {
    const segment = paths[0][i];
    if (paths.every((path) => path.length > i + 1 && path[i] === segment)) shared.push(segment);
    else break;
  }
  return shared;
}

function buildFamilies(details: SurveyLocationServiceDetail[]): Family[] {
  const families = new Map<string, SurveyLocationServiceDetail[]>();
  for (const detail of details) {
    const first = detail.answers[0];
    if (!first) continue;
    // SAQA → SAQ: the family is the trigger question the detail hangs off.
    const key = first.question_code.slice(0, -1);
    if (!families.has(key)) families.set(key, []);
    families.get(key)!.push(detail);
  }

  return Array.from(families, ([key, branches]) => {
    const rows: { code: string; text: string }[] = [];
    for (const branch of branches) {
      for (const answer of branch.answers) {
        if (!rows.some((row) => row.code === answer.question_code)) {
          rows.push({ code: answer.question_code, text: answer.question_text });
        }
      }
    }
    const shared = sharedSegments(branches.map((branch) => branch.name));
    return { key, title: shared.join(' · ') || null, branches, rows };
  });
}

function branchLabel(detail: SurveyLocationServiceDetail, sharedCount: number): string {
  const segments = (detail.name ?? '').split(', ').filter(Boolean);
  const rest = segments.slice(sharedCount);
  return (rest.length > 0 ? rest : segments).join(' · ') || detail.code;
}

/**
 * The phone composition. A three-branch matrix cannot be read 390px at a time,
 * so the same answers stack one branch after another — the question text is
 * repeated per branch, which is the price of a column that fits.
 */
function BranchStack({ family }: { family: Family }) {
  const sharedCount = family.title ? family.title.split(' · ').length : 0;

  return (
    <div className="space-y-6">
      {family.branches.map((branch) => (
        <section key={branch.code}>
          <h4 className="text-[15px] font-medium">
            <span className="tabular-nums">{branch.code}</span>{' '}
            <span className="font-normal">{branchLabel(branch, sharedCount)}</span>
          </h4>
          <dl className="mt-2.5 space-y-3">
            {branch.answers.map((answer) => (
              <div key={answer.question_code}>
                <dt className="text-[14px] leading-snug text-muted-foreground">
                  {toSentenceCase(answer.question_text)}
                  <span className="text-foreground/55"> ({answer.question_code})</span>
                </dt>
                <dd className="text-[15px] mt-0.5 break-words">{answerContent(answer)}</dd>
              </div>
            ))}
          </dl>
        </section>
      ))}
    </div>
  );
}

function FamilyMatrix({ family }: { family: Family }) {
  const sharedCount = family.title ? family.title.split(' · ').length : 0;

  return (
    <section>
      {family.title && <h3 className="text-[15px] font-medium mb-3">{family.title}</h3>}

      <div className="sm:hidden">
        <BranchStack family={family} />
      </div>

      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse text-[15px]">
          <thead>
            <tr className="border-b">
              <th className="py-2 pr-4 text-left align-bottom font-medium w-[34%]">
                <span className="sr-only">Pertanyaan</span>
              </th>
              {family.branches.map((branch) => (
                <th key={branch.code} className="py-2.5 px-3 text-left align-bottom font-medium">
                  <span className="tabular-nums">{branch.code}</span>
                  <span className="block text-[13px] font-normal text-muted-foreground">
                    {branchLabel(branch, sharedCount)}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {family.rows.map((row) => (
              // A 3% wash separates the rows without a rule per question: the
              // matrix already carries one line under its header.
              <tr key={row.code} className="align-top even:bg-foreground/[0.03]">
                <th scope="row" className="py-2.5 pr-4 text-left text-[14px] font-normal leading-snug text-muted-foreground">
                  {toSentenceCase(row.text)}
                  {/* The code is a real identifier people cite, not chrome, so it
                      sits a rung above the metadata band the zebra wash eats into. */}
                  <span className="text-foreground/55"> ({row.code})</span>
                </th>
                {family.branches.map((branch) => {
                  const answer = branch.answers.find((item) => item.question_code === row.code);
                  return (
                    <td key={branch.code} className="py-2.5 px-3">
                      {answer ? answerContent(answer) : <span className="text-foreground/45">{EMPTY}</span>}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/**
 * Every detail question the survey recorded, one matrix per question family.
 */
export function ServiceDetailMatrix({ details }: { details: SurveyLocationServiceDetail[] }) {
  const families = buildFamilies(details ?? []);
  if (families.length === 0) return null;

  return (
    <div className="space-y-8">
      {families.map((family) => (
        <FamilyMatrix key={family.key} family={family} />
      ))}
    </div>
  );
}
