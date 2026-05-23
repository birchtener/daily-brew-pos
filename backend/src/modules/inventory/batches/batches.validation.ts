import { z } from 'zod';
import { Unit } from '../../../generated/prisma/client';

export const ReceiveStockLineItemSchema = z.object({
  ingredient_id: z.string().uuid(),
  quantity_received: z.coerce.number().positive('Quantity must be greater than zero.'),
  cost_per_unit: z.coerce.number().min(0, 'Cost per unit cannot be negative.'),
  expiry: z.coerce.date(),
});

export const ReceiveStockSchema = z.object({
  supplier_id: z.string().uuid(),
  items: z.array(ReceiveStockLineItemSchema).min(1, 'At least one line item is required.'),
});
