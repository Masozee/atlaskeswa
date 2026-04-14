'use client';

import { use, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useSurveyResponse, useVerifySurvey, useSubmitSurvey } from '@/hooks/use-survey-responses';
import { useSurveyTemplate } from '@/hooks/use-survey-templates';
import { useSurveyPhotos, useUploadSurveyPhoto, useDeleteSurveyPhoto } from '@/hooks/use-survey-photos';
import { useCurrentUser } from '@/hooks/use-auth';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  ArrowLeft01Icon,
  CheckmarkCircle02Icon,
  Cancel01Icon,
  SentIcon,
  Image03Icon,
  Upload06Icon,
  Delete01Icon,
} from 'hugeicons-react';
import { Separator } from '@/components/ui/separator';

const getStatusBadge = (status: string, statusDisplay?: string) => {
  const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    DRAFT: 'outline',
    SUBMITTED: 'secondary',
    VERIFIED: 'default',
    REJECTED: 'destructive',
  };

  return (
    <Badge variant={variants[status] || 'outline'}>
      {statusDisplay || status}
    </Badge>
  );
};

export default function SurveyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { data: survey, isLoading, refetch } = useSurveyResponse(Number(id));
  const templateId = survey
    ? (typeof survey.template === 'object' ? (survey.template as any)?.id : survey.template)
    : undefined;
  const { data: template, isLoading: isTemplateLoading } = useSurveyTemplate(templateId);
  const verifySurvey = useVerifySurvey(Number(id));
  const submitSurvey = useSubmitSurvey(Number(id));
  const { data: currentUser } = useCurrentUser();

  const [verifyDialogOpen, setVerifyDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [verifierNotes, setVerifierNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Photo upload state
  const [photoDialogOpen, setPhotoDialogOpen] = useState(false);
  const [photoCaption, setPhotoCaption] = useState('');
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const surveyId = Number(id);

  // Photo hooks
  const { data: photosData, refetch: refetchPhotos } = useSurveyPhotos(surveyId);
  const uploadPhoto = useUploadSurveyPhoto();
  const deletePhoto = useDeleteSurveyPhoto();
  const photos = photosData?.results || [];

  const handleVerify = async () => {
    setIsSubmitting(true);
    try {
      await verifySurvey.mutateAsync({
        action: 'verify',
        notes: verifierNotes,
      });
      setVerifyDialogOpen(false);
      setVerifierNotes('');
      await refetch();
    } catch (error) {
      console.error('Failed to verify survey:', error);
      alert('Gagal memverifikasi survei. Silakan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      alert('Mohon berikan alasan penolakan');
      return;
    }

    setIsSubmitting(true);
    try {
      await verifySurvey.mutateAsync({
        action: 'reject',
        rejection_reason: rejectionReason,
      });
      setRejectDialogOpen(false);
      setRejectionReason('');
      await refetch();
    } catch (error) {
      console.error('Failed to reject survey:', error);
      alert('Gagal menolak survei. Silakan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await submitSurvey.mutateAsync();
      setSubmitDialogOpen(false);
      await refetch();
    } catch (error) {
      console.error('Failed to submit survey:', error);
      alert('Gagal mengajukan survei. Silakan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedPhoto(file);
    }
  };

  const handlePhotoUpload = async () => {
    if (!selectedPhoto) return;
    try {
      await uploadPhoto.mutateAsync({
        surveyId,
        file: selectedPhoto,
        caption: photoCaption,
      });
      setPhotoDialogOpen(false);
      setSelectedPhoto(null);
      setPhotoCaption('');
      await refetchPhotos();
    } catch (error) {
      console.error('Failed to upload photo:', error);
      alert('Gagal mengunggah foto. Silakan coba lagi.');
    }
  };

  const handleDeletePhoto = async (photoId: number) => {
    if (!confirm('Hapus foto ini?')) return;
    try {
      await deletePhoto.mutateAsync({ photoId, surveyId });
      await refetchPhotos();
    } catch (error) {
      console.error('Failed to delete photo:', error);
      alert('Gagal menghapus foto. Silakan coba lagi.');
    }
  };

  const loadingBreadcrumbs = [
    { label: 'Dasbor', href: '/dashboard' },
    { label: 'Survei', href: '/dashboard/survey' },
    { label: 'Memuat...' },
  ];

  if (isLoading) {
    return (
      <>
        <PageHeader breadcrumbs={loadingBreadcrumbs} />
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <div className="h-16 w-16 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
            <p className="text-sm text-muted-foreground">Memuat detail survei...</p>
          </div>
        </div>
      </>
    );
  }

  const notFoundBreadcrumbs = [
    { label: 'Dasbor', href: '/dashboard' },
    { label: 'Survei', href: '/dashboard/survey' },
    { label: 'Tidak Ditemukan' },
  ];

  if (!survey) {
    return (
      <>
        <PageHeader breadcrumbs={notFoundBreadcrumbs} />
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <p className="text-lg font-semibold mb-2">Survei tidak ditemukan</p>
            <p className="text-sm text-muted-foreground mb-4">Survei yang Anda cari tidak ada.</p>
            <Button onClick={() => router.push('/dashboard/survey')}>
              <ArrowLeft01Icon className="mr-2 h-4 w-4" />
              Kembali ke Survei
            </Button>
          </div>
        </div>
      </>
    );
  }

  const surveyDate = new Date(survey.survey_date);
  const isDraft = survey.verification_status === 'DRAFT';
  const isSubmitted = survey.verification_status === 'SUBMITTED';
  const isVerified = survey.verification_status === 'VERIFIED';
  const isRejected = survey.verification_status === 'REJECTED';
  // Strict separation of duties: cannot verify your own submission
  const canVerify = isSubmitted &&
    (currentUser?.role === 'VERIFIER' || currentUser?.role === 'ADMIN') &&
    survey.surveyor !== currentUser?.id;
  const canSubmit = isDraft && (
    survey.surveyor === currentUser?.id ||
    currentUser?.role === 'ADMIN'
  );

  const breadcrumbs = [
    { label: 'Dasbor', href: '/dashboard' },
    { label: 'Survei', href: '/dashboard/survey' },
    { label: `Survei #${survey.id}` },
  ];

  // Group answers by section if available
  const answers = survey.answers || [];

  return (
    <>
      <PageHeader breadcrumbs={breadcrumbs} />

      <div className="flex flex-1 flex-col gap-4">
        <div className="px-8 pt-8 space-y-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/dashboard/survey')}
            className="w-fit"
          >
            <ArrowLeft01Icon className="mr-2 h-4 w-4" />
            Kembali ke Survei
          </Button>
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold">Survei #{survey.id}</h1>
                {getStatusBadge(survey.verification_status || 'DRAFT', survey.status_display)}
              </div>
              <p className="text-lg text-muted-foreground">
                {(typeof survey.service === 'object' ? survey.service?.name : survey.service_name) || 'Layanan Tidak Diketahui'}
              </p>
            </div>

            {/* Action Buttons */}
            {canSubmit && (
              <Button
                className="gap-2"
                onClick={() => setSubmitDialogOpen(true)}
              >
                <SentIcon className="h-4 w-4" />
                Ajukan Verifikasi
              </Button>
            )}

            {canVerify && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => setRejectDialogOpen(true)}
                >
                  <Cancel01Icon className="h-4 w-4" />
                  Tolak
                </Button>
                <Button
                  className="gap-2"
                  onClick={() => setVerifyDialogOpen(true)}
                >
                  <CheckmarkCircle02Icon className="h-4 w-4" />
                  Verifikasi
                </Button>
              </div>
            )}

            {(isVerified || isRejected) && (
              <div className="text-sm text-muted-foreground">
                {isVerified && '✓ Survei telah diverifikasi'}
                {isRejected && '✗ Survei telah ditolak'}
              </div>
            )}
          </div>
        </div>

        <Separator />

        <div className="flex flex-col gap-4 px-8 pb-8">
        {/* 2 Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Main Content - 3/4 */}
          <div className="lg:col-span-3 space-y-4">
            {/* Service Information */}
            <Card className="border">
              <CardHeader>
                <CardTitle>Informasi Layanan</CardTitle>
                <CardDescription>Fasilitas yang disurvei</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm font-medium mb-1">Nama Layanan</div>
                    <div className="text-sm text-muted-foreground">{(typeof survey.service === 'object' ? survey.service?.name : survey.service_name) || '-'}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium mb-1">Kota</div>
                    <div className="text-sm text-muted-foreground">{(typeof survey.service === 'object' ? survey.service?.city : survey.service_city) || '-'}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Photos Section */}
            <Card className="border">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Foto Fasilitas</CardTitle>
                    <CardDescription>Foto bangunan dan fasilitas</CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPhotoDialogOpen(true)}
                    className="gap-2"
                  >
                    <Upload06Icon className="h-4 w-4" />
                    Tambah Foto
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {photos.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {photos.map((photo) => (
                      <div key={photo.id} className="relative group">
                        <div className="relative h-40 w-full rounded-lg overflow-hidden bg-gray-100">
                          {photo.image_url ? (
                            <Image
                              src={photo.image_url}
                              alt={photo.caption || 'Foto fasilitas'}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full">
                              <Image03Icon className="h-8 w-8 text-gray-400" />
                            </div>
                          )}
                        </div>
                        {photo.caption && (
                          <p className="text-xs text-muted-foreground mt-1 truncate">{photo.caption}</p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {photo.uploaded_by_name || 'Unknown'} - {new Date(photo.uploaded_at).toLocaleDateString('id-ID')}
                        </p>
                        <button
                          onClick={() => handleDeletePhoto(photo.id)}
                          className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Delete01Icon className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Image03Icon className="h-12 w-12 text-gray-300 mb-3" />
                    <p className="text-sm text-muted-foreground">Belum ada foto fasilitas</p>
                    <p className="text-xs text-muted-foreground mt-1">Tambahkan foto bangunan dan fasilitas</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Survey Answers */}
            <Card className="border">
              <CardHeader>
                <CardTitle>Jawaban Survei</CardTitle>
                <CardDescription>Tanggapan terhadap pertanyaan survei</CardDescription>
              </CardHeader>
              <CardContent>
                {isTemplateLoading && answers.length > 0 ? (
                  <p className="text-sm text-muted-foreground">Memuat detail jawaban...</p>
                ) : answers.length > 0 ? (
                  <div className="space-y-4">
                    {(() => {
                      // Build cabang_mtc → trigger question code map from template
                      const cabangMtcToTrigger = new Map<string, string>();
                      (template?.sections || []).forEach((section: any) => {
                        (section.questions || []).forEach((q: any) => {
                          (q.choices || []).forEach((c: any) => {
                            if (c.cabang_mtc && c.next_question_code) {
                              cabangMtcToTrigger.set(c.cabang_mtc, q.code);
                            }
                          });
                        });
                      });

                      const formatValue = (answer: any): string =>
                        answer.text_value ||
                        (answer.number_value !== null && answer.number_value !== undefined ? String(answer.number_value) : null) ||
                        (answer.boolean_value !== null && answer.boolean_value !== undefined ? (answer.boolean_value ? 'Ya' : 'Tidak') : null) ||
                        answer.geographic_unit_name ||
                        (answer.selected_choice_labels?.length > 0 ? answer.selected_choice_labels.join(', ') : null) ||
                        (answer.gps_latitude && answer.gps_longitude ? `${answer.gps_latitude}, ${answer.gps_longitude}` : null) ||
                        (answer.table_data ? JSON.stringify(answer.table_data) : null) ||
                        'Tidak ada jawaban';

                      const nonDetail = answers.filter((a: any) => !/[A-Z]$/.test(a.question_code));
                      const detailAnswers = answers.filter((a: any) => /[A-Z]$/.test(a.question_code));

                      // Group detail answers: triggerCode → ctx → items
                      const detailByTrigger = new Map<string, Map<string, any[]>>();
                      for (const ans of detailAnswers) {
                        const ctx: string = ans.context_key || '';
                        const code: string = ans.question_code || '';
                        const triggerCode = cabangMtcToTrigger.get(ctx) || code.slice(0, -1);
                        if (!detailByTrigger.has(triggerCode)) detailByTrigger.set(triggerCode, new Map());
                        const ctxMap = detailByTrigger.get(triggerCode)!;
                        if (!ctxMap.has(ctx)) ctxMap.set(ctx, []);
                        ctxMap.get(ctx)!.push(ans);
                      }

                      const items: React.ReactNode[] = [];
                      nonDetail.forEach((answer: any, index: number) => {
                        if (index > 0) items.push(<Separator key={`sep-${index}`} />);
                        items.push(
                          <div key={answer.id} className="py-1">
                            <div className="text-xs font-bold text-primary mb-0.5">{answer.question_code}</div>
                            <div className="text-sm font-medium mb-1">{answer.question_text}</div>
                            <div className="text-sm text-muted-foreground">{formatValue(answer)}</div>
                          </div>
                        );

                        const triggered = detailByTrigger.get(answer.question_code);
                        if (triggered) {
                          triggered.forEach((items2, ctx) => {
                            items.push(
                              <div key={`hdr-${answer.question_code}-${ctx}`} className="flex items-stretch gap-2.5 mt-3 mb-1">
                                <div className="w-0.5 rounded-full bg-primary self-stretch" />
                                <div>
                                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                                    Detail untuk <strong>{answer.question_code}</strong>
                                  </p>
                                  {ctx && <p className="text-sm font-semibold text-primary">{ctx}</p>}
                                </div>
                              </div>
                            );
                            items2.forEach((dAns: any, di: number) => {
                              if (di > 0) items.push(<Separator key={`dsep-${ctx}-${di}`} className="ml-4" />);
                              items.push(
                                <div key={`${dAns.id}-${ctx}`} className="pl-4 border-l-2 border-primary/20 py-1">
                                  <div className="text-xs font-bold text-primary mb-0.5">{dAns.question_code}</div>
                                  <div className="text-sm font-medium mb-1">{dAns.question_text}</div>
                                  <div className="text-sm text-muted-foreground">{formatValue(dAns)}</div>
                                </div>
                              );
                            });
                          });
                        }
                      });
                      return items;
                    })()}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Belum ada jawaban yang tercatat.</p>
                )}
              </CardContent>
            </Card>

            {/* Notes */}
            {(survey.surveyor_notes || survey.verifier_notes || survey.rejection_reason) && (
              <div className="grid gap-4 md:grid-cols-2">
                {survey.surveyor_notes && (
                  <Card className="border">
                    <CardHeader>
                      <CardTitle className="text-base">Catatan Surveyor</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">{survey.surveyor_notes}</p>
                    </CardContent>
                  </Card>
                )}
                {survey.rejection_reason && (
                  <Card className="border border-destructive">
                    <CardHeader>
                      <CardTitle className="text-base text-destructive">Alasan Penolakan</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">{survey.rejection_reason}</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>

          {/* Sticky Sidebar - 1/4 */}
          <div className="lg:col-span-1">
            <div className="sticky top-4 space-y-4">
              {/* Survey Metadata */}
              <div className="border rounded-lg p-4 space-y-3">
                <h3 className="text-sm font-semibold">Metadata Survei</h3>
                <div>
                  <div className="text-xs font-medium text-muted-foreground mb-1">Status</div>
                  {getStatusBadge(survey.verification_status || 'DRAFT', survey.status_display)}
                </div>
                <div>
                  <div className="text-xs font-medium text-muted-foreground mb-1">Template</div>
                  <div className="text-sm font-medium">{(typeof survey.template === 'object' ? survey.template?.name : survey.template_name) || '-'}</div>
                </div>
                <div>
                  <div className="text-xs font-medium text-muted-foreground mb-1">Surveyor</div>
                  <div className="text-sm font-medium">{survey.surveyor_name || '-'}</div>
                </div>
                <div>
                  <div className="text-xs font-medium text-muted-foreground mb-1">Tanggal Survei</div>
                  <div className="text-sm font-medium">
                    {surveyDate.toLocaleDateString('id-ID', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </div>
                  {(() => {
                        const dateVal = survey.submitted_at || survey.created_at;
                        return dateVal ? (
                          <div className="text-xs text-muted-foreground mt-0.5">
                            Pukul {new Date(dateVal).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        ) : null;
                      })()}
                </div>
                {(survey.latitude || survey.longitude) ? (
                  <div>
                    <div className="text-xs font-medium text-muted-foreground mb-1">Lokasi GPS</div>
                    <div className="text-sm font-medium font-mono">
                      {typeof survey.latitude === 'number' ? survey.latitude.toFixed(6) : survey.latitude}, {typeof survey.longitude === 'number' ? survey.longitude.toFixed(6) : survey.longitude}
                    </div>
                    {survey.location_accuracy && (
                      <div className="text-xs text-muted-foreground">
                        Akurasi: ±{Math.round(survey.location_accuracy)}m
                      </div>
                    )}
                  </div>
                ) : null}
                {survey.verifier_name && (
                  <div>
                    <div className="text-xs font-medium text-muted-foreground mb-1">Verifikator Ditugaskan</div>
                    <div className="text-sm font-medium">{survey.verifier_name}</div>
                  </div>
                )}
                {survey.verified_by_name && (
                  <div>
                    <div className="text-xs font-medium text-muted-foreground mb-1">Diverifikasi Oleh</div>
                    <div className="text-sm font-medium">{survey.verified_by_name}</div>
                  </div>
                )}
              </div>

              {/* Verifier Notes */}
              {survey.verifier_notes && (
                <div className="border rounded-lg p-4 space-y-2">
                  <h3 className="text-sm font-semibold">Catatan Verifikator</h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{survey.verifier_notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
        </div>
      </div>

      {/* Verify Dialog */}
      <Dialog open={verifyDialogOpen} onOpenChange={setVerifyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Verifikasi Survei</DialogTitle>
            <DialogDescription>
              Konfirmasi bahwa Anda ingin memverifikasi survei ini. Anda dapat menambahkan catatan opsional di bawah.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="verifier-notes">Catatan Verifikator (Opsional)</Label>
              <Textarea
                id="verifier-notes"
                placeholder="Tambahkan catatan tentang verifikasi..."
                value={verifierNotes}
                onChange={(e) => setVerifierNotes(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setVerifyDialogOpen(false)}
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button
              onClick={handleVerify}
              disabled={isSubmitting}
              className="gap-2"
            >
              {isSubmitting ? (
                <>Memproses...</>
              ) : (
                <>
                  <CheckmarkCircle02Icon className="h-4 w-4" />
                  Verifikasi Survei
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tolak Survei</DialogTitle>
            <DialogDescription>
              Berikan alasan penolakan survei ini. Alasan akan dibagikan kepada surveyor.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="rejection-reason">Alasan Penolakan *</Label>
              <Textarea
                id="rejection-reason"
                placeholder="Jelaskan mengapa survei ini ditolak..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRejectDialogOpen(false)}
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={isSubmitting || !rejectionReason.trim()}
              className="gap-2"
            >
              {isSubmitting ? (
                <>Memproses...</>
              ) : (
                <>
                  <Cancel01Icon className="h-4 w-4" />
                  Tolak Survei
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Submit Dialog */}
      <Dialog open={submitDialogOpen} onOpenChange={setSubmitDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajukan Survei untuk Verifikasi</DialogTitle>
            <DialogDescription>
              Survei akan diajukan untuk verifikasi. Setelah diajukan, Anda tidak dapat mengeditnya sampai verifikator meninjaunya.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSubmitDialogOpen(false)}
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="gap-2"
            >
              {isSubmitting ? (
                <>Memproses...</>
              ) : (
                <>
                  <SentIcon className="h-4 w-4" />
                  Ajukan Survei
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Photo Upload Dialog */}
      <Dialog open={photoDialogOpen} onOpenChange={setPhotoDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah Foto Fasilitas</DialogTitle>
            <DialogDescription>
              Unggah foto bangunan dan fasilitas survei
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="photo-file">Pilih Foto</Label>
              <input
                ref={fileInputRef}
                id="photo-file"
                type="file"
                accept="image/*"
                onChange={handlePhotoSelect}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="photo-caption">Keterangan (opsional)</Label>
              <Input
                id="photo-caption"
                placeholder="Contoh: Tampak depan gedung..."
                value={photoCaption}
                onChange={(e) => setPhotoCaption(e.target.value)}
              />
            </div>
            {selectedPhoto && (
              <div className="relative mt-4">
                <p className="text-sm text-muted-foreground mb-2">Preview:</p>
                <div className="relative h-48 w-full rounded-lg overflow-hidden bg-gray-100">
                  <Image
                    src={URL.createObjectURL(selectedPhoto)}
                    alt="Preview"
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setPhotoDialogOpen(false);
                setSelectedPhoto(null);
                setPhotoCaption('');
              }}
              disabled={uploadPhoto.isPending}
            >
              Batal
            </Button>
            <Button
              onClick={handlePhotoUpload}
              disabled={!selectedPhoto || uploadPhoto.isPending}
              className="gap-2"
            >
              {uploadPhoto.isPending ? (
                <>Mengunggah...</>
              ) : (
                <>
                  <Upload06Icon className="h-4 w-4" />
                  Unggah
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
