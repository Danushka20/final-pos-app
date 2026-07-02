import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SmoothScrollView } from '@/components/common/SmoothScrollView';
import { Box, HStack, Pressable, Text, VStack } from '@gluestack-ui/themed';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ChevronRight, User } from 'lucide-react-native';
import { ScreenContainer } from '@/components/common/ScreenContainer';
import { AppHeader } from '@/components/common/AppHeader';
import { LoadingOverlay } from '@/components/common/LoadingOverlay';
import { SelectionModal } from '@/components/common/SelectionModal';
import { PrimaryButton } from '@/components/buttons/PrimaryButton';
import { OrderCheckoutFooter } from '@/components/sales/OrderCheckoutFabBar';
import { CartOffersSummary } from '@/components/sales/CartOffersSummary';
import { SaleOrderLineRow } from '@/components/sales/SaleOrderLineRow';
import { FilterChips } from '@/components/common/FilterChips';
import { PaymentMethodPicker } from '@/components/sales/PaymentMethodPicker';
import { PaymentMethodDetails } from '@/components/sales/PaymentMethodDetails';
import { useErrorDialog } from '@/context/ErrorDialogContext';
import { usePosSaleContext } from '@/context/PosSaleContext';
import { usePosSettings } from '@/context/PosSettingsContext';
import { bankService, type BankAccount } from '@/services/api/bankService';
import { refundCardStorage } from '@/services/storage/refundCardStorage';
import { isInvalidHoldPinError } from '@/services/storage/holdPinStorage';
import { useSavedHoldPin } from '@/hooks/useSavedHoldPin';
import { bluetoothPrintService } from '@/services/bluetooth/bluetoothPrintService';
import { formatCurrency } from '@/utils/format';
import { cartLineKey, itemHasBatches } from '@/utils/batchUtils';
import {
  buildPaymentNotes,
  isOnlinePayment,
  needsBank,
  needsPaymentReference,
} from '@/utils/paymentMethod';
import type { CartLine, SaleReceiptPayload } from '@/types/sales';
import {
  colors,
  appInputStyle,
  appInputPlaceholderColor,
  typography,
  shadows,
} from '@/theme';
import type { SalesStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<SalesStackParamList, 'SaleOrder'>;

const round2 = (n: number) => Math.round(n * 100) / 100;

const parseDraftQty = (raw: string | undefined): number | null => {
  if (raw == null) {
    return null;
  }
  const trimmed = raw.trim().replace(/,/g, '');
  if (!trimmed || trimmed === '.') {
    return null;
  }
  const parsed = parseFloat(trimmed);
  return Number.isNaN(parsed) ? null : parsed;
};

export const SaleOrderScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const { showError } = useErrorDialog();
  const { currency, settings } = usePosSettings();
  const pos = usePosSaleContext();
  const { error: posError, setError: setPosError } = pos;

  const [customerModal, setCustomerModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState(pos.paymentMethod);
  const [amountReceived, setAmountReceived] = useState('');
  const [banks, setBanks] = useState<BankAccount[]>([]);
  const [bankId, setBankId] = useState<number | null>(null);
  const [chequeNumber, setChequeNumber] = useState('');
  const [printing, setPrinting] = useState(false);
  const [originalSaleId, setOriginalSaleId] = useState('');
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentCardLast4, setPaymentCardLast4] = useState('');
  const [refundCardLast4, setRefundCardLast4] = useState('');
  const [savedRefundCardLast4, setSavedRefundCardLast4] = useState<string | null>(null);
  const [refundCardReady, setRefundCardReady] = useState(false);
  const [holdPinDraft, setHoldPinDraft] = useState('');
  const { savedHoldPin, holdPinReady, saveHoldPin, clearHoldPin } = useSavedHoldPin();
  const [discountDraft, setDiscountDraft] = useState('0');
  const [discountMode, setDiscountMode] = useState<'percent' | 'amount'>('percent');
  const [holding, setHolding] = useState(false);
  const [qtyDrafts, setQtyDrafts] = useState<Record<string, string>>({});

  const productOffers = useMemo(
    () => pos.applicableOffers.filter(o => o.discount_type === 'product'),
    [pos.applicableOffers],
  );

  const orderOffers = useMemo(
    () => pos.applicableOffers.filter(o => o.discount_type === 'order'),
    [pos.applicableOffers],
  );

  const applyPosDiscount =
    pos.applyOrderDiscount ??
    ((type: 'percent' | 'amount', value: number) => {
      if (type === 'percent') {
        pos.setOrderDiscountType?.('percent');
        pos.setOrderDiscountInput?.(value);
      } else {
        pos.setOrderDiscount?.(value);
      }
    });

  const getEffectiveQty = useCallback(
    (line: CartLine): number => {
      const key = cartLineKey(line.item_id, line.item_batch_id);
      const parsed = parseDraftQty(qtyDrafts[key]);
      if (parsed !== null && parsed > 0) {
        return parsed;
      }
      return line.qty;
    },
    [qtyDrafts],
  );

  const getLineTotalPreview = useCallback(
    (line: CartLine): number => round2(getEffectiveQty(line) * line.unit_price),
    [getEffectiveQty],
  );

  const previewSubTotal = useMemo(
    () =>
      round2(
        pos.cart.reduce((sum, line) => sum + getLineTotalPreview(line), 0),
      ),
    [getLineTotalPreview, pos.cart],
  );

  const previewOrderTotal = useMemo(
    () => round2(Math.max(0, previewSubTotal - pos.discount - pos.offerDiscount)),
    [pos.discount, pos.offerDiscount, previewSubTotal],
  );

  const buildCheckoutCart = useCallback((): CartLine[] => {
    return pos.cart.map(line => {
      const key = cartLineKey(line.item_id, line.item_batch_id);
      const parsed = parseDraftQty(qtyDrafts[key]);
      const qty = parsed !== null && parsed > 0 ? parsed : line.qty;
      return {
        ...line,
        qty,
        line_total: round2(qty * line.unit_price),
      };
    });
  }, [pos.cart, qtyDrafts]);

  useEffect(() => {
    if (pos.activeHoldId) {
      setDiscountMode('amount');
      setDiscountDraft(String(pos.discount || 0));
    }
  }, [pos.activeHoldId, pos.discount]);

  useEffect(() => {
    if (posError) {
      if (isInvalidHoldPinError(posError)) {
        void clearHoldPin();
        setHoldPinDraft('');
      }
      showError({ title: 'Order', message: posError });
      setPosError(null);
    }
  }, [posError, setPosError, showError, clearHoldPin]);

  useEffect(() => {
    setPaymentMethod(pos.paymentMethod);
  }, [pos.paymentMethod]);

  useFocusEffect(
    useCallback(() => {
      if (
        !pos.isReturn &&
        pos.allowOffer &&
        pos.cart.length > 0 &&
        !pos.offerUserDisabled &&
        pos.selectedOfferId == null
      ) {
        void pos.reapplyAutoOffer();
      }
    }, [
      pos.allowOffer,
      pos.cart.length,
      pos.isReturn,
      pos.offerUserDisabled,
      pos.reapplyAutoOffer,
      pos.selectedOfferId,
    ]),
  );

  useEffect(() => {
    setAmountReceived(String(previewOrderTotal));
  }, [previewOrderTotal]);

  useEffect(() => {
    setQtyDrafts(prev => {
      const next: Record<string, string> = {};
      for (const line of pos.cart) {
        const key = cartLineKey(line.item_id, line.item_batch_id);
        const draft = prev[key];
        const parsed = parseDraftQty(draft);
        next[key] =
          draft != null && parsed !== null && parsed === line.qty
            ? draft
            : String(line.qty);
      }
      return next;
    });
  }, [pos.cart]);

  useEffect(() => {
    if (pos.returnSourceSale?.sales_id) {
      setOriginalSaleId(pos.returnSourceSale.sales_id);
    }
  }, [pos.returnSourceSale?.sales_id]);

  useEffect(() => {
    if (!pos.isReturn) {
      setRefundCardReady(true);
      return;
    }
    let active = true;
    refundCardStorage.get().then(saved => {
      if (!active) {
        return;
      }
      setSavedRefundCardLast4(saved);
      if (saved) {
        setRefundCardLast4(saved);
      }
      setRefundCardReady(true);
    });
    return () => {
      active = false;
    };
  }, [pos.isReturn]);

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

  const requiresHoldPin = useMemo(() => {
    const settings = pos.context?.order_settings as Record<string, unknown> | undefined;
    return (settings?.requires_hold_pin ?? true) !== false;
  }, [pos.context?.order_settings]);

  const completingHold = Boolean(pos.activeHoldId);
  const needsHoldPinEntry = completingHold && requiresHoldPin && !savedHoldPin;

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

  const commitLineQty = useCallback(
    (line: CartLine, raw: string) => {
      const key = cartLineKey(line.item_id, line.item_batch_id);
      const trimmed = raw.trim();
      if (!trimmed) {
        setQtyDrafts(prev => ({
          ...prev,
          [key]: String(line.qty),
        }));
        return;
      }
      const parsed = parseDraftQty(trimmed);
      if (parsed === null || parsed <= 0) {
        pos.removeFromCart(line.item_id, line.item_batch_id ?? null);
        return;
      }
      pos.updateCartQty(line.item_id, parsed, line.item_batch_id ?? null);
    },
    [pos],
  );

  const commitAllQtyDrafts = useCallback(() => {
    for (const line of pos.cart) {
      const key = cartLineKey(line.item_id, line.item_batch_id);
      commitLineQty(line, qtyDrafts[key] ?? String(line.qty));
    }
  }, [commitLineQty, pos.cart, qtyDrafts]);

  const applyDiscountDraft = useCallback(() => {
    const parsed = parseFloat(discountDraft.replace(/,/g, '')) || 0;
    if (discountMode === 'percent') {
      const pct = round2(Math.min(100, Math.max(0, parsed)));
      applyPosDiscount('percent', pct);
      setDiscountDraft(String(pct));
      return;
    }
    const next = round2(Math.max(0, parsed));
    if (next > previewSubTotal) {
      showError({
        title: 'Discount',
        message: 'Discount cannot be more than subtotal.',
        variant: 'warning',
      });
      applyPosDiscount('amount', previewSubTotal);
      setDiscountDraft(String(previewSubTotal));
      return;
    }
    applyPosDiscount('amount', next);
    setDiscountDraft(String(next));
  }, [
    applyPosDiscount,
    discountDraft,
    discountMode,
    previewSubTotal,
    showError,
  ]);

  const deliverReceipt = async (receipt: SaleReceiptPayload) => {
    const activeCustomer = pos.customer;
    const received = parseFloat(amountReceived.replace(/,/g, '')) || receipt.sale.net_amount;
    const receiptWithCustomerInfo: SaleReceiptPayload = {
      ...receipt,
      sale: {
        ...receipt.sale,
        payment_method: receipt.sale.payment_method ?? paymentMethod,
        amount_received:
          receipt.sale.amount_received ??
          (receipt.sale.is_hold ? 0 : received),
        customer_name:
          receipt.sale.customer_name ?? activeCustomer?.customer_name ?? null,
        customer_code:
          receipt.sale.customer_code ??
          activeCustomer?.customer_code ??
          activeCustomer?.customer_id ??
          null,
        customer_contact_no:
          receipt.sale.customer_contact_no ?? activeCustomer?.contact_no ?? null,
        customer_email:
          receipt.sale.customer_email ?? activeCustomer?.email ?? null,
        customer_location:
          receipt.sale.customer_location ?? activeCustomer?.location ?? null,
        customer_address:
          receipt.sale.customer_address ?? activeCustomer?.address ?? null,
        customer_tax_id:
          receipt.sale.customer_tax_id ?? activeCustomer?.tax_id ?? null,
      },
    };

    setPrinting(true);
    try {
      if (bluetoothPrintService.isSupported()) {
        await bluetoothPrintService.printReceipt(receiptWithCustomerInfo, currency, settings);
      }
    } catch (e) {
      showError({
        title: 'Print',
        message:
          e instanceof Error
            ? e.message
            : 'Could not print receipt. Set up your printer in Settings → Receipt printer.',
        variant: 'warning',
      });
    } finally {
      setPrinting(false);
    }

    navigation.replace('SaleReceipt', { receipt: receiptWithCustomerInfo });
  };

  const handlePay = async () => {
    applyDiscountDraft();
    const checkoutCart = buildCheckoutCart();
    commitAllQtyDrafts();

    if (!pos.isReturn && pos.cartHasStockIssuesFor(pos.prepareCheckout(checkoutCart).lines)) {
      showError({
        title: 'Stock issue',
        message: 'Remove or reduce out-of-stock items before payment.',
        variant: 'warning',
      });
      return;
    }

    const refundDigits = pos.isReturn
      ? (savedRefundCardLast4 ?? refundCardLast4).replace(/\D/g, '').slice(-4)
      : '';

    if (pos.isReturn && refundDigits.length !== 4) {
      showError({
        title: 'Refund card',
        message: 'Enter credit card last 4 digits once. They will be saved for future returns.',
        variant: 'warning',
      });
      return;
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

    if (!pos.isReturn && /cheque/i.test(paymentMethod) && !chequeNumber.trim()) {
      showError({
        title: 'Cheque',
        message: 'Enter the cheque number.',
        variant: 'warning',
      });
      return;
    }

    if (!pos.isReturn && needsBank(paymentMethod) && banks.length > 0 && !bankId) {
      showError({
        title: 'Bank',
        message: 'Select a bank account.',
        variant: 'warning',
      });
      return;
    }

    const holdPin =
      completingHold && requiresHoldPin
        ? (savedHoldPin ?? holdPinDraft.trim()) || null
        : null;

    if (completingHold && requiresHoldPin && !holdPin) {
      showError({
        title: 'Hold PIN',
        message: 'Enter hold PIN once — saved on this device for future hold actions.',
        variant: 'warning',
      });
      return;
    }

    const received = parseFloat(amountReceived) || previewOrderTotal;
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
      refund_card_last4: pos.isReturn ? refundDigits : null,
      hold_pin: holdPin,
      original_sale_id: pos.isReturn ? originalSaleId.trim() || null : null,
      cart: checkoutCart,
    });

    if (!result) {
      return;
    }

    if (completingHold && holdPin && !savedHoldPin) {
      await saveHoldPin(holdPin);
    }

    if (pos.isReturn && refundDigits.length === 4 && !savedRefundCardLast4) {
      await refundCardStorage.save(refundDigits);
      setSavedRefundCardLast4(refundDigits);
    }

    await deliverReceipt(result.receipt);
  };

  const handleHold = async () => {
    if (pos.isReturn || pos.activeHoldId) {
      return;
    }
    applyDiscountDraft();
    const checkoutCart = buildCheckoutCart();
    commitAllQtyDrafts();

    if (pos.cartHasStockIssuesFor(pos.prepareCheckout(checkoutCart).lines)) {
      showError({
        title: 'Stock issue',
        message: 'Remove or reduce out-of-stock items before holding.',
        variant: 'warning',
      });
      return;
    }

    setHolding(true);
    try {
      const result = await pos.holdSale(undefined, checkoutCart);
      if (!result) {
        return;
      }
      await deliverReceipt(result.receipt);
    } finally {
      setHolding(false);
    }
  };

  const showHoldFab = !pos.isReturn && !pos.activeHoldId;
  const scrollBottomPad = 16;

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
        title={
          pos.activeHoldSalesId
            ? `Complete hold ${pos.activeHoldSalesId}`
            : pos.isReturn
              ? 'Return order'
              : 'Your Order'
        }
        subtitle={`${pos.cart.length} item${pos.cart.length === 1 ? '' : 's'} · ${formatCurrency(previewOrderTotal, currency)}`}
        showBack
      />

      {pos.submitting || printing || holding ? (
        <LoadingOverlay
          message={
            printing
              ? 'Printing receipt…'
              : holding
                ? 'Saving hold order…'
                : pos.isReturn
                  ? 'Processing return…'
                  : pos.activeHoldId
                    ? 'Completing hold…'
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

          {pos.activeHoldSalesId ? (
            <Box
              bg={colors.warningSoft}
              borderRadius="$lg"
              px="$3"
              py="$2"
              mb="$3"
              borderWidth={1}
              borderColor={colors.warning}>
              <Text size="sm" color={colors.warning} fontWeight="$bold">
                Completing hold bill {pos.activeHoldSalesId}
              </Text>
              {savedHoldPin ? (
                <Text size="xs" color={colors.warning} mt="$1">
                  Hold PIN saved on this device
                </Text>
              ) : null}
            </Box>
          ) : null}

          {needsHoldPinEntry && holdPinReady ? (
            <>
              <Text style={styles.sectionTitle}>Hold PIN</Text>
              <Text style={styles.refundCardHint}>
                Enter once — saved on this device for delete and complete hold actions.
              </Text>
              <TextInput
                value={holdPinDraft}
                onChangeText={setHoldPinDraft}
                keyboardType="number-pad"
                secureTextEntry
                style={appInputStyle}
                placeholder="Hold PIN"
                placeholderTextColor={colors.textMuted}
                maxLength={20}
              />
            </>
          ) : null}

          <View style={styles.cartPanel}>
            <View style={styles.cartPanelHeader}>
              <Text style={styles.cartPanelTitle}>
                {pos.isReturn ? 'Items to return' : 'Cart'}
              </Text>
              <Text style={styles.cartPanelCount}>
                {pos.cart.length} line{pos.cart.length === 1 ? '' : 's'}
              </Text>
            </View>

            {!pos.isReturn && pos.allowOffer && pos.applicableOffers.length > 0 ? (
              <CartOffersSummary
                productOffers={productOffers}
                orderOffers={orderOffers}
                selectedOffer={pos.selectedOffer}
                subTotal={previewSubTotal}
                currency={currency}
                compact={pos.cart.length > 0}
              />
            ) : null}

            {pos.cart.length > 0 ? (
              <View style={styles.tableHead}>
                <Text style={[styles.tableHeadCell, styles.tableHeadProduct]}>Product</Text>
                <Text style={[styles.tableHeadCell, styles.tableHeadPrice]}>Price</Text>
                <Text style={[styles.tableHeadCell, styles.tableHeadTotal]}>Total</Text>
              </View>
            ) : null}

            {pos.cart.map(line => {
              const lineKey = cartLineKey(line.item_id, line.item_batch_id);
              const item = itemStockMap.get(line.item_id);
              const stock = item?.qty ?? 0;
              const outOfStock =
                !pos.isReturn && !pos.allowNegativeInventory && stock <= 0;
              const maxReturn = pos.isReturn
                ? pos.getMaxReturnQty(line.item_id, line.item_batch_id ?? null)
                : undefined;
              const lineTotalPreview = getLineTotalPreview(line);
              const offerLineDiscount = pos.getOfferLineDiscount(
                line.item_id,
                line.item_batch_id ?? null,
              );

              return (
                <SaleOrderLineRow
                  key={lineKey}
                  line={line}
                  item={item}
                  currency={currency}
                  qtyDraft={qtyDrafts[lineKey] ?? String(line.qty)}
                  lineTotal={lineTotalPreview}
                  offerDiscount={offerLineDiscount}
                  isReturn={pos.isReturn}
                  allowNegativeInventory={pos.allowNegativeInventory}
                  maxReturn={maxReturn}
                  outOfStock={outOfStock}
                  showBatchInfo={Boolean(item && itemHasBatches(item))}
                  onQtyDraftChange={text => {
                    const sanitized = text.replace(/[^0-9.,]/g, '');
                    setQtyDrafts(prev => ({ ...prev, [lineKey]: sanitized }));
                  }}
                  onCommitQty={() =>
                    commitLineQty(line, qtyDrafts[lineKey] ?? String(line.qty))
                  }
                  onDecrement={() =>
                    pos.decrementCartQty(line.item_id, line.item_batch_id ?? null)
                  }
                  onIncrement={() => {
                    const parsed = parseDraftQty(qtyDrafts[lineKey]);
                    const current = parsed !== null && parsed > 0 ? parsed : line.qty;
                    pos.updateCartQty(
                      line.item_id,
                      current + 1,
                      line.item_batch_id ?? null,
                    );
                  }}
                  onRemove={() =>
                    pos.removeFromCart(line.item_id, line.item_batch_id ?? null)
                  }
                />
              );
            })}
          </View>

          {!pos.isReturn && pos.allowOffer && pos.applicableOffers.length > 0 ? (
            <>
              <Text style={styles.sectionTitle}>Offers (auto)</Text>
              {pos.selectedOffer ? (
                <Text style={styles.discountHint}>
                  Applied: {pos.selectedOffer.name}
                  {' · '}
                  {pos.selectedOffer.discount_summary ??
                    (pos.selectedOffer.discount_type === 'order'
                      ? 'Order offer'
                      : `${pos.selectedOffer.item_count} product(s)`)}
                  {pos.offerPreviewLoading ? ' · Calculating…' : ''}
                  {pos.offerDiscount > 0
                    ? ` · -${formatCurrency(pos.offerDiscount, currency)}`
                    : ''}
                </Text>
              ) : (
                <Text style={styles.discountHint}>
                  Product and order offers apply automatically when items or order total qualify.
                </Text>
              )}
              <FilterChips
                options={['Auto', 'No offer', ...pos.applicableOffers.map(o => o.name)]}
                selected={
                  pos.offerUserDisabled
                    ? 'No offer'
                    : pos.selectedOffer
                      ? pos.selectedOffer.name
                      : 'Auto'
                }
                onSelect={value => {
                  if (value === 'Auto') {
                    pos.reapplyAutoOffer();
                    return;
                  }
                  if (value === 'No offer') {
                    pos.clearOffer();
                    return;
                  }
                  const offer = pos.applicableOffers.find(o => o.name === value);
                  pos.selectOffer(offer ?? null);
                }}
                showAllOption={false}
              />
              {pos.selectedOffer?.requires_promo_code ? (
                <TextInput
                  value={pos.offerPromoCode}
                  onChangeText={text => pos.setOfferPromoCode(text.toUpperCase())}
                  style={appInputStyle}
                  placeholder="Promo code required"
                  placeholderTextColor={colors.textMuted}
                  autoCapitalize="characters"
                />
              ) : null}
              {pos.offerPreviewError ? (
                <Text style={[styles.discountHint, { color: colors.error }]}>
                  {pos.offerPreviewError}
                </Text>
              ) : null}
            </>
          ) : null}

          {!pos.isReturn && pos.allowOrderDiscount ? (
            <>
              <Text style={styles.sectionTitle}>Manual discount</Text>
              <FilterChips
                options={['Percent', 'Amount']}
                selected={discountMode === 'percent' ? 'Percent' : 'Amount'}
                onSelect={value => {
                  const nextMode = value === 'Percent' ? 'percent' : 'amount';
                  if (nextMode === discountMode) {
                    return;
                  }
                  if (nextMode === 'percent' && previewSubTotal > 0) {
                    const pct = round2((pos.discount / previewSubTotal) * 100);
                    setDiscountMode('percent');
                    setDiscountDraft(String(pct));
                    applyPosDiscount('percent', pct);
                  } else {
                    setDiscountMode('amount');
                    setDiscountDraft(String(pos.discount));
                    applyPosDiscount('amount', pos.discount);
                  }
                }}
                showAllOption={false}
              />
              <TextInput
                value={discountDraft}
                onChangeText={text => setDiscountDraft(text.replace(/[^0-9.,]/g, ''))}
                onBlur={applyDiscountDraft}
                onSubmitEditing={applyDiscountDraft}
                keyboardType="decimal-pad"
                style={appInputStyle}
                placeholder={discountMode === 'percent' ? '10' : '0.00'}
                placeholderTextColor={colors.textMuted}
              />
              <Text style={styles.discountHint}>
                {discountMode === 'percent'
                  ? `${pos.discountPercent ?? 0}% = -${formatCurrency(pos.discount, currency)}`
                  : 'Fixed amount off subtotal (in addition to offers)'}
              </Text>
            </>
          ) : null}

          <View style={styles.totalBox}>
            <HStack justifyContent="space-between" mb="$1">
              <Text fontWeight="$semibold" color={colors.textSecondary}>
                Subtotal
              </Text>
              <Text fontWeight="$semibold" color={colors.text}>
                {formatCurrency(previewSubTotal, currency)}
              </Text>
            </HStack>
            {!pos.isReturn && pos.offerDiscount > 0 ? (
              <HStack justifyContent="space-between" mb="$1">
                <Text fontWeight="$semibold" color={colors.textSecondary}>
                  Offer discount
                </Text>
                <Text fontWeight="$semibold" color={colors.success}>
                  -{formatCurrency(pos.offerDiscount, currency)}
                </Text>
              </HStack>
            ) : null}
            {!pos.isReturn && pos.discount > 0 ? (
              <HStack justifyContent="space-between" mb="$1">
                <Text fontWeight="$semibold" color={colors.textSecondary}>
                  Manual discount
                  {discountMode === 'percent'
                    ? ` (${pos.discountPercent ?? 0}%)`
                    : ''}
                </Text>
                <Text fontWeight="$semibold" color={colors.warning}>
                  -{formatCurrency(pos.discount, currency)}
                </Text>
              </HStack>
            ) : null}
            <HStack justifyContent="space-between">
              <Text fontWeight="$semibold" color={colors.textSecondary}>
                {pos.discount > 0 || pos.offerDiscount > 0 ? 'Balance' : 'Total'}
              </Text>
              <Text
                fontSize="$xl"
                fontWeight="$bold"
                color={pos.isReturn ? colors.error : colors.primary}>
                {formatCurrency(previewOrderTotal, currency)}
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
              {refundCardReady && !savedRefundCardLast4 ? (
                <>
                  <Text style={styles.sectionTitle}>Refund card last 4 digits</Text>
                  <Text style={styles.refundCardHint}>
                    Enter once — saved on this device for all future returns.
                  </Text>
                  <TextInput
                    value={refundCardLast4}
                    onChangeText={t => setRefundCardLast4(t.replace(/\D/g, '').slice(0, 4))}
                    keyboardType="number-pad"
                    maxLength={4}
                    style={appInputStyle}
                    placeholder="••••"
                    placeholderTextColor={colors.textMuted}
                  />
                </>
              ) : null}
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
            onSelect={method => {
              setPaymentMethod(method);
              pos.setPaymentMethod(method);
            }}
          />

          <PaymentMethodDetails
            paymentMethod={paymentMethod}
            isReturn={pos.isReturn}
            netAmount={previewOrderTotal}
            currency={currency}
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
        </SmoothScrollView>

        <OrderCheckoutFooter
          total={previewOrderTotal}
          currency={currency}
          paymentMethod={paymentMethod}
          showHold={showHoldFab}
          isReturn={pos.isReturn}
          onHold={showHoldFab ? handleHold : undefined}
          onPay={handlePay}
          holdLoading={holding}
          payLoading={pos.submitting || printing}
          disabled={pos.submitting || printing || holding || pos.cart.length === 0}
        />
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
        footerActionLabel="+ New customer"
        onFooterAction={() => {
          setCustomerModal(false);
          navigation.navigate('CustomerForm', { selectOnSave: true });
        }}
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
  qtyHint: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: 8,
    marginTop: -4,
  },
  cartPanel: {
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    marginBottom: 12,
    ...shadows.sm,
  },
  cartPanelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  cartPanelTitle: {
    ...typography.label,
    color: colors.text,
    fontWeight: '700',
  },
  cartPanelCount: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: '600',
  },
  tableHead: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 4,
    marginBottom: 4,
    backgroundColor: colors.backgroundAlt,
    borderRadius: 6,
  },
  tableHeadCell: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
  },
  tableHeadProduct: {
    flex: 1,
  },
  tableHeadPrice: {
    width: 72,
    textAlign: 'right',
  },
  tableHeadTotal: {
    width: 72,
    textAlign: 'right',
    marginLeft: 8,
  },
  refundCardHint: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: -6,
    marginBottom: 8,
  },
  discountHint: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 6,
    marginBottom: 4,
  },
  totalBox: {
    marginTop: 4,
    marginBottom: 20,
    padding: 16,
    borderRadius: 12,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.sm,
  },
  inputReadOnly: {
    backgroundColor: colors.backgroundAlt,
    color: colors.textSecondary,
  },
});
