import { apiClient } from '@/services/api/client';
import type { ApiSuccessResponse } from '@/types/auth';
import type { BackendReportData, FetchReportParams } from '@/types/backendReports';

export const reportService = {
  async listKeys(): Promise<string[]> {
    const { data } = await apiClient.get<ApiSuccessResponse<string[]>>('/reports');
    if (!data.success) {
      throw new Error(data.message ?? 'Failed to load report list');
    }
    return data.data ?? [];
  },

  async fetch(reportKey: string, params: FetchReportParams): Promise<BackendReportData> {
    const { data } = await apiClient.get<ApiSuccessResponse<BackendReportData>>(
      `/reports/${reportKey}`,
      {
        params: {
          date_from: params.dateFrom,
          date_to: params.dateTo,
          location:
            params.location && params.location !== 'all' ? params.location : undefined,
          branch_id:
            params.branchId && params.branchId !== 'all' ? params.branchId : undefined,
        },
      },
    );

    if (!data.success || !data.data) {
      throw new Error(data.message ?? 'Failed to load report');
    }

    return data.data;
  },
};
