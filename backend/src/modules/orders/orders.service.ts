import { prisma } from '../../config/db';
import { FIFOService } from '../inventory/services/fifo.service';
import { LogCategory, LogType, Prisma } from '../../generated/prisma/client';
import { AuditService } from '../audit/audit.service';
import { z } from 'zod';
import { CreateOrderSchema, FinalizeParkedOrderSchema } from './orders.validation';
import { StockMonitorService } from '../inventory/services/stockMonitor.service';

const createHttpError = (message: string, statusCode: number) => Object.assign(new Error(message), { statusCode });

export class OrdersService {
  static async processOrder(input: z.infer<typeof CreateOrderSchema>, userId: string) {
    const ingredientsToScan = new Set<string>();

    try {
      const orderResult = await prisma.$transaction(async (tx) => {
        const productIds = input.items.map((item) => item.product_id);
        const targetProducts = await tx.product.findMany({ where: { id: { in: productIds } } });

        let subTotal = new Prisma.Decimal(0);
        const processingLineItems = input.items.map((cartItem) => {
          const prod = targetProducts.find((product) => product.id === cartItem.product_id);

          if (!prod) {
            throw createHttpError(`Validation Failure: Product [${cartItem.product_id}] not found.`, 404);
          }

          const lineSubTotal = new Prisma.Decimal(prod.price).times(cartItem.quantity);
          subTotal = subTotal.plus(lineSubTotal);

          return {
            product_id: cartItem.product_id,
            quantity: cartItem.quantity,
            price: prod.price,
            sub_total: lineSubTotal
          };
        });

        let discountPercentage = 0;
        if (input.discount_code) {
          const promo = await tx.discount.findUnique({ where: { code: input.discount_code } });
          if (promo) discountPercentage = promo.percentage;
        }

        const totalDeductionMultiplier = new Prisma.Decimal(1 - discountPercentage / 100);
        const calculatedTotal = subTotal.times(totalDeductionMultiplier);

        const createdOrder = await tx.orders.create({
          data: {
            discount_code: input.discount_code || null,
            sub_total: subTotal,
            total: calculatedTotal,
            order_status: input.park ? 'parked' : 'completed',
            created_by: userId,
          }
        });

        for (const item of processingLineItems) {
          const createdLine = await tx.orderItems.create({
            data: {
              order_id: createdOrder.id,
              product_id: item.product_id,
              quantity: item.quantity,
              price: item.price,
              sub_total: item.sub_total
            }
          });

          if (!input.park) {
            await this.executeStockDeductionLoop(tx, createdLine.id, item.product_id, item.quantity, ingredientsToScan);
          }
        }

        if (!input.park && input.payment_method) {
          await tx.payments.create({
            data: {
              order_id: createdOrder.id,
              amount: calculatedTotal,
              method: input.payment_method
            }
          });
        }

        return {
          order: createdOrder,
          total: calculatedTotal,
        };
      });

      void AuditService.log({
        message: `POS SALE: Order [${orderResult.order.id}] saved with state context [${orderResult.order.order_status.toUpperCase()}]. Total: $${orderResult.total.toFixed(2)}.`,
        category: LogCategory.order,
        type: LogType.success,
        userId
      });

      if (!input.park) {
        this.queueThresholdChecks(ingredientsToScan);
      }

      return orderResult.order;
    } catch (error) {
      if (error && typeof error === 'object' && 'statusCode' in error) {
        throw error;
      }

      throw createHttpError('Validation Failure: Order processing failed.', 500);
    }
  }

  static async checkoutParkedOrder(orderId: string, input: z.infer<typeof FinalizeParkedOrderSchema>, userId: string) {
    const ingredientsToScan = new Set<string>();

    try {
      const updatedOrder = await prisma.$transaction(async (tx) => {
        const activeOrder = await tx.orders.findUnique({
          where: { id: orderId },
          include: { items: true }
        });

        if (!activeOrder || activeOrder.order_status !== 'parked') {
          throw createHttpError('Access Failure: Target order reference unavailable or already finalized.', 400);
        }

        await tx.orderItems.deleteMany({ where: { order_id: orderId } });

        const productIds = input.items.map((item) => item.product_id);
        const targetProducts = await tx.product.findMany({ where: { id: { in: productIds } } });

        let subTotal = new Prisma.Decimal(0);
        const newlyMappedLineItems = input.items.map((cartItem) => {
          const prod = targetProducts.find((product) => product.id === cartItem.product_id);

          if (!prod) {
            throw createHttpError(`Validation Failure: Product [${cartItem.product_id}] not found.`, 404);
          }

          const lineSubTotal = new Prisma.Decimal(prod.price).times(cartItem.quantity);
          subTotal = subTotal.plus(lineSubTotal);

          return {
            product_id: cartItem.product_id,
            quantity: cartItem.quantity,
            price: prod.price,
            sub_total: lineSubTotal
          };
        });

        let discountPercentage = 0;
        if (input.discount_code) {
          const promo = await tx.discount.findUnique({ where: { code: input.discount_code } });
          if (promo) discountPercentage = promo.percentage;
        }

        const calculatedTotal = subTotal.times(new Prisma.Decimal(1 - discountPercentage / 100));

        const finalizedOrder = await tx.orders.update({
          where: { id: orderId },
          data: {
            discount_code: input.discount_code || null,
            sub_total: subTotal,
            total: calculatedTotal,
            order_status: 'completed'
          }
        });

        for (const item of newlyMappedLineItems) {
          const createdLine = await tx.orderItems.create({
            data: {
              order_id: finalizedOrder.id,
              product_id: item.product_id,
              quantity: item.quantity,
              price: item.price,
              sub_total: item.sub_total
            }
          });

          await this.executeStockDeductionLoop(tx, createdLine.id, item.product_id, item.quantity, ingredientsToScan);
        }

        await tx.payments.create({
          data: {
            order_id: finalizedOrder.id,
            amount: calculatedTotal,
            method: input.payment_method
          }
        });

        return {
          order: finalizedOrder,
          total: calculatedTotal,
        };
      });

      void AuditService.log({
        message: `POS SETTLED: Parked Order [${orderId}] successfully processed and settled via Method [${input.payment_method}].`,
        category: LogCategory.order,
        type: LogType.success,
        userId
      });

      this.queueThresholdChecks(ingredientsToScan);

      return updatedOrder.order;
    } catch (error) {
      if (error && typeof error === 'object' && 'statusCode' in error) {
        throw error;
      }

      throw createHttpError('Validation Failure: Parked order settlement failed.', 500);
    }
  }

