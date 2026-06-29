import type { SystemReportType } from '@/types/reports';

/** Backend report key from Laravel ReportService, or `dashboard` for mobile dashboard API. */
export type ReportBackendSource = string | 'dashboard';

export const REPORT_BACKEND_MAP: Record<SystemReportType, ReportBackendSource> = {
  daily_summary: 'dashboard',
  sales_report: 'sales-details',
  expense_report: 'expense-summary',
  customer_report: 'customer-list',
  customer_settlement: 'customer-payment',
  return_report: 'sales-return-details',
  credit_sales: 'customer-outstanding',
  item_report: 'item-list',
  reorder: 'reorder-items',
  expiry_report: 'expiry-items',
  cash_in_hand: 'cash-in-hand',
  payment_report: 'customer-payment',
  customer_aging: 'customer-aging',
  finance_profit_loss: 'income-expenses',
  finance_transactions_summary: 'transaction-summary',
};

export const getReportBackendKey = (type: SystemReportType): ReportBackendSource =>
  REPORT_BACKEND_MAP[type];

export const usesDashboardApi = (type: SystemReportType): boolean =>
  REPORT_BACKEND_MAP[type] === 'dashboard';
