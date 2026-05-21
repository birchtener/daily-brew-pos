import { z } from 'zod';
import { Unit } from '../../../generated/prisma/client';

export const CreateSupplierSchema = z.object({
  name: z.string().min(1).max(100),
  contact_name: z.string().max(50).optional(),
  contact_number: z.string().max(15).optional(),
});

export const UpdateSupplierSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  contact_name: z.string().max(50).optional(),
  contact_number: z.string().max(15).optional(),
});