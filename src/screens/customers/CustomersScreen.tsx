import React, { useEffect } from 'react';
import { RefreshControl, TextInput } from 'react-native';
import { Box, HStack, Text, VStack } from '@gluestack-ui/themed';
import { SmoothFlatList } from '@/components/common/SmoothFlatList';
import { Mail, Phone, User } from 'lucide-react-native';
import { ScreenContainer } from '@/components/common/ScreenContainer';
import { AppHeader } from '@/components/common/AppHeader';
import { LoadingOverlay } from '@/components/common/LoadingOverlay';
import { useErrorDialog } from '@/context/ErrorDialogContext';
import { usePosSettings } from '@/context/PosSettingsContext';
import { useCustomers } from '@/hooks/useCustomers';
import { formatCurrency, formatNumber } from '@/utils/format';
import { colors, shadows, appInputStyle, appInputPlaceholderColor } from '@/theme';
import type { CustomerSummary } from '@/types/sales';

export const CustomersScreen: React.FC = () => {
  const { showError } = useErrorDialog();
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

  useEffect(() => {
    if (error) {
      showError({ title: 'Customers', message: error });
    }
  }, [error, showError]);

  const renderItem = ({ item }: { item: CustomerSummary }) => (
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
        <VStack alignItems="flex-end">
          <Text size="xs" color={colors.textMuted}>
            Balance
          </Text>
          <Text
            fontWeight="$bold"
            color={
              (item.net_balance ?? 0) > 0 ? colors.error : colors.success
            }>
            {formatCurrency(item.net_balance, currency)}
          </Text>
        </VStack>
      </HStack>
    </Box>
  );

  return (
    <ScreenContainer>
      <AppHeader
        title="Customers"
        subtitle={`${formatNumber(summary.total_customers)} registered`}
        showBack
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
              Receivables
            </Text>
            <Text fontSize="$lg" fontWeight="$bold" color={colors.error} mt="$0.5">
              {formatCurrency(summary.total_receivables, currency)}
            </Text>
          </Box>
        </HStack>

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
            <Box px="$6" py="$10" alignItems="center">
              <Text textAlign="center" color={colors.textMuted}>
                {search.trim()
                  ? 'No customers match your search.'
                  : 'No customers found in the backend yet.'}
              </Text>
            </Box>
          ) : null
        }
      />
    </ScreenContainer>
  );
};
