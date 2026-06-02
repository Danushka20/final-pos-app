import React from 'react';
import { StyleSheet, View } from 'react-native';
import {
  ArrowDownLeft,
  ArrowUpRight,
  CreditCard,
  Receipt,
  RotateCcw,
  Wallet,
} from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { Pressable, Text } from 'react-native';
import { cardStyles, colors, radius, typography } from '@/theme';

export interface RecentTransaction {
  id: string;
  type: 'sale' | 'return' | 'purchase' | 'payment' | 'expense';
  title: string;
  reference?: string;
  amount: string;
  time: string;
  status: 'paid' | 'pending' | 'hold';
}

const typeConfig: Record<
  RecentTransaction['type'],
  { label: string; icon: LucideIcon; color: string; bg: string }
> = {
  sale: { label: 'Sale', icon: Receipt, color: colors.text, bg: colors.pastelYellow },
  return: {
    label: 'Return',
    icon: RotateCcw,
    color: colors.textSecondary,
    bg: colors.pastelPinkSoft,
  },
  purchase: {
    label: 'Purchase',
    icon: ArrowDownLeft,
    color: colors.text,
    bg: colors.pastelGreenSoft,
  },
  payment: {
    label: 'Payment',
    icon: CreditCard,
    color: colors.text,
    bg: colors.pastelBlueSoft,
  },
  expense: {
    label: 'Expense',
    icon: Wallet,
    color: colors.textSecondary,
    bg: colors.pastelPinkSoft,
  },
};

const statusConfig = {
  paid: { text: 'Done', dot: colors.statusDotGreen, bg: colors.pastelGreenSoft },
  pending: { text: 'Pending', dot: colors.statusDotYellow, bg: colors.pastelYellowSoft },
  hold: { text: 'Hold', dot: colors.statusDotRed, bg: colors.pastelPinkSoft },
};

interface Props {
  item: RecentTransaction;
  isLast?: boolean;
  onPress?: () => void;
}

export const RecentTransactionRow: React.FC<Props> = ({ item, onPress }) => {
  const type = typeConfig[item.type];
  const status = statusConfig[item.status];
  const Icon = type.icon;
  const isCredit = item.type === 'sale' || item.type === 'payment';

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, cardStyles.surfaceFlat, pressed && styles.pressed]}>
      <View style={styles.row}>
        <View style={[styles.iconWrap, { backgroundColor: type.bg }]}>
          <Icon size={20} color={type.color} strokeWidth={2.2} />
        </View>

        <View style={styles.body}>
          <View style={styles.topLine}>
            <Text style={styles.title} numberOfLines={1}>
              {item.title}
            </Text>
            <View style={styles.amountRow}>
              {isCredit ? (
                <ArrowUpRight size={13} color={colors.text} />
              ) : (
                <ArrowDownLeft size={13} color={colors.textSecondary} />
              )}
              <Text style={styles.amount}>{item.amount}</Text>
            </View>
          </View>

          <Text style={styles.description} numberOfLines={1}>
            {item.time}
            {item.reference ? ` · ${item.reference}` : ''}
          </Text>

          <View style={styles.footer}>
            <View style={[styles.statusPill, { backgroundColor: status.bg }]}>
              <View style={[styles.statusDot, { backgroundColor: status.dot }]} />
              <Text style={styles.statusText}>{status.text}</Text>
            </View>
            <Text style={styles.typeLabel}>{type.label}</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 10,
    padding: 14,
    borderColor: colors.border,
  },
  pressed: {
    opacity: 0.92,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
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
    ...typography.label,
    color: colors.text,
    fontWeight: '700',
    flex: 1,
    fontSize: 15,
  },
  description: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 4,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    flexShrink: 0,
  },
  amount: {
    ...typography.label,
    fontWeight: '800',
    color: colors.text,
    fontSize: 15,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.full,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.text,
    fontSize: 11,
  },
  typeLabel: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: '600',
  },
});
