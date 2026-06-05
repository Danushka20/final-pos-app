import type { SaleReceiptPayload } from '@/types/sales';
import type { PurchaseReceiptPayload } from '@/types/inventory';
import type { PosMobileSettings } from '@/types/settings';
import type { ReceiptPrintCustomization } from '@/types/receiptPrint';
import { resolveCurrencyCode } from '@/utils/format';
import { mergeReceiptPrintSettings } from '@/utils/receiptPrintCustomization';
import {
  createReceiptLayout,
  escDivider,
  escHeaderLine,
  escLine,
  escPadLine,
  escTitleLine,
  type ReceiptLayoutContext,
} from '@/utils/receiptEscPosLayout';

export type PrintableReceipt = SaleReceiptPayload | PurchaseReceiptPayload;

export type BuildEscPosOptions = {
  currency?: string | null;
  customization?: ReceiptPrintCustomization | null;
  settings?: PosMobileSettings | null;
};

const wrapDesc = (ctx: ReceiptLayoutContext, text: string): string => {
  const w = ctx.lineWidth;
  return text.length > w ? text.slice(0, w - 1) + '…' : text;
};

export const buildEscPosReceipt = (
  receipt: SaleReceiptPayload,
  options?: BuildEscPosOptions,
): string => {
  const customization = mergeReceiptPrintSettings(
    options?.settings,
    options?.customization,
  );
  const ctx = createReceiptLayout(customization);
  const code = resolveCurrencyCode(options?.currency);
  const sale = receipt.sale;
  const header = receipt.header as Record<string, string | undefined>;
  const lines: string[] = [];

  const company = header.company_name ?? 'Tax Invoice';
  lines.push(escTitleLine(ctx, company));

  if (header.address_line ?? header.address) {
    lines.push(escHeaderLine(ctx, String(header.address_line ?? header.address)));
  }
  if (customization.showPhone && header.phone) {
    lines.push(escHeaderLine(ctx, `Tel: ${header.phone}`));
  }
  if (customization.showEmail && header.email) {
    lines.push(escHeaderLine(ctx, header.email));
  }
  if (customization.showTaxId && header.tax_id) {
    lines.push(escHeaderLine(ctx, `Tax ID: ${header.tax_id}`));
  }
  if (customization.showRegistration && header.registration_number) {
    lines.push(escHeaderLine(ctx, `Reg: ${header.registration_number}`));
  }

  lines.push(escLine(ctx, ''));
  const isReturn = Boolean((sale as { is_return?: boolean }).is_return);
  lines.push(escHeaderLine(ctx, isReturn ? 'SALES RETURN' : 'TAX INVOICE'));
  lines.push(escHeaderLine(ctx, `${isReturn ? 'Return' : 'Bill'}: ${sale.sales_id}`));
  lines.push(escDivider(ctx));
  lines.push(escPadLine(ctx, 'Date', sale.sale_date));

  if (sale.customer_name) {
    lines.push(escPadLine(ctx, 'Customer', sale.customer_name.slice(0, 18)));
  }
  if (sale.customer_contact_no) {
    lines.push(escPadLine(ctx, 'Phone', sale.customer_contact_no.slice(0, 18)));
  }
  if (sale.customer_email) {
    lines.push(escPadLine(ctx, 'Email', sale.customer_email.slice(0, 18)));
  }
  if (sale.customer_location) {
    lines.push(escPadLine(ctx, 'Location', sale.customer_location.slice(0, 18)));
  }
  lines.push(escPadLine(ctx, 'Payment', sale.payment_method ?? 'Cash'));
  lines.push(escDivider(ctx));
  lines.push(escPadLine(ctx, 'Item', 'Amount'));
  lines.push(escLine(ctx, '.'.repeat(ctx.lineWidth), 'left'));

  for (const line of sale.lines) {
    const desc = wrapDesc(ctx, line.description);
    if (line.item_number) {
      lines.push(escLine(ctx, `ID ${line.item_number}`));
    }
    lines.push(escLine(ctx, desc));
    const detail = `${line.qty} x ${line.unit_price.toFixed(2)}`;
    lines.push(escPadLine(ctx, detail, line.line_total.toFixed(2)));
  }

  lines.push(escDivider(ctx));
  lines.push(escPadLine(ctx, 'Subtotal', sale.sub_total.toFixed(2)));
  if (sale.discount > 0) {
    lines.push(escPadLine(ctx, 'Discount', `-${sale.discount.toFixed(2)}`));
  }
  lines.push(escPadLine(ctx, 'TOTAL', `${code} ${sale.net_amount.toFixed(2)}`));
  if (sale.amount_received != null) {
    lines.push(escPadLine(ctx, 'Received', sale.amount_received.toFixed(2)));
    const change = sale.amount_received - sale.net_amount;
    if (change >= 0) {
      lines.push(escPadLine(ctx, 'Change', change.toFixed(2)));
    }
  }
  lines.push(escDivider(ctx));
  lines.push(escHeaderLine(ctx, customization.footerMessage));
  lines.push(escLine(ctx, ''));
  lines.push(escLine(ctx, ''));

  return lines.join('');
};

