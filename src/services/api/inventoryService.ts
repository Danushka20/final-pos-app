import { apiClient } from '@/services/api/client';
import type { ApiSuccessResponse } from '@/types/auth';
import type {
  InventoryHistoryRow,
  InventoryListResponse,
  ItemBatchPayload,
  ItemCategory,
  ItemInventoryBreakdown,
  ItemPayload,
  ItemRecord,
} from '@/types/inventory';
import type { ItemBatch } from '@/types/sales';

export const inventoryService = {
  async list(params?: {
    location?: string;
    product_type?: string;
    for_pos_sale?: boolean;
  }): Promise<InventoryListResponse> {
    const { data } = await apiClient.get<
      ApiSuccessResponse<InventoryListResponse['items']> & {
        filters?: InventoryListResponse['filters'];
      }
    >('/items', {
      params: {
        location: params?.location,
        product_type: params?.product_type,
        for_pos_sale: params?.for_pos_sale ? 'true' : undefined,
      },
    });

    if (!data.success) {
      throw new Error(data.message ?? 'Failed to load items');
    }

    return {
      items: data.data ?? [],
      filters: data.filters ?? { product_types: [], locations: [] },
    };
  },

  async getCategories(params?: { location?: string }): Promise<ItemCategory[]> {
    const { data } = await apiClient.get<ApiSuccessResponse<ItemCategory[]>>(
      '/items/categories',
      {
        params: {
          location: params?.location,
        },
      },
    );
    if (!data.success) {
      throw new Error(data.message ?? 'Failed to load categories');
    }
    return data.data ?? [];
  },

  async getNextItemNumber(): Promise<string> {
    const { data } = await apiClient.get<
      ApiSuccessResponse<{ item_number: string }>
    >('/items/next-number');
    if (!data.success || !data.data?.item_number) {
      throw new Error(data.message ?? 'Failed to get item number');
    }
    return data.data.item_number;
  },

  async getItem(id: number): Promise<ItemRecord> {
    const { data } = await apiClient.get<ApiSuccessResponse<ItemRecord>>(`/items/${id}`);
    if (!data.success || !data.data) {
      throw new Error(data.message ?? 'Item not found');
    }
    return data.data;
  },

  async createItem(payload: ItemPayload): Promise<ItemRecord> {
    const { data } = await apiClient.post<ApiSuccessResponse<ItemRecord>>('/items', payload);
    if (!data.success || !data.data) {
      throw new Error(data.message ?? 'Failed to save item');
    }
    return data.data;
  },

  async updateItem(id: number, payload: Partial<ItemPayload>): Promise<ItemRecord> {
    const { data } = await apiClient.put<ApiSuccessResponse<ItemRecord>>(
      `/items/${id}`,
      payload,
    );
    if (!data.success || !data.data) {
      throw new Error(data.message ?? 'Failed to update item');
    }
    return data.data;
  },

  async adjustStock(
    id: number,
    payload: { new_qty?: number; qty_change?: number; notes?: string },
  ): Promise<ItemRecord> {
    const { data } = await apiClient.post<ApiSuccessResponse<ItemRecord>>(
      `/items/${id}/adjust`,
      payload,
    );
    if (!data.success || !data.data) {
      throw new Error(data.message ?? 'Failed to adjust stock');
    }
    return data.data;
  },

  async getInventoryBreakdown(id: number): Promise<ItemInventoryBreakdown> {
    const { data } = await apiClient.get<ApiSuccessResponse<ItemInventoryBreakdown>>(
      `/items/${id}/inventory-breakdown`,
    );
    if (!data.success || !data.data) {
      throw new Error(data.message ?? 'Failed to load stock breakdown');
    }
    return data.data;
  },

  async createItemBatch(
    id: number,
    payload: ItemBatchPayload,
  ): Promise<{ batch: ItemBatch; item: ItemRecord; message?: string }> {
    const { data } = await apiClient.post<
      ApiSuccessResponse<{ batch: ItemBatch; item: ItemRecord }> & { message?: string }
    >(`/items/${id}/batches`, payload);
    if (!data.success || !data.data) {
      throw new Error(data.message ?? 'Failed to create batch');
    }
    return { ...data.data, message: data.message };
  },

  async updateItemBatch(
    itemId: number,
    batchId: number,
    payload: Partial<ItemBatchPayload>,
  ): Promise<{ batch: ItemBatch; item: ItemRecord }> {
    const { data } = await apiClient.put<
      ApiSuccessResponse<{ batch: ItemBatch; item: ItemRecord }>
    >(`/items/${itemId}/batches/${batchId}`, payload);
    if (!data.success || !data.data) {
      throw new Error(data.message ?? 'Failed to update batch');
    }
    return data.data;
  },

  async deleteItemBatch(
    itemId: number,
    batchId: number,
  ): Promise<{ item: ItemRecord }> {
    const { data } = await apiClient.delete<ApiSuccessResponse<{ item: ItemRecord }>>(
      `/items/${itemId}/batches/${batchId}`,
    );
    if (!data.success || !data.data) {
      throw new Error(data.message ?? 'Failed to delete batch');
    }
    return data.data;
  },

  async getItemBatches(id: number): Promise<{ item: ItemRecord; batches: ItemBatch[] }> {
    const { data } = await apiClient.get<
      ApiSuccessResponse<{ item: ItemRecord; batches: ItemBatch[] | Record<string, ItemBatch> }>
    >(`/items/${id}/batches`);
    if (!data.success || !data.data) {
      throw new Error(data.message ?? 'Failed to load batches');
    }
    const raw = data.data.batches;
    const batches = Array.isArray(raw) ? raw : raw ? Object.values(raw) : [];
    return {
      item: data.data.item,
      batches,
    };
  },

  async getItemHistory(id: number): Promise<{
    item: ItemRecord;
    history: InventoryHistoryRow[];
  }> {
    const { data } = await apiClient.get<
      ApiSuccessResponse<{ item: ItemRecord; history: InventoryHistoryRow[] }>
    >(`/items/${id}/history`);
    if (!data.success || !data.data) {
      throw new Error(data.message ?? 'Failed to load item history');
    }
    return data.data;
  },
};
