import { useCallback, useEffect, useState } from 'react';
import { dashboardService } from '@/services/api/dashboardService';
import type { TodayTablesPayload } from '@/types/dashboard';
import { useAutoRefresh } from '@/hooks/useAutoRefresh';

const emptyPayload = (): TodayTablesPayload => ({
  date: new Date().toISOString().slice(0, 10),
  summary: {
    today_sales_count: 0,
    today_sales_amount: 0,
    today_purchases_count: 0,
    today_purchases_amount: 0,
    reorder_items_count: 0,
  },
  today_sales: [],
  today_purchases: [],
  reorder_items: [],
});

export const useTodayActivity = () => {
  const [data, setData] = useState<TodayTablesPayload>(emptyPayload);
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
      const result = await dashboardService.getTodayTables();
      setData(result);
      if (!silent) {
        setError(null);
      }
    } catch (err) {
      if (!silent) {
        setError(err instanceof Error ? err.message : 'Failed to load records');
        setData(emptyPayload());
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

  return {
    data,
    loading,
    refreshing,
    error,
    refresh: () => load(false, true),
  };
};
