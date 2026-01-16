import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Add01Icon } from 'hugeicons-react-native';
import TopHeader from '../components/TopHeader';
import { apiClient } from '../services/api';
import { database } from '../services/database';
import NetInfo from '@react-native-community/netinfo';

interface SurveyListItem {
  id: number;
  service_name: string;
  service_city: string;
  service_address?: string;
  survey_date: string;
  surveyor_name: string;
  verification_status: string;
  status_display: string;
  total_patients_served: number;
  occupancy_rate: number | null;
}

interface SurveyListScreenProps {
  onSelectSurvey: (surveyId: number) => void;
  onAddNew: () => void;
}

export default function SurveyListScreen({ onSelectSurvey, onAddNew }: SurveyListScreenProps) {
  const [surveys, setSurveys] = useState<SurveyListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchSurveys = async () => {
    try {
      // Load from local database first
      const localSurveys = await database.getSurveys();
      setSurveys(localSurveys);

      // Check if online
      const netInfo = await NetInfo.fetch();
      const isOnline = netInfo.isConnected ?? false;

      if (isOnline) {
        // Fetch from server and update local database
        try {
          const params: Record<string, any> = {
            ordering: '-survey_date',
            page_size: 50,
          };

          const data = await apiClient.get<{ results: SurveyListItem[]; count: number }>(
            '/surveys/surveys/',
            params
          );

          // Clear and refresh database with server data
          if (data.results.length > 0) {
            // Clear existing synced surveys
            await database.clearAll();

            // Save all surveys from server
            for (const survey of data.results) {
              await database.saveSurvey({
                server_id: survey.id,
                service_id: survey.service || survey.service_id,
                service_name: survey.service_name || '',
                service_city: survey.service_city || '',
                service_address: survey.service_address || '',
                survey_date: survey.survey_date || '',
                survey_period_start: survey.survey_period_start || '',
                survey_period_end: survey.survey_period_end || '',
                latitude: survey.latitude || null,
                longitude: survey.longitude || null,
                location_accuracy: survey.location_accuracy || null,
                current_bed_capacity: survey.current_bed_capacity || 0,
                beds_occupied: survey.beds_occupied || 0,
                current_psychiatrist_count: survey.current_psychiatrist_count || 0,
                current_psychologist_count: survey.current_psychologist_count || 0,
                current_nurse_count: survey.current_nurse_count || 0,
                current_social_worker_count: survey.current_social_worker_count || 0,
                total_patients_served: survey.total_patients_served || 0,
                new_patients: survey.new_patients || 0,
                returning_patients: survey.returning_patients || 0,
                patients_male: survey.patients_male || 0,
                patients_female: survey.patients_female || 0,
                patients_age_0_17: survey.patients_age_0_17 || 0,
                patients_age_18_64: survey.patients_age_18_64 || 0,
                patients_age_65_plus: survey.patients_age_65_plus || 0,
                bpjs_patients: survey.bpjs_patients || 0,
                private_insurance_patients: survey.private_insurance_patients || 0,
                self_pay_patients: survey.self_pay_patients || 0,
                monthly_budget: survey.monthly_budget || '',
                patient_satisfaction_score: survey.patient_satisfaction_score || null,
                average_wait_time_days: survey.average_wait_time_days || null,
                surveyor_notes: survey.surveyor_notes || '',
                challenges_faced: survey.challenges_faced || '',
                improvements_needed: survey.improvements_needed || '',
                additional_notes: survey.additional_notes || '',
                verification_status: survey.verification_status || 'DRAFT',
                status_display: survey.status_display || 'Draft',
                surveyor_name: survey.surveyor_name || '',
              }, false);
            }
          }

          // Reload from database
          const updatedSurveys = await database.getSurveys();
          setSurveys(updatedSurveys);
        } catch (err: any) {
          console.error('Failed to sync surveys from server:', err);
          // Keep local data
        }
      }
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
        <Text style={styles.loadingText}>Loading surveys...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TopHeader />
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Survey Records</Text>
        </View>

      {/* Add New Button */}
      <TouchableOpacity style={styles.addButton} onPress={onAddNew}>
        <Add01Icon size={20} color="#fff" strokeWidth={2} />
        <Text style={styles.addButtonText}>Add New Survey</Text>
      </TouchableOpacity>

      <ScrollView
        style={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#07579e']} />
        }
      >
        {surveys.length > 0 ? (
          surveys.map((survey) => (
            <TouchableOpacity
              key={survey.id}
              style={styles.surveyCard}
              onPress={() => onSelectSurvey(survey.id)}
            >
              <View style={styles.surveyImage}>
                <Text style={styles.surveyInitials}>
                  {survey.service_name.substring(0, 2).toUpperCase()}
                </Text>
              </View>
              <View style={styles.surveyContent}>
                <View style={styles.surveyHeader}>
                  <Text style={styles.serviceName} numberOfLines={1}>{survey.service_name}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(survey.verification_status) + '20' }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(survey.verification_status) }]}>
                      {survey.status_display}
                    </Text>
                  </View>
                </View>

                <View style={styles.surveyDetails}>
                  <Text style={styles.detailText} numberOfLines={2}>
                    {survey.service_address || survey.service_city}
                  </Text>
                  <Text style={styles.detailText}>
                    Date: {new Date(survey.survey_date).toLocaleDateString('id-ID')}
                  </Text>
                  <Text style={styles.detailText}>
                    Patients: {survey.total_patients_served}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No surveys found</Text>
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
  content: {
    flex: 1,
    backgroundColor: '#f5f6f7',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6b7280',
  },
  header: {
    padding: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#374151',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#07579e',
    marginHorizontal: 20,
    marginBottom: 16,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  list: {
    flex: 1,
  },
  surveyCard: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 12,
    gap: 12,
    minHeight: 100,
  },
  surveyImage: {
    width: 80,
    alignSelf: 'stretch',
    borderRadius: 8,
    backgroundColor: '#07579e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  surveyInitials: {
    fontSize: 24,
    fontWeight: '600',
    color: '#ffffff',
  },
  surveyContent: {
    flex: 1,
  },
  surveyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  serviceName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  surveyDetails: {
    gap: 6,
  },
  detailText: {
    fontSize: 14,
    color: '#6b7280',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#9ca3af',
  },
});
