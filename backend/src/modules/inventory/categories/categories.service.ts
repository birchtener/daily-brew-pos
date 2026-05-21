import { prisma } from '../../../config/db';
import { LogCategory, LogType } from '../../../generated/prisma/client';
import { AuditService } from '../../audit/audit.service';
import { z } from 'zod';
import { CategorySchema } from './categories.validation';

export class CategoriesService {
    static async createCategory(input: z.infer<typeof CategorySchema>, userId: string) {
        const category = await prisma.category.create({
            data: {
                name: input.name,
                created_by: userId,
                updated_by: userId,
            }
        });
    
        await AuditService.log({
            message: `CATALOG: Category [${category.name}] established.`,
            category: LogCategory.category,
            type: LogType.success,
            userId
        });
    
        return category;
    }

    static async getCategory(id: string, userId: string) {
        const category = await prisma.category.findUnique({
            where: { id }
        });

        if (!category) {
            throw new Error(`Category records not found for requested ID: ${id}`);
        }

        await AuditService.log({
            message: `CATALOG: Category [${category.name}] established.`,
            category: LogCategory.category,
            type: LogType.success,
            userId
        });

        return category;
    }

    static async getCategories(userId: string) {
        const categories = await prisma.category.findMany({
            orderBy: { created_at: 'asc' }
        });

        await AuditService.log({
            message: `CATALOG: Categories established.`,
            category: LogCategory.category,
            type: LogType.success,
            userId
        });

        return categories;
    }

    static async updateCategory(id: string, input: z.infer<typeof CategorySchema>, userId: string) {
        const updatedCategory = await prisma.category.update({
            where: { id },
            data: {
                name: input.name,
                updated_by: userId,
            }
        });
        await AuditService.log({
            message: `CATALOG: Category [${updatedCategory.name}] updated.`,
            category: LogCategory.category,
            type: LogType.success,
            userId
        }); 
        return updatedCategory;
    }

    static async deleteCategory(id: string, userId: string) {
        return await prisma.$transaction(async (tx) => {
            const targetCategory = await tx.category.findUnique({
                where: { id },
                select: { name: true }
            });

            if (!targetCategory) {
                throw new Error(`Category records not found for requested ID: ${id}`);
            }

            const productsWithRecipes = await tx.product.findMany({
                where: { category_id: id },
                include: {
                    recipes: {
                        include: {
                            ingredient: true
                        }
                    }
                }
            });

            const productIds = productsWithRecipes.map(p => p.id);

            for (const product of productsWithRecipes) {
                
                for (const recipe of product.recipes) {
                    await AuditService.log({
                        message: `INVENTORY: Recipe link for Product [${product.name}] utilizing ${recipe.quantity} ${recipe.unit} of Ingredient [${recipe.ingredient.name}] dropped via Category Cascade deletion.`,
                        category: LogCategory.inventory, // Sorted into operational inventory logs
                        type: LogType.success,
                        userId
                    });
                }

                await AuditService.log({
                    message: `CATALOG: Product [${product.name}] (Price: ₱${product.price}) permanently dropped via Category Cascade deletion.`,
                    category: LogCategory.product, // Sorted into product catalog logs
                    type: LogType.success,
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

            const deletedCategory = await tx.category.delete({
                where: { id }
            });

            await AuditService.log({
                message: `CATALOG: Base Category container [${targetCategory.name}] and all its nested sub-assets successfully dropped.`,
                category: LogCategory.category,
                type: LogType.success,
                userId
            });

            return deletedCategory;
        });
    }
}