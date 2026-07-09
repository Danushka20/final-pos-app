import React, { useEffect } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { HStack, Text } from '@gluestack-ui/themed';
import { Globe, Smartphone } from 'lucide-react-native';
import type { BankAccount } from '@/services/api/bankService';
import {
  acceptsCardLast4,
  isCashPayment,
  isCreditPayment,
  isOnlinePayment,
  isWalkInCustomer,
  locksAmountReceived,
  needsBank,
} from '@/utils/paymentMethod';
import { formatCurrency, getCurrencyLabel } from '@/utils/format';
import type { CustomerSummary } from '@/types/sales';
import { colors, appInputStyle, typography } from '@/theme';

interface PaymentMethodDetailsProps {
  paymentMethod: string;
  isReturn: boolean;
  netAmount: number;
  currency?: string;
  amountReceived: string;
  onAmountReceivedChange: (v: string) => void;
  banks: BankAccount[];
  bankId: number | null;
  onBankIdChange: (id: number) => void;
  chequeNumber: string;
  onChequeNumberChange: (v: string) => void;
  paymentReference: string;
  onPaymentReferenceChange: (v: string) => void;
  paymentCardLast4: string;
  onPaymentCardLast4Change: (v: string) => void;
  customer?: CustomerSummary | null;
}

