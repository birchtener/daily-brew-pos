import { z } from 'zod';

export const RegisterSchema = z.object({
  first_name: z.string().min(3).max(20),
  last_name: z.string().min(3).max(20),
  username: z.string().min(5).max(20).regex(/^[a-zA-Z0-9_]+$/, 'Only alphanumeric chars and underscores allowed'),
  role: z.enum(['admin', 'staff']),
});