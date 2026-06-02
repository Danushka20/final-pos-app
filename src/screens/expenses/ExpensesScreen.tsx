import React, { useEffect } from 'react';
import {
  RefreshControl,
  TextInput,
  TouchableOpacity,
  View,
  StyleSheet,
} from 'react-native';
import { Box, HStack, Text, VStack } from '@gluestack-ui/themed';
import { SmoothFlatList } from '@/components/common/SmoothFlatList';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Plus } from 'lucide-react-native';
import { ScreenContainer } from '@/components/common/ScreenContainer';
import { AppHeader } from '@/components/common/AppHeader';
import { FilterChips } from '@/components/common/FilterChips';
import { LoadingOverlay } from '@/components/common/LoadingOverlay';
import { useErrorDialog } from '@/context/ErrorDialogContext';
import { usePosSettings } from '@/context/PosSettingsContext';
import { useExpenses } from '@/hooks/useExpenses';
import { formatCurrency } from '@/utils/format';
import {
  colors,
  shadows,
  typography,
  appInputStyle,
  appInputPlaceholderColor,
} from '@/theme';
import type { HomeStackParamList } from '@/navigation/types';
import type { Expense } from '@/types/expenses';

type Nav = NativeStackNavigationProp<HomeStackParamList, 'ExpensesList'>;

const statusColor = (status: string) => {
  const s = status.toLowerCase();
  if (s === 'approved') return colors.success;
  if (s === 'pending') return colors.warning;
  if (s === 'rejected') return colors.error;
  return colors.textMuted;
};

const TableHeader: React.FC = () => (
  <HStack style={styles.tableHeader} px="$3" py="$2.5">
    <Text style={[styles.colRef, typography.caption, styles.headerText]}>Ref</Text>
    <Text style={[styles.colDate, typography.caption, styles.headerText]}>Date</Text>
    <Text style={[styles.colCat, typography.caption, styles.headerText]}>Category</Text>
    <Text style={[styles.colAmt, typography.caption, styles.headerText, styles.right]}>
      Amount
    </Text>
    <Text style={[styles.colStatus, typography.caption, styles.headerText, styles.right]}>
      Status
    </Text>
  </HStack>
);

const ExpenseRow: React.FC<{
  item: Expense;
  currency: string;
  onPress: () => void;
}> = ({ item, currency, onPress }) => (
  <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
    <HStack style={styles.tableRow} px="$3" py="$3" alignItems="center">
      <VStack style={styles.colRef}>
        <Text style={[typography.caption, { color: colors.text, fontWeight: '700' }]} numberOfLines={1}>
          {item.reference_no}
        </Text>
      </VStack>
      <Text style={[styles.colDate, typography.caption, { color: colors.textSecondary }]} numberOfLines={1}>
        {item.expense_date}
      </Text>
      <Text style={[styles.colCat, typography.caption, { color: colors.text }]} numberOfLines={1}>
        {item.category}
      </Text>
      <Text
        style={[styles.colAmt, typography.caption, { color: colors.error, fontWeight: '700', textAlign: 'right' }]}
        numberOfLines={1}>
        {formatCurrency(item.amount, currency)}
      </Text>
      <Text
        style={[styles.colStatus, typography.caption, { color: statusColor(item.status), fontWeight: '600', textAlign: 'right' }]}
        numberOfLines={1}>
        {item.status}
      </Text>
    </HStack>
    <Text
      px="$3"
      pb="$2"
      style={[typography.caption, { color: colors.textMuted, marginTop: -4 }]}
      numberOfLines={1}>
      {item.description}
    </Text>
  </TouchableOpacity>
);

export const ExpensesScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const { showError } = useErrorDialog();
  const { currency } = usePosSettings();
  const expenses = useExpenses();

  useEffect(() => {
    if (expenses.error) {
      showError({ title: 'Expenses', message: expenses.error });
    }
  }, [expenses.error, showError]);

  return (
    <ScreenContainer>
      <AppHeader
        title="Expenses"
        subtitle={`${expenses.summary.total_expenses} records · ${formatCurrency(expenses.summary.total_expense_amount, currency)} total`}
        showBack
        rightSlot={
          <TouchableOpacity
            onPress={() => navigation.navigate('ExpenseForm', {})}
            style={{ padding: 8 }}>
            <Plus size={24} color={colors.primary} />
          </TouchableOpacity>
        }
      />

      {expenses.loading ? <LoadingOverlay message="Loading expenses…" /> : null}

      <Box px="$4" pt="$3" pb="$2">
        <TextInput
          placeholder="Search reference, category, description…"
          placeholderTextColor={appInputPlaceholderColor}
          value={expenses.search}
          onChangeText={expenses.setSearch}
          style={appInputStyle}
        />
      </Box>

      {expenses.filters.locations.length > 1 ? (
        <Box px="$4" pb="$2">
          <FilterChips
            label="Location"
            options={expenses.filters.locations}
            selected={expenses.location || 'all'}
            onSelect={v => expenses.setLocation(v === 'all' ? '' : v)}
          />
        </Box>
      ) : null}

      <Box mx="$4" mb="$2" style={[styles.summaryCard, shadows.card]}>
        <HStack justifyContent="space-between" alignItems="center">
          <VStack>
            <Text style={[typography.caption, { color: colors.textSecondary }]}>Total expenses</Text>
            <Text style={[typography.h3, { color: colors.text }]}>
              {expenses.summary.total_expenses}
            </Text>
          </VStack>
          <VStack alignItems="flex-end">
            <Text style={[typography.caption, { color: colors.textSecondary }]}>Amount</Text>
            <Text style={[typography.h3, { color: colors.error }]}>
              {formatCurrency(expenses.summary.total_expense_amount, currency)}
            </Text>
          </VStack>
        </HStack>
      </Box>

      <View style={styles.tableWrap}>
        <TableHeader />
        <SmoothFlatList
          data={expenses.expenses}
          keyExtractor={item => String(item.id)}
          renderItem={({ item }) => (
            <ExpenseRow
              item={item}
              currency={currency}
              onPress={() => navigation.navigate('ExpenseForm', { expenseId: item.id })}
            />
          )}
          refreshControl={
            <RefreshControl
              refreshing={expenses.loading}
              onRefresh={expenses.refresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          ListEmptyComponent={
            !expenses.loading ? (
              <Text textAlign="center" color={colors.textMuted} py="$8" style={typography.body}>
                No expenses found. Tap + to add one.
              </Text>
            ) : null
          }
        />
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  summaryCard: {
    backgroundColor: colors.white,
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tableWrap: {
    flex: 1,
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: colors.white,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...shadows.card,
  },
  tableHeader: {
    backgroundColor: colors.primarySoft,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerText: {
    color: colors.primaryDeep,
    fontWeight: '700',
  },
  tableRow: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderLight,
  },
  colRef: { flex: 1.2, minWidth: 0 },
  colDate: { flex: 1, minWidth: 0 },
  colCat: { flex: 1, minWidth: 0 },
  colAmt: { flex: 1, minWidth: 0 },
  colStatus: { flex: 0.9, minWidth: 0 },
  right: { textAlign: 'right' },
});
