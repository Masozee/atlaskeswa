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
  ActivityIndicator,
} from 'react-native';
import TopHeader from '../components/TopHeader';
import { apiClient } from '../services/api';
import { syncQueue } from '../services/syncQueue';
import { database } from '../services/database';
import { useSettings, useTheme, useFontScale } from '../contexts/SettingsContext';

interface SettingsScreenProps {
  onLogout: () => void;
}

export default function SettingsScreen({ onLogout }: SettingsScreenProps) {
  const { settings, updateSetting } = useSettings();
  const theme = useTheme();
  const fs = useFontScale();
  const c = theme.colors;

  const [syncing, setSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(null);
  const [lastSyncStatus, setLastSyncStatus] = useState<string | null>(null);
  const [serverUrl, setServerUrl] = useState('');
  const [isSavedInDb, setIsSavedInDb] = useState(false);

  useEffect(() => {
    loadLastSyncTime();
    loadServerUrl();
  }, []);

  const loadServerUrl = async () => {
    try {
      const saved = await database.getApiBaseUrl();
      if (saved) {
        setServerUrl(saved);
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
    const trimmed = serverUrl.trim().replace(/\/+$/, '');
    if (!trimmed) {
      Alert.alert('Error', 'Please enter a valid server URL');
      return;
    }

    try {
      await database.saveApiBaseUrl(trimmed);
      apiClient.setBaseURL(trimmed);
      setIsSavedInDb(true);
      setServerUrl(trimmed);
      Alert.alert('Saved', 'Server URL updated. You may need to re-login for changes to take effect.');
    } catch {
      Alert.alert('Error', 'Failed to save server URL');
    }
  };

  const canSaveServerUrl = !isSavedInDb || serverUrl.trim().replace(/\/+$/, '') !== apiClient.getBaseURL();

  const loadLastSyncTime = async () => {
    const syncData = await database.getLastSyncTime();
    setLastSyncTime(syncData.time);
    setLastSyncStatus(syncData.status);
  };

  const formatLastSyncTime = () => {
    if (!lastSyncTime) return 'Never synced';

    const now = Date.now();
    const diff = now - lastSyncTime;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    return `${days} day${days > 1 ? 's' : ''} ago`;
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await apiClient.logout();
            onLogout();
          },
        },
      ]
    );
  };

  const handleSyncData = async () => {
    setSyncing(true);
    try {
      const result = await syncQueue.processQueue();
      await loadLastSyncTime();

      if (result.success > 0) {
        Alert.alert(
          'Sync Complete',
          `Successfully synced ${result.success} item(s).${result.failed > 0 ? ` ${result.failed} item(s) failed.` : ''}`
        );
      } else if (result.failed > 0) {
        Alert.alert('Sync Failed', `Failed to sync ${result.failed} item(s).`);
      } else {
        Alert.alert('Sync Complete', 'No pending items to sync.');
      }
    } catch (err: any) {
      Alert.alert('Sync Error', err?.message || 'Failed to sync data');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <TopHeader />
      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
        {/* Page Title */}
        <View style={styles.pageHeader}>
          <Text style={[styles.pageTitle, { color: c.textSecondary, fontSize: fs(22) }]}>Settings</Text>
        </View>

        {/* Appearance Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: c.textSecondary, fontSize: fs(14) }]}>Appearance</Text>
            <Text style={[styles.sectionSubtitle, { color: c.textMuted, fontSize: fs(11) }]}>Customize how the app looks</Text>
          </View>
          <View style={[styles.card, { backgroundColor: c.surface }]}>
            <View style={styles.settingItem}>
              <View style={styles.settingText}>
                <Text style={[styles.settingLabel, { color: c.textSecondary, fontSize: fs(13) }]}>Dark Mode</Text>
                <Text style={[styles.settingDescription, { color: c.textMuted, fontSize: fs(11) }]}>Use dark theme</Text>
              </View>
              <Switch
                value={settings.darkMode}
                onValueChange={(value) => updateSetting('darkMode', value)}
                trackColor={{ false: '#d1d5db', true: '#8ed8f8' }}
                thumbColor={settings.darkMode ? '#03979D' : '#f3f4f6'}
              />
            </View>
          </View>
        </View>

        {/* Accessibility Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: c.textSecondary, fontSize: fs(14) }]}>Accessibility</Text>
            <Text style={[styles.sectionSubtitle, { color: c.textMuted, fontSize: fs(11) }]}>Make the app easier to use</Text>
          </View>
          <View style={[styles.card, { backgroundColor: c.surface }]}>
            <View style={styles.settingItem}>
              <View style={styles.settingText}>
                <Text style={[styles.settingLabel, { color: c.textSecondary, fontSize: fs(13) }]}>Large Text</Text>
                <Text style={[styles.settingDescription, { color: c.textMuted, fontSize: fs(11) }]}>Increase text size throughout the app</Text>
              </View>
              <Switch
                value={settings.largeText}
                onValueChange={(value) => updateSetting('largeText', value)}
                trackColor={{ false: '#d1d5db', true: '#8ed8f8' }}
                thumbColor={settings.largeText ? '#03979D' : '#f3f4f6'}
              />
            </View>
            <View style={[styles.settingDivider, { backgroundColor: c.border }]} />
            <View style={styles.settingItem}>
              <View style={styles.settingText}>
                <Text style={[styles.settingLabel, { color: c.textSecondary, fontSize: fs(13) }]}>Text-to-Speech</Text>
                <Text style={[styles.settingDescription, { color: c.textMuted, fontSize: fs(11) }]}>Read survey questions aloud (tap the speaker icon)</Text>
              </View>
              <Switch
                value={settings.ttsEnabled}
                onValueChange={(value) => updateSetting('ttsEnabled', value)}
                trackColor={{ false: '#d1d5db', true: '#8ed8f8' }}
                thumbColor={settings.ttsEnabled ? '#03979D' : '#f3f4f6'}
              />
            </View>
            {settings.ttsEnabled && (
              <>
                <View style={[styles.settingDivider, { backgroundColor: c.border }]} />
                <View style={styles.settingItem}>
                  <View style={styles.settingText}>
                    <Text style={[styles.settingLabel, { color: c.textSecondary, fontSize: fs(13) }]}>Auto-Play TTS</Text>
                    <Text style={[styles.settingDescription, { color: c.textMuted, fontSize: fs(11) }]}>Automatically read each question aloud when it appears</Text>
                  </View>
                  <Switch
                    value={settings.ttsAutoPlay}
                    onValueChange={(value) => updateSetting('ttsAutoPlay', value)}
                    trackColor={{ false: '#d1d5db', true: '#8ed8f8' }}
                    thumbColor={settings.ttsAutoPlay ? '#03979D' : '#f3f4f6'}
                  />
                </View>
              </>
            )}
          </View>
        </View>

        {/* Data Sync Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: c.textSecondary, fontSize: fs(14) }]}>Data Management</Text>
            <Text style={[styles.sectionSubtitle, { color: c.textMuted, fontSize: fs(11) }]}>Sync offline data to server</Text>
          </View>

          <View style={[styles.card, { backgroundColor: c.surface }]}>
            <View style={styles.settingItem}>
              <View style={styles.settingText}>
                <Text style={[styles.settingLabel, { color: c.textSecondary, fontSize: fs(13) }]}>Last Sync</Text>
                <Text style={[styles.settingDescription, { color: c.textMuted, fontSize: fs(11) }]}>{formatLastSyncTime()}</Text>
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: c.surface }]}
            onPress={handleSyncData}
            disabled={syncing}
          >
            {syncing && <ActivityIndicator size="small" color="#03979D" />}
            <Text style={[styles.actionButtonText, { fontSize: fs(13) }]}>
              {syncing ? 'Syncing...' : 'Sync Data to Server'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Server Configuration Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: c.textSecondary, fontSize: fs(14) }]}>Server Configuration</Text>
            <Text style={[styles.sectionSubtitle, { color: c.textMuted, fontSize: fs(11) }]}>Set the API server URL</Text>
          </View>
          <View style={[styles.card, { backgroundColor: c.surface }]}>
            <View style={{ marginBottom: 8 }}>
              <Text style={[styles.settingLabel, { color: c.textSecondary, fontSize: fs(13) }]}>API Server URL</Text>
              <Text style={[styles.settingDescription, { color: c.textMuted, fontSize: fs(11) }]}>Current: {apiClient.getBaseURL()}</Text>
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
                <Text style={[styles.serverSaveButtonText, { fontSize: fs(12) }]}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: c.textSecondary, fontSize: fs(14) }]}>About</Text>
            <Text style={[styles.sectionSubtitle, { color: c.textMuted, fontSize: fs(11) }]}>App information</Text>
          </View>
          <View style={[styles.card, { backgroundColor: c.surface }]}>
            <View style={styles.settingItem}>
              <View style={styles.settingText}>
                <Text style={[styles.settingLabel, { color: c.textSecondary, fontSize: fs(13) }]}>Version</Text>
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
            <Text style={[styles.logoutButtonText, { fontSize: fs(13) }]}>Logout</Text>
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
    fontWeight: '600',
    marginBottom: 2,
  },
  sectionSubtitle: {
    fontWeight: '400',
  },
  card: {
    borderRadius: 12,
    padding: 14,
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
    borderRadius: 12,
    paddingVertical: 12,
    gap: 6,
    marginTop: 10,
  },
  actionButtonText: {
    fontWeight: '600',
    color: '#03979D',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
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
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  serverInput: {
    padding: 0,
  },
  serverSaveButton: {
    backgroundColor: '#03979D',
    borderRadius: 8,
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  serverSaveButtonDisabled: {
    opacity: 0.4,
  },
  serverSaveButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
});
