import { useCallback, useEffect, useState } from 'react';
import { useAutoRefresh } from '@/hooks/useAutoRefresh';
import { purchaseService } from '@/services/api/purchaseService';
import type { PurchaseListResponse, PurchaseRecord } from '@/types/inventory';

export const usePurchases = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [purchases, setPurchases] = useState<PurchaseRecord[]>([]);
  const [summary, setSummary] = useState<PurchaseListResponse['summary']>({
    total_purchases: 0,
    total_purchase_amount: 0,
  });

  const load = useCallback(async (silent = false) => {
    if (!silent) {
      setLoading(true);
      setError(null);
    }
    try {
      const result = await purchaseService.list();
      setPurchases(result.purchases);
      setSummary(result.summary);
      if (!silent) {
        setError(null);
      }
    } catch (e) {
      if (!silent) {
        setError(e instanceof Error ? e.message : 'Failed to load purchases');
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    load(false);
  }, [load]);

  useAutoRefresh({
    onRefresh: silent => load(silent),
    scopes: ['purchases', 'dashboard', 'inventory', 'reports'],
  });

  return {
    loading,
    error,
    purchases,
    summary,
    refresh: () => load(false),
  };
};
