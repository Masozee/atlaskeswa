/**
 * TypeScript types for API responses
 */

// Pagination
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// User & Auth
export interface User {
  id: number;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  full_name: string;
  role: 'ADMIN' | 'SURVEYOR' | 'VERIFIER' | 'VIEWER';
  role_display: string;
  phone_number?: string;
  organization?: string;
  avatar?: string;
  is_active: boolean;
  is_staff: boolean;
  created_at: string;
  updated_at: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

// Directory Models
export interface MainTypeOfCare {
  id: number;
  code: string;
  name: string;
  description?: string;
  parent?: number;
  is_active: boolean;
  children_count: number;
}

export interface BasicStableInputsOfCare {
  id: number;
  code: string;
  name: string;
  description?: string;
  is_active: boolean;
}

export interface TargetPopulation {
  id: number;
  name: string;
  description?: string;
  is_active: boolean;
}

export interface ServiceType {
  id: number;
  name: string;
  description?: string;
  is_active: boolean;
}

export interface Service {
  id: number;
  name: string;
  description?: string;
  mtc: MainTypeOfCare;
  bsic: BasicStableInputsOfCare;
  service_type: ServiceType;
  target_populations: TargetPopulation[];
  phone_number?: string;
  email?: string;
  website?: string;
  address?: string;
  city: string;
  province: string;
  postal_code?: string;
  latitude?: string;
  longitude?: string;
  bed_capacity?: number;
  staff_count?: number;
  psychiatrist_count?: number;
  psychologist_count?: number;
  nurse_count?: number;
  social_worker_count?: number;
  total_professional_staff: number;
  accepts_bpjs: boolean;
  accepts_private_insurance: boolean;
  is_24_7: boolean;
  accepts_emergency: boolean;
  is_active: boolean;
  is_verified: boolean;
  verified_by?: User;
  verified_at?: string;
  created_by?: User;
  created_at: string;
  updated_at: string;
}

export interface ServiceListItem {
  id: number;
  name: string;
  mtc_code?: string;
  mtc_name?: string;
  bsic_code?: string;
  bsic_name?: string;
  service_type_name?: string;
  city: string;
  province: string;
  bed_capacity?: number | null;
  staff_count?: number | null;
  total_professional_staff?: number;
  is_verified: boolean;
  is_active: boolean;
  accepts_bpjs?: boolean;
  accepts_emergency?: boolean;
}

// Survey Models
export interface SurveyService {
  id: number;
  name: string;
  city: string;
  province: string;
  mtc_code?: string;
  mtc_name?: string;
  bsic_code?: string;
  bsic_name?: string;
  service_type_name?: string;
  bed_capacity?: number;
  total_professional_staff: number;
  is_verified: boolean;
  is_active: boolean;
  created_at: string;
  address?: string;
  postal_code?: string;
  phone_number?: string;
  email?: string;
  website?: string;
  latitude?: string;
  longitude?: string;
}

// For creating/updating surveys (service is passed as ID)
export interface SurveyCreateData {
  service: number;
  survey_date: string;
  survey_period_start?: string;
  survey_period_end?: string;
  surveyor?: number;
  latitude?: string;
  longitude?: string;
  location_accuracy?: string;
  assigned_verifier?: number;
  current_bed_capacity?: number | null;
  beds_occupied?: number | null;
  current_staff_count?: number | null;
  current_psychiatrist_count?: number | null;
  current_psychologist_count?: number | null;
  current_nurse_count?: number | null;
  current_social_worker_count?: number | null;
  total_patients_served?: number | null;
  new_patients?: number | null;
  returning_patients?: number | null;
  patients_male?: number | null;
  patients_female?: number | null;
  patients_age_0_17?: number | null;
  patients_age_18_64?: number | null;
  patients_age_65_plus?: number | null;
  patient_satisfaction_score?: number | null;
  average_wait_time_days?: number | null;
  monthly_budget?: string;
  bpjs_patients?: number | null;
  private_insurance_patients?: number | null;
  self_pay_patients?: number | null;
  challenges_faced?: string;
  improvements_needed?: string;
  surveyor_notes?: string;
  additional_notes?: string;
}

export interface Survey {
  id: number;
  service: SurveyService;
  surveyor: number;
  surveyor_name?: string;
  survey_date: string;
  survey_period_start?: string;
  survey_period_end?: string;
  latitude?: string;
  longitude?: string;
  location_accuracy?: string;
  verification_status: 'DRAFT' | 'SUBMITTED' | 'VERIFIED' | 'REJECTED';
  status_display?: string;
  assigned_verifier?: number;
  verifier_name?: string;
  verified_by?: number;
  verified_by_name?: string;
  verified_at?: string;
  current_bed_capacity?: number;
  beds_occupied?: number;
  occupancy_rate?: number;
  current_staff_count?: number;
  current_psychiatrist_count?: number;
  current_psychologist_count?: number;
  current_nurse_count?: number;
  current_social_worker_count?: number;
  total_professional_staff?: number;
  total_patients_served?: number;
  new_patients?: number;
  returning_patients?: number;
  patients_male?: number;
  patients_female?: number;
  patients_age_0_17?: number;
  patients_age_18_64?: number;
  patients_age_65_plus?: number;
  patient_satisfaction_score?: number;
  average_wait_time_days?: number;
  monthly_budget?: string;
  bpjs_patients?: number;
  private_insurance_patients?: number;
  self_pay_patients?: number;
  challenges_faced?: string;
  improvements_needed?: string;
  surveyor_notes?: string;
  verifier_notes?: string;
  rejection_reason?: string;
  additional_notes?: string;
  created_at: string;
  updated_at: string;
  submitted_at?: string;
}

export interface SurveyListItem {
  id: number;
  service?: number;
  service_name: string;
  service_city?: string;
  surveyor?: number;
  surveyor_name: string;
  survey_date: string;
  verification_status: string;
  verification_status_display?: string;
  status_display?: string;
  assigned_verifier?: number | null;
  verifier_name?: string | null;
  occupancy_rate?: number | null;
  total_patients_served?: number;
  created_at: string;
  city?: string;
  province?: string;
}

// Analytics
export interface ServiceAnalytics {
  total: number;
  verified: number;
  active: number;
  by_mtc: Array<{ mtc__code: string; mtc__name: string; count: number }>;
  by_province: Array<{ province: string; count: number }>;
  insurance_coverage: {
    bpjs: number;
    private: number;
  };
  emergency_services: {
    twentyfour_seven: number;
    accepts_emergency: number;
  };
  average_metrics: {
    beds: number;
    staff: number;
    psychiatrists: number;
    psychologists: number;
  };
}

export interface SurveyAnalytics {
  total: number;
  by_status: {
    DRAFT: number;
    SUBMITTED: number;
    VERIFIED: number;
    REJECTED: number;
  };
  recent_count: number;
  average_occupancy_rate: number;
  patient_demographics: {
    total_patients: number;
    male_patients: number;
    female_patients: number;
    age_0_17: number;
    age_18_64: number;
    age_65_plus: number;
  };
}

export interface DashboardStats {
  services: {
    total: number;
    verified: number;
    active: number;
    recent: number;
  };
  surveys: {
    total: number;
    pending: number;
    verified: number;
    recent: number;
  };
  users: {
    total: number;
    active: number;
  };
  capacity: {
    total_beds: number;
    total_staff: number;
    psychiatrists: number;
    psychologists: number;
    nurses: number;
    social_workers: number;
  };
  geographic_distribution: Array<{ province: string; count: number }>;
  mtc_distribution: Array<{ mtc__code: string; mtc__name: string; count: number }>;
  system_health: {
    unresolved_errors: number;
    critical_errors: number;
  };
  activity_trends: Array<{ day: string; count: number }>;
}

// Logs
export interface ActivityLog {
  id: number;
  user?: User;
  username: string;
  action: string;
  action_display: string;
  severity: string;
  severity_display: string;
  description: string;
  model_name?: string;
  object_id?: number;
  changes?: any;
  ip_address?: string;
  user_agent?: string;
  success: boolean;
  timestamp: string;
}

export interface SystemError {
  id: number;
  severity: string;
  error_type: string;
  error_code?: string;
  error_message: string;
  stack_trace?: string;
  endpoint?: string;
  is_resolved: boolean;
  resolved_by?: User;
  resolved_at?: string;
  resolution_notes?: string;
  occurrence_count: number;
  timestamp: string;
}
