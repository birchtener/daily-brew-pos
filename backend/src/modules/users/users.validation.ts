import { z } from 'zod';

export const RegisterSchema = z.object({
  first_name: z.string().min(3).max(20),
  last_name: z.string().min(3).max(20),
  username: z.string().min(5).max(20).regex(/^[a-zA-Z0-9_]+$/, 'Only alphanumeric chars and underscores allowed'),
  role: z.enum(['admin', 'staff']),
});

export const UpdateProfileSchema = z.object({
  first_name: z.string().min(3).max(20),
  last_name: z.string().min(3).max(20),
});

export const UpdatePasswordSchema = z.object({
  currentPassword: z.string().min(6).max(100),
  newPassword: z.string().min(6).max(100),
});

export const UsersListQuerySchema = z.object({
  page: z.preprocess((v) => Number(v), z.number().int().positive()).optional(),
  perPage: z.preprocess((v) => Number(v), z.number().int().positive()).optional(),
  q: z.string().min(1).max(100).optional(),
  role: z.enum(['admin', 'staff']).optional(),
});

export const AdminUpdateUserSchema = z.object({
  first_name: z.string().min(1).max(50),
  last_name: z.string().min(1).max(50),
  role: z.enum(['admin', 'staff']).optional(),
});