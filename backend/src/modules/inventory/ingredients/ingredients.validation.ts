import { z } from 'zod';
import { Unit } from '../../../generated/prisma/client';

export const CreateIngredientSchema = z.object({
  name: z.string().min(1).max(50),
  unit: z.nativeEnum(Unit),
  img_path: z.preprocess((val) => {
    if (val === 'null' || val === '') return null;
    return val;
  }, z.string().max(255).nullable()).optional(),
  low_stock_threshold: z.coerce.number().min(0).default(5.000)
});

export const UpdateIngredientSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  unit: z.nativeEnum(Unit).optional(),
  img_path: z.preprocess((val) => {
    if (val === 'null' || val === '') return null;
    return val;
  }, z.string().max(255).nullable()).optional(),
  low_stock_threshold: z.coerce.number().min(0).optional()
});