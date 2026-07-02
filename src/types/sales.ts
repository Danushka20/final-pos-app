import type { ApplicableOffer } from '@/types/offers';

/** Standard sale — deducts stock */
export const TRANSACTION_TYPE_SALE = '1001';
/** Sales return — restores stock, records Return payment */
export const TRANSACTION_TYPE_RETURN = '1002';
/** Quotation — no stock/payment until completed */
export const TRANSACTION_TYPE_QUOTATION = '1003';

export type SaleTransactionMode = 'sale' | 'return';

export interface PosFilters {
  transaction_types: string[];
  sales_types: string[];
  locations: string[];
  payment_methods: string[];
}

export interface PosContext {
  order_settings: Record<string, unknown>;
  hardware_settings: Record<string, unknown>;
  print_context: Record<string, unknown>;
  next_sales_id: string;
  filters: PosFilters;
  applicable_offers: ApplicableOffer[];
}

export interface ItemBatch {
  id: number;
  batch_number: string;
  location?: string | null;
  qty: number;
  purchase_price?: number;
  selling_price?: number | null;
  expiry_date?: string | null;
  notes?: string | null;
  created_at?: string | null;
  item_id?: number;
}

export interface InventoryItem {
  id: number;
  item_number: string;
  description: string;
  category?: string | null;
  item_category_id?: number | null;
  item_sub_category_id?: number | null;
  sub_category?: string | null;
  product_type?: string | null;
  location?: string | null;
  selling_price: number;
  purchase_price?: number;
  wholesale_price?: number;
  qty?: number;
  sellable_qty?: number;
  expired_stock_qty?: number;
  uom?: string;
  sku?: string | null;
  image_url?: string | null;
  expiry_date?: string | null;
  nearest_expiry_date?: string | null;
  expiry_status?: 'none' | 'ok' | 'expiring_soon' | 'expired' | string | null;
  expiry_days_remaining?: number | null;
  has_expired_stock?: boolean;
  has_batches?: boolean;
  batch_count?: number;
  /** When set, this grid row maps to a specific line on the original sale bill */
  return_line_key?: string;
  sale_line_batch_id?: number | null;
  sale_line_batch_number?: string | null;
  sale_line_batch_expiry?: string | null;
}

export interface CustomerSummary {
  id: number;
  customer_id?: string;
  customer_code?: string;
  customer_name: string;
  contact_no?: string | null;
  email?: string | null;
  location?: string | null;
  address?: string | null;
  address_line1?: string | null;
  nic?: string | null;
  tax_id?: string | null;
  net_balance?: number;
}

export interface CartLine {
  item_id: number;
  item_number: string;
  description: string;
  qty: number;
  unit_price: number;
  line_total: number;
  uom?: string | null;
  item_batch_id?: number | null;
  batch_number?: string | null;
  batch_expiry_date?: string | null;
  /** Branch inventory row used for stock deduction */
  inventory_location?: string | null;
}

export interface SaleLineItem extends CartLine {
  id?: number;
}

export interface SaleRecord {
  id: number;
  sales_id: string;
  sale_date: string;
  transaction_type?: string;
  order_status?: string;
  location?: string | null;
  customer_id?: number | null;
  customer_name?: string | null;
  sub_total: number;
  discount: number;
  service_charge?: number;
  net_amount: number;
  payment_method?: string | null;
  amount_received?: number | null;
  notes?: string | null;
  items: SaleLineItem[];
}

export interface ReceiptLine {
  item_number?: string | null;
  description: string;
  qty: number;
  unit_price: number;
  line_total: number;
  uom?: string | null;
}

export interface SaleReceiptPayload {
  sale: {
    sales_id: string;
    transaction_type?: string;
    is_return?: boolean;
    order_status?: string;
    is_hold?: boolean;
    discount_type?: 'percent' | 'amount';
    discount_percent?: number | null;
    sale_date: string;
    location?: string | null;
    payment_method?: string | null;
    customer_name?: string | null;
    customer_code?: string | null;
    customer_contact_no?: string | null;
    customer_email?: string | null;
    customer_location?: string | null;
    customer_address?: string | null;
    customer_tax_id?: string | null;
    sub_total: number;
    discount: number;
    service_charge?: number;
    net_amount: number;
    amount_received?: number | null;
    lines: ReceiptLine[];
    discount_label?: string | null;
    show_barcode?: boolean;
    barcode_value?: string | null;
  };
  hardware_settings?: Record<string, unknown>;
  header: Record<string, unknown>;
  print_options?: Record<string, unknown>;
  labels?: Record<string, string>;
}

export interface CreateSalePayload {
  transaction_type?: string;
  refund_card_last4?: string | null;
  hold_pin?: string | null;
  order_status?: string;
  sales_type?: string;
  pricing_mode?: 'retail' | 'wholesale';
  location?: string;
  sale_date?: string;
  sales_id: string;
  customer_id?: number | null;
  customer_name?: string | null;
  sub_total: number;
  discount: number;
  service_charge?: number;
  net_amount: number;
  payment_method?: string;
  amount_received?: number;
  bank_id?: number | null;
  cheque_number?: string | null;
  notes?: string | null;
  items: CartLine[];
  offer_applied?: boolean;
  offer_id?: number | null;
  offer_promo_code?: string | null;
  promo_code?: string | null;
}

export interface SalePaymentDetails {
  payment_method: string;
  amount_received: number;
  bank_id?: number | null;
  cheque_number?: string | null;
  notes?: string | null;
  refund_card_last4?: string | null;
  hold_pin?: string | null;
  original_sale_id?: string | null;
  /** Committed cart lines (e.g. after manual qty entry on order screen). */
  cart?: CartLine[];
}
