import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import TopHeader from '../components/TopHeader';
import { apiClient } from '../services/api';
import { database } from '../services/database';
import { useTheme, useFontScale } from '../contexts/SettingsContext';
import LucideIcon from '../components/LucideIcon';
import type { SurveyResponseItem, PaginatedResponse } from '../lib/types';
import PLACEHOLDER_IMAGE from '../assets/OMMHA.png';

// Extended type for local surveys with sync info
interface LocalSurvey extends SurveyResponseItem {
  server_id?: number | null;
  is_local_only?: boolean;
  synced?: number;
  pending_action?: string;
  photos?: { id: number; image_url: string; caption?: string; local_uri?: string }[];
  photoCount?: number;
}

type SortOption = 'date_desc' | 'date_asc' | 'name_asc' | 'name_desc';

const sortOptions: { value: SortOption; label: string; icon: string }[] = [
  { value: 'date_desc', label: 'Terbaru', icon: 'arrow-down-0-1' },
  { value: 'date_asc', label: 'Terlama', icon: 'arrow-up-1-0' },
  { value: 'name_asc', label: 'Nama A-Z', icon: 'arrow-up-a-z' },
  { value: 'name_desc', label: 'Nama Z-A', icon: 'arrow-down-a-z' },
];

interface SurveyListScreenProps {
  onSelectSurvey: (surveyId: number) => void;
  onAddNew: () => void;
}

