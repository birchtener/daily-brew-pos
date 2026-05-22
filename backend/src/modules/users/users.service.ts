import { prisma } from '../../config/db';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { AuditService } from '../audit/audit.service';
import { LogCategory, LogType, Prisma } from '../../generated/prisma/client';
import { z } from 'zod';
import { RegisterSchema, UpdateProfileSchema } from './users.validation';
import { streamUpload } from '../../config/cloudinary';

const createHttpError = (message: string, statusCode: number) => Object.assign(new Error(message), { statusCode });

const isKnownPrismaError = (error: unknown, code: string) =>
  error instanceof Prisma.PrismaClientKnownRequestError && error.code === code;

const PASSWORD_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

const generatePassword = (length = 8) =>
  Array.from({ length }, () => PASSWORD_ALPHABET[crypto.randomInt(0, PASSWORD_ALPHABET.length)]).join('');

export class UsersService {
  static async register(input: z.infer<typeof RegisterSchema>, currentActorId?: string) {
    try {
      const generatedPassword = generatePassword(8);
      const hashedPassword = await bcrypt.hash(generatedPassword, 12);

      const newUser = await prisma.user.create({
        data: {
          first_name: input.first_name,
          last_name: input.last_name,
          username: input.username,
          password: hashedPassword,
          role: input.role || 'staff',
          is_password_temp: true,
          deleted_at: null,
        },
      });

      void AuditService.log({
        message: `ACCOUNT CREATION: User [${newUser.username}] registered as Role [${newUser.role}].`,
        category: LogCategory.authentication,
        type: LogType.success,
        userId: currentActorId || newUser.id,
      });

      return {
        user: {
          id: newUser.id,
          username: newUser.username,
          role: newUser.role,
          is_password_temp: newUser.is_password_temp,
        },
        password: generatedPassword,
      };
    } catch (error) {
      if (isKnownPrismaError(error, 'P2002')) {
        throw createHttpError('Validation Failure: Username already assigned to an employee.', 409);
      }
      throw createHttpError('Validation Failure: Registration failed.', 500);
    }
  }

  static async updateAvatar(fileBuffer: Buffer, userId: string) {
    const userExists = await prisma.user.findFirst({ where: { id: userId, deleted_at: null } });
    if (!userExists) {
      throw createHttpError('Validation Failure: Target resource not found.', 404);
    }

    try {
      const secureUrl = await streamUpload(fileBuffer, 'avatars');

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { avatar_url: secureUrl },
        select: {
          id: true,
          username: true,
          first_name: true,
          last_name: true,
          avatar_url: true,
          role: true,
          is_password_temp: true,
        },
      });

      void AuditService.log({
        message: `PROFILE UPDATE: User [${updatedUser.username}] updated their profile avatar image.`,
        category: LogCategory.authentication,
        type: LogType.info,
        userId,
      });

