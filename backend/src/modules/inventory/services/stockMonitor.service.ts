import { prisma } from '../../../config/db';
import { Prisma } from '../../../generated/prisma/client';
import { globalEventBus, APP_EVENTS } from '../../../config/events';

export class StockMonitorService {
    static async checkThreshold(ingredientId: string): Promise<void> {
        try {
            const ingredient = await prisma.ingredients.findUnique({
                where: { id: ingredientId },
                select: { name: true, unit: true, low_stock_threshold: true }
            });

            if (!ingredient) return;

            const aggregateResult = await prisma.ingredientBatches.aggregate({
                where: {
                ingredient_id: ingredientId,
                quantity_remaining: { gt: 0 }
                },
                _sum: {
                quantity_remaining: true
                }
            });

            const currentStockLevel = new Prisma.Decimal(aggregateResult._sum.quantity_remaining ?? 0);
            const configuredThreshold = new Prisma.Decimal(ingredient.low_stock_threshold);

            if (currentStockLevel.lessThan(configuredThreshold)) {
                setImmediate(() => {
                    globalEventBus.emit(APP_EVENTS.LOW_STOCK_DETECTED, {
                ingredientId,
                name: ingredient.name,
                remaining: currentStockLevel.toNumber(),
                unit: ingredient.unit,
                threshold: configuredThreshold.toNumber(),
                message: `⚠️ RUNTIME LOW STOCK ALERT: [${ingredient.name}] has fallen below its custom safety margin of ${configuredThreshold} ${ingredient.unit}. Current balance: ${currentStockLevel} ${ingredient.unit}.`
                    });
                });
            }
        } catch (error) {
            console.error(`ERROR: Stock threshold monitor verification failed for ID [${ingredientId}]:`, error);
        }
    }
}