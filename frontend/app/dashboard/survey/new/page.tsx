'use client';

import { useRouter } from "next/navigation";
import { useForm } from "@tanstack/react-form";
import { useServices } from "@/hooks/use-services";
import { useCreateSurvey } from "@/hooks/use-surveys";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const breadcrumbs = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Survey Records', href: '/dashboard/survey' },
  { label: 'New Survey Entry' },
];

export default function NewSurveyPage() {
  const router = useRouter();
  const createSurvey = useCreateSurvey();
  const { data: servicesData } = useServices({ is_active: true, page_size: 100 });

  const form = useForm({
    defaultValues: {
      service: '',
      survey_date: new Date().toISOString().split('T')[0],
      survey_period_start: '',
      survey_period_end: '',
      current_bed_capacity: '',
      beds_occupied: '',
      current_staff_count: '',
      current_psychiatrist_count: '',
      current_psychologist_count: '',
      current_nurse_count: '',
      current_social_worker_count: '',
      total_patients_served: '',
      new_patients: '',
      returning_patients: '',
      patients_male: '',
      patients_female: '',
      patients_age_0_17: '',
      patients_age_18_64: '',
      patients_age_65_plus: '',
      patient_satisfaction_score: '',
      average_wait_time_days: '',
      monthly_budget: '',
      bpjs_patients: '',
      private_insurance_patients: '',
      self_pay_patients: '',
      challenges_faced: '',
      improvements_needed: '',
      surveyor_notes: '',
      additional_notes: '',
    },
    onSubmit: async ({ value }) => {
      try {
        // Convert string values to numbers where needed
        const payload: any = {
          service: parseInt(value.service),
          survey_date: value.survey_date,
          survey_period_start: value.survey_period_start,
          survey_period_end: value.survey_period_end,
          current_bed_capacity: value.current_bed_capacity ? parseInt(value.current_bed_capacity) : null,
          beds_occupied: value.beds_occupied ? parseInt(value.beds_occupied) : null,
          current_staff_count: value.current_staff_count ? parseInt(value.current_staff_count) : null,
          current_psychiatrist_count: value.current_psychiatrist_count ? parseInt(value.current_psychiatrist_count) : 0,
          current_psychologist_count: value.current_psychologist_count ? parseInt(value.current_psychologist_count) : 0,
          current_nurse_count: value.current_nurse_count ? parseInt(value.current_nurse_count) : 0,
          current_social_worker_count: value.current_social_worker_count ? parseInt(value.current_social_worker_count) : 0,
          total_patients_served: value.total_patients_served ? parseInt(value.total_patients_served) : 0,
          new_patients: value.new_patients ? parseInt(value.new_patients) : 0,
          returning_patients: value.returning_patients ? parseInt(value.returning_patients) : 0,
          patients_male: value.patients_male ? parseInt(value.patients_male) : 0,
          patients_female: value.patients_female ? parseInt(value.patients_female) : 0,
          patients_age_0_17: value.patients_age_0_17 ? parseInt(value.patients_age_0_17) : 0,
          patients_age_18_64: value.patients_age_18_64 ? parseInt(value.patients_age_18_64) : 0,
          patients_age_65_plus: value.patients_age_65_plus ? parseInt(value.patients_age_65_plus) : 0,
          patient_satisfaction_score: value.patient_satisfaction_score ? parseFloat(value.patient_satisfaction_score) : null,
          average_wait_time_days: value.average_wait_time_days ? parseInt(value.average_wait_time_days) : null,
          monthly_budget: value.monthly_budget || null,
          bpjs_patients: value.bpjs_patients ? parseInt(value.bpjs_patients) : 0,
          private_insurance_patients: value.private_insurance_patients ? parseInt(value.private_insurance_patients) : 0,
          self_pay_patients: value.self_pay_patients ? parseInt(value.self_pay_patients) : 0,
          challenges_faced: value.challenges_faced,
          improvements_needed: value.improvements_needed,
          surveyor_notes: value.surveyor_notes,
          additional_notes: value.additional_notes,
        };

        await createSurvey.mutateAsync(payload);
        router.push('/dashboard/survey');
      } catch (error) {
        console.error('Failed to create survey:', error);
      }
    },
  });

  return (
    <>
      <PageHeader breadcrumbs={breadcrumbs} />

      <div className="flex flex-1 flex-col gap-4 p-8">
        <div>
          <h1 className="text-2xl font-bold">New Survey Entry</h1>
          <p className="text-muted-foreground">Create a new survey data collection record</p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
          className="space-y-6"
        >
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Service and survey period details</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <form.Field
                  name="service"
                  children={(field) => {
                    const selectedService = servicesData?.results.find(
                      s => s.id.toString() === field.state.value
                    );
                    return (
                      <div className="grid gap-2">
                        <Label htmlFor={field.name}>Service *</Label>
                        <Select
                          value={field.state.value}
                          onValueChange={(value) => field.handleChange(value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select service">
                              {selectedService ? `${selectedService.name} - ${selectedService.city}` : 'Select service'}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {servicesData?.results.map((service) => (
                              <SelectItem key={service.id} value={service.id.toString()}>
                                {service.name} - {service.city}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {field.state.meta.errors && (
                          <p className="text-sm text-destructive">{field.state.meta.errors}</p>
                        )}
                      </div>
                    );
                  }}
                />

                <form.Field
                  name="survey_date"
                  children={(field) => (
                    <div className="grid gap-2">
                      <Label htmlFor={field.name}>Survey Date *</Label>
                      <Input
                        id={field.name}
                        name={field.name}
                        type="date"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        required
                      />
                    </div>
                  )}
                />

                <form.Field
                  name="survey_period_start"
                  children={(field) => (
                    <div className="grid gap-2">
                      <Label htmlFor={field.name}>Period Start *</Label>
                      <Input
                        id={field.name}
                        name={field.name}
                        type="date"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        required
                      />
                    </div>
                  )}
                />

                <form.Field
                  name="survey_period_end"
                  children={(field) => (
                    <div className="grid gap-2">
                      <Label htmlFor={field.name}>Period End *</Label>
                      <Input
                        id={field.name}
                        name={field.name}
                        type="date"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        required
                      />
                    </div>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Capacity Data */}
          <Card>
            <CardHeader>
              <CardTitle>Capacity & Occupancy</CardTitle>
              <CardDescription>Bed capacity and occupancy information</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <form.Field
                  name="current_bed_capacity"
                  children={(field) => (
                    <div className="grid gap-2">
                      <Label htmlFor={field.name}>Total Bed Capacity</Label>
                      <Input
                        id={field.name}
                        name={field.name}
                        type="number"
                        min="0"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="0"
                      />
                    </div>
                  )}
                />

                <form.Field
                  name="beds_occupied"
                  children={(field) => (
                    <div className="grid gap-2">
                      <Label htmlFor={field.name}>Beds Occupied</Label>
                      <Input
                        id={field.name}
                        name={field.name}
                        type="number"
                        min="0"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="0"
                      />
                    </div>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Staffing Data */}
          <Card>
            <CardHeader>
              <CardTitle>Staffing Information</CardTitle>
              <CardDescription>Professional staff counts at survey time</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <form.Field
                  name="current_staff_count"
                  children={(field) => (
                    <div className="grid gap-2">
                      <Label htmlFor={field.name}>Total Staff Count</Label>
                      <Input
                        id={field.name}
                        name={field.name}
                        type="number"
                        min="0"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="0"
                      />
                    </div>
                  )}
                />

                <form.Field
                  name="current_psychiatrist_count"
                  children={(field) => (
                    <div className="grid gap-2">
                      <Label htmlFor={field.name}>Psychiatrists</Label>
                      <Input
                        id={field.name}
                        name={field.name}
                        type="number"
                        min="0"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="0"
                      />
                    </div>
                  )}
                />

                <form.Field
                  name="current_psychologist_count"
                  children={(field) => (
                    <div className="grid gap-2">
                      <Label htmlFor={field.name}>Psychologists</Label>
                      <Input
                        id={field.name}
                        name={field.name}
                        type="number"
                        min="0"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="0"
                      />
                    </div>
                  )}
                />

                <form.Field
                  name="current_nurse_count"
                  children={(field) => (
                    <div className="grid gap-2">
                      <Label htmlFor={field.name}>Nurses</Label>
                      <Input
                        id={field.name}
                        name={field.name}
                        type="number"
                        min="0"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="0"
                      />
                    </div>
                  )}
                />

                <form.Field
                  name="current_social_worker_count"
                  children={(field) => (
                    <div className="grid gap-2">
                      <Label htmlFor={field.name}>Social Workers</Label>
                      <Input
                        id={field.name}
                        name={field.name}
                        type="number"
                        min="0"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="0"
                      />
                    </div>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Patient Data */}
          <Card>
            <CardHeader>
              <CardTitle>Patient Statistics</CardTitle>
              <CardDescription>Patient counts and demographics</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid grid-cols-3 gap-4">
                <form.Field
                  name="total_patients_served"
                  children={(field) => (
                    <div className="grid gap-2">
                      <Label htmlFor={field.name}>Total Patients Served</Label>
                      <Input
                        id={field.name}
                        name={field.name}
                        type="number"
                        min="0"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="0"
                      />
                    </div>
                  )}
                />

                <form.Field
                  name="new_patients"
                  children={(field) => (
                    <div className="grid gap-2">
                      <Label htmlFor={field.name}>New Patients</Label>
                      <Input
                        id={field.name}
                        name={field.name}
                        type="number"
                        min="0"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="0"
                      />
                    </div>
                  )}
                />

                <form.Field
                  name="returning_patients"
                  children={(field) => (
                    <div className="grid gap-2">
                      <Label htmlFor={field.name}>Returning Patients</Label>
                      <Input
                        id={field.name}
                        name={field.name}
                        type="number"
                        min="0"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="0"
                      />
                    </div>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <form.Field
                  name="patients_male"
                  children={(field) => (
                    <div className="grid gap-2">
                      <Label htmlFor={field.name}>Male Patients</Label>
                      <Input
                        id={field.name}
                        name={field.name}
                        type="number"
                        min="0"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="0"
                      />
                    </div>
                  )}
                />

                <form.Field
                  name="patients_female"
                  children={(field) => (
                    <div className="grid gap-2">
                      <Label htmlFor={field.name}>Female Patients</Label>
                      <Input
                        id={field.name}
                        name={field.name}
                        type="number"
                        min="0"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="0"
                      />
                    </div>
                  )}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <form.Field
                  name="patients_age_0_17"
                  children={(field) => (
                    <div className="grid gap-2">
                      <Label htmlFor={field.name}>Age 0-17</Label>
                      <Input
                        id={field.name}
                        name={field.name}
                        type="number"
                        min="0"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="0"
                      />
                    </div>
                  )}
                />

                <form.Field
                  name="patients_age_18_64"
                  children={(field) => (
                    <div className="grid gap-2">
                      <Label htmlFor={field.name}>Age 18-64</Label>
                      <Input
                        id={field.name}
                        name={field.name}
                        type="number"
                        min="0"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="0"
                      />
                    </div>
                  )}
                />

                <form.Field
                  name="patients_age_65_plus"
                  children={(field) => (
                    <div className="grid gap-2">
                      <Label htmlFor={field.name}>Age 65+</Label>
                      <Input
                        id={field.name}
                        name={field.name}
                        type="number"
                        min="0"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="0"
                      />
                    </div>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Quality & Financial */}
          <Card>
            <CardHeader>
              <CardTitle>Quality & Financial Data</CardTitle>
              <CardDescription>Quality indicators and payment methods</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid grid-cols-3 gap-4">
                <form.Field
                  name="patient_satisfaction_score"
                  children={(field) => (
                    <div className="grid gap-2">
                      <Label htmlFor={field.name}>Satisfaction Score (0-5)</Label>
                      <Input
                        id={field.name}
                        name={field.name}
                        type="number"
                        step="0.1"
                        min="0"
                        max="5"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="0.0"
                      />
                    </div>
                  )}
                />

                <form.Field
                  name="average_wait_time_days"
                  children={(field) => (
                    <div className="grid gap-2">
                      <Label htmlFor={field.name}>Avg Wait Time (days)</Label>
                      <Input
                        id={field.name}
                        name={field.name}
                        type="number"
                        min="0"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="0"
                      />
                    </div>
                  )}
                />

                <form.Field
                  name="monthly_budget"
                  children={(field) => (
                    <div className="grid gap-2">
                      <Label htmlFor={field.name}>Monthly Budget (IDR)</Label>
                      <Input
                        id={field.name}
                        name={field.name}
                        type="text"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="0"
                      />
                    </div>
                  )}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <form.Field
                  name="bpjs_patients"
                  children={(field) => (
                    <div className="grid gap-2">
                      <Label htmlFor={field.name}>BPJS Patients</Label>
                      <Input
                        id={field.name}
                        name={field.name}
                        type="number"
                        min="0"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="0"
                      />
                    </div>
                  )}
                />

                <form.Field
                  name="private_insurance_patients"
                  children={(field) => (
                    <div className="grid gap-2">
                      <Label htmlFor={field.name}>Private Insurance Patients</Label>
                      <Input
                        id={field.name}
                        name={field.name}
                        type="number"
                        min="0"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="0"
                      />
                    </div>
                  )}
                />

                <form.Field
                  name="self_pay_patients"
                  children={(field) => (
                    <div className="grid gap-2">
                      <Label htmlFor={field.name}>Self-Pay Patients</Label>
                      <Input
                        id={field.name}
                        name={field.name}
                        type="number"
                        min="0"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="0"
                      />
                    </div>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Additional Information</CardTitle>
              <CardDescription>Challenges, improvements, and notes</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <form.Field
                name="challenges_faced"
                children={(field) => (
                  <div className="grid gap-2">
                    <Label htmlFor={field.name}>Challenges Faced</Label>
                    <Textarea
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="Describe any challenges..."
                      rows={3}
                    />
                  </div>
                )}
              />

              <form.Field
                name="improvements_needed"
                children={(field) => (
                  <div className="grid gap-2">
                    <Label htmlFor={field.name}>Improvements Needed</Label>
                    <Textarea
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="Describe needed improvements..."
                      rows={3}
                    />
                  </div>
                )}
              />

              <form.Field
                name="surveyor_notes"
                children={(field) => (
                  <div className="grid gap-2">
                    <Label htmlFor={field.name}>Surveyor Notes</Label>
                    <Textarea
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="Any additional notes..."
                      rows={3}
                    />
                  </div>
                )}
              />
            </CardContent>
          </Card>

          {/* Form Actions */}
          <div className="flex gap-4 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/dashboard/survey')}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createSurvey.isPending}>
              {createSurvey.isPending ? 'Creating...' : 'Create Survey'}
            </Button>
          </div>
        </form>
      </div>
    </>
  );
}
