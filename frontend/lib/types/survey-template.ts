/**
 * Type definitions for DESDE-LTC dynamic questionnaire system
 * Matches backend serializers in apps/survey/serializers.py
 */

// Backend Question.AnswerType choices
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
  | 'LOCATION';  // Custom location input with fixed Provinsi/Kabupaten, dropdown Kecamatan, text Desa, auto-GPS

// Backend SurveyTemplate.TEMPLATE_TYPES choices
export type TemplateType =
  | 'RESIDENTIAL'
  | 'DAY_CARE'
  | 'OUTPATIENT'
  | 'ACCESSIBILITY'
  | 'INFORMATION'
  | 'BASIC_DATA'
  | 'GENERAL';

export type SurveyStatus = 'DRAFT' | 'SUBMITTED' | 'VERIFIED' | 'REJECTED';

// Matches QuestionChoiceSerializer
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
}

export interface TableColumn {
  code: string;
  label: string;
  type: 'number' | 'text';
}

export interface TableRow {
  code: string;
  label: string;
}

export interface TableConfig {
  rows: TableRow[];
  columns: TableColumn[];
}

export interface ValidationRules {
  min?: number;
  max?: number;
  pattern?: string;
  max_length?: number;
}

// Matches QuestionSerializer
export interface Question {
  id: number;
  code: string;
  question_text: string;  // Backend uses question_text
  answer_type: QuestionType;  // Backend uses answer_type
  answer_type_display?: string;
  is_required: boolean;
  order: number;
  mtc_code?: number | null;
  mtc_code_display?: string;
  desde_ltc_description?: string;
  keterangan?: string;  // Backend uses keterangan for help text
  validation_rules?: ValidationRules;
  show_condition?: Record<string, any>;
  skip_logic?: Array<{ value: string; goto: string }>;
  choices?: QuestionOption[];  // Backend uses choices (from QuestionChoice model)

  // Computed/convenience fields for frontend
  text?: string;  // Alias for question_text
  help_text?: string;  // Alias for keterangan
  question_type?: QuestionType;  // Alias for answer_type
  options?: QuestionOption[];  // Alias for choices
  table_config?: TableConfig;
  parent_question?: number;
  show_if_value?: string | string[];
  child_questions?: Question[];
}

// Matches QuestionSectionSerializer
export interface QuestionSection {
  id: number;
  code: string;
  name: string;  // Backend uses name
  description?: string;
  order: number;
  introduction_text?: string;
  show_condition?: Record<string, any>;
  questions: Question[];

  // Computed/convenience field for frontend
  title?: string;  // Alias for name
  show_if_question?: number;
  show_if_value?: string | string[];
}

// Matches SurveyTemplateDetailSerializer
export interface SurveyTemplate {
  id: number;
  code: string;
  name: string;
  description: string;
  version: string;
  template_type: TemplateType;
  template_type_display?: string;
  target_mtc?: number | null;
  is_active: boolean;
  total_questions: number;
  sections?: QuestionSection[];
  created_at?: string;
  updated_at?: string;
}

export interface QuestionResponse {
  id?: number;
  question: number;
  question_code?: string;
  question_text?: string;
  answer_text?: string | null;
  answer_number?: number | null;
  answer_date?: string | null;
  answer_boolean?: boolean | null;
  answer_json?: any;
  answer_file?: string | null;
  answer_value?: any;
  created_at?: string;
  updated_at?: string;
}

export interface SurveyResponse {
  id?: number;
  template: number | SurveyTemplate;
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
  assigned_verifier?: number | null;
  verifier_name?: string;
  verified_by?: number | null;
  verified_by_name?: string;
  verified_at?: string | null;
  verifier_notes?: string;
  rejection_reason?: string;
  legacy_data?: any;
  question_responses?: QuestionResponse[];
  answers?: QuestionResponse[];
  created_at?: string;
  updated_at?: string;
  submitted_at?: string | null;
}

export interface SurveyResponseCreate {
  template: number;
  service: number;
  survey_date: string;
  survey_period_start: string;
  survey_period_end: string;
  latitude?: number | null;
  longitude?: number | null;
  location_accuracy?: number | null;
  surveyor_notes?: string;
  answers: SurveyAnswers;
}

export interface SurveyResponseUpdate {
  survey_date?: string;
  survey_period_start?: string;
  survey_period_end?: string;
  latitude?: number | null;
  longitude?: number | null;
  location_accuracy?: number | null;
  surveyor_notes?: string;
  answers?: SurveyAnswers;
}

// Type for survey answers: maps question code to answer value
export type SurveyAnswers = Record<string, any>;

// Type for table answers: 2D grid of values
export type TableAnswer = Record<string, Record<string, any>>;
