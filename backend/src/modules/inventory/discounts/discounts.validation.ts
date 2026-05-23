import { z } from 'zod';

export const DiscountSchema = z.object({
  code: z
    .string()
    .min(1)
    .max(50)
    .regex(/^[A-Za-z0-9_-]+$/, 'Discount code must contain only alphanumeric characters, hyphens, or underscores.')
    .transform((val) => val.toUpperCase().trim()),
  name: z.string().min(1).max(50).trim(),
  percentage: z.number().int().min(1).max(100),
});
