import { Router } from 'express';
import { AuditController } from './audit.controller';
import { protect } from '../../middlewares/auth.middleware';
import { restrictTo } from '../../middlewares/rbac.middleware';
import { Role } from '../../generated/prisma/client';

const router = Router();

router.get('/', protect, restrictTo(Role.admin, Role.staff), AuditController.getLogs);

export default router;
