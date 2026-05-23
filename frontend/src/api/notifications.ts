import { apiClient } from './client';

type ApiResponse<T> = {
  success: boolean;
  message?: string;
  data: T;
};

export type NotificationItem = {
  id: string;
  title: string;
  body: string;
  link: string | null;
  user_id: string | null;
  created_by: string;
  is_read: boolean;
  is_deleted: boolean;
  created_at: string;
};

export type NotificationsListResponse = {
  items: NotificationItem[];
  pagination: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
  };
  unreadCount: number;
};

export async function listNotifications(opts?: { page?: number; perPage?: number; unreadOnly?: boolean }) {
  const params: Record<string, string | number | boolean> = {};
  if (opts?.page) params.page = opts.page;
  if (opts?.perPage) params.perPage = opts.perPage;
  if (opts?.unreadOnly !== undefined) params.unreadOnly = opts.unreadOnly;

  const { data } = await apiClient.get<ApiResponse<NotificationsListResponse>>('/notifications', { params });
  return data.data;
}

export async function createNotification(payload: { title: string; body: string; link?: string | null; user_id?: string | null }) {
  const { data } = await apiClient.post<ApiResponse<NotificationItem>>('/notifications', payload);
  return data.data;
}

export async function markNotificationRead(id: string) {
  const { data } = await apiClient.patch<ApiResponse<NotificationItem>>(`/notifications/${id}/read`);
  return data.data;
}

export async function markAllNotificationsRead() {
  const { data } = await apiClient.patch<ApiResponse<{ updatedCount: number }>>('/notifications/read-all');
  return data.data;
}

export async function deleteNotification(id: string) {
  const { data } = await apiClient.delete<ApiResponse<{ deleted: true }>>(`/notifications/${id}`);
  return data.data;
}
