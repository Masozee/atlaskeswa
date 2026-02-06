'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DynamicQuestion } from './DynamicQuestion';
import type { SurveyTemplate, SurveyAnswers, QuestionSection, Question } from '@/lib/types/survey-template';
import { buildQuestionsMap, getActiveSections, getActiveQuestionsForSection, calculateProgress } from '@/lib/utils/question-logic';
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
  const [answers, setAnswers] = useState<SurveyAnswers>(initialAnswers);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  const createSurvey = useCreateSurveyResponse();
  const saveProgress = surveyResponseId ? useSaveProgress(surveyResponseId) : null;

  // Build questions map for conditional logic
  const questionsMap = useMemo(() => {
    if (!template.sections) return new Map();
    return buildQuestionsMap(template.sections);
  }, [template.sections]);

  // Get active sections based on current answers
  const activeSections = useMemo(() => {
    if (!template.sections) return [];
    return getActiveSections(template.sections, answers, questionsMap);
  }, [template.sections, answers, questionsMap]);

  // Get current section
  const currentSection = activeSections[currentSectionIndex];

  // Get active questions for current section
  const activeQuestions = useMemo(() => {
    if (!currentSection) return [];
    return getActiveQuestionsForSection(currentSection, answers, questionsMap);
  }, [currentSection, answers, questionsMap]);

  // Calculate progress
  const progress = useMemo(() => {
    if (!template.sections) return 0;
    return calculateProgress(template.sections, answers, questionsMap);
  }, [template.sections, answers, questionsMap]);

  // Build text for speech synthesis (current section content)
  const speechText = useMemo(() => {
    if (!currentSection) return '';

    const sectionName = currentSection.name || currentSection.title || 'Bagian Survei';
    const sectionDesc = currentSection.description || '';

    let text = `Bagian ${currentSectionIndex + 1}: ${sectionName}.`;
    if (sectionDesc) {
      text += ` ${sectionDesc}.`;
    }

    // Add questions
    activeQuestions.forEach((question, index) => {
      const questionText = question.question_text || question.text || '';
      const helpText = question.help_text || '';

      text += ` Pertanyaan ${index + 1}: ${questionText}`;
      if (helpText) {
        text += ` ${helpText}`;
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

  // Handle answer change
  const handleAnswerChange = (questionCode: string, value: any) => {
    setAnswers((prev) => ({
      ...prev,
      [questionCode]: value,
    }));

    // Clear error for this question
    if (errors[questionCode]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[questionCode];
        return newErrors;
      });
    }
  };

  // Validate current section
  const validateSection = (): boolean => {
    const newErrors: Record<string, string> = {};

    activeQuestions.forEach((question) => {
      const questionType = question.answer_type || question.question_type;
      const answer = answers[question.code];

      if (question.is_required) {
        if (answer === null || answer === undefined || answer === '' || (Array.isArray(answer) && answer.length === 0)) {
          newErrors[question.code] = 'Pertanyaan ini wajib diisi';
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
          newErrors[question.code] = 'Koordinat harus diisi. Klik tombol "Dapatkan Lokasi" untuk mengisi koordinat.';
        }
        if (!locationData.kecamatan) {
          newErrors[question.code] = 'Kecamatan harus dipilih';
        }
        if (!locationData.desa) {
          newErrors[question.code] = 'Desa/Kelurahan harus diisi';
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
          answers,
        });

        toast.success('Survey berhasil disimpan sebagai draft');

        // Redirect to edit mode
        router.push(`/dashboard/survey/responses/${result.id}/edit`);
      } else if (saveProgress) {
        await saveProgress.mutateAsync({ answers });
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
    const allValid = activeSections.every((section, index) => {
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
        answers,
      });

        toast.success('Survey berhasil disimpan dan siap untuk disubmit');

      if (onSuccess) {
        onSuccess();
      } else {
        router.push('/dashboard/survey/responses');
      }
    } catch (error: any) {
      toast.error(error.message || 'Gagal menyimpan survey');
    } finally {
      setIsSaving(false);
    }
  };

  if (!currentSection) {
    return (
      <Alert>
        <AlertDescription>Tidak ada bagian aktif untuk ditampilkan</AlertDescription>
      </Alert>
    );
  }

  // Use backend field names with fallback to aliases
  const sectionTitle = currentSection.name || currentSection.title || 'Bagian Survei';
  const sectionDescription = currentSection.description;

  return (
    <div className="flex flex-1 flex-col gap-6">
      {/* Progress bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-sm text-muted-foreground">
                Bagian {currentSectionIndex + 1} dari {activeSections.length}
              </p>
            </div>
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

      {/* Questions */}
      <div className="space-y-8">
        {activeQuestions.map((question) => (
          <DynamicQuestion
            key={question.code}
            question={question}
            value={answers[question.code]}
            onChange={(value) => handleAnswerChange(question.code, value)}
            error={errors[question.code]}
          />
        ))}
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
