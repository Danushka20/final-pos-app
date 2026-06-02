import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAutoRefresh } from '@/hooks/useAutoRefresh';
import { customerService } from '@/services/api/customerService';
import type { CustomerListSummary } from '@/types/customers';
import type { CustomerSummary } from '@/types/sales';

const defaultSummary = (): CustomerListSummary => ({
  total_customers: 0,
  total_receivables: 0,
});

export const useCustomers = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customers, setCustomers] = useState<CustomerSummary[]>([]);
  const [summary, setSummary] = useState<CustomerListSummary>(defaultSummary);
  const [search, setSearch] = useState('');

  const load = useCallback(async (silent = false) => {
    if (!silent) {
      setLoading(true);
    }
    setError(null);
    try {
      const result = await customerService.list();
      setCustomers(result.customers);
      setSummary(result.summary);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load customers');
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
    scopes: ['customers', 'sales'],
  });

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await load(true);
    } finally {
      setRefreshing(false);
    }
  }, [load]);

  const filteredCustomers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) {
      return customers;
    }

    return customers.filter(c => {
      const haystack = [
        c.customer_name,
        c.customer_id,
        c.customer_code,
        c.contact_no,
        c.email,
        c.location,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return haystack.includes(q);
    });
  }, [customers, search]);

  return {
    loading,
    refreshing,
    error,
    customers: filteredCustomers,
    summary,
    search,
    setSearch,
    refresh,
  };
};
