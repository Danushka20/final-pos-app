import type { InventoryItem, ItemBatch } from '@/types/sales';

export interface InventoryFilters {
  product_types: string[];
  locations: string[];
}

export interface ItemCategory {
  id: number;
  name: string;
  product_type?: string | null;
  sub_categories: { id: number; name: string }[];
}

export interface InventoryListResponse {
  items: InventoryItem[];
  filters: InventoryFilters;
}

export interface PurchaseRecord {
  id: number;
  purchase_type?: string | null;
  location?: string | null;
  purchase_date: string;
  invoice_id: string;
  supplier_name?: string | null;
  sub_total: number;
  discount: number;
  amount: number;
  payment_method?: string | null;
  items?: {
    description: string;
    qty: number;
    unit_price: number;
    line_total: number;
  }[];
}

export interface PurchaseReceiptLine {
  item_number?: string | null;
  description: string;
  qty: number;
  unit_price: number;
  line_total: number;
  uom?: string | null;
  expiry_date?: string | null;
}

export interface PurchaseReceiptPayload {
  purchase: {
    invoice_id: string;
    purchase_date: string;
    location?: string | null;
    supplier_name?: string | null;
    supplier_contact_no?: string | null;
    supplier_email?: string | null;
    sub_total: number;
    discount: number;
    amount: number;
    payment_method?: string | null;
    amount_paid?: number | null;
    notes?: string | null;
    lines: PurchaseReceiptLine[];
  };
  header: Record<string, unknown>;
}

export interface PurchaseListResponse {
  purchases: PurchaseRecord[];
  summary: {
    total_purchases: number;
    total_purchase_amount: number;
  };
  filters: {
    purchase_types?: string[];
    locations?: string[];
  };
}

export interface ItemRecord extends InventoryItem {
  wholesale_price?: number;
  purchase_price?: number;
  reorder_qty?: number;
  default_discount?: number;
  default_discount_type?: 'percent' | 'amount' | null;
  max_discount?: number;
  track_with_inventory?: boolean;
  is_active?: boolean;
  product_type?: string | null;
  uom?: string;
  sku?: string | null;
  item_details?: string | null;
}

export interface ItemPayload {
  auto_generate_item_number?: boolean;
  item_number?: string;
  description: string;
  category?: string | null;
  sub_category?: string | null;
  item_category_id?: number | null;
  item_sub_category_id?: number | null;
  product_type?: string | null;
  location?: string;
  selling_price?: number;
  wholesale_price?: number;
  purchase_price?: number;
  default_discount?: number;
  default_discount_type?: 'percent' | 'amount';
  max_discount?: number;
  qty?: number;
  reorder_qty?: number;
  uom?: string;
  sku?: string | null;
  track_with_inventory?: boolean;
  is_active?: boolean;
}

export interface InventoryHistoryRow {
  source: string;
  movement_type: string;
  reference_label?: string | null;
  reference_id?: number | null;
  location?: string | null;
  qty_before?: number;
  qty_change: number;
  qty_after?: number;
  unit_cost?: number;
  notes?: string | null;
  created_at?: string | null;
}

export interface BranchRecord {
  id: number;
  name: string;
  address?: string | null;
  city?: string | null;
  phone?: string | null;
  is_active?: boolean;
}

export type ItemSelectAction = 'modify' | 'adjust' | 'history' | 'batches';

export interface ItemInventoryVariantRow {
  id: number;
  location?: string | null;
  qty: number;
  batch_qty: number;
  unbatched_qty: number;
  purchase_price: number;
  selling_price: number;
  expiry_date?: string | null;
  nearest_expiry_date?: string | null;
  is_current: boolean;
}

export interface ItemInventoryTotals {
  total_qty: number;
  total_batch_qty: number;
  total_unbatched_qty: number;
  variant_count: number;
  batch_count: number;
}

export interface ItemInventoryBreakdown {
  item: ItemRecord;
  totals: ItemInventoryTotals;
  variants: ItemInventoryVariantRow[];
  batches: Array<ItemBatch & { item_id?: number }>;
}

export interface ItemBatchPayload {
  batch_number?: string | null;
  location?: string | null;
  qty: number;
  purchase_price?: number | null;
  selling_price?: number | null;
  expiry_date?: string | null;
  notes?: string | null;
}
