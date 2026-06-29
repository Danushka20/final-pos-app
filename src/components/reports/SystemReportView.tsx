import React from 'react';
import { StyleSheet, View } from 'react-native';
import { HStack, Text, VStack } from '@gluestack-ui/themed';
import { formatCurrency, resolveCurrencyCode } from '@/utils/format';
import { colors } from '@/theme';
import type { SystemReportPayload } from '@/types/reports';
import type { PosMobileSettings } from '@/types/settings';
import { TRANSACTION_TYPE_RETURN } from '@/types/sales';

interface SystemReportViewProps {
  report: SystemReportPayload;
  settings?: PosMobileSettings | null;
}

const MetaRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <HStack justifyContent="space-between" py="$0.5">
    <Text style={styles.metaLabel}>{label}</Text>
    <Text style={styles.metaValue}>{value}</Text>
  </HStack>
);

const SectionTitle: React.FC<{ title: string }> = ({ title }) => (
  <Text style={styles.sectionTitle}>{title}</Text>
);

const Divider: React.FC = () => <View style={styles.divider} />;

export const SystemReportView: React.FC<SystemReportViewProps> = ({
  report,
  settings,
}) => {
  const currency = resolveCurrencyCode(settings?.company?.currency);
  const header = report.header;
  const now = new Date();
  const printedAt = `${now.toLocaleDateString()} ${now.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })}`;

  const renderDailySummary = () => {
    const data = report.daily_summary;
    if (!data) {
      return null;
    }
    const { metrics, summary } = data;

    return (
      <VStack space="sm">
        <SectionTitle title="Today" />
        <MetaRow
          label="Sales"
          value={`${summary.today_sales_count} · ${formatCurrency(summary.today_sales_amount, currency)}`}
        />
        {(summary.today_returns_count ?? 0) > 0 ? (
          <MetaRow
            label="Returns"
            value={`${summary.today_returns_count} · ${formatCurrency(summary.today_returns_amount, currency)}`}
          />
        ) : null}
        {summary.today_net_sales_amount != null ? (
          <MetaRow
            label="Net sales"
            value={formatCurrency(summary.today_net_sales_amount, currency)}
          />
        ) : null}
        <MetaRow
          label="Purchases"
          value={`${summary.today_purchases_count} · ${formatCurrency(summary.today_purchases_amount, currency)}`}
        />
        {(report.purchase_rows ?? []).length > 0 ? renderPurchaseRows() : null}
        <MetaRow
          label="Expenses"
          value={formatCurrency(metrics.today_expenses_amount, currency)}
        />
        <MetaRow
          label="Payments"
          value={formatCurrency(metrics.today_payments_amount, currency)}
        />

        <Divider />
        <SectionTitle title="Inventory" />
        <MetaRow label="Active items" value={String(metrics.active_items)} />
        <MetaRow label="Low stock" value={String(metrics.low_stock_count)} />
        <MetaRow label="Reorder items" value={String(summary.reorder_items_count)} />

        <Divider />
        <SectionTitle title="Other" />
        <MetaRow label="Hold orders" value={String(metrics.hold_orders_count)} />
        <MetaRow label="Customers" value={String(metrics.customers_count)} />
        <MetaRow
          label="Month sales"
          value={formatCurrency(metrics.month_sales_amount, currency)}
        />
      </VStack>
    );
  };

  const renderSalesRows = () => {
    const rows = report.sales_rows ?? [];
    if (!rows.length) {
      return <Text style={styles.emptyText}>No sales recorded today.</Text>;
    }

    return rows.map(row => {
      const isReturn = row.transaction_type === TRANSACTION_TYPE_RETURN;
      return (
        <View key={`${row.id}-${row.sales_id}`} style={styles.rowCard}>
          <HStack justifyContent="space-between" alignItems="flex-start">
            <VStack flex={1} pr="$2">
              <Text style={styles.rowTitle}>{row.sales_id}</Text>
              {row.customer_name ? (
                <Text style={styles.rowSub}>{row.customer_name}</Text>
              ) : null}
              <Text style={styles.rowMeta}>
                {[row.payment_method, row.time, row.location].filter(Boolean).join(' · ')}
              </Text>
            </VStack>
            <VStack alignItems="flex-end">
              <Text style={[styles.rowAmount, isReturn && { color: colors.error }]}>
                {formatCurrency(row.amount, currency)}
              </Text>
              <Text style={[styles.rowBadge, isReturn && styles.rowBadgeReturn]}>
                {isReturn ? 'Return' : 'Sale'}
              </Text>
            </VStack>
          </HStack>
        </View>
      );
    });
  };

  const renderPurchaseRows = () => {
    const rows = report.purchase_rows ?? [];
    if (!rows.length) {
      return <Text style={styles.emptyText}>No purchases recorded today.</Text>;
    }

    return rows.map(row => (
      <View key={`${row.id}-${row.invoice_id}`} style={styles.rowCard}>
        <HStack justifyContent="space-between" alignItems="flex-start">
          <VStack flex={1} pr="$2">
            <Text style={styles.rowTitle}>{row.invoice_id}</Text>
            {row.supplier_name ? <Text style={styles.rowSub}>{row.supplier_name}</Text> : null}
            <Text style={styles.rowMeta}>
              {[row.payment_method, row.time, row.location].filter(Boolean).join(' · ')}
            </Text>
          </VStack>
          <Text style={styles.rowAmount}>{formatCurrency(row.amount, currency)}</Text>
        </HStack>
      </View>
    ));
  };

  const renderReorderRows = () => {
    const rows = report.reorder_rows ?? [];
    if (!rows.length) {
      return <Text style={styles.emptyText}>No items need reordering.</Text>;
    }

    return rows.map(row => (
      <View key={row.id} style={styles.rowCard}>
        <Text style={styles.rowTitle}>
          {row.item_number ? `${row.item_number} · ` : ''}
          {row.description}
        </Text>
        <Text style={styles.rowMeta}>
          Stock {row.qty}
          {row.uom ? ` ${row.uom}` : ''} · Reorder {row.reorder_qty}
          {row.location ? ` · ${row.location}` : ''}
        </Text>
      </View>
    ));
  };

  return (
    <View style={styles.paper}>
      <Text style={styles.companyName}>{header.company_name ?? 'Business Report'}</Text>
      {header.address ? <Text style={styles.mutedCenter}>{header.address}</Text> : null}
      {header.phone ? <Text style={styles.mutedCenter}>Tel: {header.phone}</Text> : null}
      {header.email ? <Text style={styles.mutedCenter}>{header.email}</Text> : null}
      {header.tax_id ? <Text style={styles.mutedCenter}>Tax ID: {header.tax_id}</Text> : null}

      <Divider />
      <Text style={styles.reportTitle}>{report.title}</Text>
      {report.subtitle ? <Text style={styles.mutedCenter}>{report.subtitle}</Text> : null}
      {report.generated_at ? (
        <Text style={styles.mutedCenter}>
          Generated:{' '}
          {new Date(report.generated_at.replace(' ', 'T')).toLocaleString(undefined, {
            dateStyle: 'medium',
            timeStyle: 'short',
          })}
        </Text>
      ) : null}

      <View style={styles.body}>
        {report.type === 'daily_summary' ? renderDailySummary() : null}
        {report.type === 'sales_report' ? renderSalesRows() : null}
        {report.type === 'reorder' ? renderReorderRows() : null}
      </View>

      <Divider />
      <Text style={styles.footerNote}>Printed: {printedAt}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  paper: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 20,
    maxWidth: 400,
    alignSelf: 'center',
    width: '100%',
  },
  companyName: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    color: colors.text,
    letterSpacing: 0.3,
  },
  mutedCenter: {
    fontSize: 12,
    textAlign: 'center',
    color: colors.textSecondary,
    marginTop: 2,
  },
  reportTitle: {
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 8,
    letterSpacing: 1,
    color: colors.text,
    textTransform: 'uppercase',
  },
  divider: {
    height: 1,
    backgroundColor: colors.text,
    marginVertical: 12,
    opacity: 0.2,
  },
  body: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  metaLabel: {
    fontSize: 12,
    color: colors.textMuted,
  },
  metaValue: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
    maxWidth: '65%',
    textAlign: 'right',
  },
  rowCard: {
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  rowTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  rowSub: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  rowMeta: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  rowAmount: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  rowBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.success,
    marginTop: 4,
    textTransform: 'uppercase',
  },
  rowBadgeReturn: {
    color: colors.error,
  },
  emptyText: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    paddingVertical: 16,
  },
  footerNote: {
    textAlign: 'center',
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 4,
  },
});
