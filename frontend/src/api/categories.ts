import { apiClient } from './client';

export type Category = {
  id: string;
  name: string;
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

export async function getCategories() {
  const { data } = await apiClient.get<ApiResponse<Category[]>>('/inventory/categories');
  return data.data;
}

export async function createCategory(payload: { name: string }) {
  const { data } = await apiClient.post<ApiResponse<Category>>('/inventory/categories', payload);
  return data.data;
}

export async function updateCategory(id: string, payload: { name: string }) {
  const { data } = await apiClient.put<ApiResponse<Category>>(`/inventory/categories/${id}`, payload);
  return data.data;
}

export async function deleteCategory(id: string) {
  const { data } = await apiClient.delete<ApiResponse<Category>>(`/inventory/categories/${id}`);
  return data.data;
}
