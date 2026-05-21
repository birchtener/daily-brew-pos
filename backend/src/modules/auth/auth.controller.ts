import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterSchema, LoginSchema } from './auth.validation';
import { streamUpload } from '../../config/cloudinary';
import { prisma } from '../../config/db';
import { LogCategory, LogType } from '../../generated/prisma/client';
import { AuditService } from '../audit/audit.service';

export class AuthController {
  static async register(req: Request, res: Response) {
    const data = RegisterSchema.parse(req.body);
    
    const outcome = await AuthService.register(data, req.user?.id);
    res.status(201).json({ success: true, data: outcome });
  }

  static async login(req: Request, res: Response) {
    const data = LoginSchema.parse(req.body);
    const outcome = await AuthService.login(data);
    res.status(200).json({ success: true, data: outcome });
  }

  static async updateAvatar(req: Request, res: Response) {
    if (!req.file) {
      throw Object.assign(new Error('Bad Request: No avatar image file provided.'), { statusCode: 400 });
    }

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

    await AuditService.log({
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
  }
}