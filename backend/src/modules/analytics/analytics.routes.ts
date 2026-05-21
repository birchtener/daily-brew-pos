import { Router } from 'express';
import { AnalyticsController } from './analytics.controller';
import { protect } from '../../middlewares/auth.middleware';
import { restrictTo } from '../../middlewares/rbac.middleware';
import { Role } from '../../generated/prisma/client';

const router = Router();

router.use(protect, restrictTo(Role.admin));

router.get('/financials', AnalyticsController.getProfitMargins);
router.get('/product-velocity', AnalyticsController.getVelocityReport);
router.get('/inventory-health', AnalyticsController.getStockHealth);

export default router;