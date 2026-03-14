import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import TopHeader from '../components/TopHeader';
import { apiClient } from '../services/api';
import type { SurveyResponseItem, PaginatedResponse } from '../lib/types';

interface SurveyListScreenProps {
  onSelectSurvey: (surveyId: number) => void;
  onAddNew: () => void;
}

export default function SurveyListScreen({ onSelectSurvey, onAddNew }: SurveyListScreenProps) {
  const [surveys, setSurveys] = useState<SurveyResponseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchSurveys = async () => {
    try {
      const data = await apiClient.get<PaginatedResponse<SurveyResponseItem>>(
        '/surveys/responses/',
        { ordering: '-survey_date', page_size: 50 }
      );
      setSurveys(data.results);
    } catch (err: any) {
      console.error('Failed to load surveys:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSurveys();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchSurveys();
  };

  const handleRequestDeletion = (surveyId: number) => {
    Alert.alert(
      'Ajukan Penghapusan',
      'Permintaan hapus akan dikirim ke verifikator untuk disetujui.',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Ajukan',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiClient.post(`/surveys/responses/${surveyId}/request-deletion/`, { reason: '' });
              setSurveys((prev) =>
                prev.map((s) => s.id === surveyId ? { ...s, deletion_requested: true } : s)
              );
              Alert.alert('Berhasil', 'Permintaan hapus telah dikirim ke verifikator');
            } catch (err: any) {
              Alert.alert('Error', err?.message || 'Gagal mengajukan penghapusan');
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'VERIFIED':
      case 'APPROVED':
        return '#10b981';
      case 'SUBMITTED':
      case 'PENDING':
        return '#f59e0b';
      case 'REJECTED':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const getStatusLabel = (status?: string) => {
    switch (status) {
      case 'APPROVED':
      case 'VERIFIED':
        return 'Diverifikasi';
      case 'SUBMITTED':
      case 'PENDING':
        return 'Menunggu';
      case 'REJECTED':
        return 'Ditolak';
      default:
        return 'Draft';
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#03979D" />
        <Text style={styles.loadingText}>Memuat survei...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TopHeader />
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Catatan Survei</Text>
          <Text style={styles.subtitle}>Kelola semua data survei Anda</Text>
        </View>

        <TouchableOpacity style={styles.addButton} onPress={onAddNew}>
          <MaterialIcons name="add" size={18} color="#fff" />
          <Text style={styles.addButtonText}>Survei Baru</Text>
        </TouchableOpacity>

        <ScrollView
          style={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#03979D']} />
          }
        >
          {surveys.length > 0 ? (
            surveys.map((survey) => (
              <TouchableOpacity
                key={survey.id}
                style={styles.surveyCard}
                onPress={() => onSelectSurvey(survey.id)}
                activeOpacity={0.7}
              >
                <View style={styles.surveyHeader}>
                  <View style={styles.surveyHeaderLeft}>
                    <View style={styles.surveyImage}>
                      <Text style={styles.surveyInitials}>
                        {(survey.service_name || 'SV').substring(0, 2).toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.surveyHeaderInfo}>
                      <Text style={styles.serviceName} numberOfLines={1}>
                        {survey.service_name || 'Layanan'}
                      </Text>
                      {survey.template_name ? (
                        <Text style={styles.templateName} numberOfLines={1}>
                          {survey.template_name}
                        </Text>
                      ) : null}
                    </View>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: getStatusColor(survey.verification_status) + '15', borderColor: getStatusColor(survey.verification_status) + '40' },
                    ]}
                  >
                    <View style={[styles.statusDot, { backgroundColor: getStatusColor(survey.verification_status) }]} />
                    <Text
                      style={[
                        styles.statusText,
                        { color: getStatusColor(survey.verification_status) },
                      ]}
                    >
                      {getStatusLabel(survey.verification_status)}
                    </Text>
                  </View>
                </View>

                <View style={styles.surveyMeta}>
                  <View style={styles.metaItem}>
                    <MaterialIcons name="event" size={13} color="#6b7280" />
                    <Text style={styles.metaText}>
                      {new Date(survey.survey_date).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </Text>
                  </View>
                  {survey.service_city ? (
                    <View style={styles.metaItem}>
                      <MaterialIcons name="place" size={13} color="#6b7280" />
                      <Text style={styles.metaText}>{survey.service_city}</Text>
                    </View>
                  ) : null}
                  {survey.surveyor_name ? (
                    <View style={styles.metaItem}>
                      <MaterialIcons name="person" size={13} color="#6b7280" />
                      <Text style={styles.metaText}>{survey.surveyor_name}</Text>
                    </View>
                  ) : null}
                </View>

                {survey.survey_period_start && survey.survey_period_end ? (
                  <View style={styles.periodRow}>
                    <MaterialIcons name="notes" size={13} color="#6b7280" />
                    <Text style={styles.metaText}>
                      Periode: {new Date(survey.survey_period_start).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                      {' - '}
                      {new Date(survey.survey_period_end).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </Text>
                  </View>
                ) : null}

                <View style={styles.cardActions}>
                  <TouchableOpacity
                    style={styles.actionButtonEdit}
                    onPress={(e) => { e.stopPropagation(); onSelectSurvey(survey.id); }}
                  >
                    <MaterialIcons name="edit" size={14} color="#03979D" />
                    <Text style={styles.actionButtonEditText}>Edit</Text>
                  </TouchableOpacity>
                  {survey.deletion_requested ? (
                    <View style={styles.actionButtonPending}>
                      <Text style={styles.actionButtonPendingText}>Menunggu Persetujuan</Text>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={styles.actionButtonDelete}
                      onPress={(e) => { e.stopPropagation(); handleRequestDeletion(survey.id); }}
                    >
                      <MaterialIcons name="delete" size={14} color="#ef4444" />
                      <Text style={styles.actionButtonDeleteText}>Hapus</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>Belum ada survei</Text>
              <Text style={styles.emptySubtext}>Tekan "Survei Baru" untuk memulai</Text>
            </View>
          )}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f6f7' },
  content: { flex: 1, backgroundColor: '#f5f6f7' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: 12, color: '#6b7280' },
  header: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 0 },
  title: { fontSize: 22, fontWeight: '700', color: '#1a1a1a', letterSpacing: -0.4 },
  subtitle: { fontSize: 13, color: '#6b7280', marginTop: 2 },

  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#03979D',
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 16,
    paddingVertical: 13,
    borderRadius: 12,
    gap: 8,
  },
  addButtonText: { color: '#fff', fontSize: 14, fontWeight: '600' },

  list: { flex: 1 },

  surveyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 14,
    marginHorizontal: 20,
    marginBottom: 10,
    gap: 12,
  },
  surveyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  surveyHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
    marginRight: 8,
  },
  surveyImage: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#03979D',
    justifyContent: 'center',
    alignItems: 'center',
  },
  surveyInitials: { fontSize: 14, fontWeight: '700', color: '#ffffff' },
  surveyHeaderInfo: { flex: 1 },
  serviceName: { fontSize: 13, fontWeight: '600', color: '#1A1A1A' },
  templateName: { fontSize: 11, color: '#6b7280', marginTop: 1 },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    gap: 4,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 10, fontWeight: '600' },
  surveyMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: { fontSize: 11, color: '#6b7280' },
  periodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 8,
  },

  // Card actions
  cardActions: {
    flexDirection: 'row',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 10,
  },
  actionButtonEdit: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,151,157,0.2)',
    backgroundColor: 'rgba(0,151,157,0.08)',
  },
  actionButtonEditText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#03979D',
  },
  actionButtonDelete: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.2)',
    backgroundColor: 'rgba(239,68,68,0.06)',
  },
  actionButtonDeleteText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#ef4444',
  },
  actionButtonPending: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.2)',
    backgroundColor: 'rgba(245,158,11,0.06)',
  },
  actionButtonPendingText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#f59e0b',
  },

  emptyState: { padding: 40, alignItems: 'center' },
  emptyText: { fontSize: 14, color: '#6b7280', fontWeight: '600' },
  emptySubtext: { fontSize: 12, color: '#9ca3af', marginTop: 4 },
});
