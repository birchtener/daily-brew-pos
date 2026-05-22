import { Router } from 'express';
import { UsersController } from './users.controller';
import { protect } from '../../middlewares/auth.middleware';
import { restrictTo } from '../../middlewares/rbac.middleware';
import { Role } from '../../generated/prisma/client';
import { upload } from '../../config/cloudinary';

const router = Router();

router.post('/register', protect, restrictTo(Role.admin), UsersController.register);

router.put(
    '/avatar',
    protect,
    restrictTo(Role.admin, Role.staff),
    upload.single('avatar'),
    UsersController.updateAvatar
);

router.put('/profile', protect, restrictTo(Role.admin, Role.staff), UsersController.updateProfile);
router.put('/password', protect, restrictTo(Role.admin, Role.staff), UsersController.updatePassword);

router.delete('/:userId', protect, restrictTo(Role.admin), UsersController.deleteUser);

export default router;