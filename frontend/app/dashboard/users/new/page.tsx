'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from '@tanstack/react-form';
import { useCreateUser } from '@/hooks/use-users';
import { createUserBaseSchema, type CreateUserFormData } from '@/lib/validations/user';
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
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
  { label: 'Semua Pengguna', href: '/dashboard/users' },
  { label: 'Tambah Pengguna' },
];

export default function AddUserPage() {
  const router = useRouter();
  const createUser = useCreateUser();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useForm({
    defaultValues: {
      email: '',
      password: '',
      password_confirm: '',
      first_name: '',
      last_name: '',
      role: 'VIEWER' as const,
      phone_number: '',
      organization: '',
    } as CreateUserFormData,
    onSubmit: async ({ value }) => {
      setSubmitError(null);
      try {
        await createUser.mutateAsync(value);
        router.push('/dashboard/users');
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Gagal membuat pengguna';
        setSubmitError(errorMessage);
      }
    },
  });

  return (
    <>
      <PageHeader breadcrumbs={breadcrumbs} />

      <div className="flex flex-1 flex-col gap-4">

        <div className="px-8 pt-8">
          <h1 className="text-2xl font-bold">Tambah Pengguna Baru</h1>
          <p className="text-muted-foreground">Buat akun pengguna baru</p>
        </div>

        <Separator />

        <div className="flex flex-col gap-4 px-8 pb-8">

        <div className="max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle>Informasi Pengguna</CardTitle>
              <CardDescription>Isi detail untuk membuat akun pengguna baru</CardDescription>
            </CardHeader>
            <CardContent>
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

                <div className="grid gap-4 md:grid-cols-2">
                  <form.Field name="first_name">
                    {(field) => (
                      <div className="space-y-2">
                        <Label htmlFor={field.name}>Nama Depan</Label>
                        <Input
                          id={field.name}
                          value={field.state.value || ''}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                        />
                      </div>
                    )}
                  </form.Field>

                  <form.Field name="last_name">
                    {(field) => (
                      <div className="space-y-2">
                        <Label htmlFor={field.name}>Nama Belakang</Label>
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

                <form.Field
                  name="email"
                  validators={{
                    onChange: ({ value }) => {
                      const result = createUserBaseSchema.shape.email.safeParse(value);
                      return result.success ? undefined : result.error.issues[0]?.message;
                    },
                  }}
                >
                  {(field) => (
                    <div className="space-y-2">
                      <Label htmlFor={field.name}>Email *</Label>
                      <Input
                        id={field.name}
                        type="email"
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

                <div className="grid gap-4 md:grid-cols-2">
                  <form.Field
                    name="password"
                    validators={{
                      onChange: ({ value }) => {
                        const result = createUserBaseSchema.shape.password.safeParse(value);
                        return result.success ? undefined : result.error.issues[0]?.message;
                      },
                    }}
                  >
                    {(field) => (
                      <div className="space-y-2">
                        <Label htmlFor={field.name}>Kata Sandi *</Label>
                        <Input
                          id={field.name}
                          type="password"
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
                    name="password_confirm"
                    validators={{
                      onChangeListenTo: ['password'],
                      onChange: ({ value, fieldApi }) => {
                        const password = fieldApi.form.getFieldValue('password');
                        if (value && password && value !== password) {
                          return 'Kata sandi tidak cocok';
                        }
                        if (!value) {
                          return 'Konfirmasi kata sandi wajib diisi';
                        }
                        return undefined;
                      },
                    }}
                  >
                    {(field) => (
                      <div className="space-y-2">
                        <Label htmlFor={field.name}>Konfirmasi Kata Sandi *</Label>
                        <Input
                          id={field.name}
                          type="password"
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
                </div>

                <form.Field
                  name="role"
                  validators={{
                    onChange: ({ value }) => {
                      if (!value) return 'Role wajib dipilih';
                      return undefined;
                    },
                  }}
                >
                  {(field) => (
                    <div className="space-y-2">
                      <Label htmlFor={field.name}>Peran *</Label>
                      <Select value={field.state.value} onValueChange={(v) => field.handleChange(v as typeof field.state.value)}>
                        <SelectTrigger id={field.name} className={field.state.meta.errors?.length ? 'border-destructive' : ''}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ADMIN">Administrator</SelectItem>
                          <SelectItem value="SURVEYOR">Surveyor/Enumerator</SelectItem>
                          <SelectItem value="VERIFIER">Verifier</SelectItem>
                          <SelectItem value="VIEWER">Viewer/Analyst</SelectItem>
                        </SelectContent>
                      </Select>
                      {field.state.meta.errors?.length > 0 && (
                        <p className="text-sm text-destructive">{field.state.meta.errors[0]}</p>
                      )}
                    </div>
                  )}
                </form.Field>

                <form.Field name="phone_number">
                  {(field) => (
                    <div className="space-y-2">
                      <Label htmlFor={field.name}>Nomor Telepon</Label>
                      <Input
                        id={field.name}
                        type="tel"
                        value={field.state.value || ''}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                      />
                    </div>
                  )}
                </form.Field>

                <form.Field name="organization">
                  {(field) => (
                    <div className="space-y-2">
                      <Label htmlFor={field.name}>Organisasi</Label>
                      <Input
                        id={field.name}
                        value={field.state.value || ''}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                      />
                    </div>
                  )}
                </form.Field>

                <div className="flex gap-2">
                  <Button type="submit" disabled={createUser.isPending}>
                    {createUser.isPending ? 'Menyimpan...' : 'Buat Pengguna'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push('/dashboard/users')}
                  >
                    Batal
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
              </div>
        </div>
    </>
  );
}
