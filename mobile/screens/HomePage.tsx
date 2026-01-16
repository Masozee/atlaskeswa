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
import { Hospital01Icon, ClipboardIcon, UserMultiple02Icon, BedIcon, ArrowRight01Icon } from 'hugeicons-react-native';
import TopHeader from '../components/TopHeader';
import { apiClient } from '../services/api';

interface Survey {
  id: number;
  service_name: string;
  verification_status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'NEEDS_REVISION';
  created_at: string;
}

interface DashboardStats {
  services: {
    total: number;
    verified: number;
    recent: number;
  };
  surveys: {
    total: number;
    pending: number;
  };
  users: {
    total: number;
    active: number;
  };
  capacity: {
    total_beds: number;
    total_staff: number;
    psychiatrists: number;
    psychologists: number;
    nurses: number;
    social_workers: number;
  };
  mtc_distribution: Array<{ mtc__code: string; count: number }>;
  geographic_distribution: Array<{ province: string; count: number }>;
  activity_trends: Array<{ day: string; count: number }>;
  recent_surveys: Survey[];
}

interface StatCardProps {
  title: string;
  value: number;
  subtitle?: string;
  icon: any;
  trend?: string;
  color: string;
}

function StatCard({ title, value, subtitle, icon: Icon, trend, color }: StatCardProps) {
  return (
    <View style={styles.statCard}>
      <View style={styles.statContent}>
        <Text style={styles.statTitle}>{title}</Text>
        <Text style={styles.statValue}>{value.toLocaleString()}</Text>
        {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
        {trend && <Text style={styles.statTrend}>{trend}</Text>}
      </View>
    </View>
  );
}

interface User {
  id: string;
  email: string;
  full_name?: string;
}

interface HomePageProps {
  onNavigateToSurveys: () => void;
}

export default function HomePage({ onNavigateToSurveys }: HomePageProps) {
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

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#07579e" />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
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
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#07579e']} />
        }
      >
        <View style={styles.header}>
          <Text style={styles.greeting}>Welcome back, {getFirstName()}!</Text>
        </View>

      <View style={styles.statsGrid}>
        <StatCard
          title="Total Services"
          value={stats?.services.total || 0}
          subtitle={`${stats?.services.verified || 0} verified`}
          icon={Hospital01Icon}
          trend={`+${stats?.services.recent || 0} this week`}
          color="#3b82f6"
        />
        <StatCard
          title="Pending Surveys"
          value={stats?.surveys.pending || 0}
          subtitle={`${stats?.surveys.total || 0} total surveys`}
          icon={ClipboardIcon}
          color="#f59e0b"
        />
        <StatCard
          title="Active Users"
          value={stats?.users.active || 0}
          subtitle={`${stats?.users.total || 0} total users`}
          icon={UserMultiple02Icon}
          color="#10b981"
        />
        <StatCard
          title="Bed Capacity"
          value={stats?.capacity.total_beds || 0}
          subtitle={`${stats?.capacity.total_staff || 0} staff members`}
          icon={BedIcon}
          color="#8b5cf6"
        />
      </View>

      {/* Staff Distribution */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Staff Distribution</Text>
        <Text style={styles.sectionSubtitle}>Overview of mental health professionals</Text>
        <View style={styles.card}>
          <View style={styles.staffRow}>
            <View style={styles.staffInfo}>
              <Text style={styles.staffLabel}>Psychiatrists</Text>
              <Text style={styles.staffDesc}>Medical doctors specialized in mental health</Text>
            </View>
            <Text style={styles.staffCount}>{stats?.capacity.psychiatrists || 0}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.staffRow}>
            <View style={styles.staffInfo}>
              <Text style={styles.staffLabel}>Psychologists</Text>
              <Text style={styles.staffDesc}>Mental health counselors and therapists</Text>
            </View>
            <Text style={styles.staffCount}>{stats?.capacity.psychologists || 0}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.staffRow}>
            <View style={styles.staffInfo}>
              <Text style={styles.staffLabel}>Nurses</Text>
              <Text style={styles.staffDesc}>Registered nurses providing care</Text>
            </View>
            <Text style={styles.staffCount}>{stats?.capacity.nurses || 0}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.staffRow}>
            <View style={styles.staffInfo}>
              <Text style={styles.staffLabel}>Social Workers</Text>
              <Text style={styles.staffDesc}>Community support specialists</Text>
            </View>
            <Text style={styles.staffCount}>{stats?.capacity.social_workers || 0}</Text>
          </View>
        </View>
      </View>

      {/* Latest Surveys */}
      <View style={[styles.section, styles.lastSection]}>
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Latest Surveys</Text>
            <Text style={styles.sectionSubtitle}>Recent verification requests</Text>
          </View>
          <TouchableOpacity style={styles.seeAllButton} onPress={onNavigateToSurveys}>
            <Text style={styles.seeAllText}>See all</Text>
            <ArrowRight01Icon size={16} color="#07579e" strokeWidth={2} />
          </TouchableOpacity>
        </View>
        <View style={styles.card}>
          {stats?.recent_surveys && stats.recent_surveys.length > 0 ? (
            stats.recent_surveys.slice(0, 5).map((survey, index) => (
              <View key={survey.id}>
                {index > 0 && <View style={styles.divider} />}
                <View style={styles.surveyRow}>
                  <View style={styles.surveyInfo}>
                    <Text style={styles.surveyName}>{survey.service_name}</Text>
                    <Text style={styles.surveyDate}>
                      {new Date(survey.created_at).toLocaleDateString()}
                    </Text>
                  </View>
                  <View style={[
                    styles.statusBadge,
                    styles[`status${survey.verification_status}`]
                  ]}>
                    <Text style={styles.statusText}>
                      {survey.verification_status.replace('_', ' ')}
                    </Text>
                  </View>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>No recent surveys</Text>
          )}
        </View>
      </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f6f7',
  },
  scrollContainer: {
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
    fontSize: 14,
    color: '#dc2626',
    textAlign: 'center',
  },
  header: {
    padding: 20,
    paddingBottom: 20,
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#374151',
  },
  statsGrid: {
    paddingHorizontal: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    width: '48%',
  },
  statContent: {
    flexDirection: 'column',
  },
  statTitle: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 8,
    fontWeight: '500',
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 4,
  },
  statSubtitle: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
  },
  statTrend: {
    fontSize: 12,
    color: '#10b981',
    marginTop: 4,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  lastSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    fontWeight: '300',
    color: '#6b7280',
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
  },
  staffRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  staffInfo: {
    flex: 1,
    marginRight: 12,
  },
  staffLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  staffDesc: {
    fontSize: 12,
    color: '#6b7280',
  },
  staffCount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#374151',
  },
  divider: {
    height: 1,
    backgroundColor: '#e5e7eb',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#07579e',
  },
  surveyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  surveyInfo: {
    flex: 1,
    marginRight: 12,
  },
  surveyName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  surveyDate: {
    fontSize: 12,
    color: '#6b7280',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  statusPENDING: {
    backgroundColor: '#fef3c7',
  },
  statusAPPROVED: {
    backgroundColor: '#d1fae5',
  },
  statusREJECTED: {
    backgroundColor: '#fee2e2',
  },
  statusNEEDS_REVISION: {
    backgroundColor: '#dbeafe',
  },
  emptyText: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    paddingVertical: 20,
  },
});
