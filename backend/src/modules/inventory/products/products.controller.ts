import { Request, Response } from 'express';
import { ProductsService } from './products.service';
import { CreateProductSchema, UpdateProductSchema } from './products.validation';

const createHttpError = (message: string, statusCode: number) => Object.assign(new Error(message), { statusCode });

export class ProductsController {
    static async addProduct(req: Request, res: Response) {
        const cleanData = CreateProductSchema.parse(req.body);
        const data = await ProductsService.createProduct(cleanData, req.user!.id);
        res.status(201).json({ success: true, data });
    }

    static async getProduct(req: Request, res: Response) {
        const { id } = req.params;
        if (typeof id !== 'string') {
            throw createHttpError('Invalid Request: Product target parameter must be a singular string UUID.', 400);
        }
        const data = await ProductsService.getProduct(id, req.user!.id);
        res.status(200).json({ success: true, data });
    }

    static async getProducts(req: Request, res: Response) {
        const data = await ProductsService.getProducts(req.user!.id);
        res.status(200).json({ success: true, data });
    }

    static async updateProduct(req: Request, res: Response) {
        const id = req.params.id as string;
        if (typeof id !== 'string') {
            throw createHttpError('Invalid Request: Product target parameter must be a singular string UUID.', 400);
        }
        const cleanData = UpdateProductSchema.parse(req.body);
        const data = await ProductsService.updateProduct(id, cleanData, req.user!.id);
        res.status(200).json({ success: true, data });
    }

    static async deleteProduct(req: Request, res: Response) {
        const id = req.params.id as string;
        if (typeof id !== 'string') {
            throw createHttpError('Invalid Request: Product target parameter must be a singular string UUID.', 400);
        }
        const data = await ProductsService.deleteProduct(id, req.user!.id);
        res.status(200).json({ success: true, data });
    } 
}