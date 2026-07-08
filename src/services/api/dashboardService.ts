import { apiClient } from '@/services/api/client';
import type { ApiSuccessResponse } from '@/types/auth';
import type {
  DashboardMetrics,
  DashboardOverview,
  TodayTablesPayload,
} from '@/types/dashboard';

const defaultMetrics = (): DashboardMetrics => ({
  today_sales_amount: 0,
  today_sales_count: 0,
  month_sales_amount: 0,
  today_purchases_amount: 0,
  today_purchases_count: 0,
  today_expenses_amount: 0,
  today_payments_amount: 0,
  hold_orders_count: 0,
  active_items: 0,
  low_stock_count: 0,
  customers_count: 0,
  debtor_count: 0,
  total_receivables: 0,
  shipments_today: 0,
});

export const dashboardService = {
  async getOverview(): Promise<DashboardOverview> {
    const { data } = await apiClient.get<ApiSuccessResponse<DashboardOverview>>(
      '/pos/dashboard',
    );

    if (!data.success || !data.data) {
      throw new Error(data.message ?? 'Failed to load dashboard');
    }

    const payload = data.data;

    return {
      generated_at: payload.generated_at,
      metrics: { ...defaultMetrics(), ...payload.metrics },
      sales_chart: payload.sales_chart ?? [],
      recent_transactions: payload.recent_transactions ?? [],
    };
  },

  async getTodayTables(): Promise<TodayTablesPayload> {
    const { data } = await apiClient.get<ApiSuccessResponse<TodayTablesPayload>>(
      '/pos/dashboard/today-tables',
    );

    if (!data.success || !data.data) {
      throw new Error(data.message ?? 'Failed to load today\'s records');
    }

    return {
      date: data.data.date,
      generated_at: data.data.generated_at,
      summary: data.data.summary ?? {
        today_sales_count: 0,
        today_sales_amount: 0,
        today_purchases_count: 0,
        today_purchases_amount: 0,
        reorder_items_count: 0,
      },
      today_sales: data.data.today_sales ?? [],
      today_purchases: data.data.today_purchases ?? [],
      reorder_items: data.data.reorder_items ?? [],
    };
  },
};
