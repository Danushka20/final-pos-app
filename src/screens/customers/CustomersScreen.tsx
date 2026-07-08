import React, { useCallback, useEffect, useState } from 'react';
import {
  RefreshControl,
  TextInput,
  TouchableOpacity,
  Pressable,
  StyleSheet,
} from 'react-native';
import { Box, HStack, Text, VStack } from '@gluestack-ui/themed';
import { SmoothFlatList } from '@/components/common/SmoothFlatList';
import { Mail, Phone, Pencil, Plus, Trash2, User, Wallet } from 'lucide-react-native';
import { ScreenContainer } from '@/components/common/ScreenContainer';
import { AppHeader } from '@/components/common/AppHeader';
import { LoadingOverlay } from '@/components/common/LoadingOverlay';
import { useErrorDialog } from '@/context/ErrorDialogContext';
import { useDataRefreshNotify } from '@/context/DataRefreshContext';
import { usePosSettings } from '@/context/PosSettingsContext';
import { useCustomers } from '@/hooks/useCustomers';
import { customerService } from '@/services/api/customerService';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { HomeStackParamList } from '@/navigation/types';
import { formatCurrency, formatNumber } from '@/utils/format';
import { colors, shadows, appInputStyle, appInputPlaceholderColor } from '@/theme';
import type { CustomerSummary } from '@/types/sales';

