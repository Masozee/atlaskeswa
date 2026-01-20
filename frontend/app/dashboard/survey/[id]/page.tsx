'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSurvey, useVerifySurvey } from '@/hooks/use-surveys';
import { PageHeader } from '@/components/page-header';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Map, MapControls, MapMarker, MarkerContent, MarkerPopup } from '@/components/ui/map';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { HugeiconsIcon } from "@hugeicons/react"
import {Hospital01Icon,
  UserIcon,
  Calendar03Icon,
  BedIcon,
  UserMultiple02Icon,
  Location01Icon,
  SmartPhone01Icon,
  Mail01Icon,
  Globe02Icon,
  ArrowLeft01Icon,
  CheckmarkCircle02Icon,
  Cancel01Icon,
  ClipboardIcon,
  ChartIcon,
  MoneyBag01Icon,
  Note01Icon,} from "@hugeicons/core-free-icons";

const getStatusBadge = (status: string) => {
  const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    DRAFT: 'secondary',
    SUBMITTED: 'default',
    VERIFIED: 'outline',
    REJECTED: 'destructive',
  };
  const icons = {
    DRAFT: ClipboardIcon,
    SUBMITTED: Note01Icon,
    VERIFIED: CheckmarkCircle02Icon,
    REJECTED: Cancel01Icon,
  };
  const icon = icons[status as keyof typeof icons] || ClipboardIcon;

  return (
    <Badge variant={variants[status] || 'default'} className="gap-1.5">
      <HugeiconsIcon icon={icon} size={14} />
      {status}
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
  const { data: survey, isLoading, refetch } = useSurvey(Number(id));
  const verifySurvey = useVerifySurvey(Number(id));

  const [verifyDialogOpen, setVerifyDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
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
      alert('Failed to verify survey. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      alert('Please provide a rejection reason');
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
      alert('Failed to reject survey. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const loadingBreadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Surveys', href: '/dashboard/survey' },
    { label: 'Loading...' },
  ];

  if (isLoading) {
    return (
      <>
        <PageHeader breadcrumbs={loadingBreadcrumbs} />
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <div className="h-16 w-16 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
            <p className="text-sm text-muted-foreground">Loading survey details...</p>
          </div>
        </div>
      </>
    );
  }

  const notFoundBreadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Surveys', href: '/dashboard/survey' },
    { label: 'Not Found' },
  ];

  if (!survey) {
    return (
      <>
        <PageHeader breadcrumbs={notFoundBreadcrumbs} />
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <p className="text-lg font-semibold mb-2">Survey not found</p>
            <p className="text-sm text-muted-foreground mb-4">The survey you're looking for doesn't exist.</p>
            <Button onClick={() => router.push('/dashboard/survey')}>
              <HugeiconsIcon icon={ArrowLeft01Icon} size={16} className="mr-2" />
              Back to Surveys
            </Button>
          </div>
        </div>
      </>
    );
  }

  const surveyDate = new Date(survey.survey_date);
  const isSubmitted = survey.verification_status === 'SUBMITTED';
  const isVerified = survey.verification_status === 'VERIFIED';
  const isRejected = survey.verification_status === 'REJECTED';
  const canVerify = isSubmitted; // Only submitted surveys can be verified/rejected

  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Surveys', href: '/dashboard/survey' },
    { label: `Survey #${survey.id}` },
  ];

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
            <HugeiconsIcon icon={ArrowLeft01Icon} size={16} className="mr-2" />
            Back to Surveys
          </Button>
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold">Survey #{survey.id}</h1>
                {getStatusBadge(survey.verification_status)}
              </div>
              <p className="text-lg text-muted-foreground">{survey.service.name}</p>
            </div>

            {/* Action Buttons */}
            {canVerify && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => setRejectDialogOpen(true)}
                >
                  <HugeiconsIcon icon={Cancel01Icon} size={16} />
                  Reject
                </Button>
                <Button
                  className="gap-2"
                  onClick={() => setVerifyDialogOpen(true)}
                >
                  <HugeiconsIcon icon={CheckmarkCircle02Icon} size={16} />
                  Verify
                </Button>
              </div>
            )}

            {(isVerified || isRejected) && (
              <div className="text-sm text-muted-foreground">
                {isVerified && '✓ Survey has been verified'}
                {isRejected && '✗ Survey has been rejected'}
              </div>
            )}
          </div>
        </div>

        {/* 2 Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Main Content - 3/4 */}
          <div className="lg:col-span-3 space-y-4">
            {/* Service Information */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <HugeiconsIcon icon={Hospital01Icon} size={20} className="text-primary" />
                  <CardTitle>Service Information</CardTitle>
                </div>
                <CardDescription>Mental health facility details</CardDescription>
              </CardHeader>
              <Separator />
              <CardContent className="space-y-4">
                <div>
                  <div className="text-sm font-medium mb-1">Service Name</div>
                  <div className="text-sm text-muted-foreground">{survey.service.name}</div>
                </div>
                <Separator />
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm font-medium mb-1">MTC Code</div>
                    <Badge variant="outline">{survey.service.mtc_code || 'N/A'}</Badge>
                  </div>
                  <div>
                    <div className="text-sm font-medium mb-1">BSIC Code</div>
                    <Badge variant="outline">{survey.service.bsic_code || 'N/A'}</Badge>
                  </div>
                </div>
                <Separator />
                <div>
                  <div className="text-sm font-medium mb-1 flex items-center gap-2">
                    <HugeiconsIcon icon={Location01Icon} size={16} />
                    Address
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {survey.service.address || 'N/A'}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {survey.service.city}, {survey.service.province} {survey.service.postal_code}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Location Map */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <HugeiconsIcon icon={Location01Icon} size={20} className="text-primary" />
                  <CardTitle>Location</CardTitle>
                </div>
                <CardDescription>Survey location from mobile device</CardDescription>
              </CardHeader>
              <Separator />
              <CardContent className="p-0">
                {survey.latitude && survey.longitude ? (
                  <>
                    <div className="w-full h-[400px] rounded-b-lg overflow-hidden">
                      <Map center={[parseFloat(survey.longitude), parseFloat(survey.latitude)]} zoom={15}>
                        <MapControls position="bottom-right" showZoom showCompass />
                        <MapMarker longitude={parseFloat(survey.longitude)} latitude={parseFloat(survey.latitude)}>
                          <MarkerContent>
                            <div className="relative">
                              <HugeiconsIcon icon={Location01Icon} size={32} className="text-primary drop-shadow-lg" />
                              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-primary" />
                            </div>
                          </MarkerContent>
                          <MarkerPopup>
                            <div className="space-y-1 min-w-[200px]">
                              <p className="font-semibold text-sm">Survey Location</p>
                              <p className="text-xs text-muted-foreground">
                                Captured from mobile device
                              </p>
                              <div className="pt-1 space-y-1">
                                <p className="text-xs">
                                  <span className="font-medium">Coordinates:</span> {Number(survey.latitude).toFixed(6)}, {Number(survey.longitude).toFixed(6)}
                                </p>
                                {survey.location_accuracy && (
                                  <p className="text-xs">
                                    <span className="font-medium">Accuracy:</span> ±{survey.location_accuracy}m
                                  </p>
                                )}
                              </div>
                            </div>
                          </MarkerPopup>
                        </MapMarker>
                      </Map>
                    </div>
                    <div className="p-4 bg-background border-t">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <HugeiconsIcon icon={Location01Icon} size={16} />
                        <span>Coordinates: {survey.latitude}, {survey.longitude}</span>
                        {survey.location_accuracy && (
                          <span className="ml-auto">Accuracy: ±{survey.location_accuracy}m</span>
                        )}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="w-full h-[400px] bg-muted rounded-b-lg flex items-center justify-center">
                    <div className="text-center">
                      <HugeiconsIcon icon={Location01Icon} size={48} className="text-muted-foreground mx-auto mb-3" />
                      <p className="text-sm font-medium text-muted-foreground">Location coordinates not available</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Location will be captured from mobile device during survey
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Capacity & Staff */}
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <HugeiconsIcon icon={BedIcon} size={20} className="text-primary" />
                    <CardTitle>Bed Capacity</CardTitle>
                  </div>
                  <CardDescription>Current bed utilization data</CardDescription>
                </CardHeader>
                <Separator />
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <div className="text-sm font-medium mb-1">Total Beds</div>
                      <div className="text-2xl font-bold">{survey.current_bed_capacity || 0}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium mb-1">Occupied</div>
                      <div className="text-2xl font-bold">{survey.beds_occupied || 0}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium mb-1">Occupancy</div>
                      <div className="text-2xl font-bold text-primary">
                        {survey.occupancy_rate ? `${Number(survey.occupancy_rate).toFixed(2)}%` : 'N/A'}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <HugeiconsIcon icon={UserMultiple02Icon} size={20} className="text-primary" />
                    <CardTitle>Staff Count</CardTitle>
                  </div>
                  <CardDescription>Current healthcare professionals</CardDescription>
                </CardHeader>
                <Separator />
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground">Psychiatrists</div>
                      <div className="text-xl font-bold">{survey.current_psychiatrist_count || 0}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Psychologists</div>
                      <div className="text-xl font-bold">{survey.current_psychologist_count || 0}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Nurses</div>
                      <div className="text-xl font-bold">{survey.current_nurse_count || 0}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Social Workers</div>
                      <div className="text-xl font-bold">{survey.current_social_worker_count || 0}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Patient Demographics */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <HugeiconsIcon icon={ChartIcon} size={20} className="text-primary" />
                  <CardTitle>Patient Demographics</CardTitle>
                </div>
                <CardDescription>Patient statistics and breakdown</CardDescription>
              </CardHeader>
              <Separator />
              <CardContent className="space-y-4">
                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <div className="text-sm font-medium mb-1">Total Patients</div>
                    <div className="text-2xl font-bold">{survey.total_patients_served?.toLocaleString() || 0}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium mb-1">New Patients</div>
                    <div className="text-2xl font-bold text-green-600">{survey.new_patients?.toLocaleString() || 0}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium mb-1">Returning</div>
                    <div className="text-2xl font-bold text-blue-600">{survey.returning_patients?.toLocaleString() || 0}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium mb-1">Avg Wait (days)</div>
                    <div className="text-2xl font-bold">{survey.average_wait_time_days || 'N/A'}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notes & Feedback */}
            <div className="grid gap-4 md:grid-cols-2">
              {survey.surveyor_notes && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Surveyor Notes</CardTitle>
                  </CardHeader>
                  <Separator />
                  <CardContent>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{survey.surveyor_notes}</p>
                  </CardContent>
                </Card>
              )}
              {survey.verifier_notes && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Verifier Notes</CardTitle>
                  </CardHeader>
                  <Separator />
                  <CardContent>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{survey.verifier_notes}</p>
                  </CardContent>
                </Card>
              )}
              {survey.rejection_reason && (
                <Card className="border-destructive">
                  <CardHeader>
                    <CardTitle className="text-base text-destructive">Rejection Reason</CardTitle>
                  </CardHeader>
                  <Separator />
                  <CardContent>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{survey.rejection_reason}</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Sticky Sidebar - 1/4 */}
          <div className="lg:col-span-1">
            <div className="sticky top-4 space-y-4">
              {/* Survey Metadata */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <HugeiconsIcon icon={ClipboardIcon} size={20} className="text-primary" />
                    <CardTitle className="text-base">Survey Metadata</CardTitle>
                  </div>
                </CardHeader>
                <Separator />
                <CardContent className="space-y-3">
                  <div>
                    <div className="text-xs font-medium text-muted-foreground mb-1">Status</div>
                    {getStatusBadge(survey.verification_status)}
                  </div>
                  <Separator />
                  <div>
                    <div className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
                      <HugeiconsIcon icon={UserIcon} size={12} />
                      Surveyor
                    </div>
                    <div className="text-sm font-medium">{survey.surveyor_name || 'N/A'}</div>
                  </div>
                  <Separator />
                  <div>
                    <div className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
                      <HugeiconsIcon icon={Calendar03Icon} size={12} />
                      Survey Date
                    </div>
                    <div className="text-sm font-medium">
                      {surveyDate.toLocaleDateString('id-ID', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </div>
                  </div>
                  {survey.verifier_name && (
                    <>
                      <Separator />
                      <div>
                        <div className="text-xs font-medium text-muted-foreground mb-1">Assigned Verifier</div>
                        <div className="text-sm font-medium">{survey.verifier_name}</div>
                      </div>
                    </>
                  )}
                  {survey.verified_by_name && (
                    <>
                      <Separator />
                      <div>
                        <div className="text-xs font-medium text-muted-foreground mb-1">Verified By</div>
                        <div className="text-sm font-medium">{survey.verified_by_name}</div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Quick Stats</CardTitle>
                </CardHeader>
                <Separator />
                <CardContent className="space-y-3">
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Total Patients</div>
                    <div className="text-xl font-bold">{survey.total_patients_served?.toLocaleString() || 0}</div>
                  </div>
                  <Separator />
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Bed Occupancy</div>
                    <div className="text-xl font-bold text-primary">
                      {survey.occupancy_rate ? `${Number(survey.occupancy_rate).toFixed(2)}%` : 'N/A'}
                    </div>
                  </div>
                  <Separator />
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Total Staff</div>
                    <div className="text-xl font-bold">{survey.current_staff_count || 0}</div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Verify Dialog */}
      <Dialog open={verifyDialogOpen} onOpenChange={setVerifyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Verify Survey</DialogTitle>
            <DialogDescription>
              Confirm that you want to verify this survey. You can add optional notes below.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="verifier-notes">Verifier Notes (Optional)</Label>
              <Textarea
                id="verifier-notes"
                placeholder="Add any notes about the verification..."
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
              Cancel
            </Button>
            <Button
              onClick={handleVerify}
              disabled={isSubmitting}
              className="gap-2"
            >
              {isSubmitting ? (
                <>Processing...</>
              ) : (
                <>
                  <HugeiconsIcon icon={CheckmarkCircle02Icon} size={16} />
                  Verify Survey
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
            <DialogTitle>Reject Survey</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this survey. This will be shared with the surveyor.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="rejection-reason">Rejection Reason *</Label>
              <Textarea
                id="rejection-reason"
                placeholder="Explain why this survey is being rejected..."
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
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={isSubmitting || !rejectionReason.trim()}
              className="gap-2"
            >
              {isSubmitting ? (
                <>Processing...</>
              ) : (
                <>
                  <HugeiconsIcon icon={Cancel01Icon} size={16} />
                  Reject Survey
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
