/**
 * Convert a survey response's stored answers (nested QuestionAnswer objects from
 * the detail API) back into the flat `SurveyAnswers` map that DynamicSurveyForm
 * consumes as `initialAnswers` and that the backend rebuilds from on update.
 *
 * The map key mirrors the backend storage convention used in
 * `_create_answers`: detail answers carry a context prefix "<context_key>|<code>",
 * plain answers are keyed by code alone. This is the exact inverse of that path,
 * so an edit round-trip (read -> form -> PATCH) preserves the answer set.
 *
 * We infer the value from whichever field the serializer populated rather than
 * the question's answer_type (which the answer serializer does not expose),
 * matching how the form reads each answer kind.
 */
import type { SurveyAnswers } from '@/lib/types/survey-template';

/** Shape of one answer as returned by QuestionAnswerSerializer (detail view). */
export interface StoredAnswer {
  question_code?: string;
  context_key?: string;
  text_value?: string | null;
  number_value?: number | null;
  date_value?: string | null;
  time_value?: string | null;
  boolean_value?: boolean | null;
  selected_choice_values?: string[];
  geographic_unit?: number | null;
  coverage_level?: string | null;
  gps_latitude?: number | null;
  gps_longitude?: number | null;
  table_data?: unknown;
  other_text?: string | null;
}

function isEmpty(v: unknown): boolean {
  return v === null || v === undefined || v === '' || (Array.isArray(v) && v.length === 0);
}

export function responsesToAnswers(answers: StoredAnswer[] | undefined | null): SurveyAnswers {
  const out: SurveyAnswers = {};
  if (!answers) return out;

  for (const a of answers) {
    const code = a.question_code;
    if (!code) continue;
    const key = a.context_key ? `${a.context_key}|${code}` : code;

    let value: unknown;

    if (a.selected_choice_values && a.selected_choice_values.length > 0) {
      // Single vs multiple choice: form stores single as a scalar, multiple as array.
      // A lone choice is ambiguous, but the form accepts a scalar for single-choice
      // and normalizes arrays for multiple-choice, so return the array when >1 and
      // the scalar when exactly 1 to match single-choice storage.
      value = a.selected_choice_values.length === 1
        ? a.selected_choice_values[0]
        : a.selected_choice_values;
    } else if (!isEmpty(a.table_data)) {
      value = a.table_data;
    } else if (a.gps_latitude != null || a.gps_longitude != null) {
      value = { latitude: a.gps_latitude, longitude: a.gps_longitude };
    } else if (a.geographic_unit != null) {
      value = a.geographic_unit;
    } else if (a.coverage_level != null) {
      value = a.coverage_level;
    } else if (a.boolean_value != null) {
      value = a.boolean_value;
    } else if (a.number_value != null) {
      value = a.number_value;
    } else if (a.date_value != null) {
      value = a.date_value;
    } else if (a.time_value != null) {
      value = a.time_value;
    } else if (!isEmpty(a.text_value)) {
      value = a.text_value;
    }

    if (!isEmpty(value)) {
      out[key] = value;
    }

    // Preserve free-text "other" entries; backend keys them "<code>__other_text".
    if (!isEmpty(a.other_text)) {
      out[`${code}__other_text`] = a.other_text as string;
    }
  }

  return out;
}
