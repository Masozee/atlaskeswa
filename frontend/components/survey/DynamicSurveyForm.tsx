'use client';

import Link from 'next/link';
import { useState, useMemo, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DynamicQuestion } from './DynamicQuestion';
import type { Question, QuestionOption, SurveyTemplate, SurveyAnswers } from '@/lib/types/survey-template';
import type { ServiceListItem } from '@/lib/types/api';
import { buildQuestionsMap, getActiveSections, getFlowBasedQuestions, calculateProgress } from '@/lib/utils/question-logic';
import { useCreateSurveyResponse } from '@/hooks/use-survey-responses';
import { toast } from 'sonner';

interface DynamicSurveyFormProps {
  template: SurveyTemplate;
  serviceId: number;
  serviceSummary?: ServiceListItem;
  surveyDate: string;
  surveyPeriodStart: string;
  surveyPeriodEnd: string;
  initialAnswers?: SurveyAnswers;
  onSuccess?: () => void;
  onBack?: () => void;
  onSpeechTextChange?: (text: string) => void;
  /**
   * When provided, the form submits by calling this with the built answers
   * payload instead of creating a new response (used for editing an existing
   * response). Should throw on failure so the form can surface the error.
   */
  onSubmitAnswers?: (answers: SurveyAnswers) => Promise<void>;
  /** Label/behaviour tweaks for edit mode. */
  submitLabel?: string;
}

