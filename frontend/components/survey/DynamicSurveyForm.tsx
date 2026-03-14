'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DynamicQuestion } from './DynamicQuestion';
import type { SurveyTemplate, SurveyAnswers } from '@/lib/types/survey-template';
import { buildQuestionsMap, getActiveSections, getFlowBasedQuestions, calculateProgress } from '@/lib/utils/question-logic';
import { useCreateSurveyResponse, useSaveProgress } from '@/hooks/use-survey-responses';
import { toast } from 'sonner';

interface DynamicSurveyFormProps {
  template: SurveyTemplate;
  serviceId: number;
  surveyDate: string;
  surveyPeriodStart: string;
  surveyPeriodEnd: string;
  initialAnswers?: SurveyAnswers;
  mode?: 'create' | 'edit';
  surveyResponseId?: number;
  onSuccess?: () => void;
  onBack?: () => void;
  onSpeechTextChange?: (text: string) => void;
}

export function DynamicSurveyForm({
  template,
  serviceId,
  surveyDate,
  surveyPeriodStart,
  surveyPeriodEnd,
  initialAnswers = {},
  mode = 'create',
  surveyResponseId,
  onSuccess,
  onBack,
  onSpeechTextChange,
}: DynamicSurveyFormProps) {
  const router = useRouter();
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
        texts[k.replace('__other_text', '')] = v;
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
  const saveProgress = surveyResponseId ? useSaveProgress(surveyResponseId) : null;

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

  // Get active questions for current section (uses flow-based branching if available)
  const activeQuestions = useMemo(() => {
    if (!currentSection) return [];
    return getFlowBasedQuestions(currentSection, resolvedAnswers, questionsMap, template.sections);
  }, [currentSection, resolvedAnswers, questionsMap, template.sections]);

  // Calculate progress
  const progress = useMemo(() => {
    if (!template.sections) return 0;
    return calculateProgress(template.sections, resolvedAnswers, questionsMap);
  }, [template.sections, resolvedAnswers, questionsMap]);

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
        const choiceTexts = question.choices.map((c: any) => c.label || c.choice_text || c.text).filter(Boolean);
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
    for (const [code, text] of Object.entries(otherTexts)) {
      if (text) payload[`${code}__other_text`] = text;
    }
    return payload;
  };

  // Detect if a question code is a "detail" question (ends with uppercase letter, no trailing digit)
  const isDetailQuestion = (code: string) => /[A-Z]$/.test(code);

  // Handle answer change
  const handleAnswerChange = (questionCode: string, value: any) => {
    // For detail questions, prefix storage key with current MTC context
    const storageKey = isDetailQuestion(questionCode) && currentMtcContext
      ? `${currentMtcContext}|${questionCode}`
      : questionCode;

    // Detect MTC context change from a choice with cabang_mtc
    const allQuestions = template.sections?.flatMap(s => s.questions || []) || [];
    const q = allQuestions.find(q => q.code === questionCode);
    const selectedChoice = q?.choices?.find((c: any) => c.value === value);

    if (selectedChoice?.cabang_mtc && selectedChoice.cabang_mtc !== currentMtcContext) {
      // Clear previously stored detail answers for the old context before switching
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
      // If a main question (non-detail) is re-answered and has no cabang_mtc, clear context
      if (!isDetailQuestion(questionCode) && !selectedChoice?.cabang_mtc) {
        setCurrentMtcContext('');
        setCurrentMtcLabel('');
      }
    }

    // Clear other_text if user deselects the "other" choice
    if (otherTexts[questionCode]) {
      if (q?.choices) {
        const otherChoice = q.choices.find((c: any) => c.has_other_input);
        if (otherChoice) {
          const isOtherSelected = Array.isArray(value)
            ? value.includes(otherChoice.value)
            : value === otherChoice.value;
          if (!isOtherSelected) {
            setOtherTexts((prev) => { const n = { ...prev }; delete n[questionCode]; return n; });
          }
        }
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

  // Validate current section
  const validateSection = (): boolean => {
    const newErrors: Record<string, string> = {};

    activeQuestions.forEach((question) => {
      const questionType = question.answer_type || question.question_type;
      const storageKey = isDetailQuestion(question.code) && currentMtcContext
        ? `${currentMtcContext}|${question.code}`
        : question.code;
      const answer = answers[storageKey];

      if (question.is_required) {
        if (answer === null || answer === undefined || answer === '' || (Array.isArray(answer) && answer.length === 0)) {
          newErrors[storageKey] = 'Pertanyaan ini wajib diisi';
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

  // Save draft
  const handleSaveDraft = async () => {
    setIsSaving(true);
    try {
      if (mode === 'create') {
        const result = await createSurvey.mutateAsync({
          template: template.id,
          service: serviceId,
          survey_date: surveyDate,
          survey_period_start: surveyPeriodStart,
          survey_period_end: surveyPeriodEnd,
          answers: buildAnswersPayload(),
        });

        toast.success('Survey berhasil disimpan sebagai draft');

        // Redirect to edit mode
        router.push(`/dashboard/survey/responses/${result.id}/edit`);
      } else if (saveProgress) {
        await saveProgress.mutateAsync({ answers: buildAnswersPayload() });
        toast.success('Perubahan berhasil disimpan');
      }
    } catch (error: any) {
      toast.error(error.message || 'Gagal menyimpan');
    } finally {
      setIsSaving(false);
    }
  };

  // Submit survey
  const handleSubmit = async () => {
    // Validate all sections
    const allValid = activeSections.every((_section, index) => {
      setCurrentSectionIndex(index);
      return validateSection();
    });

    if (!allValid) {
      toast.error('Mohon lengkapi semua pertanyaan yang wajib diisi di semua bagian');
      return;
    }

    setIsSaving(true);
    try {
      await createSurvey.mutateAsync({
        template: template.id,
        service: serviceId,
        survey_date: surveyDate,
        survey_period_start: surveyPeriodStart,
        survey_period_end: surveyPeriodEnd,
        answers: buildAnswersPayload(),
      });

        toast.success('Survey berhasil disimpan dan siap untuk disubmit');
        setIsSubmitted(true);
    } catch (error: any) {
      toast.error(error.message || 'Gagal menyimpan survey');
    } finally {
      setIsSaving(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-20 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
          <svg className="h-10 w-10 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold">Terima Kasih!</h2>
          <p className="text-muted-foreground max-w-sm">
            Jawaban Anda telah berhasil disimpan. Terima kasih telah mengisi survei ini.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => router.push('/dashboard/survey/responses')}>
            Lihat Semua Respons
          </Button>
          <Button onClick={() => router.push('/dashboard')}>
            Kembali ke Dashboard
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
      {currentMtcContext && activeQuestions.some(q => isDetailQuestion(q.code)) && (
        <div className="flex items-center gap-2 bg-primary/10 border border-primary/30 rounded-lg px-4 py-2 text-sm">
          <span className="text-muted-foreground">Sedang mengisi detail untuk:</span>
          <span className="font-semibold text-primary">{currentMtcContext}</span>
          {currentMtcLabel && <span className="text-muted-foreground">— {toSentenceCase(currentMtcLabel)}</span>}
        </div>
      )}

      {/* Introduction text — contextual note shown before the questions */}
      {currentSection.introduction_text && (
        <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4">
          <p className="text-sm font-medium text-yellow-900 whitespace-pre-line">
            {toSentenceCase(currentSection.introduction_text)}
          </p>
        </div>
      )}

      {/* Questions */}
      <div className="space-y-8">
        {activeQuestions.map((question) => {
          const storageKey = isDetailQuestion(question.code) && currentMtcContext
            ? `${currentMtcContext}|${question.code}`
            : question.code;
          return (
            <DynamicQuestion
              key={question.code}
              question={question}
              value={answers[storageKey]}
              onChange={(value) => handleAnswerChange(question.code, value)}
              onOtherTextChange={(text) => setOtherTexts((prev) => ({ ...prev, [question.code]: text }))}
              otherText={otherTexts[question.code]}
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

        <div className="flex gap-2">
          <Button variant="outline" onClick={handleSaveDraft} disabled={isSaving}>
            Simpan Draft
          </Button>

          {currentSectionIndex < activeSections.length - 1 ? (
            <Button onClick={handleNext}>
              Selanjutnya →
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={isSaving}>
              Selesai
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
