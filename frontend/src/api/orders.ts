import { apiClient } from './client';
import { type Product } from './products';

export type OrderItem = {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  price: number;
  sub_total: number;
  product?: Product;
};

export type Payment = {
  id: string;
  order_id: string;
  amount: number;
  method: string;
  paid_at: string;
};

export type Order = {
  id: string;
  discount_code: string | null;
  sub_total: number;
  total: number;
  order_status: 'pending' | 'parked' | 'completed' | 'cancelled';
  created_at: string;
  created_by: string;
  items?: OrderItem[];
  payment?: Payment | null;
};

type ApiResponse<T> = {
  success: boolean;
  message?: string;
  data: T;
};

export async function checkout(payload: {
  discount_code?: string | null;
  items: { product_id: string; quantity: number }[];
  park?: boolean;
  payment_method?: string | null;
}) {
  const { data } = await apiClient.post<ApiResponse<Order>>('/orders', payload);
  return data.data;
}

export async function getParkedOrders() {
  const { data } = await apiClient.get<ApiResponse<Order[]>>('/orders/parked');
  return data.data;
}

export async function getCompletedOrders() {
  const { data } = await apiClient.get<ApiResponse<Order[]>>('/orders/completed');
  return data.data;
}

export async function getCancelledOrders() {
  const { data } = await apiClient.get<ApiResponse<Order[]>>('/orders/cancelled');
  return data.data;
}

export async function finalizeParkedOrder(
  id: string,
  payload: {
    discount_code?: string | null;
    items: { product_id: string; quantity: number }[];
    payment_method: string;
  }
) {
  const { data } = await apiClient.put<ApiResponse<Order>>(`/orders/parked/${id}/finalize`, payload);
  return data.data;
}

export async function cancelParkedOrder(id: string) {
  const { data } = await apiClient.delete<ApiResponse<null>>(`/orders/parked/${id}`);
  return data.data;
}

export async function voidOrder(id: string) {
  const { data } = await apiClient.delete<ApiResponse<null>>(`/orders/completed/${id}/void`);
  return data.data;
}