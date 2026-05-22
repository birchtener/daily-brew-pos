import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Role } from '../generated/prisma/client';

const createHttpError = (message: string, statusCode: number) => Object.assign(new Error(message), { statusCode });

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
    next(createHttpError('Not authorized, token missing.', 401));
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret') as AuthenticatedUser;
    
    req.user = decoded;
    next();
  } catch (error) {
    next(createHttpError('Not authorized, invalid token compilation.', 401));
  }
};