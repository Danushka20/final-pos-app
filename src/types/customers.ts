import type { CustomerSummary } from '@/types/sales';

export interface CustomerListSummary {
  total_customers: number;
  total_receivables: number;
}

export interface CustomerListResult {
  customers: CustomerSummary[];
  summary: CustomerListSummary;
  filters: {
    locations: string[];
  };
}
