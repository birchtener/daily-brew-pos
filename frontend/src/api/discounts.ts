import { apiClient } from "./client";

export type Discount = {
  id: string;
  code: string;
  name: string;
  percentage: number;
  created_by: string;
  updated_by: string;
  created_at: string;
  updated_at: string;
};

type ApiResponse<T> = {
  success: boolean;
  message?: string;
  data: T;
};

export async function getDiscounts() {
  const { data } = await apiClient.get<ApiResponse<Discount[]>>(
    "/inventory/discounts",
  );
  return data.data;
}

export async function createDiscount(payload: {
  code: string;
  name: string;
  percentage: number;
}) {
  const { data } = await apiClient.post<ApiResponse<Discount>>(
    "/inventory/discounts",
    payload,
  );
  return data.data;
}

export async function updateDiscount(
  id: string,
  payload: { code: string; name: string; percentage: number },
) {
  const { data } = await apiClient.patch<ApiResponse<Discount>>(
    `/inventory/discounts/${id}`,
    payload,
  );
  return data.data;
}

export async function deleteDiscount(id: string) {
  const { data } = await apiClient.delete<ApiResponse<Discount>>(
    `/inventory/discounts/${id}`,
  );
  return data.data;
}
