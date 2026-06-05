import React, { useEffect, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { SmoothScrollView } from '@/components/common/SmoothScrollView';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Box, HStack, Pressable, Text, VStack } from '@gluestack-ui/themed';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ChevronRight, Minus, Plus, Trash2, User } from 'lucide-react-native';
import { ScreenContainer } from '@/components/common/ScreenContainer';
import { AppHeader } from '@/components/common/AppHeader';
import { FilterChips } from '@/components/common/FilterChips';
import { LoadingOverlay } from '@/components/common/LoadingOverlay';
import { SelectionModal } from '@/components/common/SelectionModal';
import { PrimaryButton } from '@/components/buttons/PrimaryButton';
import { PaymentMethodPicker } from '@/components/sales/PaymentMethodPicker';
import { PaymentMethodDetails } from '@/components/sales/PaymentMethodDetails';
import { useErrorDialog } from '@/context/ErrorDialogContext';
import { usePurchaseCreateContext } from '@/context/PurchaseCreateContext';
import { usePosSettings } from '@/context/PosSettingsContext';
import { bankService, type BankAccount } from '@/services/api/bankService';
import { bluetoothPrintService } from '@/services/bluetooth/bluetoothPrintService';
import { WALK_IN_SUPPLIER } from '@/services/api/supplierService';
import { formatCurrency } from '@/utils/format';
import {
  buildPaymentNotes,
  isOnlinePayment,
  needsBank,
  needsPaymentReference,
} from '@/utils/paymentMethod';
import { colors, shadows, TAB_BAR_BOTTOM_MARGIN, typography } from '@/theme';
import type { ProductsStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<ProductsStackParamList, 'PurchaseOrder'>;

export const PurchaseOrderScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const { showError } = useErrorDialog();
  const { currency, settings } = usePosSettings();
  const purchase = usePurchaseCreateContext();

  const [supplierModal, setSupplierModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [amountReceived, setAmountReceived] = useState('');
  const [banks, setBanks] = useState<BankAccount[]>([]);
  const [bankId, setBankId] = useState<number | null>(null);
  const [chequeNumber, setChequeNumber] = useState('');
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentCardLast4, setPaymentCardLast4] = useState('');
  const [printing, setPrinting] = useState(false);

  const locationOptions = useMemo(
    () =>
      purchase.locations.length > 0
        ? purchase.locations
        : ['Main Location'],
    [purchase.locations],
  );

  const activeLocation =
    purchase.location && locationOptions.includes(purchase.location)
      ? purchase.location
      : locationOptions[0];

  useEffect(() => {
    if (purchase.error) {
      showError({ title: 'Purchase', message: purchase.error });
      purchase.setError(null);
    }
  }, [purchase.error, purchase.setError, showError]);

  useEffect(() => {
    setAmountReceived(String(purchase.netAmount));
  }, [purchase.netAmount]);

  useEffect(() => {
    if (/^cash$/i.test(paymentMethod)) {
      setAmountReceived(String(purchase.netAmount));
    }
  }, [paymentMethod, purchase.netAmount]);

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

  const supplierOptions = useMemo(
    () => [
      {
        id: 'walk-in',
        label: WALK_IN_SUPPLIER.supplier_name,
        subtitle: 'Default · cash & quick purchases',
      },
      ...purchase.suppliers.map(s => ({
        id: String(s.id),
        label: s.supplier_name,
        subtitle: s.contact_no ?? undefined,
      })),
    ],
    [purchase.suppliers],
  );

  const handleSave = async () => {
    if (!purchase.supplier?.supplier_name?.trim()) {
      showError({
        title: 'Supplier',
        message: 'Select a supplier before saving.',
        variant: 'warning',
      });
      return;
    }
    if (/cheque/i.test(paymentMethod) && !chequeNumber.trim()) {
      showError({
        title: 'Cheque',
        message: 'Enter cheque number.',
        variant: 'warning',
      });
      return;
    }
    if (needsBank(paymentMethod) && banks.length > 0 && !bankId) {
      showError({
        title: 'Bank',
        message: 'Select a bank account.',
        variant: 'warning',
      });
      return;
    }
    if (needsPaymentReference(paymentMethod) && !paymentReference.trim()) {
      showError({
        title: isOnlinePayment(paymentMethod) ? 'Online payment' : 'Bank transfer',
        message: isOnlinePayment(paymentMethod)
          ? 'Enter the transaction or approval ID.'
          : 'Enter the transfer reference number.',
        variant: 'warning',
      });
      return;
    }

    const received = parseFloat(amountReceived) || purchase.netAmount;
    const paymentNotes = buildPaymentNotes(paymentMethod, {
      reference: paymentReference,
      cardLast4: paymentCardLast4,
    });

    const result = await purchase.completePurchase(
      {
        payment_method: paymentMethod,
        amount_received: received,
        bank_id: needsBank(paymentMethod) ? bankId : null,
        cheque_number: /cheque/i.test(paymentMethod)
          ? chequeNumber.trim() || undefined
          : undefined,
        notes: paymentNotes,
      },
      activeLocation,
      settings,
    );

    if (!result) {
      return;
    }

    setPrinting(true);
    try {
      if (bluetoothPrintService.isSupported()) {
        await bluetoothPrintService.printReceipt(result.receipt, currency, settings);
      }
    } catch (e) {
      showError({
        title: 'Print',
        message:
          e instanceof Error
            ? e.message
            : 'Could not print bill. Set up your printer in Settings → Receipt printer.',
        variant: 'warning',
      });
    } finally {
      setPrinting(false);
    }

    navigation.replace('PurchaseReceipt', { receipt: result.receipt });
  };

  if (purchase.cart.length === 0 && !purchase.submitting) {
    return (
      <ScreenContainer>
        <AppHeader title="Purchase order" showBack />
        <Box flex={1} alignItems="center" justifyContent="center" px="$6">
          <Text color={colors.textMuted} textAlign="center" mb="$4">
            No items selected. Go back and add products.
          </Text>
          <PrimaryButton label="Back to products" onPress={() => navigation.goBack()} />
        </Box>
      </ScreenContainer>
    );
  }

  // Tab bar is hidden on this screen, so keep footer close to safe area only.
  const tabBarClearance = Math.max(insets.bottom, TAB_BAR_BOTTOM_MARGIN);
  const footerHeight = 92;
  const bottomPad = tabBarClearance + footerHeight + 16;

  return (
    <ScreenContainer>
      <AppHeader
        title="Purchase order"
        subtitle={`#${purchase.invoiceId} · ${purchase.cart.length} item${purchase.cart.length === 1 ? '' : 's'}`}
        showBack
      />

      {purchase.submitting || printing ? (
        <LoadingOverlay
          message={
            printing
              ? 'Printing bill…'
              : 'Saving purchase…'
          }
        />
      ) : null}

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}>
        <SmoothScrollView
          style={styles.flex}
          contentContainerStyle={styles.scroll}
          contentPaddingBottom={bottomPad}>
          <Text style={styles.sectionTitle}>Stock location</Text>
          <FilterChips
            label=""
            options={locationOptions}
            selected={activeLocation}
            onSelect={loc => purchase.setLocation(loc)}
            showAllOption={false}
          />

          <Text style={styles.sectionTitle}>Supplier</Text>
          <Pressable
            onPress={() => setSupplierModal(true)}
            borderWidth={1}
            borderColor={colors.primaryMuted}
            borderRadius="$xl"
            px="$3"
            py="$3"
            bg={colors.white}
            flexDirection="row"
            alignItems="center"
            justifyContent="space-between"
            mb="$4"
            style={shadows.sm}>
            <HStack alignItems="center" gap="$2" flex={1}>
              <Box bg={colors.primarySoft} p="$1.5" borderRadius="$full">
                <User size={16} color={colors.primary} />
              </Box>
              <Text size="sm" fontWeight="$semibold" color={colors.text} numberOfLines={1}>
                {purchase.supplier?.supplier_name ?? 'Select supplier *'}
              </Text>
            </HStack>
            <ChevronRight size={16} color={colors.primaryLight} />
          </Pressable>

          <Text style={styles.sectionTitle}>Items ({purchase.cart.length})</Text>
          {purchase.cart.map(line => (
            <Box key={line.item_id} style={styles.lineCard}>
              <HStack justifyContent="space-between" alignItems="flex-start" mb="$2">
                <VStack flex={1} pr="$2">
                  <Text size="sm" fontWeight="$bold" color={colors.text} numberOfLines={2}>
                    {line.description}
                  </Text>
                  <Text size="xs" color={colors.textMuted} mt="$0.5">
                    {line.item_number} · {formatCurrency(line.unit_price, currency)} each
                  </Text>
                </VStack>
                <Text size="sm" fontWeight="$bold" color={colors.primary}>
                  {formatCurrency(line.line_total, currency)}
                </Text>
              </HStack>
              <HStack alignItems="center" justifyContent="space-between">
                <Text size="xs" color={colors.textSecondary} fontWeight="$semibold">
                  Quantity
                </Text>
                <HStack alignItems="center" gap="$2">
                  <TouchableOpacity
                    onPress={() => purchase.decrementCartQty(line.item_id)}
                    style={styles.qtyBtn}>
                    <Minus size={14} color={colors.textSecondary} />
                  </TouchableOpacity>
                  <Text fontWeight="$bold" minWidth={24} textAlign="center">
                    {line.qty}
                  </Text>
                  <TouchableOpacity
                    onPress={() => purchase.updateCartQty(line.item_id, line.qty + 1)}
                    style={styles.qtyBtn}>
                    <Plus size={14} color={colors.textSecondary} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => purchase.removeFromCart(line.item_id)}
                    hitSlop={8}
                    style={styles.removeBtn}>
                    <Trash2 size={16} color={colors.error} />
                  </TouchableOpacity>
                </HStack>
              </HStack>
            </Box>
          ))}

          <View style={styles.totalBox}>
            <HStack justifyContent="space-between" alignItems="center">
              <Text fontWeight="$semibold" color={colors.textSecondary}>
                Total
              </Text>
              <Text fontSize="$xl" fontWeight="$bold" color={colors.primary}>
                {formatCurrency(purchase.netAmount, currency)}
              </Text>
            </HStack>
          </View>

          <Text style={styles.sectionTitle}>Payment</Text>
          <PaymentMethodPicker
            methods={purchase.paymentMethods}
            selected={paymentMethod}
            onSelect={setPaymentMethod}
            title="Payment method"
          />

          <PaymentMethodDetails
            paymentMethod={paymentMethod}
            isReturn={false}
            netAmount={purchase.netAmount}
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

        <View
          style={[
            styles.footer,
            { bottom: tabBarClearance, paddingBottom: 12 },
            shadows.lg,
          ]}>
          <HStack justifyContent="space-between" alignItems="center" mb="$2" px="$1">
            <Text size="sm" color={colors.textSecondary} fontWeight="$semibold">
              Total due
            </Text>
            <Text size="lg" fontWeight="$bold" color={colors.primary}>
              {formatCurrency(purchase.netAmount, currency)}
            </Text>
          </HStack>
          <PrimaryButton
            label={printing ? 'Printing…' : 'Save & Pay'}
            onPress={handleSave}
            loading={purchase.submitting || printing}
            disabled={purchase.submitting || printing}
          />
        </View>
      </KeyboardAvoidingView>

      <SelectionModal
        visible={supplierModal}
        title="Select supplier"
        options={supplierOptions}
        onSelect={opt => {
          if (opt.id === 'walk-in') {
            purchase.setSupplier(WALK_IN_SUPPLIER);
          } else {
            const s = purchase.suppliers.find(x => String(x.id) === opt.id);
            if (s) {
              purchase.setSupplier(s);
            }
          }
          setSupplierModal(false);
        }}
        onClose={() => setSupplierModal(false)}
        emptyMessage="Only Walk-in Supplier is available. Add suppliers in desktop POS."
      />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  scroll: {
    padding: 16,
    paddingTop: 8,
  },
  sectionTitle: {
    ...typography.label,
    color: colors.textSecondary,
    marginBottom: 10,
    marginTop: 8,
  },
  lineCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: 12,
    marginBottom: 10,
  },
  qtyBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeBtn: {
    marginLeft: 4,
    padding: 4,
  },
  totalBox: {
    marginTop: 4,
    marginBottom: 16,
    padding: 14,
    borderRadius: 12,
    backgroundColor: colors.surfaceElevated,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
});
