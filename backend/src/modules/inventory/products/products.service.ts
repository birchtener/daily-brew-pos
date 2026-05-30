import { prisma } from "../../../config/db";
import { LogCategory, LogType, Prisma } from "../../../generated/prisma/client";
import { AuditService } from "../../audit/audit.service";
import { CreateProductInput, UpdateProductInput } from "./products.validation";
import { deleteImage } from "../../../config/cloudinary";
const createHttpError = (message: string, statusCode: number) =>
  Object.assign(new Error(message), { statusCode });

const isKnownPrismaError = (error: unknown, code: string) =>
  error instanceof Prisma.PrismaClientKnownRequestError && error.code === code;

type AuditEntry = {
  message: string;
  category: LogCategory;
  type: LogType;
  userId: string;
};

export class ProductsService {
  static async createProduct(input: CreateProductInput, userId: string) {
    try {
      return await prisma.$transaction(async (tx) => {
        const product = await tx.product.create({
          data: {
            name: input.name,
            price: input.price,
            category_id: input.category_id,
            img_path: input.img_path,
            created_by: userId,
            updated_by: userId,
            recipes: input.ingredients?.length
              ? {
                  create: input.ingredients.map((item) => ({
                    ingredient_id: item.ingredient_id,
                    quantity: item.quantity,
                    unit: item.unit,
                    created_by: userId,
                    updated_by: userId,
                  })),
                }
              : undefined,
          },
          include: {
            category: true,
            recipes: {
              include: {
                ingredient: true,
              },
            },
          },
        });

        return product;
      });
    } catch (error) {
      if (isKnownPrismaError(error, "P2002")) {
        throw createHttpError(
          "Validation Failure: Product already exists.",
          409,
        );
      }

      if (isKnownPrismaError(error, "P2003")) {
        throw createHttpError(
          "Validation Failure: Related record missing or invalid.",
          409,
        );
      }

      throw createHttpError(
        "Validation Failure: Product creation failed.",
        500,
      );
    }
  }

  static async getProduct(id: string, userId: string) {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        recipes: {
          include: {
            ingredient: true,
          },
        },
      },
    });

    if (!product || product.deleted_at !== null) {
      throw createHttpError(
        "Validation Failure: Target resource not found.",
        404,
      );
    }

    await AuditService.log({
      message: `CATALOG: Product [${product.name}] retrieved.`,
      category: LogCategory.product,
      type: LogType.info,
      userId,
    });

    return product;
  }

  static async getProducts(userId: string) {
    const products = await prisma.product.findMany({
      where: { deleted_at: null },
      orderBy: { name: "asc" },
      include: {
        category: true,
        recipes: {
          include: {
            ingredient: true,
          },
        },
      },
    });

    await AuditService.log({
      message: `CATALOG: All active products retrieved.`,
      category: LogCategory.product,
      type: LogType.info,
      userId,
    });

    return products;
  }

  static async updateProduct(
    productId: string,
    input: UpdateProductInput,
    userId: string,
  ) {
    try {
      return await prisma.$transaction(async (tx) => {
        const existingProduct = await tx.product.findUnique({
          where: { id: productId },
          select: { img_path: true },
        });

        const updatedProduct = await tx.product.update({
          where: { id: productId },
          data: {
            name: input.name,
            price: input.price,
            category_id: input.category_id,
            img_path: input.img_path,
            updated_by: userId,
            recipes: input.ingredients
              ? {
                  deleteMany: {},
                  create: input.ingredients.length
                    ? input.ingredients.map((item) => ({
                        ingredient_id: item.ingredient_id,
                        quantity: item.quantity,
                        unit: item.unit,
                        created_by: userId,
                        updated_by: userId,
                      }))
                    : undefined,
                }
              : undefined,
          },
          include: {
            category: true,
            recipes: {
              include: {
                ingredient: true,
              },
            },
          },
        });

        if (existingProduct && existingProduct.img_path) {
          const oldImg = existingProduct.img_path;
          const newImg = input.img_path;

          if (!newImg || oldImg !== newImg) {
            await deleteImage(oldImg);
          }
        }

        return updatedProduct;
      });
    } catch (error) {
      if (isKnownPrismaError(error, "P2025")) {
        throw createHttpError(
          "Validation Failure: Target resource not found.",
          404,
        );
      }

      if (isKnownPrismaError(error, "P2002")) {
        throw createHttpError(
          "Validation Failure: Product already exists.",
          409,
        );
      }

      if (isKnownPrismaError(error, "P2003")) {
        throw createHttpError(
          "Validation Failure: Related record missing or invalid.",
          409,
        );
      }

      throw createHttpError("Validation Failure: Product update failed.", 500);
    }
  }

  static async deleteProduct(id: string, userId: string) {
    const auditTrail: AuditEntry[] = [];

    try {
      const deletedProduct = await prisma.$transaction(async (tx) => {
        const productWithRelations = await tx.product.findUnique({
          where: { id },
        });

        if (!productWithRelations || productWithRelations.deleted_at !== null) {
          throw createHttpError(
            "Validation Failure: Target resource not found.",
            404,
          );
        }

        await deleteImage(productWithRelations.img_path);

        const deleted = await tx.product.update({
          where: { id },
          data: { deleted_at: new Date() },
        });

        auditTrail.push({
          message: `CATALOG: Product [${productWithRelations.name}] soft-deleted from active POS menu lines.`,
          category: LogCategory.product,
          type: LogType.warn,
          userId,
        });

        return deleted;
      });

      for (const entry of auditTrail) {
        void AuditService.log(entry);
      }

      return deletedProduct;
    } catch (error) {
      if (error && typeof error === "object" && "statusCode" in error) {
        throw error;
      }

      if (isKnownPrismaError(error, "P2025")) {
        throw createHttpError(
          "Validation Failure: Target resource not found.",
          404,
        );
      }

      throw createHttpError(
        "Validation Failure: Product deletion failed.",
        500,
      );
    }
  }
}
