import type { CustomerSummary } from '@/types/sales';

export interface CustomerListSummary {
  total_customers: number;
  /** Customers with outstanding balance (net_balance > 0) */
  debtor_count: number;
  total_receivables: number;
}

export interface CustomerListResult {
  customers: CustomerSummary[];
  summary: CustomerListSummary;
  filters: {
    locations: string[];
  };
}

export interface ReceivePaymentPayload {
  amount: number;
  payment_method?: string;
  notes?: string | null;
  location?: string | null;
}

export interface ReceivePaymentResult {
  customer: CustomerSummary;
  payment_received: number;
  previous_balance: number;
  new_balance: number;
  payment_method: string;
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
