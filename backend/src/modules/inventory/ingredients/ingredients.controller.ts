import { Request, Response } from 'express';
import { IngredientsService } from './ingredients.service';
import { CreateIngredientSchema, UpdateIngredientSchema } from './ingredients.validation'; 
import { streamUpload } from '../../../config/cloudinary';

const createHttpError = (message: string, statusCode: number) => Object.assign(new Error(message), { statusCode });

export class IngredientsController {
    static async addIngredient(req: Request, res: Response) {
        const cleanData = CreateIngredientSchema.parse(req.body);

        // Handle image upload via Cloudinary
        let imgPath: string | null = null;
        if (req.file) {
            imgPath = await streamUpload(req.file.buffer, 'ingredients');
        }

        const data = await IngredientsService.createIngredient(
            { ...cleanData, img_path: imgPath },
            req.user!.id
        );
        res.status(201).json({ success: true, data });
    }

    static async getIngredient(req: Request, res: Response) {
        const { id } = req.params;
        if (typeof id !== 'string') {
            res.status(400).json({
                success: false,
                error: { message: "Invalid Request: Ingredient target parameter must be a singular string UUID." }
            });
            return;
        }
        const data = await IngredientsService.getIngredient(id, req.user!.id);
        res.status(200).json({ success: true, data });
    }

    static async getIngredients(req: Request, res: Response) {
        const data = await IngredientsService.getIngredients(req.user!.id);
        res.status(200).json({ success: true, data });
    }

    static async updateIngredient(req: Request, res: Response) {
        const id = req.params.id as string;
        if (typeof id !== 'string') {
            throw createHttpError('Invalid Request: Ingredient target parameter must be a singular string UUID.', 400);
        }
        const cleanData = UpdateIngredientSchema.parse(req.body);

        // Handle image upload via Cloudinary
        const updatePayload: any = { ...cleanData };
        if (req.file) {
            updatePayload.img_path = await streamUpload(req.file.buffer, 'ingredients');
        }

        const data = await IngredientsService.updateIngredient(id, updatePayload, req.user!.id);
        res.status(200).json({ success: true, data });
    }

    static async deleteIngredient(req: Request, res: Response) {
        const id = req.params.id as string;
        if (typeof id !== 'string') {
            res.status(400).json({
                success: false,
                error: { message: "Invalid Request: Ingredient target parameter must be a singular string UUID." }
            });
            return;
        }
        const data = await IngredientsService.deleteIngredient(id, req.user!.id);
        res.status(200).json({ success: true, data });
    } 
}