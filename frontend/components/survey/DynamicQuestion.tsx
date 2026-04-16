'use client';

import { useState, useCallback, useEffect } from 'react';
import { Question, QuestionOption, TableAnswer, InterventionSubQuestion } from '@/lib/types/survey-template';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ClickableLabel } from './clickable-label';
import { LocationInput } from './LocationInput';
import { PROVINSI, KABUPATEN, PROVINSI_ID, KABUPATEN_ID, type LocationData } from '@/lib/constants/kebumen-location';
import { useKebumenKecamatan } from '@/hooks/use-geographic-units';
import { Location01Icon, Loading03Icon, VolumeHighIcon } from 'hugeicons-react';
import { useSpeechSynthesis } from '@/hooks/use-speech-synthesis';

interface DynamicQuestionProps {
  question: Question;
  value: any;
  onChange: (value: any) => void;
  onOtherTextChange?: (text: string) => void;
  otherText?: string;
  error?: string;
}

const toSentenceCase = (text: string) => {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};

function AnswerSoundButton({ text }: { text: string }) {
  const { speak, isSpeaking } = useSpeechSynthesis();
  return (
    <button
      type="button"
      onClick={(e) => { e.preventDefault(); speak(text); }}
      aria-label={`Dengarkan: ${text}`}
      className={cn(
        'flex-shrink-0 flex items-center justify-center h-5 w-5 rounded-full border transition-colors',
        isSpeaking
          ? 'border-primary bg-primary/10 text-primary'
          : 'border-border text-muted-foreground hover:border-primary hover:text-primary hover:bg-primary/5'
      )}
    >
      <VolumeHighIcon className="h-3 w-3" />
    </button>
  );
}

