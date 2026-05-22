import { z } from 'zod';
import { Unit } from '../../../generated/prisma/client';

export const CreateProductSchema = z.object({
  name: z.string().min(1).max(50),
  price: z.number().positive(),
  category_id: z.string().uuid(),
  img_path: z.string().max(255).nullable().optional(),

  ingredients: z.array(
    z.object({
      ingredient_id: z.string().uuid("Invalid ingredient signature"),
      quantity: z.number().positive("Quantity must be a positive number"),
      unit: z.nativeEnum(Unit)
    })
  )
});
export type CreateProductInput = z.infer<typeof CreateProductSchema>;

export const UpdateProductSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  price: z.number().positive().optional(),
  category_id: z.string().uuid().optional(),
  img_path: z.string().max(255).nullable().optional(),
  
  ingredients: z.array(
    z.object({
      ingredient_id: z.string().uuid(),
      quantity: z.number().positive(),
      unit: z.nativeEnum(Unit)
    })
  ).optional()
});
export type UpdateProductInput = z.infer<typeof UpdateProductSchema>;