export function DynamicSurveyForm({
  template,
  serviceId,
  serviceSummary,
  surveyDate,
  surveyPeriodStart,
  surveyPeriodEnd,
  initialAnswers = {},
  onSuccess,
  onBack,
  onSpeechTextChange,
  onSubmitAnswers,
  submitLabel,
}: DynamicSurveyFormProps) {
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [answers, setAnswers] = useState<SurveyAnswers>(() => {
    // Strip __other_text keys from initialAnswers
    const clean: SurveyAnswers = {};
    for (const [k, v] of Object.entries(initialAnswers)) {
      if (!k.endsWith('__other_text')) clean[k] = v;
    }
    return clean;
  });
  const [otherTexts, setOtherTexts] = useState<Record<string, string>>(() => {
    const texts: Record<string, string> = {};
    for (const [k, v] of Object.entries(initialAnswers)) {
      if (k.endsWith('__other_text') && typeof v === 'string') {
        const baseKey = k.replace('__other_text', '');
        try {
          const parsed = JSON.parse(v);
          if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
            for (const [choiceValue, choiceText] of Object.entries(parsed)) {
              if (typeof choiceText === 'string') {
                texts[`${baseKey}__choice_${choiceValue}`] = choiceText;
              }
            }
            continue;
          }
        } catch {
          // Older saved responses store a single plain other_text value.
        }
        texts[baseKey] = v;
      }
    }
    return texts;
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [currentMtcContext, setCurrentMtcContext] = useState<string>('');
  const [currentMtcLabel, setCurrentMtcLabel] = useState<string>('');

  const createSurvey = useCreateSurveyResponse();

  // Build questions map for conditional logic
  const questionsMap = useMemo(() => {
    if (!template.sections) return new Map();
    return buildQuestionsMap(template.sections);
  }, [template.sections]);

  // Resolved answers: for flow logic, map "R2|RQA" → "RQA" so conditions still work
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

  // Get active sections based on current answers
  const activeSections = useMemo(() => {
    if (!template.sections) return [];
    return getActiveSections(template.sections, resolvedAnswers, questionsMap);
  }, [template.sections, resolvedAnswers, questionsMap]);

  // Get current section
  const currentSection = activeSections[currentSectionIndex];

  // Get active questions for current section (uses flow-based branching if available).
  // Passing `answers` as rawAnswers enables inline cross-section follow (FASKSES→DETAIL loops).
  const activeQuestions = useMemo(() => {
    if (!currentSection) return [];
    return getFlowBasedQuestions(currentSection, resolvedAnswers, questionsMap, template.sections, answers);
  }, [currentSection, resolvedAnswers, questionsMap, template.sections, answers]);

  // Per-question MTC context: walk activeQuestions in order, tracking which cabang_mtc context
  // each question belongs to. Non-detail questions always get '' (no prefix). Detail questions get
  // the context set by the most recent FASKSES question whose answer had a cabang_mtc.
  // This correctly handles multiple inline DETAIL loops (one per classification answer).
  const getQuestionContexts = useCallback((questions: Question[]): string[] => {
    const allQDefs = template.sections?.flatMap(s => s.questions || []) ?? [];
    let ctxTracker = '';
    return questions.map((question) => {
      const isDetail = /[A-Z]$/.test(question.code);
      if (!isDetail) {
        const rawAns = answers[question.code];
        if (rawAns !== null && rawAns !== undefined && rawAns !== '') {
          const qDef = allQDefs.find(q => q.code === question.code);
          const choice = qDef?.choices?.find((c) => c.value === rawAns);
          ctxTracker = choice?.cabang_mtc ?? '';
        }
        return '';
      }
      return ctxTracker;
    });
  }, [answers, template.sections]);

  const questionContexts = useMemo<string[]>(() => {
    return getQuestionContexts(activeQuestions);
  }, [activeQuestions, getQuestionContexts]);

  // Calculate progress
  const progress = useMemo(() => {
    if (!template.sections) return 0;
    return calculateProgress(template.sections, resolvedAnswers, questionsMap, answers);
  }, [template.sections, resolvedAnswers, questionsMap, answers]);

  const formatDate = useCallback((value: string) => {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }, []);

  const surveySummary = useMemo(() => ([
    { label: 'Nama Faskes', value: serviceSummary?.name || `Fasilitas #${serviceId}` },
    {
      label: 'Lokasi',
      value: [serviceSummary?.city, serviceSummary?.province].filter(Boolean).join(', ') || '-',
    },
    { label: 'Kode BSIC', value: serviceSummary?.bsic_code || '-' },
    { label: 'Nama BSIC', value: serviceSummary?.bsic_name || '-' },
    { label: 'Jenis Layanan', value: serviceSummary?.service_type_name || '-' },
    { label: 'Tanggal Survei', value: formatDate(surveyDate) },
    {
      label: 'Periode Data',
      value: surveyPeriodStart && surveyPeriodEnd
        ? `${formatDate(surveyPeriodStart)} - ${formatDate(surveyPeriodEnd)}`
        : '-',
    },
    { label: 'Template', value: template.name || '-' },
    { label: 'Status', value: 'Diajukan' },
  ]), [
    formatDate,
    serviceId,
    serviceSummary?.bsic_code,
    serviceSummary?.bsic_name,
    serviceSummary?.city,
    serviceSummary?.name,
    serviceSummary?.province,
    serviceSummary?.service_type_name,
    surveyDate,
    surveyPeriodEnd,
    surveyPeriodStart,
    template.name,
  ]);

  // Build text for speech synthesis (current section content)
  const speechText = useMemo(() => {
    if (!currentSection) return '';

    const toSc = (t: string) => t ? t.charAt(0).toUpperCase() + t.slice(1).toLowerCase() : '';

    const sectionName = currentSection.name || currentSection.title || 'Bagian Survei';
    const sectionDesc = currentSection.description || '';

    let text = `Bagian ${currentSectionIndex + 1}: ${toSc(sectionName)}.`;
    if (sectionDesc) {
      text += ` ${toSc(sectionDesc)}.`;
    }

    // Section-level teks pengantar
    if (currentSection.introduction_text) {
      text += ` ${toSc(currentSection.introduction_text)}`;
    }

    // Add questions
    activeQuestions.forEach((question, index) => {
      const questionText = toSc(question.question_text || question.text || '');
      const helpText = question.keterangan || question.help_text || '';

      // Per-question teks pengantar
      if (question.introduction_text) {
        text += ` ${toSc(question.introduction_text)}`;
      }

      text += ` Pertanyaan ${index + 1}: ${questionText}`;
      if (helpText) {
        text += ` ${toSc(helpText)}`;
      }

      // Add choices if available
      if (question.choices && question.choices.length > 0) {
        const choiceTexts = question.choices.map((c) => c.label).filter(Boolean);
        if (choiceTexts.length > 0) {
          text += ` Pilihan: ${choiceTexts.join(', ')}.`;
        }
      }
    });

    return text;
  }, [currentSection, currentSectionIndex, activeQuestions]);

  // Notify parent of speech text changes
  useEffect(() => {
    if (onSpeechTextChange) {
      onSpeechTextChange(speechText);
    }
  }, [speechText, onSpeechTextChange]);

  // Build answers with other_text keys merged in
  const buildAnswersPayload = () => {
    const payload = { ...answers };
    const groupedChoiceTexts: Record<string, Record<string, string>> = {};
    for (const [code, text] of Object.entries(otherTexts)) {
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
        payload[`${code}__other_text`] = text;
      }
    }
    for (const [baseKey, values] of Object.entries(groupedChoiceTexts)) {
      payload[`${baseKey}__other_text`] = JSON.stringify(values);
    }
    return payload;
  };

  // Detect if a question code is a "detail" question (ends with uppercase letter, no trailing digit)
  const isDetailQuestion = (code: string) => /[A-Z]$/.test(code);

  // Handle answer change
  // ctxOverride: the MTC context for this specific question instance (from questionContexts).
  // Falls back to currentMtcContext when not provided (e.g., speech/other callers).
  const handleAnswerChange = (questionCode: string, value: SurveyAnswers[string], ctxOverride?: string) => {
    const ctx = ctxOverride !== undefined ? ctxOverride : currentMtcContext;
    // For detail questions, prefix storage key with MTC context
    const storageKey = isDetailQuestion(questionCode) && ctx
      ? `${ctx}|${questionCode}`
      : questionCode;

    // Detect MTC context change from a choice with cabang_mtc
    const allQuestions = template.sections?.flatMap(s => s.questions || []) || [];
    const q = allQuestions.find(q => q.code === questionCode);
    const selectedChoice = q?.choices?.find((c) => c.value === value);

    // Store the answer — always accumulate, never clear previous context answers
    // (each context uses a different prefixed key, so they don't collide)
    setAnswers((prev) => ({ ...prev, [storageKey]: value }));

    if (selectedChoice?.cabang_mtc && selectedChoice.cabang_mtc !== currentMtcContext) {
      // Advance MTC context to the newly selected subtype
      setCurrentMtcContext(selectedChoice.cabang_mtc);
      setCurrentMtcLabel(selectedChoice.label);
    } else if (!isDetailQuestion(questionCode) && !selectedChoice?.cabang_mtc) {
      // Non-detail question without a cabang_mtc — clear context
      setCurrentMtcContext('');
      setCurrentMtcLabel('');
    }

    // Clear other_text if user deselects the "other" choice
    const choiceOtherTextKeys = Object.keys(otherTexts).filter((key) => key.startsWith(`${storageKey}__choice_`));
    if (otherTexts[storageKey] || choiceOtherTextKeys.length > 0) {
      if (q?.choices) {
        setOtherTexts((prev) => {
          const n = { ...prev };
          for (const choice of q.choices || []) {
            if (!choice.has_other_input) continue;
            const isOtherSelected = Array.isArray(value)
              ? value.includes(choice.value)
              : value === choice.value;
            if (!isOtherSelected) {
              delete n[`${storageKey}__choice_${choice.value}`];
            }
          }
          const firstOtherChoice = q.choices?.find((c) => c.has_other_input);
          if (firstOtherChoice) {
            const isOtherSelected = Array.isArray(value)
              ? value.includes(firstOtherChoice.value)
              : value === firstOtherChoice.value;
            if (!isOtherSelected) delete n[storageKey];
          }
          return n;
        });
      }
    }

    // Clear error for this question
    if (errors[storageKey]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[storageKey];
        return newErrors;
      });
    }
  };

  const getOtherInputType = (questionCode: string, choice: QuestionOption): string => {
    if (questionCode === 'Q15' && choice.value === 'TANGGAL') return 'date';
    if (questionCode === 'Q15' && choice.value === 'TIDAK_DIKETAHUI') return 'integer';
    return choice.other_input_type || 'text';
  };

  const selectedOtherInputChoices = (question: Question, answer: SurveyAnswers[string]) => {
    const choices = question.choices || question.options || [];
    return choices.filter((choice) => {
      if (!choice.has_other_input) return false;
      return Array.isArray(answer)
        ? answer.includes(choice.value)
        : answer === choice.value;
    });
  };

  const validateQuestions = (questions: Question[], contexts: string[]): boolean => {
    const newErrors: Record<string, string> = {};

    questions.forEach((question, idx) => {
      const questionType = question.answer_type || question.question_type;
      const ctx = contexts[idx] ?? '';
      const storageKey = isDetailQuestion(question.code) && ctx
        ? `${ctx}|${question.code}`
        : question.code;
      const answer = answers[storageKey];

      if (question.is_required) {
        if (answer === null || answer === undefined || answer === '' || (Array.isArray(answer) && answer.length === 0)) {
          newErrors[storageKey] = 'Pertanyaan ini wajib diisi';
        }
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
          newErrors[storageKey] = 'Tanggal harus diisi dari pemilih tanggal';
          break;
        }
      }

      // Special validation for LOCATION type - koordinat must be filled
      if (questionType === 'LOCATION' && answer) {
        const locationData = answer as {
          provinsi?: string;
          kabupaten?: string;
          kecamatan?: string;
          desa?: string;
          koordinat?: { latitude: number | null; longitude: number | null };
        };
        if (!locationData.koordinat?.latitude || !locationData.koordinat?.longitude) {
          newErrors[storageKey] = 'Koordinat harus diisi. Klik tombol "Dapatkan Lokasi" untuk mengisi koordinat.';
        }
        if (!locationData.kecamatan) {
          newErrors[storageKey] = 'Kecamatan harus dipilih';
        }
        if (!locationData.desa) {
          newErrors[storageKey] = 'Desa/Kelurahan harus diisi';
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Validate current section
  const validateSection = (): boolean => {
    return validateQuestions(activeQuestions, questionContexts);
  };

  // Navigate to next section
  const handleNext = () => {
    if (!validateSection()) {
      toast.error('Mohon lengkapi semua pertanyaan yang wajib diisi');
      return;
    }

    if (currentSectionIndex < activeSections.length - 1) {
      setCurrentSectionIndex((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Navigate to previous section
  const handlePrevious = () => {
    if (currentSectionIndex > 0) {
      setCurrentSectionIndex((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Submit survey
  const handleSubmit = async () => {
    // Validate all sections
    let allValid = true;
    for (let index = 0; index < activeSections.length; index += 1) {
      const sectionQuestions = getFlowBasedQuestions(activeSections[index], resolvedAnswers, questionsMap, template.sections, answers);
      const contexts = getQuestionContexts(sectionQuestions);
      if (!validateQuestions(sectionQuestions, contexts)) {
        setCurrentSectionIndex(index);
        allValid = false;
        break;
      }
    }

    if (!allValid) {
      toast.error('Mohon lengkapi semua pertanyaan yang wajib diisi di semua bagian');
      return;
    }

    setIsSaving(true);
    try {
      if (onSubmitAnswers) {
        await onSubmitAnswers(buildAnswersPayload());
      } else {
        await createSurvey.mutateAsync({
          template: template.id,
          service: serviceId,
          survey_date: surveyDate,
          survey_period_start: surveyPeriodStart,
          survey_period_end: surveyPeriodEnd,
          answers: buildAnswersPayload(),
        });
      }

      toast.success(onSubmitAnswers ? 'Perubahan survei tersimpan.' : 'Survei berhasil direkam.');
      setIsSubmitted(true);
      onSuccess?.();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Gagal menyimpan survei');
    } finally {
      setIsSaving(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-12 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
          <svg className="h-10 w-10 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold">Terima Kasih!</h2>
          <p className="text-muted-foreground max-w-2xl">
            Data survei berhasil direkam. Berikut ringkasan fasilitas dan klasifikasi yang dipilih.
          </p>
        </div>

        <div className="w-full max-w-3xl rounded-xl border bg-card p-6 text-left">
          <h3 className="text-lg font-semibold">Ringkasan Survei</h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {surveySummary.map((item) => (
              <div key={item.label} className="rounded-lg border bg-muted/30 p-4">
                <p className="text-sm text-muted-foreground">{item.label}</p>
                <p className="mt-1 font-medium">{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button asChild variant="outline">
            <Link href="/survey/new">Isi Survei Baru</Link>
          </Button>
          <Button asChild>
            <Link href="/dashboard/survey">Lihat Daftar Survei</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (!currentSection) {
    return (
      <Alert>
        <AlertDescription>Tidak ada bagian aktif untuk ditampilkan</AlertDescription>
      </Alert>
    );
  }

  const toSentenceCase = (text: string) =>
    text ? text.charAt(0).toUpperCase() + text.slice(1).toLowerCase() : '';
  const toUpper = (text: string) => text ? text.toUpperCase() : '';

  // Use backend field names with fallback to aliases
  const sectionTitle = toSentenceCase(currentSection.name || currentSection.title || 'Bagian Survei');
  const sectionDescription = currentSection.description
    ? toSentenceCase(currentSection.description)
    : undefined;

  return (
    <div className="flex flex-1 flex-col gap-5">
      {/* Progress bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">
              Bagian {currentSectionIndex + 1} dari {activeSections.length}
            </p>
            <div className="text-sm font-medium">{progress}% selesai</div>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </div>

      {/* Section header */}
      <div className="border-b pb-4">
        <h2 className="text-xl font-semibold">{sectionTitle}</h2>
        {sectionDescription && (
          <p className="text-muted-foreground mt-1">{sectionDescription}</p>
        )}
      </div>

      {/* MTC context banner — shown when filling detail questions under a specific MTC */}
      {currentMtcContext && (
        <div className="flex items-center gap-2 bg-primary/10 border border-primary/30 rounded-lg px-4 py-2 text-sm">
          <span className="text-muted-foreground">Sedang mengisi detail untuk:</span>
          <span className="font-semibold text-primary">{currentMtcContext}</span>
          {currentMtcLabel && <span className="text-muted-foreground">— {toUpper(currentMtcLabel)}</span>}
        </div>
      )}

      {/* Introduction text — contextual note shown before the questions */}
      {currentSection.introduction_text && (
        <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4">
          <p className="text-sm font-medium text-yellow-900 whitespace-pre-line">
            {toUpper(currentSection.introduction_text)}
          </p>
        </div>
      )}

      {/* Questions */}
      <div className="space-y-8">
        {activeQuestions.map((question, idx) => {
          const ctx = questionContexts[idx] ?? '';
          const storageKey = isDetailQuestion(question.code) && ctx
            ? `${ctx}|${question.code}`
            : question.code;
          return (
            <DynamicQuestion
              key={`${ctx}-${question.code}-${idx}`}
              question={question}
              value={answers[storageKey]}
              onChange={(value) => handleAnswerChange(question.code, value, ctx)}
              onOtherTextChange={(text, optionValue) => {
                const otherTextKey = optionValue ? `${storageKey}__choice_${optionValue}` : storageKey;
                setOtherTexts((prev) => ({ ...prev, [otherTextKey]: text }));
              }}
              otherText={(() => {
                const choiceTexts = Object.fromEntries(
                  Object.entries(otherTexts)
                    .filter(([key]) => key.startsWith(`${storageKey}__choice_`))
                    .map(([key, text]) => [key.slice(`${storageKey}__choice_`.length), text])
                );
                return Object.keys(choiceTexts).length > 0 ? choiceTexts : otherTexts[storageKey];
              })()}
              error={errors[storageKey]}
            />
          );
        })}
      </div>

      {/* Navigation buttons */}
      <div className="flex items-center justify-between gap-4 pt-6 border-t">
        <Button
          variant="outline"
          onClick={currentSectionIndex > 0 ? handlePrevious : onBack}
        >
          ← Sebelumnya
        </Button>

        {currentSectionIndex < activeSections.length - 1 ? (
          <Button onClick={handleNext}>
            Selanjutnya →
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={isSaving}>
            {isSaving ? 'Menyimpan...' : (submitLabel ?? 'Terima Kasih')}
          </Button>
        )}
      </div>
    </div>
  );
}
