import { z } from 'zod';
import { Unit } from '../../../generated/prisma/client';

export const CreateProductSchema = z.object({
  name: z.string().min(1).max(50),
  price: z.coerce.number().positive(),
  category_id: z.string().uuid(),
  img_path: z.preprocess((val) => {
    if (val === 'null' || val === '') return null;
    return val;
  }, z.string().max(255).nullable()).optional(),

  ingredients: z.preprocess((val) => {
    if (typeof val === 'string') {
      try {
        return JSON.parse(val);
      } catch {
        return [];
      }
    }
    return val;
  }, z.array(
    z.object({
      ingredient_id: z.string().uuid("Invalid ingredient signature"),
      quantity: z.coerce.number().positive("Quantity must be a positive number"),
      unit: z.nativeEnum(Unit)
    })
  ))
});
export type CreateProductInput = z.infer<typeof CreateProductSchema>;

export const UpdateProductSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  price: z.coerce.number().positive().optional(),
  category_id: z.string().uuid().optional(),
  img_path: z.preprocess((val) => {
    if (val === 'null' || val === '') return null;
    return val;
  }, z.string().max(255).nullable()).optional(),
  
  ingredients: z.preprocess((val) => {
    if (typeof val === 'string') {
      try {
        return JSON.parse(val);
      } catch {
        return [];
      }
    }
    return val;
  }, z.array(
    z.object({
      ingredient_id: z.string().uuid(),
      quantity: z.coerce.number().positive(),
      unit: z.nativeEnum(Unit)
    })
  )).optional()
});
export type UpdateProductInput = z.infer<typeof UpdateProductSchema>;
