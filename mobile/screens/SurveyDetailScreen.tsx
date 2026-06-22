import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
  Dimensions,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import TopHeader from '../components/TopHeader';
import { useTheme, useFontScale } from '../contexts/SettingsContext';
import { apiClient } from '../services/api';
import { database } from '../services/database';
import { syncQueue } from '../services/syncQueue';
import type { SurveyResponseItem } from '../lib/types';
import { prepareImageForUpload } from '../lib/upload-image';

const PLACEHOLDER_IMAGE = require('../assets/OMMHA.png');

interface SurveyPhoto {
  id: number;
  survey: number;
  image_url: string;
  caption: string;
  uploaded_by_name: string | null;
  uploaded_at: string;
  local_uri?: string;
  local_id?: number;
  synced?: boolean;
}

interface PendingUploadImage {
  uri: string;
  fileName?: string | null;
  mimeType?: string | null;
}

const getPhotoDisplayName = (uri: string) => {
  const cleanUri = uri.split('?')[0];
  return cleanUri.split('/').pop() || `photo_${Date.now()}.jpg`;
};

const mapLocalPhotoToItem = (surveyLocalId: number, photo: any): SurveyPhoto => ({
  id: photo.server_id || photo.id,
  survey: surveyLocalId,
  image_url: photo.server_image_url || photo.local_uri,
  caption: photo.caption || '',
  uploaded_by_name: null,
  uploaded_at: new Date(photo.created_at).toISOString(),
  local_uri: photo.local_uri,
  local_id: photo.id,
  synced: photo.synced === 1,
});

interface AnswerItem {
  question_code: string;
  question_text: string;
  text_value?: string;
  number_value?: number;
  date_value?: string;
  time_value?: string;
  boolean_value?: boolean;
  selected_choice_values?: string[];
  selected_choice_labels?: string[];
  geographic_unit_name?: string;
  geographic_unit_display?: string;
  coverage_level?: string;
  table_data?: any;
  gps_latitude?: number;
  gps_longitude?: number;
  context_key?: string;
}

interface SurveyDetail extends SurveyResponseItem {
  answers?: AnswerItem[];
  surveyor_notes?: string;
  template_name?: string;
  is_local?: boolean;
  synced?: number;
  local_id?: number;
  server_id?: number | null;
  started_at?: string | null;
  submitted_at?: string | null;
  klasifikasi_list?: string[];
}

interface SurveyDetailScreenProps {
  surveyId: number;
  onBack: () => void;
  onEdit: (surveyId: number) => void;
}

const isDetailQuestionCode = (code: string) => (
  /^[A-Z]+Q[A-Z]\d*$/.test(code) || /^SDBQ\d+$/.test(code)
);

const formatNumberDisplay = (value: number | string): string => {
  const raw = String(value).trim();
  if (!raw) return raw;

  const numeric = Number(raw);
  if (!Number.isFinite(numeric)) return raw;
  if (Number.isInteger(numeric)) return String(numeric);

  return raw.replace(/(\.\d*?[1-9])0+$/, '$1').replace(/\.0+$/, '');
};

