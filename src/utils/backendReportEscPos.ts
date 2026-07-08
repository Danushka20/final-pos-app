import type { PosMobileSettings } from '@/types/settings';
import type { ReceiptPrintCustomization } from '@/types/receiptPrint';
import type { BackendReportData } from '@/types/backendReports';
import type { SystemReportHeader } from '@/types/reports';
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

export type BuildBackendReportEscPosOptions = {
  currency?: string | null;
  customization?: ReceiptPrintCustomization | null;
  settings?: PosMobileSettings | null;
};

const formatValue = (value: unknown, code: string): string => {
  if (value === null || value === undefined || value === '') {
    return '—';
  }
  if (typeof value === 'number') {
    return Number.isInteger(value) ? String(value) : formatPrintAmount(value, code);
  }
  return String(value);
};

const appendHeader = (
  lines: string[],
  ctx: ReceiptLayoutContext,
  report: BackendReportData,
  header: SystemReportHeader,
  customization: ReceiptPrintCustomization,
): void => {
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
  lines.push(
    escHeaderLine(ctx, `${report.filters.date_from} - ${report.filters.date_to}`),
  );
  lines.push(escHeaderLine(ctx, report.filters.branch_name));
  if (report.filters.item_name) {
    lines.push(escHeaderLine(ctx, `Item: ${report.filters.item_name}`));
  }
  if (report.generated_at) {
    lines.push(escHeaderLine(ctx, `Generated: ${report.generated_at}`));
  }
  lines.push(escDivider(ctx));
};

export const buildEscPosBackendReport = (
  report: BackendReportData,
  header: SystemReportHeader,
  options?: BuildBackendReportEscPosOptions,
): string => {
  const customization = mergeReceiptPrintSettings(
    options?.settings,
    options?.customization,
  );
  const ctx = createReceiptLayout(customization);
  const code = resolveCurrencyCode(options?.currency);
  const lines: string[] = [];

  appendHeader(lines, ctx, report, header, customization);

  if (report.note) {
    lines.push(escHeaderLine(ctx, report.note));
    lines.push(escLine(ctx, ''));
  }

  if (report.summary.length) {
    lines.push(escHeaderLine(ctx, 'SUMMARY'));
    for (const item of report.summary) {
      lines.push(escPadLine(ctx, item.label, formatValue(item.value, code)));
    }
    lines.push(escDivider(ctx));
  }

  if (report.layout === 'sales_summary' && report.sales?.length) {
    for (const sale of report.sales) {
      lines.push(
        escPadLine(
          ctx,
          sale.sales_id ?? `#${sale.id}`,
          formatValue(sale.net_amount, code),
        ),
      );
      lines.push(escLine(ctx, `${sale.customer} · ${sale.transaction_label}`));
      for (const item of sale.items) {
        lines.push(
          escLine(
            ctx,
            `  ${item.qty} x ${item.description ?? item.item_number ?? 'Item'} ${formatValue(item.amount, code)}`,
          ),
        );
      }
      lines.push(escLine(ctx, ''));
    }
  } else if (report.columns.length && report.rows.length) {
    for (const row of report.rows.slice(0, 80)) {
      const parts = report.columns
        .slice(0, 3)
        .map(col => `${col.label}: ${formatValue(row[col.key], code)}`);
      lines.push(escLine(ctx, parts.join(' | ')));
    }
    if (report.rows.length > 80) {
      lines.push(escLine(ctx, `... and ${report.rows.length - 80} more rows`));
    }
  } else {
    lines.push(escHeaderLine(ctx, 'No records for selected period.'));
  }

  lines.push(escDivider(ctx));
  lines.push(escHeaderLine(ctx, customization.footerMessage));
  lines.push(escLine(ctx, ''));
  lines.push(escLine(ctx, ''));

  return lines.join('');
};
