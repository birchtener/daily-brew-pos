import { apiClient } from './client';

export type Unit = 'kg' | 'g' | 'mg' | 'l' | 'ml' | 'oz' | 'pcs' | 'box' | 'can';

export type Ingredient = {
  id: string;
  name: string;
  unit: Unit;
  img_path: string | null;
  low_stock_threshold: number;
  current_stock: number;
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

export async function getIngredients() {
  const { data } = await apiClient.get<ApiResponse<Ingredient[]>>('/inventory/ingredients');
  return data.data;
}

export async function getIngredient(id: string) {
  const { data } = await apiClient.get<ApiResponse<Ingredient>>(`/inventory/ingredients/${id}`);
  return data.data;
}

export async function createIngredient(payload: {
  name: string;
  unit: Unit;
  low_stock_threshold?: number;
  image?: File | null;
}) {
  const formData = new FormData();
  formData.append('name', payload.name);
  formData.append('unit', payload.unit);
  if (payload.low_stock_threshold !== undefined) {
    formData.append('low_stock_threshold', String(payload.low_stock_threshold));
  }
  if (payload.image) {
    formData.append('image', payload.image);
  }

  const { data } = await apiClient.post<ApiResponse<Ingredient>>('/inventory/ingredients', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data.data;
}

export async function updateIngredient(
  id: string,
  payload: {
    name?: string;
    unit?: Unit;
    low_stock_threshold?: number;
    image?: File | null;
    img_path?: string | null;
  }
) {
  const formData = new FormData();
  if (payload.name !== undefined) formData.append('name', payload.name);
  if (payload.unit !== undefined) formData.append('unit', payload.unit);
  if (payload.low_stock_threshold !== undefined) {
    formData.append('low_stock_threshold', String(payload.low_stock_threshold));
  }
  if (payload.image) {
    formData.append('image', payload.image);
  }
  if (payload.img_path !== undefined) {
    formData.append('img_path', payload.img_path === null ? 'null' : payload.img_path);
  }

  const { data } = await apiClient.put<ApiResponse<Ingredient>>(`/inventory/ingredients/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data.data;
}

export async function deleteIngredient(id: string) {
  const { data } = await apiClient.delete<ApiResponse<Ingredient>>(`/inventory/ingredients/${id}`);
  return data.data;
}
