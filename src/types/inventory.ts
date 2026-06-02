import type { InventoryItem } from '@/types/sales';

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
