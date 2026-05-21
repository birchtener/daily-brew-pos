import { z } from 'zod';

export const RegisterSchema = z.object({
  first_name: z.string().min(3).max(20),
  last_name: z.string().min(3).max(20),
  username: z.string().min(5).max(20).regex(/^[a-zA-Z0-9_]+$/, 'Only alphanumeric chars and underscores allowed'),
  password: z.string().min(6).max(100),
  role: z.enum(['admin', 'staff']).optional(),
});

export const LoginSchema = z.object({
  username: z.string().min(5).max(20),
  password: z.string().min(6).max(100),
});