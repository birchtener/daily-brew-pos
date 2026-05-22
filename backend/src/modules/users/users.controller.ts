import { Request, Response } from 'express';
import { UsersService } from './users.service';
import { RegisterSchema } from './users.validation';

export class UsersController {
  static async register(req: Request, res: Response) {
    const data = RegisterSchema.parse(req.body);

    const outcome = await UsersService.register(data, req.user?.id);
    res.status(201).json({ success: true, data: outcome });
  }

  static async updateAvatar(req: Request, res: Response) {
    if (!req.file) {
      throw Object.assign(new Error('Bad Request: No avatar image file provided.'), { statusCode: 400 });
    }

    const updatedUser = await UsersService.updateAvatar(req.file.buffer, req.user!.id);

    res.status(200).json({
      success: true,
      message: 'Avatar image updated successfully.',
      data: updatedUser,
    });
  }

  static async deleteUser(req: Request, res: Response) {
    const targetUserId = Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId;

    if (!targetUserId) {
      throw Object.assign(new Error('Bad Request: No user id provided.'), { statusCode: 400 });
    }

    const outcome = await UsersService.deleteUser(targetUserId, req.user!.id);

    res.status(200).json({
      success: true,
      message: 'User deleted successfully.',
      data: outcome,
    });
  }
}