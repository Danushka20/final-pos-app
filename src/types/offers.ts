export type OfferDiscountType = 'product' | 'order';

export interface ApplicableOffer {
  id: number;
  name: string;
  discount_type: OfferDiscountType;
  image_url?: string | null;
  item_count: number;
  item_ids: number[];
  item_numbers: string[];
  item_batch_ids?: number[];
  restricts_batches?: boolean;
  batch_count?: number;
  product_percent_off?: number | null;
  discount_summary?: string | null;
  requires_promo_code: boolean;
  uses_min_order_total: boolean;
  min_order_amount?: number;
  min_percent_off?: number;
  promo_percent_off?: number;
}

export interface OfferPreviewLine {
  item_id?: number | null;
  item_number?: string | null;
  item_batch_id?: number | null;
  description?: string | null;
  qty: number;
  unit_price: number;
  line_total: number;
  offer_discount?: number;
}

export interface OfferPreviewResult {
  offer_discount: number;
  sub_total: number;
  lines: OfferPreviewLine[];
  offer_promo_code?: string | null;
}
