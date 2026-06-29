export interface ReportColumn {
  key: string;
  label: string;
}

export interface ReportSummaryItem {
  label: string;
  value: string | number;
}

export interface ReportFilters {
  date_from: string;
  date_to: string;
  branch_id: number | null;
  branch_name: string;
}

export interface SalesSummaryLineItem {
  item_number: string | null;
  description: string | null;
  qty: number;
  unit_price: number;
  discount: number;
  net_price: number;
  amount: number;
}

export interface SalesSummarySale {
  id: number;
  date: string;
  sales_id: string | null;
  customer: string;
  location: string | null;
  transaction_label: string;
  sub_total: number;
  discount: number;
  net_amount: number;
  payment_method: string | null;
  items: SalesSummaryLineItem[];
}

export interface BackendReportData {
  title: string;
  generated_at: string;
  filters: ReportFilters;
  summary: ReportSummaryItem[];
  columns: ReportColumn[];
  rows: Record<string, string | number | null>[];
  note?: string | null;
  layout?: 'table' | 'sales_summary';
  sales?: SalesSummarySale[];
}

export interface FetchReportParams {
  dateFrom: string;
  dateTo: string;
  location?: string | null;
  branchId?: string | number | null;
}
