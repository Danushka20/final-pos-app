/** Matches backend PosDashboardService::getOverviewForUser */

export interface DashboardMetrics {
  today_sales_amount: number;
  today_sales_count: number;
  today_returns_amount?: number;
  today_returns_count?: number;
  today_net_sales_amount?: number;
  month_sales_amount: number;
  today_purchases_amount: number;
  today_purchases_count: number;
  today_expenses_amount: number;
  today_payments_amount: number;
  hold_orders_count: number;
  active_items: number;
  low_stock_count: number;
  customers_count: number;
  /** Customers with outstanding credit balance */
  debtor_count?: number;
  total_receivables?: number;
  shipments_today: number;
}

export interface SalesChartDay {
  date: string;
  label: string;
  sales_amount: number;
  orders: number;
}

export interface DashboardTransaction {
  type: 'sale' | 'return' | 'purchase' | 'payment' | 'expense';
  id: number;
  reference?: string | null;
  party?: string | null;
  amount: number;
  date?: string | null;
  status?: string | null;
  payment_method?: string | null;
  created_at?: string | null;
}

export interface DashboardOverview {
  generated_at?: string;
  metrics: DashboardMetrics;
  sales_chart: SalesChartDay[];
  recent_transactions: DashboardTransaction[];
}

export interface TodaySaleRow {
  id: number;
  sales_id: string;
  customer_name?: string | null;
  location?: string | null;
  amount: number;
  payment_method?: string | null;
  status?: string | null;
  transaction_type?: string | null;
  sale_date?: string | null;
  time?: string | null;
}

export interface TodayPurchaseRow {
  id: number;
  invoice_id: string;
  supplier_name?: string | null;
  location?: string | null;
  amount: number;
  payment_method?: string | null;
  purchase_date?: string | null;
  time?: string | null;
}

export interface ReorderItemRow {
  id: number;
  item_number?: string | null;
  description: string;
  qty: number;
  reorder_qty: number;
  location?: string | null;
  uom?: string | null;
}

export interface TodayTablesSummary {
  today_sales_count: number;
  today_sales_amount: number;
  today_returns_count?: number;
  today_returns_amount?: number;
  today_net_sales_amount?: number;
  today_purchases_count: number;
  today_purchases_amount: number;
  reorder_items_count: number;
}

export interface TodayTablesPayload {
  date: string;
  generated_at?: string;
  summary: TodayTablesSummary;
  today_sales: TodaySaleRow[];
  today_purchases: TodayPurchaseRow[];
  reorder_items: ReorderItemRow[];
}

