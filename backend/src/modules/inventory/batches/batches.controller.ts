import { Request, Response } from 'express';
import { BatchesService } from './batches.service';
import { ReceiveStockSchema } from './batches.validation';

export class BatchesController {
    static async getBatches(req: Request, res: Response) {
        const ingredientId = req.query.ingredient_id as string | undefined;
        const data = await BatchesService.getBatches(ingredientId, req.user!.id);
        res.status(200).json({ success: true, data });
    }

    static async receiveStock(req: Request, res: Response) {
        const cleanData = ReceiveStockSchema.parse(req.body);
        const data = await BatchesService.receiveStock(cleanData, req.user!.id);
        res.status(201).json({ success: true, data });
    }

    static async deleteBatch(req: Request, res: Response) {
        const id = req.params.id as string;
        if (typeof id !== 'string') {
            res.status(400).json({
                success: false,
                error: { message: 'Invalid Request: Batch target parameter must be a singular string UUID.' },
            });
            return;
        }
        const data = await BatchesService.deleteBatch(id, req.user!.id);
        res.status(200).json({ success: true, data });
    }
}
