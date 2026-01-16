import React, { useState } from 'react';
import {
  View,
  Text,
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
import { useEffect } from 'react';

interface SettingsScreenProps {
  onLogout: () => void;
}

export default function SettingsScreen({ onLogout }: SettingsScreenProps) {
  const [darkMode, setDarkMode] = useState(false);
  const [largeText, setLargeText] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(null);
  const [lastSyncStatus, setLastSyncStatus] = useState<string | null>(null);

  useEffect(() => {
    loadLastSyncTime();
  }, []);

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

      // Reload last sync time
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

  const toggleDarkMode = (value: boolean) => {
    setDarkMode(value);
    // TODO: Implement dark mode theme switching
    Alert.alert('Coming Soon', 'Dark mode will be available in a future update.');
  };

  const toggleLargeText = (value: boolean) => {
    setLargeText(value);
    // TODO: Implement accessibility text scaling
    Alert.alert('Coming Soon', 'Large text will be available in a future update.');
  };

  return (
    <View style={styles.container}>
      <TopHeader />
      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
        {/* Page Title */}
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>Settings</Text>
        </View>

        {/* Appearance Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Appearance</Text>
            <Text style={styles.sectionSubtitle}>Customize how the app looks</Text>
          </View>
          <View style={styles.card}>
            <View style={styles.settingItem}>
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Dark Mode</Text>
                <Text style={styles.settingDescription}>Use dark theme</Text>
              </View>
              <Switch
                value={darkMode}
                onValueChange={toggleDarkMode}
                trackColor={{ false: '#d1d5db', true: '#8ed8f8' }}
                thumbColor={darkMode ? '#07579e' : '#f3f4f6'}
              />
            </View>
          </View>
        </View>

        {/* Accessibility Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Accessibility</Text>
            <Text style={styles.sectionSubtitle}>Make the app easier to use</Text>
          </View>
          <View style={styles.card}>
            <View style={styles.settingItem}>
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Large Text</Text>
                <Text style={styles.settingDescription}>Increase text size</Text>
              </View>
              <Switch
                value={largeText}
                onValueChange={toggleLargeText}
                trackColor={{ false: '#d1d5db', true: '#8ed8f8' }}
                thumbColor={largeText ? '#07579e' : '#f3f4f6'}
              />
            </View>
          </View>
        </View>

        {/* Data Sync Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Data Management</Text>
            <Text style={styles.sectionSubtitle}>Sync offline data to server</Text>
          </View>

          <View style={styles.card}>
            <View style={styles.settingItem}>
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Last Sync</Text>
                <Text style={styles.settingDescription}>{formatLastSyncTime()}</Text>
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleSyncData}
            disabled={syncing}
          >
            {syncing && <ActivityIndicator size="small" color="#07579e" />}
            <Text style={styles.actionButtonText}>
              {syncing ? 'Syncing...' : 'Sync Data to Server'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.sectionSubtitle}>App information</Text>
          </View>
          <View style={styles.card}>
            <View style={styles.settingItem}>
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Version</Text>
                <Text style={styles.settingDescription}>1.0.0</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Logout Button */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
          >
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
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
    fontSize: 28,
    fontWeight: 'bold',
    color: '#374151',
  },
  section: {
    marginTop: 16,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 2,
  },
  sectionSubtitle: {
    fontSize: 13,
    fontWeight: '400',
    color: '#6b7280',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
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
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 13,
    color: '#6b7280',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
    marginTop: 12,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#07579e',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#dc2626',
  },
});
