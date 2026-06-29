import type {
  DashboardMetrics,
  ReorderItemRow,
  TodayPurchaseRow,
  TodaySaleRow,
  TodayTablesSummary,
} from '@/types/dashboard';

export type SystemReportType =
  | 'daily_summary'
  | 'sales_report'
  | 'expense_report'
  | 'customer_report'
  | 'customer_settlement'
  | 'return_report'
  | 'credit_sales'
  | 'item_report'
  | 'reorder'
  | 'expiry_report'
  | 'cash_in_hand'
  | 'payment_report'
  | 'customer_aging'
  | 'finance_profit_loss'
  | 'finance_transactions_summary';

export type ReportCategoryId = 'finance';

export interface SystemReportMeta {
  id: SystemReportType;
  title: string;
  subtitle: string;
  description: string;
}

export interface ReportCategoryMeta {
  id: ReportCategoryId;
  title: string;
  subtitle: string;
  description: string;
  reportIds: SystemReportType[];
}

export interface SystemReportHeader {
  company_name?: string;
  address?: string;
  phone?: string;
  email?: string;
  tax_id?: string;
}

export interface DailySummaryReportData {
  metrics: DashboardMetrics;
  summary: TodayTablesSummary;
}

export interface SystemReportPayload {
  type: SystemReportType;
  title: string;
  subtitle?: string;
  date: string;
  generated_at?: string;
  header: SystemReportHeader;
  daily_summary?: DailySummaryReportData;
  sales_rows?: TodaySaleRow[];
  purchase_rows?: TodayPurchaseRow[];
  reorder_rows?: ReorderItemRow[];
}

export const REPORT_CATEGORIES: ReportCategoryMeta[] = [
  {
    id: 'finance',
    title: 'Finance report',
    subtitle: 'Profit, loss & transactions',
    description: 'Profit and loss statement and transactions summary.',
    reportIds: ['finance_profit_loss', 'finance_transactions_summary'],
  },
];

export const SYSTEM_REPORT_CATALOG: SystemReportMeta[] = [
  {
    id: 'daily_summary',
    title: 'Daily business summary',
    subtitle: 'Sales, purchases, expenses',
    description: 'Overview of today\'s business activity and key metrics.',
  },
  {
    id: 'sales_report',
    title: 'Sales report',
    subtitle: 'All sale bills',
    description: 'Detailed list of sales and returns for the selected period.',
  },
  {
    id: 'expense_report',
    title: 'Expense report',
    subtitle: 'Business costs',
    description: 'Summary of recorded expenses and categories.',
  },
  {
    id: 'customer_report',
    title: 'Customer report',
    subtitle: 'Customer list & balances',
    description: 'Customer details, credit limits, and outstanding balances.',
  },
  {
    id: 'customer_settlement',
    title: 'Customer settlement report',
    subtitle: 'Payments received',
    description: 'Customer payment settlements and receipts.',
  },
  {
    id: 'return_report',
    title: 'Return report',
    subtitle: 'Sales returns',
    description: 'List of returned items and refund amounts.',
  },
  {
    id: 'credit_sales',
    title: 'Credit sales',
    subtitle: 'Outstanding credit bills',
    description: 'Sales on credit with due amounts and aging.',
  },
  {
    id: 'item_report',
    title: 'Item report',
    subtitle: 'Product catalog',
    description: 'Item list with stock, pricing, and category details.',
  },
  {
    id: 'reorder',
    title: 'Reorder report',
    subtitle: 'Low stock items',
    description: 'Items at or below reorder level.',
  },
  {
    id: 'expiry_report',
    title: 'Expiry report',
    subtitle: 'Near-expiry stock',
    description: 'Items approaching or past expiry date.',
  },
  {
    id: 'cash_in_hand',
    title: 'Cash in hand',
    subtitle: 'Drawer balance',
    description: 'Current cash position and drawer summary.',
  },
  {
    id: 'payment_report',
    title: 'Payment report',
    subtitle: 'All payments',
    description: 'Payments received and made by method and date.',
  },
  {
    id: 'customer_aging',
    title: 'Customer aging',
    subtitle: 'Outstanding by age',
    description: 'Customer balances grouped by aging buckets.',
  },
  {
    id: 'finance_profit_loss',
    title: 'Profit & loss',
    subtitle: 'Income statement',
    description: 'Revenue, costs, and net profit for the period.',
  },
  {
    id: 'finance_transactions_summary',
    title: 'Transactions summary',
    subtitle: 'All transactions',
    description: 'Combined summary of sales, purchases, and payments.',
  },
];

export const getReportMeta = (id: SystemReportType): SystemReportMeta | undefined =>
  SYSTEM_REPORT_CATALOG.find(item => item.id === id);

export const getReportCategory = (id: ReportCategoryId): ReportCategoryMeta | undefined =>
  REPORT_CATEGORIES.find(item => item.id === id);
