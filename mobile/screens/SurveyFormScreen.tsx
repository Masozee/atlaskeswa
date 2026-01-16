import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { ArrowLeft01Icon, Location01Icon, ArrowDown01Icon, Calendar03Icon } from 'hugeicons-react-native';
import * as Location from 'expo-location';
import NetInfo from '@react-native-community/netinfo';
import TopHeader from '../components/TopHeader';
import { apiClient } from '../services/api';
import { database } from '../services/database';

interface Service {
  id: number;
  name: string;
}

interface SurveyFormData {
  service: number;
  survey_date: string;
  survey_period_start: string;
  survey_period_end: string;
  latitude: number | null;
  longitude: number | null;
  location_accuracy: number | null;
  // Capacity & Staff
  current_bed_capacity: number;
  beds_occupied: number;
  current_psychiatrist_count: number;
  current_psychologist_count: number;
  current_nurse_count: number;
  current_social_worker_count: number;
  // Patient Statistics
  total_patients_served: number;
  new_patients: number;
  returning_patients: number;
  patients_male: number;
  patients_female: number;
  patients_age_0_17: number;
  patients_age_18_64: number;
  patients_age_65_plus: number;
  // Financial Data
  bpjs_patients: number;
  private_insurance_patients: number;
  self_pay_patients: number;
  monthly_budget: string;
  // Quality Metrics
  patient_satisfaction_score: number | null;
  average_wait_time_days: number | null;
  // Notes
  surveyor_notes: string;
  challenges_faced: string;
  improvements_needed: string;
  additional_notes: string;
}

interface SurveyFormScreenProps {
  surveyId?: number;
  onBack: () => void;
  onSave: () => void;
}

