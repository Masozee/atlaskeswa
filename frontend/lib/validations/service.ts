/**
 * Service Validation Schemas
 * Best practice: Centralize validation schemas for reuse
 */

import { z } from 'zod';

/**
 * Create service form validation schema
 */
export const createServiceSchema = z.object({
  name: z
    .string()
    .min(1, 'Nama layanan wajib diisi')
    .max(200, 'Nama layanan maksimal 200 karakter'),
  description: z
    .string()
    .max(1000, 'Deskripsi maksimal 1000 karakter')
    .optional(),
  mtc: z
    .string()
    .min(1, 'Main Type of Care wajib diisi'),
  bsic: z
    .string()
    .min(1, 'BSIC Type wajib diisi'),
  service_type: z
    .string()
    .min(1, 'Service Type wajib diisi'),
  phone_number: z
    .string()
    .max(20, 'Nomor telepon maksimal 20 karakter')
    .optional(),
  email: z
    .string()
    .email('Format email tidak valid')
    .optional()
    .or(z.literal('')),
  website: z
    .string()
    .url('Format URL tidak valid')
    .optional()
    .or(z.literal('')),
  address: z
    .string()
    .max(500, 'Alamat maksimal 500 karakter')
    .optional(),
  city: z
    .string()
    .min(1, 'Kota wajib diisi')
    .max(100, 'Kota maksimal 100 karakter'),
  province: z
    .string()
    .min(1, 'Provinsi wajib diisi')
    .max(100, 'Provinsi maksimal 100 karakter'),
  postal_code: z
    .string()
    .max(10, 'Kode pos maksimal 10 karakter')
    .optional(),
  latitude: z
    .string()
    .optional(),
  longitude: z
    .string()
    .optional(),
  bed_capacity: z
    .string()
    .optional(),
  staff_count: z
    .string()
    .optional(),
  psychiatrist_count: z
    .string()
    .optional(),
  psychologist_count: z
    .string()
    .optional(),
  nurse_count: z
    .string()
    .optional(),
  social_worker_count: z
    .string()
    .optional(),
  operating_hours: z
    .string()
    .max(200, 'Jam operasional maksimal 200 karakter')
    .optional(),
  is_24_7: z
    .boolean()
    .optional(),
  accepts_emergency: z
    .boolean()
    .optional(),
  accepts_bpjs: z
    .boolean()
    .optional(),
  accepts_private_insurance: z
    .boolean()
    .optional(),
  funding_sources: z
    .string()
    .max(500, 'Sumber pendanaan maksimal 500 karakter')
    .optional(),
});

export type CreateServiceFormData = z.infer<typeof createServiceSchema>;