export function DynamicQuestion({ question, value, onChange, onOtherTextChange, otherText, error }: DynamicQuestionProps) {
  // Use backend field names with fallback to aliases
  const questionType = question.answer_type || question.question_type;
  const helpText = question.keterangan || question.help_text;
  const questionText = toSentenceCase(question.question_text || question.text || '');
  const options = question.choices || question.options;

  // Auto-set fixed values for GEO_PROVINSI and GEO_KABUPATEN (using database IDs)
  useEffect(() => {
    if (questionType === 'GEO_PROVINSI' && value !== PROVINSI_ID) {
      onChange(PROVINSI_ID);
    }
    if (questionType === 'GEO_KABUPATEN' && value !== KABUPATEN_ID) {
      onChange(KABUPATEN_ID);
    }
  }, [questionType, value, onChange]);

  const renderQuestion = () => {
    switch (questionType) {
      case 'TEXT':
      case 'PHONE':
      case 'EMAIL':
      case 'URL':
        return (
          <Input
            id={question.code}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={helpText}
            className={error ? 'border-destructive' : ''}
          />
        );

      case 'NUMBER':
      case 'INTEGER':
        return (
          <Input
            id={question.code}
            type="number"
            value={value || ''}
            onChange={(e) => onChange(e.target.value ? parseFloat(e.target.value) : null)}
            placeholder={helpText}
            min={question.validation_rules?.min}
            max={question.validation_rules?.max}
            className={error ? 'border-destructive' : ''}
          />
        );

      case 'DATE':
        return (
          <Input
            id={question.code}
            type="date"
            value={value || ''}
            onChange={(e) => onChange(e.target.value || null)}
            className={cn('max-w-xs', error && 'border-destructive')}
          />
        );

      case 'BOOLEAN':
        return (
          <RadioGroup value={value === true ? 'true' : value === false ? 'false' : ''} onValueChange={(v) => onChange(v === 'true')} className="space-y-2">
            <div className="flex items-center space-x-3 py-1">
              <RadioGroupItem value="true" id={`${question.code}-yes`} />
              <Label htmlFor={`${question.code}-yes`} className="font-normal cursor-pointer">Ya</Label>
              <AnswerSoundButton text="Ya" />
            </div>
            <div className="flex items-center space-x-3 py-1">
              <RadioGroupItem value="false" id={`${question.code}-no`} />
              <Label htmlFor={`${question.code}-no`} className="font-normal cursor-pointer">Tidak</Label>
              <AnswerSoundButton text="Tidak" />
            </div>
          </RadioGroup>
        );

      case 'TEXTAREA':
        return (
          <Textarea
            id={question.code}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={helpText}
            rows={4}
            className={error ? 'border-destructive' : ''}
          />
        );

      case 'SINGLE_CHOICE':
        return (
          <RadioGroup value={value || ''} onValueChange={onChange} className="space-y-2">
            {options?.map((option: QuestionOption) => (
              <div key={option.value}>
                <div className="flex items-center space-x-3 py-1">
                  <RadioGroupItem value={option.value} id={`${question.code}-${option.value}`} />
                  <Label htmlFor={`${question.code}-${option.value}`} className="font-normal cursor-pointer">
                    {toSentenceCase(option.label)}
                  </Label>
                  <AnswerSoundButton text={option.label} />
                </div>
                {option.has_other_input && value === option.value && (
                  <div className="ml-7 mt-1">
                    <Input
                      value={otherText || ''}
                      onChange={(e) => onOtherTextChange?.(e.target.value)}
                      placeholder={option.other_input_label || 'Sebutkan'}
                      className="max-w-md"
                    />
                  </div>
                )}
              </div>
            ))}
          </RadioGroup>
        );

      case 'MULTIPLE_CHOICE':
        const currentValues = Array.isArray(value) ? value : [];
        return (
          <div className="space-y-2">
            {options?.map((option: QuestionOption) => (
              <div key={option.value}>
                <div className="flex items-center space-x-3 py-1">
                  <Checkbox
                    id={`${question.code}-${option.value}`}
                    checked={currentValues.includes(option.value)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        onChange([...currentValues, option.value]);
                      } else {
                        onChange(currentValues.filter((v: string) => v !== option.value));
                      }
                    }}
                  />
                  <Label htmlFor={`${question.code}-${option.value}`} className="font-normal cursor-pointer">
                    {toSentenceCase(option.label)}
                  </Label>
                  <AnswerSoundButton text={option.label} />
                </div>
                {option.has_other_input && currentValues.includes(option.value) && (
                  <div className="ml-7 mt-1">
                    <Input
                      value={otherText || ''}
                      onChange={(e) => onOtherTextChange?.(e.target.value)}
                      placeholder={option.other_input_label || 'Sebutkan'}
                      className="max-w-md"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        );

      case 'COVERAGE_LEVEL':
        const coverageLevels = [
          { value: 'DESA_KELURAHAN', label: 'Desa/Kelurahan' },
          { value: 'KECAMATAN', label: 'Kecamatan' },
          { value: 'KABUPATEN_KOTA', label: 'Kabupaten/Kota' },
          { value: 'PROVINSI', label: 'Provinsi' },
          { value: 'NASIONAL', label: 'Nasional' },
        ];
        return (
          <RadioGroup value={value || ''} onValueChange={onChange} className="space-y-2">
            {coverageLevels.map((level) => (
              <div key={level.value} className="flex items-center space-x-3 py-1">
                <RadioGroupItem value={level.value} id={`${question.code}-${level.value}`} />
                <Label htmlFor={`${question.code}-${level.value}`} className="font-normal cursor-pointer">
                  {level.label}
                </Label>
                <AnswerSoundButton text={level.label} />
              </div>
            ))}
          </RadioGroup>
        );

      case 'STAFF_TABLE':
      case 'DIAGNOSIS_TABLE':
      case 'REPEATING_TABLE':
        return <KegiatanTableInput question={question} value={value} onChange={onChange} error={error} />;

      case 'INTERVENTION_MATRIX':
        return <InterventionMatrixInput question={question} value={value} onChange={onChange} error={error} />;

      case 'FILE':
        return (
          <div className="space-y-2">
            <Input
              id={question.code}
              type="file"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  onChange(file);
                }
              }}
              className={error ? 'border-destructive' : ''}
            />
            {value && typeof value === 'string' && (
              <p className="text-sm text-muted-foreground">
                File saat ini: <a href={value} target="_blank" rel="noopener noreferrer" className="underline">{value}</a>
              </p>
            )}
          </div>
        );

      case 'LOCATION':
        return (
          <LocationInput
            value={value as LocationData | null}
            onChange={onChange}
            error={error}
            required={question.is_required}
          />
        );

      case 'GEO_PROVINSI':
        // Fixed to Jawa Tengah for Kebumen surveys
        return (
          <Input
            id={question.code}
            value={PROVINSI}
            disabled
            className="bg-muted"
          />
        );

      case 'GEO_KABUPATEN':
        // Fixed to Kebumen for Kebumen surveys
        return (
          <Input
            id={question.code}
            value={KABUPATEN}
            disabled
            className="bg-muted"
          />
        );

      case 'GEO_KECAMATAN':
        return (
          <KecamatanSelect
            value={value}
            onChange={onChange}
            error={error}
          />
        );

      case 'GEO_DESA':
        return (
          <Input
            id={question.code}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Masukkan nama desa/kelurahan"
            className={cn('max-w-md', error && 'border-destructive')}
          />
        );

      case 'GEO_FULL':
        // Combined location input (uses LocationInput component)
        return (
          <LocationInput
            value={value as LocationData | null}
            onChange={onChange}
            error={error}
            required={question.is_required}
          />
        );

      case 'GPS':
        return (
          <GpsInput
            value={value}
            onChange={onChange}
            error={error}
            questionCode={question.code}
          />
        );

      case 'TIME':
        return (
          <Input
            id={question.code}
            type="time"
            value={value || ''}
            onChange={(e) => onChange(e.target.value || null)}
            className={cn('max-w-xs', error && 'border-destructive')}
          />
        );

      default:
        return <p className="text-sm text-muted-foreground">Tipe pertanyaan tidak didukung: {questionType}</p>;
    }
  };

  return (
    <div className="space-y-3 pb-6 border-b border-border/50 last:border-b-0 last:pb-0">
      {question.introduction_text && (
        <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4 -mb-1">
          <p className="text-sm font-medium text-yellow-900 whitespace-pre-line">
            {toSentenceCase(question.introduction_text)}
          </p>
        </div>
      )}
      <span className="inline-block text-xs font-bold text-primary/70 tracking-wide uppercase mb-0.5">{question.code}</span>
      <ClickableLabel
        htmlFor={question.code}
        description={helpText}
        required={question.is_required}
        className="text-base font-medium"
      >
        {questionText}
      </ClickableLabel>
      <div className="pl-0">
        {renderQuestion()}
      </div>
      {error && <p className="text-sm text-destructive mt-2">{error}</p>}
    </div>
  );
}

