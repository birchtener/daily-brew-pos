import { prisma } from '../../../config/db';
import { LogCategory, LogType } from '../../../generated/prisma/client';
import { AuditService } from '../../audit/audit.service';
import { CreateProductInput, UpdateProductInput } from './products.validation';

export class ProductsService {
    static async createProduct(input: CreateProductInput, userId: string) {
        return await prisma.$transaction(async (tx) => {
        
        const newProduct = await tx.product.create({
            data: {
            name: input.name,
            price: input.price,
            category_id: input.category_id,
            img_path: input.img_path,
            created_by: userId,
            updated_by: userId
            }
        });

        if (input.ingredients && input.ingredients.length > 0) {
            const recipeCreations = input.ingredients.map((item) => {
            return tx.recipes.create({
                data: {
                product_id: newProduct.id,
                ingredient_id: item.ingredient_id,
                quantity: item.quantity,
                unit: item.unit,
                created_by: userId,
                updated_by: userId
                }
            });
            });

            await Promise.all(recipeCreations);
        }

        return await tx.product.findUnique({
            where: { id: newProduct.id },
            include: {
            category: true,
            recipes: {
                include: {
                ingredient: true
                }
            }
            }
        });
        });
    }

    static async getProduct(id: string, userId: string) {
        const product = await prisma.product.findUnique({
            where: { id }
        });

        if (!product) {
            throw new Error('Product not found');
        }

        await AuditService.log({
            message: `CATALOG: Product [${product.name}] retrieved.`,
            category: LogCategory.product,
            type: LogType.info,
            userId
        });

        return product;
    }

    static async getProducts(userId: string) {
        const products = await prisma.product.findMany();

        await AuditService.log({
            message: `CATALOG: All products retrieved.`,
            category: LogCategory.product,
            type: LogType.info,
            userId
        });

        return products;
    }

    static async updateProduct(productId: string, input: UpdateProductInput, userId: string) {
        return await prisma.$transaction(async (tx) => {
        
        await tx.product.update({
            where: { id: productId },
            data: {
            name: input.name,
            price: input.price,
            category_id: input.category_id,
            img_path: input.img_path,
            updated_by: userId
            }
        });

        if (input.ingredients) {
            
            await tx.recipes.deleteMany({
            where: { product_id: productId }
            });

            if (input.ingredients.length > 0) {
            const newRecipeRows = input.ingredients.map((item) => {
                return tx.recipes.create({
                data: {
                    product_id: productId,
                    ingredient_id: item.ingredient_id,
                    quantity: item.quantity,
                    unit: item.unit,
                    created_by: userId,
                    updated_by: userId
                }
                });
            });

            await Promise.all(newRecipeRows);
            }
        }

        return await tx.product.findUnique({
            where: { id: productId },
            include: {
            category: true,
            recipes: {
                include: {
                ingredient: true
                }
            }
            }
        });
        });
    }

    static async deleteProduct(id: string, userId: string) {
        return await prisma.$transaction(async (tx) => {
            const productWithRelations = await tx.product.findUnique({
                where: { id },
                include: {
                    recipes: {
                        include: { ingredient: true }
                    }
                }
            });

            if (!productWithRelations) {
                throw new Error('Product not found');
            }

            for (const recipe of productWithRelations.recipes) {
                await AuditService.log({
                    message: `INVENTORY: Recipe formula link mapping Ingredient [${recipe.ingredient.name}] to Product [${productWithRelations.name}] dropped via Product deletion.`,
                    category: LogCategory.inventory,
                    type: LogType.warn,
                    userId
                });
            }

            await tx.recipes.deleteMany({
                where: { product_id: id }
            });

            const deletedProduct = await tx.product.delete({
                where: { id }
            });

            await AuditService.log({
                message: `CATALOG: Product [${productWithRelations.name}] permanently deleted from active sales lines.`,
                category: LogCategory.product,
                type: LogType.warn,
                userId
            });

            return deletedProduct;
        });
    }
}