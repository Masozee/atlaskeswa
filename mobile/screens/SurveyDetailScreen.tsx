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
import type { SurveyResponseItem } from '../lib/types';
import PLACEHOLDER_IMAGE from '../assets/OMMHA.png';

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
}

interface SurveyDetailScreenProps {
  surveyId: number;
  onBack: () => void;
  onEdit: (surveyId: number) => void;
}

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
  const [captionModalVisible, setCaptionModalVisible] = useState(false);
  const [captionText, setCaptionText] = useState('');
  const [pendingImage, setPendingImage] = useState<PendingUploadImage | null>(null);
  // Maps cabang_mtc value → question code that triggered it (e.g. "Pemantauan Intensitas Tinggi" → "RQ3")
  const [cabangMtcToTrigger, setCabangMtcToTrigger] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    fetchSurveyDetail();
  }, [surveyId]);

  const fetchSurveyDetail = async () => {
    try {
      const data = await apiClient.get<any>(`/surveys/responses/${surveyId}/`);
      // Normalize nested objects to flat fields for display
      const normalized: SurveyDetail = {
        ...data,
        service_name: typeof data.service === 'object' ? data.service?.name : data.service_name,
        service_city: typeof data.service === 'object' ? data.service?.city : data.service_city,
        template_name: typeof data.template === 'object' ? data.template?.name : data.template_name,
      };
      setSurvey(normalized);

      // Load cached template to build context_key → trigger question map
      // context_key stores the raw choice VALUE (e.g. "R2", "R13"), NOT cabang_mtc (which is human-readable)
      // We need to map these back to the question that triggered the detail block
      try {
        const tplId = typeof data.template === 'object' ? data.template?.id : data.template;
        const tpl = tplId ? await database.getTemplate(tplId) : await database.getLatestTemplate();
        if (tpl) {
          const map = new Map<string, string>();
          (tpl.sections || []).forEach((section: any) => {
            (section.questions || []).forEach((q: any) => {
              // Skip detail questions (ending in letter A-Z)
              if (/[A-Z]$/.test(q.code)) return;
              (q.choices || []).forEach((c: any) => {
                // Only map choices that lead to detail questions (next_question_code ends in letter)
                if (c.next_question_code && /[A-Z]$/.test(c.next_question_code)) {
                  // Use choice VALUE as key (context_key stores the value, not cabang_mtc)
                  if (c.value) map.set(c.value, q.code);
                }
              });
            });
          });
          setCabangMtcToTrigger(map);
        }
      } catch {
        // Template not cached yet — fall back to family label
      }

      // Fetch photos
      try {
        const photosData = await apiClient.get<any>('/surveys/photos/', { survey: surveyId });
        setPhotos(photosData.results || []);
      } catch (err) {
        console.error('Failed to load photos:', err);
      }

      // Also load local photos for this survey
      try {
        const localPhotos = await database.getSurveyPhotosForServerSurvey(surveyId);
        if (localPhotos.length > 0) {
          const localPhotoItems: SurveyPhoto[] = localPhotos.map((p: any) => ({
            id: p.server_id || p.id,
            survey: surveyId,
            image_url: p.server_image_url || p.local_uri,
            caption: p.caption || '',
            uploaded_by_name: null,
            uploaded_at: new Date(p.created_at).toISOString(),
            local_uri: p.local_uri,
            local_id: p.id,
            synced: p.synced === 1,
          }));
          setPhotos(prev => [...localPhotoItems, ...prev]);
        }
      } catch (err) {
        console.error('Failed to load local photos:', err);
      }
    } catch (err: any) {
      console.error('Failed to load survey:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'VERIFIED': return '#10b981';
      case 'SUBMITTED': return '#f59e0b';
      case 'REJECTED': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Izin Diperlukan', 'Aplikasi memerlukan akses ke galeri foto untuk mengunggah gambar.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setPendingImage({
        uri: result.assets[0].uri,
        fileName: result.assets[0].fileName,
        mimeType: result.assets[0].mimeType,
      });
      setCaptionText('');
      setCaptionModalVisible(true);
    }
  };

  const handleUploadPhoto = async () => {
    if (!pendingImage) {
      console.error('[PhotoUpload] No pending image to upload');
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
      const serverPhoto = await apiClient.uploadSurveyPhoto(surveyId, pendingImage, captionText);
      console.log('[PhotoUpload] Upload success:', serverPhoto);

      const newPhoto: SurveyPhoto = {
        id: serverPhoto.id,
        survey: surveyId,
        image_url: serverPhoto.image_url || serverPhoto.image,
        caption: captionText,
        uploaded_by_name: null,
        uploaded_at: new Date().toISOString(),
        synced: true,
      };
      setPhotos(prev => [newPhoto, ...prev]);
      Alert.alert('Berhasil', 'Foto berhasil diunggah');
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
              // Delete from server if not local-only draft
              if (!survey?.is_local) {
                await apiClient.delete(`/surveys/responses/${surveyId}/`);
              } else {
                // Delete from local database for local drafts
                await database.deleteSurvey(surveyId);
              }
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
          <TouchableOpacity onPress={() => onEdit(surveyId)} style={[styles.editButton, { backgroundColor: c.primary }]}>
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
          {(survey?.verification_status === 'DRAFT' || survey?.verification_status === 'draft' || survey?.is_local) && (
            <TouchableOpacity onPress={handleDeleteSurvey} style={[styles.deleteButton, { backgroundColor: '#ef4444' }]}>
              <MaterialIcons name="delete" size={18} color="#fff" />
            </TouchableOpacity>
          )}
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
                <Text style={[styles.photoHint, { color: c.textPlaceholder }]}>Tekan lama untuk hapus</Text>
              </>
            ) : (
              <View style={styles.photoPlaceholderContainer}>
                <Image
                  source={PLACEHOLDER_IMAGE}
                  style={styles.photoPlaceholderImageLarge}
                  resizeMode="contain"
                />
              </View>
            )}
          </View>

          {/* Answers */}
          {survey.answers && survey.answers.length > 0 && (
            <View style={styles.answersSection}>
              <Text style={[styles.sectionTitle, { color: c.textMuted }]}>Jawaban Survei</Text>
              <View style={[styles.infoCard, { backgroundColor: c.surface, borderColor: c.border }]}>
                {(() => {
                  // Separate non-detail and detail answers
                  const nonDetail = survey.answers!.filter(a => !/[A-Z]$/.test(a.question_code));
                  const detailAnswers = survey.answers!.filter(a => /[A-Z]$/.test(a.question_code));

                  // Group detail answers by trigger code → ctx → items (preserving API order)
                  const detailByTrigger = new Map<string, Map<string, AnswerItem[]>>();
                  for (const ans of detailAnswers) {
                    const ctx = ans.context_key || '';
                    const triggerCode = cabangMtcToTrigger.get(ctx) || ans.question_code.slice(0, -1);
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
            <Text style={[styles.modalTitle, { color: c.text }]}>Tambah Caption</Text>
            <TextInput
              style={[styles.captionInput, { borderColor: c.border, color: c.text }]}
              placeholder="Masukkan caption (opsional)"
              placeholderTextColor={c.textPlaceholder}
              value={captionText}
              onChangeText={setCaptionText}
              multiline
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { borderColor: c.border }]}
                onPress={() => {
                  setCaptionModalVisible(false);
                  setPendingImage(null);
                }}
              >
                <Text style={[styles.modalButtonText, { color: c.text }]}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: c.primary }]}
                onPress={handleUploadPhoto}
              >
                <Text style={[styles.modalButtonText, { color: '#fff' }]}>Unggah</Text>
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
  backIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '600' },
  editButton: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10, gap: 6 },
  editButtonText: { fontSize: 13, fontWeight: '600', color: '#ffffff' },
  deleteButton: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
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
  captionInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
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
