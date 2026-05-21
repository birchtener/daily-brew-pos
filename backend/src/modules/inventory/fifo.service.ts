import { Prisma } from '../../generated/prisma/client';

interface DeductionLog {
  batch_id: string;
  quantity_deducted: Prisma.Decimal;
  cost_at_sale: Prisma.Decimal;
}

export class FIFOService {
  static async calculateFIFODeduction(
    tx: Prisma.TransactionClient,
    ingredientId: string,
    totalRequiredQuantity: number
  ): Promise<DeductionLog[]> {
    let remainingToDeduct = new Prisma.Decimal(totalRequiredQuantity);
    const deductionsApplied: DeductionLog[] = [];

    const activeBatches = await tx.ingredientBatches.findMany({
      where: {
        ingredient_id: ingredientId,
        quantity_remaining: { gt: 0 },
      },
      orderBy: {
        received_at: 'asc', 
      },
    });

    for (const batch of activeBatches) {
      if (remainingToDeduct.isZero()) break;

      const availableStock = new Prisma.Decimal(batch.quantity_remaining);
      let quantityToTake: Prisma.Decimal;

      if (availableStock.gte(remainingToDeduct)) {
        quantityToTake = remainingToDeduct;
        remainingToDeduct = new Prisma.Decimal(0);
      } else {
        quantityToTake = availableStock;
        remainingToDeduct = remainingToDeduct.minus(availableStock);
      }

      const updatedRemaining = availableStock.minus(quantityToTake);

      await tx.ingredientBatches.update({
        where: { id: batch.id },
        data: { quantity_remaining: updatedRemaining },
      });

      const structuralCostBasis = quantityToTake.times(batch.cost_per_unit);

      deductionsApplied.push({
        batch_id: batch.id,
        quantity_deducted: quantityToTake,
        cost_at_sale: structuralCostBasis,
      });
    }

    if (!remainingToDeduct.isZero()) {
      throw Object.assign(
        new Error(`STOCKOUT EXCEPTION: Insufficient raw material inventory tracking lines available for Ingredient ID [${ingredientId}]. Missing: ${remainingToDeduct.toFixed(3)} units.`),
        { statusCode: 400 }
      );
    }

    return deductionsApplied;
  }
}