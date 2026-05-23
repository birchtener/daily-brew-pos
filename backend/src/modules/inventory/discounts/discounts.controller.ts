import { Request, Response } from 'express';
import { DiscountsService } from './discounts.service';
import { DiscountSchema } from './discounts.validation';

const createHttpError = (message: string, statusCode: number) =>
    Object.assign(new Error(message), { statusCode });

export class DiscountsController {
    static async addDiscount(req: Request, res: Response) {
        const cleanData = DiscountSchema.parse(req.body);
        const data = await DiscountsService.createDiscount(cleanData, req.user!.id);
        res.status(201).json({ success: true, data });
    }

    static async getDiscount(req: Request, res: Response) {
        const { id } = req.params;
        if (typeof id !== 'string') {
            throw createHttpError('Invalid Request: Target parameter must be a singular string UUID.', 400);
        }
        const data = await DiscountsService.getDiscount(id, req.user!.id);
        res.status(200).json({ success: true, data });
    }

    static async getDiscounts(req: Request, res: Response) {
        const data = await DiscountsService.getDiscounts(req.user!.id);
        res.status(200).json({ success: true, data });
    }

    static async updateDiscount(req: Request, res: Response) {
        const cleanData = DiscountSchema.parse(req.body);
        const { id } = req.params;
        if (typeof id !== 'string') {
            throw createHttpError('Invalid Request: Target parameter must be a singular string UUID.', 400);
        }
        const data = await DiscountsService.updateDiscount(id, cleanData, req.user!.id);
        res.status(200).json({ success: true, data });
    }

    static async deleteDiscount(req: Request, res: Response) {
        const { id } = req.params;
        if (typeof id !== 'string') {
            throw createHttpError('Invalid Request: Target parameter must be a singular string UUID.', 400);
        }
        const data = await DiscountsService.deleteDiscount(id, req.user!.id);
        res.status(200).json({ success: true, data });
    }
}
