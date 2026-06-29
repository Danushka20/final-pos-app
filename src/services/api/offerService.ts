import { apiClient } from '@/services/api/client';
import type { ApiSuccessResponse } from '@/types/auth';
import type { ApplicableOffer, OfferPreviewResult } from '@/types/offers';
import type { CartLine } from '@/types/sales';

export const offerService = {
  async getApplicable(saleDate?: string): Promise<ApplicableOffer[]> {
    const { data } = await apiClient.get<ApiSuccessResponse<ApplicableOffer[]>>(
      '/offers/applicable/list',
      { params: saleDate ? { sale_date: saleDate } : undefined },
    );
    if (!data.success || !data.data) {
      throw new Error(data.message ?? 'Failed to load offers');
    }
    return data.data;
  },

  async preview(params: {
    offerId: number;
    lines: CartLine[];
    promoCode?: string | null;
    saleDate?: string;
  }): Promise<OfferPreviewResult> {
    const { data } = await apiClient.post<ApiSuccessResponse<OfferPreviewResult>>(
      '/offers/preview',
      {
        offer_id: params.offerId,
        sale_date: params.saleDate,
        promo_code: params.promoCode?.trim() || undefined,
        lines: params.lines.map(line => ({
          item_id: line.item_id,
          item_number: line.item_number,
          item_batch_id: line.item_batch_id ?? null,
          description: line.description,
          qty: line.qty,
          unit_price: line.unit_price,
        })),
      },
    );
    if (!data.success || !data.data) {
      throw new Error(data.message ?? 'Offer preview failed');
    }
    return data.data;
  },
};
