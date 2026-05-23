import { apiClient } from './client';

export type Supplier = {
  id: string;
  name: string;
  contact_name: string | null;
  contact_number: string | null;
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

export async function getSuppliers() {
  const { data } = await apiClient.get<ApiResponse<Supplier[]>>('/inventory/suppliers');
  return data.data;
}

export async function createSupplier(payload: {
  name: string;
  contact_name?: string;
  contact_number?: string;
}) {
  const { data } = await apiClient.post<ApiResponse<Supplier>>('/inventory/suppliers', payload);
  return data.data;
}

export async function updateSupplier(
  id: string,
  payload: {
    name?: string;
    contact_name?: string;
    contact_number?: string;
  }
) {
  const { data } = await apiClient.put<ApiResponse<Supplier>>(`/inventory/suppliers/${id}`, payload);
  return data.data;
}

export async function deleteSupplier(id: string) {
  const { data } = await apiClient.delete<ApiResponse<Supplier>>(`/inventory/suppliers/${id}`);
  return data.data;
}
