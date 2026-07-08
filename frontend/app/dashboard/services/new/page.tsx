'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from '@tanstack/react-form';
import {
  useCreateService,
  useMainTypesOfCare,
  useBasicStableInputsOfCare,
  useServiceTypes,
} from '@/hooks/use-services';
import type { Service } from '@/lib/types/api';
import { createServiceSchema, type CreateServiceFormData } from '@/lib/validations/service';
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from '@/components/ui/separator';

const breadcrumbs = [
  { label: 'Dasbor', href: '/dashboard' },
  { label: 'Semua Layanan', href: '/dashboard/services' },
  { label: 'Tambah Layanan Baru' },
];

export default function AddServicePage() {
  const router = useRouter();
  const createService = useCreateService();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { data: mtcList } = useMainTypesOfCare();
  const { data: bsicList } = useBasicStableInputsOfCare();
  const { data: serviceTypes } = useServiceTypes();

  const form = useForm({
    defaultValues: {
      name: '',
      description: '',
      mtc: '',
      bsic: '',
      service_type: '',
      phone_number: '',
      email: '',
      website: '',
      address: '',
      city: '',
      province: '',
      postal_code: '',
      latitude: '',
      longitude: '',
      bed_capacity: '',
      staff_count: '',
      psychiatrist_count: '0',
      psychologist_count: '0',
      nurse_count: '0',
      social_worker_count: '0',
      operating_hours: '',
      is_24_7: false,
      accepts_emergency: false,
      accepts_bpjs: false,
      accepts_private_insurance: false,
      funding_sources: '',
    } as CreateServiceFormData,
    onSubmit: async ({ value }) => {
      setSubmitError(null);
      try {
        const payload = {
          name: value.name,
          description: value.description,
          mtc: parseInt(value.mtc),
          bsic: parseInt(value.bsic),
          service_type: parseInt(value.service_type),
          city: value.city,
          province: value.province,
          phone_number: value.phone_number,
          email: value.email || undefined,
          website: value.website || undefined,
          address: value.address,
          postal_code: value.postal_code,
          latitude: value.latitude || undefined,
          longitude: value.longitude || undefined,
          bed_capacity: value.bed_capacity ? parseInt(value.bed_capacity) : undefined,
          staff_count: value.staff_count ? parseInt(value.staff_count) : undefined,
          psychiatrist_count: parseInt(value.psychiatrist_count || '0'),
          psychologist_count: parseInt(value.psychologist_count || '0'),
          nurse_count: parseInt(value.nurse_count || '0'),
          social_worker_count: parseInt(value.social_worker_count || '0'),
          operating_hours: value.operating_hours,
          is_24_7: value.is_24_7,
          accepts_emergency: value.accepts_emergency,
          accepts_bpjs: value.accepts_bpjs,
          accepts_private_insurance: value.accepts_private_insurance,
          funding_sources: value.funding_sources,
        };

        // Cast to any because API accepts IDs, not full objects
        await createService.mutateAsync(payload as unknown as Partial<Service>);
        router.push('/dashboard/services');
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Gagal membuat layanan';
        setSubmitError(errorMessage);
      }
    },
  });

  return (
    <>
      <PageHeader breadcrumbs={breadcrumbs} />

      <div className="flex flex-1 flex-col gap-4">

        <div className="px-8 pt-8">
          <h1 className="text-2xl font-bold">Tambah Layanan Baru</h1>
          <p className="text-muted-foreground">Daftarkan layanan kesehatan jiwa baru</p>
        </div>

        <Separator />

        <div className="flex flex-col gap-4 px-8 pb-8">

        <div className="max-w-4xl">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              form.handleSubmit();
            }}
            className="space-y-6"
          >
            {submitError && (
              <div className="rounded-lg bg-destructive/15 p-3 text-sm text-destructive">
                {submitError}
              </div>
            )}

            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Informasi Dasar</CardTitle>
                <CardDescription>Detail utama layanan</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <form.Field
                  name="name"
                  validators={{
                    onChange: ({ value }) => {
                      const result = createServiceSchema.shape.name.safeParse(value);
                      return result.success ? undefined : result.error.issues[0]?.message;
                    },
                  }}
                >
                  {(field) => (
                    <div className="space-y-2">
                      <Label htmlFor={field.name}>Nama Layanan *</Label>
                      <Input
                        id={field.name}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        className={field.state.meta.errors?.length ? 'border-destructive' : ''}
                      />
                      {field.state.meta.errors?.length > 0 && (
                        <p className="text-sm text-destructive">{field.state.meta.errors[0]}</p>
                      )}
                    </div>
                  )}
                </form.Field>

                <form.Field name="description">
                  {(field) => (
                    <div className="space-y-2">
                      <Label htmlFor={field.name}>Deskripsi</Label>
                      <Textarea
                        id={field.name}
                        value={field.state.value || ''}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        rows={3}
                      />
                    </div>
                  )}
                </form.Field>

                <div className="grid gap-4 md:grid-cols-3">
                  <form.Field
                    name="mtc"
                    validators={{
                      onChange: ({ value }) => {
                        const result = createServiceSchema.shape.mtc.safeParse(value);
                        return result.success ? undefined : result.error.issues[0]?.message;
                      },
                    }}
                  >
                    {(field) => (
                      <div className="space-y-2">
                        <Label htmlFor={field.name}>Jenis Perawatan Utama *</Label>
                        <Select value={field.state.value} onValueChange={field.handleChange}>
                          <SelectTrigger id={field.name} className={field.state.meta.errors?.length ? 'border-destructive' : ''}>
                            <SelectValue placeholder="Pilih MTC" />
                          </SelectTrigger>
                          <SelectContent>
                            {mtcList?.map((mtc: { id: number; code: string; name: string }) => (
                              <SelectItem key={mtc.id} value={mtc.id.toString()}>
                                {mtc.code} - {mtc.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {field.state.meta.errors?.length > 0 && (
                          <p className="text-sm text-destructive">{field.state.meta.errors[0]}</p>
                        )}
                      </div>
                    )}
                  </form.Field>

                  <form.Field
                    name="bsic"
                    validators={{
                      onChange: ({ value }) => {
                        const result = createServiceSchema.shape.bsic.safeParse(value);
                        return result.success ? undefined : result.error.issues[0]?.message;
                      },
                    }}
                  >
                    {(field) => (
                      <div className="space-y-2">
                        <Label htmlFor={field.name}>Jenis BSIC *</Label>
                        <Select value={field.state.value} onValueChange={field.handleChange}>
                          <SelectTrigger id={field.name} className={field.state.meta.errors?.length ? 'border-destructive' : ''}>
                            <SelectValue placeholder="Pilih BSIC" />
                          </SelectTrigger>
                          <SelectContent>
                            {bsicList?.map((bsic: { id: number; code: string; name: string }) => (
                              <SelectItem key={bsic.id} value={bsic.id.toString()}>
                                {bsic.code} - {bsic.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {field.state.meta.errors?.length > 0 && (
                          <p className="text-sm text-destructive">{field.state.meta.errors[0]}</p>
                        )}
                      </div>
                    )}
                  </form.Field>

                  <form.Field
                    name="service_type"
                    validators={{
                      onChange: ({ value }) => {
                        const result = createServiceSchema.shape.service_type.safeParse(value);
                        return result.success ? undefined : result.error.issues[0]?.message;
                      },
                    }}
                  >
                    {(field) => (
                      <div className="space-y-2">
                        <Label htmlFor={field.name}>Jenis Layanan *</Label>
                        <Select value={field.state.value} onValueChange={field.handleChange}>
                          <SelectTrigger id={field.name} className={field.state.meta.errors?.length ? 'border-destructive' : ''}>
                            <SelectValue placeholder="Pilih jenis" />
                          </SelectTrigger>
                          <SelectContent>
                            {serviceTypes?.map((type: { id: number; name: string }) => (
                              <SelectItem key={type.id} value={type.id.toString()}>
                                {type.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {field.state.meta.errors?.length > 0 && (
                          <p className="text-sm text-destructive">{field.state.meta.errors[0]}</p>
                        )}
                      </div>
                    )}
                  </form.Field>
                </div>
              </CardContent>
            </Card>

            {/* Location Information */}
            <Card>
              <CardHeader>
                <CardTitle>Lokasi</CardTitle>
                <CardDescription>Alamat dan detail lokasi layanan</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <form.Field name="address">
                  {(field) => (
                    <div className="space-y-2">
                      <Label htmlFor={field.name}>Alamat</Label>
                      <Textarea
                        id={field.name}
                        value={field.state.value || ''}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        rows={2}
                      />
                    </div>
                  )}
                </form.Field>

                <div className="grid gap-4 md:grid-cols-3">
                  <form.Field
                    name="city"
                    validators={{
                      onChange: ({ value }) => {
                        const result = createServiceSchema.shape.city.safeParse(value);
                        return result.success ? undefined : result.error.issues[0]?.message;
                      },
                    }}
                  >
                    {(field) => (
                      <div className="space-y-2">
                        <Label htmlFor={field.name}>Kota *</Label>
                        <Input
                          id={field.name}
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          className={field.state.meta.errors?.length ? 'border-destructive' : ''}
                        />
                        {field.state.meta.errors?.length > 0 && (
                          <p className="text-sm text-destructive">{field.state.meta.errors[0]}</p>
                        )}
                      </div>
                    )}
                  </form.Field>

                  <form.Field
                    name="province"
                    validators={{
                      onChange: ({ value }) => {
                        const result = createServiceSchema.shape.province.safeParse(value);
                        return result.success ? undefined : result.error.issues[0]?.message;
                      },
                    }}
                  >
                    {(field) => (
                      <div className="space-y-2">
                        <Label htmlFor={field.name}>Provinsi *</Label>
                        <Input
                          id={field.name}
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          className={field.state.meta.errors?.length ? 'border-destructive' : ''}
                        />
                        {field.state.meta.errors?.length > 0 && (
                          <p className="text-sm text-destructive">{field.state.meta.errors[0]}</p>
                        )}
                      </div>
                    )}
                  </form.Field>

                  <form.Field name="postal_code">
                    {(field) => (
                      <div className="space-y-2">
                        <Label htmlFor={field.name}>Kode Pos</Label>
                        <Input
                          id={field.name}
                          value={field.state.value || ''}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                        />
                      </div>
                    )}
                  </form.Field>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <form.Field name="latitude">
                    {(field) => (
                      <div className="space-y-2">
                        <Label htmlFor={field.name}>Lintang (Latitude)</Label>
                        <Input
                          id={field.name}
                          value={field.state.value || ''}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          placeholder="-6.2088"
                        />
                      </div>
                    )}
                  </form.Field>

                  <form.Field name="longitude">
                    {(field) => (
                      <div className="space-y-2">
                        <Label htmlFor={field.name}>Bujur (Longitude)</Label>
                        <Input
                          id={field.name}
                          value={field.state.value || ''}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          placeholder="106.8456"
                        />
                      </div>
                    )}
                  </form.Field>
                </div>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle>Informasi Kontak</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <form.Field name="phone_number">
                    {(field) => (
                      <div className="space-y-2">
                        <Label htmlFor={field.name}>Nomor Telepon</Label>
                        <Input
                          id={field.name}
                          value={field.state.value || ''}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                        />
                      </div>
                    )}
                  </form.Field>

                  <form.Field name="email">
                    {(field) => (
                      <div className="space-y-2">
                        <Label htmlFor={field.name}>Email</Label>
                        <Input
                          id={field.name}
                          type="email"
                          value={field.state.value || ''}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                        />
                      </div>
                    )}
                  </form.Field>

                  <form.Field name="website">
                    {(field) => (
                      <div className="space-y-2">
                        <Label htmlFor={field.name}>Website</Label>
                        <Input
                          id={field.name}
                          type="url"
                          value={field.state.value || ''}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                        />
                      </div>
                    )}
                  </form.Field>
                </div>
              </CardContent>
            </Card>

            {/* Capacity & Staffing */}
            <Card>
              <CardHeader>
                <CardTitle>Kapasitas & Kepegawaian</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <form.Field name="bed_capacity">
                    {(field) => (
                      <div className="space-y-2">
                        <Label htmlFor={field.name}>Kapasitas Tempat Tidur</Label>
                        <Input
                          id={field.name}
                          type="number"
                          min="0"
                          value={field.state.value || ''}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                        />
                      </div>
                    )}
                  </form.Field>

                  <form.Field name="staff_count">
                    {(field) => (
                      <div className="space-y-2">
                        <Label htmlFor={field.name}>Total Staf</Label>
                        <Input
                          id={field.name}
                          type="number"
                          min="0"
                          value={field.state.value || ''}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                        />
                      </div>
                    )}
                  </form.Field>
                </div>

                <div className="grid gap-4 md:grid-cols-4">
                  <form.Field name="psychiatrist_count">
                    {(field) => (
                      <div className="space-y-2">
                        <Label htmlFor={field.name}>Psikiater</Label>
                        <Input
                          id={field.name}
                          type="number"
                          min="0"
                          value={field.state.value || '0'}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                        />
                      </div>
                    )}
                  </form.Field>

                  <form.Field name="psychologist_count">
                    {(field) => (
                      <div className="space-y-2">
                        <Label htmlFor={field.name}>Psikolog</Label>
                        <Input
                          id={field.name}
                          type="number"
                          min="0"
                          value={field.state.value || '0'}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                        />
                      </div>
                    )}
                  </form.Field>

                  <form.Field name="nurse_count">
                    {(field) => (
                      <div className="space-y-2">
                        <Label htmlFor={field.name}>Perawat</Label>
                        <Input
                          id={field.name}
                          type="number"
                          min="0"
                          value={field.state.value || '0'}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                        />
                      </div>
                    )}
                  </form.Field>

                  <form.Field name="social_worker_count">
                    {(field) => (
                      <div className="space-y-2">
                        <Label htmlFor={field.name}>Pekerja Sosial</Label>
                        <Input
                          id={field.name}
                          type="number"
                          min="0"
                          value={field.state.value || '0'}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                        />
                      </div>
                    )}
                  </form.Field>
                </div>
              </CardContent>
            </Card>

            {/* Service Features */}
            <Card>
              <CardHeader>
                <CardTitle>Fitur Layanan</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <form.Field name="operating_hours">
                  {(field) => (
                    <div className="space-y-2">
                      <Label htmlFor={field.name}>Jam Operasional</Label>
                      <Input
                        id={field.name}
                        value={field.state.value || ''}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="mis., Sen-Jum 08.00-17.00"
                      />
                    </div>
                  )}
                </form.Field>

                <div className="space-y-3">
                  <form.Field name="is_24_7">
                    {(field) => (
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={field.name}
                          checked={field.state.value || false}
                          onCheckedChange={(checked) => field.handleChange(!!checked)}
                        />
                        <Label htmlFor={field.name} className="cursor-pointer">Layanan 24/7</Label>
                      </div>
                    )}
                  </form.Field>

                  <form.Field name="accepts_emergency">
                    {(field) => (
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={field.name}
                          checked={field.state.value || false}
                          onCheckedChange={(checked) => field.handleChange(!!checked)}
                        />
                        <Label htmlFor={field.name} className="cursor-pointer">Menerima Kasus Darurat</Label>
                      </div>
                    )}
                  </form.Field>

                  <form.Field name="accepts_bpjs">
                    {(field) => (
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={field.name}
                          checked={field.state.value || false}
                          onCheckedChange={(checked) => field.handleChange(!!checked)}
                        />
                        <Label htmlFor={field.name} className="cursor-pointer">Menerima BPJS</Label>
                      </div>
                    )}
                  </form.Field>

                  <form.Field name="accepts_private_insurance">
                    {(field) => (
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={field.name}
                          checked={field.state.value || false}
                          onCheckedChange={(checked) => field.handleChange(!!checked)}
                        />
                        <Label htmlFor={field.name} className="cursor-pointer">Menerima Asuransi Swasta</Label>
                      </div>
                    )}
                  </form.Field>
                </div>

                <form.Field name="funding_sources">
                  {(field) => (
                    <div className="space-y-2">
                      <Label htmlFor={field.name}>Sumber Pendanaan</Label>
                      <Input
                        id={field.name}
                        value={field.state.value || ''}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="Sumber pendanaan dipisahkan koma"
                      />
                    </div>
                  )}
                </form.Field>
              </CardContent>
            </Card>

            <div className="flex gap-2">
              <Button type="submit" disabled={createService.isPending}>
                {createService.isPending ? 'Menyimpan...' : 'Buat Layanan'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/dashboard/services')}
              >
                Batal
              </Button>
            </div>
          </form>
        </div>
              </div>
        </div>
    </>
  );
}
