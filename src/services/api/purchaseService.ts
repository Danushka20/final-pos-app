import { apiClient } from '@/services/api/client';
import type { ApiSuccessResponse } from '@/types/auth';
import type { PurchaseListResponse, PurchaseRecord } from '@/types/inventory';

export interface CreatePurchasePayload {
  invoice_id: string;
  location?: string;
  purchase_date?: string;
  supplier_id?: number | null;
  supplier_name?: string | null;
  sub_total: number;
  discount: number;
  amount: number;
  payment_method?: string;
  bank_id?: number | null;
  cheque_number?: string | null;
  notes?: string | null;
  items: {
    item_id?: number;
    description: string;
    qty: number;
    unit_price: number;
    line_total: number;
  }[];
}

export const purchaseService = {
  async getNextInvoiceId(): Promise<string> {
    const { data } = await apiClient.get<
      ApiSuccessResponse<{ invoice_id: string }>
    >('/purchases/next-invoice-id');
    if (!data.success || !data.data?.invoice_id) {
      throw new Error(data.message ?? 'Failed to get invoice ID');
    }
    return data.data.invoice_id;
  },

  async create(payload: CreatePurchasePayload): Promise<PurchaseRecord> {
    const { data } = await apiClient.post<ApiSuccessResponse<PurchaseRecord>>(
      '/purchases',
      payload,
    );
    if (!data.success || !data.data) {
      throw new Error(data.message ?? 'Failed to save purchase');
    }
    return data.data;
  },

  async list(params?: {
    location?: string;
    purchase_type?: string;
  }): Promise<PurchaseListResponse> {
    const { data } = await apiClient.get<
      ApiSuccessResponse<PurchaseListResponse['purchases']> & {
        summary?: PurchaseListResponse['summary'];
        filters?: PurchaseListResponse['filters'];
      }
    >('/purchases', {
      params: {
        location: params?.location,
        purchase_type: params?.purchase_type,
      },
    });

    if (!data.success) {
      throw new Error(data.message ?? 'Failed to load purchases');
    }

    return {
      purchases: data.data ?? [],
      summary: data.summary ?? {
        total_purchases: 0,
        total_purchase_amount: 0,
      },
      filters: data.filters ?? {},
    };
  },
};
