import { prisma } from '../../../config/db';
import { LogCategory, LogType, Prisma } from '../../../generated/prisma/client';
import { AuditService } from '../../audit/audit.service';
import { z } from 'zod';
import { CreateIngredientSchema, UpdateIngredientSchema } from './ingredients.validation';
import { globalEventBus, APP_EVENTS } from '../../../config/events';

const createHttpError = (message: string, statusCode: number) => Object.assign(new Error(message), { statusCode });

const isKnownPrismaError = (error: unknown, code: string) =>
    error instanceof Prisma.PrismaClientKnownRequestError && error.code === code;

type AuditEntry = {
    message: string;
    category: LogCategory;
    type: LogType;
    userId: string;
};

export class IngredientsService {
    static async createIngredient(input: z.infer<typeof CreateIngredientSchema>, userId: string) {
        try {
            const ingredients = await prisma.ingredients.create({
                data: {
                    ...input,
                    created_by: userId,
                    updated_by: userId,
                }
            });

            await AuditService.log({
                message: `CATALOG: Ingredient [${ingredients.name}] created with dynamic alert threshold set to ${ingredients.low_stock_threshold} ${ingredients.unit}.`,
                category: LogCategory.ingredient,
                type: LogType.success,
                userId
            });

            setImmediate(() => {
                globalEventBus.emit(APP_EVENTS.INGREDIENTS_CHANGED);
            });

            return ingredients;
        } catch (error) {
            if (isKnownPrismaError(error, 'P2002')) {
                throw createHttpError('Validation Failure: Ingredient already exists.', 409);
            }

            throw createHttpError('Validation Failure: Unable to create ingredient.', 500);
        }
    }

    static async getIngredient(id: string, userId: string) {
        const ingredient = await prisma.ingredients.findUnique({
            where: { id },
            include: { batches: true }
        });

        if (!ingredient) {
            throw createHttpError('Validation Failure: Target resource not found.', 404);
        }

        await AuditService.log({
            message: `CATALOG: Ingredient [${ingredient?.name}] retrieved.`,
            category: LogCategory.ingredient,
            type: LogType.info,
            userId
        });

        return ingredient;
    }

    static async getIngredients(userId: string) {
        const ingredients = await prisma.ingredients.findMany({
            orderBy: { name: 'asc' },
        });

        await AuditService.log({
            message: `CATALOG: All ingredients retrieved. Total item count: ${ingredients.length}.`,
            category: LogCategory.ingredient,
            type: LogType.info,
            userId
        });

        return ingredients;
    }

    static async updateIngredient(id: string, input: z.infer<typeof UpdateIngredientSchema>, userId: string) {
        try {
            const updatedIngredient = await prisma.ingredients.update({
                where: { id },
                data: {
                    ...input,
                    updated_by: userId,
                }
            });

            await AuditService.log({
                message: `CATALOG: Ingredient [${updatedIngredient.name}] details updated successfully.`,
                category: LogCategory.ingredient,
                type: LogType.success,
                userId
            });

            setImmediate(() => {
                globalEventBus.emit(APP_EVENTS.INGREDIENTS_CHANGED);
            });

            return updatedIngredient;
        } catch (error) {
            if (isKnownPrismaError(error, 'P2025')) {
                throw createHttpError('Validation Failure: Target resource not found.', 404);
            }

            if (isKnownPrismaError(error, 'P2002')) {
                throw createHttpError('Validation Failure: Ingredient already exists.', 409);
            }

            if (error && typeof error === 'object' && 'statusCode' in error) {
                throw error;
            }

            throw createHttpError('Validation Failure: Ingredient update failed.', 500);
        }
    }

    static async deleteIngredient(id: string, userId: string) {
        const auditTrail: AuditEntry[] = [];

        try {
            const deletedIngredient = await prisma.$transaction(async (tx) => {
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
                    throw createHttpError('Validation Failure: Target resource not found.', 404);
                }

                const productIdsToDelete: string[] = [];

                for (const recipeLink of ingredientWithRelations.recipes) {
                    const linkedProduct = recipeLink.product;

                    if (linkedProduct.recipes.length === 1) {
                        productIdsToDelete.push(linkedProduct.id);
                        auditTrail.push({
                            message: `CATALOG: Product [${linkedProduct.name}] identified as a 1:1 mirror match. Marked for permanent deletion via Ingredient Cascade.`,
                            category: LogCategory.product,
                            type: LogType.warn,
                            userId
                        });
                    } else {
                        auditTrail.push({
                            message: `INVENTORY: Recipe link for mixed product [${linkedProduct.name}] utilizing Ingredient [${ingredientWithRelations.name}] dropped via Cascade.`,
                            category: LogCategory.inventory,
                            type: LogType.warn,
                            userId
                        });
                    }
                }

                for (const batch of ingredientWithRelations.batches) {
                    auditTrail.push({
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

                const deleted = await tx.ingredients.delete({
                    where: { id }
                });

                auditTrail.push({
                    message: `CATALOG: Ingredient [${ingredientWithRelations.name}] deleted permanently. Cleared out ${productIdsToDelete.length} mirror products, and ${ingredientWithRelations.batches.length} storage batches.`,
                    category: LogCategory.ingredient,
                    type: LogType.warn,
                    userId
                });

                return deleted;
            });

            for (const entry of auditTrail) {
                void AuditService.log(entry);
            }

            setImmediate(() => {
                globalEventBus.emit(APP_EVENTS.INGREDIENTS_CHANGED);
            });

            return deletedIngredient;
        } catch (error) {
            if (error && typeof error === 'object' && 'statusCode' in error) {
                throw error;
            }

            if (isKnownPrismaError(error, 'P2025')) {
                throw createHttpError('Validation Failure: Target resource not found.', 404);
            }

            throw createHttpError('Validation Failure: Ingredient deletion failed.', 500);
        }
    } 
}