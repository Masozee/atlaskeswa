import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import TopHeader from '../components/TopHeader';
import { apiClient } from '../services/api';
import { useTheme, useFontScale } from '../contexts/SettingsContext';
import LucideIcon from '../components/LucideIcon';

interface UserProfile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone_number?: string;
  role: string;
  organization?: string;
}

export default function ProfileScreen() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [organization, setOrganization] = useState('');

  const theme = useTheme();
  const fs = useFontScale();
  const c = theme.colors;

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const data = await apiClient.get<UserProfile>('/accounts/users/me/');
      setProfile(data);
      setFirstName(data.first_name || '');
      setLastName(data.last_name || '');
      setPhone(data.phone_number || '');
      setOrganization(data.organization || '');
    } catch (err) {
      console.error('Failed to load profile:', err);
      Alert.alert('Error', 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => setIsEditing(true);

  const handleCancel = () => {
    if (profile) {
      setFirstName(profile.first_name || '');
      setLastName(profile.last_name || '');
      setPhone(profile.phone_number || '');
      setOrganization(profile.organization || '');
    }
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert('Validation Error', 'First name and last name are required');
      return;
    }

    setSaving(true);
    try {
      const updatedData = await apiClient.patch<UserProfile>('/accounts/users/profile/', {
        first_name: firstName,
        last_name: lastName,
        phone_number: phone || null,
        organization: organization || null,
      });
      setProfile(updatedData);
      setIsEditing(false);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (err: any) {
      console.error('Profile update error:', err);
      const apiErr = err as { message?: string; errors?: Record<string, string[]> };
      const message = apiErr.message || 'Failed to update profile';
      const detail = apiErr.errors ? JSON.stringify(apiErr.errors) : '';
      Alert.alert('Error', detail ? `${message}\n${detail}` : message);
    } finally {
      setSaving(false);
    }
  };

  const getRoleDisplay = (role?: string) => {
    if (!role) return '';
    return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: c.background }]}>
        <TopHeader />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#07579E" />
          <Text style={[styles.loadingText, { color: c.textMuted, fontSize: fs(12) }]}>Loading profile...</Text>
        </View>
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={[styles.container, { backgroundColor: c.background }]}>
        <TopHeader />
        <View style={styles.centered}>
          <Text style={[styles.errorText, { fontSize: fs(12) }]}>Failed to load profile</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <TopHeader />
      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: c.textMuted }]}>Informasi Pribadi</Text>
          </View>
          <View style={[styles.card, { backgroundColor: c.surface }]}>
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: c.textPlaceholder, fontSize: fs(11) }]}>Nama Depan</Text>
              {isEditing ? (
                <TextInput
                  style={[styles.input, { color: c.textSecondary, backgroundColor: c.background, fontSize: fs(13) }]}
                  value={firstName}
                  onChangeText={setFirstName}
                  placeholder="Enter first name"
                  placeholderTextColor={c.textPlaceholder}
                  editable={!saving}
                />
              ) : (
                <Text style={[styles.fieldValue, { color: c.text, fontSize: fs(14) }]}>{profile.first_name}</Text>
              )}
            </View>
            <View style={[styles.divider, { backgroundColor: c.border }]} />
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: c.textPlaceholder, fontSize: fs(11) }]}>Nama Belakang</Text>
              {isEditing ? (
                <TextInput
                  style={[styles.input, { color: c.textSecondary, backgroundColor: c.background, fontSize: fs(13) }]}
                  value={lastName}
                  onChangeText={setLastName}
                  placeholder="Enter last name"
                  placeholderTextColor={c.textPlaceholder}
                  editable={!saving}
                />
              ) : (
                <Text style={[styles.fieldValue, { color: c.text, fontSize: fs(14) }]}>{profile.last_name}</Text>
              )}
            </View>
            <View style={[styles.divider, { backgroundColor: c.border }]} />
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: c.textPlaceholder, fontSize: fs(11) }]}>Email</Text>
              <Text style={[styles.fieldValue, { color: c.text, fontSize: fs(14) }]}>{profile.email}</Text>
              {isEditing && (
                <Text style={[styles.fieldHint, { color: c.textPlaceholder, fontSize: fs(10) }]}>Email cannot be changed</Text>
              )}
            </View>
            <View style={[styles.divider, { backgroundColor: c.border }]} />
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: c.textPlaceholder, fontSize: fs(11) }]}>No. Telepon</Text>
              {isEditing ? (
                <TextInput
                  style={[styles.input, { color: c.textSecondary, backgroundColor: c.background, fontSize: fs(13) }]}
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="Enter phone number"
                  placeholderTextColor={c.textPlaceholder}
                  keyboardType="phone-pad"
                  editable={!saving}
                />
              ) : (
                <Text style={[styles.fieldValue, { color: c.text, fontSize: fs(14) }]}>{profile.phone || '-'}</Text>
              )}
            </View>
            <View style={[styles.divider, { backgroundColor: c.border }]} />
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: c.textPlaceholder, fontSize: fs(11) }]}>Organisasi</Text>
              {isEditing ? (
                <TextInput
                  style={[styles.input, { color: c.textSecondary, backgroundColor: c.background, fontSize: fs(13) }]}
                  value={organization}
                  onChangeText={setOrganization}
                  placeholder="Enter organization"
                  placeholderTextColor={c.textPlaceholder}
                  editable={!saving}
                />
              ) : (
                <Text style={[styles.fieldValue, { color: c.text, fontSize: fs(14) }]}>{profile.organization || '-'}</Text>
              )}
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: c.textMuted }]}>Informasi Akun</Text>
          </View>
          <View style={[styles.card, { backgroundColor: c.surface }]}>
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: c.textPlaceholder, fontSize: fs(11) }]}>Role</Text>
              <Text style={[styles.fieldValue, { color: c.text, fontSize: fs(14) }]}>{getRoleDisplay(profile.role)}</Text>
            </View>
            <View style={[styles.divider, { backgroundColor: c.border }]} />
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: c.textPlaceholder, fontSize: fs(11) }]}>User ID</Text>
              <Text style={[styles.fieldValue, { color: c.text, fontSize: fs(14) }]}>{profile.id}</Text>
            </View>
          </View>
        </View>

        {isEditing && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: c.surface }]}
              onPress={handleCancel}
              disabled={saving}
            >
              <Text style={[styles.cancelButtonText, { color: c.textSecondary, fontSize: fs(12) }]}>Batal</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.saveButton]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={[styles.saveButtonText, { fontSize: fs(12) }]}>Simpan</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {!isEditing && (
        <TouchableOpacity style={styles.floatingButton} onPress={handleEdit}>
          <LucideIcon name="pencil" size={24} color="#ffffff" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContainer: { flex: 1 },
  scrollContent: { paddingBottom: 24 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  loadingText: { marginTop: 12 },
  errorText: { color: '#dc2626', textAlign: 'center' },
  pageHeader: { alignItems: 'center', paddingTop: 12, paddingBottom: 4 },
  pageTitle: { fontWeight: '600' },
  section: { marginTop: 20, paddingHorizontal: 20 },
  sectionHeader: { marginBottom: 10 },
  sectionTitle: { fontSize: 14, fontWeight: '600' },
  card: { borderRadius: 6, padding: 16 },
  fieldGroup: { paddingVertical: 10 },
  fieldLabel: { fontWeight: '400', marginBottom: 2 },
  fieldValue: { fontWeight: '500' },
  fieldHint: { marginTop: 3, fontStyle: 'italic' },
  input: { paddingHorizontal: 10, paddingVertical: 7, borderRadius: 6 },
  divider: { height: 1 },
  actionButtons: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, marginTop: 20 },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 6,
    gap: 6,
  },
  cancelButtonText: { fontWeight: '600' },
  saveButton: { backgroundColor: '#07579E' },
  saveButtonText: { color: '#ffffff', fontWeight: '600' },
  floatingButton: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 6,
    backgroundColor: '#07579E',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
});
