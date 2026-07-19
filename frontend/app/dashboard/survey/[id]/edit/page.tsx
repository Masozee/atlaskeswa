'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSurveyResponse, useUpdateSurveyResponse } from '@/hooks/use-survey-responses';
import { useSurveyTemplate } from '@/hooks/use-survey-templates';
import { DynamicSurveyForm } from '@/components/survey/DynamicSurveyForm';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { responsesToAnswers, type StoredAnswer } from '@/lib/survey-answers';
import type { SurveyAnswers, SurveyTemplate } from '@/lib/types/survey-template';

function idOf(v: number | { id?: number } | undefined | null): number | undefined {
  if (typeof v === 'number') return v;
  return v?.id;
}

export default function EditSurveyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const responseId = Number(id);
  const router = useRouter();

  const { data: response, isLoading, error } = useSurveyResponse(responseId);
  const templateId = idOf(response?.template);
  const { data: template, isLoading: templateLoading } = useSurveyTemplate(templateId);
  const updateResponse = useUpdateSurveyResponse(responseId);

  const breadcrumbs = [
    { label: 'Dasbor', href: '/dashboard' },
    { label: 'Survei', href: '/dashboard/survey' },
    { label: `Edit #${id}` },
  ];

  if (isLoading || templateLoading) {
    return (
      <>
        <PageHeader breadcrumbs={breadcrumbs} />
        <div className="flex flex-1 items-center justify-center py-24">
          <div className="text-center">
            <div className="h-14 w-14 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">Memuat survei...</p>
          </div>
        </div>
      </>
    );
  }

  if (error || !response || !template) {
    return (
      <>
        <PageHeader breadcrumbs={breadcrumbs} />
        <div className="flex flex-1 flex-col items-center justify-center gap-4 py-24 text-center">
          <p className="text-sm text-muted-foreground">Survei tidak ditemukan atau gagal dimuat.</p>
          <Button asChild variant="outline">
            <Link href="/dashboard/survey">Kembali ke Daftar Survei</Link>
          </Button>
        </div>
      </>
    );
  }

  // Only DRAFT / REJECTED responses are editable (backend enforces this too).
  const status = response.verification_status;
  const editable = status === 'DRAFT' || status === 'REJECTED';
  if (!editable) {
    return (
      <>
        <PageHeader breadcrumbs={breadcrumbs} />
        <div className="flex flex-1 flex-col items-center justify-center gap-4 py-24 text-center">
          <p className="max-w-md text-sm text-muted-foreground">
            Survei ini sudah diajukan atau terverifikasi, sehingga tidak dapat diubah.
          </p>
          <Button asChild variant="outline">
            <Link href={`/dashboard/survey/${id}`}>Lihat Detail</Link>
          </Button>
        </div>
      </>
    );
  }

  const initialAnswers: SurveyAnswers = responsesToAnswers(
    (response.answers as unknown as StoredAnswer[]) ?? [],
  );
  const serviceId = idOf(response.service) ?? 0;

  const handleSubmit = async (answers: SurveyAnswers) => {
    await updateResponse.mutateAsync({
      survey_date: response.survey_date,
      survey_period_start: response.survey_period_start,
      survey_period_end: response.survey_period_end,
      surveyor_notes: response.surveyor_notes,
      answers,
    });
  };

  return (
    <>
      <PageHeader breadcrumbs={breadcrumbs} />
      <div className="flex flex-1 flex-col gap-4 px-6 py-6">
        <div>
          <h1 className="text-xl font-bold">Edit Survei #{id}</h1>
          <p className="text-sm text-muted-foreground">
            {response.service_name ?? 'Fasilitas'} · {response.status_display ?? status}
          </p>
        </div>
        <DynamicSurveyForm
          template={template as SurveyTemplate}
          serviceId={serviceId}
          surveyDate={response.survey_date}
          surveyPeriodStart={response.survey_period_start}
          surveyPeriodEnd={response.survey_period_end}
          initialAnswers={initialAnswers}
          onSubmitAnswers={handleSubmit}
          submitLabel="Simpan Perubahan"
          onSuccess={() => router.push(`/dashboard/survey/${id}`)}
          onBack={() => router.push(`/dashboard/survey/${id}`)}
        />
      </div>
    </>
  );
}
