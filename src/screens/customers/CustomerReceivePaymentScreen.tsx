import React, { useEffect, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Box, HStack, Text, VStack } from '@gluestack-ui/themed';
import { User, Wallet } from 'lucide-react-native';
import { SmoothScrollView } from '@/components/common/SmoothScrollView';
import { ScreenContainer } from '@/components/common/ScreenContainer';
import { AppHeader } from '@/components/common/AppHeader';
import { FilterChips } from '@/components/common/FilterChips';
import { PrimaryButton } from '@/components/buttons/PrimaryButton';
import { LoadingOverlay } from '@/components/common/LoadingOverlay';
import { useErrorDialog } from '@/context/ErrorDialogContext';
import { useDataRefreshNotify } from '@/context/DataRefreshContext';
import { usePosSettings } from '@/context/PosSettingsContext';
import { customerService } from '@/services/api/customerService';
import { formatCurrency } from '@/utils/format';
import {
  colors,
  shadows,
  typography,
  appInputStyle,
  appInputPlaceholderColor,
} from '@/theme';
import type { HomeStackParamList } from '@/navigation/types';
import type { CustomerSummary } from '@/types/sales';

type Nav = NativeStackNavigationProp<HomeStackParamList, 'CustomerReceivePayment'>;
type Route = RouteProp<HomeStackParamList, 'CustomerReceivePayment'>;

/** Credit is not allowed — the customer is paying off credit, so a paid method is required. */
const PAYMENT_METHODS = ['Cash', 'Card', 'Cheque', 'Bank Transfer', 'Online'];

const Label: React.FC<{ children: string }> = ({ children }) => (
  <Text style={[typography.label, { color: colors.textSecondary, marginBottom: 6, marginTop: 12 }]}>
    {children}
  </Text>
);