// Default table configurations for STAFF_TABLE and DIAGNOSIS_TABLE
const DEFAULT_STAFF_TABLE_CONFIG = {
  rows: [
    { code: 'dokter_spesialis_jiwa', label: 'Dokter Spesialis Jiwa' },
    { code: 'dokter_umum', label: 'Dokter Umum' },
    { code: 'psikolog', label: 'Psikolog' },
    { code: 'perawat', label: 'Perawat' },
    { code: 'pekerja_sosial', label: 'Pekerja Sosial' },
    { code: 'terapis_okupasi', label: 'Terapis Okupasi' },
    { code: 'konselor', label: 'Konselor' },
    { code: 'kader_kesehatan', label: 'Kader Kesehatan' },
    { code: 'relawan', label: 'Relawan' },
    { code: 'lainnya', label: 'Lainnya' },
  ],
  columns: [
    { code: 'laki_laki', label: 'Laki-laki', type: 'number' as const },
    { code: 'perempuan', label: 'Perempuan', type: 'number' as const },
  ],
};

const DEFAULT_DIAGNOSIS_TABLE_CONFIG = {
  rows: [
    { code: 'skizofrenia', label: 'Skizofrenia (F20)' },
    { code: 'bipolar', label: 'Gangguan Bipolar (F31)' },
    { code: 'depresi', label: 'Depresi (F32-F33)' },
    { code: 'cemas', label: 'Gangguan Cemas (F40-F41)' },
    { code: 'ptsd', label: 'PTSD (F43)' },
    { code: 'epilepsi', label: 'Epilepsi (G40)' },
    { code: 'retardasi_mental', label: 'Retardasi Mental (F70-F79)' },
    { code: 'napza', label: 'Gangguan NAPZA (F10-F19)' },
    { code: 'demensia', label: 'Demensia (F00-F03)' },
    { code: 'lainnya', label: 'Lainnya' },
  ],
  columns: [
    { code: 'laki_laki', label: 'Laki-laki', type: 'number' as const },
    { code: 'perempuan', label: 'Perempuan', type: 'number' as const },
  ],
};

