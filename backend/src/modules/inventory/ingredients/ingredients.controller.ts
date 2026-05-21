import { Request, Response } from 'express';
import { IngredientsService } from './ingredients.service';
import { CreateIngredientSchema } from './ingredients.validation'; 

export class IngredientsController {
    static async addIngredient(req: Request, res: Response) {
        const cleanData = CreateIngredientSchema.parse(req.body);
        const data = await IngredientsService.createIngredient(cleanData, req.user!.id);
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
            res.status(400).json({
                success: false,
                error: { message: "Invalid Request: Ingredient target parameter must be a singular string UUID." }
            });
            return;
        }
        const cleanData = CreateIngredientSchema.parse(req.body);
        const data = await IngredientsService.updateIngredient(id, cleanData, req.user!.id);
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