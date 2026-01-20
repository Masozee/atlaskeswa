'use client';

import { useRouter } from "next/navigation";
import { useForm } from "@tanstack/react-form";
import { useServices } from "@/hooks/use-services";
import { useCreateSurvey } from "@/hooks/use-surveys";
import type { SurveyCreateData } from "@/lib/types/api";
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

const breadcrumbs = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Data Survei', href: '/dashboard/survey' },
  { label: 'Survei Baru' },
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
          additional_notes: value.additional_notes,
        };

        await createSurvey.mutateAsync(payload as SurveyCreateData);
        router.push('/dashboard/survey');
      } catch (error) {
        console.error('Failed to create survey:', error);
      }
    },
  });

  return (
    <>
      <PageHeader breadcrumbs={breadcrumbs} />

      <div className="flex flex-1 flex-col p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Formulir Survei Layanan Kesehatan Jiwa</h1>
          <p className="text-muted-foreground mt-1">
            Silakan lengkapi seluruh pertanyaan di bawah ini dengan data yang akurat sesuai kondisi layanan pada periode survei.
          </p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
          className="space-y-10 max-w-4xl"
        >
          {/* Section A: Informasi Dasar */}
          <section>
            <h2 className="text-lg font-semibold border-b pb-2 mb-6">Bagian A: Informasi Dasar</h2>

            <div className="space-y-6">
              <form.Field
                name="service"
                children={(field) => {
                  const selectedService = servicesData?.results.find(
                    s => s.id.toString() === field.state.value
                  );
                  return (
                    <div className="space-y-2">
                      <Label htmlFor={field.name} className="text-base font-medium">
                        1. Pilih fasilitas layanan kesehatan jiwa yang akan disurvei <span className="text-destructive">*</span>
                      </Label>
                      <p className="text-sm text-muted-foreground mb-2">
                        Pilih nama fasilitas dari daftar layanan yang telah terdaftar dalam sistem.
                      </p>
                      <Select
                        value={field.state.value}
                        onValueChange={(value) => field.handleChange(value)}
                      >
                        <SelectTrigger className="max-w-md">
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
                    </div>
                  );
                }}
              />

              <form.Field
                name="survey_date"
                children={(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name} className="text-base font-medium">
                      2. Tanggal pelaksanaan survei <span className="text-destructive">*</span>
                    </Label>
                    <p className="text-sm text-muted-foreground mb-2">
                      Masukkan tanggal saat survei ini dilakukan.
                    </p>
                    <Input
                      id={field.name}
                      type="date"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      className="max-w-xs"
                      required
                    />
                  </div>
                )}
              />

              <div className="space-y-2">
                <Label className="text-base font-medium">
                  3. Periode data yang dilaporkan <span className="text-destructive">*</span>
                </Label>
                <p className="text-sm text-muted-foreground mb-2">
                  Tentukan rentang waktu data yang dikumpulkan dalam survei ini (misalnya: 1 bulan terakhir, 3 bulan terakhir, atau 1 tahun terakhir).
                </p>
                <div className="flex items-center gap-4">
                  <form.Field
                    name="survey_period_start"
                    children={(field) => (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Dari:</span>
                        <Input
                          id={field.name}
                          type="date"
                          value={field.state.value}
                          onChange={(e) => field.handleChange(e.target.value)}
                          className="w-40"
                          required
                        />
                      </div>
                    )}
                  />
                  <form.Field
                    name="survey_period_end"
                    children={(field) => (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Sampai:</span>
                        <Input
                          id={field.name}
                          type="date"
                          value={field.state.value}
                          onChange={(e) => field.handleChange(e.target.value)}
                          className="w-40"
                          required
                        />
                      </div>
                    )}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Section B: Kapasitas dan Okupansi */}
          <section>
            <h2 className="text-lg font-semibold border-b pb-2 mb-6">Bagian B: Kapasitas dan Tingkat Hunian</h2>

            <div className="space-y-6">
              <form.Field
                name="current_bed_capacity"
                children={(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name} className="text-base font-medium">
                      4. Berapa jumlah total tempat tidur yang tersedia di fasilitas ini?
                    </Label>
                    <p className="text-sm text-muted-foreground mb-2">
                      Hitung seluruh tempat tidur yang dapat digunakan untuk pasien rawat inap, termasuk yang sedang dalam perbaikan.
                    </p>
                    <Input
                      id={field.name}
                      type="number"
                      min="0"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="Masukkan jumlah tempat tidur"
                      className="max-w-xs"
                    />
                  </div>
                )}
              />

              <form.Field
                name="beds_occupied"
                children={(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name} className="text-base font-medium">
                      5. Berapa rata-rata jumlah tempat tidur yang terisi selama periode survei?
                    </Label>
                    <p className="text-sm text-muted-foreground mb-2">
                      Estimasi rata-rata tempat tidur yang digunakan pasien per hari selama periode yang dilaporkan.
                    </p>
                    <Input
                      id={field.name}
                      type="number"
                      min="0"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="Masukkan jumlah tempat tidur terisi"
                      className="max-w-xs"
                    />
                  </div>
                )}
              />
            </div>
          </section>

          {/* Section C: Tenaga Kesehatan */}
          <section>
            <h2 className="text-lg font-semibold border-b pb-2 mb-6">Bagian C: Tenaga Kesehatan Profesional</h2>

            <div className="space-y-6">
              <form.Field
                name="current_staff_count"
                children={(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name} className="text-base font-medium">
                      6. Berapa jumlah total seluruh staf yang bekerja di fasilitas ini?
                    </Label>
                    <p className="text-sm text-muted-foreground mb-2">
                      Termasuk tenaga medis, paramedis, administrasi, dan staf pendukung lainnya.
                    </p>
                    <Input
                      id={field.name}
                      type="number"
                      min="0"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="Masukkan total staf"
                      className="max-w-xs"
                    />
                  </div>
                )}
              />

              <div className="space-y-2">
                <Label className="text-base font-medium">
                  7. Berapa jumlah tenaga kesehatan profesional berdasarkan kategori berikut?
                </Label>
                <p className="text-sm text-muted-foreground mb-4">
                  Isi jumlah tenaga profesional yang aktif bekerja di fasilitas ini. Kosongkan atau isi 0 jika tidak ada.
                </p>

                <div className="grid grid-cols-2 gap-4 max-w-lg">
                  <form.Field
                    name="current_psychiatrist_count"
                    children={(field) => (
                      <div className="space-y-1">
                        <Label htmlFor={field.name} className="text-sm">Dokter Spesialis Jiwa (Psikiater)</Label>
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
                      <div className="space-y-1">
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
                      <div className="space-y-1">
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
                      <div className="space-y-1">
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
          </section>

          {/* Section D: Data Pasien */}
          <section>
            <h2 className="text-lg font-semibold border-b pb-2 mb-6">Bagian D: Statistik Pasien</h2>

            <div className="space-y-6">
              <form.Field
                name="total_patients_served"
                children={(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name} className="text-base font-medium">
                      8. Berapa total pasien yang dilayani selama periode survei?
                    </Label>
                    <p className="text-sm text-muted-foreground mb-2">
                      Hitung seluruh pasien yang menerima layanan (rawat jalan dan rawat inap) selama periode yang dilaporkan.
                    </p>
                    <Input
                      id={field.name}
                      type="number"
                      min="0"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="Masukkan jumlah pasien"
                      className="max-w-xs"
                    />
                  </div>
                )}
              />

              <div className="space-y-2">
                <Label className="text-base font-medium">
                  9. Dari total pasien tersebut, berapa yang merupakan pasien baru dan pasien lama?
                </Label>
                <p className="text-sm text-muted-foreground mb-4">
                  Pasien baru adalah pasien yang pertama kali berkunjung ke fasilitas ini. Pasien lama adalah pasien yang pernah berkunjung sebelumnya.
                </p>

                <div className="grid grid-cols-2 gap-4 max-w-lg">
                  <form.Field
                    name="new_patients"
                    children={(field) => (
                      <div className="space-y-1">
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
                      <div className="space-y-1">
                        <Label htmlFor={field.name} className="text-sm">Pasien Lama (Kunjungan Ulang)</Label>
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

              <div className="space-y-2">
                <Label className="text-base font-medium">
                  10. Berapa distribusi pasien berdasarkan jenis kelamin?
                </Label>
                <p className="text-sm text-muted-foreground mb-4">
                  Isi jumlah pasien laki-laki dan perempuan yang dilayani selama periode survei.
                </p>

                <div className="grid grid-cols-2 gap-4 max-w-lg">
                  <form.Field
                    name="patients_male"
                    children={(field) => (
                      <div className="space-y-1">
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
                      <div className="space-y-1">
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

              <div className="space-y-2">
                <Label className="text-base font-medium">
                  11. Berapa distribusi pasien berdasarkan kelompok usia?
                </Label>
                <p className="text-sm text-muted-foreground mb-4">
                  Klasifikasikan pasien ke dalam tiga kelompok usia: anak-anak dan remaja (0-17 tahun), dewasa (18-64 tahun), dan lansia (65 tahun ke atas).
                </p>

                <div className="grid grid-cols-3 gap-4 max-w-xl">
                  <form.Field
                    name="patients_age_0_17"
                    children={(field) => (
                      <div className="space-y-1">
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
                      <div className="space-y-1">
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
                      <div className="space-y-1">
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
          </section>

          {/* Section E: Kualitas Layanan */}
          <section>
            <h2 className="text-lg font-semibold border-b pb-2 mb-6">Bagian E: Kualitas Layanan</h2>

            <div className="space-y-6">
              <form.Field
                name="patient_satisfaction_score"
                children={(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name} className="text-base font-medium">
                      12. Berapa rata-rata skor kepuasan pasien terhadap layanan?
                    </Label>
                    <p className="text-sm text-muted-foreground mb-2">
                      Masukkan skor rata-rata berdasarkan survei kepuasan pasien dengan skala 0-5 (0 = sangat tidak puas, 5 = sangat puas). Kosongkan jika tidak ada data.
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
                  <div className="space-y-2">
                    <Label htmlFor={field.name} className="text-base font-medium">
                      13. Berapa rata-rata waktu tunggu pasien untuk mendapatkan layanan (dalam hari)?
                    </Label>
                    <p className="text-sm text-muted-foreground mb-2">
                      Hitung rata-rata waktu tunggu dari saat pendaftaran hingga pasien mendapatkan layanan pertama.
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
            </div>
          </section>

          {/* Section F: Data Finansial */}
          <section>
            <h2 className="text-lg font-semibold border-b pb-2 mb-6">Bagian F: Pembiayaan dan Sumber Pendanaan</h2>

            <div className="space-y-6">
              <form.Field
                name="monthly_budget"
                children={(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name} className="text-base font-medium">
                      14. Berapa perkiraan anggaran operasional bulanan fasilitas ini?
                    </Label>
                    <p className="text-sm text-muted-foreground mb-2">
                      Masukkan estimasi total biaya operasional per bulan dalam Rupiah (termasuk gaji staf, obat-obatan, utilitas, dll).
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

              <div className="space-y-2">
                <Label className="text-base font-medium">
                  15. Berapa distribusi pasien berdasarkan sumber pembiayaan?
                </Label>
                <p className="text-sm text-muted-foreground mb-4">
                  Klasifikasikan pasien berdasarkan metode pembayaran yang digunakan selama periode survei.
                </p>

                <div className="grid grid-cols-3 gap-4 max-w-xl">
                  <form.Field
                    name="bpjs_patients"
                    children={(field) => (
                      <div className="space-y-1">
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
                      <div className="space-y-1">
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
                      <div className="space-y-1">
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
          </section>

          {/* Section G: Tantangan dan Rekomendasi */}
          <section>
            <h2 className="text-lg font-semibold border-b pb-2 mb-6">Bagian G: Tantangan dan Rekomendasi</h2>

            <div className="space-y-6">
              <form.Field
                name="challenges_faced"
                children={(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name} className="text-base font-medium">
                      16. Apa saja tantangan utama yang dihadapi fasilitas ini dalam memberikan layanan kesehatan jiwa?
                    </Label>
                    <p className="text-sm text-muted-foreground mb-2">
                      Jelaskan hambatan atau kesulitan yang dialami, seperti kekurangan tenaga ahli, keterbatasan dana, infrastruktur yang tidak memadai, stigma masyarakat, atau lainnya.
                    </p>
                    <Textarea
                      id={field.name}
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="Tuliskan tantangan yang dihadapi..."
                      rows={4}
                      className="max-w-2xl"
                    />
                  </div>
                )}
              />

              <form.Field
                name="improvements_needed"
                children={(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name} className="text-base font-medium">
                      17. Perbaikan atau dukungan apa yang paling dibutuhkan fasilitas ini?
                    </Label>
                    <p className="text-sm text-muted-foreground mb-2">
                      Berikan rekomendasi konkret mengenai peningkatan kapasitas, kebutuhan pelatihan, penambahan fasilitas, atau dukungan kebijakan yang diperlukan.
                    </p>
                    <Textarea
                      id={field.name}
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="Tuliskan perbaikan yang dibutuhkan..."
                      rows={4}
                      className="max-w-2xl"
                    />
                  </div>
                )}
              />

              <form.Field
                name="surveyor_notes"
                children={(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name} className="text-base font-medium">
                      18. Catatan tambahan dari surveyor
                    </Label>
                    <p className="text-sm text-muted-foreground mb-2">
                      Tuliskan observasi, temuan penting, atau catatan lain yang relevan dari hasil kunjungan survei.
                    </p>
                    <Textarea
                      id={field.name}
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="Tuliskan catatan tambahan..."
                      rows={4}
                      className="max-w-2xl"
                    />
                  </div>
                )}
              />
            </div>
          </section>

          {/* Form Actions */}
          <div className="flex gap-4 pt-6 border-t">
            <Button type="submit" disabled={createSurvey.isPending} size="lg">
              {createSurvey.isPending ? 'Menyimpan...' : 'Simpan Survei'}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={() => router.push('/dashboard/survey')}
            >
              Batal
            </Button>
          </div>
        </form>
      </div>
    </>
  );
}
