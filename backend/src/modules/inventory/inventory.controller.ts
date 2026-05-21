import { Request, Response } from 'express';
import { InventoryService } from './inventory.service';
import { RecipeService } from './recipe.service'; 
import { ConfigureRecipeSchema } from './recipe.validation';
import { 
  CreateCategorySchema, 
  CreateProductSchema, 
  CreateSupplierSchema, 
  CreateIngredientSchema, 
  SupplierOrderSchema 
} from './inventory.validation';
import { streamUpload } from '../../config/cloudinary';


export class InventoryController {
  static async addCategory(req: Request, res: Response) {
    const cleanData = CreateCategorySchema.parse(req.body);
    const data = await InventoryService.createCategory(cleanData, req.user!.id);
    res.status(201).json({ success: true, data });
  }

  static async addProduct(req: Request, res: Response) {
    let secureUrl: string | null = null;

    if (req.file) {
      secureUrl = await streamUpload(req.file.buffer, 'products');
    }

    const parsedPayload = {
      name: req.body.name,
      price: req.body.price ? Number(req.body.price) : undefined,
      category_id: req.body.category_id,
      img_path: secureUrl
    };

    const cleanData = CreateProductSchema.parse(parsedPayload);
    const data = await InventoryService.createProduct(cleanData, req.user!.id);

    res.status(201).json({ success: true, data });
  }

  static async addSupplier(req: Request, res: Response) {
    const cleanData = CreateSupplierSchema.parse(req.body);
    const data = await InventoryService.createSupplier(cleanData, req.user!.id);
    res.status(201).json({ success: true, data });
  }

  static async addIngredient(req: Request, res: Response) {
    let secureUrl: string | null = null;

    if (req.file) {
      secureUrl = await streamUpload(req.file.buffer, 'ingredients');
    }

    const parsedPayload = {
      name: req.body.name,
      unit: req.body.unit,
      img_path: secureUrl
    };

    const cleanData = CreateIngredientSchema.parse(parsedPayload);
    const data = await InventoryService.createIngredient(cleanData, req.user!.id);
    res.status(201).json({ success: true, data });
  }

  static async processIntake(req: Request, res: Response) {
    const cleanData = SupplierOrderSchema.parse(req.body);
    const data = await InventoryService.receiveSupplierOrder(cleanData, req.user!.id);
    res.status(201).json({ success: true, data });
  }

  static async setRecipe(req: Request, res: Response) {
    const cleanData = ConfigureRecipeSchema.parse(req.body);
    const data = await RecipeService.setProductRecipe(cleanData, req.user!.id);
    
    res.status(200).json({ 
      success: true, 
      message: 'Product bill of materials recipe mapped successfully.',
      data 
    });
  }
}