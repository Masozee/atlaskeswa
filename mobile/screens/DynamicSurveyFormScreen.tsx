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
import { ArrowUp01Icon, ArrowDown01Icon } from 'hugeicons-react-native';
import * as Location from 'expo-location';
import * as Speech from 'expo-speech';
import { apiClient } from '../services/api';
import { database } from '../services/database';
import NetInfo from '@react-native-community/netinfo';
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
  getFlowItems,
  getFlowBasedQuestions,
  calculateProgress,
  FlowItem,
} from '../lib/question-logic';

const toSentenceCase = (text: string): string => {
  if (!text) return text;
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};

const toUpper = (text: string): string => {
  if (!text) return text;
  return text.toUpperCase();
};

// Check if GPS coordinates are valid (not null, undefined, or NaN)
const isValidGps = (gps: { latitude: number; longitude: number; accuracy: number | null } | null): boolean => {
  if (!gps) return false;
  const lat = gps.latitude;
  const lng = gps.longitude;
  return (
    lat !== undefined &&
    lat !== null &&
    lng !== undefined &&
    lng !== null &&
    !isNaN(lat as number) &&
    !isNaN(lng as number)
  );
};

// Safe toFixed call - returns formatted string or fallback
const formatGpsCoord = (gps: { latitude: number; longitude: number; accuracy?: number | null } | null, fallback: string = '—'): string => {
  if (!gps) return fallback;
  const lat = gps.latitude;
  const lng = gps.longitude;
  if (lat == null || lng == null || isNaN(lat as number) || isNaN(lng as number)) return fallback;
  return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
};

interface Service {
  id: number;
  name: string;
  city?: string;
  kecamatan?: string;
  kategori_fasilitas?: 'KESEHATAN' | 'NON_KESEHATAN' | '';
  kategori_fasilitas_display?: string;
  mtc_name?: string;
  bsic_name?: string;
  service_type_name?: string;
}

interface DynamicSurveyFormScreenProps {
  templateId?: number;
  responseId?: number;
  onBack: () => void;
  onSave: () => void;
}

// ── InterventionMatrixNewFormat ───────────────────────────────────────────────
// Extracted as a proper React component so that useState is always called
// unconditionally (required by Rules of Hooks). The parent renderInterventionMatrix
// returns early for legacy format, which would have made the hook call conditional.
interface InterventionMatrixNewFormatProps {
  questionCode: string;
  ctx: string;
  value: any;
  config: any;
  onAnswerChange: (code: string, value: any, ctx: string) => void;
}

