import { z } from 'zod';

export const OrderLineItemSchema = z.object({
  product_id: z.string().uuid(),
  quantity: z.number().int().positive(),
});

export const CreateOrderSchema = z.object({
  discount_code: z.string().max(50).optional().nullable(),
  items: z.array(OrderLineItemSchema).min(1),
  park: z.boolean().default(false),
  payment_method: z.string().max(20).optional().nullable(),
});

export const FinalizeParkedOrderSchema = z.object({
  discount_code: z.string().max(50).optional().nullable(),
  items: z.array(OrderLineItemSchema).min(1),
  payment_method: z.string().min(1).max(20),
});