import { apiClient } from '@/services/api/client';
import type { ApiSuccessResponse } from '@/types/auth';
import type { ItemCategory, InventoryListResponse } from '@/types/inventory';

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
};
