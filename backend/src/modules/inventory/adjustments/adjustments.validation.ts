import { z } from "zod";
import { AdjustmentReason } from "../../../generated/prisma/client";

export const CreateAdjustmentSchema = z.object({
  ingredient_id: z.string().uuid(),
  batch_id: z.string().uuid().optional(),
  direction: z.enum(["decrease", "increase"]).default("decrease"),
  quantity: z.number().positive("Quantity must be greater than zero"),
  reason: z.nativeEnum(AdjustmentReason),
  notes: z.string().max(500).optional(),
});
