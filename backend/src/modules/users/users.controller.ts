import { Request, Response } from 'express';
import { UsersService } from './users.service';
import { RegisterSchema, UpdateProfileSchema, UpdatePasswordSchema, UsersListQuerySchema, AdminUpdateUserSchema } from './users.validation';

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

  static async deleteAvatar(req: Request, res: Response) {
    const updatedUser = await UsersService.deleteAvatar(req.user!.id);

    res.status(200).json({
      success: true,
      message: 'Avatar image deleted successfully.',
      data: updatedUser,
    });
  }

  static async updateProfile(req: Request, res: Response) {
    const data = UpdateProfileSchema.parse(req.body);
    const updatedUser = await UsersService.updateProfile(req.user!.id, data);

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      data: updatedUser,
    });
  }

  static async updatePassword(req: Request, res: Response) {
    const data = UpdatePasswordSchema.parse(req.body);
    await UsersService.updatePassword(req.user!.id, data.currentPassword, data.newPassword);

    res.status(200).json({
      success: true,
      message: 'Password updated successfully.',
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

  static async listUsers(req: Request, res: Response) {
    const data = UsersListQuerySchema.parse(req.query);
    const result = await UsersService.list({ page: data.page, perPage: data.perPage, q: data.q, role: data.role });
    res.status(200).json({ success: true, data: result });
  }

  static async updateUser(req: Request, res: Response) {
    const targetUserId = Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId;
    if (!targetUserId) {
      throw Object.assign(new Error('Bad Request: No user id provided.'), { statusCode: 400 });
    }

    const data = AdminUpdateUserSchema.parse(req.body);
    const updated = await UsersService.adminUpdateProfile(targetUserId, data, req.user!.id);

    res.status(200).json({ success: true, data: updated });
  }

  static async resetPassword(req: Request, res: Response) {
    const targetUserId = Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId;
    if (!targetUserId) {
      throw Object.assign(new Error('Bad Request: No user id provided.'), { statusCode: 400 });
    }

    const outcome = await UsersService.adminResetPassword(targetUserId, req.user!.id);

    res.status(200).json({ success: true, data: outcome });
  }

  static async updateUserAvatar(req: Request, res: Response) {
    if (!req.file) {
      throw Object.assign(new Error('Bad Request: No avatar image file provided.'), { statusCode: 400 });
    }

    const targetUserId = Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId;
    if (!targetUserId) {
      throw Object.assign(new Error('Bad Request: No user id provided.'), { statusCode: 400 });
    }

    const updatedUser = await UsersService.adminUpdateAvatar(req.file.buffer, targetUserId, req.user!.id);

    res.status(200).json({ success: true, message: 'Avatar updated successfully.', data: updatedUser });
  }

  static async deleteUserAvatar(req: Request, res: Response) {
    const targetUserId = Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId;
    if (!targetUserId) {
      throw Object.assign(new Error('Bad Request: No user id provided.'), { statusCode: 400 });
    }

    const updatedUser = await UsersService.adminDeleteAvatar(targetUserId, req.user!.id);

    res.status(200).json({ success: true, message: 'Avatar deleted successfully.', data: updatedUser });
  }
}