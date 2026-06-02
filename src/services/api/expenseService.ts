import { apiClient } from '@/services/api/client';
import type { ApiSuccessResponse } from '@/types/auth';
import type {
  Expense,
  ExpenseFilters,
  ExpenseListResponse,
  ExpensePayload,
  ExpenseSummary,
} from '@/types/expenses';

export const expenseService = {
  async list(location?: string): Promise<ExpenseListResponse> {
    const { data } = await apiClient.get<
      ApiSuccessResponse<Expense[]> & {
        summary?: ExpenseSummary;
        filters?: ExpenseFilters;
      }
    >('/expenses', {
      params: location ? { location } : undefined,
    });

    if (!data.success) {
      throw new Error(data.message ?? 'Failed to load expenses');
    }

    return {
      expenses: data.data ?? [],
      summary: data.summary ?? { total_expenses: 0, total_expense_amount: 0 },
      filters: data.filters ?? {
        categories: [],
        locations: ['Main Location'],
        statuses: ['Approved', 'Pending', 'Rejected'],
        payment_methods: ['Cash'],
      },
    };
  },

  async get(id: number): Promise<Expense> {
    const { data } = await apiClient.get<ApiSuccessResponse<Expense>>(
      `/expenses/${id}`,
    );
    if (!data.success || !data.data) {
      throw new Error(data.message ?? 'Expense not found');
    }
    return data.data;
  },

  async getNextReferenceNo(): Promise<string> {
    const { data } = await apiClient.get<
      ApiSuccessResponse<{ reference_no: string }>
    >('/expenses/next-reference-no');
    if (!data.success || !data.data?.reference_no) {
      throw new Error(data.message ?? 'Failed to get reference number');
    }
    return data.data.reference_no;
  },

  async create(payload: ExpensePayload): Promise<Expense> {
    const { data } = await apiClient.post<ApiSuccessResponse<Expense>>(
      '/expenses',
      payload,
    );
    if (!data.success || !data.data) {
      throw new Error(data.message ?? 'Failed to save expense');
    }
    return data.data;
  },

  async update(id: number, payload: Partial<ExpensePayload>): Promise<Expense> {
    const { data } = await apiClient.put<ApiSuccessResponse<Expense>>(
      `/expenses/${id}`,
      payload,
    );
    if (!data.success || !data.data) {
      throw new Error(data.message ?? 'Failed to update expense');
    }
    return data.data;
  },

  async remove(id: number): Promise<void> {
    const { data } = await apiClient.delete<ApiSuccessResponse<null>>(
      `/expenses/${id}`,
    );
    if (!data.success) {
      throw new Error(data.message ?? 'Failed to delete expense');
    }
  },
};
