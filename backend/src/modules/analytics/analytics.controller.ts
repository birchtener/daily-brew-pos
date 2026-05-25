import { Request, Response } from 'express';
import React from 'react';
import { AnalyticsService } from './analytics.service';
import { AnalyticsQuerySchema } from './analytics.validation';
import { prisma } from '../../config/db';
import {
  generateStockValuationReport,
  generateProductProfitabilityReport,
} from '../../utils/excelExport';
import {
  ZReportPdfDocument,
  streamPdfResponse,
} from '../../utils/pdfGenerator';

export class AnalyticsController {
  static async getProfitMargins(req: Request, res: Response) {
    const cleanFilters = AnalyticsQuerySchema.parse(req.query);
    const data = await AnalyticsService.getFinancialOverview(cleanFilters);
    res.status(200).json({ success: true, data });
  }

  static async getVelocityReport(req: Request, res: Response) {
    const cleanFilters = AnalyticsQuerySchema.parse(req.query);
    const data = await AnalyticsService.getTopProducts(cleanFilters);
    res.status(200).json({ success: true, data });
  }

  static async getStockHealth(req: Request, res: Response) {
    const data = await AnalyticsService.getInventoryHealth();
    res.status(200).json({ success: true, data });
  }

  static async exportStockValuation(req: Request, res: Response) {
    try {
      await generateStockValuationReport(res);
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || 'Valuation export failed.' });
    }
  }

  static async exportProductProfitability(req: Request, res: Response) {
    try {
      const cleanFilters = AnalyticsQuerySchema.parse(req.query);
      const start = cleanFilters.start_date
        ? new Date(cleanFilters.start_date)
        : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const end = cleanFilters.end_date ? new Date(cleanFilters.end_date) : new Date();

      await generateProductProfitabilityReport(start, end, res);
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || 'Profitability export failed.' });
    }
  }

  static async getDailyZReportPdf(req: Request, res: Response) {
    try {
      const targetDateStr = typeof req.query.date === 'string'
        ? req.query.date
        : new Date().toISOString().split('T')[0];

      const startOfDay = new Date(`${targetDateStr}T00:00:00.000Z`);
      const endOfDay = new Date(`${targetDateStr}T23:59:59.999Z`);

      const orders = await prisma.orders.findMany({
        where: {
          order_status: 'completed',
          created_at: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
      });

      let grossSales = 0;
      let discounts = 0;
      let netCollected = 0;

      for (const order of orders) {
        const sub = Number(order.sub_total);
        const tot = Number(order.total);
        grossSales += sub;
        discounts += (sub - tot);
        netCollected += tot;
      }

      const paymentsGroup = await prisma.payments.groupBy({
        by: ['method'],
        where: {
          paid_at: {
            gte: startOfDay,
            lte: endOfDay,
          },
          order: {
            order_status: 'completed',
          },
        },
        _sum: {
          amount: true,
        },
      });

      const payments = paymentsGroup.map((p) => ({
        method: p.method,
        amount: Number(p._sum.amount || 0),
      }));

      const doc = React.createElement(ZReportPdfDocument, {
        data: {
          date: targetDateStr,
          grossSales,
          discounts,
          netCollected,
          payments,
        },
      });

      await streamPdfResponse(doc, res);
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || 'PDF Z-Report failed.' });
    }
  }
}