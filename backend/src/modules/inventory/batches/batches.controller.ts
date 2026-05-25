import { Request, Response } from 'express';
import React from 'react';
import { BatchesService } from './batches.service';
import { ReceiveStockSchema } from './batches.validation';
import { prisma } from '../../../config/db';
import {
  PurchaseOrderPdfDocument,
  streamPdfResponse,
  PurchaseOrderData,
} from '../../../utils/pdfGenerator';

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

    static async getRecentSupplierOrders(req: Request, res: Response) {
        try {
            const data = await prisma.supplierOrders.findMany({
                orderBy: { ordered_at: 'desc' },
                take: 10,
                include: {
                    supplier: true,
                    ordered_by_user: true,
                },
            });
            res.status(200).json({ success: true, data });
        } catch (err: any) {
            res.status(500).json({
                success: false,
                message: err.message || 'Failed to fetch recent supplier orders.',
            });
        }
    }

    static async getPurchaseOrderPdf(req: Request, res: Response) {
        try {
            const id = req.params.id as string;
            if (typeof id !== 'string') {
                res.status(400).json({
                    success: false,
                    message: 'Bad Request: Invalid URL route execution parameter format.',
                });
                return;
            }

            const supplierOrder = await prisma.supplierOrders.findUnique({
                where: { id },
                include: {
                    supplier: true,
                    ordered_by_user: true,
                    batches: {
                        include: {
                            ingredient: true,
                        },
                    },
                },
            });

            if (!supplierOrder) {
                res.status(404).json({
                    success: false,
                    message: 'Supplier Order (Purchase Order) not found.',
                });
                return;
            }

            const items = supplierOrder.batches.map((batch) => {
                const qty = Number(batch.quantity_received);
                const cost = Number(batch.cost_per_unit);
                return {
                    ingredientName: batch.ingredient.name,
                    unit: batch.ingredient.unit,
                    quantityReceived: qty,
                    unitCost: cost,
                    subtotal: qty * cost,
                };
            });

            const grandTotal = items.reduce((sum, item) => sum + item.subtotal, 0);

            const poData: PurchaseOrderData = {
                poId: supplierOrder.id,
                orderDate: supplierOrder.ordered_at.toLocaleDateString(),
                orderedBy: `${supplierOrder.ordered_by_user.first_name} ${supplierOrder.ordered_by_user.last_name}`,
                supplier: {
                    name: supplierOrder.supplier.name,
                    contactName: supplierOrder.supplier.contact_name || 'Vendor Rep',
                    contactNumber: supplierOrder.supplier.contact_number || 'N/A',
                },
                items,
                grandTotal,
            };

            const doc = React.createElement(PurchaseOrderPdfDocument, { data: poData });
            await streamPdfResponse(doc, res);
        } catch (err: any) {
            res.status(500).json({
                success: false,
                message: err.message || 'Purchase Order PDF generation failed.',
            });
        }
    }
}
