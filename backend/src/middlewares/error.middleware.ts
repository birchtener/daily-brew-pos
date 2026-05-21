import { Request, Response, NextFunction } from 'express';
import { AuditService } from '../modules/audit/audit.service';
import { LogCategory, LogType } from '../generated/prisma/client';

export interface AppError extends Error {
  statusCode?: number;
}

export const errorHandler = async (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  const executionUser = (req as any).user?.id;

  if (executionUser) {
    await AuditService.log({
      message: `ROUTE EXCEPTION: ${message} | Stack: ${err.stack}`,
      category: LogCategory.authentication,
      type: LogType.error,
      userId: executionUser,
    });
  } else {
    console.error(`[Unhandled System Error] ${message}`, err.stack);
  }

  res.status(statusCode).json({
    success: false,
    error: {
      message: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred' : message,
    },
  });
};