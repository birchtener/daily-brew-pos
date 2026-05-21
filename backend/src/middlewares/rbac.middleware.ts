import { Request, Response, NextFunction } from 'express';
import { Role } from '../generated/prisma/client';

export const restrictTo = (...allowedRoles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
       res.status(401).json({ success: false, error: { message: 'Session context uninitialized.' } });
       return;
    }

    if (!allowedRoles.includes(req.user.role)) {
       res.status(403).json({ 
        success: false, 
        error: { message: 'Access Denied: Your account role does not have permission for this task.' } 
      });
       return;
    }

    next();
  };
};