import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { ArrowLeft01Icon, Edit02Icon } from 'hugeicons-react-native';
import TopHeader from '../components/TopHeader';
import { apiClient } from '../services/api';
import type { SurveyResponseItem } from '../lib/types';

interface AnswerItem {
  question_code: string;
  question_text: string;
  text_value?: string;
  number_value?: number;
  date_value?: string;
  time_value?: string;
  boolean_value?: boolean;
  selected_choice_values?: string[];
  geographic_unit_name?: string;
  coverage_level?: string;
  table_data?: any;
  gps_latitude?: number;
  gps_longitude?: number;
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

export default function SurveyDetailScreen({ surveyId, onBack, onEdit }: SurveyDetailScreenProps) {
  const [survey, setSurvey] = useState<SurveyDetail | null>(null);
  const [loading, setLoading] = useState(true);

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

  const formatAnswerValue = (ans: AnswerItem): string => {
    if (ans.selected_choice_values && ans.selected_choice_values.length > 0) {
      return ans.selected_choice_values.join(', ');
    }
    if (ans.boolean_value !== null && ans.boolean_value !== undefined) {
      return ans.boolean_value ? 'Ya' : 'Tidak';
    }
    if (ans.number_value !== null && ans.number_value !== undefined) {
      return String(ans.number_value);
    }
    if (ans.date_value) return ans.date_value;
    if (ans.time_value) return ans.time_value;
    if (ans.coverage_level) return ans.coverage_level;
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
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#07579e" />
        <Text style={styles.loadingText}>Memuat survei...</Text>
      </View>
    );
  }

  if (!survey) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Survei tidak ditemukan</Text>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>Kembali</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TopHeader />
      <View style={styles.contentWrapper}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={onBack} style={styles.backIcon}>
              <ArrowLeft01Icon size={20} color="#1a1a1a" strokeWidth={2} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Detail Survei</Text>
          </View>
          <TouchableOpacity onPress={() => onEdit(surveyId)} style={styles.editButton}>
            <Edit02Icon size={16} color="#ffffff" strokeWidth={2} />
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          {/* Status Badge */}
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(survey.verification_status) + '20' }]}>
            <View style={[styles.statusDot, { backgroundColor: getStatusColor(survey.verification_status) }]} />
            <Text style={[styles.statusText, { color: getStatusColor(survey.verification_status) }]}>
              {survey.status_display || survey.verification_status || 'Draft'}
            </Text>
          </View>

          {/* Service Name */}
          <Text style={styles.serviceName}>{survey.service_name || 'Layanan'}</Text>

          {/* Info Cards */}
          <View style={styles.infoCard}>
            {survey.template_name && (
              <>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Template</Text>
                  <Text style={styles.infoValue}>{survey.template_name}</Text>
                </View>
                <View style={styles.divider} />
              </>
            )}
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Tanggal Survei</Text>
              <Text style={styles.infoValue}>
                {new Date(survey.survey_date).toLocaleDateString('id-ID', {
                  day: 'numeric', month: 'long', year: 'numeric',
                })}
              </Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Lokasi</Text>
              <Text style={styles.infoValue}>{survey.service_city || '-'}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Surveyor</Text>
              <Text style={styles.infoValue} numberOfLines={1}>{survey.surveyor_name || '-'}</Text>
            </View>
          </View>

          {/* Answers */}
          {survey.answers && survey.answers.length > 0 && (
            <View style={styles.answersSection}>
              <Text style={styles.sectionTitle}>Jawaban Survei</Text>
              <View style={styles.infoCard}>
                {survey.answers.map((ans, index) => (
                  <React.Fragment key={ans.question_code || index}>
                    {index > 0 && <View style={styles.divider} />}
                    <View style={styles.answerRow}>
                      <Text style={styles.answerCode}>{ans.question_code}</Text>
                      <Text style={styles.answerQuestion}>{ans.question_text}</Text>
                      <Text style={styles.answerValue}>{formatAnswerValue(ans)}</Text>
                    </View>
                  </React.Fragment>
                ))}
              </View>
            </View>
          )}

          {/* Notes */}
          {survey.surveyor_notes ? (
            <View style={styles.notesCard}>
              <Text style={styles.notesTitle}>Catatan</Text>
              <Text style={styles.notesText}>{survey.surveyor_notes}</Text>
            </View>
          ) : null}

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f6f7' },
  contentWrapper: { flex: 1, backgroundColor: '#f5f6f7' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  loadingText: { marginTop: 12, fontSize: 12, color: '#6b7280' },
  errorText: { fontSize: 13, color: '#dc2626', marginBottom: 12 },
  backButton: { backgroundColor: '#07579e', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  backButtonText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backIcon: { width: 36, height: 36, backgroundColor: '#ffffff', borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '600', color: '#1a1a1a' },
  editButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#07579e', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10, gap: 6 },
  editButtonText: { fontSize: 13, fontWeight: '600', color: '#ffffff' },
  content: { flex: 1, paddingHorizontal: 20, paddingTop: 4 },
  statusBadge: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, marginBottom: 8 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontWeight: '600' },
  serviceName: { fontSize: 20, fontWeight: '700', color: '#1a1a1a', letterSpacing: -0.4, marginBottom: 16 },
  infoCard: { backgroundColor: '#ffffff', borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb', padding: 16, marginBottom: 12 },
  infoRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12 },
  infoLabel: { fontSize: 12, color: '#9ca3af' },
  infoValue: { fontSize: 13, fontWeight: '500', color: '#1a1a1a' },
  divider: { height: 1, backgroundColor: '#f3f4f6' },
  answersSection: { marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1a1a1a', marginBottom: 4 },
  answerRow: { paddingVertical: 10 },
  answerCode: { fontSize: 10, fontWeight: '700', color: '#07579e', marginBottom: 2, letterSpacing: 0.5 },
  answerQuestion: { fontSize: 12, color: '#6b7280', marginBottom: 4 },
  answerValue: { fontSize: 13, fontWeight: '600', color: '#1a1a1a' },
  notesCard: { backgroundColor: '#ffffff', borderRadius: 12, padding: 14, marginBottom: 12 },
  notesTitle: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 },
  notesText: { fontSize: 12, color: '#6b7280', lineHeight: 18 },
});
