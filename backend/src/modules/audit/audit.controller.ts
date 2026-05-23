import { Request, Response } from 'express';
import { AuditService } from './audit.service';
import { LogCategory, LogType } from '../../generated/prisma/client';

export class AuditController {
  static async getLogs(req: Request, res: Response) {
    const category = req.query.category as LogCategory | undefined;
    const type = req.query.type as LogType | undefined;
    const search = req.query.search as string | undefined;
    const cursor = req.query.cursor ? parseInt(req.query.cursor as string, 10) : undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;

    const data = await AuditService.getLogs({
      category,
      type,
      search,
      cursor,
      limit,
    });

    res.status(200).json({
      success: true,
      data,
    });
  }
}
