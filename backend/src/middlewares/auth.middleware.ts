import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Role } from '../generated/prisma/client';

const createHttpError = (message: string, statusCode: number) => Object.assign(new Error(message), { statusCode });

export interface AuthenticatedUser {
  id: string;
  username: string;
  role: Role;
}

const parseCookies = (cookieHeader?: string) => {
  if (!cookieHeader) {
    return {} as Record<string, string>;
  }

  return cookieHeader.split(';').reduce<Record<string, string>>((cookies, pair) => {
    const separatorIndex = pair.indexOf('=');

    if (separatorIndex === -1) {
      return cookies;
    }

    const key = pair.slice(0, separatorIndex).trim();
    const value = pair.slice(separatorIndex + 1).trim();
    cookies[key] = decodeURIComponent(value);
    return cookies;
  }, {});
};

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
    token = parseCookies(req.headers.cookie)['daily_brew_access_token'];
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