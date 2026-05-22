import { prisma } from '../../config/db';
import bcrypt from 'bcrypt';
import jwt, { SignOptions } from 'jsonwebtoken';
import { AuditService } from '../audit/audit.service';
import { LogCategory, LogType, Prisma } from '../../generated/prisma/client';
import { z } from 'zod';
import { LoginSchema } from './auth.validation';
import { AuthenticatedUser } from '../../middlewares/auth.middleware';

const createHttpError = (message: string, statusCode: number) => Object.assign(new Error(message), { statusCode });

const isKnownPrismaError = (error: unknown, code: string) =>
  error instanceof Prisma.PrismaClientKnownRequestError && error.code === code;

export class AuthService {
  private static generateToken(id: string, username: string, role: string, expiresIn: SignOptions['expiresIn']): string {
    const options: SignOptions = {
      expiresIn
    };

    return jwt.sign(
      { id, username, role },
      process.env.JWT_SECRET || 'fallback_secret',
      options
    );
  }

  private static issueAuthTokens(user: AuthenticatedUser) {
    const accessToken = this.generateToken(
      user.id,
      user.username,
      user.role,
      (process.env.JWT_ACCESS_EXPIRES_IN || '15m') as SignOptions['expiresIn']
    );

    const refreshToken = this.generateToken(
      user.id,
      user.username,
      user.role,
      (process.env.JWT_REFRESH_EXPIRES_IN || '7d') as SignOptions['expiresIn']
    );

    return { accessToken, refreshToken };
  }

  static async getAuthenticatedUser(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        first_name: true,
        last_name: true,
        avatar_url: true,
        is_password_temp: true,
        role: true,
        deleted_at: true,
      },
    });

    if (!user || user.deleted_at) {
      throw createHttpError('Validation Failure: Target resource not found.', 404);
    }

    return user;
  }

  static async login(input: z.infer<typeof LoginSchema>) {
    const user = await prisma.user.findFirst({
      where: {
        username: input.username,
        deleted_at: null,
      },
    });
    if (!user || !(await bcrypt.compare(input.password, user.password))) {
      throw createHttpError('Invalid application credentials specified.', 401);
    }

    const tokens = this.issueAuthTokens({
      id: user.id,
      username: user.username,
      role: user.role,
    });

    void AuditService.log({
      message: `SESSION INITIALIZED: User [${user.username}] successfully authorized terminal session access.`,
      category: LogCategory.authentication,
      type: LogType.info,
      userId: user.id,
    });

    return {
      ...tokens,
      user: {
        id: user.id,
        username: user.username,
        firstName: user.first_name,
        lastName: user.last_name,
        avatarUrl: user.avatar_url,
        is_password_temp: user.is_password_temp,
        role: user.role,
      },
    };
  }

  static async refreshSession(refreshToken: string) {
    try {
      const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET || 'fallback_secret') as AuthenticatedUser;
      const user = await this.getAuthenticatedUser(decoded.id);
      const tokens = this.issueAuthTokens({
        id: user.id,
        username: user.username,
        role: user.role,
      });

      return {
        ...tokens,
        user: {
          id: user.id,
          username: user.username,
          firstName: user.first_name,
          lastName: user.last_name,
          avatarUrl: user.avatar_url,
          is_password_temp: user.is_password_temp,
          role: user.role,
        },
      };
    } catch (error) {
      throw createHttpError('Not authorized, invalid refresh session.', 401);
    }
  }
}