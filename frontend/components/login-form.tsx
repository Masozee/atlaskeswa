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
import { authActions } from "@/store/auth-store";

/**
 * Login form validation schema
 */
const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email wajib diisi')
    .email('Format email tidak valid'),
  password: z
    .string()
    .min(1, 'Kata sandi wajib diisi')
    .min(6, 'Kata sandi minimal 6 karakter'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);

  /**
   * TanStack Form with field-level Zod validation
   * Best practice: Use form library for complex form state management
   */
  const form = useForm({
    defaultValues: {
      email: '',
      password: '',
    } as LoginFormData,
    onSubmit: async ({ value }) => {
      setSubmitError(null);

      try {
        const response = await apiClient.login(value.email, value.password);

        // Fetch user data with the new token
        const userData = await apiClient.get<{
          id: number;
          email: string;
          full_name?: string;
          role: 'ADMIN' | 'SURVEYOR' | 'VERIFIER' | 'VIEWER';
        }>('/accounts/users/me/');

        // Update auth store with tokens and user data
        authActions.login(response.access, response.refresh, {
          id: userData.id,
          email: userData.email,
          name: userData.full_name || userData.email,
          role: userData.role,
        });

        router.push('/dashboard');
      } catch (err: unknown) {
        const errorMessage = err instanceof Error
          ? err.message
          : (err as { message?: string })?.message || 'Email atau kata sandi tidak valid';
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
            <h1 className="text-2xl font-bold">Masuk ke akun Anda</h1>
            <p className="text-muted-foreground text-sm text-balance">
              Masukkan email Anda di bawah untuk masuk ke akun Anda
            </p>
          </div>
        </div>

        {/* Global form error */}
        {submitError && (
          <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg">
            {submitError}
          </div>
        )}

        {/* Email field */}
        <form.Field
          name="email"
          validators={{
            onChange: ({ value }) => {
              const result = loginSchema.shape.email.safeParse(value);
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
              {field.state.meta.isTouched && field.state.meta.errors.length > 0 && (
                <p className="text-sm text-destructive mt-1">
                  {field.state.meta.errors[0]}
                </p>
              )}
            </Field>
          )}
        </form.Field>

        {/* Password field */}
        <form.Field
          name="password"
          validators={{
            onChange: ({ value }) => {
              const result = loginSchema.shape.password.safeParse(value);
              return result.success ? undefined : result.error.issues[0]?.message;
            },
          }}
        >
          {(field) => (
            <Field>
              <div className="flex items-center">
                <FieldLabel htmlFor="password">Kata Sandi</FieldLabel>
                <a
                  href="#"
                  className="ml-auto text-sm underline-offset-4 hover:underline"
                >
                  Lupa kata sandi?
                </a>
              </div>
              <Input
                id="password"
                type="password"
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

        {/* Submit button */}
        <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
          {([canSubmit, isSubmitting]) => (
            <Field>
              <Button type="submit" disabled={!canSubmit || isSubmitting}>
                {isSubmitting ? 'Sedang masuk...' : 'Masuk'}
              </Button>
            </Field>
          )}
        </form.Subscribe>

        <FieldSeparator>Atau lanjutkan dengan</FieldSeparator>
        <Field>
          <Button variant="outline" type="button">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Masuk dengan Google
          </Button>
          <FieldDescription className="text-center">
            Belum punya akun?{" "}
            <a href="#" className="underline underline-offset-4">
              Daftar
            </a>
          </FieldDescription>
        </Field>
      </FieldGroup>
    </form>
  );
}
