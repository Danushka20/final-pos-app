import { apiClient } from '@/services/api/client';
import type { ApiSuccessResponse } from '@/types/auth';
import type { CustomerListResult } from '@/types/customers';

export const customerService = {
  /** Full customer list (not filtered by branch on mobile). */
  async list(): Promise<CustomerListResult> {
    const { data } = await apiClient.get<
      ApiSuccessResponse<CustomerListResult['customers']> & {
        summary?: CustomerListResult['summary'];
        filters?: CustomerListResult['filters'];
      }
    >('/customers');

    if (!data.success) {
      throw new Error(data.message ?? 'Failed to load customers');
    }

    return {
      customers: data.data ?? [],
      summary: data.summary ?? {
        total_customers: data.data?.length ?? 0,
        total_receivables: 0,
      },
      filters: data.filters ?? { locations: [] },
    };
  },
};
