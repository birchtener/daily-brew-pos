import { prisma } from '../../../config/db';
import { LogCategory, LogType } from '../../../generated/prisma/client';
import { AuditService } from '../../audit/audit.service';
import { z } from 'zod';
import { CreateSupplierSchema, UpdateSupplierSchema } from './suppliers.validation';

export class SuppliersService {
    static async createSupplier(input: z.infer<typeof CreateSupplierSchema>, userId: string) {
        const supplier = await prisma.suppliers.create({
            data: {
                ...input,
                created_by: userId,
                updated_by: userId,
            }
        });

        await AuditService.log({
            message: `SUPPLIERS: Supplier [${supplier.name}] added to the system.`,
            category: LogCategory.supplier,
            type: LogType.success,
            userId
        });

        return supplier;
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
            throw new Error('Supplier not found');
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
            
            await AuditService.log({
                message: `SUPPLIERS: Updated supplier [${updatedSupplier.name}].`,
                category: LogCategory.supplier,
                type: LogType.success,
                userId: userId
            });

            return updatedSupplier;
        } catch (error) {
            throw new Error('Supplier not found or update validation failed');
        }
    }

    static async deleteSupplier(id: string, userId: string) {
        return await prisma.$transaction(async (tx) => {
            const supplier = await tx.suppliers.findUnique({
                where: { id }
            });

            if (!supplier) {
                throw new Error('Supplier not found');
            }

            const linkedOrdersCount = await tx.supplierOrders.count({
                where: { supplier_id: id }
            });

            if (linkedOrdersCount > 0) {
                throw new Error(
                    `Cannot delete supplier: This vendor has ${linkedOrdersCount} active purchase order logs in the system. Archive or flag them as inactive instead to protect your accounting trail!`
                );
            }

            const deletedSupplier = await tx.suppliers.delete({
                where: { id }
            });

            await AuditService.log({
                message: `SUPPLIERS: Supplier [${supplier.name}] permanently removed from vendor records.`,
                category: LogCategory.supplier,
                type: LogType.warn,
                userId
            });

            return deletedSupplier;
        });
    }
}