  private static async executeStockDeductionLoop(
    tx: Prisma.TransactionClient,
    orderItemId: string,
    productId: string,
    orderQuantity: number,
    ingredientsSet: Set<string>
  ) {
    const productRecipe = await tx.recipes.findMany({ where: { product_id: productId } });

    for (const step of productRecipe) {
      const totalNeededVolume = new Prisma.Decimal(step.quantity).times(orderQuantity).toNumber();

      ingredientsSet.add(step.ingredient_id);

      const batchAllocations = await FIFOService.calculateFIFODeduction(tx, step.ingredient_id, totalNeededVolume);

      for (const allocation of batchAllocations) {
        await tx.orderItemStockDeductions.create({
          data: {
            order_item_id: orderItemId,
            batch_id: allocation.batch_id,
            quantity_deducted: allocation.quantity_deducted,
            cost_at_sale: allocation.cost_at_sale
          }
        });
      }
    }
  }

  private static queueThresholdChecks(ingredientIds: Set<string>) {
    for (const ingredientId of ingredientIds) {
      setImmediate(() => {
        void StockMonitorService.checkThreshold(ingredientId).catch((err) =>
          console.error(`BACKGROUND WORKER CRASH: Threshold verify failed for Ingredient [${ingredientId}]:`, err)
        );
      });
    }
  }

  static async getParkedOrders() {
    return await prisma.orders.findMany({
      where: { order_status: 'parked' },
      include: { items: { include: { product: true } } },
      orderBy: { created_at: 'desc' }
    });
  }

  static async getCompletedOrders() {
    return await prisma.orders.findMany({
      where: { order_status: 'completed' },
      include: { 
        items: { include: { product: true } },
        payment: true
      },
      orderBy: { created_at: 'desc' }
    });
  }

  static async voidOrder(orderId: string, userId: string) {
    const ingredientsToScan = new Set<string>();

    try {
      const voidedOrder = await prisma.$transaction(async (tx) => {
        const targetOrder = await tx.orders.findUnique({
          where: { id: orderId },
          include: {
            items: {
              include: {
                stock_deductions: {
                  include: {
                    batch: true
                  }
                }
              }
            }
          }
        });

        if (!targetOrder || targetOrder.order_status === 'cancelled') {
          throw createHttpError('Access Failure: Target order reference unavailable or already cancelled.', 400);
        }

        if (targetOrder.order_status === 'completed') {
          for (const item of targetOrder.items) {
            for (const deduction of item.stock_deductions) {
              const currentRemaining = new Prisma.Decimal(deduction.batch.quantity_remaining);
              const updatedRemaining = currentRemaining.plus(deduction.quantity_deducted);

              await tx.ingredientBatches.update({
                where: { id: deduction.batch_id },
                data: { quantity_remaining: updatedRemaining }
              });

              ingredientsToScan.add(deduction.batch.ingredient_id);
            }
          }
        }

        const updated = await tx.orders.update({
          where: { id: orderId },
          data: { order_status: 'cancelled' }
        });

        return updated;
      });

      void AuditService.log({
        message: `POS ORDER VOIDED: Order [${orderId}] has been voided.`,
        category: LogCategory.order,
        type: LogType.warn,
        userId
      });

      this.queueThresholdChecks(ingredientsToScan);

      return voidedOrder;
    }  catch (error) {
      if (error && typeof error === 'object' && 'statusCode' in error) {
        throw error;
      }

      throw createHttpError('Validation Failure: Order voiding failed.', 500);
    }
  }

  static async deleteParkedOrder(orderId: string, userId: string) {
    try {
      const targetOrder = await prisma.orders.findUnique({ 
        where: { id: orderId, order_status: 'parked' }
      });

      if (!targetOrder) {
        throw createHttpError('Access Failure: Target order reference unavailable.', 400);
      }

      await prisma.orderItems.deleteMany({ where: { order_id: orderId } });

      const deleted = await prisma.orders.delete({
        where: { id: orderId }
      });

      void AuditService.log({
        message: `POS PARKED ORDER DELETED: Parked Order [${orderId}] permanently removed from system without sale completion.`,
        category: LogCategory.order,
        type: LogType.warn,
        userId
      });

      return deleted;
    } catch (error) {
      if (error && typeof error === 'object' && 'statusCode' in error) {
        throw error;
      }

      throw createHttpError('Validation Failure: Failed to delete order.', 500);
    }
  }

  static async getCancelledOrders() {
    return await prisma.orders.findMany({
      where: { order_status: 'cancelled' },
      include: { items: { include: { product: true } } },
      orderBy: { created_at: 'desc' }
    });
  }
}