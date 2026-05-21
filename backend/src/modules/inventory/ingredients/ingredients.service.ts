import { prisma } from '../../../config/db';
import { LogCategory, LogType } from '../../../generated/prisma/client';
import { AuditService } from '../../audit/audit.service';
import { z } from 'zod';
import { CreateIngredientSchema, UpdateIngredientSchema } from './ingredients.validation';

export class IngredientsService {
    static async createIngredient(input: z.infer<typeof CreateIngredientSchema>, userId: string) {
        const ingredients = await prisma.ingredients.create({
            data: {
            ...input,
            created_by: userId,
            updated_by: userId,
            }
        });

        await AuditService.log({
            message: `CATALOG: Ingredient [${ingredients.name}] created.`,
            category: LogCategory.ingredient,
            type: LogType.success,
            userId
        });

        return ingredients;
    }

    static async getIngredient(id: string, userId: string) {
        const ingredient = await prisma.ingredients.findUnique({
            where: { id }
        });

        if (!ingredient) {
            throw new Error('Ingredient not found');
        }

        await AuditService.log({
            message: `CATALOG: Ingredient [${ingredient.name}] retrieved.`,
            category: LogCategory.ingredient,
            type: LogType.info,
            userId
        });

        return ingredient;
    }

    static async getIngredients(userId: string) {
        const ingredients = await prisma.ingredients.findMany();

        await AuditService.log({
            message: `CATALOG: All ingredients retrieved.`,
            category: LogCategory.ingredient,
            type: LogType.info,
            userId
        });

        return ingredients;
    }

    static async updateIngredient(id: string, input: z.infer<typeof UpdateIngredientSchema>, userId: string) {
        const existingIngredient = await prisma.ingredients.findUnique({
            where: { id }
        });

        if (!existingIngredient) {
            throw new Error('Ingredient not found');
        }  

        const updatedIngredient = await prisma.ingredients.update({
            where: { id },
            data: {
                ...input,
                updated_by: userId,
            }
        });

        await AuditService.log({
            message: `CATALOG: Ingredient [${updatedIngredient.name}] updated.`,
            category: LogCategory.ingredient,
            type: LogType.success,
            userId
        });

        return updatedIngredient;
    }

    static async deleteIngredient(id: string, userId: string) {
        return await prisma.$transaction(async (tx) => {
            const ingredientWithRelations = await tx.ingredients.findUnique({
                where: { id },
                include: {
                    recipes: {
                        include: { 
                            product: {
                                include: {
                                    recipes: true 
                                }
                            } 
                        }
                    },
                    batches: true
                }
            });

            if (!ingredientWithRelations) {
                throw new Error('Ingredient not found');
            }

            const productIdsToDelete: string[] = [];

            for (const recipeLink of ingredientWithRelations.recipes) {
                const linkedProduct = recipeLink.product;

                if (linkedProduct.recipes.length === 1) {
                    productIdsToDelete.push(linkedProduct.id);
                    
                    await AuditService.log({
                        message: `CATALOG: Product [${linkedProduct.name}] identified as a 1:1 mirror match. Marked for permanent deletion via Ingredient Cascade.`,
                        category: LogCategory.product,
                        type: LogType.warn,
                        userId
                    });
                } else {
                    await AuditService.log({
                        message: `INVENTORY: Recipe link for mixed product [${linkedProduct.name}] utilizing Ingredient [${ingredientWithRelations.name}] dropped via Cascade.`,
                        category: LogCategory.inventory,
                        type: LogType.warn,
                        userId
                    });
                }
            }

            for (const batch of ingredientWithRelations.batches) {
                await AuditService.log({
                    message: `INVENTORY: Stock Batch [ID: ${batch.id}] for Ingredient [${ingredientWithRelations.name}] (Remaining: ${batch.quantity_remaining}) permanently dropped via Cascade deletion.`,
                    category: LogCategory.inventory,
                    type: LogType.warn,
                    userId
                });
            }

            await tx.recipes.deleteMany({
                where: { ingredient_id: id }
            });

            if (productIdsToDelete.length > 0) {
                await tx.recipes.deleteMany({
                    where: { product_id: { in: productIdsToDelete } }
                });

                await tx.product.deleteMany({
                    where: { id: { in: productIdsToDelete } }
                });
            }

            await tx.ingredientBatches.deleteMany({
                where: { ingredient_id: id }
            });

            const deletedIngredient = await tx.ingredients.delete({
                where: { id }
            });

            await AuditService.log({
                message: `CATALOG: Ingredient [${ingredientWithRelations.name}] deleted permanently. Cleared out ${productIdsToDelete.length} mirror products, and ${ingredientWithRelations.batches.length} storage batches.`,
                category: LogCategory.ingredient,
                type: LogType.warn,
                userId
            });

            return deletedIngredient;
        });
    } 
}