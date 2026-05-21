import { prisma } from '../../config/db';
import { LogCategory, LogType } from '../../generated/prisma/client';
import { AuditService } from '../audit/audit.service';
import { z } from 'zod';
import { 
  CreateCategorySchema, 
  CreateProductSchema, 
  CreateSupplierSchema, 
  CreateIngredientSchema, 
  SupplierOrderSchema 
} from './inventory.validation';

export class InventoryService {
  static async createCategory(input: z.infer<typeof CreateCategorySchema>, userId: string) {
    const category = await prisma.category.create({
      data: {
        name: input.name,
        created_by: userId,
        updated_by: userId,
      }
    });

    await AuditService.log({
      message: `CATALOG: Category [${category.name}] established.`,
      category: LogCategory.category,
      type: LogType.success,
      userId
    });

    return category;
  }

  static async createProduct(input: z.infer<typeof CreateProductSchema>, userId: string) {
    const product = await prisma.product.create({
      data: {
        name: input.name,
        price: input.price,
        category_id: input.category_id,
        img_path: input.img_path,
        created_by: userId,
        updated_by: userId,
      }
    });

    await AuditService.log({
      message: `CATALOG: Menu Product [${product.name}] registered at price base [${product.price}].`,
      category: LogCategory.product,
      type: LogType.success,
      userId
    });

    return product;
  }

  static async createSupplier(input: z.infer<typeof CreateSupplierSchema>, userId: string) {
    return await prisma.suppliers.create({
      data: {
        ...input,
        created_by: userId,
        updated_by: userId,
      }
    });
  }

  static async createIngredient(input: z.infer<typeof CreateIngredientSchema>, userId: string) {
    return await prisma.ingredients.create({
      data: {
        ...input,
        created_by: userId,
        updated_by: userId,
      }
    });
  }

  static async receiveSupplierOrder(input: z.infer<typeof SupplierOrderSchema>, userId: string) {
    return await prisma.$transaction(async (tx) => {
      const supplierOrder = await tx.supplierOrders.create({
        data: {
          supplier_id: input.supplier_id,
          ordered_by: userId,
        }
      });

      const batchCreationPromises = input.batches.map((batchItem) => {
        return tx.ingredientBatches.create({
          data: {
            ingredient_id: batchItem.ingredient_id,
            supplier_order_id: supplierOrder.id,
            quantity_received: batchItem.quantity_received,
            quantity_remaining: batchItem.quantity_received, // New stock starts fully unconsumed
            cost_per_unit: batchItem.cost_per_unit,
            expiry: new Date(batchItem.expiry),
          },
          include: {
            ingredient: true
          }
        });
      });

      const createdBatches = await Promise.all(batchCreationPromises);

      const logManifest = createdBatches
        .map(b => `${b.ingredient.name}: ${b.quantity_received} ${b.ingredient.unit} @ $${b.cost_per_unit}/unit`)
        .join(', ');

      await AuditService.log({
        message: `STOCK RECEIVE: Processed supplier intake [${supplierOrder.id}]. Items ingested: [${logManifest}].`,
        category: LogCategory.inventory,
        type: LogType.success,
        userId
      });

      return {
        supplier_order_id: supplierOrder.id,
        items_received_count: createdBatches.length
      };
    });
  }
}