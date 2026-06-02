import React, { useEffect, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SmoothScrollView } from '@/components/common/SmoothScrollView';
import { Box, HStack, Pressable, Text, VStack } from '@gluestack-ui/themed';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ChevronRight, Minus, Plus, Trash2, User } from 'lucide-react-native';
import { ScreenContainer } from '@/components/common/ScreenContainer';
import { AppHeader } from '@/components/common/AppHeader';
import { LoadingOverlay } from '@/components/common/LoadingOverlay';
import { SelectionModal } from '@/components/common/SelectionModal';
import { PrimaryButton } from '@/components/buttons/PrimaryButton';
import { PaymentMethodPicker } from '@/components/sales/PaymentMethodPicker';
import { PaymentMethodDetails } from '@/components/sales/PaymentMethodDetails';
import { useErrorDialog } from '@/context/ErrorDialogContext';
import { usePosSaleContext } from '@/context/PosSaleContext';
import { usePosSettings } from '@/context/PosSettingsContext';
import { bankService, type BankAccount } from '@/services/api/bankService';
import { salesService } from '@/services/api/salesService';
import { bluetoothPrintService } from '@/services/bluetooth/bluetoothPrintService';
import { formatCurrency } from '@/utils/format';
import {
  buildPaymentNotes,
  isOnlinePayment,
  needsBank,
  needsPaymentReference,
} from '@/utils/paymentMethod';
import { colors, appInputStyle, shadows, TAB_BAR_BOTTOM_MARGIN, typography } from '@/theme';
import type { SalesStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<SalesStackParamList, 'SaleOrder'>;

export const SaleOrderScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const { showError } = useErrorDialog();
  const { currency } = usePosSettings();
  const pos = usePosSaleContext();

  const [customerModal, setCustomerModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState(pos.paymentMethod);
  const [amountReceived, setAmountReceived] = useState('');
  const [banks, setBanks] = useState<BankAccount[]>([]);
  const [bankId, setBankId] = useState<number | null>(null);
  const [chequeNumber, setChequeNumber] = useState('');
  const [printing, setPrinting] = useState(false);
  const [originalSaleId, setOriginalSaleId] = useState('');
  const [refundCardLast4, setRefundCardLast4] = useState('');
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentCardLast4, setPaymentCardLast4] = useState('');

  useEffect(() => {
    if (pos.error) {
      showError({ title: 'Order', message: pos.error });
      pos.setError(null);
    }
  }, [pos.error, pos.setError, showError]);

  useEffect(() => {
    setPaymentMethod(pos.paymentMethod);
    setAmountReceived(String(pos.netAmount));
  }, [pos.netAmount, pos.paymentMethod]);

  useEffect(() => {
    if (pos.returnSourceSale?.sales_id) {
      setOriginalSaleId(pos.returnSourceSale.sales_id);
    }
  }, [pos.returnSourceSale?.sales_id]);

  useEffect(() => {
    if (!needsBank(paymentMethod)) {
      setChequeNumber('');
      setBankId(null);
    }
    if (!isOnlinePayment(paymentMethod)) {
      setPaymentReference('');
    }
    if (!isOnlinePayment(paymentMethod) && !/^card$/i.test(paymentMethod)) {
      setPaymentCardLast4('');
    }
  }, [paymentMethod]);

  useEffect(() => {
    if (!needsBank(paymentMethod)) {
      return;
    }
    bankService
      .list()
      .then(list => {
        setBanks(list);
        if (list.length > 0) {
          setBankId(list[0].id);
        }
      })
      .catch(() => setBanks([]));
  }, [paymentMethod]);

  const itemStockMap = useMemo(
    () => new Map(pos.items.map(i => [i.id, i])),
    [pos.items],
  );

  const customerOptions = [
    { id: 'walk-in', label: 'Walk-in Customer', subtitle: 'Default' },
    ...pos.customers.map(c => ({
      id: String(c.id),
      label: c.customer_name,
      subtitle: [c.customer_code ?? c.customer_id, c.contact_no, c.location]
        .filter(Boolean)
        .join(' · '),
    })),
  ];

  const handlePay = async () => {
    if (!pos.isReturn && pos.cartHasStockIssues()) {
      showError({
        title: 'Stock issue',
        message: 'Remove or reduce out-of-stock items before payment.',
        variant: 'warning',
      });
      return;
    }

    if (pos.isReturn && pos.requiresRefundCard) {
      const digits = refundCardLast4.replace(/\D/g, '');
      if (digits.length !== 4) {
        showError({
          title: 'Refund verification',
          message: 'Enter the credit card last 4 digits for this return.',
          variant: 'warning',
        });
        return;
      }
      try {
        await salesService.verifyRefundCard(digits);
      } catch (e) {
        showError({
          title: 'Refund verification',
          message: e instanceof Error ? e.message : 'Card verification failed',
        });
        return;
      }
    }

    if (
      !pos.isReturn &&
      needsPaymentReference(paymentMethod) &&
      !paymentReference.trim()
    ) {
      showError({
        title: isOnlinePayment(paymentMethod) ? 'Online payment' : 'Bank transfer',
        message: isOnlinePayment(paymentMethod)
          ? 'Enter the transaction or approval ID.'
          : 'Enter the transfer reference number.',
        variant: 'warning',
      });
      return;
    }

    const received = parseFloat(amountReceived) || pos.netAmount;
    const paymentNotes = buildPaymentNotes(paymentMethod, {
      reference: paymentReference,
      cardLast4: paymentCardLast4,
    });

    const result = await pos.completeSale({
      payment_method: paymentMethod,
      amount_received: received,
      bank_id: needsBank(paymentMethod) ? bankId : null,
      cheque_number: /cheque/i.test(paymentMethod) ? chequeNumber.trim() || undefined : undefined,
      notes: paymentNotes,
      refund_card_last4: pos.isReturn ? refundCardLast4.replace(/\D/g, '').slice(-4) : null,
      original_sale_id: pos.isReturn ? originalSaleId.trim() || null : null,
    });

    if (!result) {
      return;
    }

    const activeCustomer = pos.customer;
    const receiptWithCustomerInfo = {
      ...result.receipt,
      sale: {
        ...result.receipt.sale,
        customer_name:
          result.receipt.sale.customer_name ?? activeCustomer?.customer_name ?? null,
        customer_code:
          result.receipt.sale.customer_code ??
          activeCustomer?.customer_code ??
          activeCustomer?.customer_id ??
          null,
        customer_contact_no:
          result.receipt.sale.customer_contact_no ?? activeCustomer?.contact_no ?? null,
        customer_email:
          result.receipt.sale.customer_email ?? activeCustomer?.email ?? null,
        customer_location:
          result.receipt.sale.customer_location ?? activeCustomer?.location ?? null,
        customer_address:
          result.receipt.sale.customer_address ?? activeCustomer?.address ?? null,
        customer_tax_id:
          result.receipt.sale.customer_tax_id ?? activeCustomer?.tax_id ?? null,
      },
    };

    setPrinting(true);
    try {
      if (bluetoothPrintService.isSupported()) {
        await bluetoothPrintService.printReceipt(receiptWithCustomerInfo, currency);
      }
    } catch (e) {
      showError({
        title: 'Print',
        message:
          e instanceof Error
            ? e.message
            : 'Could not print receipt. Connect a Bluetooth printer in receipt screen.',
        variant: 'warning',
      });
    } finally {
      setPrinting(false);
    }

    navigation.replace('SaleReceipt', { receipt: receiptWithCustomerInfo });
  };

  // Tab bar is hidden on this screen, so keep footer close to safe area only.
  const tabBarClearance = Math.max(insets.bottom, TAB_BAR_BOTTOM_MARGIN);
  const footerHeight = 92;
  const scrollBottomPad = tabBarClearance + footerHeight + 16;

  if (pos.cart.length === 0 && !pos.submitting) {
    return (
      <ScreenContainer>
        <AppHeader title={pos.isReturn ? 'Return order' : 'Your Order'} showBack />
        <Box flex={1} alignItems="center" justifyContent="center" px="$6">
          <Text color={colors.textMuted} textAlign="center" mb="$4">
            No items in this order. Go back and select products.
          </Text>
          <PrimaryButton label="Back to products" onPress={() => navigation.goBack()} />
        </Box>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <AppHeader
        title={pos.isReturn ? 'Return order' : 'Your Order'}
        subtitle={`${pos.cart.length} item${pos.cart.length === 1 ? '' : 's'} · ${formatCurrency(pos.netAmount, currency)}`}
        showBack
      />

      {pos.submitting || printing ? (
        <LoadingOverlay
          message={
            printing
              ? 'Printing receipt…'
              : pos.isReturn
                ? 'Processing return…'
                : 'Processing payment…'
          }
        />
      ) : null}

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top + 8 : 0}>
        <SmoothScrollView
          style={styles.flex}
          contentContainerStyle={styles.scroll}
          contentPaddingBottom={scrollBottomPad}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          automaticallyAdjustKeyboardInsets>
        {pos.isReturn ? (
          <Box
            bg={colors.errorSoft}
            borderRadius="$lg"
            px="$3"
            py="$2"
            mb="$3"
            borderWidth={1}
            borderColor={colors.error}>
            <Text size="sm" color={colors.error} fontWeight="$bold">
              Sales return — stock will be added back to inventory
            </Text>
          </Box>
        ) : null}

        <Text style={styles.sectionTitle}>
          {pos.isReturn ? 'Items to return' : 'Order items'}
        </Text>
        {pos.cart.map(line => {
          const item = itemStockMap.get(line.item_id);
          const stock = item?.qty ?? 0;
          const outOfStock =
            !pos.isReturn && !pos.allowNegativeInventory && stock <= 0;

          return (
            <HStack
              key={line.item_id}
              style={styles.lineRow}
              alignItems="center"
              gap="$2">
              <VStack flex={1}>
                <Text size="sm" fontWeight="$bold" color={colors.text} numberOfLines={2}>
                  {line.description}
                </Text>
                <Text size="xs" color={colors.textMuted}>
                  {line.item_number ? `ID ${line.item_number} · ` : ''}
                  {formatCurrency(line.unit_price, currency)} each
                  {pos.isReturn
                    ? ` · max ${pos.getMaxReturnQty(line.item_id)}`
                    : ''}
                </Text>
                {outOfStock ? (
                  <Text size="2xs" color={colors.error} fontWeight="$bold" mt="$0.5">
                    Out of stock
                  </Text>
                ) : null}
              </VStack>
              <HStack alignItems="center" gap="$1.5">
                <TouchableOpacity
                  onPress={() => pos.decrementCartQty(line.item_id)}
                  style={styles.qtyBtn}>
                  <Minus size={14} color={colors.textSecondary} />
                </TouchableOpacity>
                <Text fontWeight="$bold" minWidth={20} textAlign="center">
                  {line.qty}
                </Text>
                <TouchableOpacity
                  onPress={() => pos.updateCartQty(line.item_id, line.qty + 1)}
                  style={styles.qtyBtn}
                  disabled={
                    outOfStock ||
                    (pos.isReturn && line.qty >= pos.getMaxReturnQty(line.item_id))
                  }>
                  <Plus size={14} color={colors.textSecondary} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => pos.removeFromCart(line.item_id)}>
                  <Trash2 size={16} color={colors.error} />
                </TouchableOpacity>
              </HStack>
              <Text fontWeight="$bold" minWidth={64} textAlign="right">
                {formatCurrency(line.line_total, currency)}
              </Text>
            </HStack>
          );
        })}

        <View style={styles.totalBox}>
          <HStack justifyContent="space-between">
            <Text fontWeight="$semibold" color={colors.textSecondary}>
              Total
            </Text>
            <Text
              fontSize="$xl"
              fontWeight="$bold"
              color={pos.isReturn ? colors.error : colors.primary}>
              {formatCurrency(pos.netAmount, currency)}
            </Text>
          </HStack>
        </View>

        {pos.isReturn ? (
          <>
            <Text style={styles.sectionTitle}>Original sale</Text>
            <TextInput
              value={originalSaleId}
              onChangeText={setOriginalSaleId}
              style={[appInputStyle, pos.returnSourceSale && styles.inputReadOnly]}
              placeholder="e.g. SAL-0042"
              placeholderTextColor={colors.textMuted}
              editable={!pos.returnSourceSale}
            />
          </>
        ) : null}

        <Text style={styles.sectionTitle}>Customer</Text>
        <Pressable
          onPress={() => setCustomerModal(true)}
          borderWidth={1}
          borderColor={colors.primaryMuted}
          borderRadius="$xl"
          px="$3"
          py="$3"
          bg={colors.white}
          flexDirection="row"
          alignItems="center"
          justifyContent="space-between"
          mb="$4">
          <HStack alignItems="center" gap="$2" flex={1}>
            <Box bg={colors.primarySoft} p="$1.5" borderRadius="$full">
              <User size={16} color={colors.primary} />
            </Box>
            <Text size="sm" fontWeight="$semibold" color={colors.text}>
              {pos.customer?.customer_name ?? 'Walk-in Customer'}
            </Text>
          </HStack>
          <ChevronRight size={16} color={colors.primaryLight} />
        </Pressable>

        <PaymentMethodPicker
          methods={pos.paymentMethods}
          selected={paymentMethod}
          onSelect={setPaymentMethod}
        />

        <PaymentMethodDetails
          paymentMethod={paymentMethod}
          isReturn={pos.isReturn}
          netAmount={pos.netAmount}
          amountReceived={amountReceived}
          onAmountReceivedChange={setAmountReceived}
          banks={banks}
          bankId={bankId}
          onBankIdChange={setBankId}
          chequeNumber={chequeNumber}
          onChequeNumberChange={setChequeNumber}
          paymentReference={paymentReference}
          onPaymentReferenceChange={setPaymentReference}
          paymentCardLast4={paymentCardLast4}
          onPaymentCardLast4Change={setPaymentCardLast4}
        />

        {pos.isReturn && pos.requiresRefundCard ? (
          <>
            <Text style={styles.label}>Card last 4 digits</Text>
            <TextInput
              value={refundCardLast4}
              onChangeText={t => setRefundCardLast4(t.replace(/\D/g, '').slice(0, 4))}
              keyboardType="number-pad"
              maxLength={4}
              style={appInputStyle}
              placeholder="Required for card refunds"
              placeholderTextColor={colors.textMuted}
            />
          </>
        ) : null}

        </SmoothScrollView>

        <View
          style={[
            styles.footer,
            { bottom: tabBarClearance, paddingBottom: 12 },
            shadows.lg,
          ]}>
          <HStack justifyContent="space-between" alignItems="center" mb="$2" px="$1">
            <Text size="sm" color={colors.textSecondary} fontWeight="$semibold">
              {pos.isReturn ? 'Return total' : 'Total due'}
            </Text>
            <Text
              size="lg"
              fontWeight="$bold"
              color={pos.isReturn ? colors.error : colors.primary}>
              {formatCurrency(pos.netAmount, currency)}
            </Text>
          </HStack>
          <PrimaryButton
            label={
              pos.isReturn
                ? 'Save Return'
                : 'Save & Pay'
            }
            onPress={handlePay}
            loading={pos.submitting || printing}
            disabled={pos.submitting || printing}
          />
        </View>
      </KeyboardAvoidingView>

      <SelectionModal
        visible={customerModal}
        title="Select customer"
        options={customerOptions}
        onSelect={opt => {
          if (opt.id === 'walk-in') {
            pos.selectCustomer({ id: 0, customer_name: 'Walk-in Customer' });
          } else {
            const found = pos.customers.find(c => String(c.id) === opt.id);
            if (found) {
              pos.selectCustomer(found);
            }
          }
        }}
        onClose={() => setCustomerModal(false)}
        emptyMessage="No customers"
      />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  scroll: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  sectionTitle: {
    ...typography.label,
    color: colors.textSecondary,
    marginBottom: 10,
    marginTop: 4,
  },
  lineRow: {
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderLight,
  },
  qtyBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  totalBox: {
    marginTop: 12,
    marginBottom: 20,
    padding: 14,
    borderRadius: 12,
    backgroundColor: colors.surfaceElevated,
  },
  label: {
    ...typography.label,
    color: colors.textSecondary,
    marginTop: 12,
    marginBottom: 6,
  },
  inputReadOnly: {
    backgroundColor: colors.backgroundAlt,
    color: colors.textSecondary,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
});
