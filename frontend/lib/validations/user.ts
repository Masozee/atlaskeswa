/**
 * User Validation Schemas
 * Best practice: Centralize validation schemas for reuse
 */

import { z } from 'zod';

/**
 * Base schema for field-level validation (without refinements)
 */
export const createUserBaseSchema = z.object({
  email: z
    .string()
    .min(1, 'Email wajib diisi')
    .email('Format email tidak valid'),
  password: z
    .string()
    .min(1, 'Kata sandi wajib diisi')
    .min(8, 'Kata sandi minimal 8 karakter'),
  password_confirm: z
    .string()
    .min(1, 'Konfirmasi kata sandi wajib diisi'),
  first_name: z
    .string()
    .max(100, 'Nama depan maksimal 100 karakter')
    .optional(),
  last_name: z
    .string()
    .max(100, 'Nama belakang maksimal 100 karakter')
    .optional(),
  role: z
    .enum(['ADMIN', 'STAFF', 'VIEWER', 'SURVEYOR', 'VERIFIER'], {
      errorMap: () => ({ message: 'Role tidak valid' }),
    }),
  phone_number: z
    .string()
    .max(20, 'Nomor telepon maksimal 20 karakter')
    .optional(),
  organization: z
    .string()
    .max(200, 'Organisasi maksimal 200 karakter')
    .optional(),
});

/**
 * Create user form validation schema (with password confirmation check)
 */
export const createUserSchema = createUserBaseSchema
  .refine((data) => data.password === data.password_confirm, {
    message: 'Kata sandi tidak cocok',
    path: ['password_confirm'],
  });

export type CreateUserFormData = z.infer<typeof createUserSchema>;
