'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { useSurvey } from '@/hooks/use-surveys';
import { PageHeader } from '@/components/page-header';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Map, MapControls, MapMarker, MarkerContent, MarkerPopup } from '@/components/ui/map';
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

export default function SubmissionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { data: survey, isLoading } = useSurvey(Number(id));

  const loadingBreadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Submissions', href: '/dashboard/submissions' },
    { label: 'Loading...' },
  ];

  if (isLoading) {
    return (
      <>
        <PageHeader breadcrumbs={loadingBreadcrumbs} />
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <div className="h-16 w-16 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
            <p className="text-sm text-muted-foreground">Loading submission details...</p>
          </div>
        </div>
      </>
    );
  }

  const notFoundBreadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Submissions', href: '/dashboard/submissions' },
    { label: 'Not Found' },
  ];

  if (!survey) {
    return (
      <>
        <PageHeader breadcrumbs={notFoundBreadcrumbs} />
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <p className="text-lg font-semibold mb-2">Submission not found</p>
            <p className="text-sm text-muted-foreground mb-4">The submission you're looking for doesn't exist.</p>
            <Button onClick={() => router.push('/dashboard/submissions')}>
              <HugeiconsIcon icon={ArrowLeft01Icon} size={16} className="mr-2" />
              Back to Submissions
            </Button>
          </div>
        </div>
      </>
    );
  }

  const surveyDate = new Date(survey.survey_date);
  const createdDate = new Date(survey.created_at);
  const submittedDate = survey.submitted_at ? new Date(survey.submitted_at) : null;
  const verifiedDate = survey.verified_at ? new Date(survey.verified_at) : null;

  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Submissions', href: '/dashboard/submissions' },
    { label: `#${survey.id}` },
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
            onClick={() => router.push('/dashboard/submissions')}
            className="w-fit"
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} size={16} className="mr-2" />
            Back to Submissions
          </Button>
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold">Submission #{survey.id}</h1>
                {getStatusBadge(survey.verification_status)}
              </div>
              <p className="text-lg text-muted-foreground">{survey.service.name}</p>
            </div>
          </div>
        </div>

        {/* 2 Column Layout: 3/4 Main Content + 1/4 Sticky Sidebar */}
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
              <Separator />
              <div className="grid grid-cols-3 gap-4">
                {survey.service.phone_number && (
                  <div>
                    <div className="text-sm font-medium mb-1 flex items-center gap-1">
                      <HugeiconsIcon icon={SmartPhone01Icon} size={14} />
                      Phone
                    </div>
                    <div className="text-sm text-muted-foreground">{survey.service.phone_number}</div>
                  </div>
                )}
                {survey.service.email && (
                  <div>
                    <div className="text-sm font-medium mb-1 flex items-center gap-1">
                      <HugeiconsIcon icon={Mail01Icon} size={14} />
                      Email
                    </div>
                    <div className="text-sm text-muted-foreground truncate">{survey.service.email}</div>
                  </div>
                )}
                {survey.service.website && (
                  <div>
                    <div className="text-sm font-medium mb-1 flex items-center gap-1">
                      <HugeiconsIcon icon={Globe02Icon} size={14} />
                      Website
                    </div>
                    <a
                      href={survey.service.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline truncate block"
                    >
                      Link
                    </a>
                  </div>
                )}
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
            <CardDescription>Service facility location on map</CardDescription>
          </CardHeader>
          <Separator />
          <CardContent className="p-0">
            {survey.service.latitude && survey.service.longitude ? (
              <div className="w-full h-[400px] rounded-b-lg overflow-hidden">
                <Map center={[parseFloat(survey.service.longitude), parseFloat(survey.service.latitude)]} zoom={15}>
                  <MapControls position="bottom-right" showZoom showCompass />
                  <MapMarker longitude={parseFloat(survey.service.longitude)} latitude={parseFloat(survey.service.latitude)}>
                    <MarkerContent>
                      <div className="relative">
                        <HugeiconsIcon icon={Hospital01Icon} size={32} className="text-primary drop-shadow-lg" />
                        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-primary" />
                      </div>
                    </MarkerContent>
                    <MarkerPopup>
                      <div className="space-y-1 min-w-[200px]">
                        <p className="font-semibold text-sm">{survey.service.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {survey.service.address && `${survey.service.address}, `}
                          {survey.service.city}, {survey.service.province}
                        </p>
                        <div className="flex gap-2 pt-1">
                          <Badge variant="outline" className="text-xs">
                            {survey.service.mtc_code || 'N/A'}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {survey.service.bsic_code || 'N/A'}
                          </Badge>
                        </div>
                      </div>
                    </MarkerPopup>
                  </MapMarker>
                </Map>
              </div>
            ) : (
              <div className="w-full h-[400px] bg-muted rounded-b-lg flex items-center justify-center">
                <div className="text-center">
                  <HugeiconsIcon icon={Location01Icon} size={48} className="text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm font-medium text-muted-foreground">Location coordinates not available</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {survey.service.address && `Address: ${survey.service.address}, `}
                    {survey.service.city}, {survey.service.province}
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
            <Separator />
            <div>
              <div className="text-sm font-medium mb-3">Gender Distribution</div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <span className="text-sm text-muted-foreground">Male</span>
                  <span className="text-lg font-bold">{survey.patients_male?.toLocaleString() || 0}</span>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <span className="text-sm text-muted-foreground">Female</span>
                  <span className="text-lg font-bold">{survey.patients_female?.toLocaleString() || 0}</span>
                </div>
              </div>
            </div>
            <Separator />
            <div>
              <div className="text-sm font-medium mb-3">Age Distribution</div>
              <div className="grid grid-cols-3 gap-4">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <span className="text-sm text-muted-foreground">0-17 years</span>
                  <span className="text-lg font-bold">{survey.patients_age_0_17?.toLocaleString() || 0}</span>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <span className="text-sm text-muted-foreground">18-64 years</span>
                  <span className="text-lg font-bold">{survey.patients_age_18_64?.toLocaleString() || 0}</span>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <span className="text-sm text-muted-foreground">65+ years</span>
                  <span className="text-lg font-bold">{survey.patients_age_65_plus?.toLocaleString() || 0}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Methods */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <HugeiconsIcon icon={MoneyBag01Icon} size={20} className="text-primary" />
              <CardTitle>Payment Distribution</CardTitle>
            </div>
            <CardDescription>Patient payment methods breakdown</CardDescription>
          </CardHeader>
          <Separator />
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <div className="text-sm text-muted-foreground mb-1">BPJS</div>
                  <div className="text-2xl font-bold">{survey.bpjs_patients?.toLocaleString() || 0}</div>
                </div>
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Private Insurance</div>
                  <div className="text-2xl font-bold">{survey.private_insurance_patients?.toLocaleString() || 0}</div>
                </div>
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Self Pay</div>
                  <div className="text-2xl font-bold">{survey.self_pay_patients?.toLocaleString() || 0}</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notes & Feedback */}
        <div className="grid gap-4 md:grid-cols-2">
          {survey.challenges_faced && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Challenges Faced</CardTitle>
              </CardHeader>
              <Separator />
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{survey.challenges_faced}</p>
              </CardContent>
            </Card>
          )}
          {survey.improvements_needed && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Improvements Needed</CardTitle>
              </CardHeader>
              <Separator />
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{survey.improvements_needed}</p>
              </CardContent>
            </Card>
          )}
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
                  {survey.survey_period_start && survey.survey_period_end && (
                    <>
                      <Separator />
                      <div>
                        <div className="text-xs font-medium text-muted-foreground mb-1">Survey Period</div>
                        <div className="text-xs">
                          {new Date(survey.survey_period_start).toLocaleDateString('id-ID')} -{' '}
                          {new Date(survey.survey_period_end).toLocaleDateString('id-ID')}
                        </div>
                      </div>
                    </>
                  )}
                  <Separator />
                  <div>
                    <div className="text-xs font-medium text-muted-foreground mb-1">Timeline</div>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Created</span>
                        <span className="font-medium">
                          {createdDate.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}
                        </span>
                      </div>
                      {submittedDate && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Submitted</span>
                          <span className="font-medium">
                            {submittedDate.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}
                          </span>
                        </div>
                      )}
                      {verifiedDate && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Verified</span>
                          <span className="font-medium">
                            {verifiedDate.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}
                          </span>
                        </div>
                      )}
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
    </>
  );
}
