import { Router } from 'express';
import { InventoryController } from './inventory.controller';
import { protect } from '../../middlewares/auth.middleware';
import { restrictTo } from '../../middlewares/rbac.middleware';
import { Role } from '../../generated/prisma/client';
import { upload } from '../../config/cloudinary';

const router = Router();

router.use(protect);

router.post('/categories', restrictTo(Role.admin), InventoryController.addCategory);
router.post(
    '/products', 
    restrictTo(Role.admin), 
    upload.single('image'),
    InventoryController.addProduct
);

router.post('/products/recipe', restrictTo(Role.admin), InventoryController.setRecipe);

router.post(
    '/suppliers', 
    upload.single('image'),
    InventoryController.addSupplier
);

router.post('/ingredients', InventoryController.addIngredient);
router.post('/intake', InventoryController.processIntake);

export default router;