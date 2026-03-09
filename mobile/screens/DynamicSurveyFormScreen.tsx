import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  Alert,
  Switch,
  BackHandler,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  ArrowLeft01Icon,
  ArrowDown01Icon,
  Location01Icon,
  Calendar03Icon,
  Tick02Icon,
} from 'hugeicons-react-native';
import * as Location from 'expo-location';
import { apiClient } from '../services/api';
import type {
  SurveyTemplate,
  QuestionSection,
  Question,
  QuestionOption,
  SurveyAnswers,
  PaginatedResponse,
} from '../lib/types';
import {
  buildQuestionsMap,
  getActiveSections,
  getActiveQuestionsForSection,
  getFlowBasedQuestions,
  calculateProgress,
} from '../lib/question-logic';

interface Service {
  id: number;
  name: string;
  city?: string;
}

interface DynamicSurveyFormScreenProps {
  templateId?: number;
  responseId?: number;
  onBack: () => void;
  onSave: () => void;
}

export default function DynamicSurveyFormScreen({
  templateId,
  responseId,
  onBack,
  onSave,
}: DynamicSurveyFormScreenProps) {
  const scrollRef = useRef<ScrollView>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [template, setTemplate] = useState<SurveyTemplate | null>(null);
  const [answers, setAnswers] = useState<SurveyAnswers>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);

  // Service selection
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [showServicePicker, setShowServicePicker] = useState(false);

  // Survey metadata
  const [surveyDate, setSurveyDate] = useState(new Date().toISOString().split('T')[0]);
  const [periodStart, setPeriodStart] = useState(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [periodEnd, setPeriodEnd] = useState(new Date().toISOString().split('T')[0]);

  // Kecamatan picker state
  const [kecamatanList, setKecamatanList] = useState<{ id: number; name: string }[]>([]);
  const [showKecamatanPicker, setShowKecamatanPicker] = useState<string | null>(null);

  // GPS
  const [capturingLocation, setCapturingLocation] = useState(false);

  // Setup phase (before questionnaire)
  const [setupComplete, setSetupComplete] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  // Handle Android hardware back button
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (showServicePicker) {
        setShowServicePicker(false);
        return true;
      }
      if (showKecamatanPicker) {
        setShowKecamatanPicker(null);
        return true;
      }
      if (setupComplete && currentSectionIndex > 0) {
        handlePrevious();
        return true;
      }
      if (setupComplete) {
        setSetupComplete(false);
        return true;
      }
      // Not in setup — let parent (App.tsx) handle back
      onBack();
      return true;
    });

    return () => backHandler.remove();
  }, [showServicePicker, showKecamatanPicker, setupComplete, currentSectionIndex]);

  const loadData = async () => {
    try {
      // Fetch services
      const servicesData = await apiClient.get<PaginatedResponse<Service>>(
        '/directory/services/',
        { page_size: 100, ordering: 'name' }
      );
      setServices(servicesData.results);

      // Fetch kecamatan for Kebumen (parent=2)
      try {
        const kecData = await apiClient.get<PaginatedResponse<{ id: number; name: string }>>(
          '/surveys/geographic-units/',
          { level: 'KECAMATAN', parent: 2, page_size: 100 }
        );
        setKecamatanList(kecData.results);
      } catch {
        // Geographic units may not be available
      }

      // Determine template ID
      let tplId = templateId;

      if (responseId) {
        // Editing existing response — load it
        const resp = await apiClient.get<any>(`/surveys/responses/${responseId}/`);
        tplId = typeof resp.template === 'object' ? resp.template.id : resp.template;
        setSurveyDate(resp.survey_date);
        if (resp.survey_period_start) setPeriodStart(resp.survey_period_start);
        if (resp.survey_period_end) setPeriodEnd(resp.survey_period_end);

        // Rebuild answers from the API response
        // The API returns `answers` array with typed fields (text_value, number_value, etc.)
        if (resp.answers && Array.isArray(resp.answers)) {
          const loadedAnswers: SurveyAnswers = {};
          for (const ans of resp.answers) {
            const code = ans.question_code;
            if (!code) continue;

            // Reconstruct the answer value from typed fields
            if (ans.selected_choice_values && ans.selected_choice_values.length > 0) {
              // Single or multiple choice
              loadedAnswers[code] = ans.selected_choice_values.length === 1
                ? ans.selected_choice_values[0]
                : ans.selected_choice_values;
            } else if (ans.boolean_value !== null && ans.boolean_value !== undefined) {
              loadedAnswers[code] = ans.boolean_value;
            } else if (ans.number_value !== null && ans.number_value !== undefined) {
              loadedAnswers[code] = ans.number_value;
            } else if (ans.date_value) {
              loadedAnswers[code] = ans.date_value;
            } else if (ans.time_value) {
              loadedAnswers[code] = ans.time_value;
            } else if (ans.table_data !== null && ans.table_data !== undefined) {
              loadedAnswers[code] = ans.table_data;
            } else if (ans.geographic_unit) {
              loadedAnswers[code] = ans.geographic_unit;
            } else if (ans.coverage_level) {
              loadedAnswers[code] = ans.coverage_level;
            } else if (ans.gps_latitude !== null && ans.gps_longitude !== null) {
              loadedAnswers[code] = {
                latitude: ans.gps_latitude,
                longitude: ans.gps_longitude,
              };
            } else if (ans.text_value) {
              loadedAnswers[code] = ans.text_value;
            }
          }
          setAnswers(loadedAnswers);
        }

        if (resp.service) {
          const svc = resp.service;
          const svcId = typeof svc === 'object' ? svc.id : svc;
          const svcName = typeof svc === 'object' ? svc.name : (resp.service_name || '');
          const svcCity = typeof svc === 'object' ? svc.city : (resp.service_city || '');
          setSelectedService({ id: svcId, name: svcName, city: svcCity });
        }
        setSetupComplete(true);
      }

      if (!tplId) {
        // Fetch first active template
        const templates = await apiClient.get<PaginatedResponse<SurveyTemplate>>(
          '/surveys/templates/',
          { is_active: true, page_size: 1 }
        );
        if (templates.results.length > 0) {
          tplId = templates.results[0].id;
        }
      }

      if (tplId) {
        const tpl = await apiClient.get<SurveyTemplate>(`/surveys/templates/${tplId}/`);
        setTemplate(tpl);

        // Auto-populate fixed GEO fields so validation passes
        const geoDefaults: SurveyAnswers = {};
        tpl.sections?.forEach((section) => {
          section.questions?.forEach((q) => {
            if (q.answer_type === 'GEO_PROVINSI') geoDefaults[q.code] = 'Jawa Tengah';
            if (q.answer_type === 'GEO_KABUPATEN') geoDefaults[q.code] = 'Kebumen';
          });
        });
        if (Object.keys(geoDefaults).length > 0) {
          setAnswers((prev) => ({ ...geoDefaults, ...prev }));
        }
      }
    } catch (err: any) {
      console.error('Failed to load data:', err);
      Alert.alert('Error', 'Gagal memuat data survei');
    } finally {
      setLoading(false);
    }
  };

  // Build questions map
  const questionsMap = useMemo(() => {
    if (!template?.sections) return new Map<number, Question>();
    return buildQuestionsMap(template.sections);
  }, [template?.sections]);

  // Get active sections
  const activeSections = useMemo(() => {
    if (!template?.sections) return [];
    return getActiveSections(template.sections, answers, questionsMap);
  }, [template?.sections, answers, questionsMap]);

  const currentSection = activeSections[currentSectionIndex];

  // Get active questions for current section using flow-based skip logic
  const activeQuestions = useMemo(() => {
    if (!currentSection) return [];
    return getFlowBasedQuestions(currentSection, answers, questionsMap);
  }, [currentSection, answers, questionsMap]);

  // Calculate progress
  const progress = useMemo(() => {
    if (!template?.sections) return 0;
    return calculateProgress(template.sections, answers, questionsMap);
  }, [template?.sections, answers, questionsMap]);

  const handleAnswerChange = (questionCode: string, value: any) => {
    setAnswers((prev) => ({ ...prev, [questionCode]: value }));
    if (errors[questionCode]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[questionCode];
        return newErrors;
      });
    }
  };

  const validateSection = (): boolean => {
    const newErrors: Record<string, string> = {};

    activeQuestions.forEach((question) => {
      const answer = answers[question.code];
      if (question.is_required) {
        if (answer === null || answer === undefined || answer === '' || (Array.isArray(answer) && answer.length === 0)) {
          newErrors[question.code] = 'Pertanyaan ini wajib diisi';
        }
      }

      if (question.answer_type === 'LOCATION' && answer) {
        const loc = answer as any;
        if (!loc.koordinat?.latitude || !loc.koordinat?.longitude) {
          newErrors[question.code] = 'Koordinat harus diisi';
        }
        if (!loc.kecamatan) {
          newErrors[question.code] = 'Kecamatan harus dipilih';
        }
        if (!loc.desa) {
          newErrors[question.code] = 'Desa/Kelurahan harus diisi';
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (!validateSection()) {
      Alert.alert('Validasi', 'Mohon lengkapi semua pertanyaan yang wajib diisi');
      return;
    }
    if (currentSectionIndex < activeSections.length - 1) {
      setCurrentSectionIndex((prev) => prev + 1);
      scrollRef.current?.scrollTo({ y: 0, animated: true });
    }
  };

  const handlePrevious = () => {
    if (currentSectionIndex > 0) {
      setCurrentSectionIndex((prev) => prev - 1);
      scrollRef.current?.scrollTo({ y: 0, animated: true });
    }
  };

  const handleSave = async (submit: boolean = false) => {
    if (!selectedService) {
      Alert.alert('Validasi', 'Pilih fasilitas layanan terlebih dahulu');
      return;
    }

    if (submit) {
      // Validate all sections
      const allErrors: Record<string, string> = {};
      let firstFailedSection = -1;
      for (let i = 0; i < activeSections.length; i++) {
        const sectionQuestions = getFlowBasedQuestions(activeSections[i], answers, questionsMap);
        sectionQuestions.forEach((question) => {
          const answer = answers[question.code];
          if (question.is_required) {
            if (answer === null || answer === undefined || answer === '' || (Array.isArray(answer) && answer.length === 0)) {
              allErrors[question.code] = 'Pertanyaan ini wajib diisi';
              if (firstFailedSection === -1) firstFailedSection = i;
            }
          }
          if (question.answer_type === 'LOCATION' && answer) {
            const loc = answer as any;
            if (!loc.koordinat?.latitude || !loc.koordinat?.longitude) {
              allErrors[question.code] = 'Koordinat harus diisi';
              if (firstFailedSection === -1) firstFailedSection = i;
            }
            if (!loc.kecamatan) {
              allErrors[question.code] = 'Kecamatan harus dipilih';
              if (firstFailedSection === -1) firstFailedSection = i;
            }
            if (!loc.desa) {
              allErrors[question.code] = 'Desa/Kelurahan harus diisi';
              if (firstFailedSection === -1) firstFailedSection = i;
            }
          }
        });
      }
      if (Object.keys(allErrors).length > 0) {
        setErrors(allErrors);
        if (firstFailedSection >= 0) setCurrentSectionIndex(firstFailedSection);
        const missingCodes = Object.keys(allErrors).join(', ');
        Alert.alert('Validasi', `Pertanyaan belum diisi: ${missingCodes}`);
        return;
      }
    }

    setSaving(true);
    try {
      const payload = {
        template: template!.id,
        service: selectedService.id,
        survey_date: surveyDate,
        survey_period_start: periodStart,
        survey_period_end: periodEnd,
        answers,
      };

      if (responseId) {
        await apiClient.patch(`/surveys/responses/${responseId}/`, payload);
        Alert.alert('Berhasil', submit ? 'Survei berhasil disubmit' : 'Survei berhasil disimpan');
      } else {
        await apiClient.post('/surveys/responses/', payload);
        Alert.alert('Berhasil', submit ? 'Survei berhasil disubmit' : 'Survei berhasil disimpan');
      }

      onSave();
    } catch (err: any) {
      console.error('Failed to save:', err);
      Alert.alert('Error', err?.message || 'Gagal menyimpan survei');
    } finally {
      setSaving(false);
    }
  };

  const captureGPS = async (questionCode: string) => {
    setCapturingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Izin Ditolak', 'Izin lokasi diperlukan untuk menangkap koordinat GPS');
        setCapturingLocation(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const currentValue = answers[questionCode] || {};
      handleAnswerChange(questionCode, {
        ...currentValue,
        koordinat: {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          accuracy: location.coords.accuracy || null,
        },
      });

      Alert.alert('Berhasil', 'Lokasi berhasil ditangkap');
    } catch (err) {
      Alert.alert('Error', 'Gagal menangkap lokasi');
    } finally {
      setCapturingLocation(false);
    }
  };

  // Render a single question
  const renderQuestion = (question: Question) => {
    const questionType = question.answer_type;
    const value = answers[question.code];
    const error = errors[question.code];

    return (
      <View key={question.code} style={styles.questionContainer}>
        <Text style={styles.questionText}>
          {question.question_text}
          {question.is_required && <Text style={styles.required}> *</Text>}
        </Text>

        {renderQuestionInput(question, questionType, value)}

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </View>
    );
  };

  const renderQuestionInput = (question: Question, type: string, value: any) => {
    switch (type) {
      case 'TEXT':
      case 'PHONE':
      case 'EMAIL':
      case 'URL':
        return (
          <TextInput
            style={styles.inputBox}
            value={value || ''}
            onChangeText={(text) => handleAnswerChange(question.code, text)}
            placeholder={
              type === 'PHONE' ? 'Nomor telepon...' :
              type === 'EMAIL' ? 'Email...' :
              type === 'URL' ? 'URL...' :
              'Ketik jawaban...'
            }
            placeholderTextColor="#9ca3af"
            keyboardType={
              type === 'PHONE' ? 'phone-pad' :
              type === 'EMAIL' ? 'email-address' :
              type === 'URL' ? 'url' :
              'default'
            }
            autoCapitalize={type === 'EMAIL' || type === 'URL' ? 'none' : 'sentences'}
          />
        );

      case 'TEXTAREA':
        return (
          <TextInput
            style={[styles.inputBox, styles.textArea]}
            value={value || ''}
            onChangeText={(text) => handleAnswerChange(question.code, text)}
            placeholder="Ketik jawaban..."
            placeholderTextColor="#9ca3af"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        );

      case 'NUMBER':
      case 'INTEGER':
        return (
          <TextInput
            style={styles.inputBox}
            value={value !== null && value !== undefined ? String(value) : ''}
            onChangeText={(text) => {
              const num = type === 'INTEGER' ? parseInt(text) || '' : parseFloat(text) || '';
              handleAnswerChange(question.code, num === '' ? '' : num);
            }}
            placeholder="0"
            placeholderTextColor="#9ca3af"
            keyboardType={type === 'INTEGER' ? 'number-pad' : 'decimal-pad'}
          />
        );

      case 'DATE':
        return (
          <View style={styles.inputWithIcon}>
            <TextInput
              style={styles.input}
              value={value || ''}
              onChangeText={(text) => handleAnswerChange(question.code, text)}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#9ca3af"
            />
            <Calendar03Icon size={20} color="#6b7280" strokeWidth={2} />
          </View>
        );

      case 'TIME':
        return (
          <TextInput
            style={styles.inputBox}
            value={value || ''}
            onChangeText={(text) => handleAnswerChange(question.code, text)}
            placeholder="HH:MM"
            placeholderTextColor="#9ca3af"
          />
        );

      case 'BOOLEAN':
        return (
          <View style={styles.booleanRow}>
            <TouchableOpacity
              style={[styles.booleanOption, value === true && styles.booleanSelected]}
              onPress={() => handleAnswerChange(question.code, true)}
            >
              <Text style={[styles.booleanText, value === true && styles.booleanTextSelected]}>Ya</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.booleanOption, value === false && styles.booleanSelected]}
              onPress={() => handleAnswerChange(question.code, false)}
            >
              <Text style={[styles.booleanText, value === false && styles.booleanTextSelected]}>Tidak</Text>
            </TouchableOpacity>
          </View>
        );

      case 'SINGLE_CHOICE':
        return renderSingleChoice(question, value);

      case 'MULTIPLE_CHOICE':
        return renderMultipleChoice(question, value);

      case 'GEO_PROVINSI':
        return (
          <View style={[styles.inputBox, styles.disabledInput]}>
            <Text style={styles.disabledText}>Jawa Tengah</Text>
          </View>
        );

      case 'GEO_KABUPATEN':
        return (
          <View style={[styles.inputBox, styles.disabledInput]}>
            <Text style={styles.disabledText}>Kebumen</Text>
          </View>
        );

      case 'GEO_KECAMATAN':
        return renderKecamatanPicker(question, value);

      case 'GEO_DESA':
        return (
          <TextInput
            style={styles.inputBox}
            value={value || ''}
            onChangeText={(text) => handleAnswerChange(question.code, text)}
            placeholder="Nama desa/kelurahan..."
            placeholderTextColor="#9ca3af"
          />
        );

      case 'LOCATION':
        return renderLocationInput(question, value);

      case 'GPS':
        return renderGPSInput(question, value);

      case 'COVERAGE_LEVEL':
        return renderCoverageLevel(question, value);

      case 'STAFF_TABLE':
        return renderStaffTable(question, value);

      case 'DIAGNOSIS_TABLE':
        return renderDiagnosisTable(question, value);

      default:
        return (
          <TextInput
            style={styles.inputBox}
            value={value || ''}
            onChangeText={(text) => handleAnswerChange(question.code, text)}
            placeholder="Ketik jawaban..."
            placeholderTextColor="#9ca3af"
          />
        );
    }
  };

  const renderSingleChoice = (question: Question, value: any) => {
    const choices = question.choices || [];
    return (
      <View style={styles.choicesContainer}>
        {choices.map((choice) => (
          <TouchableOpacity
            key={choice.value}
            style={[styles.choiceOption, value === choice.value && styles.choiceSelected]}
            onPress={() => handleAnswerChange(question.code, choice.value)}
          >
            <View style={[styles.radio, value === choice.value && styles.radioSelected]}>
              {value === choice.value && <View style={styles.radioInner} />}
            </View>
            <Text style={[styles.choiceLabel, value === choice.value && styles.choiceLabelSelected]}>
              {choice.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderMultipleChoice = (question: Question, value: any) => {
    const choices = question.choices || [];
    const selectedValues: string[] = Array.isArray(value) ? value : [];

    const toggleChoice = (choiceValue: string) => {
      const newValues = selectedValues.includes(choiceValue)
        ? selectedValues.filter((v) => v !== choiceValue)
        : [...selectedValues, choiceValue];
      handleAnswerChange(question.code, newValues);
    };

    return (
      <View style={styles.choicesContainer}>
        {choices.map((choice) => {
          const isChecked = selectedValues.includes(choice.value);
          return (
            <TouchableOpacity
              key={choice.value}
              style={[styles.choiceOption, isChecked && styles.choiceSelected]}
              onPress={() => toggleChoice(choice.value)}
            >
              <View style={[styles.checkbox, isChecked && styles.checkboxSelected]}>
                {isChecked && <Tick02Icon size={14} color="#fff" strokeWidth={3} />}
              </View>
              <Text style={[styles.choiceLabel, isChecked && styles.choiceLabelSelected]}>
                {choice.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  const renderKecamatanPicker = (question: Question, value: any) => {
    const selectedName = kecamatanList.find((k) => k.id === value)?.name;

    if (showKecamatanPicker === question.code) {
      return (
        <View>
          <TouchableOpacity
            style={styles.pickerClose}
            onPress={() => setShowKecamatanPicker(null)}
          >
            <Text style={styles.pickerCloseText}>Tutup</Text>
          </TouchableOpacity>
          <ScrollView style={styles.pickerList} nestedScrollEnabled>
            {kecamatanList.map((kec) => (
              <TouchableOpacity
                key={kec.id}
                style={[styles.pickerItem, value === kec.id && styles.pickerItemSelected]}
                onPress={() => {
                  handleAnswerChange(question.code, kec.id);
                  setShowKecamatanPicker(null);
                }}
              >
                <Text style={[styles.pickerItemText, value === kec.id && styles.pickerItemTextSelected]}>
                  {kec.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      );
    }

    return (
      <TouchableOpacity
        style={styles.picker}
        onPress={() => setShowKecamatanPicker(question.code)}
      >
        <Text style={selectedName ? styles.pickerText : styles.pickerPlaceholder}>
          {selectedName || '-- Pilih Kecamatan --'}
        </Text>
        <ArrowDown01Icon size={20} color="#6b7280" strokeWidth={2} />
      </TouchableOpacity>
    );
  };

  const renderLocationInput = (question: Question, value: any) => {
    const loc = value || {};
    const koordinat = loc.koordinat || {};

    return (
      <View style={styles.locationContainer}>
        {/* Province - fixed */}
        <View style={styles.locationField}>
          <Text style={styles.locationFieldLabel}>Provinsi</Text>
          <View style={[styles.inputBox, styles.disabledInput]}>
            <Text style={styles.disabledText}>Jawa Tengah</Text>
          </View>
        </View>

        {/* Kabupaten - fixed */}
        <View style={styles.locationField}>
          <Text style={styles.locationFieldLabel}>Kabupaten/Kota</Text>
          <View style={[styles.inputBox, styles.disabledInput]}>
            <Text style={styles.disabledText}>Kebumen</Text>
          </View>
        </View>

        {/* Kecamatan - dropdown */}
        <View style={styles.locationField}>
          <Text style={styles.locationFieldLabel}>Kecamatan *</Text>
          {showKecamatanPicker === question.code ? (
            <View>
              <TouchableOpacity
                style={styles.pickerClose}
                onPress={() => setShowKecamatanPicker(null)}
              >
                <Text style={styles.pickerCloseText}>Tutup</Text>
              </TouchableOpacity>
              <ScrollView style={styles.pickerList} nestedScrollEnabled>
                {kecamatanList.map((kec) => (
                  <TouchableOpacity
                    key={kec.id}
                    style={[styles.pickerItem, loc.kecamatan === kec.id && styles.pickerItemSelected]}
                    onPress={() => {
                      handleAnswerChange(question.code, { ...loc, kecamatan: kec.id, kecamatan_name: kec.name });
                      setShowKecamatanPicker(null);
                    }}
                  >
                    <Text style={[styles.pickerItemText, loc.kecamatan === kec.id && styles.pickerItemTextSelected]}>
                      {kec.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.picker}
              onPress={() => setShowKecamatanPicker(question.code)}
            >
              <Text style={loc.kecamatan_name ? styles.pickerText : styles.pickerPlaceholder}>
                {loc.kecamatan_name || '-- Pilih Kecamatan --'}
              </Text>
              <ArrowDown01Icon size={20} color="#6b7280" strokeWidth={2} />
            </TouchableOpacity>
          )}
        </View>

        {/* Desa */}
        <View style={styles.locationField}>
          <Text style={styles.locationFieldLabel}>Desa/Kelurahan *</Text>
          <TextInput
            style={styles.inputBox}
            value={loc.desa || ''}
            onChangeText={(text) => handleAnswerChange(question.code, { ...loc, desa: text })}
            placeholder="Nama desa/kelurahan..."
            placeholderTextColor="#9ca3af"
          />
        </View>

        {/* GPS */}
        <View style={styles.locationField}>
          <Text style={styles.locationFieldLabel}>Koordinat GPS *</Text>
          <TouchableOpacity
            style={styles.locationButton}
            onPress={() => captureGPS(question.code)}
            disabled={capturingLocation}
          >
            <Location01Icon size={20} color="#07579e" strokeWidth={2} />
            <Text style={styles.locationButtonText}>
              {capturingLocation ? 'Menangkap...' : koordinat.latitude ? 'Perbarui Lokasi' : 'Dapatkan Lokasi'}
            </Text>
          </TouchableOpacity>
          {koordinat.latitude && koordinat.longitude && (
            <View style={styles.locationInfo}>
              <Text style={styles.locationCoordText}>
                Lat: {koordinat.latitude.toFixed(6)}, Lng: {koordinat.longitude.toFixed(6)}
              </Text>
              {koordinat.accuracy && (
                <Text style={styles.locationAccuracyText}>Akurasi: ±{koordinat.accuracy.toFixed(1)}m</Text>
              )}
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderGPSInput = (question: Question, value: any) => {
    const coords = value || {};
    return (
      <View>
        <TouchableOpacity
          style={styles.locationButton}
          onPress={async () => {
            setCapturingLocation(true);
            try {
              const { status } = await Location.requestForegroundPermissionsAsync();
              if (status !== 'granted') {
                Alert.alert('Izin Ditolak', 'Izin lokasi diperlukan');
                return;
              }
              const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
              handleAnswerChange(question.code, {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                accuracy: location.coords.accuracy,
              });
            } catch {
              Alert.alert('Error', 'Gagal menangkap lokasi');
            } finally {
              setCapturingLocation(false);
            }
          }}
          disabled={capturingLocation}
        >
          <Location01Icon size={20} color="#07579e" strokeWidth={2} />
          <Text style={styles.locationButtonText}>
            {capturingLocation ? 'Menangkap...' : coords.latitude ? 'Perbarui Lokasi' : 'Dapatkan Lokasi'}
          </Text>
        </TouchableOpacity>
        {coords.latitude && (
          <View style={styles.locationInfo}>
            <Text style={styles.locationCoordText}>
              Lat: {coords.latitude.toFixed(6)}, Lng: {coords.longitude.toFixed(6)}
            </Text>
          </View>
        )}
      </View>
    );
  };

  const renderCoverageLevel = (question: Question, value: any) => {
    const levels = [
      { value: 'DESA', label: 'Desa/Kelurahan' },
      { value: 'KECAMATAN', label: 'Kecamatan' },
      { value: 'KABUPATEN', label: 'Kabupaten/Kota' },
      { value: 'PROVINSI', label: 'Provinsi' },
      { value: 'NASIONAL', label: 'Nasional' },
    ];
    return (
      <View style={styles.choicesContainer}>
        {levels.map((level) => (
          <TouchableOpacity
            key={level.value}
            style={[styles.choiceOption, value === level.value && styles.choiceSelected]}
            onPress={() => handleAnswerChange(question.code, level.value)}
          >
            <View style={[styles.radio, value === level.value && styles.radioSelected]}>
              {value === level.value && <View style={styles.radioInner} />}
            </View>
            <Text style={[styles.choiceLabel, value === level.value && styles.choiceLabelSelected]}>
              {level.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const STAFF_ROWS = [
    { code: 'psychiatrist', label: 'Psikiater' },
    { code: 'psychologist', label: 'Psikolog' },
    { code: 'nurse', label: 'Perawat' },
    { code: 'social_worker', label: 'Pekerja Sosial' },
    { code: 'occupational_therapist', label: 'Terapis Okupasi' },
    { code: 'other', label: 'Lainnya' },
  ];

  const DIAGNOSIS_ROWS = [
    { code: 'schizophrenia', label: 'Skizofrenia' },
    { code: 'bipolar', label: 'Bipolar' },
    { code: 'depression', label: 'Depresi' },
    { code: 'anxiety', label: 'Gangguan Cemas' },
    { code: 'substance_use', label: 'Gangguan Penggunaan Zat' },
    { code: 'other', label: 'Lainnya' },
  ];

  const renderTable = (question: Question, value: any, rows: { code: string; label: string }[]) => {
    const tableData = value || {};

    const updateCell = (rowCode: string, colCode: string, cellValue: string) => {
      const newData = { ...tableData };
      if (!newData[rowCode]) newData[rowCode] = {};
      newData[rowCode][colCode] = parseInt(cellValue) || 0;
      handleAnswerChange(question.code, newData);
    };

    return (
      <View style={styles.tableContainer}>
        {/* Header */}
        <View style={styles.tableRow}>
          <View style={[styles.tableCell, styles.tableLabelCell]}>
            <Text style={styles.tableHeaderText}>Kategori</Text>
          </View>
          <View style={styles.tableCell}>
            <Text style={styles.tableHeaderText}>L</Text>
          </View>
          <View style={styles.tableCell}>
            <Text style={styles.tableHeaderText}>P</Text>
          </View>
        </View>
        {/* Rows */}
        {rows.map((row) => (
          <View key={row.code} style={styles.tableRow}>
            <View style={[styles.tableCell, styles.tableLabelCell]}>
              <Text style={styles.tableCellLabel}>{row.label}</Text>
            </View>
            <View style={styles.tableCell}>
              <TextInput
                style={styles.tableCellInput}
                value={String(tableData[row.code]?.male || '')}
                onChangeText={(text) => updateCell(row.code, 'male', text)}
                keyboardType="number-pad"
                placeholder="0"
                placeholderTextColor="#d1d5db"
              />
            </View>
            <View style={styles.tableCell}>
              <TextInput
                style={styles.tableCellInput}
                value={String(tableData[row.code]?.female || '')}
                onChangeText={(text) => updateCell(row.code, 'female', text)}
                keyboardType="number-pad"
                placeholder="0"
                placeholderTextColor="#d1d5db"
              />
            </View>
          </View>
        ))}
      </View>
    );
  };

  const renderStaffTable = (question: Question, value: any) => renderTable(question, value, STAFF_ROWS);
  const renderDiagnosisTable = (question: Question, value: any) => renderTable(question, value, DIAGNOSIS_ROWS);

  // --- LOADING ---
  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#07579e" />
        <Text style={styles.loadingText}>Memuat survei...</Text>
      </View>
    );
  }

  if (!template) {
    return (
      <View style={styles.centered}>
        <Text style={styles.loadingText}>Template survei tidak ditemukan</Text>
        <TouchableOpacity style={styles.backButtonCentered} onPress={onBack}>
          <Text style={styles.backButtonText}>Kembali</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // --- SERVICE PICKER ---
  if (showServicePicker) {
    return (
      <View style={styles.container}>
        <View style={styles.contentWrapper}>
          <View style={styles.pageHeader}>
            <TouchableOpacity onPress={() => setShowServicePicker(false)} style={styles.backIcon}>
              <ArrowLeft01Icon size={22} color="#374151" strokeWidth={2} />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.serviceList}>
            {services.map((service) => (
              <TouchableOpacity
                key={service.id}
                style={styles.serviceItem}
                onPress={() => {
                  setSelectedService(service);
                  setShowServicePicker(false);
                }}
              >
                <Text style={styles.serviceName}>{service.name}</Text>
                {service.city && <Text style={styles.serviceCity}>{service.city}</Text>}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    );
  }

  // --- SETUP PHASE ---
  if (!setupComplete) {
    return (
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.contentWrapper}>
          <View style={styles.pageHeader}>
            <TouchableOpacity onPress={onBack} style={styles.backIcon}>
              <ArrowLeft01Icon size={22} color="#374151" strokeWidth={2} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
            <Text style={styles.templateName}>{template.name}</Text>

            {/* Service Selection */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Fasilitas layanan yang disurvei *</Text>
              <TouchableOpacity style={styles.picker} onPress={() => setShowServicePicker(true)}>
                <Text style={selectedService ? styles.pickerText : styles.pickerPlaceholder}>
                  {selectedService?.name || 'Pilih fasilitas layanan'}
                </Text>
                <ArrowDown01Icon size={20} color="#6b7280" strokeWidth={2} />
              </TouchableOpacity>
            </View>

            {/* Survey Date */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Tanggal survei *</Text>
              <View style={styles.inputWithIcon}>
                <TextInput
                  style={styles.input}
                  value={surveyDate}
                  onChangeText={setSurveyDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#9ca3af"
                />
                <Calendar03Icon size={20} color="#6b7280" strokeWidth={2} />
              </View>
            </View>

            {/* Period */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Periode awal</Text>
              <View style={styles.inputWithIcon}>
                <TextInput
                  style={styles.input}
                  value={periodStart}
                  onChangeText={setPeriodStart}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#9ca3af"
                />
                <Calendar03Icon size={20} color="#6b7280" strokeWidth={2} />
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Periode akhir</Text>
              <View style={styles.inputWithIcon}>
                <TextInput
                  style={styles.input}
                  value={periodEnd}
                  onChangeText={setPeriodEnd}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#9ca3af"
                />
                <Calendar03Icon size={20} color="#6b7280" strokeWidth={2} />
              </View>
            </View>

            {/* Buttons Row */}
            <View style={styles.buttonsRow}>
              <TouchableOpacity style={styles.cancelButton} onPress={onBack}>
                <Text style={styles.cancelButtonText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.startButton, !selectedService && styles.buttonDisabled]}
                onPress={() => {
                  if (!selectedService) {
                    Alert.alert('Validasi', 'Pilih fasilitas layanan terlebih dahulu');
                    return;
                  }
                  setSetupComplete(true);
                }}
                disabled={!selectedService}
              >
                <Text style={styles.startButtonText}>Mulai Survei</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    );
  }

  // --- MAIN QUESTIONNAIRE ---
  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.contentWrapper}>
        {/* Header */}
        <View style={styles.pageHeader}>
          <TouchableOpacity
            onPress={() => {
              if (currentSectionIndex > 0) {
                handlePrevious();
              } else {
                setSetupComplete(false);
              }
            }}
            style={styles.backIcon}
          >
            <ArrowLeft01Icon size={22} color="#374151" strokeWidth={2} />
          </TouchableOpacity>
          <Text style={styles.sectionIndicator}>
            Bagian {currentSectionIndex + 1} / {activeSections.length}
          </Text>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
          <Text style={styles.progressText}>{progress}%</Text>
        </View>

        <ScrollView ref={scrollRef} style={styles.content} keyboardShouldPersistTaps="handled">
          {/* Section Header */}
          {currentSection && (
            <View style={styles.sectionHeaderContainer}>
              <Text style={styles.sectionHeader}>{currentSection.name}</Text>
            </View>
          )}

          {/* Questions */}
          {activeQuestions.map(renderQuestion)}

          {/* Navigation Buttons */}
          <View style={styles.buttonsRow}>
            <TouchableOpacity
              style={[styles.draftButton, saving && styles.buttonDisabled]}
              onPress={() => handleSave(false)}
              disabled={saving}
            >
              <Text style={styles.draftButtonText}>Simpan Draft</Text>
            </TouchableOpacity>
            {currentSectionIndex < activeSections.length - 1 ? (
              <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
                <Text style={styles.nextButtonText}>Selanjutnya</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.submitButton, saving && styles.buttonDisabled]}
                onPress={() => handleSave(true)}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.submitButtonText}>Simpan</Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f6f7' },
  contentWrapper: { flex: 1, backgroundColor: '#f5f6f7' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  loadingText: { marginTop: 12, fontSize: 12, color: '#6b7280' },
  backButtonCentered: { marginTop: 16, paddingVertical: 10, paddingHorizontal: 20, backgroundColor: '#07579e', borderRadius: 8 },
  backButtonText: { color: '#fff', fontWeight: '600', fontSize: 13 },

  // Header
  pageHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 10, gap: 10 },
  backIcon: { padding: 4 },
  sectionIndicator: { fontSize: 12, color: '#6b7280' },

  // Progress
  progressContainer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 6, gap: 8 },
  progressBar: { flex: 1, height: 5, backgroundColor: '#e5e7eb', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#07579e', borderRadius: 3 },
  progressText: { fontSize: 11, fontWeight: '600', color: '#07579e', width: 32, textAlign: 'right' },

  // Content
  content: { flex: 1, padding: 16 },

  // Template info
  templateName: { fontSize: 18, fontWeight: '700', color: '#374151', marginBottom: 16 },
  templateDesc: { fontSize: 12, color: '#6b7280', lineHeight: 18, marginBottom: 16 },

  // Section header
  sectionHeaderContainer: { marginBottom: 20 },
  sectionHeader: { fontSize: 16, fontWeight: '700', color: '#374151', marginBottom: 4 },
  sectionSubtitle: { fontSize: 12, color: '#6b7280', lineHeight: 18 },
  introBox: { marginTop: 10, padding: 12, backgroundColor: '#f0f9ff', borderRadius: 8, borderLeftWidth: 3, borderLeftColor: '#07579e' },
  introText: { fontSize: 12, color: '#1e40af', lineHeight: 18 },

  // Form
  formGroup: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: '#4b5563', marginBottom: 6, lineHeight: 18 },

  // Question
  questionContainer: { marginBottom: 22 },
  questionText: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 6, lineHeight: 20 },
  required: { color: '#dc2626' },
  helpText: { fontSize: 11, color: '#6b7280', marginBottom: 8, lineHeight: 16, fontStyle: 'italic' },
  errorText: { fontSize: 11, color: '#dc2626', marginTop: 4 },

  // Inputs
  inputBox: { backgroundColor: '#ffffff', borderRadius: 8, padding: 12, fontSize: 13, color: '#1a1a1a', borderWidth: 1, borderColor: '#e5e7eb' },
  inputWithIcon: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 3, gap: 6, borderWidth: 1, borderColor: '#e5e7eb' },
  input: { flex: 1, paddingVertical: 8, fontSize: 13, color: '#1a1a1a' },
  textArea: { minHeight: 80, paddingTop: 10, textAlignVertical: 'top' },
  disabledInput: { backgroundColor: '#f3f4f6' },
  disabledText: { fontSize: 13, color: '#9ca3af' },

  // Boolean
  booleanRow: { flexDirection: 'row', gap: 10 },
  booleanOption: { flex: 1, backgroundColor: '#fff', borderRadius: 8, paddingVertical: 12, alignItems: 'center', borderWidth: 2, borderColor: '#e5e7eb' },
  booleanSelected: { borderColor: '#07579e', backgroundColor: '#f0f9ff' },
  booleanText: { fontSize: 13, fontWeight: '600', color: '#6b7280' },
  booleanTextSelected: { color: '#07579e' },

  // Choices
  choicesContainer: { gap: 6 },
  choiceOption: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 8, padding: 12, gap: 10, borderWidth: 1.5, borderColor: '#e5e7eb' },
  choiceSelected: { borderColor: '#07579e', backgroundColor: '#f0f9ff' },
  choiceLabelContainer: { flex: 1 },
  choiceLabel: { fontSize: 13, color: '#374151', flex: 1 },
  choiceLabelSelected: { color: '#07579e', fontWeight: '600' },
  choiceHint: { fontSize: 10, color: '#9ca3af', marginTop: 2 },

  // Radio
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#d1d5db', alignItems: 'center', justifyContent: 'center' },
  radioSelected: { borderColor: '#07579e' },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#07579e' },

  // Checkbox
  checkbox: { width: 20, height: 20, borderRadius: 4, borderWidth: 2, borderColor: '#d1d5db', alignItems: 'center', justifyContent: 'center' },
  checkboxSelected: { borderColor: '#07579e', backgroundColor: '#07579e' },

  // Picker
  picker: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#ffffff', borderRadius: 8, padding: 12 },
  pickerText: { fontSize: 13, color: '#374151', flex: 1 },
  pickerPlaceholder: { fontSize: 13, color: '#9ca3af', flex: 1 },
  pickerClose: { backgroundColor: '#f3f4f6', padding: 8, borderRadius: 8, alignItems: 'center', marginBottom: 4 },
  pickerCloseText: { fontSize: 12, fontWeight: '600', color: '#6b7280' },
  pickerList: { maxHeight: 220, backgroundColor: '#fff', borderRadius: 8 },
  pickerItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  pickerItemSelected: { backgroundColor: '#f0f9ff' },
  pickerItemText: { fontSize: 13, color: '#374151' },
  pickerItemTextSelected: { color: '#07579e', fontWeight: '600' },

  // Location
  locationContainer: { gap: 12 },
  locationField: { gap: 4 },
  locationFieldLabel: { fontSize: 11, fontWeight: '600', color: '#6b7280' },
  locationButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#ffffff', borderRadius: 8, paddingVertical: 10, gap: 6 },
  locationButtonText: { fontSize: 13, color: '#07579e', fontWeight: '600' },
  locationInfo: { marginTop: 6, padding: 10, backgroundColor: '#f0f9ff', borderRadius: 8 },
  locationCoordText: { fontSize: 12, color: '#1e40af', fontWeight: '500' },
  locationAccuracyText: { fontSize: 10, color: '#60a5fa', marginTop: 3 },

  // Table
  tableContainer: { backgroundColor: '#fff', borderRadius: 8, overflow: 'hidden' },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  tableCell: { flex: 1, padding: 8, alignItems: 'center', justifyContent: 'center' },
  tableLabelCell: { flex: 2, alignItems: 'flex-start' },
  tableHeaderText: { fontSize: 11, fontWeight: '700', color: '#6b7280' },
  tableCellLabel: { fontSize: 12, color: '#374151' },
  tableCellInput: { fontSize: 12, color: '#374151', textAlign: 'center', padding: 4, width: '100%' },

  // Service picker
  serviceList: { flex: 1, padding: 16 },
  serviceItem: { backgroundColor: '#fff', borderRadius: 8, padding: 14, marginBottom: 10 },
  serviceName: { fontSize: 14, color: '#374151', fontWeight: '500' },
  serviceCity: { fontSize: 11, color: '#9ca3af', marginTop: 3 },

  // Buttons
  buttonsRow: { flexDirection: 'row', gap: 10, marginTop: 20, marginBottom: 32 },
  startButton: { flex: 1, backgroundColor: '#07579e', borderRadius: 8, paddingVertical: 12, alignItems: 'center' },
  startButtonText: { fontSize: 14, fontWeight: '600', color: '#fff' },
  nextButton: { flex: 1, backgroundColor: '#07579e', borderRadius: 8, paddingVertical: 12, alignItems: 'center' },
  nextButtonText: { fontSize: 14, fontWeight: '600', color: '#fff' },
  submitButton: { flex: 1, backgroundColor: '#07579e', borderRadius: 8, paddingVertical: 12, alignItems: 'center' },
  submitButtonText: { fontSize: 14, fontWeight: '600', color: '#fff' },
  draftButton: { flex: 1, backgroundColor: '#e5e7eb', borderRadius: 8, paddingVertical: 12, alignItems: 'center' },
  draftButtonText: { fontSize: 14, fontWeight: '600', color: '#374151' },
  cancelButton: { flex: 1, backgroundColor: '#e5e7eb', borderRadius: 8, paddingVertical: 12, alignItems: 'center' },
  cancelButtonText: { fontSize: 14, fontWeight: '600', color: '#374151' },
  buttonDisabled: { opacity: 0.6 },
});
