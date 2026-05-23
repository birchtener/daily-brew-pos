import { apiClient } from './client';
import type { Unit } from './ingredients';

export type Batch = {
  id: string;
  ingredient_id: string;
  supplier_order_id: string;
  quantity_received: number;
  quantity_remaining: number;
  cost_per_unit: number;
  expiry: string;
  received_at: string;
  ingredient: {
    name: string;
    unit: Unit;
  };
  supplier_order: {
    id: string;
    ordered_at: string;
    supplier: {
      name: string;
    };
  };
};

export type ReceiveStockLineItem = {
  ingredient_id: string;
  quantity_received: number;
  cost_per_unit: number;
  expiry: string;
};

export type ReceiveStockPayload = {
  supplier_id: string;
  items: ReceiveStockLineItem[];
};

type ApiResponse<T> = {
  success: boolean;
  message?: string;
  data: T;
};

export async function getBatches(ingredientId?: string) {
  const params = ingredientId ? { ingredient_id: ingredientId } : {};
  const { data } = await apiClient.get<ApiResponse<Batch[]>>('/inventory/batches', { params });
  return data.data;
}

export async function receiveStock(payload: ReceiveStockPayload) {
  const { data } = await apiClient.post<ApiResponse<{ supplierOrder: any; batches: any[] }>>('/inventory/batches/receive', payload);
  return data.data;
}

export async function deleteBatch(id: string) {
  const { data } = await apiClient.delete<ApiResponse<any>>(`/inventory/batches/${id}`);
  return data.data;
}
