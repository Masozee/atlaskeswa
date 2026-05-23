import { apiClient } from './api';
import { database } from './database';

type StoredFileAnswer = {
  uri?: string;
  file_url?: string;
  file?: string;
  name?: string;
  type?: string;
  uploaded?: boolean;
};

type PendingAnswerFile = {
  storageKey: string;
  questionCode: string;
  contextKey: string;
  file: {
    uri: string;
    fileName: string;
    mimeType: string;
  };
  previousValue: StoredFileAnswer;
};

const isStoredFileAnswer = (value: unknown): value is StoredFileAnswer =>
  !!value && typeof value === 'object' && !Array.isArray(value);

const getLocalFileUri = (value: StoredFileAnswer): string | undefined => {
  const candidate = value.uri || value.file || value.file_url;
  if (!candidate || candidate.startsWith('http')) return undefined;
  return candidate;
};

const inferFileName = (uri: string, explicitName?: string) =>
  explicitName || uri.split('?')[0].split('/').pop() || `file_${Date.now()}.jpg`;

const inferMimeType = (fileName: string, explicitType?: string) => {
  if (explicitType) return explicitType;
  const ext = fileName.split('.').pop()?.toLowerCase();
  if (ext === 'png') return 'image/png';
  if (ext === 'webp') return 'image/webp';
  if (ext === 'heic') return 'image/heic';
  if (ext === 'heif') return 'image/heif';
  return 'image/jpeg';
};

const collectPendingAnswerFiles = (answers: Record<string, unknown>): PendingAnswerFile[] => {
  const files: PendingAnswerFile[] = [];

  for (const [storageKey, value] of Object.entries(answers)) {
    if (!isStoredFileAnswer(value)) continue;
    const localUri = getLocalFileUri(value);
    if (!localUri) continue;

    const [contextKey, questionCode] = storageKey.includes('|')
      ? storageKey.split('|', 2)
      : ['', storageKey];
    const fileName = inferFileName(localUri, value.name);

    files.push({
      storageKey,
      questionCode,
      contextKey,
      file: {
        uri: localUri,
        fileName,
        mimeType: inferMimeType(fileName, value.type),
      },
      previousValue: value,
    });
  }

  return files;
};

class SyncQueue {
  async getPendingCount(): Promise<number> {
    return database.getPendingSyncCount();
  }

