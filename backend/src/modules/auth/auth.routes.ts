import { Router } from 'express';
import { AuthController } from './auth.controller';
import { protect } from '../../middlewares/auth.middleware';

const router = Router();

router.post('/login', AuthController.login);
router.get('/me', protect, AuthController.me);
router.post('/refresh', AuthController.refresh);
router.post('/logout', AuthController.logout);
export default router;