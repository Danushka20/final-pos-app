import { RECEIPT_SOFTWARE_PROVIDER } from '@/constants/receiptBranding';
import type { ReceiptPrintCustomization } from '@/types/receiptPrint';
import { createReceiptLayout, escDivider, escHeaderLine, escPadLine, escTitleLine } from '@/utils/receiptEscPosLayout';
import { mergeReceiptPrintSettings } from '@/utils/receiptPrintCustomization';

export const buildShortTestReceipt = (
  storeName?: string,
  customization?: ReceiptPrintCustomization | null,
): string => {
  const merged = mergeReceiptPrintSettings(null, customization);
  const ctx = createReceiptLayout(merged);
  const now = new Date();
  const dateStr = now.toLocaleDateString();
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const lines = [
    escTitleLine(ctx, storeName?.trim() || 'POS Mobile'),
    escHeaderLine(ctx, '*** TEST PRINT ***'),
    escDivider(ctx),
    escHeaderLine(ctx, 'Short receipt test'),
    escPadLine(ctx, 'Date', dateStr),
    escPadLine(ctx, 'Time', timeStr),
    escDivider(ctx),
    escHeaderLine(ctx, 'OK'),
    escHeaderLine(ctx, merged.footerMessage),
    escHeaderLine(ctx, RECEIPT_SOFTWARE_PROVIDER),
    '',
    '',
  ];
  return lines.join('');
};

export const buildLongTestReceipt = (
  storeName?: string,
  customization?: ReceiptPrintCustomization | null,
): string => {
  const merged = mergeReceiptPrintSettings(null, customization);
  const ctx = createReceiptLayout(merged);
  const now = new Date();
  const dateStr = now.toLocaleDateString();
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const lines = [
    escTitleLine(ctx, storeName?.trim() || 'POS Mobile'),
    escHeaderLine(ctx, '*** TEST PRINT ***'),
    escHeaderLine(ctx, 'Long receipt test'),
    escDivider(ctx),
    escPadLine(ctx, 'Date', dateStr),
    escPadLine(ctx, 'Time', timeStr),
    escDivider(ctx),
    escPadLine(ctx, 'Item', 'Amount'),
    escDivider(ctx, '.'),
  ];

  const sampleItems = [
    { name: 'Sample product A', qty: 2, price: 150.0 },
    { name: 'Sample product B', qty: 1, price: 89.5 },
    { name: 'Sample product C', qty: 3, price: 45.0 },
    { name: 'Sample product D', qty: 1, price: 320.0 },
    { name: 'Sample product E', qty: 4, price: 25.0 },
    { name: 'Sample product F', qty: 2, price: 199.99 },
  ];

  let subtotal = 0;
  for (const item of sampleItems) {
    const lineTotal = item.qty * item.price;
    subtotal += lineTotal;
    const w = ctx.lineWidth;
    const desc = item.name.length > w ? item.name.slice(0, w - 1) + '…' : item.name;
    lines.push(`${merged.bodyAlign === 'center' ? '<C>' : '<L>'}${desc}\n`);
    lines.push(escPadLine(ctx, `${item.qty} x ${item.price.toFixed(2)}`, lineTotal.toFixed(2)));
  }

  lines.push(escDivider(ctx));
  lines.push(escPadLine(ctx, 'Subtotal', subtotal.toFixed(2)));
  lines.push(escPadLine(ctx, 'Discount', '0.00'));
  lines.push(escPadLine(ctx, 'TOTAL', subtotal.toFixed(2)));
  lines.push(escDivider(ctx));
  lines.push(escHeaderLine(ctx, merged.footerMessage));
  lines.push(escHeaderLine(ctx, RECEIPT_SOFTWARE_PROVIDER));
  lines.push('');
  lines.push('');
  return lines.join('');
};
