'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from '@tanstack/react-form';
import { useServices } from '@/hooks/use-services';
import { useCreateSurvey } from '@/hooks/use-surveys';
import { useCurrentUser } from '@/hooks/use-auth';
import type { SurveyCreateData } from '@/lib/types/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const STEPS = [
  { id: 1, title: 'Informasi Dasar', description: 'Fasilitas dan periode survei' },
  { id: 2, title: 'Kapasitas & SDM', description: 'Tempat tidur dan tenaga kesehatan' },
  { id: 3, title: 'Data Pasien', description: 'Statistik dan demografi pasien' },
  { id: 4, title: 'Kualitas & Biaya', description: 'Kepuasan dan pembiayaan' },
  { id: 5, title: 'Catatan', description: 'Tantangan dan rekomendasi' },
];

// Define required fields for each step
const REQUIRED_FIELDS_BY_STEP: Record<number, { field: string; label: string }[]> = {
  1: [
    { field: 'service', label: 'Fasilitas layanan' },
    { field: 'survey_date', label: 'Tanggal survei' },
    { field: 'survey_period_start', label: 'Periode awal' },
    { field: 'survey_period_end', label: 'Periode akhir' },
  ],
  2: [], // No mandatory fields in step 2
  3: [], // No mandatory fields in step 3
  4: [], // No mandatory fields in step 4
  5: [], // No mandatory fields in step 5
};

