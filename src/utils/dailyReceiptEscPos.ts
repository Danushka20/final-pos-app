import type { PosMobileSettings } from '@/types/settings';
import type { ReceiptPrintCustomization } from '@/types/receiptPrint';
import { RECEIPT_SOFTWARE_PROVIDER } from '@/constants/receiptBranding';
import type { TodayTablesPayload } from '@/types/dashboard';
import type { SystemReportHeader } from '@/types/reports';
import { TRANSACTION_TYPE_RETURN } from '@/types/sales';
import { resolveCurrencyCode, formatPrintAmount } from '@/utils/format';
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

export type DailyReceiptKind = 'sales' | 'purchases' | 'refunds';

export type BuildDailyReceiptOptions = {
  currency?: string | null;
  customization?: ReceiptPrintCustomization | null;
  settings?: PosMobileSettings | null;
};

const wrapText = (ctx: ReceiptLayoutContext, text: string): string => {
  const w = ctx.lineWidth;
  return text.length > w ? text.slice(0, w - 1) + '…' : text;
};

const appendHeader = (
  lines: string[],
  ctx: ReceiptLayoutContext,
  title: string,
  subtitle: string,
  header: SystemReportHeader,
  customization: ReceiptPrintCustomization,
  generatedAt?: string,
): void => {
  lines.push(escTitleLine(ctx, header.company_name ?? 'Business Report'));
  if (header.address) {
    lines.push(escHeaderLine(ctx, header.address));
  }
  if (customization.showPhone && header.phone) {
    lines.push(escHeaderLine(ctx, `Tel: ${header.phone}`));
  }
  lines.push(escLine(ctx, ''));
  lines.push(escHeaderLine(ctx, title.toUpperCase()));
  lines.push(escHeaderLine(ctx, subtitle));
  if (generatedAt) {
    const printed = new Date(generatedAt.replace(' ', 'T'));
    const stamp = Number.isNaN(printed.getTime())
      ? generatedAt
      : `${printed.toLocaleDateString()} ${printed.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        })}`;
    lines.push(escHeaderLine(ctx, `Printed: ${stamp}`));
  }
  lines.push(escDivider(ctx));
};

const titleForKind = (kind: DailyReceiptKind): string => {
  switch (kind) {
    case 'sales':
      return 'Daily sales receipt';
    case 'purchases':
      return 'Daily purchase receipt';
    case 'refunds':
      return 'Daily refund receipt';
    default:
      return 'Daily receipt';
  }
};

export const buildDailyReceiptEscPos = (
  kind: DailyReceiptKind,
  data: TodayTablesPayload,
  header: SystemReportHeader,
  options?: BuildDailyReceiptOptions,
): string => {
  const customization = mergeReceiptPrintSettings(
    options?.settings,
    options?.customization,
  );
  const ctx = createReceiptLayout(customization);
  const code = resolveCurrencyCode(options?.currency);
  const lines: string[] = [];
  const dateLabel = data.date
    ? new Date(`${data.date}T12:00:00`).toLocaleDateString(undefined, {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : 'Today';

  appendHeader(
    lines,
    ctx,
    titleForKind(kind),
    dateLabel,
    header,
    customization,
    data.generated_at,
  );

  if (kind === 'sales') {
    const saleRows = data.today_sales.filter(
      r => r.transaction_type !== TRANSACTION_TYPE_RETURN && (r.status ?? '').toLowerCase() !== 'hold',
    );
    const total = saleRows.reduce((sum, row) => sum + row.amount, 0);
    lines.push(
      escPadLine(
        ctx,
        'Total sales',
        `${saleRows.length} · ${formatPrintAmount(total, code)}`,
      ),
    );
    lines.push(escDivider(ctx));
    lines.push(escPadLine(ctx, 'Bill', 'Amount'));
    lines.push(escLine(ctx, '.'.repeat(ctx.lineWidth), 'left'));
    for (const row of saleRows) {
      lines.push(escLine(ctx, wrapText(ctx, row.sales_id)));
      const detail = [row.customer_name, row.payment_method, row.time]
        .filter(Boolean)
        .join(' · ');
      if (detail) {
        lines.push(escLine(ctx, wrapText(ctx, detail)));
      }
      lines.push(escPadLine(ctx, 'Sale', formatPrintAmount(row.amount, code)));
    }
    if (!saleRows.length) {
      lines.push(escHeaderLine(ctx, 'No sales today'));
    }
  }

  if (kind === 'refunds') {
    const refundRows = data.today_sales.filter(
      r => r.transaction_type === TRANSACTION_TYPE_RETURN,
    );
    const total = refundRows.reduce((sum, row) => sum + row.amount, 0);
    lines.push(
      escPadLine(
        ctx,
        'Total refunds',
        `${refundRows.length} · ${formatPrintAmount(total, code)}`,
      ),
    );
    lines.push(escDivider(ctx));
    lines.push(escPadLine(ctx, 'Return bill', 'Amount'));
    lines.push(escLine(ctx, '.'.repeat(ctx.lineWidth), 'left'));
    for (const row of refundRows) {
      lines.push(escLine(ctx, wrapText(ctx, `RET ${row.sales_id}`)));
      const detail = [row.customer_name, row.payment_method, row.time]
        .filter(Boolean)
        .join(' · ');
      if (detail) {
        lines.push(escLine(ctx, wrapText(ctx, detail)));
      }
      lines.push(escPadLine(ctx, 'Refund', formatPrintAmount(row.amount, code)));
    }
    if (!refundRows.length) {
      lines.push(escHeaderLine(ctx, 'No refunds today'));
    }
  }

  if (kind === 'purchases') {
    const purchaseRows = data.today_purchases;
    const total = purchaseRows.reduce((sum, row) => sum + row.amount, 0);
    lines.push(
      escPadLine(
        ctx,
        'Total purchases',
        `${purchaseRows.length} · ${formatPrintAmount(total, code)}`,
      ),
    );
    lines.push(escDivider(ctx));
    lines.push(escPadLine(ctx, 'Invoice', 'Amount'));
    lines.push(escLine(ctx, '.'.repeat(ctx.lineWidth), 'left'));
    for (const row of purchaseRows) {
      lines.push(escLine(ctx, wrapText(ctx, row.invoice_id)));
      const detail = [row.supplier_name, row.payment_method, row.time]
        .filter(Boolean)
        .join(' · ');
      if (detail) {
        lines.push(escLine(ctx, wrapText(ctx, detail)));
      }
      lines.push(escPadLine(ctx, 'Bill', formatPrintAmount(row.amount, code)));
    }
    if (!purchaseRows.length) {
      lines.push(escHeaderLine(ctx, 'No purchases today'));
    }
  }

  lines.push(escDivider(ctx));
  lines.push(escHeaderLine(ctx, customization.footerMessage));
  lines.push(escHeaderLine(ctx, RECEIPT_SOFTWARE_PROVIDER));
  lines.push(escLine(ctx, ''));
  lines.push(escLine(ctx, ''));

  return lines.join('');
};
