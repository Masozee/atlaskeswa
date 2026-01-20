/**
 * Authentication Validation Schemas
 * Best practice: Centralize validation schemas for reuse across client and server
 */

import { z } from 'zod';

/**
 * Login form validation schema
 */
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email wajib diisi')
    .email('Format email tidak valid'),
  password: z
    .string()
    .min(1, 'Kata sandi wajib diisi')
    .min(6, 'Kata sandi minimal 6 karakter'),
});

export type LoginFormData = z.infer<typeof loginSchema>;

/**
 * Signup form validation schema
 */
export const signupSchema = z
  .object({
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
      .min(8, 'Kata sandi minimal 8 karakter')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Kata sandi harus mengandung huruf besar, huruf kecil, dan angka'
      ),
    confirmPassword: z
      .string()
      .min(1, 'Konfirmasi kata sandi wajib diisi'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Kata sandi tidak cocok',
    path: ['confirmPassword'],
  });

export type SignupFormData = z.infer<typeof signupSchema>;

/**
 * Change password validation schema
 */
export const changePasswordSchema = z
  .object({
    oldPassword: z
      .string()
      .min(1, 'Kata sandi lama wajib diisi'),
    newPassword: z
      .string()
      .min(1, 'Kata sandi baru wajib diisi')
      .min(8, 'Kata sandi minimal 8 karakter')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Kata sandi harus mengandung huruf besar, huruf kecil, dan angka'
      ),
    confirmNewPassword: z
      .string()
      .min(1, 'Konfirmasi kata sandi baru wajib diisi'),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: 'Kata sandi tidak cocok',
    path: ['confirmNewPassword'],
  })
  .refine((data) => data.oldPassword !== data.newPassword, {
    message: 'Kata sandi baru harus berbeda dengan kata sandi lama',
    path: ['newPassword'],
  });

export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;
