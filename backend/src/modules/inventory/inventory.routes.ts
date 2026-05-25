import { Router } from 'express';
import { CategoriesController } from './categories/categories.controller';
import { IngredientsController } from './ingredients/ingredients.controller';
import { ProductsController } from './products/products.controller';
import { SuppliersController } from './suppliers/suppliers.controller';
import { BatchesController } from './batches/batches.controller';
import { DiscountsController } from './discounts/discounts.controller';
import { AdjustmentsController } from './adjustments/adjustments.controller';
import { protect } from '../../middlewares/auth.middleware';
import { restrictTo } from '../../middlewares/rbac.middleware';
import { Role } from '../../generated/prisma/client';
import { upload } from '../../config/cloudinary';

const router = Router();

router.use(protect);

// Category Routes
router.post('/categories', restrictTo(Role.admin), CategoriesController.addCategory);
router.get('/categories', restrictTo(Role.admin, Role.staff), CategoriesController.getCategories);
router.get('/categories/:id', restrictTo(Role.admin, Role.staff), CategoriesController.getCategory);
router.put('/categories/:id', restrictTo(Role.admin), CategoriesController.updateCategory);
router.delete('/categories/:id', restrictTo(Role.admin), CategoriesController.deleteCategory);

// Ingredient Routes
router.post('/ingredients', restrictTo(Role.admin, Role.staff), upload.single('image'), IngredientsController.addIngredient);
router.get('/ingredients', restrictTo(Role.admin, Role.staff), IngredientsController.getIngredients);
router.get('/ingredients/:id', restrictTo(Role.admin, Role.staff), IngredientsController.getIngredient);
router.put('/ingredients/:id', restrictTo(Role.admin), upload.single('image'), IngredientsController.updateIngredient);
router.delete('/ingredients/:id', restrictTo(Role.admin), IngredientsController.deleteIngredient);

// Product Routes
router.post('/products', restrictTo(Role.admin), upload.single('image'), ProductsController.addProduct);
router.get('/products', restrictTo(Role.admin, Role.staff), ProductsController.getProducts);
router.get('/products/:id', restrictTo(Role.admin, Role.staff), ProductsController.getProduct);
router.put('/products/:id', restrictTo(Role.admin), upload.single('image'), ProductsController.updateProduct);
router.delete('/products/:id', restrictTo(Role.admin), ProductsController.deleteProduct);

// Supplier Routes
router.post('/suppliers', restrictTo(Role.admin), SuppliersController.addSupplier);
router.get('/suppliers', restrictTo(Role.admin, Role.staff), SuppliersController.getSuppliers);
router.get('/suppliers/:id', restrictTo(Role.admin, Role.staff), SuppliersController.getSupplier);
router.put('/suppliers/:id', restrictTo(Role.admin), SuppliersController.updateSupplier);
router.delete('/suppliers/:id', restrictTo(Role.admin), SuppliersController.deleteSupplier);

// Discount Routes
router.post('/discounts', restrictTo(Role.admin), DiscountsController.addDiscount);
router.get('/discounts', restrictTo(Role.admin, Role.staff), DiscountsController.getDiscounts);
router.get('/discounts/:id', restrictTo(Role.admin, Role.staff), DiscountsController.getDiscount);
router.put('/discounts/:id', restrictTo(Role.admin), DiscountsController.updateDiscount);
router.delete('/discounts/:id', restrictTo(Role.admin), DiscountsController.deleteDiscount);

// Batch Routes
router.get('/batches', restrictTo(Role.admin, Role.staff), BatchesController.getBatches);
router.post('/batches/receive', restrictTo(Role.admin, Role.staff), BatchesController.receiveStock);
router.delete('/batches/:id', restrictTo(Role.admin), BatchesController.deleteBatch);
router.get('/supplier-orders/recent', restrictTo(Role.admin, Role.staff), BatchesController.getRecentSupplierOrders);
router.get('/supplier-orders/:id/pdf', restrictTo(Role.admin, Role.staff), BatchesController.getPurchaseOrderPdf);

// Adjustment Routes
router.get('/adjustments', restrictTo(Role.admin, Role.staff), AdjustmentsController.getAdjustments);
router.post('/adjustments', restrictTo(Role.admin, Role.staff), AdjustmentsController.createAdjustment);

export default router;