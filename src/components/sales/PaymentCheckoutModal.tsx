import React, { useEffect, useState } from 'react';
import { Modal, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { SmoothScrollView } from '@/components/common/SmoothScrollView';
import { Box, Text } from '@gluestack-ui/themed';
import { X } from 'lucide-react-native';
import { PrimaryButton } from '@/components/buttons/PrimaryButton';
import { FilterChips } from '@/components/common/FilterChips';
import { bankService, type BankAccount } from '@/services/api/bankService';
import { formatCurrency } from '@/utils/format';
import { colors, appInputStyle, typography } from '@/theme';
import type { SalePaymentDetails } from '@/types/sales';
import {
  acceptsCardLast4,
  buildPaymentNotes,
  isOnlinePayment,
  locksAmountReceived,
  needsBank,
  needsPaymentReference,
} from '@/utils/paymentMethod';

interface PaymentCheckoutModalProps {
  visible: boolean;
  total: number;
  currency?: string;
  paymentMethods: string[];
  initialMethod?: string;
  onClose: () => void;
  onConfirm: (details: SalePaymentDetails) => void;
}

export const PaymentCheckoutModal: React.FC<PaymentCheckoutModalProps> = ({
  visible,
  total,
  currency,
  paymentMethods,
  initialMethod = 'Cash',
  onClose,
  onConfirm,
}) => {
  const [method, setMethod] = useState(initialMethod);
  const [amountReceived, setAmountReceived] = useState('');
  const [banks, setBanks] = useState<BankAccount[]>([]);
  const [bankId, setBankId] = useState<number | null>(null);
  const [chequeNumber, setChequeNumber] = useState('');
  const [reference, setReference] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [loadingBanks, setLoadingBanks] = useState(false);

  useEffect(() => {
    if (!visible) {
      return;
    }
    setMethod(initialMethod);
    setAmountReceived(String(total));
    setChequeNumber('');
    setReference('');
    setCardNumber('');
    setBankId(null);
  }, [visible, initialMethod, total]);

  useEffect(() => {
    if (locksAmountReceived(method)) {
      setAmountReceived(String(total));
    }
    if (!needsPaymentReference(method)) {
      setReference('');
    }
    if (!acceptsCardLast4(method)) {
      setCardNumber('');
    }
  }, [method, total]);

  useEffect(() => {
    if (!visible || !needsBank(method)) {
      return;
    }
    setLoadingBanks(true);
    bankService
      .list()
      .then(list => {
        setBanks(list);
        if (list.length > 0 && !bankId) {
          setBankId(list[0].id);
        }
      })
      .catch(() => setBanks([]))
      .finally(() => setLoadingBanks(false));
  }, [visible, method, bankId]);

  const handleConfirm = () => {
    if (isOnlinePayment(method) && !reference.trim()) {
      return;
    }
    if (/bank transfer/i.test(method) && !/cheque/i.test(method) && !reference.trim()) {
      return;
    }

    const received = parseFloat(amountReceived) || total;
    const digits = cardNumber.replace(/\D/g, '').slice(-4);

    onConfirm({
      payment_method: method,
      amount_received: received,
      bank_id: needsBank(method) ? bankId : null,
      cheque_number: /cheque/i.test(method) ? chequeNumber.trim() || undefined : undefined,
      notes: buildPaymentNotes(method, {
        reference,
        cardLast4: digits,
      }),
    });
  };

  const showBank = needsBank(method);
  const showOnline = isOnlinePayment(method);
  const showCard = acceptsCardLast4(method) && !showOnline;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Box bg={colors.white} borderTopLeftRadius={20} borderTopRightRadius={20} maxHeight="88%">
          <Box
            flexDirection="row"
            justifyContent="space-between"
            alignItems="center"
            px="$4"
            py="$3"
            borderBottomWidth={1}
            borderColor={colors.border}>
            <Text size="lg" fontWeight="$bold">
              Payment
            </Text>
            <TouchableOpacity onPress={onClose} hitSlop={12}>
              <X size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </Box>

          <SmoothScrollView contentContainerStyle={styles.body} contentPaddingBottom={32}>
            <Text textAlign="center" size="2xl" fontWeight="$bold" color={colors.primary}>
              {formatCurrency(total, currency)}
            </Text>
            <Text textAlign="center" size="sm" color={colors.textMuted} mb="$3">
              Amount due
            </Text>

            <FilterChips
              label="Payment method"
              options={paymentMethods}
              selected={method}
              onSelect={setMethod}
              showAllOption={false}
            />

            <Text style={styles.label}>Amount received</Text>
            <TextInput
              value={amountReceived}
              onChangeText={setAmountReceived}
              keyboardType="decimal-pad"
              style={styles.input}
              editable={!locksAmountReceived(method)}
            />

            {showBank ? (
              <>
                <Text style={styles.label}>Bank account</Text>
                {loadingBanks ? (
                  <Text color={colors.textMuted}>Loading banks…</Text>
                ) : banks.length === 0 ? (
                  <Text color={colors.error} size="sm">
                    No banks configured. Add banks in desktop POS settings.
                  </Text>
                ) : (
                  banks.map(b => (
                    <TouchableOpacity
                      key={b.id}
                      style={[
                        styles.bankRow,
                        bankId === b.id && styles.bankRowActive,
                      ]}
                      onPress={() => setBankId(b.id)}>
                      <Text fontWeight="$semibold">{b.name}</Text>
                      <Text size="xs" color={colors.textMuted}>
                        {b.bank_code}
                        {b.address ? ` · ${b.address}` : ''}
                      </Text>
                    </TouchableOpacity>
                  ))
                )}
                {/cheque/i.test(method) ? (
                  <>
                    <Text style={styles.label}>Cheque number</Text>
                    <TextInput
                      value={chequeNumber}
                      onChangeText={setChequeNumber}
                      style={styles.input}
                      placeholder="Enter cheque number"
                    />
                  </>
                ) : (
                  <>
                    <Text style={styles.label}>Transfer reference</Text>
                    <TextInput
                      value={reference}
                      onChangeText={setReference}
                      style={styles.input}
                      placeholder="Reference / transaction ID"
                    />
                  </>
                )}
              </>
            ) : null}

            {showOnline ? (
              <>
                <Text style={styles.label}>Transaction / approval ID</Text>
                <TextInput
                  value={reference}
                  onChangeText={setReference}
                  style={styles.input}
                  placeholder="Gateway ref, UPI ID, approval code"
                  autoCapitalize="characters"
                />
                <Text style={styles.label}>Card last 4 (optional)</Text>
                <TextInput
                  value={cardNumber}
                  onChangeText={t => setCardNumber(t.replace(/\D/g, '').slice(0, 4))}
                  style={styles.input}
                  keyboardType="number-pad"
                  placeholder="••••"
                  maxLength={4}
                />
              </>
            ) : null}

            {showCard ? (
              <>
                <Text style={styles.label}>Card last 4 digits (optional)</Text>
                <TextInput
                  value={cardNumber}
                  onChangeText={t => setCardNumber(t.replace(/\D/g, '').slice(0, 4))}
                  style={styles.input}
                  keyboardType="number-pad"
                  placeholder="••••"
                  maxLength={4}
                />
              </>
            ) : null}

            <PrimaryButton
              label="Confirm & complete sale"
              onPress={handleConfirm}
              disabled={
                (showOnline && !reference.trim()) ||
                (/bank transfer/i.test(method) &&
                  !/cheque/i.test(method) &&
                  !reference.trim())
              }
            />
          </SmoothScrollView>
        </Box>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  body: {
    padding: 16,
    paddingBottom: 32,
  },
  label: {
    ...typography.label,
    color: colors.textSecondary,
    marginTop: 12,
    marginBottom: 6,
  },
  input: appInputStyle,
  bankRow: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  bankRowActive: {
    borderColor: colors.primary,
    backgroundColor: colors.pastelBlueSoft,
  },
});
