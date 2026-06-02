import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  AlertTriangle,
  RotateCcw,
  ShoppingCart,
  Truck,
} from 'lucide-react-native';
import { colors, shadows, typography } from '@/theme';
import { formatCurrency } from '@/utils/format';
import type {
  ReorderItemRow,
  TodayPurchaseRow,
  TodaySaleRow,
} from '@/types/dashboard';
import { TRANSACTION_TYPE_RETURN } from '@/types/sales';

const StatusPill: React.FC<{
  label: string;
  tone: 'sale' | 'return' | 'hold' | 'purchase' | 'warning';
}> = ({ label, tone }) => {
  const bg =
    tone === 'return'
      ? colors.errorSoft
      : tone === 'hold'
        ? colors.warningSoft
        : tone === 'purchase'
          ? colors.primarySoft
          : tone === 'warning'
            ? colors.warningSoft
            : colors.successSoft;
  const fg =
    tone === 'return'
      ? colors.error
      : tone === 'hold'
        ? colors.warning
        : tone === 'warning'
          ? colors.warning
          : tone === 'purchase'
            ? colors.primary
            : colors.success;

  return (
    <View style={[styles.pill, { backgroundColor: bg }]}>
      <Text style={[styles.pillText, { color: fg }]}>{label}</Text>
    </View>
  );
};

const RowCard: React.FC<{
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  subtitle?: string;
  amount?: string;
  amountColor?: string;
  meta?: string;
  pill?: React.ReactNode;
  accent?: 'default' | 'warning' | 'return';
}> = ({
  icon,
  iconBg,
  title,
  subtitle,
  amount,
  amountColor = colors.primary,
  meta,
  pill,
  accent = 'default',
}) => (
  <View
    style={[
      styles.card,
      shadows.sm,
      accent === 'warning' && styles.cardWarning,
      accent === 'return' && styles.cardReturn,
    ]}>
    <View style={[styles.iconWrap, { backgroundColor: iconBg }]}>{icon}</View>
    <View style={styles.body}>
      <View style={styles.topLine}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {amount ? (
          <Text style={[styles.amount, { color: amountColor }]} numberOfLines={1}>
            {amount}
          </Text>
        ) : null}
      </View>
      {(subtitle || meta || pill) && (
        <View style={styles.bottomLine}>
          <View style={styles.metaCol}>
            {subtitle ? (
              <Text style={styles.subtitle} numberOfLines={2}>
                {subtitle}
              </Text>
            ) : null}
            {meta ? (
              <Text style={styles.meta} numberOfLines={1}>
                {meta}
              </Text>
            ) : null}
          </View>
          {pill ? <View style={styles.pillWrap}>{pill}</View> : null}
        </View>
      )}
    </View>
  </View>
);

export const TodaySalesList: React.FC<{
  rows: TodaySaleRow[];
  currency: string;
}> = ({ rows, currency }) => {
  if (rows.length === 0) {
    return <EmptyState message="No sales recorded today yet." />;
  }
  return (
    <View style={styles.list}>
      {rows.map(row => {
        const isReturn = row.transaction_type === TRANSACTION_TYPE_RETURN;
        const isHold = (row.status ?? '').toLowerCase() === 'hold';
        return (
          <RowCard
            key={row.id}
            icon={<ShoppingCart size={18} color={colors.primary} strokeWidth={2.2} />}
            iconBg={colors.primarySoft}
            title={row.sales_id}
            subtitle={row.customer_name?.trim() || 'Walk-in Customer'}
            amount={formatCurrency(row.amount, currency)}
            amountColor={isReturn ? colors.error : colors.primary}
            meta={[row.location, row.time, row.payment_method]
              .filter(Boolean)
              .join(' · ')}
            accent={isReturn ? 'return' : 'default'}
            pill={
              <StatusPill
                label={isReturn ? 'Return' : isHold ? 'Hold' : 'Paid'}
                tone={isReturn ? 'return' : isHold ? 'hold' : 'sale'}
              />
            }
          />
        );
      })}
    </View>
  );
};

export const TodayPurchasesList: React.FC<{
  rows: TodayPurchaseRow[];
  currency: string;
}> = ({ rows, currency }) => {
  if (rows.length === 0) {
    return <EmptyState message="No purchases recorded today yet." />;
  }
  return (
    <View style={styles.list}>
      {rows.map(row => (
        <RowCard
          key={row.id}
          icon={<Truck size={18} color={colors.chartOrders} strokeWidth={2.2} />}
          iconBg={colors.backgroundAlt}
          title={row.invoice_id}
          subtitle={row.supplier_name?.trim() || 'Walk-in Supplier'}
          amount={formatCurrency(row.amount, currency)}
          amountColor={colors.error}
          meta={[row.location, row.time, row.payment_method]
            .filter(Boolean)
            .join(' · ')}
          pill={<StatusPill label="Purchase" tone="purchase" />}
        />
      ))}
    </View>
  );
};

export const TodayReorderList: React.FC<{ rows: ReorderItemRow[] }> = ({ rows }) => {
  if (rows.length === 0) {
    return <EmptyState message="All items are above reorder level." />;
  }
  return (
    <View style={styles.list}>
      {rows.map(row => (
        <RowCard
          key={row.id}
          icon={<AlertTriangle size={18} color={colors.warning} strokeWidth={2.2} />}
          iconBg={colors.warningSoft}
          title={row.item_number ?? '—'}
          subtitle={row.description}
          meta={`Stock ${row.qty}${row.uom ? ` ${row.uom}` : ''} · Reorder at ${row.reorder_qty}`}
          pill={<StatusPill label="Low stock" tone="warning" />}
          accent="warning"
        />
      ))}
    </View>
  );
};

const EmptyState: React.FC<{ message: string }> = ({ message }) => (
  <View style={styles.empty}>
    <RotateCcw size={32} color={colors.textMuted} strokeWidth={1.5} />
    <Text style={styles.emptyText}>{message}</Text>
  </View>
);

const styles = StyleSheet.create({
  list: {
    gap: 10,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.white,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    gap: 12,
  },
  cardWarning: {
    borderColor: colors.warning,
    backgroundColor: colors.warningSoft,
  },
  cardReturn: {
    borderColor: colors.error,
    backgroundColor: colors.errorSoft,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    minWidth: 0,
  },
  topLine: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  title: {
    ...typography.bodyMedium,
    color: colors.text,
    fontWeight: '700',
    flex: 1,
  },
  amount: {
    fontSize: 15,
    fontWeight: '800',
    flexShrink: 0,
  },
  bottomLine: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: 6,
    gap: 8,
  },
  metaCol: {
    flex: 1,
    minWidth: 0,
  },
  subtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  meta: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  pillWrap: {
    flexShrink: 0,
  },
  pill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  pillText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
    backgroundColor: colors.white,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  emptyText: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
