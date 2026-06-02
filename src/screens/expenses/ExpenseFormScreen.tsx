import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  TextInput,
  TouchableWithoutFeedback,
  Keyboard,
  StyleSheet,
} from 'react-native';
import { SmoothScrollView } from '@/components/common/SmoothScrollView';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Box, Text, VStack } from '@gluestack-ui/themed';
import { ScreenContainer } from '@/components/common/ScreenContainer';
import { AppHeader } from '@/components/common/AppHeader';
import { FilterChips } from '@/components/common/FilterChips';
import { PrimaryButton } from '@/components/buttons/PrimaryButton';
import { LoadingOverlay } from '@/components/common/LoadingOverlay';
import { useErrorDialog } from '@/context/ErrorDialogContext';
import { expenseService } from '@/services/api/expenseService';
import {
  colors,
  typography,
  appInputStyle,
  appInputPlaceholderColor,
} from '@/theme';
import type { HomeStackParamList } from '@/navigation/types';
import type { ExpensePayload } from '@/types/expenses';

type Nav = NativeStackNavigationProp<HomeStackParamList, 'ExpenseForm'>;
type Route = RouteProp<HomeStackParamList, 'ExpenseForm'>;

const Label: React.FC<{ children: string }> = ({ children }) => (
  <Text style={[typography.label, { color: colors.textSecondary, marginBottom: 6, marginTop: 12 }]}>
    {children}
  </Text>
);

