import { apiClient } from './api';
import { database } from './database';

class SyncQueue {
  async getPendingCount(): Promise<number> {
    return await database.getPendingSyncCount();
  }

  async processQueue(): Promise<{ success: number; failed: number }> {
    const pendingSurveys = await database.getPendingSurveys();
    let success = 0;
    let failed = 0;

    for (const survey of pendingSurveys) {
      try {
        if (survey.pending_action === 'create') {
          // Create new survey on server
          const response = await apiClient.post('/surveys/surveys/', {
            service: survey.service_id,
            survey_date: survey.survey_date,
            survey_period_start: survey.survey_period_start,
            survey_period_end: survey.survey_period_end,
            latitude: survey.latitude,
            longitude: survey.longitude,
            location_accuracy: survey.location_accuracy,
            current_bed_capacity: survey.current_bed_capacity,
            beds_occupied: survey.beds_occupied,
            current_psychiatrist_count: survey.current_psychiatrist_count,
            current_psychologist_count: survey.current_psychologist_count,
            current_nurse_count: survey.current_nurse_count,
            current_social_worker_count: survey.current_social_worker_count,
            total_patients_served: survey.total_patients_served,
            new_patients: survey.new_patients,
            returning_patients: survey.returning_patients,
            patients_male: survey.patients_male,
            patients_female: survey.patients_female,
            patients_age_0_17: survey.patients_age_0_17,
            patients_age_18_64: survey.patients_age_18_64,
            patients_age_65_plus: survey.patients_age_65_plus,
            bpjs_patients: survey.bpjs_patients,
            private_insurance_patients: survey.private_insurance_patients,
            self_pay_patients: survey.self_pay_patients,
            monthly_budget: survey.monthly_budget,
            patient_satisfaction_score: survey.patient_satisfaction_score,
            average_wait_time_days: survey.average_wait_time_days,
            surveyor_notes: survey.surveyor_notes,
            challenges_faced: survey.challenges_faced,
            improvements_needed: survey.improvements_needed,
            additional_notes: survey.additional_notes,
          });
          await database.markSurveySynced(survey.id, response.id);
          success++;
        } else if (survey.pending_action === 'update' && survey.server_id) {
          // Update existing survey on server
          await apiClient.patch(`/surveys/surveys/${survey.server_id}/`, {
            service: survey.service_id,
            survey_date: survey.survey_date,
            survey_period_start: survey.survey_period_start,
            survey_period_end: survey.survey_period_end,
            latitude: survey.latitude,
            longitude: survey.longitude,
            location_accuracy: survey.location_accuracy,
            current_bed_capacity: survey.current_bed_capacity,
            beds_occupied: survey.beds_occupied,
            current_psychiatrist_count: survey.current_psychiatrist_count,
            current_psychologist_count: survey.current_psychologist_count,
            current_nurse_count: survey.current_nurse_count,
            current_social_worker_count: survey.current_social_worker_count,
            total_patients_served: survey.total_patients_served,
            new_patients: survey.new_patients,
            returning_patients: survey.returning_patients,
            patients_male: survey.patients_male,
            patients_female: survey.patients_female,
            patients_age_0_17: survey.patients_age_0_17,
            patients_age_18_64: survey.patients_age_18_64,
            patients_age_65_plus: survey.patients_age_65_plus,
            bpjs_patients: survey.bpjs_patients,
            private_insurance_patients: survey.private_insurance_patients,
            self_pay_patients: survey.self_pay_patients,
            monthly_budget: survey.monthly_budget,
            patient_satisfaction_score: survey.patient_satisfaction_score,
            average_wait_time_days: survey.average_wait_time_days,
            surveyor_notes: survey.surveyor_notes,
            challenges_faced: survey.challenges_faced,
            improvements_needed: survey.improvements_needed,
            additional_notes: survey.additional_notes,
          });
          await database.markSurveySynced(survey.id);
          success++;
        }
      } catch (error) {
        console.error(`Failed to sync survey ${survey.id}:`, error);
        failed++;
      }
    }

    // Update last sync time
    const status = failed === 0 ? 'success' : 'failed';
    await database.updateLastSyncTime(status);

    return { success, failed };
  }
}

export const syncQueue = new SyncQueue();
