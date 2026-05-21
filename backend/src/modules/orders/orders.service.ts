import { prisma } from '../../config/db';
import { FIFOService } from '../inventory/fifo.service';
import { LogCategory, LogType, Prisma } from '../../generated/prisma/client';
import { AuditService } from '../audit/audit.service';
import { z } from 'zod';
import { CreateOrderSchema, FinalizeParkedOrderSchema } from './orders.validation';

export class OrdersService {
  static async processOrder(input: z.infer<typeof CreateOrderSchema>, userId: string) {
    return await prisma.$transaction(async (tx) => {
      const productIds = input.items.map(i => i.product_id);
      const targetProducts = await tx.product.findMany({ where: { id: { in: productIds } } });

      let subTotal = new Prisma.Decimal(0);
      const processingLineItems = input.items.map((cartItem) => {
        const prod = targetProducts.find(p => p.id === cartItem.product_id);
        if (!prod) throw Object.assign(new Error(`Validation Failure: Product [${cartItem.product_id}] not found.`), { statusCode: 404 });
        
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

      const order = await tx.orders.create({
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
            order_id: order.id,
            product_id: item.product_id,
            quantity: item.quantity,
            price: item.price,
            sub_total: item.sub_total
          }
        });

        if (!input.park) {
          await this.executeStockDeductionLoop(tx, createdLine.id, item.product_id, item.quantity);
        }
      }

      await AuditService.log({
        message: `POS SALE: Order [${order.id}] saved with state context [${order.order_status.toUpperCase()}]. Total: $${calculatedTotal.toFixed(2)}.`,
        category: LogCategory.order,
        type: LogType.success,
        userId
      });

      return order;
    });
  }

  static async checkoutParkedOrder(orderId: string, input: z.infer<typeof FinalizeParkedOrderSchema>, userId: string) {
    return await prisma.$transaction(async (tx) => {
      const activeOrder = await tx.orders.findUnique({
        where: { id: orderId },
        include: { items: true }
      });

      if (!activeOrder || activeOrder.order_status !== 'parked') {
        throw Object.assign(new Error('Access Failure: Target order reference unavailable or already finalized.'), { statusCode: 400 });
      }

      await tx.orderItems.deleteMany({ where: { order_id: orderId } });

      const productIds = input.items.map(i => i.product_id);
      const targetProducts = await tx.product.findMany({ where: { id: { in: productIds } } });

      let subTotal = new Prisma.Decimal(0);
      const newlyMappedLineItems = input.items.map((cartItem) => {
        const prod = targetProducts.find(p => p.id === cartItem.product_id);
        if (!prod) throw Object.assign(new Error(`Product validation crash: [${cartItem.product_id}].`), { statusCode: 404 });
        
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

      const updatedOrder = await tx.orders.update({
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
            order_id: updatedOrder.id,
            product_id: item.product_id,
            quantity: item.quantity,
            price: item.price,
            sub_total: item.sub_total
          }
        });

        await this.executeStockDeductionLoop(tx, createdLine.id, item.product_id, item.quantity);
      }

      await tx.payments.create({
        data: {
          order_id: updatedOrder.id,
          amount: calculatedTotal,
          method: input.payment_method
        }
      });

      await AuditService.log({
        message: `POS SETTLED: Parked Order [${orderId}] successfully processed and settled via Method [${input.payment_method}].`,
        category: LogCategory.order,
        type: LogType.success,
        userId
      });

      return updatedOrder;
    });
  }

  private static async executeStockDeductionLoop(
    tx: Prisma.TransactionClient,
    orderItemId: string,
    productId: string,
    orderQuantity: number
  ) {
    const productRecipe = await tx.recipes.findMany({ where: { product_id: productId } });

    for (const step of productRecipe) {
      const totalNeededVolume = new Prisma.Decimal(step.quantity).times(orderQuantity).toNumber();

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

  static async getParkedOrders() {
    return await prisma.orders.findMany({
      where: { order_status: 'parked' },
      include: { items: { include: { product: true } } },
      orderBy: { created_at: 'desc' }
    });
  }
}