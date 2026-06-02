import { apiClient } from '@/services/api/client';
import type { ApiSuccessResponse } from '@/types/auth';

export interface BankAccount {
  id: number;
  bank_code: string;
  name: string;
  address?: string;
  is_active: boolean;
}

export const bankService = {
  async list(): Promise<BankAccount[]> {
    const { data } = await apiClient.get<ApiSuccessResponse<BankAccount[]>>(
      '/banks',
    );
    if (!data.success) {
      throw new Error(data.message ?? 'Failed to load banks');
    }
    return (data.data ?? []).filter(b => b.is_active);
  },
};
