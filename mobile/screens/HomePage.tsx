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
import TopHeader from '../components/TopHeader';
import { apiClient } from '../services/api';
import { useTheme, useFontScale } from '../contexts/SettingsContext';
import DonutChart from '../components/DonutChart';
import LucideIcon from '../components/LucideIcon';

interface Survey {
  id: number;
  service_name: string;
  kecamatan?: string;
  city?: string;
  template_name?: string;
  verification_status: 'DRAFT' | 'PENDING' | 'SUBMITTED' | 'APPROVED' | 'VERIFIED' | 'REJECTED' | 'NEEDS_REVISION';
  status_display?: string;
  survey_date: string;
  created_at: string;
  geographic_unit_name?: string;
}

interface SurveyStats {
  total: number;
  draft: number;
  submitted: number;
  verified: number;
  rejected: number;
}

interface DashboardStats {
  surveys: SurveyStats;
  global_surveys: SurveyStats;
  my_surveys: SurveyStats;
  recent_surveys: Survey[];
  geographic_distribution: { kecamatan: string; count: number }[];
}

interface User {
  id: string;
  email: string;
  full_name?: string;
  first_name: string;
  last_name: string;
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

  const theme = useTheme();
  const fs = useFontScale();
  const c = theme.colors;

  const fetchData = async () => {
    try {
      setError('');
      const [dashboardData, userData] = await Promise.all([
        apiClient.get<DashboardStats>('/analytics/mobile/home/'),
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

  useEffect(() => { fetchData(); }, []);
  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const getFullName = () => {
    if (user?.full_name) return user.full_name;
    if (user?.first_name || user?.last_name) return `${user.first_name} ${user.last_name}`.trim();
    return user?.email.split('@')[0] || 'User';
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'APPROVED': case 'VERIFIED': return '#10b981';
      case 'SUBMITTED': case 'PENDING': return '#f59e0b';
      case 'REJECTED': return '#ef4444';
      case 'DRAFT': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const getStatusLabel = (status?: string) => {
    switch (status) {
      case 'APPROVED': case 'VERIFIED': return 'Diverifikasi';
      case 'SUBMITTED': case 'PENDING': return 'Diajukan';
      case 'REJECTED': return 'Ditolak';
      case 'DRAFT': return 'Draft';
      default: return 'Draft';
    }
  };

  const makeChartData = (s?: SurveyStats) => {
    if (!s) return [];
    const data = [];
    if (s.draft > 0)     data.push({ value: s.draft,     color: '#9ca3af', label: 'Draft' });
    if (s.submitted > 0) data.push({ value: s.submitted, color: '#f59e0b', label: 'Diajukan' });
    if (s.verified > 0)  data.push({ value: s.verified,  color: '#10b981', label: 'Verified' });
    if (s.rejected > 0)  data.push({ value: s.rejected,  color: '#ef4444', label: 'Ditolak' });
    return data;
  };

  const globalStats = stats?.global_surveys ?? stats?.surveys;
  const myStats = stats?.my_surveys;
  const globalChartData = makeChartData(globalStats);
  const myChartData = makeChartData(myStats);

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: c.background }]}>
        <ActivityIndicator size="large" color="#03979D" />
        <Text style={[styles.loadingText, { color: c.textMuted, fontSize: fs(12) }]}>Memuat dashboard...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.centered, { backgroundColor: c.background }]}>
        <Text style={[styles.errorText, { fontSize: fs(12) }]}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <TopHeader />
      <ScrollView
        style={styles.scrollContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#03979D']} />}
      >
        {/* Hero Card */}
        <View style={[styles.heroCard, { backgroundColor: c.heroBg }]}>
          <View style={styles.heroContent}>
            <View>
              <Text style={[styles.heroSubgreeting, { fontSize: fs(14) }]}>Selamat pagi,</Text>
              <Text style={[styles.heroGreeting, { fontSize: fs(22) }]}>{getFullName()}</Text>
              <View style={styles.heroCountRow}>
                <Text style={[styles.heroSurveyCount, { fontSize: fs(14) }]}>
                  {myStats?.total ?? 0} Survei saya • {globalStats?.total ?? 0} Total global
                </Text>
              </View>
            </View>
            <View style={styles.heroDecor}>
              {[...Array(20)].map((_, i) => (
                <View key={i} style={[styles.heroDecorDot, { opacity: 0.05 + (i % 4) * 0.03 }]} />
              ))}
            </View>
          </View>
        </View>

        {/* Charts Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: c.textMuted }]}>Statistik Survei</Text>
          </View>
          <View style={styles.chartsRow}>
            {/* Global */}
            <View style={[styles.chartCard, { backgroundColor: c.surface }]}>
              <DonutChart
                data={globalChartData}
                size={100}
                strokeWidth={12}
                title="Semua Survei"
                centerValue={String(globalStats?.total ?? 0)}
                centerLabel="Total"
              />
              <View style={styles.legend}>
                {globalChartData.map((d) => (
                  <View key={d.label} style={styles.legendRow}>
                    <View style={[styles.legendDot, { backgroundColor: d.color }]} />
                    <Text style={[styles.legendText, { color: c.textMuted, fontSize: fs(10) }]}>{d.label}: {d.value}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* My surveys */}
            <View style={[styles.chartCard, { backgroundColor: c.surface }]}>
              <DonutChart
                data={myChartData.length > 0 ? myChartData : [{ value: 1, color: '#e5e7eb', label: '' }]}
                size={100}
                strokeWidth={12}
                title="Survei Saya"
                centerValue={String(myStats?.total ?? 0)}
                centerLabel="Saya"
              />
              <View style={styles.legend}>
                {myChartData.map((d) => (
                  <View key={d.label} style={styles.legendRow}>
                    <View style={[styles.legendDot, { backgroundColor: d.color }]} />
                    <Text style={[styles.legendText, { color: c.textMuted, fontSize: fs(10) }]}>{d.label}: {d.value}</Text>
                  </View>
                ))}
                {myChartData.length === 0 && (
                  <Text style={[styles.legendText, { color: c.textMuted, fontSize: fs(10) }]}>Belum ada survei</Text>
                )}
              </View>
            </View>
          </View>
        </View>

        {/* Latest Surveys (user's own) */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: c.textMuted }]}>Survei Terbaru Saya</Text>
            <TouchableOpacity style={styles.seeAllButton} onPress={onNavigateToSurveys}>
              <Text style={styles.seeAllText}>Lihat Semua</Text>
            </TouchableOpacity>
          </View>

          {stats?.recent_surveys && stats.recent_surveys.length > 0 ? (
            stats.recent_surveys.slice(0, 5).map((survey) => (
              <TouchableOpacity
                key={survey.id}
                style={[styles.recentSurveyCard, { backgroundColor: c.surface }]}
                onPress={() => onSelectSurvey(survey.id)}
                activeOpacity={0.7}
              >
                <View style={styles.recentSurveyLeft}>
                  <View style={[styles.recentSurveyIcon, { backgroundColor: c.primary + '20' }]}>
                    <LucideIcon name="clipboard" size={20} color={c.primary} />
                  </View>
                  <View style={styles.recentSurveyInfo}>
                    <Text style={[styles.recentSurveyName, { color: c.text, fontSize: fs(13) }]} numberOfLines={1}>
                      {survey.service_name}
                    </Text>
                    <Text style={[styles.recentSurveyDate, { color: c.textMuted, fontSize: fs(11) }]}>
                      {survey.geographic_unit_name || (survey.kecamatan ? `Kec. ${survey.kecamatan}` : (survey.city || '-'))} •{' '}
                      {new Date(survey.survey_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </Text>
                  </View>
                </View>
                <View style={[styles.recentSurveyBadge, { borderWidth: 1, borderColor: getStatusColor(survey.verification_status), backgroundColor: 'transparent' }]}>
                  <Text style={[styles.recentSurveyBadgeText, { color: getStatusColor(survey.verification_status), fontSize: fs(10) }]}>
                    {getStatusLabel(survey.verification_status)}
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={[styles.emptyText, { color: c.textPlaceholder, fontSize: fs(13) }]}>Belum ada survei</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContainer: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  loadingText: { marginTop: 12 },
  errorText: { color: '#dc2626', textAlign: 'center' },

  heroCard: { borderRadius: 6, marginHorizontal: 20, marginTop: 4, marginBottom: 8, paddingVertical: 24, paddingHorizontal: 24, gap: 6 },
  heroContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  heroDecor: { flexDirection: 'row', flexWrap: 'wrap', width: 100, gap: 8, justifyContent: 'flex-end' },
  heroDecorDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#ffffff' },
  heroSubgreeting: { color: 'rgba(255,255,255,0.8)' },
  heroGreeting: { fontWeight: '700', color: '#ffffff', letterSpacing: -0.4 },
  heroCountRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingTop: 8 },
  heroSurveyCount: { color: 'rgba(255,255,255,0.9)', fontWeight: '500' },

  section: { paddingHorizontal: 20, marginTop: 12, marginBottom: 20 },
  chartsRow: { flexDirection: 'row', gap: 12 },
  chartCard: { flex: 1, borderRadius: 6, padding: 16, alignItems: 'center' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  sectionTitle: { fontSize: 14, fontWeight: '600' },
  seeAllButton: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  seeAllText: { fontSize: 12, fontWeight: '500', color: '#374151' },

  legend: { marginTop: 8, alignSelf: 'stretch', gap: 3 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { flexShrink: 1 },

  recentSurveyCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderRadius: 6, padding: 12, marginBottom: 8 },
  recentSurveyLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12 },
  recentSurveyIcon: { width: 40, height: 40, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  recentSurveyInfo: { flex: 1 },
  recentSurveyName: { fontWeight: '600', marginBottom: 2 },
  recentSurveyDate: {},
  recentSurveyBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  recentSurveyBadgeText: { fontWeight: '600' },

  emptyState: { padding: 40, alignItems: 'center' },
  emptyText: {},
});
