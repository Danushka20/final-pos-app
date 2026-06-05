import type {
  DashboardMetrics,
  ReorderItemRow,
  TodayPurchaseRow,
  TodaySaleRow,
  TodayTablesSummary,
} from '@/types/dashboard';

export type SystemReportType =
  | 'daily_summary'
  | 'today_sales'
  | 'today_purchases'
  | 'reorder';

export interface SystemReportMeta {
  id: SystemReportType;
  title: string;
  subtitle: string;
  description: string;
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

export const SYSTEM_REPORT_CATALOG: SystemReportMeta[] = [
  {
    id: 'daily_summary',
    title: 'Daily business summary',
    subtitle: 'Sales, purchases, expenses',
    description: 'Overview of today\'s business activity and key metrics.',
  },
  {
    id: 'today_sales',
    title: 'Today\'s sales report',
    subtitle: 'All sale bills',
    description: 'Detailed list of today\'s sales and returns.',
  },
  {
    id: 'today_purchases',
    title: 'Today\'s purchases report',
    subtitle: 'Supplier orders',
    description: 'Detailed list of today\'s purchase bills.',
  },
  {
    id: 'reorder',
    title: 'Reorder report',
    subtitle: 'Low stock items',
    description: 'Items at or below reorder level.',
  },
];
