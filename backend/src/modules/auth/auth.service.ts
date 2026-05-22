import { prisma } from '../../config/db';
import bcrypt from 'bcrypt';
import jwt, { SignOptions } from 'jsonwebtoken';
import { AuditService } from '../audit/audit.service';
import { LogCategory, LogType, Prisma } from '../../generated/prisma/client';
import { z } from 'zod';
import { RegisterSchema, LoginSchema } from './auth.validation';

const createHttpError = (message: string, statusCode: number) => Object.assign(new Error(message), { statusCode });

const isKnownPrismaError = (error: unknown, code: string) =>
  error instanceof Prisma.PrismaClientKnownRequestError && error.code === code;

export class AuthService {
  private static generateToken(id: string, username: string, role: string): string {
    const options: SignOptions = {
      expiresIn: (process.env.JWT_EXPIRES_IN || '24h') as SignOptions['expiresIn']
    };

    return jwt.sign(
      { id, username, role },
      process.env.JWT_SECRET || 'fallback_secret',
      options
    );
  }

  static async register(input: z.infer<typeof RegisterSchema>, currentActorId?: string) {
    try {
      const hashedPassword = await bcrypt.hash(input.password, 12);

      const newUser = await prisma.user.create({
        data: {
          first_name: input.first_name,
          last_name: input.last_name,
          username: input.username,
          password: hashedPassword,
          role: input.role || 'staff',
        },
      });

      void AuditService.log({
        message: `ACCOUNT CREATION: User [${newUser.username}] registered as Role [${newUser.role}].`,
        category: LogCategory.authentication,
        type: LogType.success,
        userId: currentActorId || newUser.id,
      });

      const token = this.generateToken(newUser.id, newUser.username, newUser.role);
      return { token, user: { id: newUser.id, username: newUser.username, role: newUser.role } };
    } catch (error) {
      if (isKnownPrismaError(error, 'P2002')) {
        throw createHttpError('Validation Failure: Username already assigned to an employee.', 409);
      }

      throw createHttpError('Validation Failure: Registration failed.', 500);
    }
  }

  static async login(input: z.infer<typeof LoginSchema>) {
    const user = await prisma.user.findUnique({ where: { username: input.username } });
    if (!user || !(await bcrypt.compare(input.password, user.password))) {
      throw createHttpError('Invalid application credentials specified.', 401);
    }

    const token = this.generateToken(user.id, user.username, user.role);

    void AuditService.log({
      message: `SESSION INITIALIZED: User [${user.username}] successfully authorized terminal session access.`,
      category: LogCategory.authentication,
      type: LogType.info,
      userId: user.id,
    });

    return { token, user: { id: user.id, firstName: user.first_name, lastName: user.last_name, role: user.role } };
  }
}