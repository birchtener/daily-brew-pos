import { Request, Response } from 'express';
import { SuppliersService } from './suppliers.service';
import { CreateSupplierSchema, UpdateSupplierSchema } from '../suppliers/suppliers.validation';

export class SuppliersController {
    static async addSupplier(req: Request, res: Response) {
        const cleanData = CreateSupplierSchema.parse(req.body);
        const data = await SuppliersService.createSupplier(cleanData, req.user!.id);
        res.status(201).json({ success: true, data });
    }

    static async getSuppliers(req: Request, res: Response) {
        const data = await SuppliersService.getSuppliers(req.user!.id);
        res.status(200).json({ success: true, data });
    }

    static async getSupplier(req: Request, res: Response) {
        const { id } = req.params;
        if (typeof id !== 'string') {
            res.status(400).json({
                success: false,
                error: { message: "Invalid Request: Supplier target parameter must be a singular string UUID." }
            });
            return;
        }
        const data = await SuppliersService.getSupplier(id, req.user!.id);
        res.status(200).json({ success: true, data });
    }

    static async updateSupplier(req: Request, res: Response) {
        const id = req.params.id as string;
        if (typeof id !== 'string') {
            res.status(400).json({
                success: false,
                error: { message: "Invalid Request: Supplier target parameter must be a singular string UUID." }
            });
            return;
        }           
        const cleanData = UpdateSupplierSchema.parse(req.body);
        const data = await SuppliersService.updateSupplier(id, cleanData, req.user!.id);
        res.status(200).json({ success: true, data });
    }

    static async deleteSupplier(req: Request, res: Response) {
        const id = req.params.id as string;
        if (typeof id !== 'string') {
            res.status(400).json({
                success: false,
                error: { message: "Invalid Request: Supplier target parameter must be a singular string UUID." }
            });
            return;
        }
        const data = await SuppliersService.deleteSupplier(id, req.user!.id);
        res.status(200).json({ success: true, data });
    }
}
