import { Request, Response, NextFunction } from 'express';
import { Role } from '../generated/prisma/client';

const createHttpError = (message: string, statusCode: number) => Object.assign(new Error(message), { statusCode });

export const restrictTo = (...allowedRoles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
     next(createHttpError('Session context uninitialized.', 401));
     return;
    }

    if (!allowedRoles.includes(req.user.role)) {
     next(createHttpError('Access Denied: Your account role does not have permission for this task.', 403));
       return;
    }

    next();
  };
};