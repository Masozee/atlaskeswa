import { apiClient } from './api';
import { database } from './database';

class SyncQueue {
  async getPendingCount(): Promise<number> {
    return database.getPendingSyncCount();
  }

  async processQueue(): Promise<{ success: number; failed: number }> {
    if (!database.isInitialized()) return { success: 0, failed: 0 };
    const pendingSurveys = await database.getPendingSurveys();
    let success = 0;
    let failed = 0;

    for (const survey of pendingSurveys) {
      try {
        const answers = survey.answers_json ? JSON.parse(survey.answers_json) : {};
        const payload: Record<string, any> = {
          template: survey.template_id,
          service: survey.service_id,
          survey_date: survey.survey_date,
          answers,
        };
        // Only include survey_period if they have valid values
        if (survey.survey_period_start) payload.survey_period_start = survey.survey_period_start;
        if (survey.survey_period_end) payload.survey_period_end = survey.survey_period_end;
        if (survey.gps_latitude != null) payload.gps_latitude = survey.gps_latitude;
        if (survey.gps_longitude != null) payload.gps_longitude = survey.gps_longitude;

        // Pass verification_status to keep DRAFT as DRAFT (backend auto-submits if not passed)
        if (survey.verification_status) {
          payload.verification_status = survey.verification_status;
        }

        if (survey.pending_action === 'create') {
          const response = await apiClient.post('/surveys/responses/', payload) as any;
          await database.markSurveySynced(survey.id, response?.id);
          success++;
        } else if (survey.pending_action === 'update' && survey.server_id) {
          await apiClient.patch(`/surveys/responses/${survey.server_id}/`, payload);
          await database.markSurveySynced(survey.id);
          success++;
        }
      } catch (error) {
        console.error(`Failed to sync survey ${survey.id}:`, error);
        failed++;
      }
    }

    const status = failed === 0 ? 'success' : 'failed';
    await database.updateLastSyncTime(status);

    return { success, failed };
  }
}

export const syncQueue = new SyncQueue();
