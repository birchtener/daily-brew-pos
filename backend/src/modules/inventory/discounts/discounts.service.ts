import { prisma } from '../../../config/db';
import { LogCategory, LogType, Prisma } from '../../../generated/prisma/client';
import { AuditService } from '../../audit/audit.service';
import { z } from 'zod';
import { DiscountSchema } from './discounts.validation';

const createHttpError = (message: string, statusCode: number) =>
    Object.assign(new Error(message), { statusCode });

const isKnownPrismaError = (error: unknown, code: string) =>
    error instanceof Prisma.PrismaClientKnownRequestError && error.code === code;

export class DiscountsService {
    static async createDiscount(input: z.infer<typeof DiscountSchema>, userId: string) {
        try {
            const discount = await prisma.discount.create({
                data: {
                    code: input.code,
                    name: input.name,
                    percentage: input.percentage,
                    created_by: userId,
                    updated_by: userId,
                }
            });

            void AuditService.log({
                message: `CATALOG: Discount code [${discount.code}] (${discount.percentage}%) registered.`,
                category: LogCategory.discount,
                type: LogType.success,
                userId
            });

            return discount;
        } catch (error) {
            if (isKnownPrismaError(error, 'P2002')) {
                throw createHttpError('Validation Failure: A discount with this promo code already exists.', 409);
            }

            throw createHttpError('Validation Failure: Discount creation failed.', 500);
        }
    }

    static async getDiscount(id: string, userId: string) {
        const discount = await prisma.discount.findUnique({
            where: { id }
        });

        if (!discount) {
            throw createHttpError('Validation Failure: Target discount not found.', 404);
        }

        return discount;
    }

    static async getDiscounts(userId: string) {
        const discounts = await prisma.discount.findMany({
            orderBy: { created_at: 'desc' }
        });

        return discounts;
    }

    static async updateDiscount(id: string, input: z.infer<typeof DiscountSchema>, userId: string) {
        try {
            // Check if the discount exists first
            const existing = await prisma.discount.findUnique({
                where: { id }
            });

            if (!existing) {
                throw createHttpError('Validation Failure: Target resource not found.', 404);
            }

            const updatedDiscount = await prisma.discount.update({
                where: { id },
                data: {
                    code: input.code,
                    name: input.name,
                    percentage: input.percentage,
                    updated_by: userId,
                }
            });

            void AuditService.log({
                message: `CATALOG: Discount code [${updatedDiscount.code}] updated to ${updatedDiscount.percentage}%.`,
                category: LogCategory.discount,
                type: LogType.success,
                userId
            });

            return updatedDiscount;
        } catch (error) {
            if (error && typeof error === 'object' && 'statusCode' in error) {
                throw error;
            }

            if (isKnownPrismaError(error, 'P2025')) {
                throw createHttpError('Validation Failure: Target resource not found.', 404);
            }

            if (isKnownPrismaError(error, 'P2002')) {
                throw createHttpError('Validation Failure: A discount with this promo code already exists.', 409);
            }

            throw createHttpError('Validation Failure: Discount update failed.', 500);
        }
    }

    static async deleteDiscount(id: string, userId: string) {
        try {
            const targetDiscount = await prisma.discount.findUnique({
                where: { id },
                select: { code: true, percentage: true }
            });

            if (!targetDiscount) {
                throw createHttpError('Validation Failure: Target resource not found.', 404);
            }

            const deleted = await prisma.discount.delete({
                where: { id }
            });

            void AuditService.log({
                message: `CATALOG: Discount code [${targetDiscount.code}] (${targetDiscount.percentage}%) permanently removed.`,
                category: LogCategory.discount,
                type: LogType.warn,
                userId
            });

            return deleted;
        } catch (error) {
            if (error && typeof error === 'object' && 'statusCode' in error) {
                throw error;
            }

            if (isKnownPrismaError(error, 'P2025')) {
                throw createHttpError('Validation Failure: Target resource not found.', 404);
            }

            if (isKnownPrismaError(error, 'P2003')) {
                throw createHttpError(
                    'Validation Failure: Discount code cannot be deleted because it has already been applied to existing checkout order records.',
                    409
                );
            }

            throw createHttpError('Validation Failure: Discount deletion failed.', 500);
        }
    }
}