export const PaymentMethodDetails: React.FC<PaymentMethodDetailsProps> = ({
  paymentMethod,
  isReturn,
  netAmount,
  currency,
  amountReceived,
  onAmountReceivedChange,
  banks,
  bankId,
  onBankIdChange,
  chequeNumber,
  onChequeNumberChange,
  paymentReference,
  onPaymentReferenceChange,
  paymentCardLast4,
  onPaymentCardLast4Change,
  customer,
}) => {
  useEffect(() => {
    if (locksAmountReceived(paymentMethod)) {
      onAmountReceivedChange(String(netAmount));
    }
  }, [paymentMethod, netAmount, onAmountReceivedChange]);

  const receivedNum = parseFloat(amountReceived.replace(/,/g, '')) || 0;
  const changeDue =
    !isReturn && isCashPayment(paymentMethod) && receivedNum >= netAmount
      ? Math.round((receivedNum - netAmount) * 100) / 100
      : null;

  const outstanding = customer?.net_balance ?? 0;
  const creditLimit = customer?.credit_limit ?? 0;
  const creditAvailable =
    creditLimit > 0 ? Math.max(0, creditLimit - outstanding) : null;
  const newBalanceAfterSale =
    !isReturn && isCreditPayment(paymentMethod) && !isWalkInCustomer(customer)
      ? outstanding + netAmount
      : null;
  const newBalanceAfterReturn =
    isReturn && isCreditPayment(paymentMethod) && !isWalkInCustomer(customer)
      ? Math.max(0, outstanding - netAmount)
      : null;

  return (
    <View key={paymentMethod} style={styles.panel}>
      <Text style={styles.label}>
        {isReturn ? 'Refund amount' : 'Amount received'}
        {currency ? ` (${getCurrencyLabel(currency)})` : ''}
      </Text>
      <Text style={styles.amountHint}>
        {isReturn ? 'Refund total' : 'Order total'}:{' '}
        {formatCurrency(netAmount, currency)}
      </Text>
      <TextInput
        value={amountReceived}
        onChangeText={onAmountReceivedChange}
        keyboardType="decimal-pad"
        style={appInputStyle}
        editable={!locksAmountReceived(paymentMethod)}
      />
      {changeDue != null && changeDue >= 0 ? (
        <Text style={styles.changeHint}>
          Change to give: {formatCurrency(changeDue, currency)}
        </Text>
      ) : null}

      {!isReturn && isCreditPayment(paymentMethod) ? (
        <View
          style={[
            styles.onlineBanner,
            isWalkInCustomer(customer) && styles.creditWarningBanner,
          ]}>
          <Text style={styles.onlineBannerText}>
            {isWalkInCustomer(customer)
              ? 'Select a registered customer — credit sales cannot use Walk-in Customer.'
              : `Charged to ${customer?.customer_name ?? 'customer account'}.`}
          </Text>
          {!isWalkInCustomer(customer) ? (
            <View style={styles.creditStats}>
              <Text style={styles.creditStatLine}>
                Current balance: {formatCurrency(outstanding, currency)}
              </Text>
              {newBalanceAfterSale != null ? (
                <Text style={styles.creditStatLine}>
                  After this sale: {formatCurrency(newBalanceAfterSale, currency)}
                </Text>
              ) : null}
              {creditAvailable != null ? (
                <Text style={styles.creditStatLine}>
                  Credit available: {formatCurrency(creditAvailable, currency)}
                </Text>
              ) : null}
            </View>
          ) : null}
        </View>
      ) : null}

      {isReturn && isCreditPayment(paymentMethod) && !isWalkInCustomer(customer) ? (
        <View style={styles.onlineBanner}>
          <Text style={styles.onlineBannerText}>
            Credit return — {formatCurrency(netAmount, currency)} will be deducted from{' '}
            {customer?.customer_name ?? 'customer account'}.
          </Text>
          <View style={styles.creditStats}>
            <Text style={styles.creditStatLine}>
              Current balance: {formatCurrency(outstanding, currency)}
            </Text>
            {newBalanceAfterReturn != null ? (
              <Text style={styles.creditStatLine}>
                After this return: {formatCurrency(newBalanceAfterReturn, currency)}
              </Text>
            ) : null}
          </View>
        </View>
      ) : null}

      {!isReturn && isOnlinePayment(paymentMethod) ? (
        <>
          <View style={styles.onlineBanner}>
            <Globe size={18} color={colors.primary} />
            <Text style={styles.onlineBannerText}>
              Online payment — enter the gateway transaction or approval ID.
            </Text>
          </View>

          <Text style={styles.label}>Transaction / approval ID</Text>
          <TextInput
            value={paymentReference}
            onChangeText={onPaymentReferenceChange}
            style={appInputStyle}
            placeholder="Gateway reference"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="characters"
          />
        </>
      ) : null}

      {!isReturn && acceptsCardLast4(paymentMethod) ? (
        <>
          <Text style={styles.label}>
            {isOnlinePayment(paymentMethod)
              ? 'Card last 4 (optional)'
              : 'Card last 4 digits (optional)'}
          </Text>
          <TextInput
            value={paymentCardLast4}
            onChangeText={t => onPaymentCardLast4Change(t.replace(/\D/g, '').slice(0, 4))}
            keyboardType="number-pad"
            maxLength={4}
            style={appInputStyle}
            placeholder="••••"
            placeholderTextColor={colors.textMuted}
          />
          {isOnlinePayment(paymentMethod) ? (
            <HStack alignItems="center" gap="$2" mt="$1">
              <Smartphone size={14} color={colors.textMuted} />
              <Text size="2xs" color={colors.textMuted} flex={1}>
                Saved on the bill with payment notes.
              </Text>
            </HStack>
          ) : null}
        </>
      ) : null}

      {needsBank(paymentMethod) ? (
        <>
          <Text style={styles.label}>Bank account</Text>
          {banks.length === 0 ? (
            <Text color={colors.error} size="sm" mb="$2">
              No banks configured
            </Text>
          ) : (
            banks.map(b => (
              <TouchableOpacity
                key={b.id}
                style={[styles.bankRow, bankId === b.id && styles.bankRowActive]}
                onPress={() => onBankIdChange(b.id)}>
                <Text fontWeight="$semibold">{b.name}</Text>
              </TouchableOpacity>
            ))
          )}
          {/cheque/i.test(paymentMethod) ? (
            <>
              <Text style={styles.label}>Cheque number</Text>
              <TextInput
                value={chequeNumber}
                onChangeText={onChequeNumberChange}
                style={appInputStyle}
                placeholder="Enter cheque number"
                placeholderTextColor={colors.textMuted}
              />
            </>
          ) : (
            <>
              <Text style={styles.label}>Transfer reference</Text>
              <TextInput
                value={paymentReference}
                onChangeText={onPaymentReferenceChange}
                style={appInputStyle}
                placeholder="Reference / transaction ID"
                placeholderTextColor={colors.textMuted}
              />
            </>
          )}
        </>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  panel: {
    marginBottom: 8,
  },
  label: {
    ...typography.label,
    color: colors.textSecondary,
    marginTop: 12,
    marginBottom: 6,
  },
  amountHint: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: 8,
  },
  changeHint: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
    marginTop: 8,
    marginBottom: 4,
  },
  onlineBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginTop: 10,
    padding: 12,
    borderRadius: 12,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.border,
  },
  onlineBannerText: {
    ...typography.caption,
    color: colors.primaryDeep,
    flex: 1,
    lineHeight: 18,
    fontWeight: '600',
  },
  creditWarningBanner: {
    backgroundColor: colors.warningSoft,
    borderColor: colors.warning,
  },
  creditStats: {
    marginTop: 8,
    gap: 4,
  },
  creditStatLine: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  bankRow: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  bankRowActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
});