export default function SurveyWizardPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [stepErrors, setStepErrors] = useState<Record<string, string>>({});

  const createSurvey = useCreateSurvey();
  const { data: servicesData } = useServices({ is_active: true, page_size: 100 });
  const { data: user } = useCurrentUser();

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
    },
    onSubmit: async ({ value }) => {
      setIsSubmitting(true);
      try {
        const payload = {
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
        };

        await createSurvey.mutateAsync(payload as SurveyCreateData);
        toast.success('Survei berhasil disimpan!');
        router.push('/dashboard/survey');
      } catch (error) {
        console.error('Failed to create survey:', error);
        toast.error('Gagal menyimpan survei. Silakan coba lagi.');
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  // Validate current step before moving to next
  const validateCurrentStep = (): boolean => {
    const requiredFields = REQUIRED_FIELDS_BY_STEP[currentStep] || [];
    const errors: Record<string, string> = {};
    const formValues = form.state.values;

    for (const { field, label } of requiredFields) {
      const value = formValues[field as keyof typeof formValues];
      if (!value || (typeof value === 'string' && value.trim() === '')) {
        errors[field] = `${label} wajib diisi`;
      }
    }

    // Additional validation for step 1: check if period end is after period start
    if (currentStep === 1 && formValues.survey_period_start && formValues.survey_period_end) {
      if (new Date(formValues.survey_period_end) < new Date(formValues.survey_period_start)) {
        errors.survey_period_end = 'Periode akhir harus setelah periode awal';
      }
    }

    setStepErrors(errors);

    if (Object.keys(errors).length > 0) {
      const errorMessages = Object.values(errors).join(', ');
      toast.error(`Mohon lengkapi: ${errorMessages}`);
      return false;
    }

    return true;
  };

  const nextStep = () => {
    if (!validateCurrentStep()) {
      return;
    }

    if (currentStep < STEPS.length) {
      setStepErrors({});
      setCurrentStep(currentStep + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setStepErrors({});
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSubmit = () => {
    if (!validateCurrentStep()) {
      return;
    }
    form.handleSubmit();
  };

  // Helper to check if a field has error
  const hasError = (fieldName: string) => !!stepErrors[fieldName];
  const getError = (fieldName: string) => stepErrors[fieldName];

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-background border-b sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">Formulir Survei DESDE-LTC</h1>
              <p className="text-sm text-muted-foreground">
                Selamat datang, {user?.first_name || user?.email}
              </p>
            </div>
            <Link href="/dashboard">
              <Button variant="outline" size="sm">
                Kembali ke Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Progress Steps */}
      <div className="bg-background border-b">
        <div className="max-w-5xl mx-auto px-6 py-6">
          <nav aria-label="Progress">
            <ol className="flex items-center justify-between">
              {STEPS.map((step, index) => (
                <li key={step.id} className="flex-1">
                  <div className="flex flex-col items-center">
                    <div className="flex items-center w-full">
                      <div
                        className={cn(
                          'flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium border-2 transition-colors',
                          currentStep > step.id
                            ? 'bg-primary border-primary text-primary-foreground'
                            : currentStep === step.id
                            ? 'bg-primary border-primary text-primary-foreground'
                            : 'bg-background border-muted-foreground/30 text-muted-foreground'
                        )}
                      >
                        {currentStep > step.id ? (
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          step.id
                        )}
                      </div>
                      {index < STEPS.length - 1 && (
                        <div
                          className={cn(
                            'flex-1 h-1 mx-2 rounded',
                            currentStep > step.id ? 'bg-primary' : 'bg-muted'
                          )}
                        />
                      )}
                    </div>
                    <div className="mt-2 text-center">
                      <p
                        className={cn(
                          'text-xs font-medium',
                          currentStep >= step.id ? 'text-foreground' : 'text-muted-foreground'
                        )}
                      >
                        {step.title}
                      </p>
                      <p className="text-xs text-muted-foreground hidden sm:block">
                        {step.description}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </nav>
        </div>
      </div>

      {/* Form Content */}
      <main className="max-w-3xl mx-auto px-6 py-8">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          {/* Step 1: Informasi Dasar */}
          {currentStep === 1 && (
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-bold mb-2">Informasi Dasar</h2>
                <p className="text-muted-foreground">
                  Pilih fasilitas layanan dan tentukan periode survei yang akan dilaporkan.
                </p>
              </div>

              <div className="space-y-6">
                <form.Field
                  name="service"
                  children={(field) => {
                    const selectedService = servicesData?.results.find(
                      s => s.id.toString() === field.state.value
                    );
                    return (
                      <div className="space-y-3">
                        <Label htmlFor={field.name} className="text-base font-medium">
                          Pilih fasilitas layanan kesehatan jiwa yang akan disurvei <span className="text-destructive">*</span>
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Pilih nama fasilitas dari daftar layanan yang telah terdaftar dalam sistem.
                        </p>
                        <Select
                          value={field.state.value}
                          onValueChange={(value) => {
                            field.handleChange(value);
                            if (stepErrors.service) {
                              setStepErrors(prev => ({ ...prev, service: '' }));
                            }
                          }}
                        >
                          <SelectTrigger className={cn("w-full", hasError('service') && "border-destructive")}>
                            <SelectValue placeholder="-- Pilih Fasilitas --">
                              {selectedService ? `${selectedService.name} - ${selectedService.city}` : '-- Pilih Fasilitas --'}
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
                        {hasError('service') && (
                          <p className="text-sm text-destructive">{getError('service')}</p>
                        )}
                      </div>
                    );
                  }}
                />

                <form.Field
                  name="survey_date"
                  children={(field) => (
                    <div className="space-y-3">
                      <Label htmlFor={field.name} className="text-base font-medium">
                        Tanggal pelaksanaan survei <span className="text-destructive">*</span>
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Masukkan tanggal saat survei ini dilakukan.
                      </p>
                      <Input
                        id={field.name}
                        type="date"
                        value={field.state.value}
                        onChange={(e) => {
                          field.handleChange(e.target.value);
                          if (stepErrors.survey_date) {
                            setStepErrors(prev => ({ ...prev, survey_date: '' }));
                          }
                        }}
                        className={cn("max-w-xs", hasError('survey_date') && "border-destructive")}
                      />
                      {hasError('survey_date') && (
                        <p className="text-sm text-destructive">{getError('survey_date')}</p>
                      )}
                    </div>
                  )}
                />

                <div className="space-y-3">
                  <Label className="text-base font-medium">
                    Periode data yang dilaporkan <span className="text-destructive">*</span>
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Tentukan rentang waktu data yang dikumpulkan dalam survei ini.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <form.Field
                      name="survey_period_start"
                      children={(field) => (
                        <div className="flex-1 space-y-2">
                          <Label htmlFor={field.name} className="text-sm">Dari tanggal</Label>
                          <Input
                            id={field.name}
                            type="date"
                            value={field.state.value}
                            onChange={(e) => {
                              field.handleChange(e.target.value);
                              if (stepErrors.survey_period_start) {
                                setStepErrors(prev => ({ ...prev, survey_period_start: '' }));
                              }
                            }}
                            className={hasError('survey_period_start') ? "border-destructive" : ""}
                          />
                          {hasError('survey_period_start') && (
                            <p className="text-sm text-destructive">{getError('survey_period_start')}</p>
                          )}
                        </div>
                      )}
                    />
                    <form.Field
                      name="survey_period_end"
                      children={(field) => (
                        <div className="flex-1 space-y-2">
                          <Label htmlFor={field.name} className="text-sm">Sampai tanggal</Label>
                          <Input
                            id={field.name}
                            type="date"
                            value={field.state.value}
                            onChange={(e) => {
                              field.handleChange(e.target.value);
                              if (stepErrors.survey_period_end) {
                                setStepErrors(prev => ({ ...prev, survey_period_end: '' }));
                              }
                            }}
                            className={hasError('survey_period_end') ? "border-destructive" : ""}
                          />
                          {hasError('survey_period_end') && (
                            <p className="text-sm text-destructive">{getError('survey_period_end')}</p>
                          )}
                        </div>
                      )}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Kapasitas & SDM */}
          {currentStep === 2 && (
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-bold mb-2">Kapasitas & Sumber Daya Manusia</h2>
                <p className="text-muted-foreground">
                  Informasi tentang kapasitas tempat tidur dan jumlah tenaga kesehatan profesional.
                </p>
              </div>

              <div className="space-y-6">
                <form.Field
                  name="current_bed_capacity"
                  children={(field) => (
                    <div className="space-y-3">
                      <Label htmlFor={field.name} className="text-base font-medium">
                        Berapa jumlah total tempat tidur yang tersedia di fasilitas ini?
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Hitung seluruh tempat tidur yang dapat digunakan untuk pasien rawat inap.
                      </p>
                      <Input
                        id={field.name}
                        type="number"
                        min="0"
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="Masukkan jumlah"
                        className="max-w-xs"
                      />
                    </div>
                  )}
                />

                <form.Field
                  name="beds_occupied"
                  children={(field) => (
                    <div className="space-y-3">
                      <Label htmlFor={field.name} className="text-base font-medium">
                        Berapa rata-rata jumlah tempat tidur yang terisi selama periode survei?
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Estimasi rata-rata tempat tidur yang digunakan per hari.
                      </p>
                      <Input
                        id={field.name}
                        type="number"
                        min="0"
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="Masukkan jumlah"
                        className="max-w-xs"
                      />
                    </div>
                  )}
                />

                <form.Field
                  name="current_staff_count"
                  children={(field) => (
                    <div className="space-y-3">
                      <Label htmlFor={field.name} className="text-base font-medium">
                        Berapa jumlah total seluruh staf yang bekerja di fasilitas ini?
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Termasuk tenaga medis, paramedis, administrasi, dan staf pendukung.
                      </p>
                      <Input
                        id={field.name}
                        type="number"
                        min="0"
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="Masukkan jumlah"
                        className="max-w-xs"
                      />
                    </div>
                  )}
                />

                <div className="space-y-3">
                  <Label className="text-base font-medium">
                    Jumlah tenaga kesehatan profesional berdasarkan kategori
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Isi jumlah tenaga profesional yang aktif bekerja. Kosongkan atau isi 0 jika tidak ada.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <form.Field
                      name="current_psychiatrist_count"
                      children={(field) => (
                        <div className="space-y-2">
                          <Label htmlFor={field.name} className="text-sm">Psikiater</Label>
                          <Input
                            id={field.name}
                            type="number"
                            min="0"
                            value={field.state.value}
                            onChange={(e) => field.handleChange(e.target.value)}
                            placeholder="0"
                          />
                        </div>
                      )}
                    />

                    <form.Field
                      name="current_psychologist_count"
                      children={(field) => (
                        <div className="space-y-2">
                          <Label htmlFor={field.name} className="text-sm">Psikolog Klinis</Label>
                          <Input
                            id={field.name}
                            type="number"
                            min="0"
                            value={field.state.value}
                            onChange={(e) => field.handleChange(e.target.value)}
                            placeholder="0"
                          />
                        </div>
                      )}
                    />

                    <form.Field
                      name="current_nurse_count"
                      children={(field) => (
                        <div className="space-y-2">
                          <Label htmlFor={field.name} className="text-sm">Perawat Jiwa</Label>
                          <Input
                            id={field.name}
                            type="number"
                            min="0"
                            value={field.state.value}
                            onChange={(e) => field.handleChange(e.target.value)}
                            placeholder="0"
                          />
                        </div>
                      )}
                    />

                    <form.Field
                      name="current_social_worker_count"
                      children={(field) => (
                        <div className="space-y-2">
                          <Label htmlFor={field.name} className="text-sm">Pekerja Sosial</Label>
                          <Input
                            id={field.name}
                            type="number"
                            min="0"
                            value={field.state.value}
                            onChange={(e) => field.handleChange(e.target.value)}
                            placeholder="0"
                          />
                        </div>
                      )}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Data Pasien */}
          {currentStep === 3 && (
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-bold mb-2">Statistik Pasien</h2>
                <p className="text-muted-foreground">
                  Data jumlah pasien dan distribusi berdasarkan demografi.
                </p>
              </div>

              <div className="space-y-6">
                <form.Field
                  name="total_patients_served"
                  children={(field) => (
                    <div className="space-y-3">
                      <Label htmlFor={field.name} className="text-base font-medium">
                        Berapa total pasien yang dilayani selama periode survei?
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Hitung seluruh pasien (rawat jalan dan rawat inap) selama periode yang dilaporkan.
                      </p>
                      <Input
                        id={field.name}
                        type="number"
                        min="0"
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="Masukkan jumlah"
                        className="max-w-xs"
                      />
                    </div>
                  )}
                />

                <div className="space-y-3">
                  <Label className="text-base font-medium">
                    Distribusi pasien baru dan pasien lama
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Pasien baru = pertama kali berkunjung. Pasien lama = pernah berkunjung sebelumnya.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <form.Field
                      name="new_patients"
                      children={(field) => (
                        <div className="space-y-2">
                          <Label htmlFor={field.name} className="text-sm">Pasien Baru</Label>
                          <Input
                            id={field.name}
                            type="number"
                            min="0"
                            value={field.state.value}
                            onChange={(e) => field.handleChange(e.target.value)}
                            placeholder="0"
                          />
                        </div>
                      )}
                    />
                    <form.Field
                      name="returning_patients"
                      children={(field) => (
                        <div className="space-y-2">
                          <Label htmlFor={field.name} className="text-sm">Pasien Lama</Label>
                          <Input
                            id={field.name}
                            type="number"
                            min="0"
                            value={field.state.value}
                            onChange={(e) => field.handleChange(e.target.value)}
                            placeholder="0"
                          />
                        </div>
                      )}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-base font-medium">
                    Distribusi pasien berdasarkan jenis kelamin
                  </Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <form.Field
                      name="patients_male"
                      children={(field) => (
                        <div className="space-y-2">
                          <Label htmlFor={field.name} className="text-sm">Laki-laki</Label>
                          <Input
                            id={field.name}
                            type="number"
                            min="0"
                            value={field.state.value}
                            onChange={(e) => field.handleChange(e.target.value)}
                            placeholder="0"
                          />
                        </div>
                      )}
                    />
                    <form.Field
                      name="patients_female"
                      children={(field) => (
                        <div className="space-y-2">
                          <Label htmlFor={field.name} className="text-sm">Perempuan</Label>
                          <Input
                            id={field.name}
                            type="number"
                            min="0"
                            value={field.state.value}
                            onChange={(e) => field.handleChange(e.target.value)}
                            placeholder="0"
                          />
                        </div>
                      )}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-base font-medium">
                    Distribusi pasien berdasarkan kelompok usia
                  </Label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <form.Field
                      name="patients_age_0_17"
                      children={(field) => (
                        <div className="space-y-2">
                          <Label htmlFor={field.name} className="text-sm">Usia 0-17 tahun</Label>
                          <Input
                            id={field.name}
                            type="number"
                            min="0"
                            value={field.state.value}
                            onChange={(e) => field.handleChange(e.target.value)}
                            placeholder="0"
                          />
                        </div>
                      )}
                    />
                    <form.Field
                      name="patients_age_18_64"
                      children={(field) => (
                        <div className="space-y-2">
                          <Label htmlFor={field.name} className="text-sm">Usia 18-64 tahun</Label>
                          <Input
                            id={field.name}
                            type="number"
                            min="0"
                            value={field.state.value}
                            onChange={(e) => field.handleChange(e.target.value)}
                            placeholder="0"
                          />
                        </div>
                      )}
                    />
                    <form.Field
                      name="patients_age_65_plus"
                      children={(field) => (
                        <div className="space-y-2">
                          <Label htmlFor={field.name} className="text-sm">Usia 65+ tahun</Label>
                          <Input
                            id={field.name}
                            type="number"
                            min="0"
                            value={field.state.value}
                            onChange={(e) => field.handleChange(e.target.value)}
                            placeholder="0"
                          />
                        </div>
                      )}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Kualitas & Biaya */}
          {currentStep === 4 && (
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-bold mb-2">Kualitas Layanan & Pembiayaan</h2>
                <p className="text-muted-foreground">
                  Indikator kualitas layanan dan informasi sumber pembiayaan pasien.
                </p>
              </div>

              <div className="space-y-6">
                <form.Field
                  name="patient_satisfaction_score"
                  children={(field) => (
                    <div className="space-y-3">
                      <Label htmlFor={field.name} className="text-base font-medium">
                        Berapa rata-rata skor kepuasan pasien terhadap layanan?
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Skala 0-5 (0 = sangat tidak puas, 5 = sangat puas). Kosongkan jika tidak ada data.
                      </p>
                      <Input
                        id={field.name}
                        type="number"
                        step="0.1"
                        min="0"
                        max="5"
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="Contoh: 4.2"
                        className="max-w-xs"
                      />
                    </div>
                  )}
                />

                <form.Field
                  name="average_wait_time_days"
                  children={(field) => (
                    <div className="space-y-3">
                      <Label htmlFor={field.name} className="text-base font-medium">
                        Berapa rata-rata waktu tunggu pasien untuk mendapatkan layanan (dalam hari)?
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Waktu tunggu dari pendaftaran hingga pasien mendapatkan layanan pertama.
                      </p>
                      <Input
                        id={field.name}
                        type="number"
                        min="0"
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="Masukkan jumlah hari"
                        className="max-w-xs"
                      />
                    </div>
                  )}
                />

                <form.Field
                  name="monthly_budget"
                  children={(field) => (
                    <div className="space-y-3">
                      <Label htmlFor={field.name} className="text-base font-medium">
                        Berapa perkiraan anggaran operasional bulanan fasilitas ini?
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Estimasi total biaya operasional per bulan dalam Rupiah.
                      </p>
                      <Input
                        id={field.name}
                        type="text"
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="Contoh: 500000000"
                        className="max-w-xs"
                      />
                    </div>
                  )}
                />

                <div className="space-y-3">
                  <Label className="text-base font-medium">
                    Distribusi pasien berdasarkan sumber pembiayaan
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Klasifikasikan pasien berdasarkan metode pembayaran.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <form.Field
                      name="bpjs_patients"
                      children={(field) => (
                        <div className="space-y-2">
                          <Label htmlFor={field.name} className="text-sm">Pasien BPJS</Label>
                          <Input
                            id={field.name}
                            type="number"
                            min="0"
                            value={field.state.value}
                            onChange={(e) => field.handleChange(e.target.value)}
                            placeholder="0"
                          />
                        </div>
                      )}
                    />
                    <form.Field
                      name="private_insurance_patients"
                      children={(field) => (
                        <div className="space-y-2">
                          <Label htmlFor={field.name} className="text-sm">Asuransi Swasta</Label>
                          <Input
                            id={field.name}
                            type="number"
                            min="0"
                            value={field.state.value}
                            onChange={(e) => field.handleChange(e.target.value)}
                            placeholder="0"
                          />
                        </div>
                      )}
                    />
                    <form.Field
                      name="self_pay_patients"
                      children={(field) => (
                        <div className="space-y-2">
                          <Label htmlFor={field.name} className="text-sm">Bayar Mandiri</Label>
                          <Input
                            id={field.name}
                            type="number"
                            min="0"
                            value={field.state.value}
                            onChange={(e) => field.handleChange(e.target.value)}
                            placeholder="0"
                          />
                        </div>
                      )}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Catatan */}
          {currentStep === 5 && (
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-bold mb-2">Tantangan & Catatan</h2>
                <p className="text-muted-foreground">
                  Informasi tentang tantangan yang dihadapi dan catatan tambahan dari surveyor.
                </p>
              </div>

              <div className="space-y-6">
                <form.Field
                  name="challenges_faced"
                  children={(field) => (
                    <div className="space-y-3">
                      <Label htmlFor={field.name} className="text-base font-medium">
                        Apa saja tantangan utama yang dihadapi fasilitas ini dalam memberikan layanan kesehatan jiwa?
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Jelaskan hambatan atau kesulitan yang dialami, seperti kekurangan tenaga ahli, keterbatasan dana, infrastruktur, stigma masyarakat, dll.
                      </p>
                      <Textarea
                        id={field.name}
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="Tuliskan tantangan yang dihadapi..."
                        rows={4}
                      />
                    </div>
                  )}
                />

                <form.Field
                  name="improvements_needed"
                  children={(field) => (
                    <div className="space-y-3">
                      <Label htmlFor={field.name} className="text-base font-medium">
                        Perbaikan atau dukungan apa yang paling dibutuhkan fasilitas ini?
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Berikan rekomendasi konkret mengenai peningkatan kapasitas, kebutuhan pelatihan, penambahan fasilitas, atau dukungan kebijakan.
                      </p>
                      <Textarea
                        id={field.name}
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="Tuliskan perbaikan yang dibutuhkan..."
                        rows={4}
                      />
                    </div>
                  )}
                />

                <form.Field
                  name="surveyor_notes"
                  children={(field) => (
                    <div className="space-y-3">
                      <Label htmlFor={field.name} className="text-base font-medium">
                        Catatan tambahan dari surveyor
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Tuliskan observasi, temuan penting, atau catatan lain yang relevan dari hasil kunjungan survei.
                      </p>
                      <Textarea
                        id={field.name}
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="Tuliskan catatan tambahan..."
                        rows={4}
                      />
                    </div>
                  )}
                />
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-8 mt-8 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 1}
              size="lg"
            >
              Sebelumnya
            </Button>

            {currentStep < STEPS.length ? (
              <Button type="button" onClick={nextStep} size="lg">
                Selanjutnya
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                size="lg"
                className="min-w-[150px]"
              >
                {isSubmitting ? 'Menyimpan...' : 'Simpan Survei'}
              </Button>
            )}
          </div>
        </form>
      </main>
    </div>
  );
}
