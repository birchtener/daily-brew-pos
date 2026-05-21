import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterSchema, LoginSchema } from './auth.validation';

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
}