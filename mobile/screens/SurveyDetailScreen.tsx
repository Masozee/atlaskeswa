import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { ArrowLeft01Icon, Edit02Icon, Delete02Icon } from 'hugeicons-react-native';
import TopHeader from '../components/TopHeader';
import { apiClient } from '../services/api';

interface Survey {
  id: number;
  service_name: string;
  service_city: string;
  survey_date: string;
  surveyor_name: string;
  verification_status: string;
  status_display: string;
  total_patients_served: number;
  occupancy_rate: number | null;
  notes?: string;
}

interface SurveyDetailScreenProps {
  surveyId: number;
  onBack: () => void;
  onEdit: (surveyId: number) => void;
}

export default function SurveyDetailScreen({ surveyId, onBack, onEdit }: SurveyDetailScreenProps) {
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSurveyDetail();
  }, [surveyId]);

  const fetchSurveyDetail = async () => {
    try {
      const data = await apiClient.get<Survey>(`/surveys/surveys/${surveyId}/`);
      setSurvey(data);
    } catch (err: any) {
      console.error('Failed to load survey:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'VERIFIED':
        return '#10b981';
      case 'SUBMITTED':
        return '#f59e0b';
      case 'REJECTED':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#07579e" />
        <Text style={styles.loadingText}>Loading survey...</Text>
      </View>
    );
  }

  if (!survey) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Survey not found</Text>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>Go Back</Text>
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
          <TouchableOpacity onPress={onBack} style={styles.backIcon}>
            <ArrowLeft01Icon size={24} color="#111827" strokeWidth={2} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Survey Detail</Text>
          <TouchableOpacity onPress={() => onEdit(surveyId)} style={styles.editIcon}>
            <Edit02Icon size={22} color="#07579e" strokeWidth={2} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
        {/* Status Badge */}
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(survey.verification_status) + '20' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(survey.verification_status) }]}>
            {survey.status_display}
          </Text>
        </View>

        {/* Service Name */}
        <Text style={styles.serviceName}>{survey.service_name}</Text>

        {/* Info Cards */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Survey Date</Text>
            <Text style={styles.infoValue}>
              {new Date(survey.survey_date).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Location</Text>
            <Text style={styles.infoValue}>{survey.service_city}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Surveyor</Text>
            <Text style={styles.infoValue}>{survey.surveyor_name}</Text>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{survey.total_patients_served}</Text>
            <Text style={styles.statLabel}>Total Patients</Text>
          </View>
          {survey.occupancy_rate !== null && (
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{survey.occupancy_rate.toFixed(1)}%</Text>
              <Text style={styles.statLabel}>Occupancy Rate</Text>
            </View>
          )}
        </View>

        {/* Notes */}
        {survey.notes && (
          <View style={styles.notesCard}>
            <Text style={styles.notesTitle}>Notes</Text>
            <Text style={styles.notesText}>{survey.notes}</Text>
          </View>
        )}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f6f7',
  },
  contentWrapper: {
    flex: 1,
    backgroundColor: '#f5f6f7',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6b7280',
  },
  errorText: {
    fontSize: 16,
    color: '#dc2626',
    marginBottom: 16,
  },
  backButton: {
    backgroundColor: '#07579e',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingBottom: 16,
    backgroundColor: '#ffffff',
  },
  backIcon: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
  },
  editIcon: {
    padding: 4,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 16,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  serviceName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 20,
  },
  infoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  infoRow: {
    paddingVertical: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  divider: {
    height: 1,
    backgroundColor: '#e5e7eb',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  notesCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
  },
  notesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  notesText: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
});
