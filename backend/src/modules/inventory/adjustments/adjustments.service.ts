import { prisma } from "../../../config/db";
import { LogCategory, LogType, Prisma } from "../../../generated/prisma/client";
import { AuditService } from "../../audit/audit.service";
import { StockMonitorService } from "../services/stockMonitor.service";
import { globalEventBus, APP_EVENTS } from "../../../config/events";
import { z } from "zod";
import { CreateAdjustmentSchema } from "./adjustments.validation";

const createHttpError = (message: string, statusCode: number) =>
  Object.assign(new Error(message), { statusCode });

type AuditEntry = {
  message: string;
  category: LogCategory;
  type: LogType;
  userId: string;
};

export class AdjustmentsService {
  static async getAdjustments(ingredientId?: string) {
    const where: Prisma.InventoryAdjustmentWhereInput = {};
    if (ingredientId) {
      where.ingredient_id = ingredientId;
    }

    const adjustments = await prisma.inventoryAdjustment.findMany({
      where,
      orderBy: { created_at: "desc" },
      include: {
        ingredient: {
          select: { name: true, unit: true },
        },
        batch: {
          select: {
            id: true,
            received_at: true,
            expiry: true,
            cost_per_unit: true,
          },
        },
        created_by_user: {
          select: {
            first_name: true,
            last_name: true,
            username: true,
          },
        },
      },
    });

    return adjustments;
  }

