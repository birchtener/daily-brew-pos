import { Request, Response } from 'express';
import { OrdersService } from './orders.service';
import { CreateOrderSchema, FinalizeParkedOrderSchema } from './orders.validation';

const createHttpError = (message: string, statusCode: number) => Object.assign(new Error(message), { statusCode });

export class OrdersController {
  static async checkout(req: Request, res: Response) {
    const cleanData = CreateOrderSchema.parse(req.body);
    const data = await OrdersService.processOrder(cleanData, req.user!.id);
    res.status(201).json({ success: true, data });
  }

  static async listParked(req: Request, res: Response) {
    const data = await OrdersService.getParkedOrders();
    res.status(200).json({ success: true, data });
  }

  static async listCompleted(req: Request, res: Response) {
    const data = await OrdersService.getCompletedOrders();
    res.status(200).json({ success: true, data });
  }

  static async finalizeParked(req: Request, res: Response) {
    const { id } = req.params;
    if (typeof id !== 'string') {
      throw createHttpError('Bad Request: Invalid URL route execution parameter format.', 400);
    }

    const cleanData = FinalizeParkedOrderSchema.parse(req.body);
    
    const data = await OrdersService.checkoutParkedOrder(id, cleanData, req.user!.id);
    
    res.status(200).json({ success: true, data });
  }

  static async getCancelledOrders(req: Request, res: Response) {
    const data = await OrdersService.getCancelledOrders();
    res.status(200).json({ success: true, data });
  }

  static async cancelParked(req: Request, res: Response) {
    const { id } = req.params;
    if (typeof id !== 'string') {
      throw createHttpError('Bad Request: Invalid URL route execution parameter format.', 400);
    }

    const data = await OrdersService.deleteParkedOrder(id, req.user!.id);
    res.status(200).json({ success: true, data });
  }

  static async voidOrder(req: Request, res: Response) {
    const { id } = req.params;
    if (typeof id !== 'string') {
      throw createHttpError('Bad Request: Invalid URL route execution parameter format.', 400);
    }

    const data = await OrdersService.voidOrder(id, req.user!.id);
    res.status(200).json({ success: true, data });
  }
}