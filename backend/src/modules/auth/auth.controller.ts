import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterSchema, LoginSchema } from './auth.validation';
import { streamUpload } from '../../config/cloudinary';
import { prisma } from '../../config/db';
import { LogCategory, LogType } from '../../generated/prisma/client';
import { AuditService } from '../audit/audit.service';
import { AuthenticatedUser } from '../../middlewares/auth.middleware';

const createHttpError = (message: string, statusCode: number) => Object.assign(new Error(message), { statusCode });

const isProduction = process.env.NODE_ENV === 'production';

const accessCookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: 'lax' as const,
  path: '/api/v1',
  maxAge: 15 * 60 * 1000,
};

const refreshCookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: 'lax' as const,
  path: '/api/v1/auth',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

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

const setAuthCookies = (
  res: Response,
  accessToken: string,
  refreshToken: string,
) => {
  res.cookie('daily_brew_access_token', accessToken, accessCookieOptions);
  res.cookie('daily_brew_refresh_token', refreshToken, refreshCookieOptions);
};

const clearAuthCookies = (res: Response) => {
  res.clearCookie('daily_brew_access_token', accessCookieOptions);
  res.clearCookie('daily_brew_refresh_token', refreshCookieOptions);
};

const serializeUser = (user: {
  id: string;
  username: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  role: string;
}) => ({
  id: user.id,
  username: user.username,
  firstName: user.first_name,
  lastName: user.last_name,
  avatarUrl: user.avatar_url,
  role: user.role,
});

export class AuthController {
  static async register(req: Request, res: Response) {
    const data = RegisterSchema.parse(req.body);
    
    const outcome = await AuthService.register(data, req.user?.id);
    res.status(201).json({ success: true, data: outcome });
  }

  static async login(req: Request, res: Response) {
    const data = LoginSchema.parse(req.body);
    const outcome = await AuthService.login(data);

    setAuthCookies(res, outcome.accessToken, outcome.refreshToken);

    res.status(200).json({ success: true, data: outcome.user });
  }

  static async me(req: Request, res: Response) {
    const user = await AuthService.getAuthenticatedUser(req.user!.id);
    res.status(200).json({ success: true, data: serializeUser(user) });
  }

  static async refresh(req: Request, res: Response) {
    const refreshToken = parseCookies(req.headers.cookie)['daily_brew_refresh_token'];

    if (!refreshToken) {
      throw createHttpError('Not authorized, refresh token missing.', 401);
    }

    const outcome = await AuthService.refreshSession(refreshToken);
    setAuthCookies(res, outcome.accessToken, outcome.refreshToken);

    res.status(200).json({ success: true, data: outcome.user });
  }

  static async logout(req: Request, res: Response) {
    clearAuthCookies(res);
    res.status(200).json({ success: true, data: { loggedOut: true } });
  }

  static async updateAvatar(req: Request, res: Response) {
    if (!req.file) {
      throw createHttpError('Bad Request: No avatar image file provided.', 400);
    }

    try {
      const secureUrl = await streamUpload(req.file.buffer, 'avatars');

      const updatedUser = await prisma.user.update({
        where: { id: req.user!.id },
        data: { avatar_url: secureUrl },
        select: {
          id: true,
          username: true,
          first_name: true,
          last_name: true,
          avatar_url: true,
          role: true
        }
      });

      void AuditService.log({
        message: `PROFILE UPDATE: User [${updatedUser.username}] updated their profile avatar image.`,
        category: LogCategory.authentication,
        type: LogType.info,
        userId: req.user!.id
      });

      res.status(200).json({
        success: true,
        message: 'Avatar image updated successfully.',
        data: updatedUser
      });
    } catch (error) {
      if (error && typeof error === 'object' && 'code' in error && (error as { code?: string }).code === 'P2025') {
        throw createHttpError('Validation Failure: Target resource not found.', 404);
      }

      throw createHttpError('Validation Failure: Avatar upload failed.', 500);
    }
  }
}