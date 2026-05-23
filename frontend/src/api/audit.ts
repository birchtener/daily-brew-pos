import { apiClient } from './client';

export type LogType = 'info' | 'success' | 'warn' | 'error';
export type LogCategory =
  | 'authentication'
  | 'supplier'
  | 'ingredient'
  | 'recipe'
  | 'category'
  | 'product'
  | 'discount'
  | 'order'
  | 'inventory';

export type LogUser = {
  id: string;
  first_name: string;
  last_name: string;
  username: string;
  role: 'admin' | 'staff';
  avatar_url: string | null;
};

export type AuditLog = {
  id: number;
  log: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  log_type: LogType;
  category: LogCategory;
  logger: LogUser;
};

export type CursorPaginatedAuditLogs = {
  items: AuditLog[];
  nextCursor: number | null;
  hasNextPage: boolean;
};

type ApiResponse<T> = {
  success: boolean;
  message?: string;
  data: T;
};

export type GetLogsParams = {
  category?: LogCategory | 'all';
  type?: LogType | 'all';
  search?: string;
  cursor?: number;
  limit?: number;
};

export async function getAuditLogs(params: GetLogsParams) {
  const queryParams = new URLSearchParams();
  if (params.category && params.category !== 'all') {
    queryParams.append('category', params.category);
  }
  if (params.type && params.type !== 'all') {
    queryParams.append('type', params.type);
  }
  if (params.search) {
    queryParams.append('search', params.search);
  }
  if (params.cursor !== undefined) {
    queryParams.append('cursor', String(params.cursor));
  }
  if (params.limit) {
    queryParams.append('limit', String(params.limit));
  }

  const { data } = await apiClient.get<ApiResponse<CursorPaginatedAuditLogs>>(`/audit?${queryParams.toString()}`);
  return data.data;
}
