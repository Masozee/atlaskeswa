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
  Image,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { ArrowUp01Icon, ArrowDown01Icon } from 'hugeicons-react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import * as Speech from 'expo-speech';
import DatePicker from 'react-native-date-picker';
import { apiClient } from '../services/api';
import { database } from '../services/database';
import NetInfo from '@react-native-community/netinfo';
import { useSettings, useTheme, useFontScale } from '../contexts/SettingsContext';
import { prepareImageForUpload } from '../lib/upload-image';
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

const formatTemplateName = (name: string): string => {
  if (/ommha/i.test(name)) {
    return 'Kuisioner OMMHA (One Map for Mental Health)';
  }
  return toSentenceCase(name);
};

const toUpper = (text: string): string => {
  if (!text) return text;
  return text.toUpperCase();
};

// Format number with dot as thousands separator (Indonesian style): 10000 → "10.000"
const formatThousands = (val: number | string | null | undefined): string => {
  if (val === '' || val === null || val === undefined) return '';
  const str = String(val);
  const [intPart, decPart] = str.split('.');
  const formatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return decPart !== undefined ? `${formatted}.${decPart}` : formatted;
};

// Strip dot thousand separators before parsing
const stripThousands = (text: string): string => text.replace(/\./g, '');

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

const formatDisplayDate = (value?: string | null): string => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

interface Service {
  id: number;
  name: string;
  city?: string;
  province?: string;
  kecamatan?: string;
  kategori_fasilitas?: 'KESEHATAN' | 'NON_KESEHATAN' | '';
  kategori_fasilitas_display?: string;
  mtc_name?: string;
  bsic_code?: string;
  bsic_name?: string;
  service_type_name?: string;
}

interface DynamicSurveyFormScreenProps {
  templateId?: number;
  responseId?: number;
  onBack: () => void;
  onSave: () => void;
}

interface FileAnswerValue {
  uri?: string;
  file_url?: string;
  file?: string;
  name?: string;
  type?: string;
  uploaded?: boolean;
}

const getFileAnswerObject = (value: any): FileAnswerValue | null => {
  if (!value) return null;
  if (typeof value === 'string') {
    return value.startsWith('http') ? { file_url: value, uploaded: true } : null;
  }
  if (typeof value === 'object') {
    return value as FileAnswerValue;
  }
  return null;
};

const getFilePreviewUri = (value: any): string | null => {
  const file = getFileAnswerObject(value);
  return file?.uri || file?.file_url || file?.file || null;
};

const isPendingLocalFile = (value: any): boolean => {
  const file = getFileAnswerObject(value);
  return !!file?.uri && !file.uri.startsWith('http');
};

const getFileDisplayName = (value: any): string => {
  const file = getFileAnswerObject(value);
  if (!file) return '';
  if (file.name) return file.name;
  const uri = file.uri || file.file_url || file.file || '';
  if (!uri) return '';
  const cleanUri = uri.split('?')[0];
  return cleanUri.split('/').pop() || '';
};

const getOtherInputType = (questionCode: string, choice: QuestionOption): string => {
  if (questionCode === 'Q15' && choice.value === 'TANGGAL') return 'date';
  if (questionCode === 'Q15' && choice.value === 'TIDAK_DIKETAHUI') return 'integer';
  return choice.other_input_type || 'text';
};

const getOtherInputPlaceholder = (questionCode: string, choice: QuestionOption): string => {
  if (questionCode === 'Q15' && choice.value === 'TANGGAL') return 'YYYY-MM-DD';
  if (questionCode === 'Q15' && choice.value === 'TIDAK_DIKETAHUI') return 'YYYY';
  return choice.other_input_label || 'Sebutkan';
};

const getOtherInputKeyboardType = (otherInputType: string) => (
  otherInputType === 'integer' ? 'number-pad' :
  otherInputType === 'decimal' ? 'decimal-pad' :
  otherInputType === 'phone' ? 'phone-pad' :
  otherInputType === 'email' ? 'email-address' :
  'default'
);

const formatDateInputValue = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const parseDateInputValue = (value?: string): Date => {
  if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split('-').map((part) => parseInt(part, 10));
    return new Date(year, month - 1, day);
  }
  return new Date();
};

const FORCE_REQUIRED_ANSWER_TYPES = new Set<Question['answer_type']>([
  'STAFF_TABLE',
  'INTERVENTION_MATRIX',
  'MATRIX_KEGIATAN',
]);

const isBlankValue = (value: any) => (
  value === null
  || value === undefined
  || value === ''
  || (typeof value === 'string' && value.trim() === '')
  || (Array.isArray(value) && value.length === 0)
);

const isQuestionRequired = (question: Question) => (
  question.is_required || FORCE_REQUIRED_ANSWER_TYPES.has(question.answer_type)
);

const isSocialMediaDetailQuestion = (questionCode: string) => (
  questionCode === 'IQC' || questionCode === 'SIQC'
);

const hasFilledValue = (value: any): boolean => {
  if (isBlankValue(value)) return false;
  if (Array.isArray(value)) return value.some((item) => hasFilledValue(item));
  if (typeof value === 'object') return Object.values(value).some((item) => hasFilledValue(item));
  return true;
};

const hasCompleteStaffTable = (question: Question, value: any): boolean => {
  const config = question.table_config;

  if (config?.rows?.length) {
    const columns = config.columns?.length
      ? config.columns
      : [
          { code: 'LAKI_LAKI' },
          { code: 'PEREMPUAN' },
        ];
    if (!value || Array.isArray(value) || typeof value !== 'object') return false;

    return config.rows.every((row) =>
      columns.every((col) => !isBlankValue(value[row.code]?.[col.code]))
    );
  }

  if (!Array.isArray(value) || value.length === 0) return false;
  return value.every((row) =>
    !isBlankValue(row?.jabatan)
    && !isBlankValue(row?.laki)
    && !isBlankValue(row?.perempuan)
  );
};

const hasCompleteMatrixKegiatan = (value: any): boolean => {
  if (!Array.isArray(value) || value.length === 0) return false;
  return value.every((row) =>
    !isBlankValue(row?.nama_kegiatan)
    && Array.isArray(row?.hari)
    && row.hari.length > 0
  );
};

const hasCompleteInterventionMatrix = (question: Question, value: any): boolean => {
  const config = question.table_config;
  const hasSubQuestions = Array.isArray(config?.sub_questions) && config.sub_questions.length > 0;

  if (hasSubQuestions) {
    if (!Array.isArray(value) || value.length === 0) return false;
    return value.some((row) =>
      !isBlankValue(row?.label)
      && config!.sub_questions!.some((subQuestion) => hasFilledValue(row?.[subQuestion.code]))
    );
  }

  if (!value || Array.isArray(value) || typeof value !== 'object') return false;
  return Object.values(value).some((row: any) => row?.selected && hasFilledValue(row));
};

