/**
 * Type definitions for dynamic survey system (mobile)
 * Mirrors frontend/lib/types/survey-template.ts
 */

export type QuestionType =
  | 'TEXT'
  | 'TEXTAREA'
  | 'NUMBER'
  | 'INTEGER'
  | 'DATE'
  | 'TIME'
  | 'BOOLEAN'
  | 'SINGLE_CHOICE'
  | 'MULTIPLE_CHOICE'
  | 'GEO_PROVINSI'
  | 'GEO_KABUPATEN'
  | 'GEO_KECAMATAN'
  | 'GEO_DESA'
  | 'GEO_FULL'
  | 'COVERAGE_LEVEL'
  | 'PHONE'
  | 'EMAIL'
  | 'URL'
  | 'FILE'
  | 'GPS'
  | 'STAFF_TABLE'
  | 'DIAGNOSIS_TABLE'
  | 'REPEATING_TABLE'
  | 'INTERVENTION_MATRIX'
  | 'LOCATION';

export type SurveyStatus = 'DRAFT' | 'SUBMITTED' | 'VERIFIED' | 'REJECTED';

export interface QuestionOption {
  id: number;
  value: string;
  label: string;
  order: number;
  mtc_code?: number | null;
  mtc_code_display?: string;
  keterangan?: string;
  next_question_code?: string;
  has_other_input?: boolean;
  other_input_label?: string;
  cabang_mtc?: string;
  kode_desde_ltc?: string;
}

export interface TableRow {
  code: string;
  label: string;
}

export interface TableColumn {
  code: string;
  label: string;
  type: 'number' | 'text' | 'multiple_choice' | 'single_choice' | 'time';
  options?: Array<{ value: string; label: string }>;
}

export interface TableConfig {
  rows?: TableRow[];
  columns: TableColumn[];
}

export interface Question {
  id: number;
  code: string;
  question_text: string;
  answer_type: QuestionType;
  is_required: boolean;
  order: number;
  introduction_text?: string;
  keterangan?: string;
  show_condition?: Record<string, any>;
  skip_logic?: Array<{ value: string; goto: string }>;
  choices?: QuestionOption[];
  parent_question?: number;
  show_if_value?: string | string[];
  table_config?: TableConfig;
}

export interface QuestionSection {
  id: number;
  code: string;
  name: string;
  description?: string;
  order: number;
  introduction_text?: string;
  show_condition?: Record<string, any>;
  questions: Question[];
  show_if_question?: number;
  show_if_value?: string | string[];
}

export interface SurveyTemplate {
  id: number;
  code: string;
  name: string;
  description: string;
  version: string;
  is_active: boolean;
  total_questions: number;
  sections?: QuestionSection[];
}

export interface SurveyResponseItem {
  id: number;
  template: number;
  template_name?: string;
  service: number | { id: number; name?: string; city?: string };
  service_name?: string;
  service_city?: string;
  survey_date: string;
  survey_period_start: string;
  survey_period_end: string;
  latitude?: number | null;
  longitude?: number | null;
  location_accuracy?: number | null;
  surveyor?: number;
  surveyor_name?: string;
  surveyor_notes?: string;
  verification_status?: SurveyStatus;
  status_display?: string;
  deletion_requested?: boolean;
  answers?: any;
  created_at?: string;
  updated_at?: string;
}

export type SurveyAnswers = Record<string, any>;

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}
