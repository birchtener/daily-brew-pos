import { z } from 'zod';
import { Unit } from '../../generated/prisma/client';

export const RecipeItemComponentSchema = z.object({
  ingredient_id: z.string().uuid(),
  quantity: z.number().positive(),
  unit: z.nativeEnum(Unit),
});

export const ConfigureRecipeSchema = z.object({
  product_id: z.string().uuid(),
  ingredients: z.array(RecipeItemComponentSchema).min(1),
});