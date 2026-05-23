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

export async function deleteAvatar() {
  const { data } = await apiClient.delete<ApiResponse<UpdatedUser>>('/users/avatar');
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

export async function fetchUsers(opts?: { page?: number; perPage?: number; q?: string; role?: 'admin' | 'staff' }) {
  const params: any = {};
  if (opts?.page) params.page = opts.page;
  if (opts?.perPage) params.perPage = opts.perPage;
  if (opts?.q) params.q = opts.q;
  if (opts?.role) params.role = opts.role;

  const { data } = await apiClient.get<ApiResponse<{ items: UpdatedUser[]; total: number; page: number; perPage: number }>>('/users', { params });
  return data.data;
}

export async function registerUser(payload: { first_name: string; last_name: string; username: string; role: 'admin' | 'staff' }) {
  const { data } = await apiClient.post<ApiResponse<{ user: UpdatedUser; password: string }>>('/users/register', payload);
  return data.data;
}

export async function adminUpdateUser(userId: string, payload: { first_name: string; last_name: string; role?: 'admin' | 'staff' }) {
  const { data } = await apiClient.put<ApiResponse<UpdatedUser>>(`/users/${userId}`, payload);
  return data.data;
}

export async function adminResetPassword(userId: string) {
  const { data } = await apiClient.post<ApiResponse<{ username: string; temporaryPassword: string }>>(`/users/${userId}/reset-password`);
  return data.data;
}

export async function adminDeleteUser(userId: string) {
  const { data } = await apiClient.delete<ApiResponse<any>>(`/users/${userId}`);
  return data.data;
}

export async function adminUploadAvatar(userId: string, file: File, onProgress?: (percent: number) => void) {
  const form = new FormData();
  form.append('avatar', file);
  const { data } = await apiClient.put<ApiResponse<UpdatedUser>>(`/users/${userId}/avatar`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (ev: any) => {
      if (onProgress && ev.total) {
        onProgress(Math.round((ev.loaded / ev.total) * 100));
      }
    },
  });
  return data.data;
}

export async function adminDeleteAvatar(userId: string) {
  const { data } = await apiClient.delete<ApiResponse<UpdatedUser>>(`/users/${userId}/avatar`);
  return data.data;
}
