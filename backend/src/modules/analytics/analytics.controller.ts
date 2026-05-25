import { Request, Response } from 'express';
import { AnalyticsService } from './analytics.service';
import { AnalyticsQuerySchema } from './analytics.validation';
import {
  generateStockValuationReport,
  generateProductProfitabilityReport,
} from '../../utils/excelExport';

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
}