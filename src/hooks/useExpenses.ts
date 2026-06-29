import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAutoRefresh } from '@/hooks/useAutoRefresh';
import { expenseService } from '@/services/api/expenseService';
import type { Expense, ExpenseFilters, ExpenseSummary } from '@/types/expenses';

export const useExpenses = (initialLocation?: string) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [summary, setSummary] = useState<ExpenseSummary>({
    total_expenses: 0,
    total_expense_amount: 0,
  });
  const [filters, setFilters] = useState<ExpenseFilters>({
    categories: [],
    locations: ['Main Location'],
    statuses: ['Approved', 'Pending', 'Rejected'],
    payment_methods: ['Cash'],
  });
  const [location, setLocation] = useState(initialLocation ?? '');
  const [search, setSearch] = useState('');

  const load = useCallback(async (silent = false) => {
    if (!silent) {
      setLoading(true);
      setError(null);
    }
    try {
      const result = await expenseService.list(location || undefined);
      setExpenses(result.expenses);
      setSummary(result.summary);
      setFilters(result.filters);
      if (!location && result.filters.locations.length) {
        setLocation(
          result.filters.locations.find(l => l === 'Main Location') ??
            result.filters.locations[0] ??
            '',
        );
      }
      if (!silent) {
        setError(null);
      }
    } catch (e) {
      if (!silent) {
        setError(e instanceof Error ? e.message : 'Failed to load expenses');
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, [location]);

  useEffect(() => {
    load(false);
  }, [load]);

  useAutoRefresh({
    onRefresh: silent => load(silent),
    scopes: ['expenses', 'dashboard', 'sales', 'reports'],
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) {
      return expenses;
    }
    return expenses.filter(
      e =>
        e.reference_no.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q) ||
        e.category.toLowerCase().includes(q) ||
        e.status.toLowerCase().includes(q),
    );
  }, [expenses, search]);

  return {
    loading,
    error,
    expenses: filtered,
    summary,
    filters,
    location,
    setLocation,
    search,
    setSearch,
    refresh: () => load(false),
  };
};
