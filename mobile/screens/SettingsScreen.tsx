import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Switch,
  Alert,
} from 'react-native';
import TopHeader from '../components/TopHeader';
import { apiClient, normalizeApiBaseUrl } from '../services/api';
import { database } from '../services/database';
import { syncQueue } from '../services/syncQueue';
import { useSettings, useTheme, useFontScale } from '../contexts/SettingsContext';

interface SettingsScreenProps {
  onLogout: () => void;
}

export default function SettingsScreen({ onLogout }: SettingsScreenProps) {
  const { settings, updateSetting } = useSettings();
  const theme = useTheme();
  const fs = useFontScale();
  const c = theme.colors;

  const [lastSyncTime, setLastSyncTime] = useState<number | null>(null);
  const [lastSyncStatus, setLastSyncStatus] = useState<string | null>(null);
  const [serverUrl, setServerUrl] = useState('');
  const [isSavedInDb, setIsSavedInDb] = useState(false);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    loadLastSyncTime();
    loadServerUrl();
  }, []);

  const loadServerUrl = async () => {
    try {
      const saved = await database.getApiBaseUrl();
      if (saved) {
        const normalized = normalizeApiBaseUrl(saved);
        if (normalized !== saved) {
          await database.saveApiBaseUrl(normalized);
        }
        setServerUrl(normalized);
        setIsSavedInDb(true);
      } else {
        setServerUrl(apiClient.getBaseURL());
        setIsSavedInDb(false);
      }
    } catch {
      setServerUrl(apiClient.getBaseURL());
      setIsSavedInDb(false);
    }
  };

  const handleSaveServerUrl = async () => {
    const trimmed = normalizeApiBaseUrl(serverUrl);
    if (!trimmed) {
      Alert.alert('Error', 'Masukkan URL server yang valid');
      return;
    }

    try {
      await database.saveApiBaseUrl(trimmed);
      apiClient.setBaseURL(trimmed);
      setIsSavedInDb(true);
      setServerUrl(trimmed);
      Alert.alert('Disimpan', 'URL server diperbarui. Anda mungkin perlu login ulang agar perubahan berlaku.');
    } catch {
      Alert.alert('Error', 'Gagal menyimpan URL server');
    }
  };

  const canSaveServerUrl = !isSavedInDb || normalizeApiBaseUrl(serverUrl) !== apiClient.getBaseURL();

  const loadLastSyncTime = async () => {
    const syncData = await database.getLastSyncTime();
    setLastSyncTime(syncData.time);
    setLastSyncStatus(syncData.status);
  };

  const handleSyncData = async () => {
    setSyncing(true);
    try {
      const result = await syncQueue.processQueue();
      await loadLastSyncTime();
      Alert.alert(
        'Sinkronisasi Selesai',
        `Berhasil: ${result.success}. Gagal: ${result.failed}.`
      );
    } catch (err: any) {
      await loadLastSyncTime();
      Alert.alert('Sinkronisasi Gagal', err?.message || 'Gagal menyinkronkan database');
    } finally {
      setSyncing(false);
    }
  };

  const formatLastSyncTime = () => {
    if (!lastSyncTime) return 'Belum pernah sinkron';

    const now = Date.now();
    const diff = now - lastSyncTime;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Baru saja';
    if (minutes < 60) return `${minutes} menit yang lalu`;
    if (hours < 24) return `${hours} jam yang lalu`;
    return `${days} hari yang lalu`;
  };

  const handleLogout = () => {
    Alert.alert(
      'Keluar',
      'Apakah Anda yakin ingin keluar?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Keluar',
          style: 'destructive',
          onPress: async () => {
            await apiClient.logout();
            onLogout();
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <TopHeader />
      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
        {/* Appearance Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: c.textMuted }]}>Tampilan</Text>
          </View>
          <View style={[styles.card, { backgroundColor: c.surface }]}>
            <View style={styles.settingItem}>
              <View style={styles.settingText}>
                <Text style={[styles.settingLabel, { color: c.textSecondary, fontSize: fs(13) }]}>Mode Gelap</Text>
                <Text style={[styles.settingDescription, { color: c.textMuted, fontSize: fs(11) }]}>Gunakan tema gelap</Text>
              </View>
              <Switch
                value={settings.darkMode}
                onValueChange={(value) => updateSetting('darkMode', value)}
                trackColor={{ false: '#d1d5db', true: '#07579E' }}
                thumbColor={settings.darkMode ? '#07579E' : '#f3f4f6'}
              />
            </View>
          </View>
        </View>

        {/* Accessibility Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: c.textMuted }]}>Aksesibilitas</Text>
          </View>
          <View style={[styles.card, { backgroundColor: c.surface }]}>
            <View style={styles.settingItem}>
              <View style={styles.settingText}>
                <Text style={[styles.settingLabel, { color: c.textSecondary, fontSize: fs(13) }]}>Teks Besar</Text>
                <Text style={[styles.settingDescription, { color: c.textMuted, fontSize: fs(11) }]}>Perbesar teks di seluruh aplikasi</Text>
              </View>
              <Switch
                value={settings.largeText}
                onValueChange={(value) => updateSetting('largeText', value)}
                trackColor={{ false: '#d1d5db', true: '#07579E' }}
                thumbColor={settings.largeText ? '#07579E' : '#f3f4f6'}
              />
            </View>
            <View style={[styles.settingDivider, { backgroundColor: c.border }]} />
            <View style={styles.settingItem}>
              <View style={styles.settingText}>
                <Text style={[styles.settingLabel, { color: c.textSecondary, fontSize: fs(13) }]}>Text-ke-Speech</Text>
                <Text style={[styles.settingDescription, { color: c.textMuted, fontSize: fs(11) }]}>Baca pertanyaan survei dengan suara</Text>
              </View>
              <Switch
                value={settings.ttsEnabled}
                onValueChange={(value) => updateSetting('ttsEnabled', value)}
                trackColor={{ false: '#d1d5db', true: '#07579E' }}
                thumbColor={settings.ttsEnabled ? '#07579E' : '#f3f4f6'}
              />
            </View>
            {settings.ttsEnabled && (
              <>
                <View style={[styles.settingDivider, { backgroundColor: c.border }]} />
                <View style={styles.settingItem}>
                  <View style={styles.settingText}>
                    <Text style={[styles.settingLabel, { color: c.textSecondary, fontSize: fs(13) }]}>Putar Otomatis TTS</Text>
                    <Text style={[styles.settingDescription, { color: c.textMuted, fontSize: fs(11) }]}>Otomatis baca setiap pertanyaan saat muncul</Text>
                  </View>
                  <Switch
                    value={settings.ttsAutoPlay}
                    onValueChange={(value) => updateSetting('ttsAutoPlay', value)}
                    trackColor={{ false: '#d1d5db', true: '#07579E' }}
                    thumbColor={settings.ttsAutoPlay ? '#07579E' : '#f3f4f6'}
                  />
                </View>
              </>
            )}
          </View>
        </View>

        {/* Data Sync Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: c.textMuted }]}>Manajemen Data</Text>
          </View>

          <View style={[styles.card, { backgroundColor: c.surface }]}>
            <View style={styles.settingItem}>
              <View style={styles.settingText}>
                <Text style={[styles.settingLabel, { color: c.textSecondary, fontSize: fs(13) }]}>Sinkronisasi Terakhir</Text>
                <Text style={[styles.settingDescription, { color: c.textMuted, fontSize: fs(11) }]}>{formatLastSyncTime()}</Text>
              </View>
            </View>
            <View style={[styles.settingDivider, { backgroundColor: c.border, marginVertical: 12 }]} />
            <Text style={[styles.settingDescription, { color: c.textMuted, fontSize: fs(11) }]}>
              Sinkronisasi survei dilakukan manual dari halaman detail survei lokal yang belum tersinkron.
            </Text>
            {lastSyncStatus ? (
              <Text style={[styles.settingDescription, { color: c.textMuted, fontSize: fs(11), marginTop: 6 }]}>
                Status terakhir: {lastSyncStatus === 'success' ? 'Berhasil' : 'Gagal'}
              </Text>
            ) : null}
            <TouchableOpacity
              style={[
                styles.syncButton,
                { backgroundColor: c.primary },
                syncing && styles.syncButtonDisabled,
              ]}
              onPress={handleSyncData}
              disabled={syncing}
            >
              <Text style={styles.syncButtonText}>
                {syncing ? 'Menyinkronkan...' : 'Sinkronkan DB'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Server Configuration Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: c.textMuted }]}>Konfigurasi Server</Text>
          </View>
          <View style={[styles.card, { backgroundColor: c.surface }]}>
            <View style={{ marginBottom: 8 }}>
              <Text style={[styles.settingLabel, { color: c.textSecondary, fontSize: fs(13) }]}>URL Server API</Text>
              <Text style={[styles.settingDescription, { color: c.textMuted, fontSize: fs(11) }]}>Saat ini: {apiClient.getBaseURL()}</Text>
            </View>
            <View style={styles.serverInputRow}>
              <View style={[styles.serverInputContainer, { backgroundColor: c.background }]}>
                <TextInput
                  style={[styles.serverInput, { color: c.textSecondary, fontSize: fs(12) }]}
                  placeholder="https://api.example.com/v1"
                  placeholderTextColor={c.textPlaceholder}
                  value={serverUrl}
                  onChangeText={setServerUrl}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="url"
                />
              </View>
              <TouchableOpacity
                style={[
                  styles.serverSaveButton,
                  !canSaveServerUrl && styles.serverSaveButtonDisabled,
                ]}
                onPress={handleSaveServerUrl}
                disabled={!canSaveServerUrl}
              >
                <Text style={[styles.serverSaveButtonText, { fontSize: fs(12) }]}>Simpan</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: c.textMuted }]}>Tentang</Text>
          </View>
          <View style={[styles.card, { backgroundColor: c.surface }]}>
            <View style={styles.settingItem}>
              <View style={styles.settingText}>
                <Text style={[styles.settingLabel, { color: c.textSecondary, fontSize: fs(13) }]}>Versi</Text>
                <Text style={[styles.settingDescription, { color: c.textMuted, fontSize: fs(11) }]}>1.0.0</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Logout Button */}
        <View style={styles.section}>
          <TouchableOpacity
            style={[styles.logoutButton, { backgroundColor: c.surface }]}
            onPress={handleLogout}
          >
            <Text style={[styles.logoutButtonText, { fontSize: fs(13) }]}>Keluar</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  pageHeader: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  pageTitle: {
    fontWeight: 'bold',
  },
  section: {
    marginTop: 14,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  card: {
    borderRadius: 6,
    padding: 14,
  },
  syncButton: {
    marginTop: 14,
    width: '100%',
    minHeight: 44,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  syncButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  syncButtonDisabled: {
    opacity: 0.6,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingText: {
    flex: 1,
  },
  settingLabel: {
    fontWeight: '600',
    marginBottom: 2,
  },
  settingDescription: {
  },
  settingDivider: {
    height: 1,
    marginVertical: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#07579E',
    paddingVertical: 12,
    gap: 6,
    marginTop: 10,
  },
  actionButtonText: {
    fontWeight: '600',
    color: '#07579E',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#dc2626',
    paddingVertical: 12,
    gap: 6,
  },
  logoutButtonText: {
    fontWeight: '600',
    color: '#dc2626',
  },
  serverInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  serverInputContainer: {
    flex: 1,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  serverInput: {
    padding: 0,
  },
  serverSaveButton: {
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#07579E',
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  serverSaveButtonDisabled: {
    opacity: 0.4,
  },
  serverSaveButtonText: {
    color: '#07579E',
    fontWeight: '600',
  },
});