export const CustomerReceivePaymentScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const insets = useSafeAreaInsets();
  const { currency } = usePosSettings();
  const { showError, showErrorFromUnknown } = useErrorDialog();
  const notifyRefresh = useDataRefreshNotify();
  const customerId = route.params.customerId;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [customer, setCustomer] = useState<CustomerSummary | null>(null);
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await customerService.get(customerId);
        if (!cancelled) {
          setCustomer(data);
        }
      } catch (e) {
        if (!cancelled) {
          showErrorFromUnknown(e, 'Customer');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [customerId, showErrorFromUnknown]);

  const outstanding = Math.max(0, customer?.net_balance ?? 0);
  const amountNum = parseFloat(amount.replace(/,/g, '')) || 0;
  const newBalance = Math.max(0, Math.round((outstanding - amountNum) * 100) / 100);

  const handleReceive = async () => {
    if (!customer) {
      return;
    }
    if (outstanding <= 0) {
      showError({
        title: 'No balance',
        message: 'This customer has no outstanding credit balance.',
        variant: 'warning',
      });
      return;
    }
    if (!Number.isFinite(amountNum) || amountNum <= 0) {
      showError({
        title: 'Amount',
        message: 'Enter a valid payment amount.',
        variant: 'warning',
      });
      return;
    }
    if (amountNum > outstanding + 0.01) {
      showError({
        title: 'Amount too high',
        message: `Payment cannot exceed the outstanding balance of ${formatCurrency(outstanding, currency)}.`,
        variant: 'warning',
      });
      return;
    }

    setSubmitting(true);
    try {
      const result = await customerService.receivePayment(customer.id, {
        amount: amountNum,
        payment_method: paymentMethod,
        notes: notes.trim() || null,
      });
      notifyRefresh(['customers', 'sales', 'dashboard', 'reports']);
      showError({
        title: 'Payment recorded',
        message: `Received ${formatCurrency(result.payment_received, currency)} from ${customer.customer_name}. New balance: ${formatCurrency(result.new_balance, currency)}.`,
        variant: 'info',
        confirmLabel: 'Done',
      });
      navigation.goBack();
    } catch (e) {
      showErrorFromUnknown(e, 'Receive payment');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScreenContainer>
      <AppHeader
        title="Receive payment"
        subtitle={customer?.customer_name ?? 'Customer credit settlement'}
        showBack
      />

      {loading ? <LoadingOverlay message="Loading customer…" /> : null}

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={insets.top}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <SmoothScrollView
            contentContainerStyle={styles.scroll}
            contentPaddingBottom={Math.max(insets.bottom, 24) + 24}>
            {customer ? (
              <Box style={[styles.customerCard, shadows.card]}>
                <HStack alignItems="center" gap="$3">
                  <Box
                    w={44}
                    h={44}
                    borderRadius="$full"
                    bg={colors.primarySoft}
                    alignItems="center"
                    justifyContent="center">
                    <User size={20} color={colors.primary} />
                  </Box>
                  <VStack flex={1}>
                    <Text fontWeight="$bold" color={colors.text} numberOfLines={2}>
                      {customer.customer_name}
                    </Text>
                    {customer.contact_no ? (
                      <Text size="sm" color={colors.textSecondary}>
                        {customer.contact_no}
                      </Text>
                    ) : null}
                  </VStack>
                  <VStack alignItems="flex-end">
                    <Text size="xs" color={colors.textMuted}>
                      Outstanding
                    </Text>
                    <Text
                      fontWeight="$bold"
                      color={outstanding > 0 ? colors.error : colors.success}>
                      {formatCurrency(outstanding, currency)}
                    </Text>
                  </VStack>
                </HStack>
                {outstanding <= 0 ? (
                  <Box mt="$3" p="$3" borderRadius="$lg" bg={colors.backgroundAlt}>
                    <Text size="sm" color={colors.textSecondary}>
                      This customer has no outstanding credit balance. Nothing to
                      collect.
                    </Text>
                  </Box>
                ) : null}
              </Box>
            ) : null}

            <Box style={styles.card}>
              <Label>Amount received</Label>
              <TextInput
                value={amount}
                onChangeText={setAmount}
                style={appInputStyle}
                keyboardType="decimal-pad"
                placeholder="0.00"
                placeholderTextColor={appInputPlaceholderColor}
                editable={outstanding > 0}
              />
              {outstanding > 0 ? (
                <TouchableOpacity
                  style={styles.fullAmountBtn}
                  onPress={() => setAmount(String(outstanding))}
                  accessibilityRole="button"
                  accessibilityLabel="Settle full balance">
                  <Wallet size={14} color={colors.primary} />
                  <Text size="sm" fontWeight="$semibold" color={colors.primary}>
                    Full balance · {formatCurrency(outstanding, currency)}
                  </Text>
                </TouchableOpacity>
              ) : null}
              {amountNum > 0 && amountNum <= outstanding + 0.01 ? (
                <Text size="sm" color={colors.textSecondary} mt="$1">
                  Balance after payment: {formatCurrency(newBalance, currency)}
                </Text>
              ) : null}

              <FilterChips
                label="Payment method"
                options={PAYMENT_METHODS}
                selected={paymentMethod}
                onSelect={setPaymentMethod}
                showAllOption={false}
              />

              <Label>Notes (optional)</Label>
              <TextInput
                value={notes}
                onChangeText={setNotes}
                style={[appInputStyle, styles.multiline]}
                placeholder="e.g. Debt collection"
                placeholderTextColor={appInputPlaceholderColor}
                multiline
              />

              <VStack mt="$5">
                <PrimaryButton
                  label="Receive payment"
                  onPress={handleReceive}
                  loading={submitting}
                  disabled={loading || outstanding <= 0}
                />
              </VStack>
            </Box>
          </SmoothScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  customerCard: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginBottom: 12,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  fullAmountBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  multiline: {
    minHeight: 72,
    textAlignVertical: 'top',
  },
});
