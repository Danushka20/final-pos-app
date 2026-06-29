import type { PosMobileSettings } from '@/types/settings';
import type { ReceiptPrintCustomization } from '@/types/receiptPrint';
import type { SystemReportPayload } from '@/types/reports';
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
import { TRANSACTION_TYPE_RETURN } from '@/types/sales';

export type BuildReportEscPosOptions = {
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
  report: SystemReportPayload,
  customization: ReceiptPrintCustomization,
): void => {
  const header = report.header;
  lines.push(escTitleLine(ctx, header.company_name ?? 'Business Report'));
  if (header.address) {
    lines.push(escHeaderLine(ctx, header.address));
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
  lines.push(escLine(ctx, ''));
  lines.push(escHeaderLine(ctx, report.title.toUpperCase()));
  if (report.subtitle) {
    lines.push(escHeaderLine(ctx, report.subtitle));
  }
  if (report.generated_at) {
    const printed = new Date(report.generated_at.replace(' ', 'T'));
    const stamp = Number.isNaN(printed.getTime())
      ? report.generated_at
      : `${printed.toLocaleDateString()} ${printed.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        })}`;
    lines.push(escHeaderLine(ctx, `Generated: ${stamp}`));
  }
  lines.push(escDivider(ctx));
};

const buildDailySummary = (
  report: SystemReportPayload,
  ctx: ReceiptLayoutContext,
  code: string,
): string[] => {
  const lines: string[] = [];
  const data = report.daily_summary;
  if (!data) {
    return lines;
  }

  const { metrics, summary } = data;
  lines.push(escHeaderLine(ctx, 'TODAY'));
  lines.push(
    escPadLine(
      ctx,
      'Sales',
      `${summary.today_sales_count} · ${formatPrintAmount(summary.today_sales_amount, code)}`,
    ),
  );
  if ((summary.today_returns_count ?? 0) > 0) {
    lines.push(
      escPadLine(
        ctx,
        'Returns',
        `${summary.today_returns_count} · ${formatPrintAmount(summary.today_returns_amount ?? 0, code)}`,
      ),
    );
  }
  if (summary.today_net_sales_amount != null) {
    lines.push(
      escPadLine(ctx, 'Net sales', formatPrintAmount(summary.today_net_sales_amount, code)),
    );
  }
  lines.push(
    escPadLine(
      ctx,
      'Purchases',
      `${summary.today_purchases_count} · ${formatPrintAmount(summary.today_purchases_amount, code)}`,
    ),
  );
  lines.push(...buildPurchaseRowLines(report, ctx, code));
  lines.push(
    escPadLine(ctx, 'Expenses', formatPrintAmount(metrics.today_expenses_amount ?? 0, code)),
  );
  lines.push(
    escPadLine(ctx, 'Payments', formatPrintAmount(metrics.today_payments_amount ?? 0, code)),
  );
  lines.push(escDivider(ctx));
  lines.push(escHeaderLine(ctx, 'INVENTORY'));
  lines.push(escPadLine(ctx, 'Active items', String(metrics.active_items ?? 0)));
  lines.push(escPadLine(ctx, 'Low stock', String(metrics.low_stock_count ?? 0)));
  lines.push(escPadLine(ctx, 'Reorder items', String(summary.reorder_items_count)));
  lines.push(escDivider(ctx));
  lines.push(escHeaderLine(ctx, 'OTHER'));
  lines.push(escPadLine(ctx, 'Hold orders', String(metrics.hold_orders_count ?? 0)));
  lines.push(escPadLine(ctx, 'Customers', String(metrics.customers_count ?? 0)));
  lines.push(
    escPadLine(ctx, 'Month sales', formatPrintAmount(metrics.month_sales_amount ?? 0, code)),
  );
  return lines;
};

const buildPurchaseRowLines = (
  report: SystemReportPayload,
  ctx: ReceiptLayoutContext,
  code: string,
): string[] => {
  const lines: string[] = [];
  const rows = report.purchase_rows ?? [];

  for (const row of rows) {
    lines.push(escLine(ctx, wrapText(ctx, row.invoice_id)));
    const detail = [
      row.supplier_name ? wrapText(ctx, row.supplier_name) : null,
      row.payment_method ?? null,
      row.time ?? null,
    ]
      .filter(Boolean)
      .join(' · ');
    if (detail) {
      lines.push(escLine(ctx, wrapText(ctx, detail)));
    }
    lines.push(escPadLine(ctx, 'Bill', formatPrintAmount(row.amount, code)));
  }

  return lines;
};

const buildSalesReport = (
  report: SystemReportPayload,
  ctx: ReceiptLayoutContext,
  code: string,
): string[] => {
  const lines: string[] = [];
  const rows = report.sales_rows ?? [];
  const summary = rows.reduce(
    (acc, row) => {
      const isReturn = row.transaction_type === TRANSACTION_TYPE_RETURN;
      if (isReturn) {
        acc.returns += 1;
        acc.returnAmount += row.amount;
      } else {
        acc.sales += 1;
        acc.salesAmount += row.amount;
      }
      return acc;
    },
    { sales: 0, salesAmount: 0, returns: 0, returnAmount: 0 },
  );

  lines.push(escPadLine(ctx, 'Total bills', String(rows.length)));
  lines.push(
    escPadLine(
      ctx,
      'Sales',
      `${summary.sales} · ${formatPrintAmount(summary.salesAmount, code)}`,
    ),
  );
  if (summary.returns > 0) {
    lines.push(
      escPadLine(
        ctx,
        'Returns',
        `${summary.returns} · ${formatPrintAmount(summary.returnAmount, code)}`,
      ),
    );
  }
  lines.push(escDivider(ctx));
  lines.push(escPadLine(ctx, 'Bill', 'Amount'));
  lines.push(escLine(ctx, '.'.repeat(ctx.lineWidth), 'left'));

  for (const row of rows) {
    const isReturn = row.transaction_type === TRANSACTION_TYPE_RETURN;
    const label = isReturn ? `RET ${row.sales_id}` : row.sales_id;
    lines.push(escLine(ctx, wrapText(ctx, label)));
    const detail = [
      row.customer_name ? wrapText(ctx, row.customer_name) : null,
      row.payment_method ?? null,
      row.time ?? null,
    ]
      .filter(Boolean)
      .join(' · ');
    if (detail) {
      lines.push(escLine(ctx, wrapText(ctx, detail)));
    }
    lines.push(
      escPadLine(
        ctx,
        isReturn ? 'Return' : 'Sale',
        formatPrintAmount(row.amount, code),
      ),
    );
  }

  if (!rows.length) {
    lines.push(escHeaderLine(ctx, 'No sales today'));
  }
  return lines;
};

const buildReorderReport = (
  report: SystemReportPayload,
  ctx: ReceiptLayoutContext,
): string[] => {
  const lines: string[] = [];
  const rows = report.reorder_rows ?? [];

  lines.push(escPadLine(ctx, 'Items', String(rows.length)));
  lines.push(escDivider(ctx));
  lines.push(escPadLine(ctx, 'Item', 'Stock'));
  lines.push(escLine(ctx, '.'.repeat(ctx.lineWidth), 'left'));

  for (const row of rows) {
    const label = row.item_number ? `${row.item_number}` : row.description;
    lines.push(escLine(ctx, wrapText(ctx, label)));
    if (row.item_number && row.description) {
      lines.push(escLine(ctx, wrapText(ctx, row.description)));
    }
    const stock = `${row.qty}${row.uom ? ` ${row.uom}` : ''} / reorder ${row.reorder_qty}`;
    lines.push(escPadLine(ctx, row.location ?? 'Stock', stock));
  }

  if (!rows.length) {
    lines.push(escHeaderLine(ctx, 'No reorder items'));
  }
  return lines;
};

export const buildEscPosReport = (
  report: SystemReportPayload,
  options?: BuildReportEscPosOptions,
): string => {
  const customization = mergeReceiptPrintSettings(
    options?.settings,
    options?.customization,
  );
  const ctx = createReceiptLayout(customization);
  const code = resolveCurrencyCode(options?.currency);
  const lines: string[] = [];

  appendHeader(lines, ctx, report, customization);

  switch (report.type) {
    case 'daily_summary':
      lines.push(...buildDailySummary(report, ctx, code));
      break;
    case 'sales_report':
      lines.push(...buildSalesReport(report, ctx, code));
      break;
    case 'reorder':
      lines.push(...buildReorderReport(report, ctx));
      break;
    default:
      break;
  }

  lines.push(escDivider(ctx));
  lines.push(escHeaderLine(ctx, customization.footerMessage));
  lines.push(escLine(ctx, ''));
  lines.push(escLine(ctx, ''));

  return lines.join('');
};
