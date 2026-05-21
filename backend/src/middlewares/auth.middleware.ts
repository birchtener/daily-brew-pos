import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Role } from '../generated/prisma/client';

export interface AuthenticatedUser {
  id: string;
  username: string;
  role: Role;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export const protect = async (req: Request, res: Response, next: NextFunction) => {
  let token: string | undefined;

  if (req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    res.status(401).json({ success: false, error: { message: 'Not authorized, token missing.' } });
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret') as AuthenticatedUser;
    
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ success: false, error: { message: 'Not authorized, invalid token compilation.' } });
  }
};