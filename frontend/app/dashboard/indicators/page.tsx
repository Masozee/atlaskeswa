'use client';

import { useServiceAnalytics, useSurveyAnalytics } from '@/hooks/use-analytics';
import { DateTime } from "@/components/date-time"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

export default function KeyIndicatorsPage() {
  const { data: serviceStats, isLoading: serviceLoading } = useServiceAnalytics();
  const { data: surveyStats, isLoading: surveyLoading } = useSurveyAnalytics();

  const isLoading = serviceLoading || surveyLoading;

  if (isLoading) {
    return (
      <>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Key Indicators</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div className="ml-auto">
            <DateTime />
          </div>
        </header>
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <div className="h-16 w-16 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
            <p className="text-sm text-muted-foreground">Loading indicators...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Key Indicators</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="ml-auto">
          <DateTime />
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-4">
        <div>
          <h1 className="text-2xl font-bold">Key Indicators</h1>
          <p className="text-muted-foreground">Key performance indicators and metrics</p>
        </div>

        {/* Service Metrics */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Insurance Coverage</CardTitle>
              <CardDescription>Services accepting different insurance types</CardDescription>
            </CardHeader>
            <Separator />
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">BPJS</span>
                  <span className="text-sm text-muted-foreground">{serviceStats?.insurance_coverage.bpjs || 0} services</span>
                </div>
                <Progress value={(serviceStats?.insurance_coverage.bpjs || 0) / 24 * 100} />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Private Insurance</span>
                  <span className="text-sm text-muted-foreground">{serviceStats?.insurance_coverage.private || 0} services</span>
                </div>
                <Progress value={(serviceStats?.insurance_coverage.private || 0) / 24 * 100} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Emergency Services</CardTitle>
              <CardDescription>24/7 and emergency care availability</CardDescription>
            </CardHeader>
            <Separator />
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Accepts Emergency</span>
                  <span className="text-sm text-muted-foreground">{serviceStats?.emergency_services.accepts_emergency || 0} services</span>
                </div>
                <Progress value={(serviceStats?.emergency_services.accepts_emergency || 0) / 24 * 100} />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">24/7 Services</span>
                  <span className="text-sm text-muted-foreground">{serviceStats?.emergency_services.twentyfour_seven || 0} services</span>
                </div>
                <Progress value={(serviceStats?.emergency_services.twentyfour_seven || 0) / 24 * 100} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Average Metrics */}
        <Card>
          <CardHeader>
            <CardTitle>Average Service Capacity</CardTitle>
            <CardDescription>Average resources per mental health service</CardDescription>
          </CardHeader>
          <Separator />
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Avg Beds</p>
                <p className="text-2xl font-bold">{serviceStats?.average_metrics.beds || 0}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Avg Staff</p>
                <p className="text-2xl font-bold">{serviceStats?.average_metrics.staff || 0}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Avg Psychiatrists</p>
                <p className="text-2xl font-bold">{serviceStats?.average_metrics.psychiatrists || 0}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Avg Psychologists</p>
                <p className="text-2xl font-bold">{serviceStats?.average_metrics.psychologists || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Survey Quality Metrics */}
        <Card>
          <CardHeader>
            <CardTitle>Survey Quality Indicators</CardTitle>
            <CardDescription>Patient care and service quality metrics</CardDescription>
          </CardHeader>
          <Separator />
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Average Occupancy Rate</p>
                <p className="text-3xl font-bold">{surveyStats?.average_occupancy_rate || 0}%</p>
                <p className="text-xs text-muted-foreground mt-1">Bed utilization across all facilities</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Total Patients Served</p>
                <p className="text-3xl font-bold">{surveyStats?.patient_demographics.total_patients?.toLocaleString() || 0}</p>
                <p className="text-xs text-muted-foreground mt-1">Cumulative patient count from surveys</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Patient Demographics */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Gender Distribution</CardTitle>
              <CardDescription>Patient gender demographics</CardDescription>
            </CardHeader>
            <Separator />
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Male Patients</span>
                  <span className="text-sm text-muted-foreground">{surveyStats?.patient_demographics.male_patients?.toLocaleString() || 0}</span>
                </div>
                <Progress value={(surveyStats?.patient_demographics.male_patients || 0) / (surveyStats?.patient_demographics.total_patients || 1) * 100} />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Female Patients</span>
                  <span className="text-sm text-muted-foreground">{surveyStats?.patient_demographics.female_patients?.toLocaleString() || 0}</span>
                </div>
                <Progress value={(surveyStats?.patient_demographics.female_patients || 0) / (surveyStats?.patient_demographics.total_patients || 1) * 100} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Age Distribution</CardTitle>
              <CardDescription>Patient age demographics</CardDescription>
            </CardHeader>
            <Separator />
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">0-17 years</span>
                  <span className="text-sm text-muted-foreground">{surveyStats?.patient_demographics.age_0_17?.toLocaleString() || 0}</span>
                </div>
                <Progress value={(surveyStats?.patient_demographics.age_0_17 || 0) / (surveyStats?.patient_demographics.total_patients || 1) * 100} />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">18-64 years</span>
                  <span className="text-sm text-muted-foreground">{surveyStats?.patient_demographics.age_18_64?.toLocaleString() || 0}</span>
                </div>
                <Progress value={(surveyStats?.patient_demographics.age_18_64 || 0) / (surveyStats?.patient_demographics.total_patients || 1) * 100} />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">65+ years</span>
                  <span className="text-sm text-muted-foreground">{surveyStats?.patient_demographics.age_65_plus?.toLocaleString() || 0}</span>
                </div>
                <Progress value={(surveyStats?.patient_demographics.age_65_plus || 0) / (surveyStats?.patient_demographics.total_patients || 1) * 100} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