  static async createAdjustment(
    input: z.infer<typeof CreateAdjustmentSchema>,
    userId: string,
  ) {
    const auditTrail: AuditEntry[] = [];

    try {
      const result = await prisma.$transaction(async (tx) => {
        // 1. Validate ingredient exists
        const ingredient = await tx.ingredients.findUnique({
          where: { id: input.ingredient_id },
          select: { id: true, name: true, unit: true },
        });

        if (!ingredient) {
          throw createHttpError(
            "Validation Failure: Ingredient not found.",
            404,
          );
        }

        const adjustmentQuantity = new Prisma.Decimal(input.quantity);
        const isIncrease = input.direction === "increase";

        if (isIncrease && !input.batch_id) {
          throw createHttpError(
            "Validation Failure: Increasing stock requires a target batch.",
            400,
          );
        }

        // 2. Case A: Adjusting a specific batch
        if (input.batch_id) {
          const batch = await tx.ingredientBatches.findUnique({
            where: { id: input.batch_id },
            select: {
              id: true,
              ingredient_id: true,
              quantity_remaining: true,
              cost_per_unit: true,
            },
          });

          if (!batch) {
            throw createHttpError(
              "Validation Failure: Target stock batch not found.",
              404,
            );
          }

          if (batch.ingredient_id !== input.ingredient_id) {
            throw createHttpError(
              "Validation Failure: Selected batch does not belong to specified ingredient.",
              400,
            );
          }

          const available = new Prisma.Decimal(batch.quantity_remaining);
          if (!isIncrease && available.lt(adjustmentQuantity)) {
            throw createHttpError(
              `Validation Failure: Insufficient stock in target batch. Available: ${available} ${ingredient.unit}, Requested Reduction: ${adjustmentQuantity} ${ingredient.unit}.`,
              400,
            );
          }

          const updatedRemaining = isIncrease
            ? available.plus(adjustmentQuantity)
            : available.minus(adjustmentQuantity);

          // Update batch stock
          await tx.ingredientBatches.update({
            where: { id: batch.id },
            data: { quantity_remaining: updatedRemaining },
          });

          // Calculate precise cost basis lost
          const costLost = isIncrease
            ? new Prisma.Decimal(0)
            : adjustmentQuantity.times(batch.cost_per_unit);

          // Create the adjustment log record
          const adjustment = await tx.inventoryAdjustment.create({
            data: {
              ingredient_id: input.ingredient_id,
              batch_id: batch.id,
              direction: input.direction,
              quantity: adjustmentQuantity,
              cost_lost: costLost,
              reason: input.reason,
              notes: input.notes || null,
              created_by: userId,
            },
            include: {
              ingredient: { select: { name: true, unit: true } },
              batch: { select: { received_at: true, expiry: true } },
            },
          });

          auditTrail.push({
            message: `INVENTORY: Manual stock ${isIncrease ? "increase" : "reduction"} (Specific Batch) for [${ingredient.name}] — Qty: ${isIncrease ? "+" : "-"}${adjustmentQuantity} ${ingredient.unit}${isIncrease ? "" : `, Cost Lost: ₱${costLost.toFixed(2)}`}, Reason: ${input.reason.toUpperCase()}. Notes: "${input.notes || ""}"`,
            category: LogCategory.inventory,
            type: isIncrease ? LogType.success : LogType.warn,
            userId,
          });

          return [adjustment];
        } else {
          if (isIncrease) {
            throw createHttpError(
              "Validation Failure: Increasing stock requires a target batch.",
              400,
            );
          }

          // 3. Case B: Ingredient-level adjustment using FIFO
          const activeBatches = await tx.ingredientBatches.findMany({
            where: {
              ingredient_id: input.ingredient_id,
              quantity_remaining: { gt: 0 },
            },
            orderBy: { received_at: "asc" }, // FIFO: oldest batches first
          });

          const totalAvailable = activeBatches.reduce(
            (acc, b) => acc.plus(new Prisma.Decimal(b.quantity_remaining)),
            new Prisma.Decimal(0),
          );

          if (totalAvailable.lt(adjustmentQuantity)) {
            throw createHttpError(
              `Validation Failure: Insufficient stock. Total Available: ${totalAvailable} ${ingredient.unit}, Requested Reduction: ${adjustmentQuantity} ${ingredient.unit}.`,
              400,
            );
          }

          let remainingNeeded = adjustmentQuantity;
          const adjustmentsCreated = [];

          for (const batch of activeBatches) {
            if (remainingNeeded.isZero()) break;

            const batchAvailable = new Prisma.Decimal(batch.quantity_remaining);
            let quantityToDeduct: Prisma.Decimal;

            if (batchAvailable.gte(remainingNeeded)) {
              quantityToDeduct = remainingNeeded;
              remainingNeeded = new Prisma.Decimal(0);
            } else {
              quantityToDeduct = batchAvailable;
              remainingNeeded = remainingNeeded.minus(batchAvailable);
            }

            const updatedRemaining = batchAvailable.minus(quantityToDeduct);

            // Update batch remaining
            await tx.ingredientBatches.update({
              where: { id: batch.id },
              data: { quantity_remaining: updatedRemaining },
            });

            const costLost = quantityToDeduct.times(batch.cost_per_unit);

            // Create adjustment log for this batch segment
            const adjustment = await tx.inventoryAdjustment.create({
              data: {
                ingredient_id: input.ingredient_id,
                batch_id: batch.id,
                direction: input.direction,
                quantity: quantityToDeduct,
                cost_lost: costLost,
                reason: input.reason,
                notes: input.notes || null,
                created_by: userId,
              },
              include: {
                ingredient: { select: { name: true, unit: true } },
                batch: { select: { received_at: true, expiry: true } },
              },
            });

            adjustmentsCreated.push(adjustment);

            auditTrail.push({
              message: `INVENTORY: Manual stock reduction (FIFO Batch Segment) for [${ingredient.name}] — Qty: -${quantityToDeduct} ${ingredient.unit}, Cost Lost: ₱${costLost.toFixed(2)}, Reason: ${input.reason.toUpperCase()}. Batch ID: [${batch.id.slice(0, 8)}…].`,
              category: LogCategory.inventory,
              type: LogType.warn,
              userId,
            });
          }

          auditTrail.push({
            message: `INVENTORY: Manual stock reduction (FIFO Summary) for [${ingredient.name}] — Total Qty: -${adjustmentQuantity} ${ingredient.unit}, Reason: ${input.reason.toUpperCase()}. Notes: "${input.notes || ""}"`,
            category: LogCategory.inventory,
            type: LogType.warn,
            userId,
          });

          return adjustmentsCreated;
        }
      });

      // 4. Fire audit logs outside transaction
      for (const entry of auditTrail) {
        void AuditService.log(entry);
      }

      // 5. Trigger threshold checks and emit event
      void StockMonitorService.checkThreshold(input.ingredient_id);

      setImmediate(() => {
        globalEventBus.emit(APP_EVENTS.INGREDIENTS_CHANGED);
      });

      return result;
    } catch (error) {
      if (error && typeof error === "object" && "statusCode" in error) {
        throw error;
      }
      throw createHttpError(
        "Validation Failure: Stock manual adjustment failed.",
        500,
      );
    }
  }
}
