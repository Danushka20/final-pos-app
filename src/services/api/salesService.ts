import { apiClient } from '@/services/api/client';
import type { ApiSuccessResponse } from '@/types/auth';
import type {
  CreateSalePayload,
  PosContext,
  SaleReceiptPayload,
  SaleRecord,
  InventoryItem,
} from '@/types/sales';
import { TRANSACTION_TYPE_SALE } from '@/types/sales';

export interface SalesListResult {
  sales: SaleRecord[];
  summary?: { total_orders: number; total_sales_amount: number };
}

export interface HoldOrdersResult {
  hold_orders: SaleRecord[];
  order_settings?: Record<string, unknown>;
}

export const salesService = {
  async getPosContext(): Promise<PosContext> {
    const { data } = await apiClient.get<ApiSuccessResponse<PosContext>>(
      '/sales/pos-context',
    );
    if (!data.success || !data.data) {
      throw new Error(data.message ?? 'Failed to load POS context');
    }
    return data.data;
  },

  async searchItems(
    query: string,
    location?: string,
  ): Promise<{ items: InventoryItem[]; parsed_qty: number | null }> {
    const { data } = await apiClient.get<
      ApiSuccessResponse<{
        items: InventoryItem[];
        parsed_qty: number | null;
      }>
    >('/items/pos-search', {
      params: { q: query, location: location || undefined },
    });
    if (!data.success || !data.data) {
      throw new Error(data.message ?? 'Item search failed');
    }
    return {
      items: data.data.items ?? [],
      parsed_qty: data.data.parsed_qty,
    };
  },

  async createSale(payload: CreateSalePayload): Promise<{
    sale: SaleRecord;
    receipt: SaleReceiptPayload;
  }> {
    const { data } = await apiClient.post<
      ApiSuccessResponse<SaleRecord> & { receipt?: SaleReceiptPayload }
    >('/sales', {
      ...payload,
      transaction_type: payload.transaction_type ?? TRANSACTION_TYPE_SALE,
      order_status: payload.order_status ?? 'completed',
      sales_type: payload.sales_type ?? 'Retail',
      pricing_mode: payload.pricing_mode ?? 'retail',
      sale_date: payload.sale_date ?? new Date().toISOString().slice(0, 10),
    });

    if (!data.success || !data.data) {
      throw new Error(data.message ?? 'Failed to save sale');
    }

    if (!data.receipt) {
      throw new Error('Sale saved but receipt was not returned');
    }

    return { sale: data.data, receipt: data.receipt };
  },

  async listSales(params?: {
    transaction_type?: string;
    location?: string;
  }): Promise<SalesListResult> {
    const { data } = await apiClient.get<
      ApiSuccessResponse<SaleRecord[]> & {
        summary?: SalesListResult['summary'];
      }
    >('/sales', { params });
    if (!data.success || !data.data) {
      throw new Error(data.message ?? 'Failed to load sales');
    }
    return {
      sales: data.data,
      summary: data.summary,
    };
  },

  async getSale(saleId: number): Promise<SaleRecord> {
    const { data } = await apiClient.get<ApiSuccessResponse<SaleRecord>>(
      `/sales/${saleId}`,
    );
    if (!data.success || !data.data) {
      throw new Error(data.message ?? 'Sale not found');
    }
    return data.data;
  },

  async getReceipt(saleId: number): Promise<SaleReceiptPayload> {
    const { data } = await apiClient.get<ApiSuccessResponse<SaleReceiptPayload>>(
      `/sales/${saleId}/receipt`,
    );
    if (!data.success || !data.data) {
      throw new Error(data.message ?? 'Failed to load receipt');
    }
    return data.data;
  },

  async getHoldOrders(location?: string): Promise<HoldOrdersResult> {
    const { data } = await apiClient.get<
      ApiSuccessResponse<HoldOrdersResult>
    >('/sales/hold-orders', {
      params: location ? { location } : undefined,
    });
    if (!data.success || !data.data) {
      throw new Error(data.message ?? 'Failed to load hold orders');
    }
    return data.data;
  },

  async completeHold(
    saleId: number,
    payload: CreateSalePayload,
  ): Promise<{ sale: SaleRecord; receipt: SaleReceiptPayload }> {
    const { data } = await apiClient.post<
      ApiSuccessResponse<SaleRecord> & { receipt?: SaleReceiptPayload }
    >(`/sales/${saleId}/complete-hold`, {
      ...payload,
      order_status: 'completed',
    });
    if (!data.success || !data.data) {
      throw new Error(data.message ?? 'Failed to complete hold order');
    }
    if (!data.receipt) {
      const receipt = await salesService.getReceipt(data.data.id);
      return { sale: data.data, receipt };
    }
    return { sale: data.data, receipt: data.receipt };
  },

  async deleteHoldOrder(
    saleId: number,
    holdPin?: string | null,
  ): Promise<void> {
    const { data } = await apiClient.delete<ApiSuccessResponse<null>>(
      `/sales/${saleId}`,
      {
        data: holdPin?.trim() ? { hold_pin: holdPin.trim() } : undefined,
      },
    );
    if (!data.success) {
      throw new Error(data.message ?? 'Failed to delete hold order');
    }
  },
};
