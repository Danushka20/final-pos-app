import { apiClient } from '@/services/api/client';
import type { ApiSuccessResponse } from '@/types/auth';
import type { BranchRecord } from '@/types/inventory';

export const branchService = {
  async list(): Promise<BranchRecord[]> {
    const { data } = await apiClient.get<ApiSuccessResponse<BranchRecord[]>>('/branches');
    if (!data.success) {
      throw new Error(data.message ?? 'Failed to load locations');
    }
    return data.data ?? [];
  },

  async create(payload: {
    name: string;
    address?: string;
    city?: string;
    phone?: string;
    is_active?: boolean;
  }): Promise<BranchRecord> {
    const { data } = await apiClient.post<ApiSuccessResponse<BranchRecord>>('/branches', payload);
    if (!data.success || !data.data) {
      throw new Error(data.message ?? 'Failed to create location');
    }
    return data.data;
  },
};
