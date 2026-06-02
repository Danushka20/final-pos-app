import React, { useEffect } from 'react';
import { RefreshControl, TouchableOpacity } from 'react-native';
import { Box, HStack, Text, VStack } from '@gluestack-ui/themed';
import { SmoothFlatList } from '@/components/common/SmoothFlatList';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Plus } from 'lucide-react-native';
import { ScreenContainer } from '@/components/common/ScreenContainer';
import { AppHeader } from '@/components/common/AppHeader';
import { LoadingOverlay } from '@/components/common/LoadingOverlay';
import { useErrorDialog } from '@/context/ErrorDialogContext';
import { usePosSettings } from '@/context/PosSettingsContext';
import { usePurchases } from '@/hooks/usePurchases';
import { formatCurrency } from '@/utils/format';
import { colors } from '@/theme';
import type { ProductsStackParamList } from '@/navigation/types';
import type { PurchaseRecord } from '@/types/inventory';

type Nav = NativeStackNavigationProp<ProductsStackParamList, 'PurchasesList'>;

export const PurchasesScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const { showError } = useErrorDialog();
  const { currency } = usePosSettings();
  const purchases = usePurchases();

  useEffect(() => {
    if (purchases.error) {
      showError({ title: 'Purchases', message: purchases.error });
    }
  }, [purchases.error, showError]);

  const renderItem = ({ item }: { item: PurchaseRecord }) => (
    <Box px="$4" py="$3" borderBottomWidth={1} borderColor={colors.border}>
      <HStack justifyContent="space-between">
        <VStack flex={1} pr="$2">
          <Text fontWeight="$semibold">{item.invoice_id}</Text>
          <Text size="xs" color={colors.textMuted}>
            {item.purchase_date}
            {item.supplier_name ? ` · ${item.supplier_name}` : ''}
          </Text>
        </VStack>
        <Text fontWeight="$bold" color={colors.primary}>
          {formatCurrency(item.amount, currency)}
        </Text>
      </HStack>
    </Box>
  );

  return (
    <ScreenContainer>
      <AppHeader
        title="Purchases"
        subtitle={`${purchases.summary.total_purchases} orders · ${formatCurrency(purchases.summary.total_purchase_amount, currency)}`}
        showBack
        rightSlot={
          <TouchableOpacity
            onPress={() => navigation.navigate('PurchaseCreate')}
            style={{ padding: 8 }}>
            <Plus size={24} color={colors.primary} />
          </TouchableOpacity>
        }
      />

      {purchases.loading ? <LoadingOverlay message="Loading purchases…" /> : null}

      <SmoothFlatList
        data={purchases.purchases}
        keyExtractor={item => String(item.id)}
        renderItem={renderItem}
        refreshControl={
          <RefreshControl
            refreshing={purchases.loading}
            onRefresh={purchases.refresh}
          />
        }
        ListEmptyComponent={
          !purchases.loading ? (
            <Text textAlign="center" color={colors.textMuted} py="$8">
              No purchases found
            </Text>
          ) : null
        }
      />
    </ScreenContainer>
  );
};
