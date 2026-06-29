import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PrimaryButton } from '@/components/buttons/PrimaryButton';
import { formatCurrency } from '@/utils/format';
import { colors, TAB_BAR_BOTTOM_MARGIN, typography } from '@/theme';

interface OrderCheckoutFooterProps {
  total: number;
  currency?: string;
  paymentMethod?: string;
  onPay: () => void;
  onHold?: () => void;
  showHold?: boolean;
  isReturn?: boolean;
  payLoading?: boolean;
  holdLoading?: boolean;
  disabled?: boolean;
}

export const OrderCheckoutFooter: React.FC<OrderCheckoutFooterProps> = ({
  total,
  currency,
  paymentMethod,
  onPay,
  onHold,
  showHold = false,
  isReturn = false,
  payLoading = false,
  holdLoading = false,
  disabled = false,
}) => {
  const insets = useSafeAreaInsets();
  const payLabel = isReturn ? 'Save Return' : 'Save & Pay';
  const payDetail =
    !isReturn && paymentMethod
      ? `${paymentMethod} · ${formatCurrency(total, currency)}`
      : formatCurrency(total, currency);

  return (
    <View
      style={[
        styles.footer,
        { paddingBottom: Math.max(insets.bottom, 8) + TAB_BAR_BOTTOM_MARGIN },
      ]}>
      <Text style={styles.totalLine}>
        {isReturn ? 'Refund total' : 'Balance'}: {formatCurrency(total, currency)}
      </Text>

      {showHold && !isReturn && onHold ? (
        <View style={styles.row}>
          <View style={styles.btnCol}>
            <PrimaryButton
              label={payLoading ? 'Saving…' : payLabel}
              onPress={onPay}
              loading={payLoading}
              disabled={disabled || holdLoading}
            />
            <Text style={styles.hint} numberOfLines={1}>
              {payDetail}
            </Text>
          </View>
          <View style={styles.btnCol}>
            <PrimaryButton
              label={holdLoading ? 'Holding…' : 'Hold & print'}
              variant="outline"
              onPress={onHold}
              loading={holdLoading}
              disabled={disabled || payLoading}
            />
          </View>
        </View>
      ) : (
        <>
          <PrimaryButton
            label={payLoading ? 'Saving…' : payLabel}
            onPress={onPay}
            loading={payLoading}
            disabled={disabled}
          />
          {!isReturn && paymentMethod ? (
            <Text style={styles.hint} numberOfLines={1}>
              {payDetail}
            </Text>
          ) : null}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.backgroundAlt,
    gap: 10,
  },
  totalLine: {
    ...typography.label,
    color: colors.text,
    fontWeight: '700',
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  btnCol: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  hint: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
    fontSize: 11,
  },
});

/** @deprecated use OrderCheckoutFooter */
export const OrderCheckoutFabBar = OrderCheckoutFooter;