  async processSurvey(localId: number): Promise<{
    surveyId: number;
    serverId?: number;
    uploadedPhotos: number;
    failedPhotos: number;
    photoErrors: string[];
    uploadedAnswerFiles: number;
    failedAnswerFiles: number;
    answerFileErrors: string[];
  }> {
    if (!database.isInitialized()) {
      throw new Error('Database belum siap');
    }

    const survey = await database.getSurvey(localId);
    if (!survey) {
      throw new Error('Survei lokal tidak ditemukan');
    }

    const answers = survey.answers_json ? JSON.parse(survey.answers_json) : {};
    const payload: Record<string, any> = {
      template: survey.template_id,
      service: survey.service_id,
      survey_date: survey.survey_date,
      answers,
    };

    if (survey.survey_period_start) payload.survey_period_start = survey.survey_period_start;
    if (survey.survey_period_end) payload.survey_period_end = survey.survey_period_end;
    if (survey.gps_latitude != null) payload.gps_latitude = survey.gps_latitude;
    if (survey.gps_longitude != null) payload.gps_longitude = survey.gps_longitude;

    let serverId = typeof survey.server_id === 'number' ? survey.server_id : undefined;
    let shouldSubmitAfterUploads = false;

    if (serverId) {
      const patchPayload: Record<string, any> = {
        ...payload,
        prune_missing_answers: true,
      };

      if (survey.verification_status === 'SUBMITTED') {
        patchPayload.verification_status = 'DRAFT';
        shouldSubmitAfterUploads = true;
      } else if (survey.verification_status) {
        patchPayload.verification_status = survey.verification_status;
      }

      await apiClient.patch(`/surveys/responses/${serverId}/`, patchPayload);
    } else {
      if (survey.verification_status === 'DRAFT') {
        payload.verification_status = 'DRAFT';
      } else if (survey.verification_status === 'SUBMITTED') {
        payload.verification_status = 'DRAFT';
        shouldSubmitAfterUploads = true;
      }

      const response = await apiClient.post('/surveys/responses/', payload) as any;
      serverId = response?.id;
      if (!serverId) {
        throw new Error('Server tidak mengembalikan ID survei');
      }

      await database.setSurveyServerId(localId, serverId);
      await database.setSurveyServerIdForPhotos(localId, serverId);
    }

    const pendingAnswerFiles = collectPendingAnswerFiles(answers);
    let uploadedAnswerFiles = 0;
    const answerFileErrors: string[] = [];
    if (pendingAnswerFiles.length > 0) {
      for (const pendingFile of pendingAnswerFiles) {
        try {
          const uploaded = await apiClient.uploadResponseAnswerFile(
            serverId,
            pendingFile.questionCode,
            pendingFile.file,
            pendingFile.contextKey || undefined,
          );

          const uploadedUrl = uploaded?.file_url || uploaded?.file;
          answers[pendingFile.storageKey] = {
            file_url: uploadedUrl || pendingFile.previousValue.file_url || pendingFile.file.uri,
            name: pendingFile.previousValue.name || pendingFile.file.fileName,
            type: pendingFile.previousValue.type || pendingFile.file.mimeType,
            uploaded: true,
          };
          uploadedAnswerFiles += 1;
        } catch (uploadErr: any) {
          const errMsg = uploadErr?.message || String(uploadErr);
          console.error(`[Sync] answer file upload failed (${pendingFile.questionCode}):`, errMsg);
          answerFileErrors.push(`${pendingFile.questionCode}: ${errMsg}`);
        }
      }

      await database.updateSurveyLocal(localId, {
        answers_json: JSON.stringify(answers),
      });
    }

    const pendingPhotos = await database.getPendingSurveyPhotosForLocalSurvey(localId);
    let uploadedPhotos = 0;
    const photoErrors: string[] = [];
    for (const photo of pendingPhotos) {
      try {
        const uploaded = await apiClient.uploadSurveyPhoto(serverId, photo.local_uri, photo.caption || undefined);
        await database.markPhotoSynced(photo.id, uploaded?.id || 0, uploaded?.image_url || uploaded?.image || photo.local_uri);
        uploadedPhotos += 1;
      } catch (photoErr: any) {
        const errMsg = photoErr?.message || String(photoErr);
        const label = photo.caption ? `"${photo.caption}"` : `foto #${photo.id}`;
        console.error(`[Sync] photo upload failed (${label}):`, errMsg);
        photoErrors.push(`${label}: ${errMsg}`);
      }
    }

    if (shouldSubmitAfterUploads) {
      await apiClient.post(`/surveys/responses/${serverId}/submit/`);
    }

    const allMediaSynced =
      photoErrors.length === 0 && answerFileErrors.length === 0;
    if (allMediaSynced) {
      await database.markSurveySynced(localId, serverId);
    }
    await database.updateLastSyncTime(allMediaSynced ? 'success' : 'partial');

    return {
      surveyId: localId,
      serverId,
      uploadedPhotos,
      failedPhotos: photoErrors.length,
      photoErrors,
      uploadedAnswerFiles,
      failedAnswerFiles: answerFileErrors.length,
      answerFileErrors,
    };
  }

  async processQueue(): Promise<{ success: number; failed: number }> {
    if (!database.isInitialized()) return { success: 0, failed: 0 };
    const pendingSurveys = await database.getPendingSurveys();
    let success = 0;
    let failed = 0;

    for (const survey of pendingSurveys) {
      try {
        await this.processSurvey(survey.id);
        success++;
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