export const CustomersScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList, 'CustomersList'>>();
  const { showError, showErrorFromUnknown, showConfirm } = useErrorDialog();
  const notifyRefresh = useDataRefreshNotify();
  const { currency } = usePosSettings();
  const {
    loading,
    refreshing,
    error,
    customers,
    summary,
    search,
    setSearch,
    refresh,
  } = useCustomers();
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    if (error) {
      showError({ title: 'Customers', message: error });
    }
  }, [error, showError]);

  const handleEdit = useCallback(
    (item: CustomerSummary) => {
      navigation.navigate('CustomerForm', { customerId: item.id });
    },
    [navigation],
  );

  const runDelete = useCallback(
    async (item: CustomerSummary) => {
      setDeletingId(item.id);
      try {
        await customerService.remove(item.id);
        notifyRefresh(['customers', 'sales', 'dashboard']);
        await refresh();
      } catch (e) {
        showErrorFromUnknown(e, 'Delete customer');
      } finally {
        setDeletingId(null);
      }
    },
    [notifyRefresh, refresh, showErrorFromUnknown],
  );

  const handleDelete = useCallback(
    (item: CustomerSummary) => {
      showConfirm({
        title: 'Delete customer?',
        message: `Remove ${item.customer_name}? This cannot be undone.`,
        confirmLabel: 'Delete',
        cancelLabel: 'Cancel',
        onConfirm: () => runDelete(item),
      });
    },
    [runDelete, showConfirm],
  );

  const renderItem = ({ item }: { item: CustomerSummary }) => {
    const busy = deletingId === item.id;

    return (
      <Box
        mx="$4"
        mb="$3"
        bg={colors.white}
        borderRadius="$2xl"
        p="$4"
        borderWidth={1}
        borderColor={colors.borderLight}
        style={shadows.card}>
        <HStack alignItems="flex-start" gap="$3">
          <Box
            w={44}
            h={44}
            borderRadius="$full"
            bg={colors.primarySoft}
            alignItems="center"
            justifyContent="center">
            <User size={20} color={colors.primary} />
          </Box>
          <Pressable style={{ flex: 1 }} onPress={() => handleEdit(item)}>
            <VStack flex={1}>
              <Text fontWeight="$bold" color={colors.text} numberOfLines={2}>
                {item.customer_name}
              </Text>
              {item.customer_code || item.customer_id ? (
                <Text size="xs" color={colors.textMuted} mt="$0.5">
                  ID {item.customer_code ?? item.customer_id}
                </Text>
              ) : null}
              {item.contact_no ? (
                <HStack alignItems="center" gap="$1.5" mt="$2">
                  <Phone size={13} color={colors.textSecondary} />
                  <Text size="sm" color={colors.textSecondary}>
                    {item.contact_no}
                  </Text>
                </HStack>
              ) : null}
              {item.email ? (
                <HStack alignItems="center" gap="$1.5" mt="$1">
                  <Mail size={13} color={colors.textSecondary} />
                  <Text size="sm" color={colors.textSecondary} numberOfLines={1}>
                    {item.email}
                  </Text>
                </HStack>
              ) : null}
              {item.location ? (
                <Text size="xs" color={colors.textMuted} mt="$1.5">
                  {item.location}
                </Text>
              ) : null}
            </VStack>
          </Pressable>
          <VStack alignItems="flex-end">
            <Text size="xs" color={colors.textMuted}>
              Balance
            </Text>
            <Text
              fontWeight="$bold"
              color={(item.net_balance ?? 0) > 0 ? colors.error : colors.success}>
              {formatCurrency(item.net_balance, currency)}
            </Text>
          </VStack>
        </HStack>

        <HStack gap="$2" mt="$3" justifyContent="flex-end">
          {(item.net_balance ?? 0) > 0 ? (
            <TouchableOpacity
              style={[styles.actionBtn, styles.receiveBtn]}
              onPress={() =>
                navigation.navigate('CustomerReceivePayment', {
                  customerId: item.id,
                })
              }
              disabled={busy || deletingId != null}
              accessibilityRole="button"
              accessibilityLabel={`Receive payment from ${item.customer_name}`}>
              <Wallet size={16} color={colors.success} />
              <Text size="sm" fontWeight="$semibold" color={colors.success}>
                Receive
              </Text>
            </TouchableOpacity>
          ) : null}
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => handleEdit(item)}
            disabled={busy || deletingId != null}
            accessibilityRole="button"
            accessibilityLabel={`Edit ${item.customer_name}`}>
            <Pencil size={16} color={colors.primary} />
            <Text size="sm" fontWeight="$semibold" color={colors.primary}>
              Edit
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, styles.deleteBtn]}
            onPress={() => handleDelete(item)}
            disabled={busy || deletingId != null}
            accessibilityRole="button"
            accessibilityLabel={`Delete ${item.customer_name}`}>
            <Trash2 size={16} color={busy ? colors.textMuted : colors.error} />
            <Text
              size="sm"
              fontWeight="$semibold"
              color={busy ? colors.textMuted : colors.error}>
              {busy ? 'Deleting…' : 'Delete'}
            </Text>
          </TouchableOpacity>
        </HStack>
      </Box>
    );
  };

  return (
    <ScreenContainer>
      <AppHeader
        title="Customers"
        subtitle={`${formatNumber(summary.total_customers)} registered`}
        showBack
        rightSlot={
          <TouchableOpacity
            onPress={() => navigation.navigate('CustomerForm', {})}
            style={{ padding: 8 }}>
            <Plus size={24} color={colors.primary} />
          </TouchableOpacity>
        }
      />

      {loading ? <LoadingOverlay message="Loading customers…" /> : null}

      <Box px="$4" py="$3" gap="$3">
        <HStack gap="$3">
          <Box
            flex={1}
            bg={colors.white}
            borderRadius="$xl"
            p="$3"
            borderWidth={1}
            borderColor={colors.borderLight}
            style={shadows.card}>
            <Text size="xs" color={colors.textMuted}>
              Total customers
            </Text>
            <Text fontSize="$lg" fontWeight="$bold" color={colors.text} mt="$0.5">
              {formatNumber(summary.total_customers)}
            </Text>
          </Box>
          <Box
            flex={1}
            bg={colors.white}
            borderRadius="$xl"
            p="$3"
            borderWidth={1}
            borderColor={colors.borderLight}
            style={shadows.card}>
            <Text size="xs" color={colors.textMuted}>
              Credit debtors
            </Text>
            <Text fontSize="$lg" fontWeight="$bold" color={colors.warning} mt="$0.5">
              {formatNumber(summary.debtor_count)}
            </Text>
          </Box>
        </HStack>

        <Box
          bg={colors.white}
          borderRadius="$xl"
          p="$3"
          borderWidth={1}
          borderColor={colors.borderLight}
          style={shadows.card}>
          <Text size="xs" color={colors.textMuted}>
            Total receivables
          </Text>
          <Text fontSize="$lg" fontWeight="$bold" color={colors.error} mt="$0.5">
            {formatCurrency(summary.total_receivables, currency)}
          </Text>
        </Box>

        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search name, phone, email, ID…"
          placeholderTextColor={appInputPlaceholderColor}
          style={appInputStyle}
        />
      </Box>

      <SmoothFlatList
        data={customers}
        keyExtractor={item => String(item.id)}
        renderItem={renderItem}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} />
        }
        contentContainerStyle={{ paddingBottom: 24, flexGrow: 1 }}
        ListEmptyComponent={
          !loading ? (
            <Box px="$6" py="$10" alignItems="center" gap="$4">
              <Text textAlign="center" color={colors.textMuted}>
                {search.trim()
                  ? 'No customers match your search.'
                  : 'No customers yet. Add your first customer to use them on sales.'}
              </Text>
              {!search.trim() ? (
                <TouchableOpacity
                  onPress={() => navigation.navigate('CustomerForm', {})}
                  style={{
                    paddingHorizontal: 20,
                    paddingVertical: 12,
                    borderRadius: 12,
                    backgroundColor: colors.primary,
                  }}>
                  <Text color={colors.white} fontWeight="$bold">
                    Add customer
                  </Text>
                </TouchableOpacity>
              ) : null}
            </Box>
          ) : null
        }
      />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  deleteBtn: {
    borderColor: colors.error,
    backgroundColor: '#FEF2F2',
  },
  receiveBtn: {
    borderColor: colors.success,
    backgroundColor: '#F0FDF4',
  },
});
