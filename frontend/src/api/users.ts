import { apiClient } from './client';

type ApiResponse<T> = {
  success: boolean;
  message?: string;
  data: T;
};

export type UpdatedUser = {
  id: string;
  username: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  role: 'admin' | 'staff';
  is_password_temp: boolean;
};

export async function uploadAvatar(file: File) {
  const formData = new FormData();
  formData.append('avatar', file);

  const { data } = await apiClient.put<ApiResponse<UpdatedUser>>('/users/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  return data.data;
}

export async function updateProfile(payload: { first_name: string; last_name: string }) {
  const { data } = await apiClient.put<ApiResponse<UpdatedUser>>('/users/profile', payload);
  return data.data;
}

export async function updatePassword(payload: { currentPassword: string; newPassword: string }) {
  const { data } = await apiClient.put<ApiResponse<null>>('/users/password', payload);
  return data;
}
