import { prisma } from '../../config/db';
import { z } from 'zod';
import { AnalyticsQuerySchema } from './analytics.validation';
import { OrderStatus, Prisma } from '../../generated/prisma/client';

export class AnalyticsService {
  static async getFinancialOverview(filters: z.infer<typeof AnalyticsQuerySchema>) {
    const start = filters.start_date ? new Date(filters.start_date) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Default 30 Days back
    const end = filters.end_date ? new Date(filters.end_date) : new Date();

    const salesAggregation = await prisma.orders.aggregate({
      where: {
        order_status: OrderStatus.completed,
        created_at: { gte: start, lte: end }
      },
      _sum: {
        total: true,
        sub_total: true
      }
    });

    const cogsAggregation = await prisma.orderItemStockDeductions.aggregate({
      where: {
        order_item: {
          order: {
            order_status: OrderStatus.completed,
            created_at: { gte: start, lte: end }
          }
        }
      },
      _sum: {
        cost_at_sale: true
      }
    });

    const netRevenue = Number(salesAggregation._sum.total || 0);
    const totalCostOfGoodsSold = Number(cogsAggregation._sum.cost_at_sale || 0);
    
    const grossProfit = netRevenue - totalCostOfGoodsSold;
    const grossMarginPercentage = netRevenue > 0 ? (grossProfit / netRevenue) * 100 : 0;

    return {
      timeframe: { start, end },
      metrics: {
        net_revenue: netRevenue,
        cost_of_goods_sold: totalCostOfGoodsSold,
        gross_profit: grossProfit,
        gross_margin_percentage: parseFloat(grossMarginPercentage.toFixed(2))
      }
    };
  }

  static async getTopProducts(filters: z.infer<typeof AnalyticsQuerySchema>) {
    const start = filters.start_date ? new Date(filters.start_date) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = filters.end_date ? new Date(filters.end_date) : new Date();

    const topItems = await prisma.orderItems.groupBy({
      by: ['product_id'],
      where: {
        order: {
          order_status: OrderStatus.completed,
          created_at: { gte: start, lte: end }
        }
      },
      _sum: {
        quantity: true,
        sub_total: true
      },
      orderBy: {
        _sum: { quantity: 'desc' }
      },
      take: 10 // Cap extraction at top 10 items for performance optimization
    });

    const populatedReport = await Promise.all(
      topItems.map(async (item) => {
        const detail = await prisma.product.findUnique({
          where: { id: item.product_id },
          select: { name: true, price: true }
        });

        return {
          product_id: item.product_id,
          name: detail?.name || 'Unknown Item',
          units_sold: item._sum.quantity || 0,
          gross_revenue_generated: Number(item._sum.sub_total || 0)
        };
      })
    );

    populatedReport.sort((left, right) => right.units_sold - left.units_sold);

    return populatedReport;
  }

  static async getInventoryHealth() {
    const ingredients = await prisma.ingredients.findMany({
      orderBy: { name: 'asc' },
      include: {
        batches: {
          where: { quantity_remaining: { gt: 0 } }
        }
      }
    });

    const inventoryStatusReport = ingredients.map((ing) => {
      const aggregateStockRemaining = ing.batches.reduce((acc, currentBatch) => {
        return acc.plus(currentBatch.quantity_remaining);
      }, new Prisma.Decimal(0));

      return {
        ingredient_id: ing.id,
        name: ing.name,
        unit: ing.unit,
        current_on_hand_balance: Number(aggregateStockRemaining),
        active_batch_count: ing.batches.length,
        status: Number(aggregateStockRemaining) === 0 
          ? 'OUT_OF_STOCK' 
          : ing.batches.length === 1 ? 'LOW_STOCK_ALERT' : 'HEALTHY'
      };
    });

    return inventoryStatusReport;
  }
}