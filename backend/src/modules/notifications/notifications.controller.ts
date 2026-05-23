import { Request, Response } from 'express';
import { NotificationsService } from './notifications.service';
import { CreateNotificationSchema, NotificationsListQuerySchema } from './notifications.validation';

export class NotificationsController {
  static async list(req: Request, res: Response) {
    const query = NotificationsListQuerySchema.parse(req.query);
    const data = await NotificationsService.listForUser(req.user!.id, query);

    res.status(200).json({ success: true, data });
  }

  static async create(req: Request, res: Response) {
    const payload = CreateNotificationSchema.parse(req.body);
    const data = await NotificationsService.create(payload, req.user!.id);

    res.status(201).json({ success: true, data });
  }

  static async markAsRead(req: Request, res: Response) {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    if (!id) {
      throw Object.assign(new Error('Bad Request: Notification id is required.'), { statusCode: 400 });
    }

    const data = await NotificationsService.markAsRead(id, req.user!.id);
    res.status(200).json({ success: true, data });
  }

  static async markAllAsRead(req: Request, res: Response) {
    const data = await NotificationsService.markAllAsRead(req.user!.id);
    res.status(200).json({ success: true, data });
  }

  static async remove(req: Request, res: Response) {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    if (!id) {
      throw Object.assign(new Error('Bad Request: Notification id is required.'), { statusCode: 400 });
    }

    const data = await NotificationsService.softDelete(id, req.user!.id);
    res.status(200).json({ success: true, data });
  }
}
