import { apiClient } from './client';

export type FinancialMetrics = {
  timeframe: {
    start: string;
    end: string;
  };
  metrics: {
    net_revenue: number;
    cost_of_goods_sold: number;
    gross_profit: number;
    gross_margin_percentage: number;
  };
};

export type ProductVelocity = {
  product_id: string;
  name: string;
  units_sold: number;
  gross_revenue_generated: number;
};

export type StockHealth = {
  ingredient_id: string;
  name: string;
  unit: string;
  current_on_hand_balance: number;
  active_batch_count: number;
  status: 'OUT_OF_STOCK' | 'LOW_STOCK_ALERT' | 'HEALTHY';
};

type ApiResponse<T> = {
  success: boolean;
  message?: string;
  data: T;
};

export async function getFinancials(startDate?: string, endDate?: string) {
  const params = new URLSearchParams();
  if (startDate) params.append('start_date', startDate);
  if (endDate) params.append('end_date', endDate);

  const { data } = await apiClient.get<ApiResponse<FinancialMetrics>>(`/analytics/financials?${params.toString()}`);
  return data.data;
}

export async function getProductVelocity(startDate?: string, endDate?: string) {
  const params = new URLSearchParams();
  if (startDate) params.append('start_date', startDate);
  if (endDate) params.append('end_date', endDate);

  const { data } = await apiClient.get<ApiResponse<ProductVelocity[]>>(`/analytics/product-velocity?${params.toString()}`);
  return data.data;
}

export async function getInventoryHealth() {
  const { data } = await apiClient.get<ApiResponse<StockHealth[]>>('/analytics/inventory-health');
  return data.data;
}