export default function SurveyDetailScreen({ surveyId, onBack, onEdit }: SurveyDetailScreenProps) {
  const theme = useTheme();
  const fs = useFontScale();
  const c = theme.colors;
  const isDark = theme.dark;
  const [survey, setSurvey] = useState<SurveyDetail | null>(null);
  const [photos, setPhotos] = useState<SurveyPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [captionModalVisible, setCaptionModalVisible] = useState(false);
  const [captionText, setCaptionText] = useState('');
  const [pendingImage, setPendingImage] = useState<PendingUploadImage | null>(null);
  const [editingPhoto, setEditingPhoto] = useState<SurveyPhoto | null>(null);
  const [localSurveyId, setLocalSurveyId] = useState<number | null>(null);
  // Maps cabang_mtc value → question code that triggered it (e.g. "Pemantauan Intensitas Tinggi" → "RQ3")
  const [cabangMtcToTrigger, setCabangMtcToTrigger] = useState<Map<string, string>>(new Map());
  const [questionOrderByCode, setQuestionOrderByCode] = useState<Map<string, number>>(new Map());

  useEffect(() => {
    fetchSurveyDetail();
  }, [surveyId]);

  const refreshLocalPhotos = async (surveyLocalId: number) => {
    const localPhotos = await database.getSurveyPhotosForLocalSurvey(surveyLocalId);
    const mappedLocalPhotos = localPhotos.map((photo: any) => mapLocalPhotoToItem(surveyLocalId, photo));

    setPhotos((prev) => {
      const remoteOnly = prev.filter((photo) => !photo.local_id && photo.synced);
      return [...mappedLocalPhotos, ...remoteOnly];
    });
  };

  const buildLocalAnswers = (rawAnswers: Record<string, any>, tpl: any): AnswerItem[] => {
    const questionMap = new Map<string, any>();
    (tpl?.sections || []).forEach((section: any) => {
      (section.questions || []).forEach((question: any) => {
        questionMap.set(question.code, question);
      });
    });

    const otherTextMap = new Map<string, any>();
    Object.entries(rawAnswers).forEach(([key, value]) => {
      if (!key.endsWith('__other_text')) return;
      const baseKey = key.replace('__other_text', '');
      if (typeof value !== 'string') {
        otherTextMap.set(baseKey, value);
        return;
      }
      try {
        otherTextMap.set(baseKey, JSON.parse(value));
      } catch {
        otherTextMap.set(baseKey, value);
      }
    });

    return Object.entries(rawAnswers)
      .filter(([key]) => !key.endsWith('__other_text'))
      .map(([storageKey, value]) => {
        const [contextKey, questionCode] = storageKey.includes('|')
          ? storageKey.split('|', 2)
          : ['', storageKey];
        const question = questionMap.get(questionCode);
        const answer: AnswerItem = {
          question_code: questionCode,
          question_text: question?.question_text || questionCode,
          context_key: contextKey || undefined,
        };

        if (question?.answer_type === 'SINGLE_CHOICE' || question?.answer_type === 'MULTIPLE_CHOICE') {
          const values = Array.isArray(value) ? value.map(String) : value != null && value !== '' ? [String(value)] : [];
          const otherData = otherTextMap.get(storageKey);
          const labels = values.map((choiceValue) => {
            const choice = question?.choices?.find((item: any) => String(item.value) === choiceValue);
            const otherText = otherData && typeof otherData === 'object' ? otherData[choiceValue] : undefined;
            return otherText ? `${choice?.label || choiceValue}: ${otherText}` : (choice?.label || choiceValue);
          });
          answer.selected_choice_values = values;
          answer.selected_choice_labels = labels;
          return answer;
        }

        if (typeof value === 'boolean') {
          answer.boolean_value = value;
          return answer;
        }

        if (typeof value === 'number') {
          answer.number_value = value;
          return answer;
        }

        if (question?.answer_type === 'DATE' && typeof value === 'string') {
          answer.date_value = value;
          return answer;
        }

        if (question?.answer_type === 'TIME' && typeof value === 'string') {
          answer.time_value = value;
          return answer;
        }

        if (question?.answer_type === 'LOCATION' && value && typeof value === 'object') {
          answer.table_data = value;
          return answer;
        }

        if (
          value &&
          typeof value === 'object' &&
          typeof value.latitude === 'number' &&
          typeof value.longitude === 'number'
        ) {
          answer.gps_latitude = value.latitude;
          answer.gps_longitude = value.longitude;
          return answer;
        }

        if (value && typeof value === 'object') {
          answer.table_data = value;
          return answer;
        }

        answer.text_value = value == null ? '' : String(value);
        return answer;
      });
  };

  // Compute the DESDE-LTC classification ("Kode") list from raw answers + template,
  // mirroring the Klasifikasi shown at the end of the survey form.
  const computeKlasifikasiList = (rawAnswers: Record<string, any>, tpl: any): string[] => {
    const questionMap = new Map<string, any>();
    (tpl?.sections || []).forEach((section: any) => {
      (section.questions || []).forEach((q: any) => questionMap.set(q.code, q));
    });

    const entries: { code: string; title: string }[] = [];
    Object.entries(rawAnswers).forEach(([storageKey, rawValue]) => {
      if (storageKey.endsWith('__other_text')) return;
      const questionCode = storageKey.includes('|') ? storageKey.split('|', 2)[1] : storageKey;
      const question = questionMap.get(questionCode);
      if (!question) return;
      const values = Array.isArray(rawValue) ? rawValue : [rawValue];
      values.forEach((value) => {
        if (value === null || value === undefined) return;
        const stringValue = String(value).trim();
        if (!stringValue) return;
        const choice = question.choices?.find((item: any) => String(item.value) === stringValue);
        const display = choice?.mtc_code_display?.trim() || '';
        if (!display) return;
        const [codePart, labelPart] = display.split(' — ', 2);
        const code = codePart?.trim() || '';
        if (!code) return;
        const title = labelPart?.trim() ? `${code} — ${labelPart.trim()}` : display;
        entries.push({ code, title });
      });
    });

    const unique = Array.from(new Map(entries.map((e) => [e.code, e])).values());
    const leaves = unique.filter(
      (e) => !unique.some((o) => o.code !== e.code && o.code.startsWith(e.code + '.'))
    );
    return leaves.map((e) => e.title);
  };

  const fetchSurveyDetail = async () => {
    try {
      const requestedLocalId = surveyId < 0 ? Math.abs(surveyId) : surveyId;
      let local = await database.getSurvey(requestedLocalId);
      if (!local && surveyId > 0) {
        local = await database.getSurveyByServerId(surveyId);
      }
      if (!local) {
        setSurvey(null);
        return;
      }

      const normalized: SurveyDetail = {
        id: Number(local.id),
        local_id: Number(local.id),
        server_id: typeof local.server_id === 'number' ? local.server_id : null,
        template: local.template_id || 0,
        service: local.service_id || 0,
        service_name: local.service_name || 'Layanan',
        service_city: local.service_city || '-',
        survey_date: local.survey_date,
        survey_period_start: local.survey_period_start || '',
        survey_period_end: local.survey_period_end || '',
        latitude: local.gps_latitude ?? null,
        longitude: local.gps_longitude ?? null,
        verification_status: local.verification_status || 'DRAFT',
        status_display: local.verification_status === 'SUBMITTED' ? 'Siap Sync' : 'Draft Lokal',
        answers: [],
        is_local: true,
        synced: Number(local.synced ?? 0),
        started_at: local.started_at ?? null,
        // Real submitted_at if present; legacy rows fall back to updated_at once
        // the survey has left DRAFT.
        submitted_at: local.submitted_at
          ?? (local.verification_status && local.verification_status !== 'DRAFT'
            ? (local.updated_at ?? null)
            : null),
        klasifikasi_list: [],
      };
      setSurvey(normalized);
      setLocalSurveyId(Number(local.id));

      const tpl = local.template_id
        ? await database.getTemplate(Number(local.template_id))
        : await database.getLatestTemplate();

      if (tpl && local.answers_json) {
        const rawAnswers = JSON.parse(local.answers_json);
        normalized.template_name = tpl.name;
        normalized.answers = buildLocalAnswers(rawAnswers, tpl);
        normalized.klasifikasi_list = computeKlasifikasiList(rawAnswers, tpl);
      }

      setSurvey({ ...normalized });

      // Surveyor name: local survey rows don't store it. Best-effort online fetch,
      // cached to app_settings so the field survives offline on old devices.
      try {
        let surveyorName = await database.getSetting('current_user_name');
        try {
          const userData = await apiClient.get<any>('/accounts/users/me/');
          const fullName = userData.full_name
            || (userData.first_name || userData.last_name
              ? `${userData.first_name || ''} ${userData.last_name || ''}`.trim()
              : userData.email?.split('@')[0] || '');
          if (fullName) {
            surveyorName = fullName;
            await database.saveSetting('current_user_name', fullName);
          }
        } catch {
          // offline — fall back to cached name
        }
        if (surveyorName) {
          normalized.surveyor_name = surveyorName;
          setSurvey({ ...normalized });
        }
      } catch {
        // surveyor name unavailable
      }

      // Load cached template to build context_key → trigger question map
      try {
        if (tpl) {
          const map = new Map<string, string>();
          const orderMap = new Map<string, number>();
          (tpl.sections || []).forEach((section: any) => {
            (section.questions || []).forEach((q: any) => {
              orderMap.set(q.code, Number(q.order) || 0);
              // Skip detail questions.
              if (isDetailQuestionCode(q.code)) return;
              (q.choices || []).forEach((c: any) => {
                // Only map choices that lead to detail questions.
                if (c.next_question_code && isDetailQuestionCode(c.next_question_code)) {
                  // Use choice VALUE as key (context_key stores the value, not cabang_mtc)
                  if (c.value) map.set(c.value, q.code);
                }
              });
            });
          });
          setCabangMtcToTrigger(map);
          setQuestionOrderByCode(orderMap);
        }
      } catch {
        // Template not cached yet — fall back to family label
      }

      const photoItems: SurveyPhoto[] = [];
      const localServerIds = new Set<number>();
      try {
        const localPhotos = await database.getSurveyPhotosForLocalSurvey(Number(local.id));
        if (localPhotos.length > 0) {
          for (const p of localPhotos as any[]) {
            if (typeof p.server_id === 'number' && p.server_id > 0) {
              localServerIds.add(p.server_id);
            }
            photoItems.push(mapLocalPhotoToItem(Number(local.id), p));
          }
        }
      } catch (err) {
        console.error('Failed to load local photos:', err);
      }

      if (typeof local.server_id === 'number') {
        try {
          const photosData = await apiClient.get<any>('/surveys/photos/', { survey: local.server_id });
          const remotePhotos = Array.isArray(photosData?.results) ? photosData.results : [];
          for (const rp of remotePhotos) {
            if (typeof rp?.id === 'number' && localServerIds.has(rp.id)) continue;
            photoItems.push(rp);
          }
        } catch (err) {
          console.error('Failed to load server photos:', err);
        }
      }
      setPhotos(photoItems);
    } catch (err: any) {
      console.error('Failed to load survey:', err);
    } finally {
      setLoading(false);
    }
  };

  // Format a date/time value (ISO string or epoch ms) to localized id-ID datetime.
  const formatDateTime = (value?: string | number | null): string => {
    if (value === null || value === undefined || value === '') return '-';
    const d = typeof value === 'number' ? new Date(value) : new Date(String(value));
    if (Number.isNaN(d.getTime())) return '-';
    return d.toLocaleString('id-ID', {
      day: 'numeric', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'VERIFIED': return '#10b981';
      case 'SUBMITTED': return '#f59e0b';
      case 'REJECTED': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const chooseImage = async (): Promise<PendingUploadImage | null> => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Izin Diperlukan', 'Aplikasi memerlukan akses ke galeri foto untuk mengunggah gambar.');
      return null;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 0.8,
      base64: true,
    });

    if (result.canceled || !result.assets[0]) {
      return null;
    }

    return prepareImageForUpload(result.assets[0], 'survey_photo');
  };

  const pickImage = async () => {
    try {
      const preparedImage = await chooseImage();
      if (!preparedImage) return;
      setEditingPhoto(null);
      setPendingImage(preparedImage);
      setCaptionText('');
      setCaptionModalVisible(true);
    } catch (err: any) {
      console.error('[PhotoUpload] pickImage error:', err);
      Alert.alert('Gagal Memilih Foto', err?.message || String(err));
    }
  };

  const handleEditPhoto = (photo: SurveyPhoto) => {
    if (!photo.local_id) return;
    if (photo.synced) {
      Alert.alert('Tidak Bisa Diedit', 'Foto yang sudah tersinkron belum bisa diedit dari aplikasi mobile.');
      return;
    }

    setEditingPhoto(photo);
    setPendingImage({
      uri: photo.local_uri || photo.image_url,
      fileName: getPhotoDisplayName(photo.local_uri || photo.image_url),
      mimeType: null,
    });
    setCaptionText(photo.caption || '');
    setCaptionModalVisible(true);
  };

  const handleReplaceEditingImage = async () => {
    try {
      const preparedImage = await chooseImage();
      if (!preparedImage) return;
      setPendingImage(preparedImage);
    } catch (err: any) {
      console.error('[PhotoUpload] replace image error:', err);
      Alert.alert('Gagal Memilih Foto', err?.message || String(err));
    }
  };

  const handleUploadPhoto = async () => {
    if (editingPhoto?.local_id) {
      const nextUri = pendingImage?.uri || editingPhoto.local_uri || editingPhoto.image_url;
      if (!nextUri) {
        Alert.alert('Error', 'Gambar foto tidak tersedia');
        return;
      }

      setUploading(true);
      setCaptionModalVisible(false);

      try {
        await database.updatePhotoLocal(editingPhoto.local_id, {
          local_uri: nextUri,
          caption: captionText,
          synced: false,
        });
        await refreshLocalPhotos(localSurveyId!);

        Alert.alert('Berhasil', 'Foto berhasil diperbarui di perangkat.');
      } catch (uploadErr: any) {
        Alert.alert('Gagal', uploadErr?.message || 'Gagal memperbarui foto');
      } finally {
        setUploading(false);
        setPendingImage(null);
        setEditingPhoto(null);
      }
      return;
    }

    if (!pendingImage || !localSurveyId) {
      Alert.alert('Gagal', 'Foto belum bisa disimpan untuk survei ini.');
      return;
    }

    console.log('[PhotoUpload] Starting upload for survey:', surveyId);
    console.log('[PhotoUpload] Image URI:', pendingImage.uri);
    console.log('[PhotoUpload] Image fileName:', pendingImage.fileName);
    console.log('[PhotoUpload] Image mimeType:', pendingImage.mimeType);
    console.log('[PhotoUpload] Caption:', captionText);
    console.log('[PhotoUpload] API baseURL:', apiClient.getBaseURL());

    setUploading(true);
    setCaptionModalVisible(false);

    try {
      await database.saveSurveyPhotoLocal({
        survey_local_id: localSurveyId,
        survey_server_id: survey?.server_id ?? null,
        local_uri: pendingImage.uri,
        caption: captionText,
      });
      await refreshLocalPhotos(localSurveyId);
      Alert.alert('Berhasil', 'Foto disimpan lokal. Foto akan ikut tersinkron saat survei disinkronkan.');
    } catch (uploadErr: any) {
      console.error('[PhotoUpload] Upload error:', uploadErr);
      let errorMsg = 'Gagal mengunggah foto';
      if (uploadErr?.message) {
        errorMsg = uploadErr.message;
      }
      Alert.alert('Gagal Unggah', errorMsg, [{ text: 'OK' }]);
    } finally {
      setUploading(false);
      setPendingImage(null);
      setEditingPhoto(null);
    }
  };

  const handleDeleteSurvey = () => {
    Alert.alert(
      'Hapus Survei',
      'Apakah Anda yakin ingin menghapus survei ini? Survei yang dihapus tidak dapat dikembalikan.',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            try {
              if (survey?.server_id) {
                try {
                  await apiClient.delete(`/surveys/responses/${survey.server_id}/`);
                } catch (err) {
                  console.error('Failed to delete survey from server:', err);
                }
              }
              if (localSurveyId) await database.deleteSurvey(localSurveyId);
              Alert.alert('Berhasil', 'Survei berhasil dihapus');
              onBack();
            } catch (err) {
              console.error('Failed to delete survey:', err);
              Alert.alert('Error', 'Gagal menghapus survei');
            }
          },
        },
      ]
    );
  };

  const handleDeletePhoto = async (photo: SurveyPhoto) => {
    Alert.alert(
      'Hapus Foto',
      'Apakah Anda yakin ingin menghapus foto ini?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            try {
              // Delete from server if synced
              if (photo.synced && photo.id > 0) {
                try {
                  await apiClient.delete(`/surveys/photos/${photo.id}/`);
                } catch (err) {
                  console.error('Failed to delete from server:', err);
                }
              }
              // Delete from local DB
              if (photo.local_id) {
                await database.deletePhoto(photo.local_id);
              }
              // Update UI
              setPhotos(prev => prev.filter(p => p.id !== photo.id));
            } catch (err) {
              Alert.alert('Error', 'Gagal menghapus foto');
            }
          },
        },
      ]
    );
  };

  const formatAnswerValue = (ans: AnswerItem): string => {
    if (ans.selected_choice_labels && ans.selected_choice_labels.length > 0) {
      return ans.selected_choice_labels.join(', ');
    }
    if (ans.selected_choice_values && ans.selected_choice_values.length > 0) {
      return ans.selected_choice_values.join(', ');
    }
    if (ans.boolean_value !== null && ans.boolean_value !== undefined) {
      return ans.boolean_value ? 'Ya' : 'Tidak';
    }
    if (ans.number_value !== null && ans.number_value !== undefined) {
      return formatNumberDisplay(ans.number_value);
    }
    if (ans.date_value) return ans.date_value;
    if (ans.time_value) return ans.time_value;
    if (ans.coverage_level) return ans.coverage_level;
    if (ans.geographic_unit_display) return ans.geographic_unit_display;
    if (ans.geographic_unit_name) return ans.geographic_unit_name;
    if (ans.gps_latitude !== null && ans.gps_latitude !== undefined) {
      return `GPS: ${ans.gps_latitude.toFixed(6)}, ${ans.gps_longitude?.toFixed(6)}`;
    }
    if (ans.table_data) {
      if (typeof ans.table_data === 'object' && ans.table_data.koordinat) {
        const parts: string[] = [];
        if (ans.table_data.kecamatan_name) parts.push(`Kecamatan: ${ans.table_data.kecamatan_name}`);
        if (ans.table_data.desa) parts.push(`Desa: ${ans.table_data.desa}`);
        if (ans.table_data.koordinat?.latitude) parts.push(`GPS: ${ans.table_data.koordinat.latitude.toFixed(6)}, ${ans.table_data.koordinat.longitude.toFixed(6)}`);
        return parts.join('\n') || JSON.stringify(ans.table_data);
      }
      return JSON.stringify(ans.table_data, null, 2);
    }
    if (ans.text_value) return ans.text_value;
    return '-';
  };

  const handleSyncSurvey = async () => {
    if (!localSurveyId) return;
    setSyncing(true);
    try {
      const result = await syncQueue.processSurvey(localSurveyId);

      const lines: string[] = ['Survei berhasil dikirim ke server.'];
      if (result.uploadedPhotos > 0) {
        lines.push(`${result.uploadedPhotos} foto berhasil terunggah.`);
      }
      if (result.uploadedAnswerFiles > 0) {
        lines.push(`${result.uploadedAnswerFiles} lampiran jawaban terunggah.`);
      }

      const hasMediaFailure = result.failedPhotos > 0 || result.failedAnswerFiles > 0;
      if (hasMediaFailure) {
        if (result.failedPhotos > 0) {
          lines.push('');
          lines.push(`${result.failedPhotos} foto GAGAL diunggah:`);
          result.photoErrors.slice(0, 5).forEach((e) => lines.push(`• ${e}`));
          if (result.photoErrors.length > 5) {
            lines.push(`…dan ${result.photoErrors.length - 5} lainnya`);
          }
        }
        if (result.failedAnswerFiles > 0) {
          lines.push('');
          lines.push(`${result.failedAnswerFiles} lampiran GAGAL diunggah:`);
          result.answerFileErrors.slice(0, 5).forEach((e) => lines.push(`• ${e}`));
          if (result.answerFileErrors.length > 5) {
            lines.push(`…dan ${result.answerFileErrors.length - 5} lainnya`);
          }
        }
        lines.push('');
        lines.push('Foto/lampiran yang gagal akan dicoba ulang pada sinkronisasi berikutnya.');
        Alert.alert('Sinkronisasi Selesai Sebagian', lines.join('\n'), [{ text: 'OK' }]);
      } else {
        Alert.alert('Sinkronisasi Berhasil', lines.join(' '), [{ text: 'OK', onPress: onBack }]);
      }
    } catch (err: any) {
      Alert.alert('Sinkronisasi Gagal', err?.message || 'Gagal menyinkronkan survei ke server');
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: c.background }]}>
        <ActivityIndicator size="large" color={c.primary} />
        <Text style={[styles.loadingText, { color: c.textMuted }]}>Memuat survei...</Text>
      </View>
    );
  }

  if (!survey) {
    return (
      <View style={[styles.centered, { backgroundColor: c.background }]}>
        <Text style={[styles.errorText, { color: c.danger }]}>Survei tidak ditemukan</Text>
        <TouchableOpacity style={[styles.backButton, { backgroundColor: c.primary }]} onPress={onBack}>
          <Text style={styles.backButtonText}>Kembali</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <TopHeader />
      <View style={[styles.contentWrapper, { backgroundColor: c.background }]}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: c.surface }]}>
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={onBack} style={[styles.backIcon, { backgroundColor: c.background }]}>
              <MaterialIcons name="arrow-back" size={20} color={c.text} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: c.text }]}>Detail Survei</Text>
          </View>
          <View style={styles.headerActions}>
            {survey?.synced === 0 && localSurveyId ? (
              <TouchableOpacity onPress={() => onEdit(-localSurveyId)} style={[styles.compactActionButton, { backgroundColor: c.primary }]}>
                <Text style={styles.compactActionText}>Edit</Text>
              </TouchableOpacity>
            ) : null}
            {survey?.synced === 0 ? (
              <TouchableOpacity onPress={handleDeleteSurvey} style={[styles.compactActionButton, { backgroundColor: '#ef4444' }]}>
                <Text style={styles.compactActionText}>Hapus</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        <ScrollView style={[styles.content, { backgroundColor: c.background }]}>
          {/* Service Name */}
          <Text style={[styles.serviceName, { color: c.text }]}>{survey.service_name || 'Layanan'}</Text>

          {/* Info Cards */}
          <View style={[styles.infoCard, { backgroundColor: c.surface, borderColor: c.border }]}>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: c.textMuted }]}>ID Survei</Text>
              <Text style={[styles.infoValue, { color: c.text }]}>#{survey.id}</Text>
            </View>
            <View style={[styles.divider, { backgroundColor: c.border }]} />
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: c.textMuted }]}>Tanggal Survei</Text>
              <Text style={[styles.infoValue, { color: c.text }]}>
                {new Date(survey.survey_date).toLocaleDateString('id-ID', {
                  day: 'numeric', month: 'long', year: 'numeric',
                })}
              </Text>
            </View>
            <View style={[styles.divider, { backgroundColor: c.border }]} />
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: c.textMuted }]}>Waktu Mulai</Text>
              <Text style={[styles.infoValue, { color: c.text }]}>{formatDateTime(survey.started_at)}</Text>
            </View>
            <View style={[styles.divider, { backgroundColor: c.border }]} />
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: c.textMuted }]}>Waktu Selesai</Text>
              <Text style={[styles.infoValue, { color: c.text }]}>{formatDateTime(survey.submitted_at)}</Text>
            </View>
            <View style={[styles.divider, { backgroundColor: c.border }]} />
            <View style={[styles.infoRow, { alignItems: 'flex-start' }]}>
              <Text style={[styles.infoLabel, { color: c.textMuted }]}>Kode</Text>
              <View style={{ flex: 1, alignItems: 'flex-end' }}>
                {survey.klasifikasi_list && survey.klasifikasi_list.length > 0 ? (
                  survey.klasifikasi_list.map((entry, i) => (
                    <Text
                      key={`${entry}-${i}`}
                      style={[styles.infoValue, { color: c.text, textAlign: 'right' }]}
                    >
                      {entry}
                    </Text>
                  ))
                ) : (
                  <Text style={[styles.infoValue, { color: c.text }]}>-</Text>
                )}
              </View>
            </View>
            <View style={[styles.divider, { backgroundColor: c.border }]} />
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: c.textMuted }]}>Lokasi</Text>
              <Text style={[styles.infoValue, { color: c.text }]}>{survey.service_city || '-'}</Text>
            </View>
            <View style={[styles.divider, { backgroundColor: c.border }]} />
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: c.textMuted }]}>Surveyor</Text>
              <Text style={[styles.infoValue, { color: c.text }]} numberOfLines={1}>{survey.surveyor_name || '-'}</Text>
            </View>
            <View style={[styles.divider, { backgroundColor: c.border }]} />
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: c.textMuted }]}>Status</Text>
              <View style={[styles.statusBadge, { borderWidth: 1, borderColor: getStatusColor(survey.verification_status) }]}>
                <Text style={[styles.statusText, { color: getStatusColor(survey.verification_status) }]}>
                  {survey.status_display || survey.verification_status || 'Draft'}
                </Text>
              </View>
            </View>
            <View style={[styles.divider, { backgroundColor: c.border }]} />
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: c.textMuted }]}>Sinkronisasi</Text>
              <Text style={[styles.infoValue, { color: survey.synced === 1 ? '#10b981' : '#f59e0b' }]}>
                {survey.synced === 1 ? 'Tersinkron' : 'Belum tersinkron'}
              </Text>
            </View>
          </View>

          {/* Photos Section */}
          <View style={styles.photosSection}>
            <View style={styles.photosSectionHeader}>
              <Text style={[styles.sectionTitle, { color: c.textMuted }]}>Foto Fasilitas</Text>
              {uploading ? (
                <ActivityIndicator size="small" color={c.primary} />
              ) : (
                <TouchableOpacity style={[styles.addImageButton, { borderColor: c.primary }]} onPress={pickImage}>
                  <MaterialIcons name="add-a-photo" size={16} color={c.primary} />
                  <Text style={[styles.addImageText, { color: c.primary }]}>Tambah Foto</Text>
                </TouchableOpacity>
              )}
            </View>
            {photos.length > 0 ? (
              <>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photosScroll}>
                  <View style={styles.photosRow}>
                    {photos.map((photo) => (
                      <TouchableOpacity
                        key={photo.id}
                        style={styles.photoContainer}
                        onPress={() => handleEditPhoto(photo)}
                        onLongPress={() => handleDeletePhoto(photo)}
                      >
                        <Image
                          source={{ uri: photo.image_url }}
                          style={styles.photoImage}
                          resizeMode="cover"
                        />
                        {!photo.synced && (
                          <View style={styles.syncIndicator}>
                            <MaterialIcons name="cloud-off" size={12} color="#f59e0b" />
                          </View>
                        )}
                        {photo.caption ? (
                          <Text style={[styles.photoCaption, { color: c.textMuted }]} numberOfLines={2}>
                            {photo.caption}
                          </Text>
                        ) : null}
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
                <Text style={[styles.photoHint, { color: c.textPlaceholder }]}>Ketuk untuk edit, tekan lama untuk hapus</Text>
              </>
            ) : (
              <View style={styles.photoPlaceholderContainer}>
                <Image
                  source={PLACEHOLDER_IMAGE}
                  style={styles.photoPlaceholderImageLarge}
                  resizeMode="contain"
                />
                <TouchableOpacity
                  style={[styles.photoPlaceholderButton, { backgroundColor: c.primary }]}
                  onPress={pickImage}
                >
                  <MaterialIcons name="add-a-photo" size={18} color="#fff" />
                  <Text style={styles.photoPlaceholderButtonText}>Tambah Foto</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Answers */}
          {survey.answers && survey.answers.length > 0 && (
            <View style={styles.answersSection}>
              <Text style={[styles.sectionTitle, { color: c.textMuted }]}>Jawaban Survei</Text>
              <View style={[styles.infoCard, { backgroundColor: c.surface, borderColor: c.border }]}>
                {(() => {
                  const byTemplateOrder = (a: AnswerItem, b: AnswerItem) => {
                    const orderA = questionOrderByCode.get(a.question_code) ?? Number.MAX_SAFE_INTEGER;
                    const orderB = questionOrderByCode.get(b.question_code) ?? Number.MAX_SAFE_INTEGER;
                    if (orderA !== orderB) return orderA - orderB;
                    return a.question_code.localeCompare(b.question_code);
                  };

                  // Separate non-detail and detail answers
                  const nonDetail = survey.answers!
                    .filter(a => !isDetailQuestionCode(a.question_code))
                    .sort(byTemplateOrder);
                  const detailAnswers = survey.answers!
                    .filter(a => isDetailQuestionCode(a.question_code))
                    .sort(byTemplateOrder);

                  // Group detail answers by trigger code → ctx → items (preserving API order)
                  const detailByTrigger = new Map<string, Map<string, AnswerItem[]>>();
                  for (const ans of detailAnswers) {
                    const ctx = ans.context_key || '';
                    const triggerCode = cabangMtcToTrigger.get(ctx) || ans.question_code.replace(/\d+$/, '').slice(0, -1);
                    if (!detailByTrigger.has(triggerCode)) detailByTrigger.set(triggerCode, new Map());
                    const ctxMap = detailByTrigger.get(triggerCode)!;
                    if (!ctxMap.has(ctx)) ctxMap.set(ctx, []);
                    ctxMap.get(ctx)!.push(ans);
                  }

                  const nodes: React.ReactNode[] = [];
                  nonDetail.forEach((ans, index) => {
                    if (index > 0) nodes.push(<View key={`div-${index}`} style={[styles.divider, { backgroundColor: c.border }]} />);
                    nodes.push(
                      <View key={ans.question_code} style={styles.answerRow}>
                        <View style={styles.answerTextContainer}>
                          <Text style={[styles.answerCode, { color: c.primary }]}>{ans.question_code}</Text>
                          <Text style={[styles.answerQuestion, { color: c.text }]}>{ans.question_text}</Text>
                          <Text style={[styles.answerValue, { color: c.textMuted }]}>{formatAnswerValue(ans)}</Text>
                        </View>
                      </View>
                    );

                    // Inline detail blocks triggered by this question
                    const triggered = detailByTrigger.get(ans.question_code);
                    if (triggered) {
                      triggered.forEach((items, ctx) => {
                        const family = items[0]?.question_code.slice(0, -1) || '';
                        nodes.push(
                          <View key={`detail-hdr-${ans.question_code}-${ctx}`} style={styles.detailGroupHeader}>
                            <View style={[styles.detailGroupHeaderBar, { backgroundColor: c.primary }]} />
                            <View style={styles.detailGroupHeaderContent}>
                              <Text style={[styles.detailGroupHeaderTrigger, { color: c.textMuted }]}>
                                Detail untuk <Text style={{ fontWeight: '700', color: c.text }}>{ans.question_code}</Text>
                              </Text>
                              {ctx ? <Text style={[styles.detailGroupHeaderCtx, { color: c.primary }]}>{ctx}</Text> : null}
                            </View>
                          </View>
                        );
                        items.forEach((dAns, di) => {
                          if (di > 0) nodes.push(<View key={`ddiv-${ctx}-${di}`} style={[styles.divider, { backgroundColor: c.border, marginLeft: 12 }]} />);
                          nodes.push(
                            <View key={`${dAns.question_code}-${ctx}-${di}`} style={styles.detailAnswerRow}>
                              <View style={styles.answerTextContainer}>
                                <Text style={[styles.answerCode, { color: c.primary }]}>{dAns.question_code}</Text>
                                <Text style={[styles.answerQuestion, { color: c.text }]}>{dAns.question_text}</Text>
                                <Text style={[styles.answerValue, { color: c.textMuted }]}>{formatAnswerValue(dAns)}</Text>
                              </View>
                            </View>
                          );
                        });
                      });
                    }
                  });
                  return nodes;
                })()}
              </View>
              {survey?.synced === 0 ? (
                <View style={styles.syncSection}>
                  <TouchableOpacity
                    onPress={handleSyncSurvey}
                    style={[styles.syncButtonBottom, { backgroundColor: '#10b981' }, syncing && styles.syncButtonDisabled]}
                    disabled={syncing}
                  >
                    {syncing ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={styles.syncButtonBottomText}>Unggah ke Server</Text>
                    )}
                  </TouchableOpacity>
                </View>
              ) : null}
            </View>
          )}

          {/* Notes */}
          {survey.surveyor_notes ? (
            <View style={[styles.notesCard, { backgroundColor: c.surface, borderColor: c.border }]}>
              <Text style={[styles.notesTitle, { color: c.text }]}>Catatan</Text>
              <Text style={[styles.notesText, { color: c.textMuted }]}>{survey.surveyor_notes}</Text>
            </View>
          ) : null}

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>

      {/* Caption Modal */}
      <Modal
        visible={captionModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCaptionModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: c.surface }]}>
            <Text style={[styles.modalTitle, { color: c.text }]}>{editingPhoto ? 'Edit Foto' : 'Tambah Foto'}</Text>
            {pendingImage?.uri ? (
              <Image
                source={{ uri: pendingImage.uri }}
                style={styles.modalPreviewImage}
                resizeMode="cover"
              />
            ) : null}
            <TextInput
              style={[styles.captionInput, { borderColor: c.border, color: c.text }]}
              placeholder="Masukkan caption (opsional)"
              placeholderTextColor={c.textPlaceholder}
              value={captionText}
              onChangeText={setCaptionText}
              multiline
            />
            {editingPhoto ? (
              <TouchableOpacity
                style={[styles.replaceImageButton, { borderColor: c.primary }]}
                onPress={handleReplaceEditingImage}
              >
                <MaterialIcons name="photo-library" size={16} color={c.primary} />
                <Text style={[styles.replaceImageButtonText, { color: c.primary }]}>Ganti Gambar</Text>
              </TouchableOpacity>
            ) : null}
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { borderColor: c.border }]}
                onPress={() => {
                  setCaptionModalVisible(false);
                  setPendingImage(null);
                  setEditingPhoto(null);
                }}
              >
                <Text style={[styles.modalButtonText, { color: c.text }]}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: c.primary }]}
                onPress={handleUploadPhoto}
              >
                <Text style={[styles.modalButtonText, { color: '#fff' }]}>{editingPhoto ? 'Simpan' : 'Unggah'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  contentWrapper: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  loadingText: { marginTop: 12, fontSize: 12 },
  errorText: { fontSize: 13, marginBottom: 12 },
  backButton: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  backButtonText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  backIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '600' },
  compactActionButton: { minWidth: 72, height: 36, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  compactActionText: { fontSize: 13, fontWeight: '600', color: '#ffffff' },
  content: { flex: 1, paddingHorizontal: 20, paddingTop: 4 },
  statusBadge: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, marginTop: 12 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontWeight: '600' },
  serviceName: { fontSize: 20, fontWeight: '700', letterSpacing: -0.4, marginBottom: 16 },
  infoCard: { borderRadius: 6, padding: 16, marginBottom: 12, borderWidth: 1 },
  infoRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12 },
  infoLabel: { fontSize: 12 },
  infoValue: { fontSize: 13, fontWeight: '500' },
  divider: { height: 1 },
  answersSection: { marginBottom: 12 },
  sectionTitle: { fontSize: 14, fontWeight: '600', marginBottom: 4 },
  answerRow: { paddingVertical: 10 },
  answerTextContainer: { flex: 1 },
  detailAnswerRow: { paddingVertical: 10, paddingLeft: 12, borderLeftWidth: 2 },
  answerCode: { fontSize: 11, fontWeight: '700', marginBottom: 2 },
  answerQuestion: { fontSize: 13, fontWeight: '500', marginBottom: 2 },
  answerValue: { fontSize: 11 },
  detailGroupHeader: { flexDirection: 'row', alignItems: 'stretch', marginTop: 12, marginBottom: 4 },
  detailGroupHeaderBar: { width: 3, borderRadius: 2, marginRight: 10 },
  detailGroupHeaderContent: { flex: 1, justifyContent: 'center' },
  detailGroupHeaderTrigger: { fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.4 },
  detailGroupHeaderCtx: { fontSize: 13, fontWeight: '600', marginTop: 1 },
  notesCard: { borderRadius: 6, padding: 14, marginBottom: 12, borderWidth: 1 },
  notesTitle: { fontSize: 13, fontWeight: '600', marginBottom: 6 },
  notesText: { fontSize: 12, lineHeight: 18 },
  syncSection: { marginTop: 12, width: '100%' },
  syncButtonBottom: { width: '100%', height: 36, borderRadius: 8, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  syncButtonBottomText: { fontSize: 13, fontWeight: '600', color: '#ffffff' },
  syncButtonDisabled: { opacity: 0.6 },
  photosSection: { marginBottom: 12 },
  photosSectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  photosScroll: { marginHorizontal: -20, paddingHorizontal: 20 },
  photosRow: { flexDirection: 'row', gap: 12 },
  photoContainer: { width: 160 },
  photoImage: { width: 160, height: 120, borderRadius: 8, backgroundColor: '#f0f0f0' },
  photoCaption: { fontSize: 11, marginTop: 4 },
  photoHint: { fontSize: 11, marginTop: 4, marginHorizontal: 20 },
  syncIndicator: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 10,
    padding: 2,
  },
  photoPlaceholderContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 16,
  },
  photoPlaceholderImageLarge: {
    width: 200,
    height: 150,
    borderRadius: 12,
    backgroundColor: '#f5f6f7',
  },
  photoPlaceholderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
  },
  photoPlaceholderButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  addImageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 12,
    marginTop: 8,
    borderTopWidth: 1,
  },
  addImageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  addImageText: { fontSize: 12, fontWeight: '600' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 12,
    padding: 20,
  },
  modalTitle: { fontSize: 16, fontWeight: '600', marginBottom: 16 },
  modalPreviewImage: { width: '100%', height: 180, borderRadius: 10, backgroundColor: '#f3f4f6', marginBottom: 12 },
  captionInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  replaceImageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 10,
    marginBottom: 16,
  },
  replaceImageButtonText: { fontSize: 13, fontWeight: '600' },
  modalButtons: { flexDirection: 'row', gap: 12 },
  modalButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  modalButtonText: { fontSize: 14, fontWeight: '600' },
});
