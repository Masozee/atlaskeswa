'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSurveyResponse, useVerifySurvey, useSubmitSurvey } from '@/hooks/use-survey-responses';
import { useCurrentUser } from '@/hooks/use-auth';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
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
} from 'hugeicons-react';

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
  const verifySurvey = useVerifySurvey(Number(id));
  const submitSurvey = useSubmitSurvey(Number(id));
  const { data: currentUser } = useCurrentUser();

  const [verifyDialogOpen, setVerifyDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [verifierNotes, setVerifierNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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

      <div className="flex flex-1 flex-col gap-4 p-8">
        {/* Header Section */}
        <div className="space-y-3">
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
                {getStatusBadge(survey.verification_status, survey.status_display)}
              </div>
              <p className="text-lg text-muted-foreground">
                {survey.service?.name || 'Layanan Tidak Diketahui'}
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
                    <div className="text-sm text-muted-foreground">{survey.service?.name || '-'}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium mb-1">Kota</div>
                    <div className="text-sm text-muted-foreground">{survey.service?.city || '-'}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Survey Answers */}
            <Card className="border">
              <CardHeader>
                <CardTitle>Jawaban Survei</CardTitle>
                <CardDescription>Tanggapan terhadap pertanyaan survei</CardDescription>
              </CardHeader>
              <CardContent>
                {answers.length > 0 ? (
                  <div className="space-y-4">
                    {answers.map((answer: any) => (
                      <div key={answer.id} className="border-b pb-4 last:border-b-0 last:pb-0">
                        <div className="text-sm font-medium mb-1">
                          {answer.question_code}: {answer.question_text}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {answer.text_value ||
                           answer.number_value ||
                           answer.boolean_value?.toString() ||
                           answer.geographic_unit_name ||
                           answer.selected_choice_values?.join(', ') ||
                           (answer.gps_latitude && answer.gps_longitude
                             ? `${answer.gps_latitude}, ${answer.gps_longitude}`
                             : null) ||
                           (answer.table_data ? JSON.stringify(answer.table_data) : null) ||
                           'Tidak ada jawaban'}
                        </div>
                      </div>
                    ))}
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
                  {getStatusBadge(survey.verification_status, survey.status_display)}
                </div>
                <div>
                  <div className="text-xs font-medium text-muted-foreground mb-1">Template</div>
                  <div className="text-sm font-medium">{survey.template?.name || '-'}</div>
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
                </div>
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
    </>
  );
}
