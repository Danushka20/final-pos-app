import type { CustomerSummary } from '@/types/sales';

/** Suggest next numeric customer code from the loaded list (matches server auto-code logic). */
export function suggestNextCustomerCode(customers: CustomerSummary[]): string {
  let max = 0;
  for (const c of customers) {
    const code = String(c.customer_code ?? c.customer_id ?? '').trim();
    if (/^\d+$/.test(code)) {
      max = Math.max(max, parseInt(code, 10));
    }
  }
  return String(Math.max(1, max + 1));
}
