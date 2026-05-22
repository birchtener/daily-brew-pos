import { prisma } from '../../../config/db';
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

            const currentStockLevel = Number(aggregateResult._sum.quantity_remaining) || 0;
            const configuredThreshold = Number(ingredient.low_stock_threshold);

            if (currentStockLevel < configuredThreshold) {
                
                globalEventBus.emit(APP_EVENTS.LOW_STOCK_DETECTED, {
                ingredientId,
                name: ingredient.name,
                remaining: currentStockLevel,
                unit: ingredient.unit,
                threshold: configuredThreshold,
                message: `⚠️ RUNTIME LOW STOCK ALERT: [${ingredient.name}] has fallen below its custom safety margin of ${configuredThreshold} ${ingredient.unit}. Current balance: ${currentStockLevel} ${ingredient.unit}.`
                });
            }
        } catch (error) {
            console.error(`ERROR: Stock threshold monitor verification failed for ID [${ingredientId}]:`, error);
        }
    }
}