import { prisma } from '../../../config/db';
import { LogCategory, LogType, Prisma } from '../../../generated/prisma/client';
import { AuditService } from '../../audit/audit.service';
import { z } from 'zod';
import { CreateSupplierSchema, UpdateSupplierSchema } from './suppliers.validation';

const createHttpError = (message: string, statusCode: number) => Object.assign(new Error(message), { statusCode });

const isKnownPrismaError = (error: unknown, code: string) =>
    error instanceof Prisma.PrismaClientKnownRequestError && error.code === code;

type AuditEntry = {
    message: string;
    category: LogCategory;
    type: LogType;
    userId: string;
};

export class SuppliersService {
    static async createSupplier(input: z.infer<typeof CreateSupplierSchema>, userId: string) {
        try {
            const supplier = await prisma.suppliers.create({
                data: {
                    ...input,
                    created_by: userId,
                    updated_by: userId,
                }
            });

            void AuditService.log({
                message: `SUPPLIERS: Supplier [${supplier.name}] added to the system.`,
                category: LogCategory.supplier,
                type: LogType.success,
                userId
            });

            return supplier;
        } catch (error) {
            if (isKnownPrismaError(error, 'P2002')) {
                throw createHttpError('Validation Failure: Supplier already exists.', 409);
            }

            throw createHttpError('Validation Failure: Supplier creation failed.', 500);
        }
    }

    static async getSuppliers(userId: string) {
        const suppliers = await prisma.suppliers.findMany({
            orderBy: { name: 'asc' }, 
        });

        await AuditService.log({
            message: `SUPPLIERS: Retrieved list of suppliers. Total count: ${suppliers.length}.`,
            category: LogCategory.supplier,
            type: LogType.info,
            userId: userId
        });

        return suppliers;
    }

    static async getSupplier(id: string, userId: string) {
        const supplier = await prisma.suppliers.findUnique({
            where: { id },
        });

        if (!supplier) {
            throw createHttpError('Validation Failure: Target resource not found.', 404);
        }

        await AuditService.log({
            message: `SUPPLIERS: Retrieved details for supplier [${supplier.name}].`,
            category: LogCategory.supplier,
            type: LogType.info,
            userId: userId
        });

        return supplier;
    }

    static async updateSupplier(id: string, input: z.infer<typeof UpdateSupplierSchema>, userId: string) {
        try {
            const updatedSupplier = await prisma.suppliers.update({
                where: { id },
                data: {
                    ...input,
                    updated_by: userId,
                },
            });
            
            void AuditService.log({
                message: `SUPPLIERS: Updated supplier [${updatedSupplier.name}].`,
                category: LogCategory.supplier,
                type: LogType.success,
                userId: userId
            });

            return updatedSupplier;
        } catch (error) {
            if (isKnownPrismaError(error, 'P2025')) {
                throw createHttpError('Validation Failure: Target resource not found.', 404);
            }

            if (isKnownPrismaError(error, 'P2002')) {
                throw createHttpError('Validation Failure: Supplier already exists.', 409);
            }

            throw createHttpError('Validation Failure: Supplier update failed.', 500);
        }
    }

    static async deleteSupplier(id: string, userId: string) {
        const auditTrail: AuditEntry[] = [];

        try {
            const deletedSupplier = await prisma.$transaction(async (tx) => {
                const supplier = await tx.suppliers.findUnique({
                    where: { id }
                });

                if (!supplier) {
                    throw createHttpError('Validation Failure: Target resource not found.', 404);
                }

                const linkedOrdersCount = await tx.supplierOrders.count({
                    where: { supplier_id: id }
                });

                if (linkedOrdersCount > 0) {
                    throw createHttpError(
                        `Validation Failure: Cannot delete supplier because ${linkedOrdersCount} linked purchase order records exist.`,
                        409
                    );
                }

                const deleted = await tx.suppliers.delete({
                    where: { id }
                });

                auditTrail.push({
                    message: `SUPPLIERS: Supplier [${supplier.name}] permanently removed from vendor records.`,
                    category: LogCategory.supplier,
                    type: LogType.warn,
                    userId
                });

                return deleted;
            });

            for (const entry of auditTrail) {
                void AuditService.log(entry);
            }

            return deletedSupplier;
        } catch (error) {
            if (error && typeof error === 'object' && 'statusCode' in error) {
                throw error;
            }

            if (isKnownPrismaError(error, 'P2025')) {
                throw createHttpError('Validation Failure: Target resource not found.', 404);
            }

            throw createHttpError('Validation Failure: Supplier deletion failed.', 500);
        }
    }
}