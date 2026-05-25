import { Request, Response } from 'express';
import { AdjustmentsService } from './adjustments.service';
import { CreateAdjustmentSchema } from './adjustments.validation';

export class AdjustmentsController {
  static async getAdjustments(req: Request, res: Response) {
    const ingredientId = req.query.ingredient_id as string | undefined;
    const data = await AdjustmentsService.getAdjustments(ingredientId);
    res.status(200).json({ success: true, data });
  }

  static async createAdjustment(req: Request, res: Response) {
    const cleanData = CreateAdjustmentSchema.parse(req.body);
    const data = await AdjustmentsService.createAdjustment(cleanData, req.user!.id);
    res.status(201).json({ success: true, data });
  }
}
