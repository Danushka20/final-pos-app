import { useCallback, useEffect, useState } from 'react';
import { usePosSettings } from '@/context/PosSettingsContext';
import { dashboardService } from '@/services/api/dashboardService';
import type { RecentTransaction } from '@/components/cards/RecentTransactionRow';
import type { DashboardOverview, DashboardTransaction } from '@/types/dashboard';
import { useAutoRefresh } from '@/hooks/useAutoRefresh';
import {
  computeRevenueChange,
  formatCurrency,
  formatNumber,
  formatRelativeTime,
} from '@/utils/format';

const mapTransactionStatus = (
  status?: string | null,
): RecentTransaction['status'] => {
  const s = (status ?? 'completed').toLowerCase();
  if (s === 'hold') return 'hold';
  if (s === 'pending') return 'pending';
  return 'paid';
};

const mapTransactions = (
  items: DashboardTransaction[],
  currency: string,
): RecentTransaction[] =>
  items.map(tx => ({
    id: `${tx.type}-${tx.id}`,
    type: tx.type === 'return' ? 'return' : tx.type,
    title: tx.party?.trim() || tx.reference || 'Transaction',
    reference: tx.reference ?? undefined,
    amount: formatCurrency(tx.amount, currency),
    time: formatRelativeTime(tx.created_at ?? tx.date),
    status: mapTransactionStatus(tx.status),
  }));

export const useDashboard = () => {
  const { currency } = usePosSettings();
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (silent = false, pull = false) => {
    if (pull) {
      setRefreshing(true);
    } else if (!silent) {
      setLoading(true);
    }
    if (!silent) {
      setError(null);
    }
    try {
      const data = await dashboardService.getOverview();
      setOverview(data);
      if (!silent) {
        setError(null);
      }
    } catch (err) {
      if (!silent) {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard');
        setOverview(null);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load(false);
  }, [load]);

  useAutoRefresh({
    onRefresh: silent => load(silent),
    scopes: ['dashboard', 'todayActivity'],
  });

  const metrics = overview?.metrics;
  const chart = overview?.sales_chart ?? [];
  const returnsToday = metrics?.today_returns_amount ?? 0;
  const returnsCount = metrics?.today_returns_count ?? 0;
  const chartHint = computeRevenueChange(chart);
  const returnsHint =
    returnsCount > 0
      ? `${formatNumber(returnsCount)} return${returnsCount === 1 ? '' : 's'} · ${formatCurrency(returnsToday, currency)} (not counted in sales)`
      : undefined;
  const revenueHint = returnsHint ?? chartHint;

  return {
    loading,
    refreshing,
    error,
    refresh: () => load(false, true),
    generatedAt: overview?.generated_at,
    revenue: formatCurrency(metrics?.today_sales_amount, currency),
    revenueChange: chartHint,
    revenueHint,
    monthRevenue: formatCurrency(metrics?.month_sales_amount, currency),
    orders: formatNumber(metrics?.today_sales_count),
    products: formatNumber(metrics?.active_items),
    lowStock: formatNumber(metrics?.low_stock_count),
    customers: formatNumber(metrics?.customers_count),
    holdOrders: formatNumber(metrics?.hold_orders_count),
    todayPurchases: formatCurrency(metrics?.today_purchases_amount, currency),
    todayExpenses: formatCurrency(metrics?.today_expenses_amount, currency),
    todayPayments: formatCurrency(metrics?.today_payments_amount, currency),
    salesChart: chart,
    recentTransactions: mapTransactions(
      overview?.recent_transactions ?? [],
      currency,
    ),
    hasData: !!overview,
  };
};
