import type { SaleReceiptPayload } from '@/types/sales';
import type { PurchaseReceiptPayload } from '@/types/inventory';
import { resolveCurrencyCode } from '@/utils/format';

const LINE_WIDTH = 32;

const padLine = (left: string, right: string): string => {
  const gap = LINE_WIDTH - left.length - right.length;
  if (gap <= 0) {
    return `${left.slice(0, LINE_WIDTH - right.length - 1)} ${right}`;
  }
  return `${left}${' '.repeat(gap)}${right}`;
};

const center = (text: string): string => {
  if (text.length >= LINE_WIDTH) {
    return text.slice(0, LINE_WIDTH);
  }
  const pad = Math.floor((LINE_WIDTH - text.length) / 2);
  return `${' '.repeat(pad)}${text}`;
};

const divider = (char = '-'): string => char.repeat(LINE_WIDTH);

export const buildEscPosReceipt = (
  receipt: SaleReceiptPayload,
  currency?: string | null,
): string => {
  const code = resolveCurrencyCode(currency);
  const sale = receipt.sale;
  const header = receipt.header as Record<string, string | undefined>;
  const lines: string[] = [];

  const company = header.company_name ?? 'Tax Invoice';
  lines.push(center(company));
  if (header.address_line ?? header.address) {
    lines.push(center(String(header.address_line ?? header.address)));
  }
  if (header.phone) {
    lines.push(center(`Tel: ${header.phone}`));
  }
  lines.push('');
  const isReturn = Boolean((sale as { is_return?: boolean }).is_return);
  lines.push(center(isReturn ? 'SALES RETURN' : 'TAX INVOICE'));
  lines.push(center(`${isReturn ? 'Return' : 'Bill'}: ${sale.sales_id}`));
  lines.push(divider());
  lines.push(padLine('Date', sale.sale_date));
  if (sale.customer_name) {
    lines.push(padLine('Customer', sale.customer_name.slice(0, 18)));
  }
  if (sale.customer_contact_no) {
    lines.push(padLine('Phone', sale.customer_contact_no.slice(0, 18)));
  }
  if (sale.customer_email) {
    lines.push(padLine('Email', sale.customer_email.slice(0, 18)));
  }
  if (sale.customer_location) {
    lines.push(padLine('Location', sale.customer_location.slice(0, 18)));
  }
  lines.push(padLine('Payment', sale.payment_method ?? 'Cash'));
  lines.push(divider());
  lines.push(padLine('Item', 'Amount'));
  lines.push(divider('.'));

  for (const line of sale.lines) {
    const desc =
      line.description.length > LINE_WIDTH
        ? line.description.slice(0, LINE_WIDTH - 1) + '…'
        : line.description;
    if (line.item_number) {
      lines.push(`ID ${line.item_number}`);
    }
    lines.push(desc);
    const detail = `${line.qty} x ${line.unit_price.toFixed(2)}`;
    lines.push(padLine(detail, line.line_total.toFixed(2)));
  }

  lines.push(divider());
  lines.push(padLine('Subtotal', sale.sub_total.toFixed(2)));
  if (sale.discount > 0) {
    lines.push(padLine('Discount', `-${sale.discount.toFixed(2)}`));
  }
  lines.push(padLine('TOTAL', `${code} ${sale.net_amount.toFixed(2)}`));
  if (sale.amount_received != null) {
    lines.push(padLine('Received', sale.amount_received.toFixed(2)));
    const change = sale.amount_received - sale.net_amount;
    if (change >= 0) {
      lines.push(padLine('Change', change.toFixed(2)));
    }
  }
  lines.push(divider());
  lines.push(center('Thank you!'));
  lines.push('');
  lines.push('');

  return lines.join('\n');
};

export const buildEscPosPurchaseReceipt = (
  receipt: PurchaseReceiptPayload,
  currency?: string | null,
): string => {
  const code = resolveCurrencyCode(currency);
  const purchase = receipt.purchase;
  const header = receipt.header as Record<string, string | undefined>;
  const lines: string[] = [];

  lines.push(center(header.company_name ?? 'Purchase Bill'));
  if (header.address_line ?? header.address) {
    lines.push(center(String(header.address_line ?? header.address)));
  }
  if (header.phone) {
    lines.push(center(`Tel: ${header.phone}`));
  }
  lines.push('');
  lines.push(center('PURCHASE BILL'));
  lines.push(center(`Invoice: ${purchase.invoice_id}`));
  lines.push(divider());
  lines.push(padLine('Date', purchase.purchase_date));
  if (purchase.location) {
    lines.push(padLine('Location', purchase.location.slice(0, 18)));
  }
  if (purchase.supplier_name) {
    lines.push(padLine('Supplier', purchase.supplier_name.slice(0, 18)));
  }
  if (purchase.supplier_contact_no) {
    lines.push(padLine('Phone', purchase.supplier_contact_no.slice(0, 18)));
  }
  if (purchase.supplier_email) {
    lines.push(padLine('Email', purchase.supplier_email.slice(0, 18)));
  }
  lines.push(padLine('Payment', purchase.payment_method ?? 'Cash'));
  lines.push(divider());
  lines.push(padLine('Item', 'Amount'));
  lines.push(divider('.'));

  for (const line of purchase.lines) {
    const desc =
      line.description.length > LINE_WIDTH
        ? line.description.slice(0, LINE_WIDTH - 1) + '…'
        : line.description;
    if (line.item_number) {
      lines.push(`ID ${line.item_number}`);
    }
    lines.push(desc);
    const detail = `${line.qty} x ${line.unit_price.toFixed(2)}`;
    lines.push(padLine(detail, line.line_total.toFixed(2)));
  }

  lines.push(divider());
  lines.push(padLine('Subtotal', purchase.sub_total.toFixed(2)));
  if (purchase.discount > 0) {
    lines.push(padLine('Discount', `-${purchase.discount.toFixed(2)}`));
  }
  lines.push(padLine('TOTAL', `${code} ${purchase.amount.toFixed(2)}`));
  if (purchase.amount_paid != null) {
    lines.push(padLine('Paid', purchase.amount_paid.toFixed(2)));
  }
  if (purchase.notes?.trim()) {
    lines.push('');
    lines.push(purchase.notes.trim().slice(0, LINE_WIDTH));
  }
  lines.push(divider());
  lines.push(center('Purchase recorded'));
  lines.push('');
  lines.push('');

  return lines.join('\n');
};

export type PrintableReceipt = SaleReceiptPayload | PurchaseReceiptPayload;

export const buildEscPosPrintText = (
  receipt: PrintableReceipt,
  currency?: string | null,
): string => {
  if ('purchase' in receipt) {
    return buildEscPosPurchaseReceipt(receipt, currency);
  }
  return buildEscPosReceipt(receipt, currency);
};
