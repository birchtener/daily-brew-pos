import { prisma } from '../../../config/db';
import { LogCategory, LogType, Prisma } from '../../../generated/prisma/client';
import { AuditService } from '../../audit/audit.service';
import { z } from 'zod';
import { CategorySchema } from './categories.validation';

const createHttpError = (message: string, statusCode: number) => Object.assign(new Error(message), { statusCode });

const isKnownPrismaError = (error: unknown, code: string) =>
    error instanceof Prisma.PrismaClientKnownRequestError && error.code === code;

type AuditEntry = {
    message: string;
    category: LogCategory;
    type: LogType;
    userId: string;
};

export class CategoriesService {
    static async createCategory(input: z.infer<typeof CategorySchema>, userId: string) {
        try {
            const category = await prisma.category.create({
                data: {
                    name: input.name,
                    created_by: userId,
                    updated_by: userId,
                }
            });

            void AuditService.log({
                message: `CATALOG: Category [${category.name}] established.`,
                category: LogCategory.category,
                type: LogType.success,
                userId
            });

            return category;
        } catch (error) {
            if (isKnownPrismaError(error, 'P2002')) {
                throw createHttpError('Validation Failure: Category already exists.', 409);
            }

            throw createHttpError('Validation Failure: Category creation failed.', 500);
        }
    }

    static async getCategory(id: string, userId: string) {
        const category = await prisma.category.findUnique({
            where: { id }
        });

        if (!category) {
            throw createHttpError('Validation Failure: Target resource not found.', 404);
        }

        void AuditService.log({
            message: `CATALOG: Category [${category.name}] established.`,
            category: LogCategory.category,
            type: LogType.success,
            userId
        });

        return category;
    }

    static async getCategories(userId: string) {
        const categories = await prisma.category.findMany({
            orderBy: { name: 'asc' }
        });

        void AuditService.log({
            message: `CATALOG: Categories established.`,
            category: LogCategory.category,
            type: LogType.success,
            userId
        });

        return categories;
    }

    static async updateCategory(id: string, input: z.infer<typeof CategorySchema>, userId: string) {
        try {
            const updatedCategory = await prisma.category.update({
                where: { id },
                data: {
                    name: input.name,
                    updated_by: userId,
                }
            });

            void AuditService.log({
                message: `CATALOG: Category [${updatedCategory.name}] updated.`,
                category: LogCategory.category,
                type: LogType.success,
                userId
            });

            return updatedCategory;
        } catch (error) {
            if (isKnownPrismaError(error, 'P2025')) {
                throw createHttpError('Validation Failure: Target resource not found.', 404);
            }

            if (isKnownPrismaError(error, 'P2002')) {
                throw createHttpError('Validation Failure: Category already exists.', 409);
            }

            throw createHttpError('Validation Failure: Category update failed.', 500);
        }
    }

    static async deleteCategory(id: string, userId: string) {
        const auditTrail: AuditEntry[] = [];

        try {
            const deletedCategory = await prisma.$transaction(async (tx) => {
                const targetCategory = await tx.category.findUnique({
                    where: { id },
                    select: { name: true }
                });

                if (!targetCategory) {
                    throw createHttpError('Validation Failure: Target resource not found.', 404);
                }

                const productsWithRecipes = await tx.product.findMany({
                    where: { category_id: id },
                    include: {
                        recipes: {
                            include: {
                                ingredient: true
                            }
                        }
                    },
                    orderBy: { name: 'asc' }
                });

                const productIds = productsWithRecipes.map((product) => product.id);

                for (const product of productsWithRecipes) {
                    for (const recipe of product.recipes) {
                        auditTrail.push({
                            message: `INVENTORY: Recipe link for Product [${product.name}] utilizing ${recipe.quantity} ${recipe.unit} of Ingredient [${recipe.ingredient.name}] dropped via Category Cascade deletion.`,
                            category: LogCategory.inventory,
                            type: LogType.warn,
                            userId
                        });
                    }

                    auditTrail.push({
                        message: `CATALOG: Product [${product.name}] (Price: ₱${product.price}) permanently dropped via Category Cascade deletion.`,
                        category: LogCategory.product,
                        type: LogType.warn,
                        userId
                    });
                }

                if (productIds.length > 0) {
                    await tx.recipes.deleteMany({
                        where: { product_id: { in: productIds } }
                    });

                    await tx.product.deleteMany({
                        where: { id: { in: productIds } }
                    });
                }

                const deleted = await tx.category.delete({
                    where: { id }
                });

                auditTrail.push({
                    message: `CATALOG: Base Category container [${targetCategory.name}] and all its nested sub-assets successfully dropped.`,
                    category: LogCategory.category,
                    type: LogType.warn,
                    userId
                });

                return deleted;
            });

            for (const entry of auditTrail) {
                void AuditService.log(entry);
            }

            return deletedCategory;
        } catch (error) {
            if (error && typeof error === 'object' && 'statusCode' in error) {
                throw error;
            }

            if (isKnownPrismaError(error, 'P2025')) {
                throw createHttpError('Validation Failure: Target resource not found.', 404);
            }

            if (isKnownPrismaError(error, 'P2003')) {
                throw createHttpError('Validation Failure: Category cannot be deleted while dependent records exist.', 409);
            }

            throw createHttpError('Validation Failure: Category deletion failed.', 500);
        }
    }
}