      return updatedUser;
    } catch (error) {
      throw createHttpError('Validation Failure: Avatar upload failed.', 500);
    }
  }

  static async deleteAvatar(userId: string) {
    const userExists = await prisma.user.findFirst({ where: { id: userId, deleted_at: null } });
    if (!userExists) {
      throw createHttpError('Validation Failure: Target resource not found.', 404);
    }

    try {
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { avatar_url: null },
        select: {
          id: true,
          username: true,
          first_name: true,
          last_name: true,
          avatar_url: true,
          role: true,
          is_password_temp: true,
        },
      });

      void AuditService.log({
        message: `PROFILE UPDATE: User [${updatedUser.username}] deleted their profile avatar.`,
        category: LogCategory.authentication,
        type: LogType.info,
        userId,
      });

      return updatedUser;
    } catch (error) {
      throw createHttpError('Validation Failure: Avatar deletion failed.', 500);
    }
  }

  static async updateProfile(userId: string, input: z.infer<typeof UpdateProfileSchema>) {
    const userExists = await prisma.user.findFirst({ where: { id: userId, deleted_at: null } });
    if (!userExists) {
      throw createHttpError('Validation Failure: Target resource not found.', 404);
    }

    try {
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          first_name: input.first_name,
          last_name: input.last_name,
        },
        select: {
          id: true,
          username: true,
          first_name: true,
          last_name: true,
          avatar_url: true,
          role: true,
          is_password_temp: true,
        },
      });

      void AuditService.log({
        message: `PROFILE UPDATE: User [${updatedUser.username}] updated their profile information.`,
        category: LogCategory.authentication,
        type: LogType.info,
        userId,
      });

      return updatedUser;
    } catch (error) {
      if (isKnownPrismaError(error, 'P2025')) {
        throw createHttpError('Validation Failure: Target resource not found.', 404);
      }
      throw createHttpError('Validation Failure: Profile update failed.', 500);
    }
  }

  static async updatePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await prisma.user.findFirst({
      where: { id: userId, deleted_at: null },
      select: { id: true, password: true },
    });

    if (!user) {
      throw createHttpError('Validation Failure: Target resource not found.', 404);
    }

    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      throw createHttpError('Validation Failure: Incorrect current password.', 400);
    }

    try {
      const hashedPassword = await bcrypt.hash(newPassword, 12);

      await prisma.user.update({
        where: { id: userId },
        data: { password: hashedPassword, is_password_temp: false },
      });

      void AuditService.log({
        message: `PROFILE UPDATE: User [${userId}] updated their account password.`,
        category: LogCategory.authentication,
        type: LogType.info,
        userId,
      });
    } catch (error) {
      if (isKnownPrismaError(error, 'P2025')) {
        throw createHttpError('Validation Failure: Target resource not found.', 404);
      }
      throw createHttpError('Validation Failure: Password update failed.', 500);
    }
  }

  static async adminResetPassword(targetUserId: string, adminActorId: string) {
    try {
      const tempPassword = generatePassword(8);
      const hashedPassword = await bcrypt.hash(tempPassword, 12);

      const existingUser = await prisma.user.findFirst({
        where: { id: targetUserId, deleted_at: null },
        select: { id: true, username: true },
      });

      if (!existingUser) {
        throw createHttpError('Validation Failure: Target user not found.', 404);
      }

      const updatedUser = await prisma.user.update({
        where: { id: targetUserId },
        data: { password: hashedPassword, is_password_temp: true },
        select: { id: true, username: true, is_password_temp: true },
      });

      void AuditService.log({
        message: `PASSWORD RESET BY ADMIN: Administrator [${adminActorId}] forced a password reset for User [${updatedUser.username}].`,
        category: LogCategory.authentication,
        type: LogType.info,
        userId: adminActorId,
      });

      return {
        username: updatedUser.username,
        temporaryPassword: tempPassword,
      };
    } catch (error) {
      if (isKnownPrismaError(error, 'P2025')) {
        throw createHttpError('Validation Failure: Target user not found.', 404);
      }
      throw createHttpError('Validation Failure: Admin password reset failed.', 500);
    }
  }

  static async deleteUser(targetUserId: string, adminActorId: string) {
    try {
      if (targetUserId === adminActorId) {
        throw createHttpError('Validation Failure: You cannot delete your own account.', 400);
      }

      const user = await prisma.user.findFirst({
        where: { id: targetUserId, deleted_at: null },
        select: { id: true, username: true },
      });

      if (!user) {
        throw createHttpError('Validation Failure: Target user not found.', 404);
      }

      const deletedAt = new Date();

      await prisma.user.update({
        where: { id: targetUserId },
        data: {
          deleted_at: deletedAt,
        },
      });

      void AuditService.log({
        message: `ACCOUNT DELETION: Administrator [${adminActorId}] soft deleted User [${user.username}].`,
        category: LogCategory.authentication,
        type: LogType.warn,
        userId: adminActorId,
      });

      return {
        id: user.id,
        username: user.username,
        deleted_at: deletedAt,
      };
    } catch (error) {
      if ((error as { statusCode?: number }).statusCode) {
        throw error;
      }

      if (isKnownPrismaError(error, 'P2025')) {
        throw createHttpError('Validation Failure: Target user not found.', 404);
      }

      throw createHttpError('Validation Failure: User deletion failed.', 500);
    }
  }
}