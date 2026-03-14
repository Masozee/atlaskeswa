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
import { MaterialIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import * as Speech from 'expo-speech';
import { apiClient } from '../services/api';
import { useSettings, useTheme, useFontScale } from '../contexts/SettingsContext';
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

const toSentenceCase = (text: string): string => {
  if (!text) return text;
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};

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
  const { settings } = useSettings();
  const theme = useTheme();
  const fs = useFontScale();
  const c = theme.colors;
  const [speakingCode, setSpeakingCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [template, setTemplate] = useState<SurveyTemplate | null>(null);
  const [answers, setAnswers] = useState<SurveyAnswers>({});
  const [otherTexts, setOtherTexts] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [currentMtcContext, setCurrentMtcContext] = useState<string>('');
  const [currentMtcLabel, setCurrentMtcLabel] = useState<string>('');

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
    return () => { Speech.stop(); };
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

  // Detect if a question code is a "detail" question (ends with uppercase letter, no trailing digit)
  const isDetailQuestion = (code: string) => /[A-Z]$/.test(code);

  // Build questions map
  const questionsMap = useMemo(() => {
    if (!template?.sections) return new Map<number, Question>();
    return buildQuestionsMap(template.sections);
  }, [template?.sections]);

  // Resolved answers: map "R2|RQA" → "RQA" so flow conditions still work correctly
  const resolvedAnswers = useMemo<SurveyAnswers>(() => {
    if (!currentMtcContext) return answers;
    const resolved: SurveyAnswers = { ...answers };
    const prefix = `${currentMtcContext}|`;
    for (const [key, val] of Object.entries(answers)) {
      if (key.startsWith(prefix)) {
        resolved[key.slice(prefix.length)] = val;
      }
    }
    return resolved;
  }, [answers, currentMtcContext]);

  // Get active sections
  const activeSections = useMemo(() => {
    if (!template?.sections) return [];
    return getActiveSections(template.sections, resolvedAnswers, questionsMap);
  }, [template?.sections, resolvedAnswers, questionsMap]);

  const currentSection = activeSections[currentSectionIndex];

  // Get active questions for current section using flow-based skip logic
  const activeQuestions = useMemo(() => {
    if (!currentSection) return [];
    return getFlowBasedQuestions(currentSection, resolvedAnswers, questionsMap, template?.sections);
  }, [currentSection, resolvedAnswers, questionsMap, template?.sections]);

  // Calculate progress
  const progress = useMemo(() => {
    if (!template?.sections) return 0;
    return calculateProgress(template.sections, resolvedAnswers, questionsMap);
  }, [template?.sections, resolvedAnswers, questionsMap]);

  // Auto-play TTS for the first question when section changes
  useEffect(() => {
    if (settings.ttsEnabled && settings.ttsAutoPlay && setupComplete && activeQuestions.length > 0) {
      const firstQuestion = activeQuestions[0];
      // Small delay to let the UI render first
      const timer = setTimeout(() => {
        speakQuestion(firstQuestion.code, firstQuestion.question_text);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [currentSectionIndex, setupComplete]);

  const handleAnswerChange = (questionCode: string, value: any) => {
    const storageKey = isDetailQuestion(questionCode) && currentMtcContext
      ? `${currentMtcContext}|${questionCode}`
      : questionCode;

    // Detect MTC context change from a choice with cabang_mtc
    const allQuestions = template?.sections?.flatMap(s => s.questions || []) || [];
    const q = allQuestions.find(q => q.code === questionCode);
    const selectedChoice = q?.choices?.find((c: QuestionOption) => c.value === value);

    if (selectedChoice?.cabang_mtc && selectedChoice.cabang_mtc !== currentMtcContext) {
      setAnswers((prev) => {
        const cleaned = { ...prev };
        if (currentMtcContext) {
          const oldPrefix = `${currentMtcContext}|`;
          for (const k of Object.keys(cleaned)) {
            if (k.startsWith(oldPrefix)) delete cleaned[k];
          }
        }
        cleaned[storageKey] = value;
        return cleaned;
      });
      setCurrentMtcContext(selectedChoice.cabang_mtc);
      setCurrentMtcLabel(selectedChoice.label);
    } else {
      setAnswers((prev) => ({ ...prev, [storageKey]: value }));
      if (!isDetailQuestion(questionCode) && !selectedChoice?.cabang_mtc) {
        setCurrentMtcContext('');
        setCurrentMtcLabel('');
      }
    }

    if (errors[storageKey]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[storageKey];
        return newErrors;
      });
    }
  };

  const validateSection = (): boolean => {
    const newErrors: Record<string, string> = {};

    activeQuestions.forEach((question) => {
      const storageKey = isDetailQuestion(question.code) && currentMtcContext
        ? `${currentMtcContext}|${question.code}`
        : question.code;
      const answer = answers[storageKey];
      if (question.is_required) {
        if (answer === null || answer === undefined || answer === '' || (Array.isArray(answer) && answer.length === 0)) {
          newErrors[storageKey] = 'Pertanyaan ini wajib diisi';
        }
      }

      if (question.answer_type === 'LOCATION' && answer) {
        const loc = answer as any;
        if (!loc.koordinat?.latitude || !loc.koordinat?.longitude) {
          newErrors[storageKey] = 'Koordinat harus diisi';
        }
        if (!loc.kecamatan) {
          newErrors[storageKey] = 'Kecamatan harus dipilih';
        }
        if (!loc.desa) {
          newErrors[storageKey] = 'Desa/Kelurahan harus diisi';
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
        const sectionQuestions = getFlowBasedQuestions(activeSections[i], answers, questionsMap, template?.sections);
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
      // Merge otherTexts into answers with __other_text suffix
      const answersWithOther = { ...answers };
      for (const [code, text] of Object.entries(otherTexts)) {
        if (text) answersWithOther[`${code}__other_text`] = text;
      }

      const payload = {
        template: template!.id,
        service: selectedService.id,
        survey_date: surveyDate,
        survey_period_start: periodStart,
        survey_period_end: periodEnd,
        answers: answersWithOther,
      };

      if (responseId) {
        await apiClient.patch(`/surveys/responses/${responseId}/`, payload);
      } else {
        await apiClient.post('/surveys/responses/', payload);
      }

      if (submit) {
        setIsSubmitted(true);
      } else {
        Alert.alert('Berhasil', 'Survei berhasil disimpan');
        onSave();
      }
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

  const speakQuestion = (code: string, text: string) => {
    if (speakingCode === code) {
      Speech.stop();
      setSpeakingCode(null);
      return;
    }
    Speech.stop();
    setSpeakingCode(code);
    Speech.speak(text, {
      language: 'id-ID',
      onDone: () => setSpeakingCode(null),
      onStopped: () => setSpeakingCode(null),
      onError: () => setSpeakingCode(null),
    });
  };

  // Render a single question
  const renderQuestion = (question: Question) => {
    const questionType = question.answer_type;
    const storageKey = isDetailQuestion(question.code) && currentMtcContext
      ? `${currentMtcContext}|${question.code}`
      : question.code;
    const value = answers[storageKey];
    const error = errors[storageKey];

    return (
      <View key={question.code} style={[styles.questionContainer, { backgroundColor: c.background }]}>
        {question.introduction_text ? (
          <View style={styles.introBox}>
            <Text style={styles.introText}>{toSentenceCase(question.introduction_text)}</Text>
          </View>
        ) : null}
        <Text style={styles.questionCode}>{question.code}</Text>
        <View style={styles.questionHeader}>
          <Text style={[styles.questionText, { color: c.textSecondary, fontSize: fs(21) }]}>
            {toSentenceCase(question.question_text)}
            {question.is_required && <Text style={styles.required}> *</Text>}
          </Text>
          {settings.ttsEnabled && (
            <TouchableOpacity
              onPress={() => speakQuestion(question.code, question.question_text)}
              style={styles.speakerButton}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <MaterialIcons
                name="volume-up"
                size={22}
                color={speakingCode === question.code ? '#03979D' : c.textMuted}
              />
            </TouchableOpacity>
          )}
        </View>

        {renderQuestionInput(question, questionType, value)}

        {error ? <Text style={[styles.errorText, { fontSize: fs(12) }]}>{error}</Text> : null}
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
            <MaterialIcons name="event" size={20} color="#6b7280" />
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
              <TouchableOpacity
                style={[styles.choiceAudioBtn, speakingCode === `${question.code}_bool_ya` && styles.choiceAudioBtnActive]}
                onPress={(e) => { e.stopPropagation(); speakQuestion(`${question.code}_bool_ya`, 'Ya'); }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <MaterialIcons name="volume-up" size={14} color={speakingCode === `${question.code}_bool_ya` ? '#03979D' : '#9ca3af'} />
              </TouchableOpacity>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.booleanOption, value === false && styles.booleanSelected]}
              onPress={() => handleAnswerChange(question.code, false)}
            >
              <Text style={[styles.booleanText, value === false && styles.booleanTextSelected]}>Tidak</Text>
              <TouchableOpacity
                style={[styles.choiceAudioBtn, speakingCode === `${question.code}_bool_tidak` && styles.choiceAudioBtnActive]}
                onPress={(e) => { e.stopPropagation(); speakQuestion(`${question.code}_bool_tidak`, 'Tidak'); }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <MaterialIcons name="volume-up" size={14} color={speakingCode === `${question.code}_bool_tidak` ? '#03979D' : '#9ca3af'} />
              </TouchableOpacity>
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

      case 'REPEATING_TABLE':
        return renderRepeatingTable(question, value);

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
        {choices.map((choice) => {
          const choiceSpeakKey = `${question.code}_choice_${choice.value}`;
          return (
          <View key={choice.value}>
            <TouchableOpacity
              style={[styles.choiceOption, value === choice.value && styles.choiceSelected]}
              onPress={() => handleAnswerChange(question.code, choice.value)}
            >
              <View style={[styles.radio, value === choice.value && styles.radioSelected]}>
                {value === choice.value && <View style={styles.radioInner} />}
              </View>
              <Text style={[styles.choiceLabel, value === choice.value && styles.choiceLabelSelected, { flex: 1 }]}>
                {toSentenceCase(choice.label)}
              </Text>
              <TouchableOpacity
                style={[styles.choiceAudioBtn, speakingCode === choiceSpeakKey && styles.choiceAudioBtnActive]}
                onPress={(e) => { e.stopPropagation(); speakQuestion(choiceSpeakKey, choice.label); }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <MaterialIcons name="volume-up" size={14} color={speakingCode === choiceSpeakKey ? '#03979D' : '#9ca3af'} />
              </TouchableOpacity>
            </TouchableOpacity>
            {choice.has_other_input && value === choice.value && (
              <TextInput
                style={styles.otherInput}
                value={otherTexts[question.code] || ''}
                onChangeText={(text) => setOtherTexts((prev) => ({ ...prev, [question.code]: text }))}
                placeholder={choice.other_input_label || 'Sebutkan'}
                placeholderTextColor="#9ca3af"
              />
            )}
          </View>
          );
        })}
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
          const choiceSpeakKey = `${question.code}_choice_${choice.value}`;
          return (
            <View key={choice.value}>
              <TouchableOpacity
                style={[styles.choiceOption, isChecked && styles.choiceSelected]}
                onPress={() => toggleChoice(choice.value)}
              >
                <View style={[styles.checkbox, isChecked && styles.checkboxSelected]}>
                  {isChecked && <MaterialIcons name="check" size={14} color="#fff" />}
                </View>
                <Text style={[styles.choiceLabel, isChecked && styles.choiceLabelSelected, { flex: 1 }]}>
                  {toSentenceCase(choice.label)}
                </Text>
                <TouchableOpacity
                  style={[styles.choiceAudioBtn, speakingCode === choiceSpeakKey && styles.choiceAudioBtnActive]}
                  onPress={(e) => { e.stopPropagation(); speakQuestion(choiceSpeakKey, choice.label); }}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <MaterialIcons name="volume-up" size={14} color={speakingCode === choiceSpeakKey ? '#03979D' : '#9ca3af'} />
                </TouchableOpacity>
              </TouchableOpacity>
              {choice.has_other_input && isChecked && (
                <TextInput
                  style={styles.otherInput}
                  value={otherTexts[question.code] || ''}
                  onChangeText={(text) => setOtherTexts((prev) => ({ ...prev, [question.code]: text }))}
                  placeholder={choice.other_input_label || 'Sebutkan'}
                  placeholderTextColor="#9ca3af"
                />
              )}
            </View>
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
        <MaterialIcons name="arrow-drop-down" size={20} color="#6b7280" />
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
              <MaterialIcons name="arrow-drop-down" size={20} color="#6b7280" />
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
            <MaterialIcons name="place" size={20} color="#03979D" />
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
          <MaterialIcons name="place" size={20} color="#03979D" />
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
        {levels.map((level) => {
          const choiceSpeakKey = `${question.code}_choice_${level.value}`;
          return (
            <TouchableOpacity
              key={level.value}
              style={[styles.choiceOption, value === level.value && styles.choiceSelected]}
              onPress={() => handleAnswerChange(question.code, level.value)}
            >
              <View style={[styles.radio, value === level.value && styles.radioSelected]}>
                {value === level.value && <View style={styles.radioInner} />}
              </View>
              <Text style={[styles.choiceLabel, value === level.value && styles.choiceLabelSelected, { flex: 1 }]}>
                {toSentenceCase(level.label)}
              </Text>
              <TouchableOpacity
                style={[styles.choiceAudioBtn, speakingCode === choiceSpeakKey && styles.choiceAudioBtnActive]}
                onPress={(e) => { e.stopPropagation(); speakQuestion(choiceSpeakKey, level.label); }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <MaterialIcons name="volume-up" size={14} color={speakingCode === choiceSpeakKey ? '#03979D' : '#9ca3af'} />
              </TouchableOpacity>
            </TouchableOpacity>
          );
        })}
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
              <Text style={styles.tableCellLabel}>{toSentenceCase(row.label)}</Text>
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

  const renderRepeatingTable = (question: Question, value: any) => {
    const config = question.table_config;
    if (!config?.columns?.length) {
      return (
        <Text style={{ color: c.textMuted, fontSize: 13 * fs }}>
          Konfigurasi kolom tabel tidak ditemukan.
        </Text>
      );
    }

    const rows: Array<Record<string, string>> = Array.isArray(value) ? value : [{}];

    const updateCell = (rowIndex: number, colCode: string, cellValue: string) => {
      const next = rows.map((r, i) => (i === rowIndex ? { ...r, [colCode]: cellValue } : r));
      handleAnswerChange(question.code, next);
    };

    const addRow = () => handleAnswerChange(question.code, [...rows, {}]);

    const removeRow = (rowIndex: number) => {
      if (rows.length <= 1) return;
      handleAnswerChange(question.code, rows.filter((_, i) => i !== rowIndex));
    };

    return (
      <View style={{ gap: 8 }}>
        <View style={styles.tableContainer}>
          {/* Header */}
          <View style={[styles.tableRow, { backgroundColor: c.border }]}>
            <View style={[styles.tableCell, { width: 32 }]}>
              <Text style={styles.tableHeaderText}>No</Text>
            </View>
            {config.columns.map((col) => (
              <View key={col.code} style={[styles.tableCell, { flex: 1 }]}>
                <Text style={styles.tableHeaderText}>{col.label}</Text>
              </View>
            ))}
            <View style={[styles.tableCell, { width: 32 }]} />
          </View>
          {/* Rows */}
          {rows.map((row, rowIndex) => (
            <View key={rowIndex} style={styles.tableRow}>
              <View style={[styles.tableCell, { width: 32 }]}>
                <Text style={{ fontSize: 12 * fs, color: c.textMuted, textAlign: 'center' }}>{rowIndex + 1}</Text>
              </View>
              {config.columns.map((col) => (
                <View key={col.code} style={[styles.tableCell, { flex: 1 }]}>
                  <TextInput
                    style={styles.tableCellInput}
                    value={row[col.code] || ''}
                    onChangeText={(text) => updateCell(rowIndex, col.code, text)}
                    keyboardType={col.type === 'number' ? 'numeric' : 'default'}
                    placeholder="-"
                    placeholderTextColor="#d1d5db"
                  />
                </View>
              ))}
              <View style={[styles.tableCell, { width: 32 }]}>
                <TouchableOpacity onPress={() => removeRow(rowIndex)} disabled={rows.length <= 1}>
                  <Text style={{ fontSize: 18, color: rows.length <= 1 ? '#d1d5db' : '#ef4444', textAlign: 'center' }}>×</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
        <TouchableOpacity onPress={addRow} style={{ paddingVertical: 4 }}>
          <Text style={{ color: c.primary, fontSize: 13 * fs }}>+ Tambah baris</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // --- LOADING ---
  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#03979D" />
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
              <MaterialIcons name="arrow-back" size={22} color="#374151" />
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
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'android' ? 0 : 0}
      >
        <View style={styles.contentWrapper}>
          <View style={styles.pageHeader}>
            <TouchableOpacity onPress={onBack} style={styles.backIcon}>
              <MaterialIcons name="arrow-back" size={22} color="#374151" />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.content}
            keyboardShouldPersistTaps="handled"
            automaticallyAdjustKeyboardInsets
            contentContainerStyle={{ flexGrow: 1, paddingBottom: 32 }}
          >
            <Text style={styles.templateName}>{toSentenceCase(template.name)}</Text>

            {/* Service Selection */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Fasilitas layanan yang disurvei *</Text>
              <TouchableOpacity style={styles.picker} onPress={() => setShowServicePicker(true)}>
                <Text style={selectedService ? styles.pickerText : styles.pickerPlaceholder}>
                  {selectedService?.name || 'Pilih fasilitas layanan'}
                </Text>
                <MaterialIcons name="arrow-drop-down" size={20} color="#6b7280" />
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
                <MaterialIcons name="event" size={20} color="#6b7280" />
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
                <MaterialIcons name="event" size={20} color="#6b7280" />
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
                <MaterialIcons name="event" size={20} color="#6b7280" />
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

  // --- THANK YOU SCREEN ---
  if (isSubmitted) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', padding: 32 }]}>
        <View style={styles.thankYouIcon}>
          <MaterialIcons name="check-circle" size={56} color="#03979D" />
        </View>
        <Text style={styles.thankYouTitle}>Terima Kasih!</Text>
        <Text style={styles.thankYouSubtitle}>
          Jawaban Anda telah berhasil disimpan. Terima kasih telah mengisi survei ini.
        </Text>
        <TouchableOpacity style={[styles.submitButton, { marginTop: 32, paddingHorizontal: 32 }]} onPress={onSave}>
          <Text style={styles.submitButtonText}>Kembali</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // --- MAIN QUESTIONNAIRE ---
  return (
    <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'android' ? 0 : 0}
      >
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
            <MaterialIcons name="arrow-back" size={22} color="#374151" />
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

        <ScrollView
          ref={scrollRef}
          style={styles.content}
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 32 }}
        >
          {/* Section Header */}
          {currentSection && (
            <View style={styles.sectionHeaderContainer}>
              <Text style={styles.sectionHeader}>{toSentenceCase(currentSection.name)}</Text>
            </View>
          )}

          {/* MTC context banner */}
          {currentMtcContext && activeQuestions.some(q => isDetailQuestion(q.code)) && (
            <View style={styles.mtcBanner}>
              <Text style={styles.mtcBannerLabel}>Sedang mengisi detail untuk: </Text>
              <Text style={styles.mtcBannerCode}>{currentMtcContext}</Text>
              {currentMtcLabel ? <Text style={styles.mtcBannerLabel}> — {toSentenceCase(currentMtcLabel)}</Text> : null}
            </View>
          )}

          {/* Introduction text — contextual note shown before the questions */}
          {currentSection?.introduction_text && (
            <View style={styles.introBox}>
              <Text style={styles.introText}>{toSentenceCase(currentSection.introduction_text)}</Text>
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
  backButtonCentered: { marginTop: 16, paddingVertical: 10, paddingHorizontal: 20, backgroundColor: '#03979D', borderRadius: 8 },
  backButtonText: { color: '#fff', fontWeight: '600', fontSize: 13 },

  // Header
  pageHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 10, gap: 10 },
  backIcon: { padding: 4 },
  sectionIndicator: { fontSize: 12, color: '#6b7280' },

  // Progress
  progressContainer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 6, gap: 8 },
  progressBar: { flex: 1, height: 5, backgroundColor: '#e5e7eb', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#03979D', borderRadius: 3 },
  progressText: { fontSize: 11, fontWeight: '600', color: '#03979D', width: 32, textAlign: 'right' },

  // Content
  content: { flex: 1, padding: 16 },

  // Template info
  templateName: { fontSize: 18, fontWeight: '700', color: '#374151', marginBottom: 16 },
  templateDesc: { fontSize: 12, color: '#6b7280', lineHeight: 18, marginBottom: 16 },

  // Question code
  questionCode: { fontSize: 11, fontWeight: '700', color: '#03979D', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },

  // Section header
  sectionHeaderContainer: { marginBottom: 20 },
  sectionHeader: { fontSize: 16, fontWeight: '700', color: '#374151', marginBottom: 4 },
  sectionSubtitle: { fontSize: 12, color: '#6b7280', lineHeight: 18 },
  introBox: { marginTop: 10, marginBottom: 6, padding: 12, backgroundColor: '#fefce8', borderRadius: 8, borderWidth: 1, borderColor: '#fde68a' },
  introText: { fontSize: 12, color: '#78350f', lineHeight: 18 },
  mtcBanner: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', marginTop: 10, padding: 10, backgroundColor: '#e6f7f7', borderRadius: 8, borderWidth: 1, borderColor: '#b2e0e1' },
  mtcBannerLabel: { fontSize: 12, color: '#4b5563' },
  mtcBannerCode: { fontSize: 12, fontWeight: '700', color: '#03979D' },

  // Form
  formGroup: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: '#4b5563', marginBottom: 6, lineHeight: 18 },

  // Question
  questionContainer: { marginBottom: 28, paddingVertical: 14, paddingHorizontal: 14, borderRadius: 12 },
  questionHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 12 },
  speakerButton: { marginTop: 2, padding: 4 },
  questionText: { flex: 1, fontSize: 14, fontWeight: '600', color: '#374151', lineHeight: 22 },
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
  booleanOption: { flex: 1, flexDirection: 'row', backgroundColor: '#fff', borderRadius: 8, paddingVertical: 12, paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 2, borderColor: '#e5e7eb' },
  booleanSelected: { borderColor: '#03979D', backgroundColor: '#f0f9ff' },
  booleanText: { fontSize: 13, fontWeight: '600', color: '#6b7280' },
  booleanTextSelected: { color: '#03979D' },

  // Choices
  choicesContainer: { gap: 10 },
  choiceOption: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 8, padding: 12, gap: 10, borderWidth: 1.5, borderColor: '#e5e7eb' },
  choiceSelected: { borderColor: '#03979D', backgroundColor: '#f0f9ff' },
  choiceLabelContainer: { flex: 1 },
  choiceLabel: { fontSize: 13, color: '#374151', flex: 1 },
  choiceLabelSelected: { color: '#03979D', fontWeight: '600' },
  choiceHint: { fontSize: 10, color: '#9ca3af', marginTop: 2 },
  otherInput: { marginLeft: 32, marginTop: 4, marginBottom: 4, borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, fontSize: 13, color: '#1A1A1A', backgroundColor: '#fff' },
  choiceAudioBtn: { width: 26, height: 26, borderRadius: 13, borderWidth: 1, borderColor: '#d1d5db', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  choiceAudioBtnActive: { borderColor: '#03979D', backgroundColor: '#e6f7f7' },

  // Radio
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#d1d5db', alignItems: 'center', justifyContent: 'center' },
  radioSelected: { borderColor: '#03979D' },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#03979D' },

  // Checkbox
  checkbox: { width: 20, height: 20, borderRadius: 4, borderWidth: 2, borderColor: '#d1d5db', alignItems: 'center', justifyContent: 'center' },
  checkboxSelected: { borderColor: '#03979D', backgroundColor: '#03979D' },

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
  pickerItemTextSelected: { color: '#03979D', fontWeight: '600' },

  // Location
  locationContainer: { gap: 12 },
  locationField: { gap: 4 },
  locationFieldLabel: { fontSize: 11, fontWeight: '600', color: '#6b7280' },
  locationButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#ffffff', borderRadius: 8, paddingVertical: 10, gap: 6 },
  locationButtonText: { fontSize: 13, color: '#03979D', fontWeight: '600' },
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
  startButton: { flex: 1, backgroundColor: '#03979D', borderRadius: 8, paddingVertical: 12, alignItems: 'center' },
  startButtonText: { fontSize: 14, fontWeight: '600', color: '#fff' },
  nextButton: { flex: 1, backgroundColor: '#03979D', borderRadius: 8, paddingVertical: 12, alignItems: 'center' },
  nextButtonText: { fontSize: 14, fontWeight: '600', color: '#fff' },
  submitButton: { flex: 1, backgroundColor: '#03979D', borderRadius: 8, paddingVertical: 12, alignItems: 'center' },
  submitButtonText: { fontSize: 14, fontWeight: '600', color: '#fff' },
  thankYouIcon: { marginBottom: 16 },
  thankYouTitle: { fontSize: 28, fontWeight: '700', color: '#1a1a1a', marginBottom: 12, textAlign: 'center' },
  thankYouSubtitle: { fontSize: 15, color: '#6b7280', textAlign: 'center', lineHeight: 22, maxWidth: 280 },
  draftButton: { flex: 1, backgroundColor: '#e5e7eb', borderRadius: 8, paddingVertical: 12, alignItems: 'center' },
  draftButtonText: { fontSize: 14, fontWeight: '600', color: '#374151' },
  cancelButton: { flex: 1, backgroundColor: '#e5e7eb', borderRadius: 8, paddingVertical: 12, alignItems: 'center' },
  cancelButtonText: { fontSize: 14, fontWeight: '600', color: '#374151' },
  buttonDisabled: { opacity: 0.6 },
});
