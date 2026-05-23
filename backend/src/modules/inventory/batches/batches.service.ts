import { prisma } from '../../../config/db';
import { LogCategory, LogType, Prisma } from '../../../generated/prisma/client';
import { AuditService } from '../../audit/audit.service';
import { StockMonitorService } from '../services/stockMonitor.service';
import { globalEventBus, APP_EVENTS } from '../../../config/events';
import { z } from 'zod';
import { ReceiveStockSchema } from './batches.validation';

const createHttpError = (message: string, statusCode: number) => Object.assign(new Error(message), { statusCode });

const isKnownPrismaError = (error: unknown, code: string) =>
    error instanceof Prisma.PrismaClientKnownRequestError && error.code === code;

type AuditEntry = {
    message: string;
    category: LogCategory;
    type: LogType;
    userId: string;
};

export class BatchesService {
    static async getBatches(ingredientId: string | undefined, userId: string) {
        const where: Prisma.IngredientBatchesWhereInput = {};
        if (ingredientId) {
            where.ingredient_id = ingredientId;
        }

        const batches = await prisma.ingredientBatches.findMany({
            where,
            orderBy: { received_at: 'desc' },
            include: {
                ingredient: {
                    select: { name: true, unit: true },
                },
                supplier_order: {
                    select: {
                        id: true,
                        ordered_at: true,
                        supplier: {
                            select: { name: true },
                        },
                    },
                },
            },
        });

        return batches;
    }

    static async receiveStock(input: z.infer<typeof ReceiveStockSchema>, userId: string) {
        const auditTrail: AuditEntry[] = [];

        try {
            const result = await prisma.$transaction(async (tx) => {
                // 1. Validate supplier exists
                const supplier = await tx.suppliers.findUnique({
                    where: { id: input.supplier_id },
                    select: { id: true, name: true },
                });

                if (!supplier) {
                    throw createHttpError('Validation Failure: Supplier not found.', 404);
                }

                // 2. Validate all ingredient IDs exist
                const ingredientIds = input.items.map((item) => item.ingredient_id);
                const ingredients = await tx.ingredients.findMany({
                    where: { id: { in: ingredientIds } },
                    select: { id: true, name: true, unit: true },
                });

                const ingredientMap = new Map(ingredients.map((ing) => [ing.id, ing]));

                for (const item of input.items) {
                    if (!ingredientMap.has(item.ingredient_id)) {
                        throw createHttpError(
                            `Validation Failure: Ingredient with ID [${item.ingredient_id}] not found.`,
                            404
                        );
                    }
                }

                // 3. Create SupplierOrder
                const supplierOrder = await tx.supplierOrders.create({
                    data: {
                        supplier_id: input.supplier_id,
                        ordered_by: userId,
                    },
                });

                // 4. Create IngredientBatch rows
                const createdBatches = [];

                for (const item of input.items) {
                    const ingredient = ingredientMap.get(item.ingredient_id)!;

                    const batch = await tx.ingredientBatches.create({
                        data: {
                            ingredient_id: item.ingredient_id,
                            supplier_order_id: supplierOrder.id,
                            quantity_received: item.quantity_received,
                            quantity_remaining: item.quantity_received,
                            cost_per_unit: item.cost_per_unit,
                            expiry: item.expiry,
                        },
                    });

                    createdBatches.push(batch);

                    auditTrail.push({
                        message: `INVENTORY: Stock batch received for [${ingredient.name}] — Qty: ${item.quantity_received} ${ingredient.unit}, Cost/Unit: ₱${item.cost_per_unit}, Expiry: ${new Date(item.expiry).toLocaleDateString()}. Supplier: [${supplier.name}].`,
                        category: LogCategory.inventory,
                        type: LogType.success,
                        userId,
                    });
                }

                auditTrail.push({
                    message: `INVENTORY: Delivery manifest from [${supplier.name}] processed. ${input.items.length} line item(s) received under Order [${supplierOrder.id.slice(0, 8)}…].`,
                    category: LogCategory.inventory,
                    type: LogType.success,
                    userId,
                });

                return { supplierOrder, batches: createdBatches };
            });

            // 5. Fire audit logs outside transaction
            for (const entry of auditTrail) {
                void AuditService.log(entry);
            }

            // 6. Check thresholds & emit events
            const uniqueIngredientIds = [...new Set(input.items.map((i) => i.ingredient_id))];
            for (const ingredientId of uniqueIngredientIds) {
                void StockMonitorService.checkThreshold(ingredientId);
            }

            setImmediate(() => {
                globalEventBus.emit(APP_EVENTS.INGREDIENTS_CHANGED);
            });

            return result;
        } catch (error) {
            if (error && typeof error === 'object' && 'statusCode' in error) {
                throw error;
            }

            throw createHttpError('Validation Failure: Stock receiving failed.', 500);
        }
    }

    static async deleteBatch(id: string, userId: string) {
        const auditTrail: AuditEntry[] = [];

        try {
            const deletedBatch = await prisma.$transaction(async (tx) => {
                const batch = await tx.ingredientBatches.findUnique({
                    where: { id },
                    include: {
                        ingredient: { select: { name: true, unit: true } },
                        stock_deductions: { select: { id: true }, take: 1 },
                    },
                });

                if (!batch) {
                    throw createHttpError('Validation Failure: Target batch not found.', 404);
                }

                // Guard: can't delete if any deductions exist
                if (batch.stock_deductions.length > 0) {
                    throw createHttpError(
                        'Validation Failure: Cannot delete batch — it has linked FIFO deductions from completed orders.',
                        409
                    );
                }

                // Guard: can't delete if partially consumed
                const received = new Prisma.Decimal(batch.quantity_received);
                const remaining = new Prisma.Decimal(batch.quantity_remaining);

                if (!received.equals(remaining)) {
                    throw createHttpError(
                        'Validation Failure: Cannot delete batch — stock has been partially consumed.',
                        409
                    );
                }

                const deleted = await tx.ingredientBatches.delete({
                    where: { id },
                });

                auditTrail.push({
                    message: `INVENTORY: Unused stock batch for [${batch.ingredient.name}] (Qty: ${batch.quantity_received} ${batch.ingredient.unit}) permanently removed.`,
                    category: LogCategory.inventory,
                    type: LogType.warn,
                    userId,
                });

                return deleted;
            });

            for (const entry of auditTrail) {
                void AuditService.log(entry);
            }

            setImmediate(() => {
                globalEventBus.emit(APP_EVENTS.INGREDIENTS_CHANGED);
            });

            return deletedBatch;
        } catch (error) {
            if (error && typeof error === 'object' && 'statusCode' in error) {
                throw error;
            }

            if (isKnownPrismaError(error, 'P2025')) {
                throw createHttpError('Validation Failure: Target batch not found.', 404);
            }

            throw createHttpError('Validation Failure: Batch deletion failed.', 500);
        }
    }
}
