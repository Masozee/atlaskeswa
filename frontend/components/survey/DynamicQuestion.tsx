'use client';

import { useState, useCallback, useEffect } from 'react';
import { Question, QuestionOption, TableAnswer } from '@/lib/types/survey-template';
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
import { Location01Icon, Loading03Icon } from 'hugeicons-react';

interface DynamicQuestionProps {
  question: Question;
  value: any;
  onChange: (value: any) => void;
  error?: string;
}

export function DynamicQuestion({ question, value, onChange, error }: DynamicQuestionProps) {
  // Use backend field names with fallback to aliases
  const questionType = question.answer_type || question.question_type;
  const helpText = question.keterangan || question.help_text;
  const questionText = question.question_text || question.text;
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
            </div>
            <div className="flex items-center space-x-3 py-1">
              <RadioGroupItem value="false" id={`${question.code}-no`} />
              <Label htmlFor={`${question.code}-no`} className="font-normal cursor-pointer">Tidak</Label>
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
              <div key={option.value} className="flex items-center space-x-3 py-1">
                <RadioGroupItem value={option.value} id={`${question.code}-${option.value}`} />
                <Label htmlFor={`${question.code}-${option.value}`} className="font-normal cursor-pointer">
                  {option.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
        );

      case 'MULTIPLE_CHOICE':
        const currentValues = Array.isArray(value) ? value : [];
        return (
          <div className="space-y-2">
            {options?.map((option: QuestionOption) => (
              <div key={option.value} className="flex items-center space-x-3 py-1">
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
                  {option.label}
                </Label>
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
              </div>
            ))}
          </RadioGroup>
        );

      case 'STAFF_TABLE':
      case 'DIAGNOSIS_TABLE':
        return <TableInput question={question} value={value} onChange={onChange} error={error} />;

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
            {config.columns.map((col) => (
              <th key={col.code} className="border p-2 bg-muted text-left font-medium">
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {config.rows.map((row) => (
            <tr key={row.code}>
              <td className="border p-2 font-medium">{row.label}</td>
              {config.columns.map((col) => (
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
        <SelectValue placeholder="-- Pilih Kecamatan --" />
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
