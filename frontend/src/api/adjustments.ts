import { apiClient } from './client';
import type { Unit } from './ingredients';

export type AdjustmentReason = 'spill' | 'expired' | 'waste' | 'theft' | 'correction';

export type InventoryAdjustment = {
  id: string;
  ingredient_id: string;
  batch_id: string;
  quantity: number;
  cost_lost: number;
  reason: AdjustmentReason;
  notes: string | null;
  created_at: string;
  created_by: string;
  ingredient: { name: string; unit: Unit };
  batch: { received_at: string; expiry: string; cost_per_unit: number };
  created_by_user?: { first_name: string; last_name: string; username: string };
};

export type CreateAdjustmentPayload = {
  ingredient_id: string;
  batch_id?: string;
  quantity: number;
  reason: AdjustmentReason;
  notes?: string;
};

type ApiResponse<T> = {
  success: boolean;
  message?: string;
  data: T;
};

export async function createAdjustment(payload: CreateAdjustmentPayload) {
  const { data } = await apiClient.post<ApiResponse<InventoryAdjustment[]>>('/inventory/adjustments', payload);
  return data.data;
}

export async function getAdjustments(ingredientId?: string) {
  const params = ingredientId ? { ingredient_id: ingredientId } : {};
  const { data } = await apiClient.get<ApiResponse<InventoryAdjustment[]>>('/inventory/adjustments', { params });
  return data.data;
}