/**
 * Component for TABLE question type (staffing grid, etc.)
 */
interface TableInputProps {
  question: Question;
  value: TableAnswer | null;
  onChange: (value: TableAnswer) => void;
  error?: string;
}

function TableInput({ question, value, onChange, error }: TableInputProps) {
  const questionType = question.answer_type || question.question_type;

  // Use provided config or fall back to defaults based on question type
  let config = question.table_config;
  if (!config) {
    if (questionType === 'STAFF_TABLE') {
      config = DEFAULT_STAFF_TABLE_CONFIG;
    } else if (questionType === 'DIAGNOSIS_TABLE') {
      config = DEFAULT_DIAGNOSIS_TABLE_CONFIG;
    }
  }

  if (!config) {
    return <p className="text-sm text-muted-foreground">Konfigurasi tabel tidak ditemukan</p>;
  }

  const currentValue: TableAnswer = value || {};

  const handleCellChange = (rowCode: string, colCode: string, cellValue: string) => {
    const newValue = { ...currentValue };
    if (!newValue[rowCode]) {
      newValue[rowCode] = {};
    }
    newValue[rowCode][colCode] = cellValue;
    onChange(newValue);
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse border">
        <thead>
          <tr>
            <th className="border p-2 bg-muted text-left font-medium">Posisi</th>
            {config.columns!.map((col) => (
              <th key={col.code} className="border p-2 bg-muted text-left font-medium">
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {config.rows!.map((row) => (
            <tr key={row.code}>
              <td className="border p-2 font-medium">{row.label}</td>
              {config.columns!.map((col) => (
                <td key={col.code} className="border p-2">
                  <Input
                    type={col.type}
                    value={currentValue[row.code]?.[col.code] || ''}
                    onChange={(e) => handleCellChange(row.code, col.code, e.target.value)}
                    className="h-9"
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {error && <p className="text-sm text-destructive mt-2">{error}</p>}
    </div>
  );
}

/**
 * KegiatanTableInput — kegiatan schedule table with:
 * - Auto-numbered rows
 * - Kegiatan (text)
 * - Jam Mulai (time picker)
 * - Jam Selesai (time picker)
 * Used for STAFF_TABLE, DIAGNOSIS_TABLE, REPEATING_TABLE
 */
interface KegiatanTableInputProps {
  question: Question;
  value: Array<Record<string, string>> | null;
  onChange: (value: Array<Record<string, string>>) => void;
  error?: string;
}

function KegiatanTableInput({ question, value, onChange, error }: KegiatanTableInputProps) {
  const rows: Array<{ kegiatan: string; start: string; stop: string }> =
    Array.isArray(value) && value.length > 0
      ? value.map(r => ({ kegiatan: r.kegiatan ?? '', start: r.start ?? '', stop: r.stop ?? '' }))
      : [{ kegiatan: '', start: '', stop: '' }];

  const handleCellChange = (idx: number, field: 'kegiatan' | 'start' | 'stop', val: string) => {
    const next = rows.map((r, i) => i === idx ? { ...r, [field]: val } : r);
    onChange(next);
  };

  const handleAddRow = () => onChange([...rows, { kegiatan: '', start: '', stop: '' }]);

  const handleRemoveRow = (idx: number) => {
    if (rows.length <= 1) return;
    onChange(rows.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border text-sm">
          <thead>
            <tr>
              <th className="border p-2 bg-muted text-center font-medium w-10">No</th>
              <th className="border p-2 bg-muted text-left font-medium">KEGIATAN</th>
              <th className="border p-2 bg-muted text-center font-medium w-28">MULAI</th>
              <th className="border p-2 bg-muted text-center font-medium w-28">SELESAI</th>
              <th className="border p-2 bg-muted w-10" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={idx}>
                <td className="border p-2 text-center text-muted-foreground">{idx + 1}</td>
                {/* Kegiatan — text input */}
                <td className="border p-1">
                  <Input
                    value={row.kegiatan}
                    onChange={(e) => handleCellChange(idx, 'kegiatan', e.target.value)}
                    placeholder="Nama kegiatan"
                    className="h-8 border-0 focus-visible:ring-1"
                  />
                </td>
                {/* Jam Mulai — time input */}
                <td className="border p-1">
                  <Input
                    type="time"
                    value={row.start}
                    onChange={(e) => handleCellChange(idx, 'start', e.target.value)}
                    className="h-8 border-0 focus-visible:ring-1 text-center"
                  />
                </td>
                {/* Jam Selesai — time input */}
                <td className="border p-1">
                  <Input
                    type="time"
                    value={row.stop}
                    onChange={(e) => handleCellChange(idx, 'stop', e.target.value)}
                    className="h-8 border-0 focus-visible:ring-1 text-center"
                  />
                </td>
                <td className="border p-1 text-center">
                  <button
                    type="button"
                    onClick={() => handleRemoveRow(idx)}
                    disabled={rows.length <= 1}
                    className="text-destructive hover:text-destructive/80 disabled:opacity-30 text-lg leading-none px-1"
                    aria-label="Hapus baris"
                  >
                    ×
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button
        type="button"
        onClick={handleAddRow}
        className="text-sm text-primary hover:underline flex items-center gap-1"
      >
        + Tambah baris
      </button>

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

/**
 * InterventionMatrixInput — supports two formats:
 *   Legacy: table_config.rows + table_config.columns (fixed rows, grid cells)
 *   New:    table_config.sub_questions (user-defined rows, each with 9 sub-questions)
 */
interface InterventionMatrixInputProps {
  question: Question;
  value: any;
  onChange: (value: any) => void;
  error?: string;
}

function renderMatrixCell(
  col: { code: string; label: string; type: string; options?: Array<{ value: string; label: string }> },
  cellValue: any,
  onCellChange: (v: any) => void,
) {
  switch (col.type) {
    case 'number':
      return (
        <Input
          type="number"
          value={cellValue ?? ''}
          onChange={(e) => onCellChange(e.target.value)}
          className="h-8 border-0 focus-visible:ring-1 min-w-[70px]"
          placeholder="0"
        />
      );
    case 'multiple_choice':
      return (
        <div className="flex flex-col gap-0.5 px-1 py-0.5">
          {(col.options ?? []).map((opt) => {
            const selected: string[] = Array.isArray(cellValue) ? cellValue : [];
            return (
              <label key={opt.value} className="flex items-center gap-1 text-xs cursor-pointer">
                <Checkbox
                  checked={selected.includes(opt.value)}
                  onCheckedChange={(checked) => {
                    if (checked) onCellChange([...selected, opt.value]);
                    else onCellChange(selected.filter((v) => v !== opt.value));
                  }}
                />
                <span>{opt.label}</span>
              </label>
            );
          })}
        </div>
      );
    case 'single_choice':
      return (
        <Select value={cellValue ?? ''} onValueChange={onCellChange}>
          <SelectTrigger className="h-8 border-0 text-xs min-w-[90px]">
            <SelectValue placeholder="—" />
          </SelectTrigger>
          <SelectContent>
            {(col.options ?? []).map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    default: // text, time
      return (
        <Input
          type="text"
          value={cellValue ?? ''}
          onChange={(e) => onCellChange(e.target.value)}
          className="h-8 border-0 focus-visible:ring-1 min-w-[80px]"
          placeholder="—"
        />
      );
  }
}

function renderSubQuestionInput(
  sq: InterventionSubQuestion,
  val: any,
  onChange: (v: any) => void,
) {
  if (sq.type === 'number') {
    return (
      <Input
        type="number"
        value={val ?? ''}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 text-sm"
        placeholder="0"
      />
    );
  }
  if (sq.type === 'multiple_choice') {
    const selected: string[] = Array.isArray(val) ? val : [];
    return (
      <div className="flex flex-col gap-1 mt-1">
        {(sq.options ?? []).map((opt) => (
          <label key={opt} className="flex items-center gap-2 text-sm cursor-pointer">
            <Checkbox
              checked={selected.includes(opt)}
              onCheckedChange={(checked) => {
                onChange(checked ? [...selected, opt] : selected.filter((v) => v !== opt));
              }}
            />
            <span>{opt}</span>
          </label>
        ))}
      </div>
    );
  }
  if (sq.type === 'operating_hours') {
    const opVal: { hari?: string[]; jam?: string } = (val && typeof val === 'object') ? val : {};
    const selectedDays: string[] = Array.isArray(opVal.hari) ? opVal.hari : [];
    return (
      <div className="space-y-2 mt-1">
        <div className="flex flex-wrap gap-1.5">
          {(sq.days ?? []).map((day) => {
            const active = selectedDays.includes(day);
            return (
              <button
                key={day}
                type="button"
                onClick={() => {
                  const next = active ? selectedDays.filter((d) => d !== day) : [...selectedDays, day];
                  onChange({ ...opVal, hari: next });
                }}
                className={`px-3 py-1 rounded-full text-xs border font-medium transition-colors ${
                  active
                    ? 'bg-primary text-white border-primary'
                    : 'bg-white text-muted-foreground border-border hover:border-primary/60'
                }`}
              >
                {day}
              </button>
            );
          })}
        </div>
        <Input
          type="text"
          value={opVal.jam ?? ''}
          onChange={(e) => onChange({ ...opVal, jam: e.target.value })}
          placeholder="contoh: 08:00-16:00"
          className="h-8 text-sm"
        />
      </div>
    );
  }
  if (sq.type === 'boolean') {
    return (
      <div className="flex gap-3 mt-1">
        {[{ label: 'Ya', v: true }, { label: 'Tidak', v: false }].map(({ label, v }) => (
          <button
            key={label}
            type="button"
            onClick={() => onChange(v)}
            className={`px-4 py-1.5 rounded-md text-sm border font-medium transition-colors ${
              val === v
                ? 'bg-primary/10 border-primary text-primary'
                : 'bg-white border-border text-muted-foreground hover:border-primary/60'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    );
  }
  return (
    <Input
      type="text"
      value={val ?? ''}
      onChange={(e) => onChange(e.target.value)}
      className="h-8 text-sm"
      placeholder="—"
    />
  );
}

function InterventionMatrixInput({ question, value, onChange, error }: InterventionMatrixInputProps) {
  const config = question.table_config;
  const hasSubQuestions = Array.isArray(config?.sub_questions) && config.sub_questions!.length > 0;
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  // ── New format: user-defined rows + sub_questions ──────────────────────────
  if (hasSubQuestions) {
    const subQuestions = config!.sub_questions!;
    const genId = () => `${Date.now()}${Math.random().toString(36).slice(2)}`;

    // Pre-populate with default_rows from config when no answer exists yet
    const defaultRows: Array<Record<string, any>> = Array.isArray(config?.default_rows)
      ? (config.default_rows as string[]).map((label: string, i: number) => ({ id: `default_${i}`, label }))
      : [];
    const rows: Array<Record<string, any>> = Array.isArray(value) && value.length > 0 ? value : defaultRows;

    const addRow = () => {
      onChange([...rows, { id: genId(), label: '' }]);
    };

    const deleteRow = (id: string) => {
      onChange(rows.filter((r) => r.id !== id));
    };

    const updateField = (id: string, field: string, val: any) => {
      onChange(rows.map((r) => (r.id === id ? { ...r, [field]: val } : r)));
    };

    const toggleExpand = (id: string) =>
      setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

    return (
      <div className="space-y-3">
        {rows.map((row, idx) => {
          const isExpanded = expanded[row.id] !== false; // default open
          return (
            <div key={row.id} className="border rounded-lg overflow-hidden">
              {/* Row header */}
              <div className="flex items-center gap-2 bg-muted/40 px-3 py-2">
                <span className="text-xs font-bold text-muted-foreground w-5">{idx + 1}.</span>
                <Input
                  value={row.label ?? ''}
                  onChange={(e) => updateField(row.id, 'label', e.target.value)}
                  placeholder="Nama intervensi..."
                  className="h-7 text-sm flex-1 border-0 bg-transparent focus-visible:ring-0 p-0"
                />
                <button
                  type="button"
                  onClick={() => toggleExpand(row.id)}
                  className="text-muted-foreground text-xs hover:text-foreground px-1"
                >
                  {isExpanded ? '▲' : '▼'}
                </button>
                <button
                  type="button"
                  onClick={() => deleteRow(row.id)}
                  className="text-destructive text-base hover:text-destructive/70 px-1 leading-none"
                >
                  ×
                </button>
              </div>

              {/* Sub-questions */}
              {isExpanded && (
                <div className="px-4 py-3 space-y-4">
                  {subQuestions.map((sq, sqIdx) => (
                    <div key={sq.code}>
                      <label className="text-sm font-medium text-foreground">
                        {sqIdx + 1}. {sq.label}
                      </label>
                      {renderSubQuestionInput(sq, row[sq.code], (v) => updateField(row.id, sq.code, v))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        <button
          type="button"
          onClick={addRow}
          className="w-full py-2.5 border-2 border-dashed border-primary/50 rounded-lg text-sm text-primary font-medium hover:border-primary hover:bg-primary/5 transition-colors"
        >
          + Tambah Intervensi
        </button>

        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
    );
  }

  // ── Legacy format: fixed rows + columns grid ───────────────────────────────
  if (!config?.rows?.length || !config?.columns?.length) {
    return (
      <p className="text-sm text-muted-foreground">
        Konfigurasi matriks tidak ditemukan. Tambahkan <code>table_config</code> pada pertanyaan ini.
      </p>
    );
  }

  const currentValue: Record<string, any> = value ?? {};

  const handleSelect = (rowCode: string, checked: boolean) => {
    const next = { ...currentValue };
    if (checked) {
      next[rowCode] = { ...next[rowCode], selected: true };
    } else {
      delete next[rowCode];
    }
    onChange(next);
  };

  const handleCellChange = (rowCode: string, colCode: string, cellValue: any) => {
    onChange({
      ...currentValue,
      [rowCode]: { ...currentValue[rowCode], [colCode]: cellValue },
    });
  };

  return (
    <div className="space-y-2">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border text-sm">
          <thead>
            <tr>
              <th className="border p-2 bg-muted text-left font-medium min-w-[160px]">Jenis Intervensi</th>
              <th className="border p-2 bg-muted text-center font-medium w-12">✓</th>
              {config.columns!.map((col) => (
                <th key={col.code} className="border p-2 bg-muted text-center font-medium min-w-[90px] text-xs">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {config.rows!.map((row) => {
              const rowData = currentValue[row.code];
              const isSelected = !!rowData?.selected;
              return (
                <tr key={row.code} className={isSelected ? '' : 'bg-muted/20'}>
                  <td className="border p-2 font-medium text-sm">{row.label}</td>
                  <td className="border p-2 text-center">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={(checked) => handleSelect(row.code, !!checked)}
                    />
                  </td>
                  {config.columns!.map((col) => (
                    <td key={col.code} className="border p-0.5">
                      {isSelected ? (
                        renderMatrixCell(col, rowData?.[col.code], (v) => handleCellChange(row.code, col.code, v))
                      ) : (
                        <div className="h-8 rounded bg-muted/40" />
                      )}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

/**
 * Component for GPS question type (coordinates input)
 */
interface GpsInputProps {
  value: { latitude: number | null; longitude: number | null } | null;
  onChange: (value: { latitude: number | null; longitude: number | null }) => void;
  error?: string;
  questionCode: string;
}

function GpsInput({ value, onChange, error, questionCode }: GpsInputProps) {
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  const currentValue = value || { latitude: null, longitude: null };
  const hasCoordinates = currentValue.latitude !== null && currentValue.longitude !== null;

  const getLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setGeoError('Geolocation tidak didukung oleh browser Anda');
      return;
    }

    setIsGettingLocation(true);
    setGeoError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        onChange({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setIsGettingLocation(false);
      },
      (err) => {
        let errorMessage = 'Gagal mendapatkan lokasi';
        switch (err.code) {
          case err.PERMISSION_DENIED:
            errorMessage = 'Akses lokasi ditolak. Silakan izinkan akses lokasi di browser Anda.';
            break;
          case err.POSITION_UNAVAILABLE:
            errorMessage = 'Informasi lokasi tidak tersedia.';
            break;
          case err.TIMEOUT:
            errorMessage = 'Waktu permintaan lokasi habis.';
            break;
        }
        setGeoError(errorMessage);
        setIsGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }, [onChange]);

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          id={questionCode}
          value={hasCoordinates
            ? `${currentValue.latitude?.toFixed(6)}, ${currentValue.longitude?.toFixed(6)}`
            : ''
          }
          disabled
          placeholder="Klik tombol untuk mendapatkan koordinat"
          className={cn('flex-1 bg-muted max-w-md', !hasCoordinates && error && 'border-destructive')}
        />
        <Button
          type="button"
          variant="outline"
          onClick={getLocation}
          disabled={isGettingLocation}
          className="shrink-0"
        >
          {isGettingLocation ? (
            <Loading03Icon className="h-4 w-4 animate-spin" />
          ) : (
            <Location01Icon className="h-4 w-4" />
          )}
          <span className="ml-2 hidden sm:inline">
            {isGettingLocation ? 'Mencari...' : 'Dapatkan Lokasi'}
          </span>
        </Button>
      </div>
      {geoError && (
        <p className="text-sm text-destructive">{geoError}</p>
      )}
    </div>
  );
}

/**
 * Component for GEO_KECAMATAN question type
 * Fetches kecamatan data from the API and displays a dropdown
 */
interface KecamatanSelectProps {
  value: number | null;
  onChange: (value: number) => void;
  error?: string;
}

function KecamatanSelect({ value, onChange, error }: KecamatanSelectProps) {
  const { data: kecamatanList, isLoading } = useKebumenKecamatan();

  const selectedName = kecamatanList?.find((k) => k.id === value)?.name;

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loading03Icon className="h-4 w-4 animate-spin" />
        <span className="text-sm">Memuat data kecamatan...</span>
      </div>
    );
  }

  return (
    <Select
      value={value?.toString() || ''}
      onValueChange={(val) => onChange(parseInt(val, 10))}
    >
      <SelectTrigger className={cn('max-w-md', error && 'border-destructive')}>
        <SelectValue placeholder="-- Pilih Kecamatan --">
          {selectedName || (value ? `Kecamatan ${value}` : '-- Pilih Kecamatan --')}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {kecamatanList?.map((kec) => (
          <SelectItem key={kec.id} value={kec.id.toString()}>
            {kec.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