const getRequiredError = (question: Question, value: any): string | null => {
  if (!isQuestionRequired(question)) return null;

  if (question.answer_type === 'STAFF_TABLE') {
    return hasCompleteStaffTable(question, value) ? null : 'Tabel staf wajib diisi lengkap';
  }

  if (question.answer_type === 'MATRIX_KEGIATAN') {
    return hasCompleteMatrixKegiatan(value) ? null : 'Matrix wajib diisi lengkap';
  }

  if (question.answer_type === 'INTERVENTION_MATRIX') {
    return hasCompleteInterventionMatrix(question, value) ? null : 'Matrix wajib diisi';
  }

  return isBlankValue(value) ? 'Pertanyaan ini wajib diisi' : null;
};

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
              <Text style={{ fontSize: fs(14), color: isYaActive ? c.primary : '#374151', fontWeight: isYaActive ? '600' : '400' }}>YA</Text>
            </TouchableOpacity>
            {/* Tidak button */}
            <TouchableOpacity
              onPress={() => updateRowField(rowId, sq.code, false)}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, borderWidth: 1.5, borderColor: isTidakActive ? c.primary : '#d1d5db', backgroundColor: isTidakActive ? '#e6f7f7' : 'white' }}
            >
              <View style={{ width: fs(16), height: fs(16), borderRadius: 8, borderWidth: 2, borderColor: isTidakActive ? c.primary : '#9ca3af', alignItems: 'center', justifyContent: 'center', backgroundColor: 'white' }}>
                {isTidakActive && <View style={{ width: fs(8), height: fs(8), borderRadius: 4, backgroundColor: c.primary }} />}
              </View>
              <Text style={{ fontSize: fs(14), color: isTidakActive ? c.primary : '#374151', fontWeight: isTidakActive ? '600' : '400' }}>TIDAK</Text>
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
  const [showOtherDatePicker, setShowOtherDatePicker] = useState<{ key: string; value: string } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [currentSectionId, setCurrentSectionId] = useState<number | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [currentMtcContext, setCurrentMtcContext] = useState<string>('');
  const [currentMtcLabel, setCurrentMtcLabel] = useState<string>('');
  const [currentMtcCode, setCurrentMtcCode] = useState<string>('');
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

  // Simple confirmation screen before final submit

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
      const loadServices = async () => {
        if (isOnline) {
          try {
            const servicesData = await apiClient.get<PaginatedResponse<Service>>(
              '/directory/services/',
              { page_size: 100, ordering: 'name' }
            );
            const serviceResults = Array.isArray(servicesData?.results) ? servicesData.results : [];
            setServices(serviceResults);
            await database.saveServices(serviceResults);
            return;
          } catch {
            // Fall back to cache below.
          }
        }
        const cached = await database.getServices();
        setServices(cached);
      };

      const loadCurrentUser = async () => {
        if (!isOnline) return;
        try {
          const userData = await apiClient.get<any>('/accounts/users/me/');
          const fullName = userData.full_name
            || (userData.first_name || userData.last_name
              ? `${userData.first_name || ''} ${userData.last_name || ''}`.trim()
              : userData.email?.split('@')[0] || '');
          setCurrentUserName(fullName);
        } catch {
          // user name unavailable
        }
      };

      const loadUsedServiceIds = async () => {
        if (isOnline) {
          try {
            const responses = await apiClient.get<any>(
              '/surveys/responses/',
              { page_size: 1000 },
              { 'X-Show-All': 'true' }
            );
            const rows = Array.isArray(responses) ? responses : (responses?.results || []);
            const ids = new Set<number>();
            rows.forEach((r: any) => {
              if (r.service && typeof r.service === 'object') ids.add(r.service.id);
              else if (r.service) ids.add(r.service);
            });
            setUsedServiceIds(ids);
            return;
          } catch {
            // Fall back to local data below.
          }
        }
        try {
          const localSurveys = await database.getSurveys();
          setUsedServiceIds(new Set(localSurveys.map((s: any) => s.service_id)));
        } catch {
          // skip
        }
      };

      const KEBUMEN_KECAMATAN_CACHE_PARENT = 0;

      const loadKecamatan = async () => {
        if (isOnline) {
          try {
            const kecData = await apiClient.get<PaginatedResponse<{ id: number; name: string }>>(
              '/surveys/geographic-units/',
              { level: 'KECAMATAN', page_size: 500 }
            );
            const kecResults = (Array.isArray(kecData?.results) ? kecData.results : []).filter(
              (item: any) => !item.parent_name || String(item.parent_name).toLowerCase() === 'kebumen'
            );
            setKecamatanList(kecResults);
            await database.saveGeographicUnits('KECAMATAN', KEBUMEN_KECAMATAN_CACHE_PARENT, kecResults);
            return;
          } catch {
            // Fall back to cache below.
          }
        }
        const cached = await database.getGeographicUnits('KECAMATAN', KEBUMEN_KECAMATAN_CACHE_PARENT);
        setKecamatanList(cached);
      };

      await Promise.all([loadServices(), loadCurrentUser(), loadKecamatan()]);
      void loadUsedServiceIds();

      // ── Existing response (edit mode) ──────────────────────────────────
      let tplId = templateId;
      const loadedAnswers: SurveyAnswers = {};
      const loadedOtherTexts: Record<string, string> = {};
      // Hoist GPS/service fields so they're accessible in outer scope for resume
      let savedLatitude: number | null = null;
      let savedLongitude: number | null = null;
      let savedAccuracy: number | null = null;
      let savedService: { id: number; name: string; city: string } | null = null;
      const mergeOtherText = (storageKey: string, otherText: string) => {
        if (!otherText) return;
        try {
          const parsed = JSON.parse(otherText);
          if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
            Object.entries(parsed).forEach(([choiceValue, choiceText]) => {
              if (typeof choiceText === 'string') {
                loadedOtherTexts[`${storageKey}__choice_${choiceValue}`] = choiceText;
              }
            });
            return;
          }
        } catch {
          // Plain other_text from older drafts.
        }
        loadedOtherTexts[storageKey] = otherText;
      };

      const loadLocalDraft = async (localId: number) => {
        const local = await database.getSurvey(localId);
        if (!local) return false;

        setLocalSurveyId(Number(local.id));
        if (local.template_id) tplId = local.template_id;
        if (local.survey_date) setSurveyDate(local.survey_date);
        savedLatitude = typeof local.gps_latitude === 'number' && !isNaN(local.gps_latitude) ? local.gps_latitude : null;
        savedLongitude = typeof local.gps_longitude === 'number' && !isNaN(local.gps_longitude) ? local.gps_longitude : null;
        savedService = {
          id: Number(local.service_id),
          name: local.service_name || '',
          city: local.service_city || '',
        };
        setSelectedService(savedService);

        if (local.answers_json) {
          const parsedAnswers = JSON.parse(local.answers_json);
          Object.entries(parsedAnswers).forEach(([key, val]) => {
            if (key.endsWith('__other_text')) {
              mergeOtherText(key.replace('__other_text', ''), String(val ?? ''));
            } else {
              loadedAnswers[key] = val;
            }
          });
          setAnswers(loadedAnswers);
          setOtherTexts(loadedOtherTexts);
        }
        return true;
      };

      if (responseId) {
        const localOnlyId = responseId < 0 ? Math.abs(responseId) : null;
        if (localOnlyId) {
          await loadLocalDraft(localOnlyId);
        }
        if (isOnline && !localOnlyId) {
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
                const isDetailCode = /[A-Z]$/.test(code) || /Q[A-Z]\d+$/.test(code);
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
                } else if (ans.file_url || ans.file) {
                  val = {
                    file_url: ans.file_url || ans.file,
                    file: ans.file,
                    name: getFileDisplayName(ans.file_url || ans.file),
                    uploaded: true,
                  };
                } else if (
                  typeof ans.gps_latitude === 'number' &&
                  typeof ans.gps_longitude === 'number' &&
                  !isNaN(ans.gps_latitude) &&
                  !isNaN(ans.gps_longitude)
                ) {
                  val = { latitude: ans.gps_latitude, longitude: ans.gps_longitude };
                } else if (ans.text_value) {
                  val = ans.text_value;
                }
                if (val !== undefined) loadedAnswers[storageKey] = val;
                if (ans.other_text) mergeOtherText(storageKey, ans.other_text);
              }
              setAnswers(loadedAnswers);
              setOtherTexts(loadedOtherTexts);
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
          } catch {
            const local = await database.getSurveyByServerId(responseId);
            if (local?.id) await loadLocalDraft(Number(local.id));
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
            const matchingKeys = Object.keys(loadedAnswers).filter((key) => (
              key === q.code || key.endsWith(`|${q.code}`)
            ));
            for (const key of matchingKeys) {
              if (loadedAnswers[key] !== undefined && Array.isArray(loadedAnswers[key])) {
                if (q.answer_type === 'SINGLE_CHOICE') {
                  // Collapse to scalar (first element)
                  loadedAnswers[key] = loadedAnswers[key][0] ?? '';
                }
                // MULTIPLE_CHOICE stays as array — no change needed
              }
            }
          }
          // Re-apply normalized answers so state reflects the correct types
          setAnswers((prev) => ({ ...prev, ...loadedAnswers }));
        }
      } else if (!isOnline) {
        Alert.alert('Offline', 'Tidak ada template tersimpan. Sambungkan ke internet untuk pertama kali.');
      }

      // ── Edit mode: resume from the next unanswered question after progress ─
      // Template must be loaded first (done above) so we can build questionsMap
      if (responseId && tpl) {
        const questionsMapForResume = buildQuestionsMap(tpl.sections ?? []);
        const activeSectionsForResume = getActiveSections(tpl.sections ?? [], loadedAnswers, questionsMapForResume);
        let resumeSectionIdx = 0;
        let resumeItemIdx = 0;
        let lastAnsweredSectionIdx = -1;
        let lastAnsweredItemIdx = -1;
        let firstUnansweredAfterProgress: { sectionIdx: number; itemIdx: number } | null = null;

        for (let si = 0; si < activeSectionsForResume.length; si++) {
          const section = activeSectionsForResume[si];
          const flowItems = getFlowItems(section, loadedAnswers, questionsMapForResume, tpl.sections, loadedAnswers);
          for (let fi = 0; fi < flowItems.length; fi++) {
            const item = flowItems[fi];
            if (item.kind === 'question') {
              const ctx = item.contextKey ?? '';
              const storageKey = isDetailQuestion(item.question.code) && ctx
                ? `${ctx}|${item.question.code}`
                : item.question.code;
              const answer = loadedAnswers[storageKey];
              const answered = !(answer === null || answer === undefined || answer === '' || (Array.isArray(answer) && answer.length === 0));
              if (answered) {
                lastAnsweredSectionIdx = si;
                lastAnsweredItemIdx = fi;
              } else if (lastAnsweredSectionIdx >= 0 && !firstUnansweredAfterProgress) {
                firstUnansweredAfterProgress = { sectionIdx: si, itemIdx: fi };
              }
            }
          }
        }
        if (firstUnansweredAfterProgress) {
          resumeSectionIdx = firstUnansweredAfterProgress.sectionIdx;
          resumeItemIdx = firstUnansweredAfterProgress.itemIdx;
        } else if (lastAnsweredSectionIdx >= 0) {
          resumeSectionIdx = lastAnsweredSectionIdx;
          resumeItemIdx = lastAnsweredItemIdx;
        }
        isResumingFromEdit.current = true;
        const resumeSectionId = activeSectionsForResume[resumeSectionIdx]?.id ?? null;
        setCurrentSectionId(resumeSectionId);
        setCurrentQuestionIndex(resumeItemIdx);
        setSetupComplete(true);
        if (savedLatitude != null && savedLongitude != null && !isNaN(savedLatitude) && !isNaN(savedLongitude)) {
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
    } catch {
      Alert.alert('Error', 'Gagal memuat data survei');
    } finally {
      setLoading(false);
    }
  };

  // Detect detail questions. Most detail codes end with a letter (RQA, IQC),
  // while newer variants may use numbered suffixes (SOQB1, SRQF1, SDQB2).
  // Keep root section codes like SDQ9/RQ10/SOQ8 out of detail-context storage.
  const isDetailQuestion = (code: string) => /^[A-Z]+Q[A-Z]\d*$/.test(code) || /^SDBQ\d+$/.test(code);

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
      return [];
    }
    return getActiveSections(template.sections, resolvedAnswers, questionsMap);
  }, [template?.sections, resolvedAnswers, questionsMap]);

  const summaryClassificationValue = useMemo(() => {
    const allQuestions = template?.sections?.flatMap((section) => section.questions || []) ?? [];
    const isPlaceholderText = (value: string) => /^(tbd|to be determined)$/i.test(value.trim());

    const getQuestionByCode = (questionCode: string) => allQuestions.find((q) => q.code === questionCode);
    const uniqueJoined = (items: string[]) => {
      const unique = Array.from(new Set(items.map((item) => item.trim()).filter(Boolean)));
      return unique.length > 0 ? unique.join(', ') : '—';
    };
    const getAnswerValue = (questionCode: string) => {
      const storageKey = Object.keys(resolvedAnswers).find((key) => key === questionCode || key.endsWith(`|${questionCode}`));
      if (!storageKey) return null;
      return resolvedAnswers[storageKey];
    };

    const mtcEntries = Object.entries(resolvedAnswers).flatMap(([storageKey, rawValue]) => {
      const questionCode = storageKey.includes('|') ? storageKey.split('|', 2)[1] : storageKey;
      const question = getQuestionByCode(questionCode);
      if (!question) return [];

      const values = Array.isArray(rawValue) ? rawValue : [rawValue];
      return values.flatMap((value) => {
        if (value === null || value === undefined) return [];
        const stringValue = String(value).trim();
        if (!stringValue || isPlaceholderText(stringValue)) return [];

        const choice = question.choices?.find((item) => String(item.value) === stringValue);
        const display = choice?.mtc_code_display?.trim() || '';
        if (!display) return [];

        const [codePart, labelPart] = display.split(' — ', 2);
        const code = codePart?.trim() || '';
        const title = labelPart?.trim() ? `${code} — ${labelPart.trim()}` : display;
        if (!code) return [];

        return [{ code, title }];
      });
    });

    const uniqueMtcEntries = Array.from(
      new Map(mtcEntries.map((entry) => [entry.code, entry])).values()
    );

    const leafMtcEntries = uniqueMtcEntries.filter((entry) => (
      !uniqueMtcEntries.some((other) => other.code !== entry.code && other.code.startsWith(entry.code))
    ));

    const q3 = getQuestionByCode('Q3');
    const q3RawValue = getAnswerValue('Q3');
    const q3Values = Array.isArray(q3RawValue) ? q3RawValue : [q3RawValue];
    const q3Label = q3Values.flatMap((value) => {
      if (value === null || value === undefined) return [];
      const stringValue = String(value).trim();
      if (!stringValue || isPlaceholderText(stringValue)) return [];
      const choice = q3?.choices?.find((item) => String(item.value) === stringValue);
      const label = choice?.label?.trim() || stringValue;
      return isPlaceholderText(label) ? [] : [label];
    })[0] || '';

    const klasifikasi = leafMtcEntries.length > 0
      ? uniqueJoined(leafMtcEntries.map((entry) => entry.title))
      : (/^kesehatan$/i.test(q3Label) ? 'FASKES' : 'NON FASKES');

    const q4 = getQuestionByCode('Q4');
    const q4RawValue = getAnswerValue('Q4');
    const q4Values = Array.isArray(q4RawValue) ? q4RawValue : [q4RawValue];
    const bentukKelembagaan = uniqueJoined(
      q4Values.flatMap((rawValue) => {
        if (rawValue === null || rawValue === undefined) return [];
        const values = Array.isArray(rawValue) ? rawValue : [rawValue];
        return values.flatMap((value) => {
          const stringValue = String(value).trim();
          if (!stringValue || isPlaceholderText(stringValue)) return [];
          const choice = q4?.choices?.find((item) => String(item.value) === stringValue);
          const label = choice?.label?.trim() || stringValue;
          return isPlaceholderText(label) ? [] : [label];
        });
      })
    );

    return {
      klasifikasi,
      bentukKelembagaan: bentukKelembagaan === '—' ? (selectedService?.kategori_fasilitas_display || '—') : bentukKelembagaan,
    };
  }, [resolvedAnswers, selectedService?.kategori_fasilitas_display, template?.sections]);

  const surveySummary = useMemo(() => ([
    { label: 'Nama Fasilitas', value: selectedService?.name || '—' },
    {
      label: 'Lokasi',
      value: [selectedService?.city, selectedService?.province].filter(Boolean).join(', ') || '—',
    },
    { label: 'Klasifikasi', value: summaryClassificationValue.klasifikasi },
    { label: 'Bentuk Kelembagaan', value: summaryClassificationValue.bentukKelembagaan },
    { label: 'Tanggal Survei', value: formatDisplayDate(surveyDate) },
    { label: 'Status', value: 'Tersimpan' },
  ]), [
    formatDisplayDate,
    selectedService?.city,
    selectedService?.name,
    selectedService?.province,
    surveyDate,
    summaryClassificationValue.bentukKelembagaan,
    summaryClassificationValue.klasifikasi,
  ]);

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
    return getFlowItems(currentSection, resolvedAnswers, questionsMap, template?.sections, answers);
  }, [currentSection, resolvedAnswers, questionsMap, template?.sections, answers]);

  // Each flow item carries its exact loop context from the flow builder. This avoids
  // re-deriving context from answer keys, which breaks when the same question code
  // appears in multiple loops.
  const questionContexts = useMemo<string[]>(() => {
    return activeFlowItems.map((item) =>
      item.kind === 'end_survey' ? '' : item.contextKey ?? ''
    );
  }, [activeFlowItems]);

  // Calculate progress
  const progress = useMemo(() => {
    if (!template?.sections) return 0;
    return calculateProgress(template.sections, resolvedAnswers, questionsMap, answers);
  }, [template?.sections, resolvedAnswers, questionsMap, answers]);

  // Current flow item helpers for one-per-screen layout
  const totalItemsInSection = activeFlowItems.length;
  const currentFlowItem = activeFlowItems[currentQuestionIndex] ?? null;
  const nextFlowItem = activeFlowItems[currentQuestionIndex + 1] ?? null;
  const isLastQuestionBeforeEnd =
    currentFlowItem?.kind === 'question' &&
    nextFlowItem?.kind === 'end_survey' &&
    currentSectionIndex >= activeSections.length - 1;

  // The active Question (null when current item is a hint page)
  const currentQ =
    currentFlowItem?.kind === 'question' ? currentFlowItem.question : null;

  const currentQCtx = questionContexts[currentQuestionIndex] ?? '';

  const detailBannerMeta = useMemo(() => {
    if (!currentQCtx || !isDetailQuestion(currentQ?.code ?? '')) {
      return { code: currentMtcCode, label: currentMtcLabel };
    }

    const allChoices = template?.sections?.flatMap((section) =>
      (section.questions || []).flatMap((question) => question.choices || [])
    ) || [];
    const matchedChoice = allChoices.find((choice) => choice.value === currentQCtx);

    if (matchedChoice?.mtc_code_display) {
      const dashIdx = matchedChoice.mtc_code_display.indexOf(' — ');
      return {
        code: dashIdx >= 0
          ? matchedChoice.mtc_code_display.slice(0, dashIdx)
          : matchedChoice.mtc_code_display,
        label: dashIdx >= 0
          ? matchedChoice.mtc_code_display.slice(dashIdx + 3)
          : (matchedChoice.bsic_full_label || matchedChoice.cabang_mtc || matchedChoice.label || currentMtcLabel),
      };
    }

    return {
      code: currentMtcCode || String(currentQCtx).split(' — ')[0],
      label: matchedChoice?.bsic_full_label || matchedChoice?.cabang_mtc || matchedChoice?.label || currentMtcLabel,
    };
  }, [currentMtcCode, currentMtcLabel, currentQ?.code, currentQCtx, template?.sections]);

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

  // ctxOverride: the per-question MTC context (from questionContexts). Falls back to
  // currentMtcContext when not provided. Answers always accumulate — no context clearing.
  const handleAnswerChange = (questionCode: string, value: any, ctxOverride?: string) => {
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

    const choiceOtherTextKeys = Object.keys(otherTexts).filter((key) => key.startsWith(`${storageKey}__choice_`));
    if ((otherTexts[storageKey] || choiceOtherTextKeys.length > 0) && q?.choices) {
      setOtherTexts((prev) => {
        const next = { ...prev };
        q.choices?.forEach((choice: QuestionOption) => {
          if (!choice.has_other_input) return;
          const stillSelected = Array.isArray(value)
            ? value.includes(choice.value)
            : value === choice.value;
          if (!stillSelected) {
            delete next[`${storageKey}__choice_${choice.value}`];
          }
        });
        const firstOtherChoice = q.choices?.find((choice: QuestionOption) => choice.has_other_input);
        if (firstOtherChoice) {
          const stillSelected = Array.isArray(value)
            ? value.includes(firstOtherChoice.value)
            : value === firstOtherChoice.value;
          if (!stillSelected) delete next[storageKey];
        }
        return next;
      });
    }

    if (newCtx && newCtx !== currentMtcContext) {
      setCurrentMtcContext(newCtx);
      // Prefer mtc_code_display ("R.3.1.1 — Name") for accurate banner; split into code + label
      const display = selectedChoice?.mtc_code_display;
      if (display) {
        const dashIdx = display.indexOf(' — ');
        setCurrentMtcCode(dashIdx >= 0 ? display.slice(0, dashIdx) : display);
        setCurrentMtcLabel(dashIdx >= 0 ? display.slice(dashIdx + 3) : '');
      } else {
        setCurrentMtcCode('');
        setCurrentMtcLabel(selectedChoice?.bsic_full_label || selectedChoice?.cabang_mtc || selectedChoice?.label || '');
      }
    }
    // Clear context when answering a non-detail question with no new context.
    // This prevents stale context from leaking into subsequent detail questions
    // when the user goes back and changes a non-detail MC answer.
    if (!isDetailQuestion(questionCode) && !newCtx) {
      setCurrentMtcContext('');
      setCurrentMtcLabel('');
      setCurrentMtcCode('');
    }

    if (errors[storageKey]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[storageKey];
        return newErrors;
      });
    }
  };

  const selectedOtherInputChoices = (question: Question, answer: any): QuestionOption[] => {
    const choices = question.choices || [];
    return choices.filter((choice: QuestionOption) => {
      if (!choice.has_other_input) return false;
      return Array.isArray(answer)
        ? answer.includes(choice.value)
        : answer === choice.value;
    });
  };

  const resolveAnswersForFlow = (sourceAnswers: SurveyAnswers): SurveyAnswers => {
    const resolved: SurveyAnswers = { ...sourceAnswers };
    for (const [key, val] of Object.entries(sourceAnswers)) {
      if (!key.includes('|')) continue;
      const plainKey = key.split('|')[1];
      if (plainKey && !resolved[plainKey]) {
        resolved[plainKey] = val;
      }
    }
    return resolved;
  };

  const getReachableAnswerKeys = (sourceAnswers: SurveyAnswers): Set<string> => {
    if (!template?.sections) {
      return new Set(Object.keys(sourceAnswers));
    }

    const reachable = new Set<string>();
    const flowAnswers = resolveAnswersForFlow(sourceAnswers);
    const sections = getActiveSections(template.sections, flowAnswers, questionsMap);

    sections.forEach((section) => {
      const flowItems = getFlowItems(section, flowAnswers, questionsMap, template.sections, sourceAnswers);
      flowItems.forEach((item) => {
        if (item.kind !== 'question') return;
        const ctx = item.contextKey ?? '';
        const storageKey = isDetailQuestion(item.question.code) && ctx
          ? `${ctx}|${item.question.code}`
          : item.question.code;
        reachable.add(storageKey);
      });
    });

    return reachable;
  };

  const pruneUnreachableDraftData = (
    sourceAnswers: SurveyAnswers,
    sourceOtherTexts: Record<string, string>
  ) => {
    const reachableKeys = getReachableAnswerKeys(sourceAnswers);
    const prunedAnswers = Object.fromEntries(
      Object.entries(sourceAnswers).filter(([key]) => reachableKeys.has(key))
    );
    const prunedOtherTexts = Object.fromEntries(
      Object.entries(sourceOtherTexts).filter(([key]) => {
        const markerIndex = key.indexOf('__choice_');
        const baseKey = markerIndex >= 0 ? key.slice(0, markerIndex) : key;
        return reachableKeys.has(baseKey);
      })
    );

    return { answers: prunedAnswers, otherTexts: prunedOtherTexts };
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
      const requiredError = getRequiredError(question, answer);
      if (requiredError) {
        newErrors[storageKey] = requiredError;
      }

      const otherInputChoices = selectedOtherInputChoices(question, answer);
      for (const otherInputChoice of otherInputChoices) {
        const choiceTextKey = `${storageKey}__choice_${otherInputChoice.value}`;
        const otherInputValue = String(otherTexts[choiceTextKey] ?? otherTexts[storageKey] ?? '').trim();
        if (!otherInputValue) {
          newErrors[storageKey] = 'Input tambahan wajib diisi';
          break;
        } else if (getOtherInputType(question.code, otherInputChoice) === 'integer' && !/^\d{4}$/.test(otherInputValue)) {
          newErrors[storageKey] = 'Perkiraan tahun harus 4 digit';
          break;
        } else if (getOtherInputType(question.code, otherInputChoice) === 'date' && !/^\d{4}-\d{2}-\d{2}$/.test(otherInputValue)) {
          newErrors[storageKey] = 'Tanggal harus YYYY-MM-DD';
          break;
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
    const requiredError = getRequiredError(question, answer);
    if (requiredError) {
      setErrors((prev) => ({ ...prev, [storageKey]: requiredError }));
      return false;
    }
    const otherInputChoices = selectedOtherInputChoices(question, answer);
    for (const otherInputChoice of otherInputChoices) {
      const choiceTextKey = `${storageKey}__choice_${otherInputChoice.value}`;
      const otherInputValue = String(otherTexts[choiceTextKey] ?? otherTexts[storageKey] ?? '').trim();
      if (!otherInputValue) {
        setErrors((prev) => ({ ...prev, [storageKey]: 'Input tambahan wajib diisi' }));
        return false;
      }
      if (getOtherInputType(question.code, otherInputChoice) === 'integer' && !/^\d{4}$/.test(otherInputValue)) {
        setErrors((prev) => ({ ...prev, [storageKey]: 'Perkiraan tahun harus 4 digit' }));
        return false;
      }
      if (getOtherInputType(question.code, otherInputChoice) === 'date' && !/^\d{4}-\d{2}-\d{2}$/.test(otherInputValue)) {
        setErrors((prev) => ({ ...prev, [storageKey]: 'Tanggal harus YYYY-MM-DD' }));
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

    // If current item is END_SURVEY sentinel, save immediately and show thank-you summary
    if (currentFlowItem?.kind === 'end_survey') {
      handleSave(true);
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
          handleSave(true);
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
    if (!currentQ) {
      return;
    }
    if (!validateQuestion(currentQ, currentQCtx)) {
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
        handleSave(true);
      } else {
        const nextSection = activeSections[nextSectionIdx];
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

  const pickFileAnswer = async (questionCode: string, ctx: string = '') => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Izin Diperlukan', 'Aplikasi memerlukan akses galeri untuk memilih gambar.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 0.8,
      base64: true,
    });

    if (result.canceled || !result.assets?.[0]) {
      return;
    }

    const asset = result.assets[0];
    const preparedImage = await prepareImageForUpload(asset, questionCode);
    handleAnswerChange(questionCode, {
      uri: preparedImage.uri,
      name: preparedImage.fileName,
      type: preparedImage.mimeType,
      uploaded: false,
    }, ctx);
  };

  const handleSave = async (submit: boolean = false, silent: boolean = false) => {
    if (!selectedService) {
      if (!silent) Alert.alert('Validasi', 'Pilih fasilitas layanan terlebih dahulu');
      return;
    }

    // ── Duplicate draft handling ───────────────────────────────────────────
    // If a local draft already exists for the same service/template, reuse that
    // row instead of blocking save. This avoids "Sudah ada" when the draft only
    // exists locally and is not visible in admin/server lists yet.
    let reusedExistingLocalDraftId: number | null = null;
    if (!responseId && !localSurveyId) {
      const existing = await database.getExistingSurveyForService(selectedService.id, template!.id);
        if (existing) {
          reusedExistingLocalDraftId = Number((existing as any).id);
          setLocalSurveyId(reusedExistingLocalDraftId);
        }
    }

    if (submit) {
      // Validate all sections
      const allErrors: Record<string, string> = {};
      let firstFailedSection = -1;
      for (let i = 0; i < activeSections.length; i++) {
        const sectionItems = getFlowItems(activeSections[i], resolvedAnswers, questionsMap, template?.sections, answers);
        sectionItems.forEach((item) => {
          if (item.kind !== 'question') return;
          const question = item.question;
          const ctx = item.contextKey ?? '';
          const storageKey = isDetailQuestion(question.code) && ctx
            ? `${ctx}|${question.code}`
            : question.code;
          const answer = answers[storageKey];
          const requiredError = getRequiredError(question, answer);
          if (requiredError) {
            allErrors[storageKey] = requiredError;
            if (firstFailedSection === -1) firstFailedSection = i;
          }
          const otherInputChoices = selectedOtherInputChoices(question, answer);
          for (const otherInputChoice of otherInputChoices) {
            const choiceTextKey = `${storageKey}__choice_${otherInputChoice.value}`;
            const otherInputValue = String(otherTexts[choiceTextKey] ?? otherTexts[storageKey] ?? '').trim();
            if (!otherInputValue) {
              allErrors[storageKey] = 'Input tambahan wajib diisi';
              if (firstFailedSection === -1) firstFailedSection = i;
              break;
            } else if (getOtherInputType(question.code, otherInputChoice) === 'integer' && !/^\d{4}$/.test(otherInputValue)) {
              allErrors[storageKey] = 'Perkiraan tahun harus 4 digit';
              if (firstFailedSection === -1) firstFailedSection = i;
              break;
            } else if (getOtherInputType(question.code, otherInputChoice) === 'date' && !/^\d{4}-\d{2}-\d{2}$/.test(otherInputValue)) {
              allErrors[storageKey] = 'Tanggal harus YYYY-MM-DD';
              if (firstFailedSection === -1) firstFailedSection = i;
              break;
            }
          }
          if (question.answer_type === 'LOCATION' && answer) {
            const loc = answer as any;
            if (!loc.koordinat?.latitude || !loc.koordinat?.longitude) {
              allErrors[storageKey] = 'Koordinat harus diisi';
              if (firstFailedSection === -1) firstFailedSection = i;
            }
            if (!loc.kecamatan) {
              allErrors[storageKey] = 'Kecamatan harus dipilih';
              if (firstFailedSection === -1) firstFailedSection = i;
            }
            if (!loc.desa) {
              allErrors[storageKey] = 'Desa/Kelurahan harus diisi';
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
      const draftData = submit
        ? pruneUnreachableDraftData(answers, otherTexts)
        : { answers, otherTexts };
      if (submit && Object.keys(draftData.answers).length !== Object.keys(answers).length) {
        setAnswers(draftData.answers);
      }
      if (submit && Object.keys(draftData.otherTexts).length !== Object.keys(otherTexts).length) {
        setOtherTexts(draftData.otherTexts);
      }

      // Merge otherTexts into answers with __other_text suffix
      const answersWithOther = { ...draftData.answers };
      const groupedChoiceTexts: Record<string, Record<string, string>> = {};
      for (const [code, text] of Object.entries(draftData.otherTexts)) {
        if (!text) continue;
        const choiceMarker = '__choice_';
        const markerIndex = code.indexOf(choiceMarker);
        if (markerIndex >= 0) {
          const baseKey = code.slice(0, markerIndex);
          const choiceValue = code.slice(markerIndex + choiceMarker.length);
          groupedChoiceTexts[baseKey] = {
            ...(groupedChoiceTexts[baseKey] || {}),
            [choiceValue]: text,
          };
        } else {
          answersWithOther[`${code}__other_text`] = text;
        }
      }
      for (const [baseKey, values] of Object.entries(groupedChoiceTexts)) {
        answersWithOther[`${baseKey}__other_text`] = JSON.stringify(values);
      }
      const answersJson = JSON.stringify(answersWithOther);

      // ── 1. Always save to local SQLite first ────────────────────────────
      let currentLocalId = localSurveyId ?? reusedExistingLocalDraftId;
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

      if (submit) {
        setIsSubmitted(true);
      } else if (!silent) {
        Alert.alert('Berhasil', 'Survei disimpan di perangkat. Sinkronkan manual dari detail survei.');
        onSave();
      }
    } catch (err: any) {
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
    // introduction_text is rendered only as a separate hint page.
    // Inline helper text between the question and answer form is only keterangan.
    const helpText = question.keterangan?.trim();
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
            {isQuestionRequired(question) && <Text style={[styles.required, { color: '#ef4444' }]}> *</Text>}
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

        {helpText ? (
          <Text style={[styles.helpText, { color: c.textSecondary, fontSize: fs(14), lineHeight: fs(20) }]}>
            {helpText}
          </Text>
        ) : null}

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
            value={formatThousands(value)}
            onChangeText={(text) => {
              const cleaned = stripThousands(text);
              const num = type === 'INTEGER' ? parseInt(cleaned) || '' : parseFloat(cleaned) || '';
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
                  borderColor: value === true ? '#07579E' : c.border,
                },
                value === true && { backgroundColor: '#f0f9ff', borderColor: '#07579E' },
              ]}
              onPress={() => handleAnswerChange(question.code, true, ctx)}
            >
              <Text style={[
                styles.booleanText,
                { color: c.text },
                value === true && { color: '#07579E', fontWeight: '700' },
              ]}>YA</Text>
              <TouchableOpacity
                style={[
                  styles.choiceAudioBtn,
                  {
                    backgroundColor: c.surface,
                    borderColor: speakingCode === `${question.code}_bool_ya` ? '#07579E' : c.border,
                  },
                  speakingCode === `${question.code}_bool_ya` && { backgroundColor: '#f0f9ff', borderColor: '#07579E' },
                ]}
                onPress={(e) => { e.stopPropagation(); speakQuestion(`${question.code}_bool_ya`, 'Ya'); }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <MaterialIcons name="volume-up" size={18} color={speakingCode === `${question.code}_bool_ya` ? '#07579E' : c.textMuted} />
              </TouchableOpacity>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.booleanOption,
                {
                  backgroundColor: c.surface,
                  borderColor: value === false ? '#07579E' : c.border,
                },
                value === false && { backgroundColor: '#f0f9ff', borderColor: '#07579E' },
              ]}
              onPress={() => handleAnswerChange(question.code, false, ctx)}
            >
              <Text style={[
                styles.booleanText,
                { color: c.text },
                value === false && { color: '#07579E', fontWeight: '700' },
              ]}>TIDAK</Text>
              <TouchableOpacity
                style={[
                  styles.choiceAudioBtn,
                  {
                    backgroundColor: c.surface,
                    borderColor: speakingCode === `${question.code}_bool_tidak` ? '#07579E' : c.border,
                  },
                  speakingCode === `${question.code}_bool_tidak` && { backgroundColor: '#f0f9ff', borderColor: '#07579E' },
                ]}
                onPress={(e) => { e.stopPropagation(); speakQuestion(`${question.code}_bool_tidak`, 'Tidak'); }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <MaterialIcons name="volume-up" size={18} color={speakingCode === `${question.code}_bool_tidak` ? '#07579E' : c.textMuted} />
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
            <Text style={{ color: c.textMuted }}>JAWA TENGAH</Text>
          </View>
        );

      case 'GEO_KABUPATEN':
        return (
          <View style={{ backgroundColor: c.surface, borderRadius: 6, padding: 16, borderWidth: 1, borderColor: c.border }}>
            <Text style={{ color: c.textMuted }}>KEBUMEN</Text>
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

      case 'FILE':
        return renderFileInput(question, value, ctx);

      case 'STAFF_TABLE':
      case 'DIAGNOSIS_TABLE':
      case 'REPEATING_TABLE':
        return renderStaffTableRepeating(question, value, ctx);

      case 'INTERVENTION_MATRIX':
        return renderInterventionMatrix(question, value, ctx);

      case 'OPERATING_HOURS':
        return renderOperatingHours(question, value, ctx);

      case 'KEGIATAN_TABLE':
        return renderKegiatanTable(question, value, ctx);

      case 'MATRIX_KEGIATAN':
        return renderMatrixKegiatan(question, value, ctx);

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

  const renderOtherInput = (
    question: Question,
    choice: QuestionOption,
    otherTextKey: string,
    isDarkMode: boolean,
    options: { showLabel?: boolean; fullWidth?: boolean } = {}
  ) => {
    const otherInputType = getOtherInputType(question.code, choice);
    const choiceTextKey = `${otherTextKey}__choice_${choice.value}`;
    const currentValue = otherTexts[choiceTextKey] ?? otherTexts[otherTextKey] ?? '';
    const placeholder = getOtherInputPlaceholder(question.code, choice);
    const inputColors = {
      backgroundColor: isDarkMode ? '#1f1f1f' : '#fff',
      borderColor: isDarkMode ? '#404040' : '#d1d5db',
      color: isDarkMode ? '#f5f5f5' : '#1A1A1A',
    };
    const inputStyle = [
      styles.otherInput,
      options.fullWidth && styles.otherInputFullWidth,
      inputColors,
    ];
    const inputElement = otherInputType === 'date' ? (
      <TouchableOpacity
        style={[
          ...inputStyle,
          { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
        ]}
        onPress={() => setShowOtherDatePicker({ key: choiceTextKey, value: currentValue })}
      >
        <Text style={{ color: currentValue ? inputColors.color : (isDarkMode ? '#525252' : '#9ca3af'), fontSize: 16 }}>
          {currentValue || placeholder}
        </Text>
        <MaterialIcons name="event" size={20} color={isDarkMode ? '#737373' : '#6b7280'} />
      </TouchableOpacity>
    ) : (
      <TextInput
        style={inputStyle}
        value={currentValue}
        onChangeText={(text) => setOtherTexts((prev) => ({ ...prev, [choiceTextKey]: text }))}
        placeholder={placeholder}
        placeholderTextColor={isDarkMode ? '#525252' : '#9ca3af'}
        keyboardType={getOtherInputKeyboardType(otherInputType)}
      />
    );

    if (options.showLabel) {
      return (
        <View style={styles.otherInputGroup}>
          <Text style={[styles.otherInputLabel, { color: isDarkMode ? '#d4d4d4' : '#374151' }]}>
            {placeholder}
          </Text>
          {inputElement}
        </View>
      );
    }

    return inputElement;
  };

  const renderSingleChoice = (question: Question, value: any, ctx: string = '') => {
    const choices = question.choices || [];
    const isDark = theme.dark;
    const isSelected = value !== null && value !== undefined && value !== '';
    const otherTextKey = isDetailQuestion(question.code) && ctx
      ? `${ctx}|${question.code}`
      : question.code;
    return (
      <View style={styles.choicesContainer}>
        {choices.map((choice) => {
          const choiceSpeakKey = `${question.code}_choice_${choice.value}`;
          const thisSelected = Array.isArray(value) ? value.includes(choice.value) : value === choice.value;
          const useStackedOtherInput = isSocialMediaDetailQuestion(question.code);
          return (
          <View key={choice.value}>
            <TouchableOpacity
              style={[
                styles.choiceOption,
                {
                  backgroundColor: isDark ? '#1f1f1f' : '#fff',
                  borderColor: thisSelected ? '#07579E' : (isDark ? '#2e2e2e' : '#e5e7eb'),
                },
                thisSelected && { backgroundColor: isDark ? '#1a2e2e' : '#f0f9ff' },
              ]}
              onPress={() => handleAnswerChange(question.code, choice.value, ctx)}
            >
              <View style={[
                styles.radio,
                {
                  borderColor: thisSelected ? '#07579E' : (isDark ? '#404040' : '#d1d5db'),
                  borderRadius: 12,
                },
              ]}>
                {thisSelected && <View style={[styles.radioInner, { borderRadius: 6 }]} />}
              </View>
              <Text style={[
                styles.choiceLabel,
                { flex: 1, color: isDark ? '#f5f5f5' : '#374151' },
                thisSelected && { color: '#07579E', fontWeight: '700' },
              ]}>
                {toUpper(choice.label)}
              </Text>
              <TouchableOpacity
                style={[
                  styles.choiceAudioBtn,
                  {
                    backgroundColor: isDark ? '#1f1f1f' : '#fff',
                    borderColor: speakingCode === choiceSpeakKey ? '#07579E' : (isDark ? '#404040' : '#d1d5db'),
                  },
                  speakingCode === choiceSpeakKey && { backgroundColor: isDark ? '#1a2e2e' : '#e6f7f7', borderColor: '#07579E' },
                ]}
                onPress={(e) => { e.stopPropagation(); speakQuestion(choiceSpeakKey, choice.label); }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <MaterialIcons name="volume-up" size={18} color={speakingCode === choiceSpeakKey ? '#07579E' : (isDark ? '#737373' : '#9ca3af')} />
              </TouchableOpacity>
            </TouchableOpacity>
            {choice.has_other_input && thisSelected && renderOtherInput(
              question,
              choice,
              otherTextKey,
              isDark,
              { showLabel: useStackedOtherInput, fullWidth: useStackedOtherInput }
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
    const otherTextKey = isDetailQuestion(question.code) && ctx
      ? `${ctx}|${question.code}`
      : question.code;
    const selectedValues: string[] = Array.isArray(value)
      ? value
      : value !== null && value !== undefined && value !== ''
        ? [String(value)]
        : [];

    const toggleChoice = (choiceValue: string) => {
      const newValues = selectedValues.includes(choiceValue)
        ? selectedValues.filter((v) => v !== choiceValue)
        : [...selectedValues, choiceValue];
      handleAnswerChange(question.code, newValues, ctx);
    };

    return (
      <View style={styles.choicesContainer}>
        {choices.map((choice) => {
          const isChecked = selectedValues.includes(choice.value);
          const choiceSpeakKey = `${question.code}_choice_${choice.value}`;
          const useStackedOtherInput = isSocialMediaDetailQuestion(question.code);
          return (
            <View key={choice.value}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <TouchableOpacity
                  style={[
                    styles.choiceOption,
                    { flex: 1 },
                    {
                      backgroundColor: isDark ? '#1f1f1f' : '#fff',
                      borderColor: isChecked ? '#07579E' : (isDark ? '#2e2e2e' : '#e5e7eb'),
                    },
                    isChecked && { backgroundColor: isDark ? '#1a2e2e' : '#f0f9ff' },
                  ]}
                  onPress={() => toggleChoice(choice.value)}
                >
                  <View style={[
                    styles.checkbox,
                    { borderRadius: 4 },
                    {
                      borderColor: isChecked ? '#07579E' : (isDark ? '#404040' : '#d1d5db'),
                      backgroundColor: isChecked ? '#07579E' : 'transparent',
                    },
                  ]}>
                    {isChecked && <MaterialIcons name="check" size={14} color="#fff" />}
                  </View>
                  <Text style={[
                    styles.choiceLabel,
                    { flex: 1, color: isDark ? '#f5f5f5' : '#374151' },
                    isChecked && { color: '#07579E', fontWeight: '700' },
                  ]}>
                    {toUpper(choice.label)}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.choiceAudioBtn,
                    {
                      backgroundColor: isDark ? '#1f1f1f' : '#fff',
                      borderColor: speakingCode === choiceSpeakKey ? '#07579E' : (isDark ? '#404040' : '#d1d5db'),
                    },
                    speakingCode === choiceSpeakKey && { backgroundColor: isDark ? '#1a2e2e' : '#e6f7f7', borderColor: '#07579E' },
                  ]}
                  onPress={(e) => { e.stopPropagation(); speakQuestion(choiceSpeakKey, choice.label); }}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <MaterialIcons name="volume-up" size={18} color={speakingCode === choiceSpeakKey ? '#07579E' : (isDark ? '#737373' : '#9ca3af')} />
                </TouchableOpacity>
              </View>
              {choice.has_other_input && isChecked && renderOtherInput(
                question,
                choice,
                otherTextKey,
                isDark,
                { showLabel: useStackedOtherInput, fullWidth: useStackedOtherInput }
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
      // Store the answer - always use question.code as key (same as how render reads it)
      // The ctx parameter is passed to handleAnswerChange for consistency
      handleAnswerChange(question.code, kecId, ctx);
      setShowKecamatanPicker(null);

      // Fetch desas for selected kecamatan
      try {
        const netState = await NetInfo.fetch();
        const isOnline = !!(netState.isConnected && netState.isInternetReachable);
        if (isOnline) {
          const desaData = await apiClient.get<PaginatedResponse<{ id: number; name: string }>>(
            '/surveys/geographic-units/',
            { level: 'DESA_KELURAHAN', parent: kecId, page_size: 200 }
          );
          if (desaData.results && desaData.results.length > 0) {
            setDesaList(desaData.results);
            await database.saveGeographicUnits('DESA_KELURAHAN', kecId, desaData.results);
          } else {
            // Try to get from cache anyway
            const cached = await database.getGeographicUnits('DESA_KELURAHAN', kecId);
            if (cached.length > 0) {
              setDesaList(cached);
            } else {
              setDesaList([]);
              Alert.alert('Info', `Tidak ada desa ditemukan untuk ${kecName}. Pastikan data wilayah sudah tersedia.`);
            }
          }
        } else {
          const cached = await database.getGeographicUnits('DESA_KELURAHAN', kecId);
          setDesaList(cached);
        }
      } catch {
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
    const selectedName = desaList.find((d) => d.id === value)?.name;

    // Reload desas if kecamatan is selected but desaList is empty
    const reloadDesas = async () => {
      if (value && desaList.length === 0) {
        try {
          const netState = await NetInfo.fetch();
          const isOnline = !!(netState.isConnected && netState.isInternetReachable);
          if (isOnline) {
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
        } catch {
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
            <Text style={styles.disabledText}>JAWA TENGAH</Text>
          </View>
        </View>

        {/* Kabupaten - fixed */}
        <View style={styles.locationField}>
          <Text style={styles.locationFieldLabel}>Kabupaten/Kota</Text>
          <View style={[styles.inputBox, styles.disabledInput]}>
            <Text style={styles.disabledText}>KEBUMEN</Text>
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
            <MaterialIcons name="place" size={20} color="#07579E" />
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
          <MaterialIcons name="place" size={20} color="#07579E" />
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
                {toUpper(level.label)}
              </Text>
              <TouchableOpacity
                style={[styles.choiceAudioBtn, speakingCode === choiceSpeakKey && styles.choiceAudioBtnActive]}
                onPress={(e) => { e.stopPropagation(); speakQuestion(choiceSpeakKey, level.label); }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <MaterialIcons name="volume-up" size={18} color={speakingCode === choiceSpeakKey ? '#07579E' : '#9ca3af'} />
              </TouchableOpacity>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  const renderFileInput = (question: Question, value: any, ctx: string = '') => {
    const previewUri = getFilePreviewUri(value);
    const fileName = getFileDisplayName(value);
    const isLocalPending = isPendingLocalFile(value);

    return (
      <View style={styles.fileInputContainer}>
        {previewUri ? (
          <View style={styles.filePreviewCard}>
            <Image source={{ uri: previewUri }} style={styles.filePreviewImage} resizeMode="cover" />
            <View style={styles.filePreviewMeta}>
              <Text style={styles.filePreviewName} numberOfLines={2}>
                {fileName || 'Gambar terpilih'}
              </Text>
              <Text style={styles.filePreviewStatus}>
                {isLocalPending ? 'Belum diunggah ke server' : 'Sudah terunggah'}
              </Text>
            </View>
          </View>
        ) : null}

        <TouchableOpacity
          style={styles.filePickerButton}
          onPress={() => pickFileAnswer(question.code, ctx)}
        >
          <MaterialIcons name="image" size={20} color="#07579E" />
          <Text style={styles.filePickerButtonText}>
            {previewUri ? 'Ganti Gambar' : 'Pilih Gambar'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  // Staff table — two modes:
  // 1. Fixed rows (config.rows set): pre-defined job positions, value is Record<rowCode, Record<colCode, string>>
  // 2. Repeating rows (no config.rows): user adds rows freely, value is Array<Record<colCode, string>>
  const renderStaffTableRepeating = (question: Question, value: any, ctx: string = '') => {
    const config = question.table_config;

    // ── Mode 1: Fixed rows from config (Jabatan / L / P) ────────────────────
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

    // ── Mode 2: STAFF_TABLE without config → repeating Jabatan / L / P rows ──
    if (question.answer_type === 'STAFF_TABLE') {
      const staffRows: Array<{ jabatan: string; laki: string; perempuan: string }> =
        Array.isArray(value) && value.length > 0 ? value : [{ jabatan: '', laki: '', perempuan: '' }];

      const updateStaffCell = (idx: number, field: 'jabatan' | 'laki' | 'perempuan', val: string) => {
        const next = staffRows.map((r, i) => i === idx ? { ...r, [field]: val } : r);
        handleAnswerChange(question.code, next, ctx);
      };
      const addStaffRow = () => handleAnswerChange(question.code, [...staffRows, { jabatan: '', laki: '', perempuan: '' }], ctx);
      const removeStaffRow = (idx: number) => {
        if (staffRows.length <= 1) return;
        handleAnswerChange(question.code, staffRows.filter((_, i) => i !== idx), ctx);
      };

      return (
        <View>
          <View style={[styles.tableRow, styles.staffHeaderRow, { backgroundColor: c.border }]}>
            <View style={[styles.staffHeaderCell, styles.staffHeaderCellWide]}>
              <Text style={[styles.tableHeaderText, styles.staffHeaderTextLeft]}>Jabatan</Text>
            </View>
            <View style={styles.staffHeaderCell}>
              <Text style={styles.tableHeaderText}>L</Text>
            </View>
            <View style={styles.staffHeaderCell}>
              <Text style={styles.tableHeaderText}>P</Text>
            </View>
            <View style={styles.staffActionCell} />
          </View>
          {staffRows.map((row, idx) => (
            <View key={idx} style={[styles.tableRow, styles.staffDataRow]}>
              <TextInput
                style={[styles.tableCellInput, styles.staffRepeatingInput, styles.staffRepeatingInputWide]}
                value={row.jabatan}
                onChangeText={(t) => updateStaffCell(idx, 'jabatan', t)}
                placeholder="Nama jabatan"
                placeholderTextColor="#d1d5db"
              />
              <TextInput
                style={[styles.tableCellInput, styles.staffRepeatingInput]}
                value={row.laki}
                onChangeText={(t) => updateStaffCell(idx, 'laki', t)}
                keyboardType="number-pad"
                placeholder="0"
                placeholderTextColor="#d1d5db"
              />
              <TextInput
                style={[styles.tableCellInput, styles.staffRepeatingInput]}
                value={row.perempuan}
                onChangeText={(t) => updateStaffCell(idx, 'perempuan', t)}
                keyboardType="number-pad"
                placeholder="0"
                placeholderTextColor="#d1d5db"
              />
              <TouchableOpacity
                style={styles.staffActionCell}
                onPress={() => removeStaffRow(idx)}
                disabled={staffRows.length <= 1}
              >
                <MaterialIcons name="delete-outline" size={20} color={staffRows.length <= 1 ? '#d1d5db' : '#ef4444'} />
              </TouchableOpacity>
            </View>
          ))}
          <TouchableOpacity style={styles.opHoursAddButton} onPress={addStaffRow}>
            <MaterialIcons name="add" size={18} color={c.primary} />
            <Text style={styles.opHoursAddButtonText}>Tambah Jabatan</Text>
          </TouchableOpacity>
        </View>
      );
    }

    // ── Mode 3: Kegiatan table (DIAGNOSIS_TABLE / REPEATING_TABLE) ───────────
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
          {kegRows.map((row, idx) => (
            <View key={idx} style={styles.kegCard}>
              <View style={styles.kegCardTopRow}>
                <View style={styles.kegCardNumber}>
                  <Text style={styles.kegNumText}>{idx + 1}</Text>
                </View>
                <View style={styles.kegCardMain}>
                  <Text style={styles.kegFieldLabel}>Nama Kegiatan</Text>
                  <TextInput
                    style={styles.kegTextInput}
                    value={row.kegiatan}
                    onChangeText={(t) => updateKegCell(idx, 'kegiatan', t)}
                    placeholder="Nama kegiatan"
                    placeholderTextColor="#d1d5db"
                  />
                </View>
                <TouchableOpacity
                  style={styles.kegActionCell}
                  onPress={() => removeKegRow(idx)}
                  disabled={kegRows.length <= 1}
                >
                  <MaterialIcons name="delete-outline" size={20} color={kegRows.length <= 1 ? '#d1d5db' : '#ef4444'} />
                </TouchableOpacity>
              </View>

              <View style={styles.kegCardBottomRow}>
                <View style={styles.kegTimeField}>
                  <Text style={styles.kegFieldLabel}>Mulai</Text>
                  <TouchableOpacity
                    style={styles.kegTimeBtn}
                    onPress={() => setShowTimePicker({ code: question.code + '_start_' + idx, value: row.start, ctx, kegArray: kegRows })}
                  >
                    <Text style={[styles.kegTimeText, !row.start && { color: '#9ca3af' }]}>
                      {row.start || '00:00'}
                    </Text>
                    <MaterialIcons name="access-time" size={16} color="#6b7280" />
                  </TouchableOpacity>
                </View>

                <View style={styles.kegTimeField}>
                  <Text style={styles.kegFieldLabel}>Selesai</Text>
                  <TouchableOpacity
                    style={styles.kegTimeBtn}
                    onPress={() => setShowTimePicker({ code: question.code + '_stop_' + idx, value: row.stop, ctx, kegArray: kegRows })}
                  >
                    <Text style={[styles.kegTimeText, !row.stop && { color: '#9ca3af' }]}>
                      {row.stop || '00:00'}
                    </Text>
                    <MaterialIcons name="access-time" size={16} color="#6b7280" />
                  </TouchableOpacity>
                </View>
              </View>
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
  const [showTimePicker, setShowTimePicker] = useState<{ code: string; value: string; ctx: string; kegArray?: Array<{ kegiatan: string; start: string; stop: string }>; opArray?: Array<{ day: string; open: string; close: string }> } | null>(null); // {code, value, ctx, kegArray?, opArray?}

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
            <View style={styles.kegTimeColHeader}>
              <Text style={styles.opHoursColLabel}>Jam Buka</Text>
            </View>
            <View style={styles.kegTimeColHeader}>
              <Text style={styles.opHoursColLabel}>Jam Tutup</Text>
            </View>
            <View style={styles.kegActionCell} />
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
                <TouchableOpacity
                  style={[styles.kegTimeBtn, styles.kegTimeCol]}
                  onPress={() => setShowTimePicker({ code: question.code + '_open_' + idx, value: row.open, ctx, opArray: schedule })}
                >
                  <Text style={[styles.kegTimeText, !row.open && { color: '#9ca3af' }]}>
                    {row.open || '00:00'}
                  </Text>
                  <MaterialIcons name="access-time" size={16} color="#6b7280" />
                </TouchableOpacity>
              </View>

              {/* Jam Tutup */}
              <View style={[styles.opHoursCol, { flex: 1 }]}>
                <TouchableOpacity
                  style={[styles.kegTimeBtn, styles.kegTimeCol]}
                  onPress={() => setShowTimePicker({ code: question.code + '_close_' + idx, value: row.close, ctx, opArray: schedule })}
                >
                  <Text style={[styles.kegTimeText, !row.close && { color: '#9ca3af' }]}>
                    {row.close || '00:00'}
                  </Text>
                  <MaterialIcons name="access-time" size={16} color="#6b7280" />
                </TouchableOpacity>
              </View>

              {/* Delete button */}
              <TouchableOpacity
                style={styles.kegActionCell}
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

      </View>
    );
  };

  // --- KEGIATAN TABLE (custom activity schedule) ---
  const renderKegiatanTable = (question: Question, value: any, ctx: string = '') => {
    const kegiatans: Array<{ kegiatan: string; start: string; stop: string }> =
      Array.isArray(value) && value.length > 0 ? value : [{ kegiatan: '', start: '', stop: '' }];

    const updateRow = (index: number, field: 'kegiatan' | 'start' | 'stop', val: string) => {
      const next = kegiatans.map((r, i) => i === index ? { ...r, [field]: val } : r);
      handleAnswerChange(question.code, next, ctx);
    };

    const addRow = () => handleAnswerChange(question.code, [...kegiatans, { kegiatan: '', start: '', stop: '' }], ctx);

    const removeRow = (index: number) => {
      if (kegiatans.length <= 1) return;
      handleAnswerChange(question.code, kegiatans.filter((_, i) => i !== index), ctx);
    };

    return (
      <View>
        {/* Header */}
        <View style={styles.sectionHeaderContainer}>
          <Text style={styles.sectionHeader}>TABEL KEGIATAN</Text>
          <Text style={styles.sectionSubtitle}>ISILAH KEGIATAN BESERTA JAM MULAI DAN SELESAI</Text>
        </View>

        <View style={[styles.opHoursContainer]}>
          {kegiatans.map((row, idx) => (
            <View key={idx} style={styles.kegCard}>
              <View style={styles.kegCardTopRow}>
                <View style={styles.kegCardNumber}>
                  <Text style={styles.kegNumText}>{idx + 1}</Text>
                </View>
                <View style={styles.kegCardMain}>
                  <Text style={styles.kegFieldLabel}>Nama Kegiatan</Text>
                  <TextInput
                    style={styles.kegTextInput}
                    value={row.kegiatan}
                    onChangeText={(text) => updateRow(idx, 'kegiatan', text)}
                    placeholder="Nama kegiatan"
                    placeholderTextColor="#9ca3af"
                  />
                </View>
                <TouchableOpacity
                  style={styles.kegActionCell}
                  onPress={() => removeRow(idx)}
                  disabled={kegiatans.length <= 1}
                >
                  <MaterialIcons
                    name="delete-outline"
                    size={20}
                    color={kegiatans.length <= 1 ? '#d1d5db' : '#ef4444'}
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.kegCardBottomRow}>
                <View style={styles.kegTimeField}>
                  <Text style={styles.kegFieldLabel}>Mulai</Text>
                  <TouchableOpacity
                    style={styles.kegTimeBtn}
                    onPress={() => setShowTimePicker({ code: question.code + '_start_' + idx, value: row.start, ctx, kegArray: kegiatans })}
                  >
                    <Text style={[styles.kegTimeText, !row.start && { color: '#9ca3af' }]}>
                      {row.start || '00:00'}
                    </Text>
                    <MaterialIcons name="access-time" size={16} color="#6b7280" />
                  </TouchableOpacity>
                </View>

                <View style={styles.kegTimeField}>
                  <Text style={styles.kegFieldLabel}>Selesai</Text>
                  <TouchableOpacity
                    style={styles.kegTimeBtn}
                    onPress={() => setShowTimePicker({ code: question.code + '_stop_' + idx, value: row.stop, ctx, kegArray: kegiatans })}
                  >
                    <Text style={[styles.kegTimeText, !row.stop && { color: '#9ca3af' }]}>
                      {row.stop || '00:00'}
                    </Text>
                    <MaterialIcons name="access-time" size={16} color="#6b7280" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Add row button */}
        <TouchableOpacity style={styles.opHoursAddButton} onPress={addRow}>
          <MaterialIcons name="add" size={18} color={c.primary} />
          <Text style={styles.opHoursAddButtonText}>Tambah Baris</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // --- MATRIX KEGIATAN (activity name + day multi-select) ---
  const DAY_OPTIONS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

  const renderMatrixKegiatan = (question: Question, value: any, ctx: string = '') => {
    type MatrixRow = { nama_kegiatan: string; hari: string[] };
    const config = question.table_config ?? {};
    const presetActivities: Record<string, string[]> = {
      kesehatan: [
        'PSIKOTERAPI',
        'KONSELING',
        'TERAPI KELOMPOK',
        'PEMANTAUAN PENGGUNAAN OBAT',
        'EDUKASI KESEHATAN JIWA',
      ],
      pendidikan: [
        'PELATIHAN MENJAHIT',
        'PELATIHAN MEMASAK',
        'PELATIHAN KERAJINAN',
        'PELATIHAN KESIAPAN KERJA',
        'PENDIDIKAN NON FORMAL',
      ],
      sosial_budaya: [
        'KELOMPOK DUKUNGAN SEBAYA',
        'KEGIATAN REKREASI',
        'OLAHRAGA',
        'KEGIATAN KOMUNITAS',
        'KEGIATAN KEAGAMAAN/SPIRITUAL',
      ],
    };
    const dayOptions = config.day_options?.length ? config.day_options : DAY_OPTIONS;
    const predefinedOptions = config.activity_options?.length
      ? config.activity_options
      : (config.matrix_variant ? presetActivities[config.matrix_variant] ?? [] : []);
    const allowCustom = config.allow_custom !== false;
    const usesPredefinedActivities = predefinedOptions.length > 0;
    const storedRows: MatrixRow[] = Array.isArray(value) ? value : [];
    const rows: MatrixRow[] = !usesPredefinedActivities && storedRows.length === 0
      ? [{ nama_kegiatan: '', hari: [] }]
      : storedRows;
    const customRows = rows.filter((row) => !predefinedOptions.includes(row.nama_kegiatan));

    const updateRows = (next: MatrixRow[]) => handleAnswerChange(question.code, next, ctx);

    const updateCustomRow = (index: number, patch: Partial<MatrixRow>) => {
      const nextCustomRows = customRows.map((row, i) => (i === index ? { ...row, ...patch } : row));
      const predefinedRows = rows.filter((row) => predefinedOptions.includes(row.nama_kegiatan));
      updateRows([...predefinedRows, ...nextCustomRows]);
    };

    const toggleDays = (currentDays: string[], day: string) =>
      currentDays.includes(day)
        ? currentDays.filter((item) => item !== day)
        : [...currentDays, day];

    const togglePredefinedActivity = (activity: string) => {
      const exists = rows.some((row) => row.nama_kegiatan === activity);
      if (exists) {
        updateRows(rows.filter((row) => row.nama_kegiatan !== activity));
        return;
      }
      updateRows([...rows, { nama_kegiatan: activity, hari: [] }]);
    };

    const togglePredefinedDay = (activity: string, day: string) => {
      updateRows(
        rows.map((row) =>
          row.nama_kegiatan === activity
            ? { ...row, hari: toggleDays(row.hari || [], day) }
            : row
        )
      );
    };

    const addCustomRow = () => updateRows([...rows, { nama_kegiatan: '', hari: [] }]);

    const removeCustomRow = (index: number) => {
      const nextCustomRows = customRows.filter((_, i) => i !== index);
      const predefinedRows = rows.filter((row) => predefinedOptions.includes(row.nama_kegiatan));
      updateRows([...predefinedRows, ...nextCustomRows]);
    };

    return (
      <View>
        {/* Header */}
        <View style={styles.sectionHeaderContainer}>
          <Text style={styles.sectionHeader}>MATRIX KEGIATAN</Text>
          <Text style={styles.sectionSubtitle}>ISILAH NAMA KEGIATAN DAN HARI BEKERJA</Text>
        </View>

        <View style={[styles.opHoursContainer]}>
          {usesPredefinedActivities ? (
            <View style={styles.matrixSection}>
              <Text style={styles.matrixSectionTitle}>Daftar Kegiatan</Text>
              {predefinedOptions.map((activity) => {
                const selectedRow = rows.find((row) => row.nama_kegiatan === activity);
                const isSelected = !!selectedRow;
                return (
                  <View key={activity} style={styles.matrixOptionCard}>
                    <TouchableOpacity
                      onPress={() => togglePredefinedActivity(activity)}
                      style={styles.matrixOptionHeader}
                    >
                      <View style={[styles.matrixCheckbox, isSelected && styles.matrixCheckboxSelected]}>
                        {isSelected && <MaterialIcons name="check" size={14} color="#fff" />}
                      </View>
                      <Text style={styles.matrixOptionLabel}>{activity}</Text>
                    </TouchableOpacity>

                    {isSelected && (
                      <View style={styles.matrixDaysWrap}>
                        {dayOptions.map((day) => {
                          const daySelected = (selectedRow.hari || []).includes(day);
                          return (
                            <TouchableOpacity
                              key={`${activity}-${day}`}
                              onPress={() => togglePredefinedDay(activity, day)}
                              style={[
                                styles.matrixDayChip,
                                daySelected && { backgroundColor: c.primary, borderColor: c.primary },
                              ]}
                            >
                              <Text style={[styles.matrixDayChipText, daySelected && { color: '#fff' }]}>
                                {day.substring(0, 3)}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          ) : null}

          {allowCustom ? (
            <View style={styles.matrixSection}>
              <Text style={styles.matrixSectionTitle}>
                {usesPredefinedActivities ? 'Kegiatan Tambahan' : 'Kegiatan'}
              </Text>
              {customRows.length === 0 && !usesPredefinedActivities ? (
                <View style={styles.matrixOptionCard}>
                  <Text style={styles.sectionSubtitle}>Tambahkan kegiatan dan pilih hari pelaksanaannya.</Text>
                </View>
              ) : null}
              {customRows.map((row, idx) => (
                <View key={`custom-${idx}`} style={styles.matrixCustomCard}>
                  <View style={styles.matrixCustomHeader}>
                    <TextInput
                      style={styles.matrixActivityInput}
                      value={row.nama_kegiatan}
                      onChangeText={(text) => updateCustomRow(idx, { nama_kegiatan: text })}
                      placeholder="Nama kegiatan"
                      placeholderTextColor="#9ca3af"
                    />
                    <TouchableOpacity
                      style={styles.matrixDeleteButton}
                      onPress={() => removeCustomRow(idx)}
                    >
                      <MaterialIcons name="delete-outline" size={20} color="#ef4444" />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.matrixDaysWrap}>
                    {dayOptions.map((day) => {
                      const isSelected = (row.hari || []).includes(day);
                      return (
                        <TouchableOpacity
                          key={`custom-${idx}-${day}`}
                          onPress={() => updateCustomRow(idx, { hari: toggleDays(row.hari || [], day) })}
                          style={[
                            styles.matrixDayChip,
                            isSelected && { backgroundColor: c.primary, borderColor: c.primary },
                          ]}
                        >
                          <Text style={[styles.matrixDayChipText, isSelected && { color: '#fff' }]}>
                            {day.substring(0, 3)}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              ))}
            </View>
          ) : null}
        </View>

        {/* Add row button */}
        {allowCustom && (
          <TouchableOpacity style={styles.opHoursAddButton} onPress={addCustomRow}>
            <MaterialIcons name="add" size={18} color={c.primary} />
            <Text style={styles.opHoursAddButtonText}>{config.custom_add_label || 'Tambah Kegiatan'}</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  // --- LOADING ---
  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#07579E" />
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
                  serviceFilter === filter && { backgroundColor: '#07579E' },
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
            style={[styles.addServiceBtn, { backgroundColor: c.surface, borderColor: '#07579E' }]}
            onPress={() => {
              setShowServicePicker(false);
              setShowAddServiceModal(true);
            }}
          >
            <MaterialIcons name="add-circle" size={20} color="#07579E" />
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
                    selectedService?.id === service.id && { borderColor: '#07579E', backgroundColor: isDark ? '#1a2e2e' : '#f0f9ff' },
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
                    <MaterialIcons name="check-circle" size={22} color="#07579E" />
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
                { marginTop: 24, backgroundColor: '#07579E' },
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
                    province: result.province || '',
                    kecamatan: result.kecamatan || newServiceKecamatan?.name || '',
                    mtc_name: result.mtc?.name,
                    bsic_code: result.bsic?.code,
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
            <Text style={[styles.templateName, { color: c.text }]}>{formatTemplateName(template.name)}</Text>

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
      <View style={[styles.container, { backgroundColor: c.background }]}>
        <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 40 }}>
          <View style={{ alignItems: 'center' }}>
            <View style={styles.thankYouIcon}>
              <MaterialIcons name="check-circle" size={56} color="#07579E" />
            </View>
            <Text style={[styles.thankYouTitle, { color: c.text }]}>Terima Kasih!</Text>
            <Text style={[styles.thankYouSubtitle, { color: c.textSecondary }]}>
              Jawaban Anda telah berhasil disimpan. Berikut ringkasan fasilitas yang dipilih.
            </Text>
          </View>

          <View style={[styles.summaryCard, { backgroundColor: c.surface, borderColor: c.border }]}>
            {surveySummary.map((item) => (
              <View key={item.label} style={[styles.summaryItem, { borderColor: c.border }]}>
                <Text style={[styles.summaryLabel, { color: c.textSecondary }]}>{item.label}</Text>
                <Text style={[styles.summaryValue, { color: c.text }]}>{item.value}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity style={styles.backButtonCentered} onPress={onSave}>
            <Text style={styles.backButtonText}>Selesai</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
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
              <Text style={[styles.mtcBannerCode, { color: c.primary, fontSize: fs(15), fontWeight: '800', lineHeight: fs(21) }]}>
                {detailBannerMeta.code}
              </Text>
              {detailBannerMeta.label ? (
                <Text style={[styles.mtcBannerLabel, { color: c.textSecondary, fontSize: fs(15), fontWeight: '800', lineHeight: fs(21) }]}>
                  {toUpper(detailBannerMeta.label)}
                </Text>
              ) : null}
            </View>
          )}

          {/* ONE question or hint — full screen */}
          {currentFlowItem?.kind === 'hint' ? (
            <View style={styles.questionScreenContainer}>
              {renderHintPage(currentFlowItem)}
            </View>
          ) : currentFlowItem?.kind === 'end_survey' ? (
            <View style={styles.questionScreenContainer}>
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 }}>
                <MaterialIcons name="info-outline" size={48} color="#07579E" />
                <Text style={{ fontSize: 18, fontWeight: '600', color: c.text, marginTop: 16, textAlign: 'center' }}>
                  Survei Selesai
                </Text>
                <Text style={{ fontSize: 14, color: c.textSecondary, marginTop: 8, textAlign: 'center' }}>
                  Anda telah menyelesaikan survei.{'n'}Data akan disimpan.
                </Text>
                <TouchableOpacity
                  style={{ marginTop: 32, backgroundColor: '#07579E', paddingHorizontal: 32, paddingVertical: 14, borderRadius: 8, alignItems: 'center', justifyContent: 'center' }}
                  onPress={() => {
                    handleSave(true);
                  }}
                >
                  <Text style={{ color: '#fff', fontWeight: '600', fontSize: 15, textAlign: 'center' }}>Selesai</Text>
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
                  style={[styles.submitButton, saving && styles.buttonDisabled]}
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
                    // No more sections with questions - save and show thank-you summary
                    handleSave(true);
                  }}
                  disabled={saving}
                >
                  <Text style={styles.nextButtonText}>
                    {currentSectionIndex < activeSections.length - 1 ? 'Bagian Berikutnya' : 'Selesai'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Navigation Buttons */}
          {currentFlowItem && currentFlowItem.kind !== 'end_survey' && (
          <View style={[styles.buttonsRow, { backgroundColor: c.background }]}>
            {!isLastQuestionBeforeEnd && (
              <TouchableOpacity
                style={[styles.draftButton, { backgroundColor: c.surface, borderColor: c.border }, saving && styles.buttonDisabled]}
                onPress={() => handleSave(false)}
                disabled={saving}
              >
                <Text style={[styles.draftButtonText, { color: c.textSecondary }]}>Simpan Draft</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[
                isLastQuestionBeforeEnd ? styles.submitButton : styles.nextButton,
                { backgroundColor: c.primary },
              ]}
              onPress={handleNext}
            >
	              <Text style={[styles.nextButtonText, { color: '#fff' }]}>
	                {isLastQuestionBeforeEnd
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

      <DatePicker
        modal
        open={!!showOtherDatePicker}
        date={parseDateInputValue(showOtherDatePicker?.value)}
        mode="date"
        locale="id"
        title="Pilih Tanggal"
        confirmText="Pilih"
        cancelText="Batal"
        theme={isDark ? 'dark' : 'light'}
        onConfirm={(date) => {
          if (!showOtherDatePicker) return;
          setOtherTexts((prev) => ({
            ...prev,
            [showOtherDatePicker.key]: formatDateInputValue(date),
          }));
          setShowOtherDatePicker(null);
        }}
        onCancel={() => setShowOtherDatePicker(null)}
      />

      {/* TIME PICKER MODAL — top-level so it renders for all question types */}
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
            {(() => {
              const parts = (showTimePicker.value || '').split(':');
              const initHour = parts[0] ? parseInt(parts[0], 10) : -1;
              const initMin = parts[1] ? parseInt(parts[1], 10) : -1;

              const handleTimeSelect = (newVal: string) => {
                const code = showTimePicker.code;
                // kegiatan _start_
                const partsStart = code.split('_start_');
                if (partsStart.length === 2) {
                  const qCode = partsStart[0];
                  const rowIdx = parseInt(partsStart[1], 10);
                  const rows = showTimePicker.kegArray ?? [];
                  handleAnswerChange(qCode, rows.map((r: any, i: number) => i === rowIdx ? { ...r, start: newVal } : r), showTimePicker.ctx);
                  setShowTimePicker(null);
                  return;
                }
                // kegiatan _stop_
                const partsStop = code.split('_stop_');
                if (partsStop.length === 2) {
                  const qCode = partsStop[0];
                  const rowIdx = parseInt(partsStop[1], 10);
                  const rows = showTimePicker.kegArray ?? [];
                  handleAnswerChange(qCode, rows.map((r: any, i: number) => i === rowIdx ? { ...r, stop: newVal } : r), showTimePicker.ctx);
                  setShowTimePicker(null);
                  return;
                }
                // operating hours _open_
                const partsOpen = code.split('_open_');
                if (partsOpen.length === 2) {
                  const qCode = partsOpen[0];
                  const rowIdx = parseInt(partsOpen[1], 10);
                  const rows = showTimePicker.opArray ?? [];
                  handleAnswerChange(qCode, rows.map((r: any, i: number) => i === rowIdx ? { ...r, open: newVal } : r), showTimePicker.ctx);
                  setShowTimePicker(null);
                  return;
                }
                // operating hours _close_
                const partsClose = code.split('_close_');
                if (partsClose.length === 2) {
                  const qCode = partsClose[0];
                  const rowIdx = parseInt(partsClose[1], 10);
                  const rows = showTimePicker.opArray ?? [];
                  handleAnswerChange(qCode, rows.map((r: any, i: number) => i === rowIdx ? { ...r, close: newVal } : r), showTimePicker.ctx);
                  setShowTimePicker(null);
                  return;
                }
                // plain time field
                handleAnswerChange(code, newVal, showTimePicker.ctx);
                setShowTimePicker({ ...showTimePicker, value: newVal });
              };

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
                            handleTimeSelect(`${label}:${min}`);
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
                            handleTimeSelect(`${hour}:${label}`);
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
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f6f7' },
  contentWrapper: { flex: 1, backgroundColor: '#f5f6f7' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  loadingText: { marginTop: 12, fontSize: 12, color: '#6b7280' },
  backButtonCentered: { marginTop: 16, paddingVertical: 14, paddingHorizontal: 32, backgroundColor: '#07579E', borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  backButtonText: { color: '#fff', fontWeight: '700', fontSize: 18, textAlign: 'center' },

  // Header
  pageHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 10, gap: 10 },
  backIcon: { padding: 4 },
  sectionIndicator: { fontSize: 12, color: '#6b7280' },

  // Progress
  progressContainer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 4, paddingBottom: 8, gap: 12 },
  questionProgressText: { fontWeight: '600', color: '#07579E' },
  questionProgressBar: { flex: 1, height: 6, backgroundColor: '#e5e7eb', borderRadius: 3, overflow: 'hidden' },
  questionProgressFill: { height: '100%', backgroundColor: '#07579E', borderRadius: 3 },
  progressBar: { flex: 1, height: 5, backgroundColor: '#e5e7eb', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#07579E', borderRadius: 3 },
  progressText: { fontSize: 11, fontWeight: '600', color: '#07579E', width: 32, textAlign: 'right' },

  // Content
  content: { flex: 1, padding: 16 },

  // Template info
  templateName: { fontSize: 18, fontWeight: '700', color: '#374151', marginBottom: 16 },
  templateDesc: { fontSize: 12, color: '#6b7280', lineHeight: 18, marginBottom: 16 },

  // Question code
  questionCode: { fontSize: 14, fontWeight: '700', color: '#07579E', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },

  // Section header
  sectionHeaderContainer: { marginBottom: 16 },
  sectionHeader: { fontWeight: '700', color: '#374151', marginBottom: 4 },
  sectionSubtitle: { fontSize: 12, color: '#6b7280', lineHeight: 18 },
  introBox: { marginTop: 10, marginBottom: 16, padding: 14, backgroundColor: '#fefce8', borderRadius: 6, borderWidth: 1, borderColor: '#fde68a' },
  introText: { fontSize: 16, color: '#78350f', lineHeight: 22 },
  hintBanner: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#e6f7f7', borderRadius: 6, borderWidth: 1.5, borderColor: '#07579E', padding: 12, marginBottom: 14, gap: 10 },
  hintBannerIcon: { marginTop: 2, flexShrink: 0 },
  hintBannerContent: { flex: 1 },
  hintBannerPrevAnswer: { fontSize: 12, fontWeight: '700', color: '#07579E', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.3 },
  hintBannerText: { fontSize: 14, color: '#374151', lineHeight: 20 },
  mtcBanner: { flexDirection: 'column', alignItems: 'stretch', marginTop: 8, padding: 10, backgroundColor: '#e6f7f7', borderRadius: 6, borderWidth: 1, borderColor: '#b2e0e1', gap: 2 },
  mtcBannerLabel: { width: '100%', flexShrink: 0, flexWrap: 'wrap', fontSize: 15, color: '#4b5563', fontWeight: '800' },
  mtcBannerCode: { width: '100%', flexShrink: 0, flexWrap: 'wrap', fontSize: 15, fontWeight: '800', color: '#07579E' },

  // Detail group header (shown above each RQA-RQJ block)
  detailGroupHeader: { flexDirection: 'row', alignItems: 'stretch', marginBottom: 12, marginLeft: 8 },
  detailGroupHeaderBar: { width: 3, borderRadius: 2, backgroundColor: '#07579E', marginRight: 10 },
  detailGroupHeaderContent: { flex: 1, justifyContent: 'center' },
  detailGroupHeaderTrigger: { fontSize: 13, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.4 },
  detailGroupHeaderCtx: { fontSize: 15, fontWeight: '800', color: '#07579E', marginTop: 1, flexWrap: 'wrap' },

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
  helpText: { fontSize: 13, color: '#6b7280', marginBottom: 8, lineHeight: 18 },
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
  booleanSelected: { borderColor: '#07579E', backgroundColor: '#f0f9ff' },
  booleanText: { fontSize: 18, fontWeight: '600', color: '#6b7280' },
  booleanTextSelected: { color: '#07579E' },

  // Choices
  choicesContainer: { gap: 12 },
  choiceOption: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 6, padding: 16, gap: 12, borderWidth: 2, borderColor: '#e5e7eb' },
  choiceSelected: { borderColor: '#07579E', backgroundColor: '#f0f9ff' },
  choiceLabelContainer: { flex: 1 },
  choiceLabel: { fontSize: 18, fontWeight: '500', color: '#374151', flex: 1 },
  choiceLabelSelected: { color: '#07579E', fontWeight: '700' },
  choiceHint: { fontSize: 12, color: '#9ca3af', marginTop: 2 },
  otherInput: { marginLeft: 36, marginTop: 6, marginBottom: 6, borderWidth: 1, borderColor: '#d1d5db', borderRadius: 6, paddingHorizontal: 14, paddingVertical: 10, fontSize: 16, color: '#1A1A1A', backgroundColor: '#fff' },
  otherInputFullWidth: { marginLeft: 0, marginTop: 8 },
  otherInputGroup: { marginTop: 8, marginBottom: 6 },
  otherInputLabel: { fontSize: 14, fontWeight: '600', marginBottom: 6 },
  choiceAudioBtn: { width: 32, height: 32, borderRadius: 6, borderWidth: 1.5, borderColor: '#d1d5db', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  choiceAudioBtnActive: { borderColor: '#07579E', backgroundColor: '#e6f7f7' },

  // Radio
  radio: { width: 24, height: 24, borderRadius: 6, borderWidth: 2.5, borderColor: '#d1d5db', alignItems: 'center', justifyContent: 'center' },
  radioSelected: { borderColor: '#07579E' },
  radioInner: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#07579E' },

  // Checkbox
  checkbox: { width: 24, height: 24, borderRadius: 6, borderWidth: 2.5, borderColor: '#d1d5db', alignItems: 'center', justifyContent: 'center' },
  checkboxSelected: { borderColor: '#07579E', backgroundColor: '#07579E' },

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
  pickerItemTextSelected: { color: '#07579E', fontWeight: '600' },

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
  locationButtonText: { fontSize: 16, color: '#07579E', fontWeight: '600' },
  locationInfo: { marginTop: 8, padding: 12, backgroundColor: '#f0f9ff', borderRadius: 6 },
  locationCoordText: { fontSize: 14, color: '#1e40af', fontWeight: '500' },
  locationAccuracyText: { fontSize: 12, color: '#60a5fa', marginTop: 4 },
  fileInputContainer: { gap: 12 },
  filePreviewCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, padding: 10, gap: 12 },
  filePreviewImage: { width: 72, height: 72, borderRadius: 6, backgroundColor: '#f3f4f6' },
  filePreviewMeta: { flex: 1, gap: 4 },
  filePreviewName: { fontSize: 14, fontWeight: '600', color: '#374151' },
  filePreviewStatus: { fontSize: 12, color: '#6b7280' },
  filePickerButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#b2e0e1', borderRadius: 8, paddingVertical: 14, paddingHorizontal: 16 },
  filePickerButtonText: { fontSize: 15, fontWeight: '600', color: '#07579E' },

  // Table
  tableContainer: { backgroundColor: '#fff', borderRadius: 6, overflow: 'hidden' },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  tableCell: { flex: 1, padding: 10, alignItems: 'center', justifyContent: 'center' },
  tableLabelCell: { flex: 2, alignItems: 'flex-start' },
  tableHeaderText: { fontSize: 13, fontWeight: '700', color: '#6b7280' },
  tableCellLabel: { fontSize: 16, color: '#374151' },
  tableCellInput: { fontSize: 14, color: '#374151', textAlign: 'center', padding: 6, width: '100%' },
  staffHeaderRow: { alignItems: 'stretch' },
  staffHeaderCell: { flex: 1, paddingHorizontal: 10, paddingVertical: 12, alignItems: 'center', justifyContent: 'center' },
  staffHeaderCellWide: { flex: 3, alignItems: 'flex-start' },
  staffHeaderTextLeft: { textAlign: 'left' },
  staffDataRow: { alignItems: 'center', paddingHorizontal: 6, paddingVertical: 4 },
  staffRepeatingInput: { flex: 1, minHeight: 40, backgroundColor: '#f9fafb', borderRadius: 6, borderWidth: 1, borderColor: '#e5e7eb', marginHorizontal: 4, paddingHorizontal: 10, textAlign: 'center' },
  staffRepeatingInputWide: { flex: 3, textAlign: 'left' },
  staffActionCell: { width: 44, alignItems: 'center', justifyContent: 'center' },

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
  addServiceBtnText: { fontSize: 14, fontWeight: '600', color: '#07579E' },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyStateText: { fontSize: 15, marginTop: 12 },
  pageTitle: { fontSize: 17, fontWeight: '700', flex: 1, textAlign: 'center' },

  // Buttons
  buttonsRow: { flexDirection: 'row', gap: 14, marginTop: 16, marginBottom: 24 },
  startButton: { flex: 1, backgroundColor: '#07579E', borderRadius: 6, paddingVertical: 14, alignItems: 'center' },
  startButtonText: { fontSize: 15, fontWeight: '600', color: '#fff' },
  nextButton: { flex: 1, backgroundColor: '#07579E', borderRadius: 6, paddingVertical: 14, alignItems: 'center' },
  nextButtonText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  submitButton: { flex: 1, backgroundColor: '#07579E', borderRadius: 6, paddingVertical: 14, alignItems: 'center' },
  submitButtonText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  thankYouIcon: { marginBottom: 16 },
  thankYouTitle: { fontSize: 32, fontWeight: '700', color: '#1a1a1a', marginBottom: 12, textAlign: 'center' },
  thankYouSubtitle: { fontSize: 16, color: '#6b7280', textAlign: 'center', lineHeight: 24, maxWidth: 320 },
  summaryCard: { marginTop: 28, borderWidth: 1, borderRadius: 12, padding: 16, gap: 12 },
  summaryItem: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12 },
  summaryLabel: { fontSize: 12, fontWeight: '600', marginBottom: 4 },
  summaryValue: { fontSize: 15, fontWeight: '700' },
  draftButton: { flex: 1, backgroundColor: '#e5e7eb', borderRadius: 6, paddingVertical: 14, alignItems: 'center' },
  draftButtonText: { fontSize: 15, fontWeight: '600', color: '#374151' },
  cancelButton: { flex: 1, backgroundColor: '#e5e7eb', borderRadius: 6, paddingVertical: 16, alignItems: 'center' },
  cancelButtonText: { fontSize: 16, fontWeight: '600', color: '#374151' },
  buttonDisabled: { opacity: 0.6 },

  // Hint page styles
  hintPageHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  hintPageLabel: { fontWeight: '600', color: '#07579E' },
  hintPagePrevAnswer: { backgroundColor: '#f0f9ff', borderRadius: 6, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: '#b2e0e1' },
  hintPagePrevAnswerLabel: { color: '#6b7280', marginBottom: 4 },
  hintPagePrevAnswerValue: { fontWeight: '700', color: '#07579E' },
  hintPageText: { marginTop: 8 },
  hintPageBodyText: {},

  // Operating hours
  opHoursContainer: { backgroundColor: '#fff', borderRadius: 8, overflow: 'hidden', marginBottom: 12 },
  opHoursRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 12 },
  opHoursColLabel: { fontSize: 12, fontWeight: '700', color: '#6b7280', textAlign: 'center' },
  opHoursCol: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  opHoursCellText: { fontSize: 14, color: '#374151', flex: 1, textAlign: 'center' },
  opHoursTimeInput: { fontSize: 14, color: '#374151', textAlign: 'center', backgroundColor: '#f9fafb', borderRadius: 6, paddingVertical: 8, paddingHorizontal: 4, width: '100%', borderWidth: 1, borderColor: '#e5e7eb' },
  opHoursAddButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 6, borderWidth: 1.5, borderColor: '#07579E', borderStyle: 'dashed' },
  opHoursAddButtonText: { fontSize: 14, fontWeight: '600', color: '#07579E' },

  // Kegiatan table (kegiatans with start/stop time pickers)
  kegTableContainer: { backgroundColor: '#fff', borderRadius: 8, overflow: 'hidden', marginBottom: 12 },
  kegHeaderRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 12, backgroundColor: '#f3f4f6', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  kegRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  kegColLabel: { fontSize: 12, fontWeight: '700', color: '#6b7280', textAlign: 'center' },
  kegNumText: { width: 40, fontSize: 13, color: '#6b7280', textAlign: 'center', fontWeight: '600' },
  kegTextInput: { fontSize: 14, color: '#374151', backgroundColor: '#f9fafb', borderRadius: 6, paddingVertical: 10, paddingHorizontal: 10, borderWidth: 1, borderColor: '#e5e7eb', width: '100%' },
  kegCard: { paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f3f4f6', gap: 10 },
  kegCardTopRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  kegCardBottomRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingLeft: 40 },
  kegCardNumber: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center', marginTop: 18 },
  kegCardMain: { flex: 1, gap: 6 },
  kegFieldLabel: { fontSize: 12, fontWeight: '700', color: '#6b7280' },
  kegTimeField: { flex: 1, gap: 6 },
  kegTimeColHeader: { width: 92, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  kegActionCell: { width: 44, alignItems: 'center', justifyContent: 'center' },
  kegTimeCol: { width: 92, flexGrow: 0, flexShrink: 0 },
  kegTimeBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6, backgroundColor: '#f9fafb', borderRadius: 6, paddingVertical: 10, paddingHorizontal: 10, borderWidth: 1, borderColor: '#e5e7eb', width: '100%' },
  kegTimeText: { fontSize: 14, color: '#374151', textAlign: 'center', flexShrink: 0, includeFontPadding: false },
  matrixSection: { padding: 12, gap: 10 },
  matrixSectionTitle: { fontSize: 13, fontWeight: '700', color: '#374151' },
  matrixOptionCard: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, padding: 12, gap: 10 },
  matrixOptionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  matrixCheckbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: '#9ca3af', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  matrixCheckboxSelected: { backgroundColor: '#07579E', borderColor: '#07579E' },
  matrixOptionLabel: { flex: 1, fontSize: 14, fontWeight: '600', color: '#374151' },
  matrixDaysWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  matrixDayChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: '#f3f4f6', borderWidth: 1, borderColor: '#e5e7eb' },
  matrixDayChipText: { fontSize: 12, fontWeight: '600', color: '#4b5563' },
  matrixCustomCard: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, padding: 12, gap: 10 },
  matrixCustomHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  matrixActivityInput: { flex: 1, fontSize: 14, color: '#374151', backgroundColor: '#f9fafb', borderRadius: 6, paddingVertical: 10, paddingHorizontal: 10, borderWidth: 1, borderColor: '#e5e7eb' },
  matrixDeleteButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
});
