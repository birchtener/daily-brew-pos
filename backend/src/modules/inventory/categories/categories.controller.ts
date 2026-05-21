import { Request, Response } from 'express';
import { CategoriesService } from './categories.service';
import { CategorySchema } from './categories.validation';

export class CategoriesController {
    static async addCategory(req: Request, res: Response) {
        const cleanData = CategorySchema.parse(req.body);
        const data = await CategoriesService.createCategory(cleanData, req.user!.id);
        res.status(201).json({ success: true, data });
    }

    static async getCategory(req: Request, res: Response) {
        const { id } = req.params;
        if (typeof id !== 'string') {
            res.status(400).json({
                success: false,
                error: { message: "Invalid Request: Category target parameter must be a singular string UUID." }
            });
            return;
        }
        const data = await CategoriesService.getCategory(id, req.user!.id);
        res.status(200).json({ success: true, data });
    }

    static async getCategories(req: Request, res: Response) {
        const data = await CategoriesService.getCategories(req.user!.id);
        res.status(200).json({ success: true, data });
    }

    static async updateCategory(req: Request, res: Response) {
        const cleanData = CategorySchema.parse(req.body);
        const { id } = req.params;
        if (typeof id !== 'string') {
            res.status(400).json({
                success: false,
                error: { message: "Invalid Request: Category target parameter must be a singular string UUID." }
            });
            return;
        }
        const data = await CategoriesService.updateCategory(id, cleanData, req.user!.id);
        res.status(200).json({ success: true, data });
    }

    static async deleteCategory(req: Request, res: Response) {
        const { id } = req.params;
        if (typeof id !== 'string') {
            res.status(400).json({
                success: false,
                error: { message: "Invalid Request: Category target parameter must be a singular string UUID." }
            });
            return;
        }
        const data = await CategoriesService.deleteCategory(id, req.user!.id);
        res.status(200).json({ success: true, data });
    }
}