export default function SurveyListScreen({ onSelectSurvey, onAddNew }: SurveyListScreenProps) {
  const theme = useTheme();
  const fs = useFontScale();
  const c = theme.colors;
  const [surveys, setSurveys] = useState<LocalSurvey[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('date_desc');

  const fetchSurveys = async () => {
    try {
      // Log user info for debugging
      try {
        const userData = await apiClient.get<any>('/accounts/users/me/');
        console.log('[SurveyList] Logged-in user:', userData);
        console.log('[SurveyList] User role:', userData.role);
      } catch (userErr) {
        console.error('[SurveyList] Failed to get user info:', userErr);
      }

      const ordering = sortBy === 'date_desc' ? '-survey_date' : sortBy === 'date_asc' ? 'survey_date' : sortBy === 'name_asc' ? 'service_name' : '-service_name';

      // Fetch server surveys
      let serverSurveys: SurveyResponseItem[] = [];
      try {
        console.log('[SurveyList] Fetching from API, baseURL:', apiClient.getBaseURL());
        const data = await apiClient.get<PaginatedResponse<SurveyResponseItem> | SurveyResponseItem[]>(
          '/surveys/responses/',
          { ordering, page_size: 50 }
        );
        console.log('[SurveyList] API response type:', Array.isArray(data) ? 'array' : 'paginated');
        console.log('[SurveyList] Count:', Array.isArray(data) ? data.length : data?.results?.length);
        serverSurveys = Array.isArray(data)
          ? data
          : Array.isArray(data?.results)
            ? data.results
            : [];
        console.log('[SurveyList] serverSurveys count:', serverSurveys.length);
      } catch (err) {
        console.error('[SurveyList] Failed to load server surveys:', err);
      }

      // Fetch local unsynced surveys
      let localSurveys: LocalSurvey[] = [];
      try {
        const localRows = await database.getPendingSurveys() as any[];
        localSurveys = localRows.map((row: any): LocalSurvey => ({
          id: row.id,
          server_id: row.server_id,
          template: row.template_id || 0,
          template_name: undefined,
          service: row.service_id || 0,
          service_name: row.service_name,
          service_city: row.service_city,
          service_kecamatan: undefined,
          survey_date: new Date(row.survey_date).toISOString().split('T')[0],
          survey_period_start: '',
          survey_period_end: '',
          verification_status: row.verification_status || 'DRAFT',
          surveyor_name: undefined,
          deletion_requested: false,
          is_local_only: row.synced === 0,
          synced: row.synced,
          pending_action: row.pending_action,
        }));
      } catch (err) {
        console.error('Failed to load local surveys:', err);
      }

      // Merge: add local-only surveys to server surveys (local-first for unsynced)
      const merged: LocalSurvey[] = [...(serverSurveys || [])];
      for (const local of localSurveys) {
        // If not synced (synced=0) and not already in server list, add it
        if (local.synced === 0 && !merged.find(s => (s as LocalSurvey).server_id === local.id)) {
          merged.push({ ...local, id: local.server_id ?? -local.id } as LocalSurvey);
        }
      }

      // Fetch photos for each survey
      for (const survey of merged) {
        try {
          const serverId = (survey as LocalSurvey).server_id || survey.id;
          if (serverId > 0) {
            // Fetch from server
            const photosData = await apiClient.get<any>('/surveys/photos/', { survey: serverId });
            const serverPhotos = Array.isArray(photosData) ? photosData : photosData?.results;
            if (Array.isArray(serverPhotos) && serverPhotos.length > 0) {
              (survey as LocalSurvey).photos = serverPhotos;
              (survey as LocalSurvey).photoCount = serverPhotos.length;
            }
          }
          // Fetch local photos
          const localPhotos = await database.getSurveyPhotosForServerSurvey(serverId);
          if (localPhotos.length > 0) {
            const localPhotoItems = localPhotos.map((p: any) => ({
              id: p.id,
              image_url: p.server_image_url || p.local_uri,
              caption: p.caption,
              local_uri: p.local_uri,
            }));
            (survey as LocalSurvey).photos = [
              ...((survey as LocalSurvey).photos || []),
              ...localPhotoItems,
            ];
            (survey as LocalSurvey).photoCount = ((survey as LocalSurvey).photoCount || 0) + localPhotoItems.length;
          }
        } catch (err) {
          console.error('Failed to fetch photos for survey', survey.id, err);
        }
      }

      // Sort by survey_date
      merged.sort((a, b) => {
        const dateA = new Date(a.survey_date).getTime();
        const dateB = new Date(b.survey_date).getTime();
        return sortBy === 'date_desc' || sortBy === 'date_asc' ? (sortBy === 'date_desc' ? dateB - dateA : dateA - dateB) : 0;
      });

      setSurveys(merged);
    } catch (err: any) {
      console.error('Failed to load surveys:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filteredSurveys = surveys.filter(survey => {
    const query = searchQuery.toLowerCase();
    return (
      survey.service_name?.toLowerCase().includes(query) ||
      survey.service_city?.toLowerCase().includes(query) ||
      survey.surveyor_name?.toLowerCase().includes(query)
    );
  });

  useEffect(() => {
    fetchSurveys();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchSurveys();
  };

  const handleSortChange = (option: SortOption) => {
    setSortBy(option);
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

  const isDark = theme.dark;

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: c.background }]}>
        <ActivityIndicator size="large" color={c.primary} />
        <Text style={[styles.loadingText, { color: c.textMuted }]}>Memuat survei...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <TopHeader />
      <View style={[styles.content, { backgroundColor: c.background }]}>
        {/* Search and Sort Bar */}
        <View style={styles.searchBar}>
          <View style={[styles.searchInputContainer, { backgroundColor: c.surface }]}>
            <LucideIcon name="scan-search" size={16} color={c.textPlaceholder} />
            <TextInput
              style={[styles.searchInput, { color: c.text }]}
              placeholder="Cari survei..."
              placeholderTextColor={c.textPlaceholder}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <LucideIcon name="x" size={14} color={c.textPlaceholder} />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity
            style={[styles.sortDropdown, { backgroundColor: c.surface }]}
            onPress={() => {
              const currentIndex = sortOptions.findIndex(o => o.value === sortBy);
              const nextIndex = (currentIndex + 1) % sortOptions.length;
              handleSortChange(sortOptions[nextIndex].value);
            }}
          >
            <LucideIcon name={sortOptions.find(o => o.value === sortBy)?.icon || 'arrow-down-0-1'} size={16} color={c.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Section Header */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: c.textMuted }]}>Daftar Survey</Text>
        </View>

        <ScrollView
          style={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[c.primary]} tintColor={c.primary} />
          }
        >
          {filteredSurveys.length > 0 ? (
            filteredSurveys.map((survey) => (
              <TouchableOpacity
                key={survey.id}
                style={[styles.surveyCard, { backgroundColor: c.surface, borderColor: c.border }]}
                onPress={() => onSelectSurvey(survey.id)}
                activeOpacity={0.7}
              >
                {/* Photo Card - Above Title */}
                <View style={styles.photoCardWrapper}>
                  {survey.photos && survey.photos.length > 0 ? (
                    <View style={styles.photoCardContainer}>
                      <View style={styles.photoCardRow}>
                        {survey.photos.slice(0, 3).map((photo, idx) => (
                          <View key={photo.id || idx} style={styles.photoCardThumb}>
                            <Image
                              source={{ uri: photo.image_url }}
                              style={styles.photoCardImage}
                              resizeMode="cover"
                            />
                          </View>
                        ))}
                        {survey.photoCount && survey.photoCount > 3 && (
                          <View style={[styles.photoCardThumb, styles.photoCardMore]}>
                            <Text style={styles.photoCardMoreText}>+{survey.photoCount - 3}</Text>
                          </View>
                        )}
                      </View>
                    </View>
                  ) : (
                    <View style={styles.photoCardContainer}>
                      <View style={styles.photoCardRow}>
                        <View style={styles.photoCardThumb}>
                          <Image
                            source={PLACEHOLDER_IMAGE}
                            style={styles.photoCardImage}
                            resizeMode="cover"
                          />
                        </View>
                      </View>
                    </View>
                  )}
                </View>

                <View style={styles.surveyHeader}>
                  <Text style={[styles.serviceName, { color: c.text }]} numberOfLines={1}>
                    {survey.service_name || 'Layanan'}
                  </Text>
                  {/* Show sync icon for local-only unsynced surveys */}
                  {survey.is_local_only && (
                    <View style={styles.syncBadge}>
                      <LucideIcon name="refresh-ccw" size={12} color="#f59e0b" />
                    </View>
                  )}
                </View>

                <View style={styles.surveyMeta}>
                  <Text style={[styles.metaText, { color: c.textMuted }]}>
                    {new Date(survey.survey_date).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                    {' '}
                    {new Date(survey.survey_date).toLocaleTimeString('id-ID', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                    {survey.service_kecamatan ? `  |  Kec. ${survey.service_kecamatan}` : (survey.service_city ? `  |  ${survey.service_city}` : '')}
                    {survey.surveyor_name ? `  |  ${survey.surveyor_name}` : ''}
                    {'  |  '}
                    <Text style={{ fontWeight: '600', color: survey.verification_status === 'VERIFIED' ? '#10b981' : survey.verification_status === 'SUBMITTED' ? '#f59e0b' : c.textMuted }}>
                      {survey.verification_status === 'VERIFIED' ? 'Verifikasi' : survey.verification_status === 'SUBMITTED' ? 'Menunggu' : 'Draft'}
                    </Text>
                  </Text>
                </View>

                {survey.survey_period_start && survey.survey_period_end ? (
                  <Text style={[styles.metaText, { color: c.textMuted }]}>
                    {new Date(survey.survey_period_start).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                    {' - '}
                    {new Date(survey.survey_period_end).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </Text>
                ) : null}

                <View style={[styles.cardActions, { borderTopColor: c.border }]}>
                  <TouchableOpacity
                    style={[styles.actionButtonEdit, { borderColor: c.primary }]}
                    onPress={(e) => { e.stopPropagation(); onSelectSurvey(survey.id); }}
                  >
                    <Text style={[styles.actionButtonEditText, { color: c.primary }]}>Edit</Text>
                  </TouchableOpacity>
                  {survey.deletion_requested ? (
                    <View style={[styles.actionButtonPending, { borderColor: '#f59e0b' }]}>
                      <Text style={[styles.actionButtonPendingText, { color: '#f59e0b' }]}>Menunggu Persetujuan</Text>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={[styles.actionButtonDelete, { borderColor: '#ef4444' }]}
                      onPress={(e) => { e.stopPropagation(); handleRequestDeletion(survey.id); }}
                    >
                      <Text style={[styles.actionButtonDeleteText, { color: '#ef4444' }]}>Hapus</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={[styles.emptyText, { color: c.textMuted }]}>Belum ada survei</Text>
              <Text style={[styles.emptySubtext, { color: c.textPlaceholder }]}>Tekan tombol + untuk memulai</Text>
            </View>
          )}
        </ScrollView>

        {/* Floating + Button */}
        <TouchableOpacity style={[styles.floatingButton, { backgroundColor: c.primary }]} onPress={onAddNew}>
          <LucideIcon name="plus" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f6f7' },
  content: { flex: 1, backgroundColor: '#f5f6f7' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: 12, color: '#6b7280', fontFamily: 'Geist' },

  // Search bar
  sectionHeader: {
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
      },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 12,
    gap: 10,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 6,
    paddingHorizontal: 10,
    height: 38,
    gap: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#1a1a1a',
      },
  sortDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 6,
    width: 38,
    height: 38,
  },

  list: { flex: 1 },

  floatingButton: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#03979D',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },

  surveyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 6,
    padding: 14,
    marginHorizontal: 20,
    marginTop: 10,
    gap: 10,
  },
  surveyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  surveyHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
    marginRight: 8,
  },
  surveyHeaderInfo: { flex: 1 },
  serviceName: { fontSize: 18, fontWeight: '800', letterSpacing: -0.4 },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontWeight: '600', fontFamily: 'Geist' },
  syncBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#f59e0b',
    gap: 3,
  },
  surveyMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: { fontSize: 12, color: '#6b7280', fontFamily: 'Geist' },
  periodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 12,
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
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#03979D',
  },
  actionButtonEditText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#03979D',
      },
  actionButtonDelete: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  actionButtonDeleteText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ef4444',
      },
  actionButtonPending: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#f59e0b',
  },
  actionButtonPendingText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#f59e0b',
      },

  emptyState: { padding: 40, alignItems: 'center' },
  emptyText: { fontSize: 14, color: '#6b7280', fontWeight: '600', fontFamily: 'Geist' },
  emptySubtext: { fontSize: 12, color: '#9ca3af', marginTop: 4, fontFamily: 'Geist' },

  // Photo card - above title
  photoCardWrapper: {
    marginBottom: 10,
  },
  photoCardContainer: {
    backgroundColor: '#f5f6f7',
    borderRadius: 8,
    padding: 8,
  },
  photoCardRow: {
    flexDirection: 'row',
    gap: 8,
  },
  photoCardThumb: {
    flex: 1,
    height: 100,
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: '#e5e7eb',
  },
  photoCardImage: {
    width: '100%',
    height: '100%',
  },
  photoCardMore: {
    backgroundColor: '#d1d5db',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoCardMoreText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  photoCardsContainer: {
    marginTop: 4,
  },
  photoCardsRow: {
    flexDirection: 'row',
    gap: 8,
  },
});
