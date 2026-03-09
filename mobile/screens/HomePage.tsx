import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { ArrowRight01Icon, Task01Icon } from 'hugeicons-react-native';
import TopHeader from '../components/TopHeader';
import { apiClient } from '../services/api';

interface Survey {
  id: number;
  service_name: string;
  template_name?: string;
  verification_status: 'PENDING' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'NEEDS_REVISION';
  status_display?: string;
  survey_date: string;
  created_at: string;
}

interface DashboardStats {
  surveys: {
    total: number;
    pending: number;
  };
  recent_surveys: Survey[];
}

interface User {
  id: string;
  email: string;
  full_name?: string;
}

interface HomePageProps {
  onNavigateToSurveys: () => void;
  onSelectSurvey: (surveyId: number) => void;
}

export default function HomePage({ onNavigateToSurveys, onSelectSurvey }: HomePageProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchData = async () => {
    try {
      setError('');
      const [dashboardData, userData] = await Promise.all([
        apiClient.get<DashboardStats>('/analytics/dashboard/'),
        apiClient.get<User>('/accounts/users/me/')
      ]);
      setStats(dashboardData);
      setUser(userData);
    } catch (err: any) {
      setError(err?.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const getFirstName = () => {
    if (user?.full_name) {
      return user.full_name.split(' ')[0];
    }
    return user?.email.split('@')[0] || 'User';
  };

  const getFullName = () => {
    if (user?.full_name) return user.full_name;
    return user?.email.split('@')[0] || 'User';
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'APPROVED':
      case 'VERIFIED':
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
        <ActivityIndicator size="large" color="#00979D" />
        <Text style={styles.loadingText}>Memuat dashboard...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TopHeader />
      <ScrollView
        style={styles.scrollContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#00979D']} />
        }
      >
        {/* Hero Card */}
        <View style={styles.heroCard}>
          <Text style={styles.heroSubgreeting}>Selamat pagi,</Text>
          <Text style={styles.heroGreeting}>{getFullName()}</Text>
          <View style={styles.heroCountRow}>
            <Task01Icon size={18} color="rgba(255,255,255,0.9)" strokeWidth={1.5} />
            <Text style={styles.heroSurveyCount}>
              {stats?.surveys.total || 0} Survei tercatat
            </Text>
          </View>
        </View>

        {/* Latest Surveys */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Survei Terbaru</Text>
              <Text style={styles.sectionDesc}>5 survei terakhir yang telah Anda kerjakan</Text>
            </View>
            <TouchableOpacity style={styles.seeAllButton} onPress={onNavigateToSurveys}>
              <Text style={styles.seeAllText}>Lihat Semua</Text>
            </TouchableOpacity>
          </View>

          {stats?.recent_surveys && stats.recent_surveys.length > 0 ? (
            stats.recent_surveys.slice(0, 5).map((survey) => (
              <TouchableOpacity key={survey.id} style={styles.surveyCard} onPress={() => onSelectSurvey(survey.id)} activeOpacity={0.7}>
                <View style={styles.surveyLeft}>
                  <Text style={styles.surveyName} numberOfLines={1}>{survey.service_name}</Text>
                  {survey.template_name ? (
                    <Text style={styles.surveyTemplate} numberOfLines={1}>{survey.template_name}</Text>
                  ) : null}
                  <Text style={styles.surveyDate}>
                    {new Date(survey.survey_date || survey.created_at).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </Text>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusColor(survey.verification_status) + '20' },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      { color: getStatusColor(survey.verification_status) },
                    ]}
                  >
                    {getStatusLabel(survey.verification_status)}
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>Belum ada survei</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f6f7' },
  scrollContainer: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  loadingText: { marginTop: 12, fontSize: 12, color: '#6b7280' },
  errorText: { fontSize: 12, color: '#dc2626', textAlign: 'center' },

  // Hero Card
  heroCard: {
    backgroundColor: '#00979D',
    borderRadius: 16,
    marginHorizontal: 20,
    marginTop: 4,
    marginBottom: 8,
    paddingVertical: 24,
    paddingHorizontal: 24,
    gap: 6,
  },
  heroSubgreeting: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  heroGreeting: {
    fontSize: 22,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: -0.4,
  },
  heroCountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 8,
  },
  heroSurveyCount: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
  },

  // Section
  section: {
    paddingHorizontal: 20,
    marginTop: 12,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  sectionDesc: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 2,
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#00979D',
  },

  // Survey Card - outlined
  surveyCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    backgroundColor: '#ffffff',
  },
  surveyLeft: { flex: 1, marginRight: 10 },
  surveyName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  surveyTemplate: {
    fontSize: 11,
    color: '#6b7280',
    marginBottom: 2,
  },
  surveyDate: {
    fontSize: 11,
    color: '#9ca3af',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },

  emptyState: { padding: 40, alignItems: 'center' },
  emptyText: { fontSize: 13, color: '#9ca3af' },
});
