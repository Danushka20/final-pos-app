import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { ChevronUp, ShoppingBag } from 'lucide-react-native';
import { formatCurrency } from '@/utils/format';
import {
  colors,
  FLOATING_FAB_BOTTOM,
  radius,
  shadows,
  typography,
} from '@/theme';

interface PosDockCartBarProps {
  itemCount: number;
  total: number;
  currency?: string;
  /** e.g. "5 Pcs" or "3 Pcs · 2 Kg" */
  qtySummary?: string;
  actionLabel?: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
}

export const PosDockCartBar: React.FC<PosDockCartBarProps> = ({
  itemCount,
  total,
  currency,
  qtySummary,
  actionLabel = 'Next',
  onPress,
  loading = false,
  disabled = false,
}) => {
  if (itemCount <= 0) {
    return null;
  }

  const bottomOffset = FLOATING_FAB_BOTTOM;

  return (
    <View pointerEvents="box-none" style={[styles.wrap, { bottom: bottomOffset }]}>
      <View style={styles.bar}>
        <Pressable
          onPress={onPress}
          disabled={disabled || loading}
          style={styles.summaryPress}
          accessibilityRole="button"
          accessibilityLabel="View order">
          <View style={styles.chevronBtn}>
            <ShoppingBag size={17} color={colors.text} strokeWidth={2.2} />
          </View>
          <View style={styles.summaryText}>
            <View style={styles.countRow}>
              <Text style={styles.itemCount}>
                {itemCount} {itemCount === 1 ? 'line' : 'lines'}
              </Text>
              {qtySummary ? (
                <View style={styles.uomPill}>
                  <Text style={styles.uomPillText} numberOfLines={1}>
                    {qtySummary}
                  </Text>
                </View>
              ) : null}
            </View>
            <Text style={styles.total}>{formatCurrency(total, currency)}</Text>
          </View>
          <ChevronUp size={16} color={colors.textMuted} strokeWidth={2.5} />
        </Pressable>

        <Pressable
          onPress={onPress}
          disabled={disabled || loading}
          style={({ pressed }) => [
            styles.nextBtn,
            pressed && !disabled && !loading && styles.nextBtnPressed,
            (disabled || loading) && styles.nextBtnDisabled,
          ]}
          accessibilityRole="button"
          accessibilityLabel={actionLabel}>
          {loading ? (
            <ActivityIndicator size="small" color={colors.textOnPrimary} />
          ) : (
            <Text style={styles.nextLabel}>{actionLabel}</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 100,
    elevation: 16,
    paddingHorizontal: 12,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    paddingLeft: 8,
    paddingRight: 8,
    paddingVertical: 8,
    minHeight: 68,
    gap: 10,
    ...shadows.lg,
  },
  summaryPress: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: 0,
  },
  chevronBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.backgroundAlt,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryText: {
    flex: 1,
    minWidth: 0,
  },
  countRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  itemCount: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  uomPill: {
    backgroundColor: colors.text,
    borderRadius: radius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
    maxWidth: '100%',
  },
  uomPillText: {
    ...typography.caption,
    fontSize: 10,
    fontWeight: '800',
    color: colors.textOnPrimary,
  },
  total: {
    ...typography.label,
    color: colors.text,
    fontWeight: '800',
    fontSize: 18,
    marginTop: 2,
  },
  nextBtn: {
    backgroundColor: colors.text,
    borderRadius: radius.full,
    paddingHorizontal: 22,
    paddingVertical: 12,
    minWidth: 96,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextBtnPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  nextBtnDisabled: {
    opacity: 0.55,
  },
  nextLabel: {
    ...typography.label,
    color: colors.textOnPrimary,
    fontWeight: '800',
    fontSize: 14,
  },
});
