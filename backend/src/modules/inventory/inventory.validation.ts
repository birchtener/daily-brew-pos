import { z } from 'zod';
import { Unit } from '../../generated/prisma/client';

export const CreateCategorySchema = z.object({
  name: z.string().min(1).max(50),
});

export const CreateProductSchema = z.object({
  name: z.string().min(1).max(50),
  price: z.number().positive(),
  category_id: z.string().uuid(),
  img_path: z.string().max(255).optional(),
});

export const CreateSupplierSchema = z.object({
  name: z.string().min(1).max(100),
  contact_name: z.string().max(50).optional(),
  contact_number: z.string().max(15).optional(),
});

export const CreateIngredientSchema = z.object({
  name: z.string().min(1).max(50),
  unit: z.nativeEnum(Unit),
  img_path: z.string().max(50).optional(),
});

export const IncomingBatchItemSchema = z.object({
  ingredient_id: z.string().uuid(),
  quantity_received: z.number().positive(),
  cost_per_unit: z.number().nonnegative(),
  expiry: z.string().datetime(),
});

export const SupplierOrderSchema = z.object({
  supplier_id: z.string().uuid(),
  batches: z.array(IncomingBatchItemSchema).min(1),
});