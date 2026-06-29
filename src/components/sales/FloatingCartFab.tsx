import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ChevronRight,
  CreditCard,
  Package,
  ShoppingCart,
  type LucideIcon,
} from 'lucide-react-native';
import { formatCurrency } from '@/utils/format';
import {
  colors,
  FLOATING_FAB_BOTTOM,
  radius,
  shadows,
  TAB_BAR_BOTTOM_MARGIN,
  typography,
} from '@/theme';

interface FloatingCartFabProps {
  itemCount: number;
  total: number;
  currency?: string;
  isReturn?: boolean;
  variant?: 'sale' | 'purchase' | 'return' | 'checkout';
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
}

const VARIANT_CONFIG: Record<
  'sale' | 'purchase' | 'return' | 'checkout',
  { label: string; Icon: LucideIcon; a11y: string }
> = {
  sale: { label: 'View order', Icon: ShoppingCart, a11y: 'View order' },
  purchase: { label: 'View purchase', Icon: Package, a11y: 'View purchase' },
  return: { label: 'Return order', Icon: ShoppingCart, a11y: 'View return order' },
  checkout: { label: 'Save & Pay', Icon: CreditCard, a11y: 'Save and pay' },
};

export const FloatingCartFab: React.FC<FloatingCartFabProps> = ({
  itemCount,
  total,
  currency,
  isReturn,
  variant,
  onPress,
  loading = false,
  disabled = false,
}) => {
  const insets = useSafeAreaInsets();
  const resolvedVariant = variant ?? (isReturn ? 'return' : 'sale');
  const config = VARIANT_CONFIG[resolvedVariant];
  const label =
    resolvedVariant === 'checkout' && isReturn ? 'Save Return' : config.label;
  const { Icon, a11y } = config;

  if (itemCount <= 0 && resolvedVariant !== 'checkout') {
    return null;
  }

  const bottomOffset =
    FLOATING_FAB_BOTTOM + Math.max(insets.bottom, TAB_BAR_BOTTOM_MARGIN);

  return (
    <View pointerEvents="box-none" style={[styles.wrap, { bottom: bottomOffset }]}>
      <Pressable
        onPress={onPress}
        disabled={disabled || loading}
        style={({ pressed }) => [
          styles.chip,
          pressed && !disabled && !loading && styles.chipPressed,
          (disabled || loading) && styles.chipDisabled,
        ]}
        accessibilityRole="button"
        accessibilityLabel={resolvedVariant === 'checkout' && isReturn ? 'Save return' : a11y}>
        <View style={styles.iconWrap}>
          <Icon size={22} color={colors.text} strokeWidth={2.25} />
          {itemCount > 0 ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{itemCount > 99 ? '99+' : itemCount}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.textCol}>
          <Text style={styles.label}>{label}</Text>
          <Text style={styles.total}>{formatCurrency(total, currency)}</Text>
        </View>

        <View
          style={[
            styles.arrowWrap,
            isReturn && resolvedVariant === 'checkout' && styles.arrowReturn,
          ]}>
          {loading ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <ChevronRight size={20} color={colors.white} strokeWidth={2.5} />
          )}
        </View>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 100,
    elevation: 12,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: radius.full,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    paddingLeft: 12,
    paddingRight: 10,
    paddingVertical: 10,
    minHeight: 58,
    gap: 12,
    ...shadows.lg,
  },
  chipPressed: {
    opacity: 0.94,
    transform: [{ scale: 0.99 }],
    backgroundColor: colors.primarySoft,
  },
  chipDisabled: {
    opacity: 0.65,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.backgroundAlt,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.error,
    borderWidth: 2,
    borderColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.white,
  },
  textCol: {
    flex: 1,
    minWidth: 0,
  },
  label: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  total: {
    ...typography.label,
    color: colors.text,
    fontWeight: '800',
    fontSize: 16,
    marginTop: 2,
  },
  arrowWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.text,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowReturn: {
    backgroundColor: colors.error,
  },
});