export default function SurveyFormScreen({ surveyId, onBack, onSave }: SurveyFormScreenProps) {
  const [loading, setLoading] = useState(!!surveyId);
  const [saving, setSaving] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [showServicePicker, setShowServicePicker] = useState(false);
  const [capturingLocation, setCapturingLocation] = useState(false);

  const [formData, setFormData] = useState<SurveyFormData>({
    service: 0,
    survey_date: new Date().toISOString().split('T')[0],
    survey_period_start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    survey_period_end: new Date().toISOString().split('T')[0],
    latitude: null,
    longitude: null,
    location_accuracy: null,
    // Capacity & Staff
    current_bed_capacity: 0,
    beds_occupied: 0,
    current_psychiatrist_count: 0,
    current_psychologist_count: 0,
    current_nurse_count: 0,
    current_social_worker_count: 0,
    // Patient Statistics
    total_patients_served: 0,
    new_patients: 0,
    returning_patients: 0,
    patients_male: 0,
    patients_female: 0,
    patients_age_0_17: 0,
    patients_age_18_64: 0,
    patients_age_65_plus: 0,
    // Financial Data
    bpjs_patients: 0,
    private_insurance_patients: 0,
    self_pay_patients: 0,
    monthly_budget: '',
    // Quality Metrics
    patient_satisfaction_score: null,
    average_wait_time_days: null,
    // Notes
    surveyor_notes: '',
    challenges_faced: '',
    improvements_needed: '',
    additional_notes: '',
  });

  const [selectedServiceName, setSelectedServiceName] = useState('');

  useEffect(() => {
    fetchServices();
    if (surveyId) {
      fetchSurveyData();
    }
  }, [surveyId]);

  const fetchServices = async () => {
    try {
      const data = await apiClient.get<{ results: Service[] }>('/directory/services/', {
        page_size: 100,
        ordering: 'name',
      });
      setServices(data.results);
    } catch (err) {
      console.error('Failed to load services:', err);
    }
  };

  const fetchSurveyData = async () => {
    if (!surveyId) return;

    try {
      const data = await apiClient.get<any>(`/surveys/surveys/${surveyId}/`);
      setFormData({
        service: data.service.id || data.service,
        survey_date: data.survey_date,
        survey_period_start: data.survey_period_start || '',
        survey_period_end: data.survey_period_end || '',
        latitude: data.latitude || null,
        longitude: data.longitude || null,
        location_accuracy: data.location_accuracy || null,
        // Capacity & Staff
        current_bed_capacity: data.current_bed_capacity || 0,
        beds_occupied: data.beds_occupied || 0,
        current_psychiatrist_count: data.current_psychiatrist_count || 0,
        current_psychologist_count: data.current_psychologist_count || 0,
        current_nurse_count: data.current_nurse_count || 0,
        current_social_worker_count: data.current_social_worker_count || 0,
        // Patient Statistics
        total_patients_served: data.total_patients_served || 0,
        new_patients: data.new_patients || 0,
        returning_patients: data.returning_patients || 0,
        patients_male: data.patients_male || 0,
        patients_female: data.patients_female || 0,
        patients_age_0_17: data.patients_age_0_17 || 0,
        patients_age_18_64: data.patients_age_18_64 || 0,
        patients_age_65_plus: data.patients_age_65_plus || 0,
        // Financial Data
        bpjs_patients: data.bpjs_patients || 0,
        private_insurance_patients: data.private_insurance_patients || 0,
        self_pay_patients: data.self_pay_patients || 0,
        monthly_budget: data.monthly_budget || '',
        // Quality Metrics
        patient_satisfaction_score: data.patient_satisfaction_score || null,
        average_wait_time_days: data.average_wait_time_days || null,
        // Notes
        surveyor_notes: data.surveyor_notes || '',
        challenges_faced: data.challenges_faced || '',
        improvements_needed: data.improvements_needed || '',
        additional_notes: data.additional_notes || '',
      });
      setSelectedServiceName(data.service.name || data.service_name);
    } catch (err) {
      console.error('Failed to load survey:', err);
      Alert.alert('Error', 'Failed to load survey data');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (submit: boolean = false) => {
    if (!formData.service) {
      Alert.alert('Validation Error', 'Please select a service');
      return;
    }

    if (!formData.latitude || !formData.longitude) {
      Alert.alert('Validation Error', 'Please capture GPS location before saving');
      return;
    }

    setSaving(true);
    try {
      const service = services.find(s => s.id === formData.service);
      const surveyData = {
        ...formData,
        service_id: formData.service,
        service_name: service?.name || '',
        service_city: service?.city || '',
        service_address: service?.address || '',
        verification_status: submit ? 'PENDING' : 'DRAFT',
        status_display: submit ? 'Pending' : 'Draft',
      };

      // Save to local database first (offline-first)
      const localId = surveyId
        ? surveyId
        : await database.saveSurvey(surveyData, true);

      if (surveyId) {
        await database.updateSurvey(surveyId, surveyData, true);
      }

      // Check if online
      const netInfo = await NetInfo.fetch();
      const isOnline = netInfo.isConnected ?? false;

      if (isOnline) {
        // Try to sync immediately
        try {
          if (surveyId) {
            await apiClient.patch(`/surveys/surveys/${surveyId}/`, formData);
            await database.markSurveySynced(surveyId);
          } else {
            const response = await apiClient.post('/surveys/surveys/', formData);
            await database.markSurveySynced(localId, response.id);
          }

          if (submit) {
            await apiClient.post(`/surveys/surveys/${surveyId || localId}/submit/`);
            Alert.alert('Success', 'Survey submitted successfully for verification');
          } else {
            Alert.alert('Success', surveyId ? 'Survey updated successfully' : 'Survey created successfully');
          }
        } catch (err: any) {
          console.error('Failed to sync survey:', err);
          Alert.alert('Saved Offline', 'Survey saved locally. Will sync when connection is restored.');
        }
      } else {
        Alert.alert(
          'Saved Offline',
          'Survey saved locally. It will be synced when you go online and tap the sync button.'
        );
      }

      onSave();
    } catch (err: any) {
      console.error('Failed to save survey:', err);
      const errorMessage = err?.message || 'Failed to save survey';
      Alert.alert('Error', errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const selectService = (service: Service) => {
    setFormData({ ...formData, service: service.id });
    setSelectedServiceName(service.name);
    setShowServicePicker(false);
  };

  const captureLocation = async () => {
    setCapturingLocation(true);
    try {
      // Request location permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required to capture GPS coordinates');
        setCapturingLocation(false);
        return;
      }

      // Get current position
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      setFormData({
        ...formData,
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        location_accuracy: location.coords.accuracy || null,
      });

      Alert.alert('Success', 'Location captured successfully');
    } catch (err) {
      console.error('Failed to capture location:', err);
      Alert.alert('Error', 'Failed to capture location. Please try again.');
    } finally {
      setCapturingLocation(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#07579e" />
        <Text style={styles.loadingText}>Loading survey...</Text>
      </View>
    );
  }

  if (showServicePicker) {
    return (
      <View style={styles.container}>
        <TopHeader />
        <View style={styles.contentWrapper}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => setShowServicePicker(false)} style={styles.backIcon}>
              <ArrowLeft01Icon size={24} color="#111827" strokeWidth={2} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Select Service</Text>
            <View style={{ width: 24 }} />
          </View>
          <ScrollView style={styles.serviceList}>
          {services.map((service) => (
            <TouchableOpacity
              key={service.id}
              style={styles.serviceItem}
              onPress={() => selectService(service)}
            >
              <Text style={styles.serviceName}>{service.name}</Text>
            </TouchableOpacity>
          ))}
          </ScrollView>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TopHeader />
      <View style={styles.contentWrapper}>
        {/* Header */}
        <View style={styles.pageHeader}>
          <TouchableOpacity onPress={onBack} style={styles.backIcon}>
            <ArrowLeft01Icon size={24} color="#374151" strokeWidth={2} />
          </TouchableOpacity>
          <Text style={styles.pageTitle}>
            {surveyId ? 'Edit Survey' : 'New Survey'}
          </Text>
        </View>

        <ScrollView style={styles.content}>
        {/* Service Selection */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Which mental health service facility are you surveying? *</Text>
          <TouchableOpacity
            style={styles.picker}
            onPress={() => setShowServicePicker(true)}
          >
            <Text style={selectedServiceName ? styles.pickerText : styles.pickerPlaceholder}>
              {selectedServiceName || 'Select a service'}
            </Text>
            <ArrowDown01Icon size={20} color="#6b7280" strokeWidth={2} />
          </TouchableOpacity>
        </View>

        {/* Survey Date */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>When was this survey conducted? *</Text>
          <View style={styles.inputWithIcon}>
            <TextInput
              style={styles.input}
              value={formData.survey_date}
              onChangeText={(text) => setFormData({ ...formData, survey_date: text })}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#9ca3af"
            />
            <Calendar03Icon size={20} color="#6b7280" strokeWidth={2} />
          </View>
        </View>

        {/* Survey Period */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>What is the start date of the reporting period?</Text>
          <View style={styles.inputWithIcon}>
            <TextInput
              style={styles.input}
              value={formData.survey_period_start}
              onChangeText={(text) => setFormData({ ...formData, survey_period_start: text })}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#9ca3af"
            />
            <Calendar03Icon size={20} color="#6b7280" strokeWidth={2} />
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>What is the end date of the reporting period?</Text>
          <View style={styles.inputWithIcon}>
            <TextInput
              style={styles.input}
              value={formData.survey_period_end}
              onChangeText={(text) => setFormData({ ...formData, survey_period_end: text })}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#9ca3af"
            />
            <Calendar03Icon size={20} color="#6b7280" strokeWidth={2} />
          </View>
        </View>

        {/* Section: Capacity & Staff */}
        <View style={styles.sectionHeaderContainer}>
          <Text style={styles.sectionHeader}>Bed Capacity & Staff</Text>
          <Text style={styles.sectionSubtitle}>Current facility capacity and staffing levels</Text>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>How many total beds does this facility have?</Text>
          <TextInput
            style={styles.inputBox}
            value={formData.current_bed_capacity.toString()}
            onChangeText={(text) =>
              setFormData({ ...formData, current_bed_capacity: parseInt(text) || 0 })
            }
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor="#9ca3af"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>How many beds are currently occupied?</Text>
          <TextInput
            style={styles.inputBox}
            value={formData.beds_occupied.toString()}
            onChangeText={(text) =>
              setFormData({ ...formData, beds_occupied: parseInt(text) || 0 })
            }
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor="#9ca3af"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>How many psychiatrists are currently employed?</Text>
          <TextInput
            style={styles.inputBox}
            value={formData.current_psychiatrist_count.toString()}
            onChangeText={(text) =>
              setFormData({ ...formData, current_psychiatrist_count: parseInt(text) || 0 })
            }
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor="#9ca3af"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>How many psychologists are currently employed?</Text>
          <TextInput
            style={styles.inputBox}
            value={formData.current_psychologist_count.toString()}
            onChangeText={(text) =>
              setFormData({ ...formData, current_psychologist_count: parseInt(text) || 0 })
            }
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor="#9ca3af"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>How many nurses are currently employed?</Text>
          <TextInput
            style={styles.inputBox}
            value={formData.current_nurse_count.toString()}
            onChangeText={(text) =>
              setFormData({ ...formData, current_nurse_count: parseInt(text) || 0 })
            }
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor="#9ca3af"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>How many social workers are currently employed?</Text>
          <TextInput
            style={styles.inputBox}
            value={formData.current_social_worker_count.toString()}
            onChangeText={(text) =>
              setFormData({ ...formData, current_social_worker_count: parseInt(text) || 0 })
            }
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor="#9ca3af"
          />
        </View>

        {/* Section: Patient Statistics */}
        <View style={styles.sectionHeaderContainer}>
          <Text style={styles.sectionHeader}>Patient Statistics</Text>
          <Text style={styles.sectionSubtitle}>Patient counts and demographic data</Text>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>How many total patients were served during the reporting period? *</Text>
          <TextInput
            style={styles.inputBox}
            value={formData.total_patients_served.toString()}
            onChangeText={(text) =>
              setFormData({ ...formData, total_patients_served: parseInt(text) || 0 })
            }
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor="#9ca3af"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>How many were new patients (first visit)?</Text>
          <TextInput
            style={styles.inputBox}
            value={formData.new_patients.toString()}
            onChangeText={(text) =>
              setFormData({ ...formData, new_patients: parseInt(text) || 0 })
            }
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor="#9ca3af"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>How many were returning patients?</Text>
          <TextInput
            style={styles.inputBox}
            value={formData.returning_patients.toString()}
            onChangeText={(text) =>
              setFormData({ ...formData, returning_patients: parseInt(text) || 0 })
            }
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor="#9ca3af"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>How many patients were male?</Text>
          <TextInput
            style={styles.inputBox}
            value={formData.patients_male.toString()}
            onChangeText={(text) =>
              setFormData({ ...formData, patients_male: parseInt(text) || 0 })
            }
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor="#9ca3af"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>How many patients were female?</Text>
          <TextInput
            style={styles.inputBox}
            value={formData.patients_female.toString()}
            onChangeText={(text) =>
              setFormData({ ...formData, patients_female: parseInt(text) || 0 })
            }
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor="#9ca3af"
          />
        </View>

        <Text style={styles.subLabel}>Patient Age Distribution</Text>
        <View style={styles.formGroup}>
          <Text style={styles.label}>How many patients were aged 0-17?</Text>
          <TextInput
            style={styles.inputBox}
            value={formData.patients_age_0_17.toString()}
            onChangeText={(text) =>
              setFormData({ ...formData, patients_age_0_17: parseInt(text) || 0 })
            }
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor="#9ca3af"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>How many patients were aged 18-64?</Text>
          <TextInput
            style={styles.inputBox}
            value={formData.patients_age_18_64.toString()}
            onChangeText={(text) =>
              setFormData({ ...formData, patients_age_18_64: parseInt(text) || 0 })
            }
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor="#9ca3af"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>How many patients were aged 65 and above?</Text>
          <TextInput
            style={styles.inputBox}
            value={formData.patients_age_65_plus.toString()}
            onChangeText={(text) =>
              setFormData({ ...formData, patients_age_65_plus: parseInt(text) || 0 })
            }
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor="#9ca3af"
          />
        </View>

        {/* Section: Financial Data */}
        <View style={styles.sectionHeaderContainer}>
          <Text style={styles.sectionHeader}>Financial & Insurance</Text>
          <Text style={styles.sectionSubtitle}>Budget and insurance coverage information</Text>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>How many patients used BPJS health insurance?</Text>
          <TextInput
            style={styles.inputBox}
            value={formData.bpjs_patients.toString()}
            onChangeText={(text) =>
              setFormData({ ...formData, bpjs_patients: parseInt(text) || 0 })
            }
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor="#9ca3af"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>How many patients used private insurance?</Text>
          <TextInput
            style={styles.inputBox}
            value={formData.private_insurance_patients.toString()}
            onChangeText={(text) =>
              setFormData({ ...formData, private_insurance_patients: parseInt(text) || 0 })
            }
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor="#9ca3af"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>How many patients paid out-of-pocket?</Text>
          <TextInput
            style={styles.inputBox}
            value={formData.self_pay_patients.toString()}
            onChangeText={(text) =>
              setFormData({ ...formData, self_pay_patients: parseInt(text) || 0 })
            }
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor="#9ca3af"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>What is the monthly operational budget in Indonesian Rupiah?</Text>
          <TextInput
            style={styles.inputBox}
            value={formData.monthly_budget}
            onChangeText={(text) => setFormData({ ...formData, monthly_budget: text })}
            placeholder="e.g., 50000000"
            placeholderTextColor="#9ca3af"
            keyboardType="numeric"
          />
        </View>

        {/* Section: Quality Metrics */}
        <View style={styles.sectionHeaderContainer}>
          <Text style={styles.sectionHeader}>Quality Metrics</Text>
          <Text style={styles.sectionSubtitle}>Service quality and performance indicators</Text>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>What is the average patient satisfaction score? (Scale: 1-5)</Text>
          <TextInput
            style={styles.inputBox}
            value={formData.patient_satisfaction_score?.toString() || ''}
            onChangeText={(text) =>
              setFormData({ ...formData, patient_satisfaction_score: parseFloat(text) || null })
            }
            keyboardType="decimal-pad"
            placeholder="e.g., 4.5"
            placeholderTextColor="#9ca3af"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>What is the average wait time for appointments in days?</Text>
          <TextInput
            style={styles.inputBox}
            value={formData.average_wait_time_days?.toString() || ''}
            onChangeText={(text) =>
              setFormData({ ...formData, average_wait_time_days: parseFloat(text) || null })
            }
            keyboardType="decimal-pad"
            placeholder="e.g., 7.5"
            placeholderTextColor="#9ca3af"
          />
        </View>

        {/* Section: Notes */}
        <View style={styles.sectionHeaderContainer}>
          <Text style={styles.sectionHeader}>Notes & Observations</Text>
          <Text style={styles.sectionSubtitle}>Additional comments and recommendations</Text>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>What observations or important notes did you make during this survey?</Text>
          <TextInput
            style={[styles.inputBox, styles.textArea]}
            value={formData.surveyor_notes}
            onChangeText={(text) => setFormData({ ...formData, surveyor_notes: text })}
            placeholder="Survey notes and observations..."
            placeholderTextColor="#9ca3af"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>What challenges or problems did the facility face?</Text>
          <TextInput
            style={[styles.inputBox, styles.textArea]}
            value={formData.challenges_faced}
            onChangeText={(text) => setFormData({ ...formData, challenges_faced: text })}
            placeholder="Describe any challenges or issues..."
            placeholderTextColor="#9ca3af"
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>What improvements or changes would you recommend?</Text>
          <TextInput
            style={[styles.inputBox, styles.textArea]}
            value={formData.improvements_needed}
            onChangeText={(text) => setFormData({ ...formData, improvements_needed: text })}
            placeholder="Suggested improvements..."
            placeholderTextColor="#9ca3af"
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Do you have any additional comments or information?</Text>
          <TextInput
            style={[styles.inputBox, styles.textArea]}
            value={formData.additional_notes}
            onChangeText={(text) => setFormData({ ...formData, additional_notes: text })}
            placeholder="Any additional information..."
            placeholderTextColor="#9ca3af"
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        {/* Location */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Please capture the GPS location of the facility *</Text>
          <TouchableOpacity
            style={styles.locationButton}
            onPress={captureLocation}
            disabled={capturingLocation}
          >
            <Location01Icon size={20} color="#07579e" strokeWidth={2} />
            <Text style={styles.locationButtonText}>
              {capturingLocation ? 'Capturing...' : formData.latitude ? 'Update Location' : 'Capture Location'}
            </Text>
          </TouchableOpacity>
          {formData.latitude && formData.longitude && (
            <View style={styles.locationInfo}>
              <Text style={styles.locationText}>
                Lat: {formData.latitude.toFixed(6)}, Lng: {formData.longitude.toFixed(6)}
              </Text>
              {formData.location_accuracy && (
                <Text style={styles.locationAccuracy}>
                  Accuracy: ±{formData.location_accuracy.toFixed(1)}m
                </Text>
              )}
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsColumn}>
          <TouchableOpacity
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={() => handleSave(false)}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>
                Save as Draft
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.submitButton, saving && styles.saveButtonDisabled]}
            onPress={() => handleSave(true)}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>
                Submit for Verification
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelButton} onPress={onBack}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
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
  contentWrapper: {
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingBottom: 16,
    backgroundColor: '#ffffff',
  },
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    gap: 12,
  },
  backIcon: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#374151',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 0,
  },
  halfWidth: {
    flex: 1,
  },
  sectionHeaderContainer: {
    marginTop: 24,
    marginBottom: 20,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    fontWeight: '400',
    color: '#6b7280',
    lineHeight: 20,
  },
  subLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 12,
    marginBottom: 8,
  },
  label: {
    fontSize: 21,
    fontWeight: '600',
    color: '#4b5563',
    marginBottom: 8,
    lineHeight: 30,
  },
  inputBox: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 14,
    fontSize: 18,
    color: '#4b5563',
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 4,
    gap: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 18,
    color: '#4b5563',
  },
  textArea: {
    minHeight: 100,
    paddingTop: 12,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 8,
    paddingVertical: 12,
    gap: 8,
  },
  locationButtonText: {
    fontSize: 18,
    color: '#07579e',
    fontWeight: '600',
  },
  locationInfo: {
    marginTop: 8,
    padding: 12,
    backgroundColor: '#f0f9ff',
    borderRadius: 8,
  },
  locationText: {
    fontSize: 14,
    color: '#1e40af',
    fontWeight: '500',
  },
  locationAccuracy: {
    fontSize: 12,
    color: '#60a5fa',
    marginTop: 4,
  },
  picker: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 14,
  },
  pickerText: {
    fontSize: 18,
    color: '#4b5563',
    flex: 1,
  },
  pickerPlaceholder: {
    fontSize: 18,
    color: '#9ca3af',
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
    marginBottom: 40,
  },
  actionsColumn: {
    gap: 12,
    marginTop: 20,
    marginBottom: 40,
  },
  cancelButton: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  saveButton: {
    backgroundColor: '#6b7280',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  submitButton: {
    backgroundColor: '#07579e',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  serviceList: {
    flex: 1,
    padding: 20,
  },
  serviceItem: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  serviceName: {
    fontSize: 18,
    color: '#4b5563',
  },
});
