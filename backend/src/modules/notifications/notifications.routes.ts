import { Router } from 'express';
import { NotificationsController } from './notifications.controller';
import { protect } from '../../middlewares/auth.middleware';
import { restrictTo } from '../../middlewares/rbac.middleware';
import { Role } from '../../generated/prisma/client';

const router = Router();

router.use(protect, restrictTo(Role.admin, Role.staff));

router.get('/', NotificationsController.list);
router.post('/', NotificationsController.create);
router.patch('/read-all', NotificationsController.markAllAsRead);
router.patch('/:id/read', NotificationsController.markAsRead);
router.delete('/:id', NotificationsController.remove);

export default router;