export const ExpenseFormScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const insets = useSafeAreaInsets();
  const { showError, showErrorFromUnknown, showConfirm } = useErrorDialog();
  const expenseId = route.params?.expenseId;

  const [loading, setLoading] = useState(!!expenseId);
  const [submitting, setSubmitting] = useState(false);
  const [referenceNo, setReferenceNo] = useState('');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().slice(0, 10));
  const [location, setLocation] = useState('Main Location');
  const [category, setCategory] = useState('Other');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [discount, setDiscount] = useState('0');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [status, setStatus] = useState('Approved');
  const [notes, setNotes] = useState('');
  const [locations, setLocations] = useState<string[]>(['Main Location']);
  const [categories, setCategories] = useState<string[]>(['Other']);
  const [statuses, setStatuses] = useState<string[]>(['Approved', 'Pending', 'Rejected']);
  const [paymentMethods, setPaymentMethods] = useState<string[]>(['Cash']);

  useEffect(() => {
    (async () => {
      try {
        const list = await expenseService.list();
        setLocations(list.filters.locations.length ? list.filters.locations : ['Main Location']);
        setCategories(list.filters.categories.length ? list.filters.categories : ['Other']);
        setStatuses(list.filters.statuses.length ? list.filters.statuses : ['Approved', 'Pending', 'Rejected']);
        setPaymentMethods(list.filters.payment_methods.length ? list.filters.payment_methods : ['Cash']);

        if (expenseId) {
          const expense = await expenseService.get(expenseId);
          setReferenceNo(expense.reference_no);
          setExpenseDate(expense.expense_date);
          setLocation(expense.location || 'Main Location');
          setCategory(expense.category);
          setDescription(expense.description);
          setAmount(String(expense.amount));
          setDiscount(String(expense.discount ?? 0));
          setPaymentMethod(expense.payment_method || 'Cash');
          setStatus(expense.status || 'Approved');
          setNotes(expense.notes ?? '');
        } else {
          const ref = await expenseService.getNextReferenceNo();
          setReferenceNo(ref);
          const loc =
            list.filters.locations.find(l => l === 'Main Location') ??
            list.filters.locations[0] ??
            'Main Location';
          setLocation(loc);
          const cat = list.filters.categories[0] ?? 'Other';
          setCategory(cat);
        }
      } catch (e) {
        showErrorFromUnknown(e, 'Expense');
      } finally {
        setLoading(false);
      }
    })();
  }, [expenseId, showErrorFromUnknown]);

  const buildPayload = (): ExpensePayload | null => {
    const amt = parseFloat(amount);
    if (!description.trim()) {
      showError({ title: 'Validation', message: 'Description is required.', variant: 'warning' });
      return null;
    }
    if (!Number.isFinite(amt) || amt < 0.01) {
      showError({ title: 'Validation', message: 'Enter a valid amount.', variant: 'warning' });
      return null;
    }
    if (!referenceNo.trim()) {
      showError({ title: 'Validation', message: 'Reference number is required.', variant: 'warning' });
      return null;
    }
    return {
      reference_no: referenceNo.trim(),
      expense_date: expenseDate,
      location,
      category,
      description: description.trim(),
      amount: amt,
      discount: parseFloat(discount) || 0,
      payment_method: paymentMethod,
      status,
      notes: notes.trim() || null,
    };
  };

  const handleSave = async () => {
    const payload = buildPayload();
    if (!payload) return;

    setSubmitting(true);
    try {
      if (expenseId) {
        await expenseService.update(expenseId, payload);
      } else {
        await expenseService.create(payload);
      }
      navigation.goBack();
    } catch (e) {
      showErrorFromUnknown(e, 'Save expense');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = () => {
    if (!expenseId) return;
    showConfirm({
      title: 'Delete expense?',
      message: 'This cannot be undone.',
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
      onConfirm: async () => {
        setSubmitting(true);
        try {
          await expenseService.remove(expenseId);
          navigation.goBack();
        } catch (e) {
          showErrorFromUnknown(e, 'Delete expense');
        } finally {
          setSubmitting(false);
        }
      },
    });
  };

  return (
    <ScreenContainer>
      <AppHeader
        title={expenseId ? 'Edit expense' : 'New expense'}
        subtitle={referenceNo || 'Loading…'}
        showBack
      />

      {loading ? <LoadingOverlay message="Loading…" /> : null}

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={insets.top}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <SmoothScrollView
            contentContainerStyle={styles.scroll}
            contentPaddingBottom={Math.max(insets.bottom, 24) + 24}>
            <Box style={styles.card}>
              <Label>Reference no.</Label>
              <TextInput
                value={referenceNo}
                onChangeText={setReferenceNo}
                style={appInputStyle}
                placeholderTextColor={appInputPlaceholderColor}
                editable={!expenseId}
              />

              <Label>Date (YYYY-MM-DD)</Label>
              <TextInput
                value={expenseDate}
                onChangeText={setExpenseDate}
                style={appInputStyle}
                placeholder="2026-05-23"
                placeholderTextColor={appInputPlaceholderColor}
              />

              <FilterChips
                label="Location"
                options={locations}
                selected={location}
                onSelect={setLocation}
                showAllOption={false}
              />

              <FilterChips
                label="Category"
                options={categories}
                selected={category}
                onSelect={setCategory}
                showAllOption={false}
              />

              <Label>Description</Label>
              <TextInput
                value={description}
                onChangeText={setDescription}
                style={[appInputStyle, styles.multiline]}
                placeholder="What was this expense for?"
                placeholderTextColor={appInputPlaceholderColor}
                multiline
              />

              <Label>Amount</Label>
              <TextInput
                value={amount}
                onChangeText={setAmount}
                style={appInputStyle}
                keyboardType="decimal-pad"
                placeholder="0.00"
                placeholderTextColor={appInputPlaceholderColor}
              />

              <Label>Discount (optional)</Label>
              <TextInput
                value={discount}
                onChangeText={setDiscount}
                style={appInputStyle}
                keyboardType="decimal-pad"
                placeholder="0"
                placeholderTextColor={appInputPlaceholderColor}
              />

              <FilterChips
                label="Payment method"
                options={paymentMethods}
                selected={paymentMethod}
                onSelect={setPaymentMethod}
                showAllOption={false}
              />

              <FilterChips
                label="Status"
                options={statuses}
                selected={status}
                onSelect={setStatus}
                showAllOption={false}
              />

              <Label>Notes (optional)</Label>
              <TextInput
                value={notes}
                onChangeText={setNotes}
                style={[appInputStyle, styles.multiline]}
                placeholder="Additional notes"
                placeholderTextColor={appInputPlaceholderColor}
                multiline
              />

              <VStack mt="$5" space="sm">
                <PrimaryButton
                  label={expenseId ? 'Update expense' : 'Save expense'}
                  onPress={handleSave}
                  loading={submitting}
                />
                {expenseId ? (
                  <PrimaryButton
                    label="Delete expense"
                    variant="outline"
                    onPress={handleDelete}
                    disabled={submitting}
                  />
                ) : null}
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
  card: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  multiline: {
    minHeight: 72,
    textAlignVertical: 'top',
  },
});