export const buildEscPosPurchaseReceipt = (
  receipt: PurchaseReceiptPayload,
  options?: BuildEscPosOptions,
): string => {
  const customization = mergeReceiptPrintSettings(
    options?.settings,
    options?.customization,
  );
  const ctx = createReceiptLayout(customization);
  const code = resolveCurrencyCode(options?.currency);
  const purchase = receipt.purchase;
  const header = receipt.header as Record<string, string | undefined>;
  const lines: string[] = [];

  lines.push(escTitleLine(ctx, header.company_name ?? 'Purchase Bill'));
  if (header.address_line ?? header.address) {
    lines.push(escHeaderLine(ctx, String(header.address_line ?? header.address)));
  }
  if (customization.showPhone && header.phone) {
    lines.push(escHeaderLine(ctx, `Tel: ${header.phone}`));
  }
  lines.push(escLine(ctx, ''));
  lines.push(escHeaderLine(ctx, 'PURCHASE BILL'));
  lines.push(escHeaderLine(ctx, `Invoice: ${purchase.invoice_id}`));
  lines.push(escDivider(ctx));
  lines.push(escPadLine(ctx, 'Date', purchase.purchase_date));

  if (purchase.location) {
    lines.push(escPadLine(ctx, 'Location', purchase.location.slice(0, 18)));
  }
  if (purchase.supplier_name) {
    lines.push(escPadLine(ctx, 'Supplier', purchase.supplier_name.slice(0, 18)));
  }
  if (purchase.supplier_contact_no) {
    lines.push(escPadLine(ctx, 'Phone', purchase.supplier_contact_no.slice(0, 18)));
  }
  if (purchase.supplier_email) {
    lines.push(escPadLine(ctx, 'Email', purchase.supplier_email.slice(0, 18)));
  }
  lines.push(escPadLine(ctx, 'Payment', purchase.payment_method ?? 'Cash'));
  lines.push(escDivider(ctx));
  lines.push(escPadLine(ctx, 'Item', 'Amount'));
  lines.push(escLine(ctx, '.'.repeat(ctx.lineWidth), 'left'));

  for (const line of purchase.lines) {
    const desc = wrapDesc(ctx, line.description);
    if (line.item_number) {
      lines.push(escLine(ctx, `ID ${line.item_number}`));
    }
    lines.push(escLine(ctx, desc));
    const detail = `${line.qty} x ${line.unit_price.toFixed(2)}`;
    lines.push(escPadLine(ctx, detail, line.line_total.toFixed(2)));
  }

  lines.push(escDivider(ctx));
  lines.push(escPadLine(ctx, 'Subtotal', purchase.sub_total.toFixed(2)));
  if (purchase.discount > 0) {
    lines.push(escPadLine(ctx, 'Discount', `-${purchase.discount.toFixed(2)}`));
  }
  lines.push(escPadLine(ctx, 'TOTAL', `${code} ${purchase.amount.toFixed(2)}`));
  if (purchase.amount_paid != null) {
    lines.push(escPadLine(ctx, 'Paid', purchase.amount_paid.toFixed(2)));
  }
  if (purchase.notes?.trim()) {
    lines.push(escLine(ctx, ''));
    lines.push(escLine(ctx, purchase.notes.trim().slice(0, ctx.lineWidth)));
  }
  lines.push(escDivider(ctx));
  lines.push(escHeaderLine(ctx, customization.footerMessage));
  lines.push(escLine(ctx, ''));
  lines.push(escLine(ctx, ''));

  return lines.join('');
};

export const buildEscPosPrintText = (
  receipt: PrintableReceipt,
  options?: BuildEscPosOptions,
): string => {
  if ('purchase' in receipt) {
    return buildEscPosPurchaseReceipt(receipt, options);
  }
  return buildEscPosReceipt(receipt, options);
};
