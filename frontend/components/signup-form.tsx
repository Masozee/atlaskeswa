'use client';

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { apiClient } from "@/lib/api-client";

/**
 * Signup form validation schema
 */
const signupSchema = z.object({
  name: z
    .string()
    .min(1, 'Nama wajib diisi')
    .min(2, 'Nama minimal 2 karakter')
    .max(100, 'Nama maksimal 100 karakter'),
  email: z
    .string()
    .min(1, 'Email wajib diisi')
    .email('Format email tidak valid'),
  password: z
    .string()
    .min(1, 'Kata sandi wajib diisi')
    .min(8, 'Kata sandi minimal 8 karakter'),
  confirmPassword: z
    .string()
    .min(1, 'Konfirmasi kata sandi wajib diisi'),
});

type SignupFormData = z.infer<typeof signupSchema>;

export function SignupForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);

  /**
   * TanStack Form with field-level Zod validation
   */
  const form = useForm({
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    } as SignupFormData,
    onSubmit: async ({ value }) => {
      setSubmitError(null);

      // Check password match before submitting
      if (value.password !== value.confirmPassword) {
        setSubmitError('Kata sandi tidak cocok');
        return;
      }

      try {
        await apiClient.post('/accounts/auth/register/', {
          full_name: value.name,
          email: value.email,
          password: value.password,
          password_confirm: value.confirmPassword,
        });

        // Redirect to login after successful registration
        router.push('/login?registered=true');
      } catch (err: unknown) {
        const errorMessage = err instanceof Error
          ? err.message
          : (err as { message?: string })?.message || 'Gagal membuat akun';
        setSubmitError(errorMessage);
      }
    },
  });

  return (
    <form
      className={cn("flex flex-col gap-6", className)}
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
      {...props}
    >
      <FieldGroup>
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex size-16 items-center justify-center rounded-lg overflow-hidden relative">
            <Image
              src="/logo.png"
              alt="Logo Atlas Keswa"
              fill
              className="object-contain"
            />
          </div>
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-bold">Buat akun Anda</h1>
            <p className="text-muted-foreground text-sm text-balance">
              Isi formulir di bawah untuk membuat akun Anda
            </p>
          </div>
        </div>

        {/* Global form error */}
        {submitError && (
          <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg">
            {submitError}
          </div>
        )}

        {/* Name field */}
        <form.Field
          name="name"
          validators={{
            onChange: ({ value }) => {
              const result = signupSchema.shape.name.safeParse(value);
              return result.success ? undefined : result.error.issues[0]?.message;
            },
          }}
        >
          {(field) => (
            <Field>
              <FieldLabel htmlFor="name">Nama Lengkap</FieldLabel>
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                aria-invalid={field.state.meta.errors.length > 0}
              />
              {field.state.meta.isTouched && field.state.meta.errors.length > 0 && (
                <p className="text-sm text-destructive mt-1">
                  {field.state.meta.errors[0]}
                </p>
              )}
            </Field>
          )}
        </form.Field>

        {/* Email field */}
        <form.Field
          name="email"
          validators={{
            onChange: ({ value }) => {
              const result = signupSchema.shape.email.safeParse(value);
              return result.success ? undefined : result.error.issues[0]?.message;
            },
          }}
        >
          {(field) => (
            <Field>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input
                id="email"
                type="email"
                placeholder="contoh@email.com"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                aria-invalid={field.state.meta.errors.length > 0}
              />
              {field.state.meta.isTouched && field.state.meta.errors.length > 0 ? (
                <p className="text-sm text-destructive mt-1">
                  {field.state.meta.errors[0]}
                </p>
              ) : (
                <FieldDescription>
                  Kami akan menggunakan ini untuk menghubungi Anda. Kami tidak akan membagikan email Anda
                  kepada siapa pun.
                </FieldDescription>
              )}
            </Field>
          )}
        </form.Field>

        {/* Password field */}
        <form.Field
          name="password"
          validators={{
            onChange: ({ value }) => {
              const result = signupSchema.shape.password.safeParse(value);
              return result.success ? undefined : result.error.issues[0]?.message;
            },
          }}
        >
          {(field) => (
            <Field>
              <FieldLabel htmlFor="password">Kata Sandi</FieldLabel>
              <Input
                id="password"
                type="password"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                aria-invalid={field.state.meta.errors.length > 0}
              />
              {field.state.meta.isTouched && field.state.meta.errors.length > 0 ? (
                <p className="text-sm text-destructive mt-1">
                  {field.state.meta.errors[0]}
                </p>
              ) : (
                <FieldDescription>
                  Minimal 8 karakter.
                </FieldDescription>
              )}
            </Field>
          )}
        </form.Field>

        {/* Confirm Password field */}
        <form.Field
          name="confirmPassword"
          validators={{
            onChangeListenTo: ['password'],
            onChange: ({ value, fieldApi }) => {
              const password = fieldApi.form.getFieldValue('password');
              if (value.length === 0) {
                return 'Konfirmasi kata sandi wajib diisi';
              }
              if (value !== password) {
                return 'Kata sandi tidak cocok';
              }
              return undefined;
            },
          }}
        >
          {(field) => (
            <Field>
              <FieldLabel htmlFor="confirm-password">Konfirmasi Kata Sandi</FieldLabel>
              <Input
                id="confirm-password"
                type="password"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                aria-invalid={field.state.meta.errors.length > 0}
              />
              {field.state.meta.isTouched && field.state.meta.errors.length > 0 ? (
                <p className="text-sm text-destructive mt-1">
                  {field.state.meta.errors[0]}
                </p>
              ) : (
                <FieldDescription>Silakan konfirmasi kata sandi Anda.</FieldDescription>
              )}
            </Field>
          )}
        </form.Field>

        {/* Submit button */}
        <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
          {([canSubmit, isSubmitting]) => (
            <Field>
              <Button type="submit" disabled={!canSubmit || isSubmitting}>
                {isSubmitting ? 'Membuat akun...' : 'Buat Akun'}
              </Button>
            </Field>
          )}
        </form.Subscribe>

        <FieldSeparator>Atau lanjutkan dengan</FieldSeparator>
        <Field>
          <Button variant="outline" type="button">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
              <path
                d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"
                fill="currentColor"
              />
            </svg>
            Daftar dengan GitHub
          </Button>
          <FieldDescription className="px-6 text-center">
            Sudah punya akun?{" "}
            <a href="/login" className="underline underline-offset-4">
              Masuk
            </a>
          </FieldDescription>
        </Field>
      </FieldGroup>
    </form>
  );
}
