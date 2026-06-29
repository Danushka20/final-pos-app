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

export interface CustomerPayload {
  customer_code?: string;
  first_name: string;
  customer_name: string;
  contact_no: string;
  email?: string | null;
  location?: string | null;
  address_line1?: string | null;
  nic?: string | null;
}
