import { apiClient } from './client';

export type LoginPayload = {
  username: string;
  password: string;
};

export type AuthUser = {
  id: string;
  username: string;
  role: 'admin' | 'staff';
  firstName?: string;
  lastName?: string;
  avatarUrl?: string | null;
  is_password_temp?: boolean;
};

type ApiResponse<T> = {
  success: boolean;
  data: T;
};

export async function loginRequest(payload: LoginPayload) {
  const { data } = await apiClient.post<ApiResponse<AuthUser>>('/auth/login', payload);
  return data.data;
}

export async function fetchSession() {
  const { data } = await apiClient.get<ApiResponse<AuthUser>>('/auth/me');
  return data.data;
}

export async function refreshSession() {
  const { data } = await apiClient.post<ApiResponse<AuthUser>>('/auth/refresh');
  return data.data;
}

export async function resolveSession() {
  try {
    return await fetchSession();
  } catch {
    try {
      return await refreshSession();
    } catch {
      return null;
    }
  }
}

export async function logoutRequest() {
  await apiClient.post<ApiResponse<{ loggedOut: boolean }>>('/auth/logout');
}
