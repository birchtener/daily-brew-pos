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
