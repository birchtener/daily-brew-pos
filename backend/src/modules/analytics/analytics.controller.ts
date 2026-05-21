import { Request, Response } from 'express';
import { AnalyticsService } from './analytics.service';
import { AnalyticsQuerySchema } from './analytics.validation';

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
}