function InterventionMatrixNewFormat({ questionCode, ctx, value, config, onAnswerChange }: InterventionMatrixNewFormatProps) {
  const theme = useTheme();
  const fs = useFontScale();
  const c = theme.colors;

  // Accordion: only one row expanded at a time (for pre-populated rows, no delete)
  const [expandedRowId, setExpandedRowId] = React.useState<string | null>(null);
  const toggleExpand = (id: string) => setExpandedRowId((prev) => (prev === id ? null : id));

  const genId = () => String(Date.now()) + Math.random().toString(36).slice(2);

  const defaultRows: Array<Record<string, any>> = Array.isArray(config?.default_rows)
    ? (config.default_rows as string[]).map((label: string, i: number) => ({ id: `default_${i}`, label }))
    : [];
  const rows: Array<Record<string, any>> = Array.isArray(value) && value.length > 0 ? value : defaultRows;
  const subQuestions: any[] = config?.sub_questions ?? [];

  const addRow = () => onAnswerChange(questionCode, [...rows, { id: genId(), label: '' }], ctx);
  const deleteRow = (id: string) => onAnswerChange(questionCode, rows.filter((r) => r.id !== id), ctx);
  const updateRowField = (id: string, field: string, val: any) =>
    onAnswerChange(questionCode, rows.map((r) => r.id === id ? { ...r, [field]: val } : r), ctx);

  const renderSubQuestion = (rowId: string, sq: any, rowData: Record<string, any>) => {
    const val = rowData[sq.code];

    if (sq.type === 'number') {
      // TARIF_RATA (number 5): only enable if "Pembayaran Mandiri/Keluarga" is checked in SUMBER_PEMBIAYAAN
      const sumberPembiayaan: string[] = Array.isArray(rowData['SUMBER_PEMBIAYAAN']) ? rowData['SUMBER_PEMBIAYAAN'] : [];
      const isMandiri = sumberPembiayaan.includes('Pembayaran Mandiri/Keluarga');
      const isTARIF = sq.code === 'TARIF_RATA';
      return (
        <TextInput
          style={{ flex: 1, paddingVertical: 10, fontSize: 18, color: isTARIF && !isMandiri ? '#9ca3af' : '#1a1a1a', borderWidth: 1, borderColor: isTARIF && !isMandiri ? '#e5e7eb' : '#e5e7eb', borderRadius: 6, paddingHorizontal: 10, marginTop: 4, backgroundColor: isTARIF && !isMandiri ? '#f9fafb' : 'white' }}
          value={val !== undefined && val !== null ? String(val) : ''}
          onChangeText={isTARIF && !isMandiri ? undefined : (t) => updateRowField(rowId, sq.code, t)}
          keyboardType="numeric"
          placeholder={isTARIF && !isMandiri ? 'Akan aktif jika Mandiri' : '0'}
          placeholderTextColor="#9ca3af"
          editable={!(isTARIF && !isMandiri)}
        />
      );
    }

    if (sq.type === 'multiple_choice') {
      const selected: string[] = Array.isArray(val) ? val : [];
      return (
        <View style={{ marginTop: 6, gap: 6 }}>
          {(sq.options ?? []).map((opt: string) => {
            const checked = selected.includes(opt);
            return (
              <TouchableOpacity
                key={opt}
                onPress={() => {
                  const next = checked ? selected.filter((v) => v !== opt) : [...selected, opt];
                  updateRowField(rowId, sq.code, next);
                }}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
              >
                <View style={{ width: fs(18), height: fs(18), borderWidth: 2, borderColor: checked ? c.primary : '#9ca3af', borderRadius: 4, backgroundColor: checked ? c.primary : 'white', alignItems: 'center', justifyContent: 'center' }}>
                  {checked && <Text style={{ color: 'white', fontSize: fs(11), fontWeight: 'bold' }}>✓</Text>}
                </View>
                <Text style={{ fontSize: fs(13), color: '#374151', flex: 1 }}>{opt}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      );
    }

    if (sq.type === 'operating_hours') {
      // Table layout: [✓ Select] [Day] [Buka] [Tutup] [✓ 24h]
      // 24h toggle disables Buka/Tutup fields
      const opVal: Record<string, { buka: string; tutup: string; is24h: boolean }> = (val && typeof val === 'object') ? val : {};
      const allDays: string[] = sq.days ?? [];
      const toggleDay = (day: string) => {
        if (opVal[day]) {
          const next = { ...opVal };
          delete next[day];
          updateRowField(rowId, sq.code, next);
        } else {
          updateRowField(rowId, sq.code, { ...opVal, [day]: { buka: '', tutup: '', is24h: false } });
        }
      };
      const updateTime = (day: string, field: 'buka' | 'tutup', val: string) => {
        const existing = opVal[day] || { buka: '', tutup: '', is24h: false };
        updateRowField(rowId, sq.code, { ...opVal, [day]: { ...existing, [field]: val } });
      };
      const toggle24h = (day: string) => {
        const existing = opVal[day] || { buka: '', tutup: '', is24h: false };
        updateRowField(rowId, sq.code, { ...opVal, [day]: { ...existing, is24h: !existing.is24h } });
      };
      return (
        <View style={{ marginTop: 6 }}>
          {/* Table header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 4, paddingVertical: 4, backgroundColor: '#f3f4f6', borderRadius: 6, marginBottom: 4 }}>
            <Text style={{ fontSize: fs(10), color: '#6b7280', fontWeight: '700', width: 28, textAlign: 'center' }}>✓</Text>
            <Text style={{ fontSize: fs(10), color: '#6b7280', fontWeight: '700', flex: 1, textAlign: 'center' }}>Hari</Text>
            <Text style={{ fontSize: fs(10), color: '#6b7280', fontWeight: '700', flex: 1, textAlign: 'center' }}>Buka</Text>
            <Text style={{ fontSize: fs(10), color: '#6b7280', fontWeight: '700', flex: 1, textAlign: 'center' }}>Tutup</Text>
            <Text style={{ fontSize: fs(10), color: '#6b7280', fontWeight: '700', width: 36, textAlign: 'center' }}>24h</Text>
          </View>
          {/* Day rows */}
          {allDays.map((day: string) => {
            const entry = opVal[day];
            const isSelected = !!entry;
            const is24h = entry?.is24h ?? false;
            const isDisabled = !isSelected;
            return (
              <View key={day} style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 4, paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' }}>
                {/* Col 1: select checkbox */}
                <TouchableOpacity onPress={() => toggleDay(day)} style={{ width: 28, alignItems: 'center', justifyContent: 'center' }}>
                  <View style={{ width: fs(18), height: fs(18), borderWidth: 2, borderColor: isSelected ? c.primary : '#9ca3af', borderRadius: 4, backgroundColor: isSelected ? c.primary : 'white', alignItems: 'center', justifyContent: 'center' }}>
                    {isSelected && <Text style={{ color: 'white', fontSize: fs(10), fontWeight: 'bold' }}>✓</Text>}
                  </View>
                </TouchableOpacity>
                {/* Col 2: day name */}
                <Text style={{ fontSize: fs(12), color: '#374151', flex: 1, textAlign: 'center', fontWeight: isSelected ? '600' : '400' }}>{day}</Text>
                {/* Col 3: buka time */}
                <TextInput
                  style={{ flex: 1, fontSize: fs(12), color: isDisabled ? '#9ca3af' : '#1a1a1a', backgroundColor: isDisabled ? '#f9fafb' : 'white', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 4, paddingVertical: 6, paddingHorizontal: 6, marginHorizontal: 2 }}
                  value={entry?.buka ?? ''}
                  onChangeText={(t) => updateTime(day, 'buka', t)}
                  placeholder={is24h ? '-' : '09.00'}
                  placeholderTextColor="#d1d5db"
                  editable={!isDisabled && !is24h}
                  keyboardType="numbers-and-punctuation"
                />
                {/* Col 4: tutup time */}
                <TextInput
                  style={{ flex: 1, fontSize: fs(12), color: isDisabled ? '#9ca3af' : '#1a1a1a', backgroundColor: isDisabled ? '#f9fafb' : 'white', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 4, paddingVertical: 6, paddingHorizontal: 6, marginHorizontal: 2 }}
                  value={entry?.tutup ?? ''}
                  onChangeText={(t) => updateTime(day, 'tutup', t)}
                  placeholder={is24h ? '-' : '17.00'}
                  placeholderTextColor="#d1d5db"
                  editable={!isDisabled && !is24h}
                  keyboardType="numbers-and-punctuation"
                />
                {/* Col 5: 24h checkbox */}
                <TouchableOpacity onPress={() => isSelected && toggle24h(day)} style={{ width: 36, alignItems: 'center', justifyContent: 'center' }}>
                  <View style={{ width: fs(18), height: fs(18), borderWidth: 2, borderColor: !isSelected ? '#d1d5db' : is24h ? c.primary : '#9ca3af', borderRadius: 4, backgroundColor: !isSelected ? '#f3f4f6' : is24h ? c.primary : 'white', alignItems: 'center', justifyContent: 'center' }}>
                    {is24h && <Text style={{ color: 'white', fontSize: fs(10), fontWeight: 'bold' }}>✓</Text>}
                  </View>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      );
    }

    if (sq.type === 'boolean') {
      // Support both plain boolean (legacy) and object { bool, text } for keterkaitan follow-up
      // val === true (plain boolean) or val.bool === true (new format)
      const isYaActive = val === true || (typeof val === 'object' && val !== null && (val as any).bool === true);
      const isTidakActive = val === false;
      const extraText = typeof val === 'object' && val !== null ? (val as any).text ?? '' : '';
      return (
        <View style={{ marginTop: 8, gap: 8 }}>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            {/* Ya button */}
            <TouchableOpacity
              onPress={() => updateRowField(rowId, sq.code, { bool: true, text: extraText })}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, borderWidth: 1.5, borderColor: isYaActive ? c.primary : '#d1d5db', backgroundColor: isYaActive ? '#e6f7f7' : 'white' }}
            >
              <View style={{ width: fs(16), height: fs(16), borderRadius: 8, borderWidth: 2, borderColor: isYaActive ? c.primary : '#9ca3af', alignItems: 'center', justifyContent: 'center', backgroundColor: 'white' }}>
                {isYaActive && <View style={{ width: fs(8), height: fs(8), borderRadius: 4, backgroundColor: c.primary }} />}
              </View>
              <Text style={{ fontSize: fs(14), color: isYaActive ? c.primary : '#374151', fontWeight: isYaActive ? '600' : '400' }}>Ya</Text>
            </TouchableOpacity>
            {/* Tidak button */}
            <TouchableOpacity
              onPress={() => updateRowField(rowId, sq.code, false)}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, borderWidth: 1.5, borderColor: isTidakActive ? c.primary : '#d1d5db', backgroundColor: isTidakActive ? '#e6f7f7' : 'white' }}
            >
              <View style={{ width: fs(16), height: fs(16), borderRadius: 8, borderWidth: 2, borderColor: isTidakActive ? c.primary : '#9ca3af', alignItems: 'center', justifyContent: 'center', backgroundColor: 'white' }}>
                {isTidakActive && <View style={{ width: fs(8), height: fs(8), borderRadius: 4, backgroundColor: c.primary }} />}
              </View>
              <Text style={{ fontSize: fs(14), color: isTidakActive ? c.primary : '#374151', fontWeight: isTidakActive ? '600' : '400' }}>Tidak</Text>
            </TouchableOpacity>
          </View>
          {/* Extra text field when Ya is selected (question 9: keterkaitan) */}
          {isYaActive && (
            <TextInput
              style={{ flex: 1, paddingVertical: 10, fontSize: 16, color: '#1a1a1a', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 6, paddingHorizontal: 10 }}
              value={extraText}
              onChangeText={(t) => updateRowField(rowId, sq.code, { bool: true, text: t })}
              placeholder="Jelaskan keterkaitan dengan fasilitas lain..."
              placeholderTextColor="#9ca3af"
              multiline
              numberOfLines={3}
            />
          )}
        </View>
      );
    }

    return (
      <TextInput
        style={{ flex: 1, paddingVertical: 10, fontSize: 18, color: '#1a1a1a', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 6, paddingHorizontal: 10, marginTop: 4 }}
        value={val !== undefined && val !== null ? String(val) : ''}
        onChangeText={(t) => updateRowField(rowId, sq.code, t)}
        placeholder="—"
        placeholderTextColor="#9ca3af"
      />
    );
  };

  return (
    <View style={{ gap: 10, marginTop: 4 }}>
      {rows.map((row, idx) => {
        const isExpanded = expandedRowId === row.id;
        return (
          <View key={row.id} style={{ borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, overflow: 'hidden' }}>
            <TouchableOpacity onPress={() => toggleExpand(row.id)} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#f9fafb', paddingHorizontal: 12, paddingVertical: 10, gap: 8 }}>
              <Text style={{ fontSize: fs(13), color: '#6b7280', fontWeight: '600', minWidth: 20 }}>{idx + 1}.</Text>
              <Text style={{ flex: 1, fontSize: fs(14), color: '#1f2937' }} numberOfLines={isExpanded ? undefined : 1}>{row.label ?? 'Nama intervensi...'}</Text>
              {isExpanded
                ? <ArrowUp01Icon size={fs(18)} color="#6b7280" />
                : <ArrowDown01Icon size={fs(18)} color="#6b7280" />}
              {!row.id.startsWith('default_') && (
                <TouchableOpacity onPress={() => deleteRow(row.id)} style={{ padding: 4 }}>
                  <Text style={{ fontSize: fs(16), color: '#ef4444' }}>×</Text>
                </TouchableOpacity>
              )}
            </TouchableOpacity>
            {isExpanded && (
              <View style={{ paddingHorizontal: 14, paddingBottom: 14, paddingTop: 10, gap: 14 }}>
                {subQuestions.map((sq: any, sqIdx: number) => (
                  <View key={sq.code}>
                    <Text style={{ fontSize: fs(13), color: '#374151', fontWeight: '600', marginBottom: 2 }}>{sqIdx + 1}. {sq.label}</Text>
                    {renderSubQuestion(row.id, sq, row)}
                  </View>
                ))}
              </View>
            )}
          </View>
        );
      })}
      <TouchableOpacity
        onPress={addRow}
        style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderWidth: 1.5, borderColor: c.primary, borderRadius: 10, borderStyle: 'dashed' }}
      >
        <Text style={{ fontSize: fs(20), color: c.primary, lineHeight: fs(22) }}>+</Text>
        <Text style={{ fontSize: fs(14), color: c.primary, fontWeight: '600' }}>Tambah Intervensi</Text>
      </TouchableOpacity>
    </View>
  );
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
  const isDark = theme.dark;
  const [speakingCode, setSpeakingCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [template, setTemplate] = useState<SurveyTemplate | null>(null);
  const [answers, setAnswers] = useState<SurveyAnswers>({});
  const [otherTexts, setOtherTexts] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [currentSectionId, setCurrentSectionId] = useState<number | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [currentMtcContext, setCurrentMtcContext] = useState<string>('');
  const [currentMtcLabel, setCurrentMtcLabel] = useState<string>('');
  const [currentUserName, setCurrentUserName] = useState<string>('');

  // Service selection
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [showServicePicker, setShowServicePicker] = useState(false);
  const [serviceSearch, setServiceSearch] = useState('');
  const [serviceFilter, setServiceFilter] = useState<'ALL' | 'KESEHATAN' | 'NON_KESEHATAN'>('ALL');
  // Add new service modal
  const [showAddServiceModal, setShowAddServiceModal] = useState(false);
  const [newServiceName, setNewServiceName] = useState('');
  const [newServiceKecamatan, setNewServiceKecamatan] = useState<{ id: number; name: string } | null>(null);
  const [newServiceCity, setNewServiceCity] = useState('Kebumen');
  const [addingService, setAddingService] = useState(false);
  const [showNewServiceKecamatanPicker, setShowNewServiceKecamatanPicker] = useState(false);
  // Set of service IDs that already have a survey (to disable them in picker)
  const [usedServiceIds, setUsedServiceIds] = useState<Set<number>>(new Set());

  // Survey metadata - auto-capture device datetime when survey starts
  const [surveyDate, setSurveyDate] = useState('');

  // Auto-capture device datetime on mount
  useEffect(() => {
    const now = new Date();
    const formatted = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}T${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    setSurveyDate(formatted);
  }, []);

  // Kecamatan picker state
  const [kecamatanList, setKecamatanList] = useState<{ id: number; name: string }[]>([]);
  const [showKecamatanPicker, setShowKecamatanPicker] = useState<string | null>(null);

  // Desa picker state - filtered by selected kecamatan
  const [desaList, setDesaList] = useState<{ id: number; name: string }[]>([]);
  const [showDesaPicker, setShowDesaPicker] = useState<string | null>(null);

  // GPS
  const [capturingLocation, setCapturingLocation] = useState(false);
  const [finalGps, setFinalGps] = useState<{ latitude: number; longitude: number; accuracy: number | null } | null>(null);

  // Debug: log GPS state changes
  useEffect(() => {
    console.log(`[GPS] finalGps changed: ${isValidGps(finalGps) ? `${finalGps!.latitude}, ${finalGps!.longitude}` : 'null/undefined'}`);
  }, [finalGps]);
  // Simple confirmation screen before final submit
  const [showConfirmScreen, setShowConfirmScreen] = useState(false);

  // Resume position for edit mode: find the last answered question
  const [resumeFromSection, setResumeFromSection] = useState<number | null>(null);
  const [resumeFromQuestion, setResumeFromQuestion] = useState<number | null>(null);

  // Navigation history for proper back navigation through non-linear flows
  const [navHistory, setNavHistory] = useState<Array<{ sectionId: number | null; questionIndex: number }>>([]);

  // Setup phase (before questionnaire)
  const [setupComplete, setSetupComplete] = useState(false);

  // Intro screen phase (shows teks pengantar before questions)
  const [showIntroScreen, setShowIntroScreen] = useState(false);

  // Local SQLite row id for this survey (set after first local save)
  const [localSurveyId, setLocalSurveyId] = useState<number | null>(null);

  // Survey duration tracking - started_at captured when surveyor begins questions
  const [startedAt, setStartedAt] = useState<string | null>(null);

  // Track whether we're resuming from an edit so we don't reset question index on first section change
  const isResumingFromEdit = useRef(false);

  useEffect(() => {
    loadData();
    return () => { Speech.stop(); };
  }, [responseId]);

  // Reset question index when section changes — but not on initial resume from edit
  useEffect(() => {
    if (!isResumingFromEdit.current) {
      setCurrentQuestionIndex(0);
    }
    isResumingFromEdit.current = false;
  }, [currentSectionId]);

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
      if (showIntroScreen) {
        // Going back from intro screen: use navHistory if available, otherwise fallback
        if (navHistory.length > 0) {
          const prevPos = navHistory[navHistory.length - 1];
          setNavHistory((prev) => prev.slice(0, -1));
          setShowIntroScreen(false);
          setCurrentSectionId(prevPos.sectionId);
          setCurrentQuestionIndex(prevPos.questionIndex);
        } else if (currentSectionIndex > 0) {
          const prevSectionId = activeSections[currentSectionIndex - 1]?.id;
          const prevSection = activeSections[currentSectionIndex - 1];
          const prevSectionQuestions = getFlowBasedQuestions(prevSection!, answers, questionsMap, template?.sections, answers);
          setShowIntroScreen(false);
          if (prevSectionId != null) {
            setCurrentSectionId(prevSectionId);
            setCurrentQuestionIndex(Math.max(0, prevSectionQuestions.length - 1));
          }
        } else {
          setShowIntroScreen(false);
          setSetupComplete(false);
        }
        return true;
      }
      if (setupComplete && currentSectionIndex > 0) {
        handlePrevious();
        return true;
      }
      if (setupComplete) {
        // At first question of first section - use navHistory or go to setup
        if (navHistory.length > 0) {
          const prevPos = navHistory[navHistory.length - 1];
          setNavHistory((prev) => prev.slice(0, -1));
          setCurrentSectionId(prevPos.sectionId);
          setCurrentQuestionIndex(prevPos.questionIndex);
        } else {
          setSetupComplete(false);
        }
        return true;
      }
      // Not in setup — let parent (App.tsx) handle back
      onBack();
      return true;
    });

    return () => backHandler.remove();
  }, [showServicePicker, showKecamatanPicker, setupComplete, currentSectionId, showIntroScreen]);

  const loadData = async () => {
    const netState = await NetInfo.fetch();
    const isOnline = !!(netState.isConnected && netState.isInternetReachable);

    try {
      // ── Services ──────────────────────────────────────────────────────────
      if (isOnline) {
        try {
          const servicesData = await apiClient.get<PaginatedResponse<Service>>(
            '/directory/services/',
            { page_size: 100, ordering: 'name' }
          );
          setServices(servicesData.results);
          await database.saveServices(servicesData.results);
        } catch {
          const cached = await database.getServices();
          setServices(cached);
        }
      } else {
        const cached = await database.getServices();
        setServices(cached);
      }

      // ── Current user ──────────────────────────────────────────────────────
      if (isOnline) {
        try {
          const userData = await apiClient.get<any>('/accounts/users/me/');
          const fullName = userData.full_name
            || (userData.first_name || userData.last_name
              ? `${userData.first_name} ${userData.last_name}`.trim()
              : userData.email?.split('@')[0] || '');
          setCurrentUserName(fullName);
        } catch {
          // user name unavailable
        }
      }

      // ── Load existing survey service IDs (for duplicate disable) ─────────
      if (isOnline) {
        try {
          const responses = await apiClient.get<any>('/surveys/responses/', { page_size: 100 });
          const ids = new Set<number>();
          (responses.results || []).forEach((r: any) => {
            if (r.service && typeof r.service === 'object') ids.add(r.service.id);
            else if (r.service) ids.add(r.service);
          });
          setUsedServiceIds(ids);
        } catch {
          // skip — not critical
        }
      } else {
        try {
          const localSurveys = await database.getSurveys();
          setUsedServiceIds(new Set(localSurveys.map((s: any) => s.service_id)));
        } catch {
          // skip
        }
      }

      // ── Kecamatan (Kebumen, parent=2) ──────────────────────────────────
      if (isOnline) {
        try {
          const kecData = await apiClient.get<PaginatedResponse<{ id: number; name: string }>>(
            '/surveys/geographic-units/',
            { level: 'KECAMATAN', parent: 2, page_size: 100 }
          );
          setKecamatanList(kecData.results);
          await database.saveGeographicUnits('KECAMATAN', 2, kecData.results);
        } catch {
          const cached = await database.getGeographicUnits('KECAMATAN', 2);
          setKecamatanList(cached);
        }
      } else {
        const cached = await database.getGeographicUnits('KECAMATAN', 2);
        setKecamatanList(cached);
      }

      // ── Existing response (edit mode) ──────────────────────────────────
      let tplId = templateId;
      const loadedAnswers: SurveyAnswers = {};
      // Hoist GPS/service fields so they're accessible in outer scope for resume
      let savedLatitude: number | null = null;
      let savedLongitude: number | null = null;
      let savedAccuracy: number | null = null;
      let savedService: { id: number; name: string; city: string } | null = null;

      if (responseId) {
        if (isOnline) {
          try {
            const resp = await apiClient.get<any>(`/surveys/responses/${responseId}/`);
            // Handle template - can be object, number, or null
            const respTemplateId = typeof resp.template === 'object' ? resp.template?.id : resp.template;
            if (respTemplateId) tplId = respTemplateId;
            setSurveyDate(resp.survey_date);
            // Handle GPS - be defensive against undefined/null
            savedLatitude = typeof resp.latitude === 'number' && !isNaN(resp.latitude) ? resp.latitude : null;
            savedLongitude = typeof resp.longitude === 'number' && !isNaN(resp.longitude) ? resp.longitude : null;
            savedAccuracy = typeof resp.location_accuracy === 'number' && !isNaN(resp.location_accuracy) ? resp.location_accuracy : null;

            if (resp.answers && Array.isArray(resp.answers)) {
              for (const ans of resp.answers) {
                const code = ans.question_code;
                if (!code) continue;

                // Detail questions (code ends with uppercase letter) are stored
                // under "context_key|code" so each MTC loop is kept separate.
                const isDetailCode = /[A-Z]$/.test(code);
                const storageKey = isDetailCode && ans.context_key
                  ? `${ans.context_key}|${code}`
                  : code;

                let val: any;
                if (ans.selected_choice_values && ans.selected_choice_values.length > 0) {
                  // Always store as array — MULTIPLE_CHOICE needs an array for multi-select.
                  // SINGLE_CHOICE will be normalized to a scalar after the template loads below.
                  val = ans.selected_choice_values;
                } else if (ans.boolean_value !== null && ans.boolean_value !== undefined) {
                  val = ans.boolean_value;
                } else if (ans.number_value !== null && ans.number_value !== undefined) {
                  val = ans.number_value;
                } else if (ans.date_value) {
                  val = ans.date_value;
                } else if (ans.time_value) {
                  val = ans.time_value;
                } else if (ans.table_data !== null && ans.table_data !== undefined) {
                  val = ans.table_data;
                } else if (ans.geographic_unit) {
                  val = ans.geographic_unit;
                } else if (ans.coverage_level) {
                  val = ans.coverage_level;
                } else if (ans.gps_latitude !== null && ans.gps_longitude !== null) {
                  val = { latitude: ans.gps_latitude, longitude: ans.gps_longitude };
                } else if (ans.text_value) {
                  val = ans.text_value;
                }
                if (val !== undefined) loadedAnswers[storageKey] = val;
              }
              setAnswers(loadedAnswers);
            }

            if (resp.service) {
              const svc = resp.service;
              const svcId = typeof svc === 'object' ? svc.id : svc;
              const svcName = typeof svc === 'object' ? svc.name : (resp.service_name || '');
              const svcCity = typeof svc === 'object' ? svc.city : (resp.service_city || '');
              savedService = { id: svcId, name: svcName, city: svcCity };
              setSelectedService(savedService);
            }
            // Capture started_at from server response for resumed surveys
            if (resp.started_at) {
              setStartedAt(resp.started_at);
            }
          } catch (err) {
            console.warn('Failed to load remote response, trying local:', err);
          }
        }
        // Don't call setSetupComplete here — let the resume block below do it
        // after template is loaded and GPS data is auto-captured
      }

      // ── Template ──────────────────────────────────────────────────────────
      let tpl: SurveyTemplate | null = null;

      if (!tplId && isOnline) {
        try {
          const templates = await apiClient.get<PaginatedResponse<SurveyTemplate>>(
            '/surveys/templates/',
            { is_active: true, page_size: 1 }
          );
          if (templates.results.length > 0) tplId = templates.results[0].id;
        } catch {
          // will fall through to cached template
        }
      }

      if (tplId && isOnline) {
        try {
          tpl = await apiClient.get<SurveyTemplate>(`/surveys/templates/${tplId}/`);
          await database.saveTemplate(tplId, tpl);
        } catch {
          tpl = await database.getTemplate(tplId);
        }
      } else if (tplId) {
        tpl = await database.getTemplate(tplId);
      }

      if (!tpl) {
        tpl = await database.getLatestTemplate();
      }

      if (tpl) {
        setTemplate(tpl);
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

        // Normalize choice answers: SINGLE_CHOICE must be a scalar string (not an array),
        // MULTIPLE_CHOICE must stay as an array. We stored everything as array above so
        // that MULTIPLE_CHOICE always gets an array; now convert SINGLE_CHOICE back.
        if (responseId && Object.keys(loadedAnswers).length > 0) {
          const allQuestions = tpl.sections?.flatMap((s) => s.questions || []) ?? [];
          for (const q of allQuestions) {
            const key = q.code;
            if (loadedAnswers[key] !== undefined && Array.isArray(loadedAnswers[key])) {
              if (q.answer_type === 'SINGLE_CHOICE') {
                // Collapse to scalar (first element)
                loadedAnswers[key] = loadedAnswers[key][0] ?? '';
              }
              // MULTIPLE_CHOICE stays as array — no change needed
            }
          }
          // Re-apply normalized answers so state reflects the correct types
          setAnswers((prev) => ({ ...prev, ...loadedAnswers }));
        }
      } else if (!isOnline) {
        Alert.alert('Offline', 'Tidak ada template tersimpan. Sambungkan ke internet untuk pertama kali.');
      }

      // ── Edit mode: resume from first unanswered question ──────────────────
      // Template must be loaded first (done above) so we can build questionsMap
      if (responseId && tpl) {
        const questionsMapForResume = buildQuestionsMap(tpl.sections ?? []);
        const activeSectionsForResume = getActiveSections(tpl.sections ?? [], loadedAnswers, questionsMapForResume);
        let resumeSectionIdx = 0;
        let resumeItemIdx = 0;
        outer: for (let si = 0; si < activeSectionsForResume.length; si++) {
          const section = activeSectionsForResume[si];
          const flowItems = getFlowItems(section, loadedAnswers, questionsMapForResume, tpl.sections, loadedAnswers);
          for (let fi = 0; fi < flowItems.length; fi++) {
            const item = flowItems[fi];
            if (item.kind === 'question') {
              const answer = loadedAnswers[item.question.code];
              if (answer === null || answer === undefined || answer === '' || (Array.isArray(answer) && answer.length === 0)) {
                // First unanswered question — resume here
                resumeSectionIdx = si;
                resumeItemIdx = fi;
                break outer;
              }
            }
          }
          // All questions in this section are answered — try next section
        }
        isResumingFromEdit.current = true;
        const resumeSectionId = activeSectionsForResume[resumeSectionIdx]?.id ?? null;
        setCurrentSectionId(resumeSectionId);
        setCurrentQuestionIndex(resumeItemIdx);
        setSetupComplete(true);
        // Auto-capture GPS from saved response
        console.log(`[GPS] Loading from saved response: savedLatitude=${savedLatitude}, savedLongitude=${savedLongitude}, savedAccuracy=${savedAccuracy}`);
        if (savedLatitude != null && savedLongitude != null && !isNaN(savedLatitude) && !isNaN(savedLongitude)) {
          console.log(`[GPS] Setting finalGps from saved data`);
          setFinalGps({
            latitude: savedLatitude,
            longitude: savedLongitude,
            accuracy: savedAccuracy,
          });
        }
      } else {
        // New survey — require setup screen (service, date, GPS are mandatory)
        setSetupComplete(false);
      }
      return; // done loading
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

  // Resolved answers: map all "ctx|code" prefixed keys → "code" so flow conditions work
  // This is needed because each detail loop (RQA, DQA, etc.) uses context-prefixed keys
  // to keep answers separate (e.g. "R11|RQA", "R12|RQA"). When the flow evaluator checks
  // conditions like QL1 contains R, it needs to find the plain key resolved.
  const resolvedAnswers = useMemo<SurveyAnswers>(() => {
    const resolved: SurveyAnswers = { ...answers };
    for (const [key, val] of Object.entries(answers)) {
      if (key.includes('|')) {
        const parts = key.split('|');
        const ctx = parts[0];
        const plainKey = parts[1];
        // Only resolve if there's a detail question for this context (avoid collision)
        if (plainKey && !resolved[plainKey]) {
          resolved[plainKey] = val;
        }
      }
    }
    return resolved;
  }, [answers]);

  // Get active sections
  const activeSections = useMemo(() => {
    if (!template?.sections) {
      console.log('[FLOW] activeSections: template.sections is empty/undefined');
      return [];
    }
    const result = getActiveSections(template.sections, resolvedAnswers, questionsMap);
    console.log(`[FLOW] activeSections computed: ${result.map(s => s.code).join(',')} (total ${result.length})`);
    return result;
  }, [template?.sections, resolvedAnswers, questionsMap]);

  // Derive currentSectionIndex from currentSectionId — this survives activeSections recomputation
  // when answers change (prevents navigation to wrong section after activeSections recalculates)
  const currentSectionIndex = useMemo(() => {
    if (currentSectionId === null) return 0;
    const idx = activeSections.findIndex(s => s.id === currentSectionId);
    return idx >= 0 ? idx : 0;
  }, [currentSectionId, activeSections]);

  const currentSection = activeSections[currentSectionIndex];

  // Get flow items for current section — includes both Question pages and Hint pages.
  // Hint pages (introduction_text) appear as SEPARATE screens before the question they introduce.
  const activeFlowItems = useMemo(() => {
    if (!currentSection) return [];
    const items = getFlowItems(currentSection, resolvedAnswers, questionsMap, template?.sections, answers);
    console.log(`[FLOW DEBUG] section=${currentSection.code} count=${items.length}`, items.map(i => i.kind === 'question' ? i.question.code : i.kind === 'hint' ? `HINT:${i.questionCode}` : 'END'));
    return items;
  }, [currentSection, resolvedAnswers, questionsMap, template?.sections, answers]);

  // Per-question MTC context: parallel array to activeFlowItems with the correct MTC context
  // per question. Non-detail questions get '' (no prefix). Detail questions get the context
  // from the most recent FASKSES question whose answer had a cabang_mtc.
  // IMPORTANT: derived entirely from the flow and current answers — no stale state.
  const questionContexts = useMemo<string[]>(() => {
    const allQDefs = template?.sections?.flatMap(s => s.questions || []) ?? [];
    let ctxTracker = '';
    return activeFlowItems.map((item) => {
      if (item.kind === 'hint' || item.kind === 'end_survey') return ctxTracker;
      const question = item.question;
      const isDetail = /[A-Z]$/.test(question.code);

      // For non-detail questions, update context tracker if answer has cabang_mtc
      if (!isDetail) {
        // Look up answer: plain key first, then any prefixed variant (e.g. "R11|RQA")
        const rawAns = answers[question.code] ?? Object.entries(answers).find(([k]) => k.endsWith(`|${question.code}`))?.[1];
        if (rawAns !== null && rawAns !== undefined && rawAns !== '') {
          const qDef = allQDefs.find(q => q.code === question.code);
          const choice = (qDef?.choices as any[])?.find((c: any) => c.value === rawAns);
          // Store BSIC code + narrative: "R1 — Pemantauan Intensitas Tinggi"
          ctxTracker = rawAns + (choice?.cabang_mtc ? ` — ${choice.cabang_mtc}` : (choice?.label ? ` — ${choice.label}` : ''));
        } else {
          ctxTracker = '';
        }
        return '';
      }

      // For detail questions, return current context tracker
      return ctxTracker;
    });
  }, [activeFlowItems, answers, template?.sections]);

  // Calculate progress
  const progress = useMemo(() => {
    if (!template?.sections) return 0;
    return calculateProgress(template.sections, resolvedAnswers, questionsMap, answers);
  }, [template?.sections, resolvedAnswers, questionsMap, answers]);

  // Current flow item helpers for one-per-screen layout
  const totalItemsInSection = activeFlowItems.length;
  const currentFlowItem = activeFlowItems[currentQuestionIndex] ?? null;

  // DEBUG: Detailed flow item logging
  if (activeFlowItems.length > 0) {
    console.log(`[FLOW ITEMS] total=${activeFlowItems.length} currentIdx=${currentQuestionIndex}`, activeFlowItems.map((item, i) => `${i}:${item?.kind ?? 'null'}${item?.kind === 'question' ? ':' + item.question.code : item?.kind === 'hint' ? ':' + item.questionCode : item?.kind === 'end_survey' ? ':END' : ''}`));
  }

  // The active Question (null when current item is a hint page)
  const currentQ =
    currentFlowItem?.kind === 'question' ? currentFlowItem.question : null;

  const currentQCtx = questionContexts[currentQuestionIndex] ?? '';

  // Auto-play TTS for the first question when section changes
  useEffect(() => {
    if (settings.ttsEnabled && settings.ttsAutoPlay && setupComplete && activeFlowItems.length > 0) {
      // Find first question item
      const firstQ = activeFlowItems.find((item): item is { kind: 'question'; question: Question } => item.kind === 'question');
      if (firstQ) {
        const timer = setTimeout(() => {
          speakQuestion(firstQ.question.code, firstQ.question.question_text);
        }, 500);
        return () => clearTimeout(timer);
      }
    }
  }, [currentSectionIndex, setupComplete]);

  // Auto-save draft when confirm screen appears so answers are safe before submit
  useEffect(() => {
    if (showConfirmScreen) {
      handleSave(false, true);
    }
  }, [showConfirmScreen]);

  // DEBUG: log navigation state changes
  useEffect(() => {
    console.log(`[NAV DEBUG] qIdx=${currentQuestionIndex}/${activeFlowItems.length} secIdx=${currentSectionIndex}/${activeSections.length} currentQ=${currentQ?.code ?? 'null'} totalSections=${activeSections.length} showIntro=${showIntroScreen}`);
  }, [currentQuestionIndex, currentSectionIndex, activeFlowItems.length, showIntroScreen]);

  // ctxOverride: the per-question MTC context (from questionContexts). Falls back to
  // currentMtcContext when not provided. Answers always accumulate — no context clearing.
  const handleAnswerChange = (questionCode: string, value: any, ctxOverride?: string) => {
    // DEBUG: log current section state when answer changes
    console.log(`[ANSWER] changing ${questionCode} to ${JSON.stringify(value)}, currentSectionId=${currentSectionId}, currentSectionIndex=${currentSectionIndex}, activeSections.length=${activeSections.length}`);
    // Detect MTC context change from the selected choice's cabang_mtc
    const allQuestions = template?.sections?.flatMap(s => s.questions || []) || [];
    const q = allQuestions.find(q => q.code === questionCode);
    const selectedChoice = q?.choices?.find((c: QuestionOption) => c.value === value);

    // Determine context: use explicit override, or derive from the selected choice's cabang_mtc
    const newCtx = selectedChoice?.cabang_mtc || '';
    const ctx = ctxOverride !== undefined ? ctxOverride : (newCtx || currentMtcContext);

    const storageKey = isDetailQuestion(questionCode) && ctx
      ? `${ctx}|${questionCode}`
      : questionCode;

    // Always accumulate — each context uses a different prefixed key, no collisions
    setAnswers((prev) => ({ ...prev, [storageKey]: value }));

    if (newCtx && newCtx !== currentMtcContext) {
      setCurrentMtcContext(newCtx);
      // Use cabang_mtc (the narrative like "Pemantauan Intensitas Tinggi") instead of label
      setCurrentMtcLabel(selectedChoice?.cabang_mtc || selectedChoice?.label || '');
    }
    // Clear context when answering a non-detail question with no new context.
    // This prevents stale context from leaking into subsequent detail questions
    // when the user goes back and changes a non-detail MC answer.
    if (!isDetailQuestion(questionCode) && !newCtx) {
      setCurrentMtcContext('');
      setCurrentMtcLabel('');
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
    if (!currentSection) return true;

    const sectionQuestions = getFlowBasedQuestions(
      currentSection, resolvedAnswers, questionsMap, template?.sections, answers
    );

    sectionQuestions.forEach((question, idx) => {
      const ctx = questionContexts[idx] ?? '';
      const storageKey = isDetailQuestion(question.code) && ctx
        ? `${ctx}|${question.code}`
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

  const validateQuestion = (question: Question, ctx: string): boolean => {
    const storageKey = isDetailQuestion(question.code) && ctx
      ? `${ctx}|${question.code}`
      : question.code;
    const answer = answers[storageKey];
    if (question.is_required) {
      if (answer === null || answer === undefined || answer === '' || (Array.isArray(answer) && answer.length === 0)) {
        return false;
      }
    }
    if (question.answer_type === 'LOCATION' && answer) {
      const loc = answer as any;
      if (!loc.koordinat?.latitude || !loc.koordinat?.longitude) return false;
      if (!loc.kecamatan) return false;
      if (!loc.desa) return false;
    }
    return true;
  };

  const captureFinalGPS = async () => {
    setCapturingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Izin Ditolak', 'Izin lokasi diperlukan untuk melanjutkan');
        return;
      }
      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      console.log(`[GPS] captureFinalGPS success: ${location.coords.latitude}, ${location.coords.longitude} (±${location.coords.accuracy}m)`);
      setFinalGps({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy || null,
      });
    } catch {
      Alert.alert('Error', 'Gagal menangkap lokasi. Coba lagi.');
    } finally {
      setCapturingLocation(false);
    }
  };

  const handleNext = () => {
    console.log(`[NAV] handleNext sectionIdx=${currentSectionIndex}/${activeSections.length} qIdx=${currentQuestionIndex}/${activeFlowItems.length} section=${currentSection?.code}`);
    // Push current position to history before advancing
    const currentPos = { sectionId: currentSectionId, questionIndex: currentQuestionIndex };

    // Helper to find next section index with non-empty flow, or -1 if none
    const findNextNonEmptySection = (startIdx: number): number => {
      for (let i = startIdx; i < activeSections.length; i++) {
        const section = activeSections[i];
        const flow = getFlowItems(section, resolvedAnswers, questionsMap, template?.sections, answers);
        if (flow.length > 0) return i;
      }
      return -1;
    };

    // If current item is END_SURVEY sentinel, go straight to confirm/submit screen
    if (currentFlowItem?.kind === 'end_survey') {
      setShowConfirmScreen(true);
      return;
    }

    // If current item is a HINT page, just advance to the next item (no validation needed)
    if (!currentFlowItem || currentFlowItem.kind === 'hint') {
      const nextIndex = currentQuestionIndex + 1;
      if (nextIndex < activeFlowItems.length) {
        setNavHistory((prev) => [...prev, currentPos]);
        setCurrentQuestionIndex(nextIndex);
        scrollRef.current?.scrollTo({ y: 0, animated: true });
      } else {
        const nextSectionIdx = findNextNonEmptySection(currentSectionIndex + 1);
        if (nextSectionIdx === -1) {
          setShowConfirmScreen(true);
        } else {
          const nextSection = activeSections[nextSectionIdx];
          if (nextSection?.introduction_text) {
            setNavHistory((prev) => [...prev, currentPos]);
            setCurrentSectionId(nextSection.id);
            setCurrentQuestionIndex(0);
            setShowIntroScreen(true);
          } else {
            setNavHistory((prev) => [...prev, currentPos]);
            setCurrentSectionId(nextSection.id);
            setCurrentQuestionIndex(0);
          }
        }
        scrollRef.current?.scrollTo({ y: 0, animated: true });
      }
      return;
    }

    // Current is a QUESTION — validate before advancing
    if (!validateQuestion(currentQ!, currentQCtx)) {
      Alert.alert('Validasi', 'Pertanyaan ini wajib diisi');
      return;
    }

    const nextIndex = currentQuestionIndex + 1;
    if (nextIndex < activeFlowItems.length) {
      setNavHistory((prev) => [...prev, currentPos]);
      setCurrentQuestionIndex(nextIndex);
      scrollRef.current?.scrollTo({ y: 0, animated: true });
    } else {
      const nextSectionIdx = findNextNonEmptySection(currentSectionIndex + 1);
      if (nextSectionIdx === -1) {
        setShowConfirmScreen(true);
      } else {
        const nextSection = activeSections[nextSectionIdx];
        console.log(`[NAV] Transitioning to section ${nextSection?.code} introduction_text="${nextSection?.introduction_text?.substring(0, 50) ?? 'none'}"`);
        // Always skip section intro when using "Next" - go directly to first question
        // The section intro can be accessed via "Back" navigation if user wants to review it
        setNavHistory((prev) => [...prev, currentPos]);
        setCurrentSectionId(nextSection.id);
        setCurrentQuestionIndex(0);
        setShowIntroScreen(false);
      }
      scrollRef.current?.scrollTo({ y: 0, animated: true });
    }
  };

  const handlePrevious = () => {
    // If we have navigation history, use it to go back through the actual path taken
    if (navHistory.length > 0) {
      const prevPos = navHistory[navHistory.length - 1];
      setNavHistory((prev) => prev.slice(0, -1));
      setCurrentSectionId(prevPos.sectionId);
      setCurrentQuestionIndex(prevPos.questionIndex);
      scrollRef.current?.scrollTo({ y: 0, animated: true });
      return;
    }
    // Fallback: simple index-based back
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
      scrollRef.current?.scrollTo({ y: 0, animated: true });
    } else if (currentSectionIndex > 0) {
      const newSectionId = activeSections[currentSectionIndex - 1]?.id;
      const prevSection = activeSections[currentSectionIndex - 1];
      const prevFlowItems = getFlowItems(prevSection!, answers, questionsMap, template?.sections, answers);
      if (newSectionId != null) {
        setCurrentSectionId(newSectionId);
        setCurrentQuestionIndex(Math.max(0, prevFlowItems.length - 1));
      }
      scrollRef.current?.scrollTo({ y: 0, animated: true });
    } else {
      setSetupComplete(false);
    }
  };

  const handleSave = async (submit: boolean = false, silent: boolean = false) => {
    if (!selectedService) {
      if (!silent) Alert.alert('Validasi', 'Pilih fasilitas layanan terlebih dahulu');
      return;
    }

    // ── Duplicate check: prevent same service + template ───────────────────
    // Skip duplicate check when: silent auto-save, editing existing, or already have local draft
    if (!responseId && !silent && !localSurveyId) {
      // Only check when creating a NEW survey (not editing) and user-initiated save
      const existing = await database.getExistingSurveyForService(selectedService.id, template!.id);
      if (existing) {
        Alert.alert(
          'Duplikat',
          `Survei untuk "${selectedService.name}" sudah ada.\n\nBuka yang tersimpan atau buat baru?`,
          [
            { text: 'Batal', style: 'cancel' },
            { text: 'Lihat Tersimpan', onPress: () => { onSave(); } },
          ]
        );
        return;
      }
    }

    if (submit) {
      // Validate all sections
      const allErrors: Record<string, string> = {};
      let firstFailedSection = -1;
      for (let i = 0; i < activeSections.length; i++) {
        const sectionQuestions = getFlowBasedQuestions(activeSections[i], answers, questionsMap, template?.sections, answers);
        sectionQuestions.forEach((question) => {
          // Check plain answer first, then any context-prefixed variant (e.g. "R2|RQA")
          const plainAnswer = answers[question.code];
          const answer = plainAnswer !== undefined
            ? plainAnswer
            : Object.entries(answers).find(([k]) => k.endsWith(`|${question.code}`))?.[1];
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
        if (firstFailedSection >= 0) {
          const failedSectionId = activeSections[firstFailedSection]?.id;
          if (failedSectionId != null) setCurrentSectionId(failedSectionId);
        }
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

      const answersJson = JSON.stringify(answersWithOther);

      // ── 1. Always save to local SQLite first ────────────────────────────
      let currentLocalId = localSurveyId;
      const dbStatus = submit ? 'SUBMITTED' : 'DRAFT';
      if (currentLocalId) {
        await database.updateSurveyLocal(currentLocalId, {
          service_id: selectedService.id,
          service_name: selectedService.name,
          service_city: selectedService.city,
          survey_date: surveyDate,
          gps_latitude: finalGps?.latitude ?? null,
          gps_longitude: finalGps?.longitude ?? null,
          answers_json: answersJson,
          verification_status: dbStatus,
        });
        console.log(`[GPS] Saved to local DB: lat=${finalGps?.latitude ?? 'null'}, lng=${finalGps?.longitude ?? 'null'}`);
      } else {
        const newLocalId = await database.saveSurveyLocal({
          server_id: responseId ?? null,
          template_id: template!.id,
          service_id: selectedService.id,
          service_name: selectedService.name,
          service_city: selectedService.city,
          survey_date: surveyDate,
          gps_latitude: finalGps?.latitude ?? null,
          gps_longitude: finalGps?.longitude ?? null,
          answers_json: answersJson,
          verification_status: dbStatus,
          pending_action: responseId ? 'update' : 'create',
        });
        setLocalSurveyId(newLocalId);
        currentLocalId = newLocalId;
      }

      // ── 2. Try to sync to server if online ─────
      // Both drafts and submits are synced to server for backup.
      // Draft saves send verification_status=DRAFT so they stay as draft on server.
      const netState = await NetInfo.fetch();
      const isOnline = !!(netState.isConnected && netState.isInternetReachable);

      if (isOnline) {
        try {
          const payload: Record<string, unknown> = {
            template: template!.id,
            service: selectedService.id,
            survey_date: surveyDate,
            answers: answersWithOther,
          };
          // Include started_at if captured (for new surveys or resumed ones)
          if (startedAt) {
            payload.started_at = startedAt;
          }
          if (finalGps) {
            console.log(`[GPS] Saving to server: lat=${finalGps.latitude}, lng=${finalGps.longitude}`);
            payload.gps_latitude = finalGps.latitude;
            payload.gps_longitude = finalGps.longitude;
          } else {
            console.log(`[GPS] WARNING: finalGps is null, not saving GPS to server`);
          }

          // If saving as draft, explicitly send DRAFT status (otherwise backend auto-submits)
          if (!submit) {
            payload.verification_status = 'DRAFT';
          }

          if (responseId) {
            // When submitting an existing draft, explicitly set SUBMITTED status
            if (submit) {
              payload.verification_status = 'SUBMITTED';
            }
            await apiClient.patch(`/surveys/responses/${responseId}/`, payload);
            await database.markSurveySynced(currentLocalId);
          } else {
            const created = await apiClient.post('/surveys/responses/', payload) as any;
            if (currentLocalId) {
              await database.markSurveySynced(currentLocalId, created?.id);
            }
          }
        } catch (syncErr: any) {
          console.warn('Server sync failed:', syncErr?.message);
          // Don't block - draft is still saved locally
          if (!silent) {
            Alert.alert('Peringatan', 'Survei disimpan lokal, gagal sync ke server.');
          }
        }
      }

      if (submit) {
        setIsSubmitted(true);
      } else if (!silent) {
        Alert.alert('Berhasil', isOnline ? 'Survei berhasil disimpan' : 'Survei disimpan lokal, akan dikirim saat online');
        onSave();
      }
    } catch (err: any) {
      console.error('Failed to save:', err);
      Alert.alert('Error', err?.message || 'Gagal menyimpan survei');
    } finally {
      setSaving(false);
    }
  };

  const captureGPS = async (questionCode: string, ctx: string = '') => {
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
      }, ctx);

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

  // Render a single question. idx is the position in activeQuestions for context lookup.
  // Contextual hint: build a map of question code → hint text for all questions
  // in the active flow. This runs once per section so hints are always available.
  const questionHintsMap = useMemo(() => {
    const map: Record<string, string> = {};
    if (!template?.sections || !currentSection) return map;
    for (const section of template.sections) {
      if (!section.questions) continue;
      for (const q of section.questions) {
        if (q.introduction_text && q.introduction_text.trim()) {
          map[q.code] = q.introduction_text.trim();
        }
      }
    }
    return map;
  }, [template?.sections]);

  // Render a HINT page — shown as a full screen BEFORE the question it introduces
  const renderHintPage = (hintItem: FlowItem & { kind: 'hint' }) => {
    return (
      <View style={[styles.questionContainer, { backgroundColor: c.background }]}>
        <Text style={[styles.questionCode, { color: c.primary }]}>{hintItem.questionCode}</Text>
        <View style={styles.hintPageText}>
          <Text style={[styles.hintPageBodyText, { fontSize: fs(15), color: c.textSecondary, lineHeight: fs(22) }]}>
            {toUpper(hintItem.hintText)}
          </Text>
        </View>
      </View>
    );
  };

  const renderQuestion = (question: Question, idx: number) => {
    const questionType = question.answer_type;
    const ctx = questionContexts[idx] ?? '';
    const storageKey = isDetailQuestion(question.code) && ctx
      ? `${ctx}|${question.code}`
      : question.code;
    const value = answers[storageKey];
    const error = errors[storageKey];

    return (
      <View key={`${ctx}-${question.code}-${idx}`} style={[styles.questionContainer, { backgroundColor: c.background }]}>
        <Text style={[styles.questionCode, { color: c.primary }]}>{question.code}</Text>
        <View style={styles.questionHeader}>
          <Text style={[styles.questionText, { color: c.text, fontSize: fs(26) }]}>
            {toUpper(question.question_text)}
            {question.is_required && <Text style={[styles.required, { color: '#ef4444' }]}> *</Text>}
          </Text>
          {settings.ttsEnabled && (
            <TouchableOpacity
              onPress={() => speakQuestion(question.code, question.question_text)}
              style={styles.speakerButton}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <MaterialIcons
                name="volume-up"
                size={28}
                color={speakingCode === question.code ? c.primary : c.textMuted}
              />
            </TouchableOpacity>
          )}
        </View>

        {renderQuestionInput(question, questionType, value, ctx)}

        {error ? <Text style={[styles.errorText, { fontSize: fs(12) }]}>{error}</Text> : null}
      </View>
    );
  };

  const renderQuestionInput = (question: Question, type: string, value: any, ctx: string = '') => {
    switch (type) {
      case 'TEXT':
      case 'PHONE':
      case 'EMAIL':
      case 'URL':
        return (
          <TextInput
            style={{
              backgroundColor: c.surface,
              borderRadius: 6,
              padding: 16,
              fontSize: 18,
              color: c.text,
              borderWidth: 1,
              borderColor: c.border,
            }}
            value={value || ''}
            onChangeText={(text) => handleAnswerChange(question.code, text, ctx)}
            placeholder={
              type === 'PHONE' ? 'Nomor telepon...' :
              type === 'EMAIL' ? 'Email...' :
              type === 'URL' ? 'URL...' :
              'Ketik jawaban...'
            }
            placeholderTextColor={c.textMuted}
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
            style={{
              backgroundColor: c.surface,
              borderRadius: 6,
              padding: 16,
              fontSize: 18,
              color: c.text,
              borderWidth: 1,
              borderColor: c.border,
              textAlignVertical: 'top',
              minHeight: 120,
            }}
            value={value || ''}
            onChangeText={(text) => handleAnswerChange(question.code, text, ctx)}
            placeholder="Ketik jawaban..."
            placeholderTextColor={c.textMuted}
            multiline
            numberOfLines={4}
          />
        );

      case 'NUMBER':
      case 'INTEGER':
        return (
          <TextInput
            style={{
              backgroundColor: c.surface,
              borderRadius: 6,
              padding: 16,
              fontSize: 18,
              color: c.text,
              borderWidth: 1,
              borderColor: c.border,
            }}
            value={value !== null && value !== undefined ? String(value) : ''}
            onChangeText={(text) => {
              const num = type === 'INTEGER' ? parseInt(text) || '' : parseFloat(text) || '';
              handleAnswerChange(question.code, num === '' ? '' : num, ctx);
            }}
            placeholder="0"
            placeholderTextColor={c.textMuted}
            keyboardType={type === 'INTEGER' ? 'number-pad' : 'decimal-pad'}
          />
        );

      case 'DATE':
        return (
          <View style={styles.inputWithIcon}>
            <TextInput
              style={{
                flex: 1,
                backgroundColor: c.surface,
                borderRadius: 6,
                padding: 16,
                fontSize: 18,
                color: c.text,
                borderWidth: 1,
                borderColor: c.border,
              }}
              value={value || ''}
              onChangeText={(text) => handleAnswerChange(question.code, text, ctx)}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={c.textMuted}
            />
            <MaterialIcons name="event" size={20} color={c.textMuted} />
          </View>
        );

      case 'TIME':
        return (
          <TouchableOpacity
            onPress={() => setShowTimePicker({ code: question.code, value: value || '', ctx: ctx })}
            style={{
              backgroundColor: c.surface,
              borderRadius: 6,
              padding: 16,
              borderWidth: 1,
              borderColor: c.border,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Text style={{ color: value ? c.text : c.textMuted, fontSize: 18 }}>
              {value || 'HH:MM (24 Jam)'}
            </Text>
            <MaterialIcons name="access-time" size={22} color={c.textMuted} />
          </TouchableOpacity>
        );

      case 'BOOLEAN':
        return (
          <View style={styles.booleanRow}>
            <TouchableOpacity
              style={[
                styles.booleanOption,
                {
                  backgroundColor: c.surface,
                  borderColor: value === true ? '#03979D' : c.border,
                },
                value === true && { backgroundColor: '#f0f9ff', borderColor: '#03979D' },
              ]}
              onPress={() => handleAnswerChange(question.code, true, ctx)}
            >
              <Text style={[
                styles.booleanText,
                { color: c.text },
                value === true && { color: '#03979D', fontWeight: '700' },
              ]}>Ya</Text>
              <TouchableOpacity
                style={[
                  styles.choiceAudioBtn,
                  {
                    backgroundColor: c.surface,
                    borderColor: speakingCode === `${question.code}_bool_ya` ? '#03979D' : c.border,
                  },
                  speakingCode === `${question.code}_bool_ya` && { backgroundColor: '#f0f9ff', borderColor: '#03979D' },
                ]}
                onPress={(e) => { e.stopPropagation(); speakQuestion(`${question.code}_bool_ya`, 'Ya'); }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <MaterialIcons name="volume-up" size={18} color={speakingCode === `${question.code}_bool_ya` ? '#03979D' : c.textMuted} />
              </TouchableOpacity>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.booleanOption,
                {
                  backgroundColor: c.surface,
                  borderColor: value === false ? '#03979D' : c.border,
                },
                value === false && { backgroundColor: '#f0f9ff', borderColor: '#03979D' },
              ]}
              onPress={() => handleAnswerChange(question.code, false, ctx)}
            >
              <Text style={[
                styles.booleanText,
                { color: c.text },
                value === false && { color: '#03979D', fontWeight: '700' },
              ]}>Tidak</Text>
              <TouchableOpacity
                style={[
                  styles.choiceAudioBtn,
                  {
                    backgroundColor: c.surface,
                    borderColor: speakingCode === `${question.code}_bool_tidak` ? '#03979D' : c.border,
                  },
                  speakingCode === `${question.code}_bool_tidak` && { backgroundColor: '#f0f9ff', borderColor: '#03979D' },
                ]}
                onPress={(e) => { e.stopPropagation(); speakQuestion(`${question.code}_bool_tidak`, 'Tidak'); }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <MaterialIcons name="volume-up" size={18} color={speakingCode === `${question.code}_bool_tidak` ? '#03979D' : c.textMuted} />
              </TouchableOpacity>
            </TouchableOpacity>
          </View>
        );

      case 'SINGLE_CHOICE':
        return renderSingleChoice(question, value, ctx);

      case 'MULTIPLE_CHOICE':
        return renderMultipleChoice(question, value, ctx);

      case 'GEO_PROVINSI':
        return (
          <View style={{ backgroundColor: c.surface, borderRadius: 6, padding: 16, borderWidth: 1, borderColor: c.border }}>
            <Text style={{ color: c.textMuted }}>Jawa Tengah</Text>
          </View>
        );

      case 'GEO_KABUPATEN':
        return (
          <View style={{ backgroundColor: c.surface, borderRadius: 6, padding: 16, borderWidth: 1, borderColor: c.border }}>
            <Text style={{ color: c.textMuted }}>Kebumen</Text>
          </View>
        );

      case 'GEO_KECAMATAN':
        return renderKecamatanPicker(question, value, ctx);

      case 'GEO_DESA':
        return renderDesaPicker(question, value, ctx);

      case 'LOCATION':
        return renderLocationInput(question, value, ctx);

      case 'GPS':
        return renderGPSInput(question, value, ctx);

      case 'COVERAGE_LEVEL':
        return renderCoverageLevel(question, value, ctx);

      case 'STAFF_TABLE':
      case 'DIAGNOSIS_TABLE':
      case 'REPEATING_TABLE':
        return renderStaffTableRepeating(question, value, ctx);

      case 'INTERVENTION_MATRIX':
        return renderInterventionMatrix(question, value, ctx);

      case 'OPERATING_HOURS':
        return renderOperatingHours(question, value, ctx);

      default:
        return (
          <TextInput
            style={{
              backgroundColor: c.surface,
              borderRadius: 6,
              padding: 16,
              fontSize: 18,
              color: c.text,
              borderWidth: 1,
              borderColor: c.border,
            }}
            value={value || ''}
            onChangeText={(text) => handleAnswerChange(question.code, text, ctx)}
            placeholder="Ketik jawaban..."
            placeholderTextColor={c.textMuted}
          />
        );
    }
  };

  const renderSingleChoice = (question: Question, value: any, ctx: string = '') => {
    const choices = question.choices || [];
    const isDark = theme.dark;
    const isSelected = value !== null && value !== undefined && value !== '';
    return (
      <View style={styles.choicesContainer}>
        {choices.map((choice) => {
          const choiceSpeakKey = `${question.code}_choice_${choice.value}`;
          const thisSelected = Array.isArray(value) ? value.includes(choice.value) : value === choice.value;
          return (
          <View key={choice.value}>
            <TouchableOpacity
              style={[
                styles.choiceOption,
                {
                  backgroundColor: isDark ? '#1f1f1f' : '#fff',
                  borderColor: thisSelected ? '#03979D' : (isDark ? '#2e2e2e' : '#e5e7eb'),
                },
                thisSelected && { backgroundColor: isDark ? '#1a2e2e' : '#f0f9ff' },
              ]}
              onPress={() => handleAnswerChange(question.code, choice.value, ctx)}
            >
              <View style={[
                styles.radio,
                {
                  borderColor: thisSelected ? '#03979D' : (isDark ? '#404040' : '#d1d5db'),
                  borderRadius: 12,
                },
              ]}>
                {thisSelected && <View style={[styles.radioInner, { borderRadius: 6 }]} />}
              </View>
              <Text style={[
                styles.choiceLabel,
                { flex: 1, color: isDark ? '#f5f5f5' : '#374151' },
                thisSelected && { color: '#03979D', fontWeight: '700' },
              ]}>
                {toSentenceCase(choice.label)}
              </Text>
              <TouchableOpacity
                style={[
                  styles.choiceAudioBtn,
                  {
                    backgroundColor: isDark ? '#1f1f1f' : '#fff',
                    borderColor: speakingCode === choiceSpeakKey ? '#03979D' : (isDark ? '#404040' : '#d1d5db'),
                  },
                  speakingCode === choiceSpeakKey && { backgroundColor: isDark ? '#1a2e2e' : '#e6f7f7', borderColor: '#03979D' },
                ]}
                onPress={(e) => { e.stopPropagation(); speakQuestion(choiceSpeakKey, choice.label); }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <MaterialIcons name="volume-up" size={18} color={speakingCode === choiceSpeakKey ? '#03979D' : (isDark ? '#737373' : '#9ca3af')} />
              </TouchableOpacity>
            </TouchableOpacity>
            {choice.has_other_input && thisSelected && (
              <TextInput
                style={[
                  styles.otherInput,
                  {
                    backgroundColor: isDark ? '#1f1f1f' : '#fff',
                    borderColor: isDark ? '#404040' : '#d1d5db',
                    color: isDark ? '#f5f5f5' : '#1A1A1A',
                  },
                ]}
                value={otherTexts[question.code] || ''}
                onChangeText={(text) => setOtherTexts((prev) => ({ ...prev, [question.code]: text }))}
                placeholder={choice.other_input_label || 'Sebutkan'}
                placeholderTextColor={isDark ? '#525252' : '#9ca3af'}
                keyboardType={
                  choice.other_input_type === 'integer' ? 'number-pad' :
                  choice.other_input_type === 'decimal' ? 'decimal-pad' :
                  choice.other_input_type === 'phone' ? 'phone-pad' :
                  choice.other_input_type === 'email' ? 'email-address' :
                  'default'
                }
              />
            )}
          </View>
          );
        })}
      </View>
    );
  };

  const renderMultipleChoice = (question: Question, value: any, ctx: string = '') => {
    const choices = question.choices || [];
    const isDark = theme.dark;
    const selectedValues: string[] = Array.isArray(value)
      ? value
      : value !== null && value !== undefined && value !== ''
        ? [String(value)]
        : [];

    // DEBUG: log value being rendered
    console.log(`[MULTICHOICE] ${question.code} value=${JSON.stringify(value)} selectedValues=${JSON.stringify(selectedValues)}`);

    const toggleChoice = (choiceValue: string) => {
      console.log(`[TOGGLE] ${question.code} tap choice=${choiceValue}, current selectedValues=${JSON.stringify(selectedValues)}`);
      const newValues = selectedValues.includes(choiceValue)
        ? selectedValues.filter((v) => v !== choiceValue)
        : [...selectedValues, choiceValue];
      console.log(`[TOGGLE] ${question.code} newValues=${JSON.stringify(newValues)}`);
      handleAnswerChange(question.code, newValues, ctx);
    };

    return (
      <View style={styles.choicesContainer}>
        {choices.map((choice) => {
          const isChecked = selectedValues.includes(choice.value);
          const choiceSpeakKey = `${question.code}_choice_${choice.value}`;
          return (
            <View key={choice.value} style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TouchableOpacity
                style={[
                  styles.choiceOption,
                  { flex: 1 },
                  {
                    backgroundColor: isDark ? '#1f1f1f' : '#fff',
                    borderColor: isChecked ? '#03979D' : (isDark ? '#2e2e2e' : '#e5e7eb'),
                  },
                  isChecked && { backgroundColor: isDark ? '#1a2e2e' : '#f0f9ff' },
                ]}
                onPress={() => toggleChoice(choice.value)}
              >
                <View style={[
                  styles.checkbox,
                  { borderRadius: 4 },
                  {
                    borderColor: isChecked ? '#03979D' : (isDark ? '#404040' : '#d1d5db'),
                    backgroundColor: isChecked ? '#03979D' : 'transparent',
                  },
                ]}>
                  {isChecked && <MaterialIcons name="check" size={14} color="#fff" />}
                </View>
                <Text style={[
                  styles.choiceLabel,
                  { flex: 1, color: isDark ? '#f5f5f5' : '#374151' },
                  isChecked && { color: '#03979D', fontWeight: '700' },
                ]}>
                  {toSentenceCase(choice.label)}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.choiceAudioBtn,
                  {
                    backgroundColor: isDark ? '#1f1f1f' : '#fff',
                    borderColor: speakingCode === choiceSpeakKey ? '#03979D' : (isDark ? '#404040' : '#d1d5db'),
                  },
                  speakingCode === choiceSpeakKey && { backgroundColor: isDark ? '#1a2e2e' : '#e6f7f7', borderColor: '#03979D' },
                ]}
                onPress={(e) => { e.stopPropagation(); speakQuestion(choiceSpeakKey, choice.label); }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <MaterialIcons name="volume-up" size={18} color={speakingCode === choiceSpeakKey ? '#03979D' : (isDark ? '#737373' : '#9ca3af')} />
              </TouchableOpacity>
              {choice.has_other_input && isChecked && (
                <TextInput
                  style={[
                    styles.otherInput,
                    {
                      backgroundColor: isDark ? '#1f1f1f' : '#fff',
                      borderColor: isDark ? '#404040' : '#d1d5db',
                      color: isDark ? '#f5f5f5' : '#1A1A1A',
                    },
                  ]}
                  value={otherTexts[question.code] || ''}
                  onChangeText={(text) => setOtherTexts((prev) => ({ ...prev, [question.code]: text }))}
                  placeholder={choice.other_input_label || 'Sebutkan'}
                  placeholderTextColor={isDark ? '#525252' : '#9ca3af'}
                  keyboardType={
                    choice.other_input_type === 'integer' ? 'number-pad' :
                    choice.other_input_type === 'decimal' ? 'decimal-pad' :
                    choice.other_input_type === 'phone' ? 'phone-pad' :
                    choice.other_input_type === 'email' ? 'email-address' :
                    'default'
                  }
                />
              )}
            </View>
          );
        })}
      </View>
    );
  };

  const renderKecamatanPicker = (question: Question, value: any, ctx: string = '') => {
    const selectedName = kecamatanList.find((k) => k.id === value)?.name;

    const handleSelectKecamatan = async (kecId: number, kecName: string) => {
      console.log('[DEBUG] handleSelectKecamatan called:', kecId, kecName, 'ctx:', ctx);
      // Store the answer - always use question.code as key (same as how render reads it)
      // The ctx parameter is passed to handleAnswerChange for consistency
      handleAnswerChange(question.code, kecId, ctx);
      setShowKecamatanPicker(null);

      // Also set the selected kecamatan in a separate state for the dropdown
      const selectedKecamatan = kecamatanList.find(k => k.id === kecId);
      console.log('[DEBUG] Selected kecamatan from list:', selectedKecamatan);

      // Fetch desas for selected kecamatan
      try {
        const netState = await NetInfo.fetch();
        const isOnline = !!(netState.isConnected && netState.isInternetReachable);
        if (isOnline) {
          console.log('[DEBUG] Fetching desas for kecamatan:', kecId, kecName);
          const apiUrl = `/surveys/geographic-units/?level=DESA_KELURAHAN&parent=${kecId}&page_size=200`;
          console.log('[DEBUG] API URL:', apiUrl);
          const desaData = await apiClient.get<PaginatedResponse<{ id: number; name: string }>>(
            '/surveys/geographic-units/',
            { level: 'DESA_KELURAHAN', parent: kecId, page_size: 200 }
          );
          console.log('[DEBUG] API response:', JSON.stringify(desaData).substring(0, 500));
          console.log('[DEBUG] Desas fetched:', desaData.results?.length || 0, 'desas');
          if (desaData.results && desaData.results.length > 0) {
            setDesaList(desaData.results);
            await database.saveGeographicUnits('DESA_KELURAHAN', kecId, desaData.results);
          } else {
            console.log('[DEBUG] No desas found for kecamatan', kecId);
            // Try to get from cache anyway
            const cached = await database.getGeographicUnits('DESA_KELURAHAN', kecId);
            console.log('[DEBUG] Cached desas:', cached.length);
            if (cached.length > 0) {
              setDesaList(cached);
            } else {
              setDesaList([]);
              Alert.alert('Info', `Tidak ada desa ditemukan untuk ${kecName}. Pastikan data wilayah sudah tersedia.`);
            }
          }
        } else {
          const cached = await database.getGeographicUnits('DESA_KELURAHAN', kecId);
          console.log('[DEBUG] Offline mode - desas from cache:', cached.length);
          setDesaList(cached);
        }
      } catch (err) {
        console.error('[ERROR] Failed to fetch desas:', err);
        setDesaList([]);
        Alert.alert('Error', 'Gagal mengambil data desa. Silakan coba lagi.');
      }
    };

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
                onPress={() => handleSelectKecamatan(kec.id, kec.name)}
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

  const renderDesaPicker = (question: Question, value: any, ctx: string = '') => {
    console.log('[DEBUG] renderDesaPicker called:', 'question:', question.code, 'value:', value, 'ctx:', ctx, 'desaList.length:', desaList.length);
    const selectedName = desaList.find((d) => d.id === value)?.name;

    // Reload desas if kecamatan is selected but desaList is empty
    const reloadDesas = async () => {
      console.log('[DEBUG] reloadDesas called, value:', value, 'desaList.length:', desaList.length);
      if (value && desaList.length === 0) {
        try {
          const netState = await NetInfo.fetch();
          const isOnline = !!(netState.isConnected && netState.isInternetReachable);
          if (isOnline) {
            console.log('[DEBUG] Reloading desas for kecamatan:', value);
            const desaData = await apiClient.get<PaginatedResponse<{ id: number; name: string }>>(
              '/surveys/geographic-units/',
              { level: 'DESA_KELURAHAN', parent: value, page_size: 200 }
            );
            if (desaData.results && desaData.results.length > 0) {
              setDesaList(desaData.results);
              await database.saveGeographicUnits('DESA_KELURAHAN', value, desaData.results);
            }
          } else {
            const cached = await database.getGeographicUnits('DESA_KELURAHAN', value);
            setDesaList(cached);
          }
        } catch (err) {
          console.error('[ERROR] Failed to reload desas:', err);
        }
      }
    };

    if (showDesaPicker === question.code) {
      // Trigger reload when opening picker if needed
      reloadDesas();

      return (
        <View>
          <TouchableOpacity
            style={styles.pickerClose}
            onPress={() => setShowDesaPicker(null)}
          >
            <Text style={styles.pickerCloseText}>Tutup</Text>
          </TouchableOpacity>
          <ScrollView style={styles.pickerList} nestedScrollEnabled>
            {desaList.length === 0 ? (
              <Text style={{ padding: 16, color: c.textMuted }}>
                {value ? 'Memuat desa...' : 'Pilih kecamatan terlebih dahulu'}
              </Text>
            ) : (
              desaList.map((desa) => (
                <TouchableOpacity
                  key={desa.id}
                  style={[styles.pickerItem, value === desa.id && styles.pickerItemSelected]}
                  onPress={() => {
                    handleAnswerChange(question.code, desa.id, ctx);
                    setShowDesaPicker(null);
                  }}
                >
                  <Text style={[styles.pickerItemText, value === desa.id && styles.pickerItemTextSelected]}>
                    {desa.name}
                  </Text>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </View>
      );
    }

    return (
      <TouchableOpacity
        style={[styles.picker, !selectedName && styles.pickerDisabled]}
        onPress={async () => {
          // If desas not loaded yet (and we have a selected kecamatan), try to reload
          if (desaList.length === 0 && value) {
            await reloadDesas();
            if (desaList.length === 0) {
              Alert.alert('Info', 'Tidak ada data desa ditemukan untuk kecamatan ini.');
              return;
            }
          }
          setShowDesaPicker(question.code);
        }}
      >
        <Text style={selectedName ? styles.pickerText : styles.pickerPlaceholder}>
          {selectedName || '-- Pilih Desa/Kelurahan --'}
        </Text>
        <MaterialIcons name="arrow-drop-down" size={20} color="#6b7280" />
      </TouchableOpacity>
    );
  };

  const renderLocationInput = (question: Question, value: any, ctx: string = '') => {
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
                      handleAnswerChange(question.code, { ...loc, kecamatan: kec.id, kecamatan_name: kec.name }, ctx);
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
            onChangeText={(text) => handleAnswerChange(question.code, { ...loc, desa: text }, ctx)}
            placeholder="Nama desa/kelurahan..."
            placeholderTextColor="#9ca3af"
          />
        </View>

        {/* GPS */}
        <View style={styles.locationField}>
          <Text style={styles.locationFieldLabel}>Koordinat GPS *</Text>
          <TouchableOpacity
            style={styles.locationButton}
            onPress={() => captureGPS(question.code, ctx)}
            disabled={capturingLocation}
          >
            <MaterialIcons name="place" size={20} color="#03979D" />
            <Text style={styles.locationButtonText}>
              {capturingLocation ? 'Menangkap...' : koordinat.latitude ? 'Perbarui Lokasi' : 'Dapatkan Lokasi'}
            </Text>
          </TouchableOpacity>
          {koordinat.latitude != null && koordinat.longitude != null && !isNaN(koordinat.latitude) && !isNaN(koordinat.longitude) && (
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

  const renderGPSInput = (question: Question, value: any, ctx: string = '') => {
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
              }, ctx);
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
        {coords.latitude != null && coords.longitude != null && !isNaN(coords.latitude) && !isNaN(coords.longitude) && (
          <View style={styles.locationInfo}>
            <Text style={styles.locationCoordText}>
              Lat: {coords.latitude.toFixed(6)}, Lng: {coords.longitude.toFixed(6)}
            </Text>
          </View>
        )}
      </View>
    );
  };

  const renderCoverageLevel = (question: Question, value: any, ctx: string = '') => {
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
              onPress={() => handleAnswerChange(question.code, level.value, ctx)}
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
                <MaterialIcons name="volume-up" size={18} color={speakingCode === choiceSpeakKey ? '#03979D' : '#9ca3af'} />
              </TouchableOpacity>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  // Staff table — two modes:
  // 1. Fixed rows (config.rows set): pre-defined job positions, value is Record<rowCode, Record<colCode, string>>
  // 2. Repeating rows (no config.rows): user adds rows freely, value is Array<Record<colCode, string>>
  const renderStaffTableRepeating = (question: Question, value: any, ctx: string = '') => {
    const config = question.table_config;

    // ── Mode 1: Fixed rows from config ──────────────────────────────────────
    if (config?.rows?.length) {
      const columns: Array<{ code: string; label: string; type: string }> = config.columns ?? [
        { code: 'LAKI_LAKI', label: 'L', type: 'number' },
        { code: 'PEREMPUAN', label: 'P', type: 'number' },
      ];
      const currentValue: Record<string, Record<string, string>> =
        value && !Array.isArray(value) ? value : {};

      const updateCell = (rowCode: string, colCode: string, cellValue: string) => {
        const next = { ...currentValue, [rowCode]: { ...currentValue[rowCode], [colCode]: cellValue } };
        handleAnswerChange(question.code, next, ctx);
      };

      return (
        <ScrollView horizontal showsHorizontalScrollIndicator style={{ marginTop: 4 }}>
          <View>
            {/* Header */}
            <View style={[styles.tableRow, { backgroundColor: c.border }]}>
              <View style={[styles.tableCell, { width: 160 }]}>
                <Text style={styles.tableHeaderText}>Jabatan</Text>
              </View>
              {columns.map((col: any) => (
                <View key={col.code} style={[styles.tableCell, { width: 70 }]}>
                  <Text style={styles.tableHeaderText}>{col.label}</Text>
                </View>
              ))}
            </View>
            {/* Fixed rows */}
            {config.rows.map((row: any) => {
              const rowData = currentValue[row.code] ?? {};
              return (
                <View key={row.code} style={styles.tableRow}>
                  <View style={[styles.tableCell, { width: 160 }]}>
                    <Text style={[styles.tableCellLabel, { fontSize: fs(12) }]}>{row.label}</Text>
                  </View>
                  {columns.map((col: any) => (
                    <View key={col.code} style={[styles.tableCell, { width: 70, padding: 2 }]}>
                      <TextInput
                        style={[styles.tableCellInput, { fontSize: fs(12) }]}
                        value={String(rowData[col.code] ?? '')}
                        onChangeText={(t) => updateCell(row.code, col.code, t)}
                        keyboardType="number-pad"
                        placeholder="0"
                        placeholderTextColor="#d1d5db"
                      />
                    </View>
                  ))}
                </View>
              );
            })}
          </View>
        </ScrollView>
      );
    }

    // ── Mode 2: Kegiatan table (Nomor, Kegiatan, Jam Mulai, Jam Selesai) ───────
    const kegRows: Array<{ kegiatan: string; start: string; stop: string }> =
      Array.isArray(value) && value.length > 0 ? value : [{ kegiatan: '', start: '', stop: '' }];

    const updateKegCell = (idx: number, field: 'kegiatan' | 'start' | 'stop', val: string) => {
      const next = kegRows.map((r, i) => i === idx ? { ...r, [field]: val } : r);
      handleAnswerChange(question.code, next, ctx);
    };

    const addKegRow = () => handleAnswerChange(question.code, [...kegRows, { kegiatan: '', start: '', stop: '' }], ctx);
    const removeKegRow = (idx: number) => {
      if (kegRows.length <= 1) return;
      handleAnswerChange(question.code, kegRows.filter((_, i) => i !== idx), ctx);
    };

    return (
      <View>
        <View style={styles.kegTableContainer}>
          {/* Header */}
          <View style={styles.kegHeaderRow}>
            <Text style={[styles.kegColLabel, { width: 40 }]}>No</Text>
            <Text style={[styles.kegColLabel, { flex: 2 }]}>KEGIATAN</Text>
            <Text style={[styles.kegColLabel, { flex: 1 }]}>MULAI</Text>
            <Text style={[styles.kegColLabel, { flex: 1 }]}>SELESAI</Text>
            <View style={{ width: 40 }} />
          </View>

          {/* Rows */}
          {kegRows.map((row, idx) => (
            <View key={idx} style={styles.kegRow}>
              <Text style={styles.kegNumText}>{idx + 1}</Text>

              {/* Kegiatan — text input */}
              <TextInput
                style={styles.kegTextInput}
                value={row.kegiatan}
                onChangeText={(t) => updateKegCell(idx, 'kegiatan', t)}
                placeholder="Nama kegiatan"
                placeholderTextColor="#d1d5db"
              />

              {/* Jam Mulai — time picker */}
              <TouchableOpacity
                style={styles.kegTimeBtn}
                onPress={() => setShowTimePicker({ code: question.code + '_start_' + idx, value: row.start, ctx, kegArray: kegRows })}
              >
                <Text style={[styles.kegTimeText, !row.start && { color: '#9ca3af' }]}>
                  {row.start || '00:00'}
                </Text>
                <MaterialIcons name="access-time" size={16} color="#6b7280" />
              </TouchableOpacity>

              {/* Jam Selesai — time picker */}
              <TouchableOpacity
                style={styles.kegTimeBtn}
                onPress={() => setShowTimePicker({ code: question.code + '_stop_' + idx, value: row.stop, ctx, kegArray: kegRows })}
              >
                <Text style={[styles.kegTimeText, !row.stop && { color: '#9ca3af' }]}>
                  {row.stop || '00:00'}
                </Text>
                <MaterialIcons name="access-time" size={16} color="#6b7280" />
              </TouchableOpacity>

              {/* Delete */}
              <TouchableOpacity
                style={{ width: 40, alignItems: 'center', justifyContent: 'center' }}
                onPress={() => removeKegRow(idx)}
                disabled={kegRows.length <= 1}
              >
                <MaterialIcons name="delete-outline" size={20} color={kegRows.length <= 1 ? '#d1d5db' : '#ef4444'} />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Add row */}
        <TouchableOpacity style={styles.opHoursAddButton} onPress={addKegRow}>
          <MaterialIcons name="add" size={18} color={c.primary} />
          <Text style={styles.opHoursAddButtonText}>Tambah Baris</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderRepeatingTable = (question: Question, value: any, ctx: string = '') => {
    // Redirect to kegiatan-style table for all repeating tables
    return renderStaffTableRepeating(question, value, ctx);
  };
    const renderInterventionMatrix = (question: Question, value: any, ctx: string = '') => {
    const config = question.table_config;
    const hasSubQuestions = Array.isArray(config?.sub_questions) && config.sub_questions.length > 0;

    // ── Legacy format (rows + columns grid) ──────────────────────────────────
    if (!hasSubQuestions) {
      if (!config?.rows?.length || !config?.columns?.length) {
        return (
          <Text style={{ color: '#9ca3af', fontSize: fs(13) }}>
            Konfigurasi matriks tidak ditemukan.
          </Text>
        );
      }
      const currentValue: Record<string, any> = value || {};
      const handleSelect = (rowCode: string, checked: boolean) => {
        const next = { ...currentValue };
        if (checked) { next[rowCode] = { ...next[rowCode], selected: true }; }
        else { delete next[rowCode]; }
        handleAnswerChange(question.code, next, ctx);
      };
      const handleCellChange = (rowCode: string, colCode: string, cellValue: any) => {
        handleAnswerChange(question.code, { ...currentValue, [rowCode]: { ...currentValue[rowCode], [colCode]: cellValue } }, ctx);
      };
      return (
        <ScrollView horizontal showsHorizontalScrollIndicator style={{ marginTop: 4 }}>
          <View>
            <View style={[styles.tableRow, { backgroundColor: '#f3f4f6' }]}>
              <View style={[styles.tableCell, { width: 140 }]}><Text style={styles.tableHeaderText}>Intervensi</Text></View>
              <View style={[styles.tableCell, { width: 40 }]}><Text style={styles.tableHeaderText}>✓</Text></View>
              {config.columns!.map((col: any) => (
                <View key={col.code} style={[styles.tableCell, { width: 100 }]}>
                  <Text style={[styles.tableHeaderText, { fontSize: fs(10) }]}>{col.label}</Text>
                </View>
              ))}
            </View>
            {config.rows.map((row: any) => {
              const rowData = currentValue[row.code];
              const isSelected = !!rowData?.selected;
              return (
                <View key={row.code} style={[styles.tableRow, !isSelected && { opacity: 0.5 }]}>
                  <View style={[styles.tableCell, { width: 140 }]}><Text style={styles.tableCellLabel}>{row.label}</Text></View>
                  <View style={[styles.tableCell, { width: 40, alignItems: 'center' }]}>
                    <TouchableOpacity onPress={() => handleSelect(row.code, !isSelected)}
                      style={{ width: fs(20), height: fs(20), borderWidth: 2, borderColor: isSelected ? c.primary : '#9ca3af', borderRadius: 4, backgroundColor: isSelected ? c.primary : 'white', alignItems: 'center', justifyContent: 'center' }}>
                      {isSelected && <Text style={{ color: 'white', fontSize: fs(12), fontWeight: 'bold' }}>✓</Text>}
                    </TouchableOpacity>
                  </View>
                  {config.columns!.map((col: any) => (
                    <View key={col.code} style={[styles.tableCell, { width: 100, padding: 2 }]}>
                      {isSelected ? (
                        col.type === 'number' ? (
                          <TextInput style={[styles.tableCellInput, { fontSize: fs(12) }]} value={String(rowData?.[col.code] ?? '')} onChangeText={(t) => handleCellChange(row.code, col.code, t)} keyboardType="number-pad" placeholder="0" placeholderTextColor="#d1d5db" />
                        ) : col.type === 'multiple_choice' ? (
                          <View style={{ gap: 2 }}>
                            {(col.options ?? []).map((opt: any) => {
                              const sel: string[] = Array.isArray(rowData?.[col.code]) ? rowData[col.code] : [];
                              const chk = sel.includes(opt.value);
                              return (
                                <TouchableOpacity key={opt.value} onPress={() => handleCellChange(row.code, col.code, chk ? sel.filter((v: string) => v !== opt.value) : [...sel, opt.value])} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                  <View style={{ width: fs(14), height: fs(14), borderWidth: 1.5, borderColor: chk ? c.primary : '#9ca3af', borderRadius: 3, backgroundColor: chk ? c.primary : 'white', alignItems: 'center', justifyContent: 'center' }}>
                                    {chk && <Text style={{ color: 'white', fontSize: fs(9) }}>✓</Text>}
                                  </View>
                                  <Text style={{ fontSize: fs(10), color: '#374151' }}>{opt.label}</Text>
                                </TouchableOpacity>
                              );
                            })}
                          </View>
                        ) : (
                          <TextInput style={[styles.tableCellInput, { fontSize: fs(12) }]} value={String(rowData?.[col.code] ?? '')} onChangeText={(t) => handleCellChange(row.code, col.code, t)} placeholder="—" placeholderTextColor="#d1d5db" />
                        )
                      ) : (
                        <View style={{ height: 28, borderRadius: 4, backgroundColor: '#f3f4f6' }} />
                      )}
                    </View>
                  ))}
                </View>
              );
            })}
          </View>
        </ScrollView>
      );
    }

    // ── New format: delegate to InterventionMatrixNewFormat component ────────────
    // (hooks are called inside the component, not here, to satisfy Rules of Hooks)
    return (
      <InterventionMatrixNewFormat
        questionCode={question.code}
        ctx={ctx}
        value={value}
        config={config}
        onAnswerChange={handleAnswerChange}
      />
    );
  };

  // Operating hours: "Hari HH:MM-HH:MM" per row, surveyor adds/removes rows
  const DAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

  // Day picker modal state (index of row whose day is being picked)
  const [opHoursDayPicker, setOpHoursDayPicker] = useState<number | null>(null);
  const [showTimePicker, setShowTimePicker] = useState<{ code: string; value: string; ctx: string; kegArray?: Array<{ kegiatan: string; start: string; stop: string }> } | null>(null); // {code, value, ctx, kegArray?}

  const renderOperatingHours = (question: Question, value: any, ctx: string = '') => {
    const schedule: Array<{ day: string; open: string; close: string }> =
      Array.isArray(value) && value.length > 0 ? value : DAYS.map((d) => ({ day: d, open: '', close: '' }));

    const updateRow = (index: number, field: 'day' | 'open' | 'close', val: string) => {
      const next = schedule.map((r, i) => i === index ? { ...r, [field]: val } : r);
      handleAnswerChange(question.code, next, ctx);
    };

    const addRow = () => handleAnswerChange(question.code, [...schedule, { day: '', open: '', close: '' }], ctx);

    const removeRow = (index: number) => {
      if (schedule.length <= 1) return;
      handleAnswerChange(question.code, schedule.filter((_, i) => i !== index), ctx);
    };

    return (
      <View>
        {/* Header */}
        <View style={styles.sectionHeaderContainer}>
          <Text style={styles.sectionHeader}>JAM OPERASIONAL</Text>
          <Text style={styles.sectionSubtitle}>ISILAH JAM OPERASIONAL SESUAI KETENTUAN</Text>
        </View>

        {/* Table */}
        <View style={[styles.opHoursContainer]}>
          {/* Table header */}
          <View style={[styles.opHoursRow, { backgroundColor: '#f3f4f6' }]}>
            <Text style={[styles.opHoursColLabel, { flex: 1.2 }]}>Hari</Text>
            <Text style={[styles.opHoursColLabel, { flex: 1 }]}>Jam Buka</Text>
            <Text style={[styles.opHoursColLabel, { flex: 1 }]}>Jam Tutup</Text>
            <View style={{ width: 40 }} />
          </View>

          {/* Rows */}
          {schedule.map((row, idx) => (
            <View key={idx} style={[styles.opHoursRow, { borderBottomWidth: 1, borderBottomColor: '#f3f4f6' }]}>
              {/* Hari dropdown */}
              <TouchableOpacity
                style={[styles.opHoursCol, { flex: 1.2, backgroundColor: '#fff', borderRadius: 6, marginRight: 6 }]}
                onPress={() => setOpHoursDayPicker(idx)}
              >
                <Text style={[styles.opHoursCellText, !row.day && { color: '#9ca3af' }]}>
                  {row.day || 'Pilih hari'}
                </Text>
                <MaterialIcons name="arrow-drop-down" size={18} color="#6b7280" />
              </TouchableOpacity>

              {/* Jam Buka */}
              <View style={[styles.opHoursCol, { flex: 1 }]}>
                <TextInput
                  style={styles.opHoursTimeInput}
                  value={row.open}
                  onChangeText={(text) => updateRow(idx, 'open', text)}
                  placeholder="09.00"
                  placeholderTextColor="#d1d5db"
                  keyboardType="numbers-and-punctuation"
                />
              </View>

              {/* Jam Tutup */}
              <View style={[styles.opHoursCol, { flex: 1 }]}>
                <TextInput
                  style={styles.opHoursTimeInput}
                  value={row.close}
                  onChangeText={(text) => updateRow(idx, 'close', text)}
                  placeholder="22.00"
                  placeholderTextColor="#d1d5db"
                  keyboardType="numbers-and-punctuation"
                />
              </View>

              {/* Delete button */}
              <TouchableOpacity
                style={{ width: 40, alignItems: 'center', justifyContent: 'center' }}
                onPress={() => removeRow(idx)}
                disabled={schedule.length <= 1}
              >
                <MaterialIcons
                  name="delete-outline"
                  size={20}
                  color={schedule.length <= 1 ? '#d1d5db' : '#ef4444'}
                />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Add row button */}
        <TouchableOpacity style={styles.opHoursAddButton} onPress={addRow}>
          <MaterialIcons name="add" size={18} color={c.primary} />
          <Text style={styles.opHoursAddButtonText}>Tambah Baris</Text>
        </TouchableOpacity>

        {/* Day picker modal */}
        {opHoursDayPicker !== null && (
          <View style={styles.pickerOverlay}>
            <TouchableOpacity
              style={styles.pickerBackdrop}
              onPress={() => setOpHoursDayPicker(null)}
            />
            <View style={styles.pickerModal}>
              <View style={styles.pickerHeader}>
                <Text style={styles.pickerHeaderText}>Pilih Hari</Text>
                <TouchableOpacity onPress={() => setOpHoursDayPicker(null)}>
                  <MaterialIcons name="close" size={22} color="#6b7280" />
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.pickerList} nestedScrollEnabled>
                {DAYS.map((d) => (
                  <TouchableOpacity
                    key={d}
                    style={[
                      styles.pickerItem,
                      schedule[opHoursDayPicker]?.day === d && styles.pickerItemSelected,
                    ]}
                    onPress={() => {
                      updateRow(opHoursDayPicker, 'day', d);
                      setOpHoursDayPicker(null);
                    }}
                  >
                    <Text
                      style={[
                        styles.pickerItemText,
                        schedule[opHoursDayPicker]?.day === d && styles.pickerItemTextSelected,
                      ]}
                    >
                      {d}
                    </Text>
                    {schedule[opHoursDayPicker]?.day === d && (
                      <MaterialIcons name="check" size={18} color={c.primary} />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        )}

        {/* TIME PICKER MODAL — 24-hour format */}
        {showTimePicker && (
          <View style={styles.pickerOverlay}>
            <TouchableOpacity
              style={styles.pickerBackdrop}
              onPress={() => setShowTimePicker(null)}
            />
            <View style={styles.pickerModal}>
              <View style={styles.pickerHeader}>
                <Text style={styles.pickerHeaderText}>Pilih Jam (24 Jam)</Text>
                <TouchableOpacity onPress={() => setShowTimePicker(null)}>
                  <MaterialIcons name="close" size={22} color="#6b7280" />
                </TouchableOpacity>
              </View>
              {/* Parse current time */}
              {(() => {
                const parts = (showTimePicker.value || '').split(':');
                const initHour = parts[0] ? parseInt(parts[0], 10) : -1;
                const initMin = parts[1] ? parseInt(parts[1], 10) : -1;
                return (
                  <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-start', paddingHorizontal: 16, paddingBottom: 16 }}>
                    {/* Hours column */}
                    <ScrollView style={{ height: 200, width: 70 }} showsVerticalScrollIndicator>
                      {Array.from({ length: 24 }, (_, i) => i).map((h) => {
                        const label = String(h).padStart(2, '0');
                        const isSelected = h === initHour;
                        return (
                          <TouchableOpacity
                            key={`h-${h}`}
                            style={{ paddingVertical: 10, alignItems: 'center', backgroundColor: isSelected ? '#e6f7f7' : 'transparent', borderRadius: 8 }}
                            onPress={() => {
                              const min = initMin >= 0 ? String(initMin).padStart(2, '0') : '00';
                              const newVal = `${label}:${min}`;
                              // Intercept kegiatan table synthetic codes (e.g. "QL8A_start_0")
                              const code = showTimePicker.code;
                              const parts2 = code.split('_start_');
                              if (parts2.length === 2) {
                                const qCode = parts2[0];
                                const rowIdx = parseInt(parts2[1], 10);
                                const rows = showTimePicker.kegArray ?? [];
                                const next = rows.map((r: any, i: number) => i === rowIdx ? { ...r, start: newVal } : r);
                                handleAnswerChange(qCode, next, showTimePicker.ctx);
                                setShowTimePicker(null);
                                return;
                              }
                              const partsStop = code.split('_stop_');
                              if (partsStop.length === 2) {
                                const qCode = partsStop[0];
                                const rowIdx = parseInt(partsStop[1], 10);
                                const rows = showTimePicker.kegArray ?? [];
                                const next = rows.map((r: any, i: number) => i === rowIdx ? { ...r, stop: newVal } : r);
                                handleAnswerChange(qCode, next, showTimePicker.ctx);
                                setShowTimePicker(null);
                                return;
                              }
                              handleAnswerChange(code, newVal, showTimePicker.ctx);
                              setShowTimePicker({ code, value: newVal, ctx: showTimePicker.ctx });
                            }}
                          >
                            <Text style={{ fontSize: 18, color: isSelected ? c.primary : '#374151', fontWeight: isSelected ? '700' : '400' }}>{label}</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                    {/* Minutes column */}
                    <ScrollView style={{ height: 200, width: 70 }} showsVerticalScrollIndicator>
                      {[0, 15, 30, 45].map((m) => {
                        const label = String(m).padStart(2, '0');
                        const isSelected = m === initMin;
                        return (
                          <TouchableOpacity
                            key={`m-${m}`}
                            style={{ paddingVertical: 10, alignItems: 'center', backgroundColor: isSelected ? '#e6f7f7' : 'transparent', borderRadius: 8 }}
                            onPress={() => {
                              const hour = initHour >= 0 ? String(initHour).padStart(2, '0') : '00';
                              const newVal = `${hour}:${label}`;
                              const code = showTimePicker.code;
                              const parts2 = code.split('_start_');
                              if (parts2.length === 2) {
                                const qCode = parts2[0];
                                const rowIdx = parseInt(parts2[1], 10);
                                const rows = showTimePicker.kegArray ?? [];
                                const next = rows.map((r: any, i: number) => i === rowIdx ? { ...r, start: newVal } : r);
                                handleAnswerChange(qCode, next, showTimePicker.ctx);
                                setShowTimePicker(null);
                                return;
                              }
                              const partsStop = code.split('_stop_');
                              if (partsStop.length === 2) {
                                const qCode = partsStop[0];
                                const rowIdx = parseInt(partsStop[1], 10);
                                const rows = showTimePicker.kegArray ?? [];
                                const next = rows.map((r: any, i: number) => i === rowIdx ? { ...r, stop: newVal } : r);
                                handleAnswerChange(qCode, next, showTimePicker.ctx);
                                setShowTimePicker(null);
                                return;
                              }
                              handleAnswerChange(code, newVal, showTimePicker.ctx);
                              setShowTimePicker({ code, value: newVal });
                            }}
                          >
                            <Text style={{ fontSize: 18, color: isSelected ? c.primary : '#374151', fontWeight: isSelected ? '700' : '400' }}>{label}</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  </View>
                );
              })()}
            </View>
          </View>
        )}
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
    const isDark = theme.dark;
    const filteredServices = services.filter((s) => {
      const matchesSearch = !serviceSearch ||
        s.name.toLowerCase().includes(serviceSearch.toLowerCase()) ||
        (s.city || '').toLowerCase().includes(serviceSearch.toLowerCase());
      const matchesFilter = serviceFilter === 'ALL' || s.kategori_fasilitas === serviceFilter;
      return matchesSearch && matchesFilter;
    });
    return (
      <View style={[styles.container, { backgroundColor: c.background }]}>
        <View style={styles.contentWrapper}>
          <View style={[styles.pageHeader, { backgroundColor: c.surface, borderBottomWidth: 1, borderBottomColor: c.border }]}>
            <TouchableOpacity onPress={() => { setShowServicePicker(false); setServiceSearch(''); }} style={styles.backIcon}>
              <MaterialIcons name="arrow-back" size={22} color={c.text} />
            </TouchableOpacity>
            <Text style={[styles.pageTitle, { color: c.text }]}>Pilih Fasilitas</Text>
            <View style={{ width: 40 }} />
          </View>

          {/* Search Bar */}
          <View style={[styles.searchContainer, { backgroundColor: c.surface }]}>
            <MaterialIcons name="search" size={20} color={c.textMuted} style={{ marginRight: 8 }} />
            <TextInput
              style={[styles.searchInput, { color: c.text, backgroundColor: isDark ? '#1f1f1f' : '#f5f6f7' }]}
              placeholder="Cari fasilitas..."
              placeholderTextColor={c.textMuted}
              value={serviceSearch}
              onChangeText={setServiceSearch}
            />
            {serviceSearch.length > 0 && (
              <TouchableOpacity onPress={() => setServiceSearch('')}>
                <MaterialIcons name="close" size={20} color={c.textMuted} />
              </TouchableOpacity>
            )}
          </View>

          {/* Filter Tabs */}
          <View style={[styles.filterTabs, { backgroundColor: c.surface }]}>
            {(['ALL', 'KESEHATAN', 'NON_KESEHATAN'] as const).map((filter) => (
              <TouchableOpacity
                key={filter}
                style={[
                  styles.filterTab,
                  { backgroundColor: isDark ? '#1f1f1f' : '#f5f6f7' },
                  serviceFilter === filter && { backgroundColor: '#00979D' },
                ]}
                onPress={() => setServiceFilter(filter)}
              >
                <Text style={[
                  styles.filterTabText,
                  { color: serviceFilter === filter ? '#fff' : c.textSecondary },
                ]}>
                  {filter === 'ALL' ? 'Semua' : filter === 'KESEHATAN' ? 'Faskes' : 'Non-Faskes'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Add New Service Button */}
          <TouchableOpacity
            style={[styles.addServiceBtn, { backgroundColor: c.surface, borderColor: '#00979D' }]}
            onPress={() => {
              setShowServicePicker(false);
              setShowAddServiceModal(true);
            }}
          >
            <MaterialIcons name="add-circle" size={20} color="#00979D" />
            <Text style={styles.addServiceBtnText}>Tambah Fasilitas Baru</Text>
          </TouchableOpacity>

          <ScrollView style={styles.serviceList}>
            {filteredServices.length === 0 ? (
              <View style={styles.emptyState}>
                <MaterialIcons name="search-off" size={48} color={c.textMuted} />
                <Text style={[styles.emptyStateText, { color: c.textMuted }]}>Fasilitas tidak ditemukan</Text>
              </View>
            ) : (
              filteredServices.map((service) => {
                const isUsed = usedServiceIds.has(service.id);
                return (
                <TouchableOpacity
                  key={service.id}
                  style={[
                    styles.serviceItem,
                    {
                      backgroundColor: c.surface,
                      borderColor: c.border,
                      opacity: isUsed ? 0.45 : 1,
                    },
                    selectedService?.id === service.id && { borderColor: '#00979D', backgroundColor: isDark ? '#1a2e2e' : '#f0f9ff' },
                  ]}
                  disabled={isUsed}
                  onPress={() => {
                    setSelectedService(service);
                    setShowServicePicker(false);
                    setServiceSearch('');
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.serviceName, { color: c.text }]}>{service.name}</Text>
                    {service.city && (
                      <Text style={[styles.serviceCity, { color: c.textMuted }]}>{service.city}</Text>
                    )}
                    {service.mtc_name && (
                      <Text style={[styles.serviceMtc, { color: c.textMuted }]}>{service.mtc_name}</Text>
                    )}
                  </View>
                  {isUsed && (
                    <View style={[styles.faskesBadge, { backgroundColor: '#f3f4f6' }]}>
                      <Text style={[styles.faskesBadgeText, { color: '#6b7280' }]}>Sudah Ada</Text>
                    </View>
                  )}
                  {!isUsed && service.kategori_fasilitas && (
                    <View style={[
                      styles.faskesBadge,
                      { backgroundColor: service.kategori_fasilitas === 'KESEHATAN' ? '#dcfce7' : '#fef3c7' },
                    ]}>
                      <Text style={[
                        styles.faskesBadgeText,
                        { color: service.kategori_fasilitas === 'KESEHATAN' ? '#166534' : '#92400e' },
                      ]}>
                        {service.kategori_fasilitas === 'KESEHATAN' ? 'Faskes' : 'Non-Faskes'}
                      </Text>
                    </View>
                  )}
                  {selectedService?.id === service.id && !isUsed && (
                    <MaterialIcons name="check-circle" size={22} color="#00979D" />
                  )}
                </TouchableOpacity>
              );
              })
            )}
          </ScrollView>
        </View>
      </View>
    );
  }

  // --- ADD SERVICE MODAL (shown over setup) ---
  if (showAddServiceModal) {
    return (
      <View style={[styles.container, { backgroundColor: c.background }]}>
        <View style={styles.contentWrapper}>
          <View style={[styles.pageHeader, { backgroundColor: c.surface, borderBottomWidth: 1, borderBottomColor: c.border }]}>
            <TouchableOpacity
              onPress={() => {
                setShowAddServiceModal(false);
                setNewServiceName('');
                setNewServiceKecamatan(null);
                setNewServiceCity('Kebumen');
                setShowNewServiceKecamatanPicker(false);
              }}
              style={styles.backIcon}
            >
              <MaterialIcons name="close" size={22} color={c.text} />
            </TouchableOpacity>
            <Text style={[styles.pageTitle, { color: c.text }]}>Tambah Fasilitas Baru</Text>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView style={styles.content} contentContainerStyle={{ padding: 20 }}>
            <Text style={[styles.label, { color: c.textSecondary, marginBottom: 8 }]}>
              Nama Fasilitas *
            </Text>
            <TextInput
              style={[styles.inputBox, { backgroundColor: c.surface, borderColor: c.border, color: c.text }]}
              value={newServiceName}
              onChangeText={setNewServiceName}
              placeholder="Masukkan nama fasilitas"
              placeholderTextColor={c.textMuted}
            />

            <Text style={[styles.label, { color: c.textSecondary, marginBottom: 8, marginTop: 16 }]}>
              Kecamatan
            </Text>
            {showNewServiceKecamatanPicker ? (
              <View>
                <TouchableOpacity
                  style={styles.pickerClose}
                  onPress={() => setShowNewServiceKecamatanPicker(false)}
                >
                  <Text style={styles.pickerCloseText}>Tutup</Text>
                </TouchableOpacity>
                <ScrollView style={styles.pickerList} nestedScrollEnabled>
                  {kecamatanList.map((kec) => (
                    <TouchableOpacity
                      key={kec.id}
                      style={[styles.pickerItem, newServiceKecamatan?.id === kec.id && styles.pickerItemSelected]}
                      onPress={() => {
                        setNewServiceKecamatan(kec);
                        setShowNewServiceKecamatanPicker(false);
                      }}
                    >
                      <Text style={[styles.pickerItemText, newServiceKecamatan?.id === kec.id && styles.pickerItemTextSelected]}>
                        {kec.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.inputBox, { backgroundColor: c.surface, borderColor: c.border }]}
                onPress={() => setShowNewServiceKecamatanPicker(true)}
              >
                <Text style={newServiceKecamatan ? styles.pickerText : styles.pickerPlaceholder}>
                  {newServiceKecamatan?.name || '-- Pilih Kecamatan --'}
                </Text>
                <MaterialIcons name="arrow-drop-down" size={20} color="#6b7280" />
              </TouchableOpacity>
            )}

            <Text style={[styles.label, { color: c.textSecondary, marginBottom: 8, marginTop: 16 }]}>
              Kabupaten/Kota
            </Text>
            <TextInput
              style={[styles.inputBox, { backgroundColor: c.surface, borderColor: c.border, color: c.text }]}
              value={newServiceCity}
              onChangeText={setNewServiceCity}
              placeholder="Masukkan nama kabupaten/kota"
              placeholderTextColor={c.textMuted}
            />

            <TouchableOpacity
              style={[
                styles.submitButton,
                { marginTop: 24, backgroundColor: '#00979D' },
                (!newServiceName.trim() || addingService) && styles.buttonDisabled,
              ]}
              onPress={async () => {
                if (!newServiceName.trim()) {
                  Alert.alert('Error', 'Nama fasilitas harus diisi');
                  return;
                }
                setAddingService(true);
                try {
                  const result = await apiClient.post<any>('/directory/services/quick_create/', {
                    name: newServiceName.trim(),
                    kecamatan: newServiceKecamatan?.name || '',
                    city: newServiceCity.trim() || 'Kebumen',
                  });
                  // Add the new service to the list and select it
                  const newService: Service = {
                    id: result.id,
                    name: result.name,
                    city: result.city || newServiceCity,
                    kecamatan: result.kecamatan || newServiceKecamatan?.name || '',
                    mtc_name: result.mtc?.name,
                    bsic_name: result.bsic?.name,
                    service_type_name: result.service_type?.name,
                  };
                  setServices((prev) => [newService, ...prev]);
                  setSelectedService(newService);
                  setShowAddServiceModal(false);
                  setNewServiceName('');
                  setNewServiceKecamatan(null);
                  setNewServiceCity('Kebumen');
                  Alert.alert('Berhasil', 'Fasilitas baru berhasil ditambahkan');
                } catch (err: any) {
                  console.error('Failed to add service:', err);
                  Alert.alert('Error', err?.message || 'Gagal menambahkan fasilitas');
                } finally {
                  setAddingService(false);
                }
              }}
              disabled={!newServiceName.trim() || addingService}
            >
              {addingService ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.submitButtonText}>Tambah</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    );
  }

  // --- SETUP PHASE ---
  if (!setupComplete) {
    const isDark = theme.dark;
    return (
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: c.background }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'android' ? 0 : 0}
      >
        <View style={[styles.contentWrapper, { backgroundColor: c.background }]}>
          <View style={[styles.pageHeader, { backgroundColor: c.surface, borderBottomWidth: 1, borderBottomColor: c.border }]}>
            <TouchableOpacity onPress={onBack} style={styles.backIcon}>
              <MaterialIcons name="arrow-back" size={22} color={c.text} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={[styles.content, { backgroundColor: c.background }]}
            keyboardShouldPersistTaps="handled"
            automaticallyAdjustKeyboardInsets
            contentContainerStyle={{ flexGrow: 1, paddingBottom: 32 }}
          >
            <Text style={[styles.templateName, { color: c.text }]}>{toSentenceCase(template.name)}</Text>

            {/* Service Selection */}
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: c.textSecondary }]}>Fasilitas layanan yang disurvei *</Text>
              <TouchableOpacity
                style={[styles.picker, { backgroundColor: c.surface, borderColor: c.border }]}
                onPress={() => setShowServicePicker(true)}
              >
                <Text style={selectedService ? [styles.pickerText, { color: c.text }] : [styles.pickerPlaceholder, { color: c.textMuted }]}>
                  {selectedService?.name || 'Pilih fasilitas layanan'}
                </Text>
                <MaterialIcons name="arrow-drop-down" size={20} color={c.textMuted} />
              </TouchableOpacity>
            </View>

            {/* Survey Date - auto-captured from device */}
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: c.textSecondary }]}>Tanggal survei *</Text>
              <View style={[styles.inputWithIcon, { backgroundColor: c.surface, borderColor: c.border }]}>
                <View style={[styles.input, { flexDirection: 'row', alignItems: 'center' }]}>
                  <MaterialIcons name="event" size={18} color={c.primary} style={{ marginRight: 8 }} />
                  <Text style={{ fontSize: 15, color: c.text, flex: 1 }}>{surveyDate || 'Memuat...'}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => {
                    const now = new Date();
                    const formatted = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}T${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
                    setSurveyDate(formatted);
                  }}
                  style={{ marginLeft: 8 }}
                >
                  <MaterialIcons name="refresh" size={20} color={c.primary} />
                </TouchableOpacity>
              </View>
              <Text style={{ fontSize: 11, color: c.textMuted, marginTop: 4 }}>Waktu otomatis dari perangkat</Text>
            </View>

            {/* GPS Location */}
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: c.textSecondary }]}>Lokasi GPS</Text>
              {isValidGps(finalGps) ? (
                <View style={{ backgroundColor: isDark ? '#1a2e2e' : '#f0f9ff', borderRadius: 6, padding: 14, borderWidth: 1, borderColor: c.primary }}>
                  <Text style={{ fontSize: 13, color: '#059669', marginBottom: 4 }}>✓ Lokasi berhasil direkam</Text>
                  <Text style={{ fontSize: 12, color: c.textSecondary, fontFamily: 'monospace' }}>
                    {formatGpsCoord(finalGps)}
                  </Text>
                  {finalGps?.accuracy != null && (
                    <Text style={{ fontSize: 11, color: c.textMuted, marginTop: 2 }}>Akurasi: ±{Math.round(finalGps!.accuracy)}m</Text>
                  )}
                </View>
              ) : (
                <Text style={{ fontSize: 13, color: c.textMuted, marginBottom: 8 }}>
                  Belum direkam. Tap tombol di bawah untuk merekam lokasi.
                </Text>
              )}
              <TouchableOpacity
                style={[styles.locationButton, { marginTop: finalGps ? 8 : 0, backgroundColor: c.surface, borderColor: c.primary }]}
                onPress={captureFinalGPS}
                disabled={capturingLocation}
              >
                {capturingLocation
                  ? <ActivityIndicator size="small" color={c.primary} />
                  : <MaterialIcons name="my-location" size={18} color={c.primary} />}
                <Text style={[styles.locationButtonText, { color: c.primary }]}>
                  {capturingLocation ? 'Merekam...' : finalGps ? 'Perbarui Lokasi' : 'Rekam Lokasi GPS'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Buttons Row */}
            <View style={styles.buttonsRow}>
              <TouchableOpacity style={[styles.cancelButton, { backgroundColor: c.surface, borderColor: c.border }]} onPress={onBack}>
                <Text style={[styles.cancelButtonText, { color: c.textSecondary }]}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.startButton, (!selectedService || !finalGps) && styles.buttonDisabled]}
                onPress={() => {
                  if (!selectedService) {
                    Alert.alert('Validasi', 'Pilih fasilitas layanan terlebih dahulu');
                    return;
                  }
                  if (!finalGps) {
                    Alert.alert('Validasi', 'Rekam lokasi GPS terlebih dahulu');
                    return;
                  }
                  // Capture start timestamp when surveyor begins questions
                  setStartedAt(new Date().toISOString());
                  // Set current section to first section when starting
                  if (activeSections.length > 0) {
                    setCurrentSectionId(activeSections[0].id);
                    setCurrentQuestionIndex(0);
                  }
                  setSetupComplete(true);
                  // Check if first section has introduction_text to show intro screen
                  const firstSection = activeSections[0];
                  if (firstSection?.introduction_text) {
                    setShowIntroScreen(true);
                  }
                }}
                disabled={!selectedService || !finalGps}
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
        <TouchableOpacity style={styles.backButtonCentered} onPress={onSave}>
          <Text style={styles.backButtonText}>Kembali</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // --- KONFIRMASI & KIRIM SCREEN ---
  if (showConfirmScreen && !isSubmitted) {
    return (
      <KeyboardAvoidingView style={[styles.container, { backgroundColor: c.background }]} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={[styles.contentWrapper, { backgroundColor: c.background }]}>
          <View style={[styles.pageHeader, { backgroundColor: c.surface, borderBottomWidth: 1, borderBottomColor: c.border }]}>
            <TouchableOpacity onPress={() => setShowConfirmScreen(false)} style={styles.backIcon}>
              <MaterialIcons name="arrow-back" size={22} color={c.text} />
            </TouchableOpacity>
            <Text style={[styles.sectionIndicator, { color: c.textSecondary }]}>Konfirmasi & Kirim</Text>
          </View>
          <View style={styles.progressContainer}>
            <View style={[styles.progressBar, { backgroundColor: c.border }]}>
              <View style={[styles.progressFill, { width: '100%', backgroundColor: c.primary }]} />
            </View>
            <Text style={[styles.progressText, { color: c.primary }]}>100%</Text>
          </View>
          <ScrollView style={[styles.content, { backgroundColor: c.background }]} contentContainerStyle={{ flexGrow: 1, paddingBottom: 32 }}>
            <View style={{ alignItems: 'center', paddingTop: 48, paddingHorizontal: 24 }}>
              {/* Thank You Icon */}
              <View style={styles.thankYouIcon}>
                <MaterialIcons name="check-circle" size={64} color={c.primary} />
              </View>
              <Text style={[styles.thankYouTitle, { color: c.text, marginTop: 16 }]}>Terima Kasih!</Text>
              <Text style={[styles.thankYouSubtitle, { color: c.textSecondary, marginTop: 8, textAlign: 'center' }]}>
                Semua pertanyaan telah dijawab.{'\n'}Survei Anda siap dikirim.
              </Text>

              {/* GPS Status Summary */}
              <View style={{ width: '100%', backgroundColor: c.surface, borderRadius: 8, padding: 16, marginTop: 32, borderWidth: 1, borderColor: c.border }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <MaterialIcons name={isValidGps(finalGps) ? 'check-circle' : 'warning'} size={22} color={isValidGps(finalGps) ? '#059669' : '#f59e0b'} />
                    <View>
                      <Text style={{ fontSize: 14, fontWeight: '600', color: c.text }}>
                        Lokasi GPS
                      </Text>
                      <Text style={{ fontSize: 12, color: c.textSecondary }}>
                        {formatGpsCoord(finalGps, 'Belum direkam')}
                      </Text>
                    </View>
                  </View>
                  {!isValidGps(finalGps) && (
                    <TouchableOpacity
                      style={{ backgroundColor: c.primary + '15', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 }}
                      onPress={captureFinalGPS}
                      disabled={capturingLocation}
                    >
                      {capturingLocation ? (
                        <ActivityIndicator size="small" color={c.primary} />
                      ) : (
                        <Text style={{ fontSize: 13, color: c.primary, fontWeight: '600' }}>Rekam</Text>
                      )}
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={[styles.buttonsRow, { paddingHorizontal: 16, marginTop: 32 }]}>
              <TouchableOpacity
                style={[styles.draftButton, { backgroundColor: c.surface, borderColor: c.border }, saving && styles.buttonDisabled]}
                onPress={() => handleSave(false)}
                disabled={saving}
              >
                <Text style={[styles.draftButtonText, { color: c.textSecondary }]}>Simpan Draft</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.submitButton, saving && styles.buttonDisabled]}
                onPress={() => handleSave(true)}
                disabled={saving}
              >
                {saving
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <Text style={styles.submitButtonText}>Kirim Survei</Text>}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    );
  }

  // --- INTRO SCREEN (teks pengantar before questions) ---
  if (showIntroScreen && currentSection) {
    const introText = currentSection.introduction_text;
    return (
      <View style={styles.container}>
        <View style={styles.contentWrapper}>
          <View style={styles.pageHeader}>
            <TouchableOpacity
              onPress={() => {
                // Go back using navHistory if available, otherwise fallback
                if (navHistory.length > 0) {
                  const prevPos = navHistory[navHistory.length - 1];
                  setNavHistory((prev) => prev.slice(0, -1));
                  setShowIntroScreen(false);
                  setCurrentSectionId(prevPos.sectionId);
                  setCurrentQuestionIndex(prevPos.questionIndex);
                } else if (currentSectionIndex > 0) {
                  const newSectionId = activeSections[currentSectionIndex - 1]?.id;
                  const prevSection = activeSections[currentSectionIndex - 1];
                  const prevSectionQuestions = getFlowBasedQuestions(prevSection!, answers, questionsMap, template?.sections, answers);
                  setShowIntroScreen(false);
                  if (newSectionId != null) {
                    setCurrentSectionId(newSectionId);
                    setCurrentQuestionIndex(Math.max(0, prevSectionQuestions.length - 1));
                  }
                } else {
                  setShowIntroScreen(false);
                  setSetupComplete(false);
                }
              }}
              style={styles.backIcon}
            >
              <MaterialIcons name="arrow-back" size={22} color={c.text} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={[styles.content, { backgroundColor: c.background }]}
            contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingBottom: 32 }}
          >
            {/* Teks Pengantar */}
            {introText ? (
              <View style={[styles.introBox, { backgroundColor: isDark ? '#1f1f1f' : '#fefce8', borderColor: isDark ? '#404040' : '#fde68a' }]}>
                <Text style={[styles.introText, { color: c.text }]}>{toUpper(introText.replace(/\(nama enumerator\)/gi, currentUserName))}</Text>
              </View>
            ) : (
              <View style={[styles.introBox, { backgroundColor: isDark ? '#1f1f1f' : '#fefce8', borderColor: isDark ? '#404040' : '#fde68a' }]}>
                <Text style={[styles.introText, { color: c.text }]}>
                  BAGIAN INI BERISI {totalItemsInSection} PERTANYAAN.
                  SILAKAN JAWAB SETIAP PERTANYAAN DENGAN BENAR.
                </Text>
              </View>
            )}

            {/* Next button to start questions */}
            <View style={[styles.buttonsRow, { marginTop: 32 }]}>
              <TouchableOpacity
                style={styles.nextButton}
                onPress={() => setShowIntroScreen(false)}
              >
                <Text style={styles.nextButtonText}>
                  {currentSectionIndex < activeSections.length - 1
                    ? 'Mulai Bagian'
                    : 'Mulai'}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    );
  }

  // --- MAIN QUESTIONNAIRE ---
  return (
    <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: c.background }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'android' ? 0 : 0}
      >
      <View style={[styles.contentWrapper, { backgroundColor: c.background }]}>
        {/* Header */}
        <View style={[styles.pageHeader, { backgroundColor: c.surface, borderBottomWidth: 1, borderBottomColor: c.border }]}>
          <TouchableOpacity
            onPress={() => {
              if (currentQuestionIndex > 0) {
                handlePrevious();
              } else if (currentSectionIndex > 0) {
                handlePrevious();
              } else {
                onBack();
              }
            }}
            style={styles.backIcon}
          >
            <MaterialIcons name="arrow-back" size={22} color={c.text} />
          </TouchableOpacity>
        </View>

        <ScrollView
          ref={scrollRef}
          style={[styles.content, { backgroundColor: c.background }]}
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingBottom: 32 }}
        >
          {/* MTC context banner — shown only for detail questions (RQA..RQJ, IQA..IQC, etc.) */}
          {currentQCtx && isDetailQuestion(currentQ?.code ?? '') && (
            <View style={[styles.mtcBanner, { backgroundColor: isDark ? '#1a2e2e' : '#e6f7f7', borderColor: c.primary }]}>
              <Text style={[styles.mtcBannerCode, { color: c.primary, fontSize: fs(15), fontWeight: '700' }]}>{currentQCtx}</Text>
              {currentMtcLabel ? (
                <Text style={[styles.mtcBannerLabel, { color: c.textSecondary, marginLeft: 4 }]} numberOfLines={2}>— {toUpper(currentMtcLabel)}</Text>
              ) : null}
            </View>
          )}

          {/* ONE question or hint — full screen */}
          {(() => {
            console.log(`[RENDER] activeFlowItems.length=${activeFlowItems.length} currentQuestionIndex=${currentQuestionIndex} currentFlowItem=${JSON.stringify(currentFlowItem ? { kind: currentFlowItem.kind, code: currentFlowItem.kind === 'question' ? currentFlowItem.question.code : currentFlowItem.kind === 'hint' ? currentFlowItem.questionCode : 'END' } : null)} currentQ=${currentQ?.code ?? null}`);
            return null;
          })()}
          {currentFlowItem?.kind === 'hint' ? (
            <View style={styles.questionScreenContainer}>
              {renderHintPage(currentFlowItem)}
            </View>
          ) : currentFlowItem?.kind === 'end_survey' ? (
            <View style={styles.questionScreenContainer}>
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 }}>
                <MaterialIcons name="info-outline" size={48} color="#00979D" />
                <Text style={{ fontSize: 18, fontWeight: '600', color: c.text, marginTop: 16, textAlign: 'center' }}>
                  Survei Selesai
                </Text>
                <Text style={{ fontSize: 14, color: c.textSecondary, marginTop: 8, textAlign: 'center' }}>
                  Anda telah menyelesaikan survei.{'n'}Data akan disimpan.
                </Text>
                <TouchableOpacity
                  style={{ marginTop: 32, backgroundColor: '#00979D', paddingHorizontal: 32, paddingVertical: 14, borderRadius: 8 }}
                  onPress={() => {
                    // Auto-save as submitted and show confirmation
                    handleSave(true);
                  }}
                >
                  <Text style={{ color: '#fff', fontWeight: '600', fontSize: 15 }}>Simpan & Selesaikan</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : currentQ ? (
            <View style={styles.questionScreenContainer}>
              {/* Single question card */}
              {renderQuestion(currentQ, currentQuestionIndex)}
            </View>
          ) : (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 40 }}>
              <Text style={{ fontSize: 16, color: '#6b7280', textAlign: 'center' }}>
                Pertanyaan tidak tersedia atau sudah selesai. ({activeFlowItems.length}/{currentQuestionIndex})
              </Text>
              <View style={[styles.buttonsRow, { marginTop: 24, backgroundColor: 'transparent' }]}>
                <TouchableOpacity
                  style={[styles.draftButton, { backgroundColor: c.surface, borderColor: c.border }, saving && styles.buttonDisabled]}
                  onPress={() => handleSave(false)}
                  disabled={saving}
                >
                  <Text style={[styles.draftButtonText, { color: c.textSecondary }]}>Simpan Draft</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[{ flex: 1, backgroundColor: c.primary, borderRadius: 6, paddingVertical: 14, alignItems: 'center', marginLeft: 14 }]}
                  onPress={() => {
                    // Find next section with non-empty flow
                    let nextIdx = currentSectionIndex + 1;
                    while (nextIdx < activeSections.length) {
                      const nextSection = activeSections[nextIdx];
                      const nextFlow = getFlowItems(nextSection, resolvedAnswers, questionsMap, template?.sections, answers);
                      if (nextFlow.length > 0) {
                        // Found non-empty section
                        if (nextSection?.introduction_text) {
                          setCurrentSectionId(nextSection.id);
                          setCurrentQuestionIndex(0);
                          setShowIntroScreen(true);
                        } else {
                          setCurrentSectionId(nextSection.id);
                          setCurrentQuestionIndex(0);
                        }
                        scrollRef.current?.scrollTo({ y: 0, animated: true });
                        return;
                      }
                      nextIdx++;
                    }
                    // No more sections with questions - show confirm screen
                    setShowConfirmScreen(true);
                  }}
                >
                  <Text style={styles.nextButtonText}>
                    {currentSectionIndex < activeSections.length - 1 ? 'Bagian Berikutnya' : 'Selesai'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Navigation Buttons */}
          {currentFlowItem && (
          <View style={[styles.buttonsRow, { backgroundColor: c.background }]}>
            <TouchableOpacity
              style={[styles.draftButton, { backgroundColor: c.surface, borderColor: c.border }, saving && styles.buttonDisabled]}
              onPress={() => handleSave(false)}
              disabled={saving}
            >
              <Text style={[styles.draftButtonText, { color: c.textSecondary }]}>Simpan Draft</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.nextButton, { backgroundColor: c.primary }]} onPress={handleNext}>
              <Text style={[styles.nextButtonText, { color: '#fff' }]}>
                {currentFlowItem?.kind === 'end_survey'
                  ? 'Selesai'
                  : currentQuestionIndex < totalItemsInSection - 1
                    ? 'Selanjutnya'
                    : currentSectionIndex < activeSections.length - 1
                      ? 'Bagian Berikutnya'
                      : 'Selesai'}
              </Text>
            </TouchableOpacity>
          </View>
          )}
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
  backButtonCentered: { marginTop: 16, paddingVertical: 14, paddingHorizontal: 32, backgroundColor: '#03979D', borderRadius: 6 },
  backButtonText: { color: '#fff', fontWeight: '700', fontSize: 18 },

  // Header
  pageHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 10, gap: 10 },
  backIcon: { padding: 4 },
  sectionIndicator: { fontSize: 12, color: '#6b7280' },

  // Progress
  progressContainer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 4, paddingBottom: 8, gap: 12 },
  questionProgressText: { fontWeight: '600', color: '#03979D' },
  questionProgressBar: { flex: 1, height: 6, backgroundColor: '#e5e7eb', borderRadius: 3, overflow: 'hidden' },
  questionProgressFill: { height: '100%', backgroundColor: '#03979D', borderRadius: 3 },
  progressBar: { flex: 1, height: 5, backgroundColor: '#e5e7eb', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#03979D', borderRadius: 3 },
  progressText: { fontSize: 11, fontWeight: '600', color: '#03979D', width: 32, textAlign: 'right' },

  // Content
  content: { flex: 1, padding: 16 },

  // Template info
  templateName: { fontSize: 18, fontWeight: '700', color: '#374151', marginBottom: 16 },
  templateDesc: { fontSize: 12, color: '#6b7280', lineHeight: 18, marginBottom: 16 },

  // Question code
  questionCode: { fontSize: 14, fontWeight: '700', color: '#03979D', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },

  // Section header
  sectionHeaderContainer: { marginBottom: 16 },
  sectionHeader: { fontWeight: '700', color: '#374151', marginBottom: 4 },
  sectionSubtitle: { fontSize: 12, color: '#6b7280', lineHeight: 18 },
  introBox: { marginTop: 10, marginBottom: 16, padding: 14, backgroundColor: '#fefce8', borderRadius: 6, borderWidth: 1, borderColor: '#fde68a' },
  introText: { fontSize: 16, color: '#78350f', lineHeight: 22 },
  hintBanner: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#e6f7f7', borderRadius: 6, borderWidth: 1.5, borderColor: '#03979D', padding: 12, marginBottom: 14, gap: 10 },
  hintBannerIcon: { marginTop: 2, flexShrink: 0 },
  hintBannerContent: { flex: 1 },
  hintBannerPrevAnswer: { fontSize: 12, fontWeight: '700', color: '#03979D', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.3 },
  hintBannerText: { fontSize: 14, color: '#374151', lineHeight: 20 },
  mtcBanner: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', marginTop: 8, padding: 10, backgroundColor: '#e6f7f7', borderRadius: 6, borderWidth: 1, borderColor: '#b2e0e1' },
  mtcBannerLabel: { fontSize: 15, color: '#4b5563' },
  mtcBannerCode: { fontSize: 15, fontWeight: '700', color: '#03979D' },

  // Detail group header (shown above each RQA-RQJ block)
  detailGroupHeader: { flexDirection: 'row', alignItems: 'stretch', marginBottom: 12, marginLeft: 8 },
  detailGroupHeaderBar: { width: 3, borderRadius: 2, backgroundColor: '#03979D', marginRight: 10 },
  detailGroupHeaderContent: { flex: 1, justifyContent: 'center' },
  detailGroupHeaderTrigger: { fontSize: 13, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.4 },
  detailGroupHeaderCtx: { fontSize: 15, fontWeight: '600', color: '#03979D', marginTop: 1 },

  // Wrapper that indents detail questions under their trigger
  detailQuestionWrapper: { marginLeft: 8, borderLeftWidth: 2, borderLeftColor: '#b2e0e1', paddingLeft: 8 },

  // Form
  formGroup: { marginBottom: 16 },
  label: { fontSize: 15, fontWeight: '600', color: '#4b5563', marginBottom: 6, lineHeight: 20 },

  // Question — one per screen
  questionScreenContainer: { flex: 1, paddingTop: 8, paddingBottom: 8 },
  questionContainer: { marginBottom: 20, paddingVertical: 20, paddingHorizontal: 20, borderRadius: 6 },
  questionHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 18 },
  speakerButton: { marginTop: 2, padding: 4 },
  questionText: { flex: 1, fontWeight: '600', color: '#374151', lineHeight: 38, letterSpacing: 0.3 },
  required: { color: '#dc2626' },
  helpText: { fontSize: 13, color: '#6b7280', marginBottom: 8, lineHeight: 18, fontStyle: 'italic' },
  errorText: { fontSize: 14, color: '#dc2626', marginTop: 6 },

  // Inputs
  inputBox: { backgroundColor: '#ffffff', borderRadius: 6, padding: 16, fontSize: 18, color: '#1a1a1a', borderWidth: 1, borderColor: '#e5e7eb' },
  inputWithIcon: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff', borderRadius: 6, paddingHorizontal: 14, paddingVertical: 4, gap: 8, borderWidth: 1, borderColor: '#e5e7eb' },
  input: { flex: 1, paddingVertical: 10, fontSize: 18, color: '#1a1a1a' },
  textArea: { minHeight: 100, paddingTop: 12, textAlignVertical: 'top' },
  disabledInput: { backgroundColor: '#f3f4f6' },
  disabledText: { fontSize: 16, color: '#9ca3af' },

  // Boolean
  booleanRow: { flexDirection: 'row', gap: 14 },
  booleanOption: { flex: 1, flexDirection: 'row', backgroundColor: '#fff', borderRadius: 6, paddingVertical: 18, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center', gap: 10, borderWidth: 2, borderColor: '#e5e7eb' },
  booleanSelected: { borderColor: '#03979D', backgroundColor: '#f0f9ff' },
  booleanText: { fontSize: 18, fontWeight: '600', color: '#6b7280' },
  booleanTextSelected: { color: '#03979D' },

  // Choices
  choicesContainer: { gap: 12 },
  choiceOption: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 6, padding: 16, gap: 12, borderWidth: 2, borderColor: '#e5e7eb' },
  choiceSelected: { borderColor: '#03979D', backgroundColor: '#f0f9ff' },
  choiceLabelContainer: { flex: 1 },
  choiceLabel: { fontSize: 18, fontWeight: '500', color: '#374151', flex: 1 },
  choiceLabelSelected: { color: '#03979D', fontWeight: '700' },
  choiceHint: { fontSize: 12, color: '#9ca3af', marginTop: 2 },
  otherInput: { marginLeft: 36, marginTop: 6, marginBottom: 6, borderWidth: 1, borderColor: '#d1d5db', borderRadius: 6, paddingHorizontal: 14, paddingVertical: 10, fontSize: 16, color: '#1A1A1A', backgroundColor: '#fff' },
  choiceAudioBtn: { width: 32, height: 32, borderRadius: 6, borderWidth: 1.5, borderColor: '#d1d5db', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  choiceAudioBtnActive: { borderColor: '#03979D', backgroundColor: '#e6f7f7' },

  // Radio
  radio: { width: 24, height: 24, borderRadius: 6, borderWidth: 2.5, borderColor: '#d1d5db', alignItems: 'center', justifyContent: 'center' },
  radioSelected: { borderColor: '#03979D' },
  radioInner: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#03979D' },

  // Checkbox
  checkbox: { width: 24, height: 24, borderRadius: 6, borderWidth: 2.5, borderColor: '#d1d5db', alignItems: 'center', justifyContent: 'center' },
  checkboxSelected: { borderColor: '#03979D', backgroundColor: '#03979D' },

  // Picker
  picker: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#ffffff', borderRadius: 6, padding: 14 },
  pickerText: { fontSize: 16, color: '#374151', flex: 1 },
  pickerPlaceholder: { fontSize: 16, color: '#9ca3af', flex: 1 },
  pickerDisabled: { backgroundColor: '#f3f4f6', opacity: 0.7 },
  pickerClose: { backgroundColor: '#f3f4f6', padding: 10, borderRadius: 6, alignItems: 'center', marginBottom: 4 },
  pickerCloseText: { fontSize: 14, fontWeight: '600', color: '#6b7280' },
  pickerList: { maxHeight: 240, backgroundColor: '#fff', borderRadius: 6 },
  pickerItem: { padding: 14, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  pickerItemSelected: { backgroundColor: '#f0f9ff' },
  pickerItemText: { fontSize: 16, color: '#374151' },
  pickerItemTextSelected: { color: '#03979D', fontWeight: '600' },

  // Picker modal overlay
  pickerOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'flex-end', zIndex: 999 },
  pickerBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },
  pickerModal: { backgroundColor: '#fff', borderTopLeftRadius: 16, borderTopRightRadius: 16, paddingBottom: 32, maxHeight: 400 },
  pickerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  pickerHeaderText: { fontSize: 16, fontWeight: '700', color: '#374151' },

  // Location
  locationContainer: { gap: 14 },
  locationField: { gap: 4 },
  locationFieldLabel: { fontSize: 14, fontWeight: '600', color: '#6b7280' },
  locationButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#ffffff', borderRadius: 6, paddingVertical: 14, gap: 8 },
  locationButtonText: { fontSize: 16, color: '#03979D', fontWeight: '600' },
  locationInfo: { marginTop: 8, padding: 12, backgroundColor: '#f0f9ff', borderRadius: 6 },
  locationCoordText: { fontSize: 14, color: '#1e40af', fontWeight: '500' },
  locationAccuracyText: { fontSize: 12, color: '#60a5fa', marginTop: 4 },

  // Table
  tableContainer: { backgroundColor: '#fff', borderRadius: 6, overflow: 'hidden' },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  tableCell: { flex: 1, padding: 10, alignItems: 'center', justifyContent: 'center' },
  tableLabelCell: { flex: 2, alignItems: 'flex-start' },
  tableHeaderText: { fontSize: 13, fontWeight: '700', color: '#6b7280' },
  tableCellLabel: { fontSize: 16, color: '#374151' },
  tableCellInput: { fontSize: 14, color: '#374151', textAlign: 'center', padding: 6, width: '100%' },

  // Service picker
  serviceList: { flex: 1, padding: 16 },
  serviceItem: { backgroundColor: '#fff', borderRadius: 8, padding: 14, marginBottom: 10, borderWidth: 1.5, borderColor: '#e5e7eb', flexDirection: 'row', alignItems: 'center' },
  serviceName: { fontSize: 14, color: '#374151', fontWeight: '500' },
  serviceCity: { fontSize: 11, color: '#9ca3af', marginTop: 3 },
  serviceMtc: { fontSize: 10, color: '#9ca3af', marginTop: 2 },
  faskesBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, marginLeft: 8 },
  faskesBadgeText: { fontSize: 11, fontWeight: '600' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  searchInput: { flex: 1, fontSize: 16, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 },
  filterTabs: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 10, gap: 8, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  filterTab: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 },
  filterTabText: { fontSize: 13, fontWeight: '600' },
  addServiceBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginHorizontal: 16, marginTop: 12, marginBottom: 4, paddingVertical: 12, borderRadius: 8, borderWidth: 1.5, gap: 8 },
  addServiceBtnText: { fontSize: 14, fontWeight: '600', color: '#00979D' },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyStateText: { fontSize: 15, marginTop: 12 },
  pageTitle: { fontSize: 17, fontWeight: '700', flex: 1, textAlign: 'center' },

  // Buttons
  buttonsRow: { flexDirection: 'row', gap: 14, marginTop: 16, marginBottom: 24 },
  startButton: { flex: 1, backgroundColor: '#03979D', borderRadius: 6, paddingVertical: 14, alignItems: 'center' },
  startButtonText: { fontSize: 15, fontWeight: '600', color: '#fff' },
  nextButton: { flex: 1, backgroundColor: '#03979D', borderRadius: 6, paddingVertical: 14, alignItems: 'center' },
  nextButtonText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  submitButton: { flex: 1, backgroundColor: '#03979D', borderRadius: 6, paddingVertical: 14, alignItems: 'center' },
  submitButtonText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  thankYouIcon: { marginBottom: 16 },
  thankYouTitle: { fontSize: 32, fontWeight: '700', color: '#1a1a1a', marginBottom: 12, textAlign: 'center' },
  thankYouSubtitle: { fontSize: 16, color: '#6b7280', textAlign: 'center', lineHeight: 24, maxWidth: 320 },
  draftButton: { flex: 1, backgroundColor: '#e5e7eb', borderRadius: 6, paddingVertical: 14, alignItems: 'center' },
  draftButtonText: { fontSize: 15, fontWeight: '600', color: '#374151' },
  cancelButton: { flex: 1, backgroundColor: '#e5e7eb', borderRadius: 6, paddingVertical: 16, alignItems: 'center' },
  cancelButtonText: { fontSize: 16, fontWeight: '600', color: '#374151' },
  buttonDisabled: { opacity: 0.6 },

  // Hint page styles
  hintPageHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  hintPageLabel: { fontWeight: '600', color: '#00979D' },
  hintPagePrevAnswer: { backgroundColor: '#f0f9ff', borderRadius: 6, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: '#b2e0e1' },
  hintPagePrevAnswerLabel: { color: '#6b7280', marginBottom: 4 },
  hintPagePrevAnswerValue: { fontWeight: '700', color: '#00979D' },
  hintPageText: { marginTop: 8 },
  hintPageBodyText: {},

  // Operating hours
  opHoursContainer: { backgroundColor: '#fff', borderRadius: 8, overflow: 'hidden', marginBottom: 12 },
  opHoursRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 12 },
  opHoursColLabel: { fontSize: 12, fontWeight: '700', color: '#6b7280', textAlign: 'center' },
  opHoursCol: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  opHoursCellText: { fontSize: 14, color: '#374151', flex: 1, textAlign: 'center' },
  opHoursTimeInput: { fontSize: 14, color: '#374151', textAlign: 'center', backgroundColor: '#f9fafb', borderRadius: 6, paddingVertical: 8, paddingHorizontal: 4, width: '100%', borderWidth: 1, borderColor: '#e5e7eb' },
  opHoursAddButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 6, borderWidth: 1.5, borderColor: '#00979D', borderStyle: 'dashed' },
  opHoursAddButtonText: { fontSize: 14, fontWeight: '600', color: '#00979D' },

  // Kegiatan table (kegiatans with start/stop time pickers)
  kegTableContainer: { backgroundColor: '#fff', borderRadius: 8, overflow: 'hidden', marginBottom: 12 },
  kegHeaderRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 12, backgroundColor: '#f3f4f6', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  kegRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  kegColLabel: { fontSize: 12, fontWeight: '700', color: '#6b7280', textAlign: 'center' },
  kegNumText: { width: 40, fontSize: 13, color: '#6b7280', textAlign: 'center', fontWeight: '600' },
  kegTextInput: { flex: 2, fontSize: 14, color: '#374151', backgroundColor: '#f9fafb', borderRadius: 6, paddingVertical: 8, paddingHorizontal: 10, borderWidth: 1, borderColor: '#e5e7eb', marginHorizontal: 4 },
  kegTimeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, backgroundColor: '#f9fafb', borderRadius: 6, paddingVertical: 8, paddingHorizontal: 8, borderWidth: 1, borderColor: '#e5e7eb', marginHorizontal: 2 },
  kegTimeText: { fontSize: 14, color: '#374151', textAlign: 'center' },
});
