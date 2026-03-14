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
import { MaterialIcons } from '@expo/vector-icons';
import TopHeader from '../components/TopHeader';
import { apiClient } from '../services/api';
import { useTheme, useFontScale } from '../contexts/SettingsContext';

interface UserProfile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
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
      setPhone(data.phone || '');
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
      setPhone(profile.phone || '');
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
      const updatedData = await apiClient.put<UserProfile>('/accounts/users/me/', {
        first_name: firstName,
        last_name: lastName,
        phone: phone || null,
        organization: organization || null,
      });
      setProfile(updatedData);
      setIsEditing(false);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const getRoleDisplay = (role: string) => {
    return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: c.background }]}>
        <TopHeader />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#03979D" />
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
        <View style={styles.pageHeader}>
          <Text style={[styles.pageTitle, { color: c.text, fontSize: fs(16) }]}>Profil</Text>
        </View>

        <View style={[styles.header, { backgroundColor: c.surface, borderColor: c.border }]}>
          <View style={styles.headerContent}>
            <View style={[styles.avatar, { backgroundColor: c.avatarBg }]}>
              <Text style={[styles.avatarText, { fontSize: fs(26) }]}>
                {profile.first_name.charAt(0)}{profile.last_name.charAt(0)}
              </Text>
            </View>
            <Text style={[styles.headerName, { color: c.text, fontSize: fs(18) }]}>
              {profile.first_name} {profile.last_name}
            </Text>
            <Text style={[styles.headerRole, { color: c.textMuted, fontSize: fs(13) }]}>{getRoleDisplay(profile.role)}</Text>
          </View>
          {!isEditing && (
            <TouchableOpacity style={styles.editButton} onPress={handleEdit}>
              <MaterialIcons name="edit" size={14} color="#ffffff" />
              <Text style={[styles.editButtonText, { fontSize: fs(13) }]}>Edit Profil</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: c.text, fontSize: fs(14) }]}>Informasi Pribadi</Text>
          </View>
          <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}>
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
            <Text style={[styles.sectionTitle, { color: c.text, fontSize: fs(14) }]}>Informasi Akun</Text>
          </View>
          <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}>
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
  header: {
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    borderRadius: 16,
    marginHorizontal: 20,
    marginTop: 16,
  },
  headerContent: { alignItems: 'center', marginBottom: 12, gap: 2 },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: { color: '#ffffff', fontWeight: '700' },
  headerName: { fontWeight: '700' },
  headerRole: {},
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#03979D',
    paddingHorizontal: 20,
    paddingVertical: 9,
    borderRadius: 10,
    gap: 6,
  },
  editButtonText: { color: '#ffffff', fontWeight: '600' },
  section: { marginTop: 20, paddingHorizontal: 20 },
  sectionHeader: { marginBottom: 10 },
  sectionTitle: { fontWeight: '700' },
  card: { borderWidth: 1, borderRadius: 12, padding: 16 },
  fieldGroup: { paddingVertical: 10 },
  fieldLabel: { fontWeight: '400', marginBottom: 2 },
  fieldValue: { fontWeight: '500' },
  fieldHint: { marginTop: 3, fontStyle: 'italic' },
  input: { paddingHorizontal: 10, paddingVertical: 7, borderRadius: 8 },
  divider: { height: 1 },
  actionButtons: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, marginTop: 20 },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  cancelButtonText: { fontWeight: '600' },
  saveButton: { backgroundColor: '#03979D' },
  saveButtonText: { color: '#ffffff', fontWeight: '600' },
});
