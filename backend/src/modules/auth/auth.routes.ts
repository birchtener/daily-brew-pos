import { Router } from 'express';
import { AuthController } from './auth.controller';
import { protect } from '../../middlewares/auth.middleware';
import { restrictTo } from '../../middlewares/rbac.middleware';
import { Role } from '../../generated/prisma/client';
import { upload } from '../../config/cloudinary';

const router = Router();

router.post('/login', AuthController.login);

router.post('/register', protect, restrictTo(Role.admin), AuthController.register);

router.put(
    '/avatar', 
    protect,
    restrictTo(Role.admin, Role.staff),
    upload.single('avatar'), 
    AuthController.updateAvatar
);

export default router;