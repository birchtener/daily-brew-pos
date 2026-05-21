import { prisma } from '../../config/db';
import { z } from 'zod';
import { ConfigureRecipeSchema } from './recipe.validation';

export class RecipeService {
  static async setProductRecipe(input: z.infer<typeof ConfigureRecipeSchema>, userId: string) {
    return await prisma.$transaction(async (tx) => {
      await tx.recipes.deleteMany({
        where: { product_id: input.product_id }
      });

      const writeOperations = input.ingredients.map((item) => {
        return tx.recipes.create({
          data: {
            product_id: input.product_id,
            ingredient_id: item.ingredient_id,
            quantity: item.quantity,
            unit: item.unit,
            created_by: userId,
            updated_by: userId,
          },
        });
      });

      return await Promise.all(writeOperations);
    });
  }
}