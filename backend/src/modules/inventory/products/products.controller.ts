import { Request, Response } from 'express';
import { ProductsService } from './products.service';
import { CreateProductSchema, UpdateProductSchema } from './products.validation';
import { streamUpload } from '../../../config/cloudinary';

const createHttpError = (message: string, statusCode: number) => Object.assign(new Error(message), { statusCode });

export class ProductsController {
    static async addProduct(req: Request, res: Response) {
        const cleanData = CreateProductSchema.parse(req.body);

        let imgPath: string | null = null;
        if (req.file) {
            imgPath = await streamUpload(req.file.buffer, 'products');
        }

        const data = await ProductsService.createProduct(
            { ...cleanData, img_path: imgPath },
            req.user!.id
        );
        res.status(201).json({ success: true, data });
    }

    static async getProduct(req: Request, res: Response) {
        const { id } = req.params;
        if (typeof id !== 'string') {
            res.status(400).json({
                success: false,
                error: { message: "Invalid Request: Product target parameter must be a singular string UUID." }
            });
            return;
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

        const updatePayload: any = { ...cleanData };
        if (req.file) {
            updatePayload.img_path = await streamUpload(req.file.buffer, 'products');
        }

        const data = await ProductsService.updateProduct(id, updatePayload, req.user!.id);
        res.status(200).json({ success: true, data });
    }

    static async deleteProduct(req: Request, res: Response) {
        const id = req.params.id as string;
        if (typeof id !== 'string') {
            res.status(400).json({
                success: false,
                error: { message: "Invalid Request: Product target parameter must be a singular string UUID." }
            });
            return;
        }
        const data = await ProductsService.deleteProduct(id, req.user!.id);
        res.status(200).json({ success: true, data });
    } 
}