import React, { useCallback, useEffect, useState } from 'react';
import { RefreshControl } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { Box, HStack, Text, VStack } from '@gluestack-ui/themed';
import { SmoothScrollView } from '@/components/common/SmoothScrollView';
import { ScreenContainer } from '@/components/common/ScreenContainer';
import { AppHeader } from '@/components/common/AppHeader';
import { LoadingOverlay } from '@/components/common/LoadingOverlay';
import { useErrorDialog } from '@/context/ErrorDialogContext';
import { useAutoRefresh } from '@/hooks/useAutoRefresh';
import { inventoryService } from '@/services/api/inventoryService';
import type { ProductsStackParamList } from '@/navigation/types';
import type { InventoryHistoryRow, ItemRecord } from '@/types/inventory';
import { colors, TAB_BAR_SCROLL_PADDING, shadows } from '@/theme';

type Nav = NativeStackNavigationProp<ProductsStackParamList, 'ItemHistory'>;
type Route = RouteProp<ProductsStackParamList, 'ItemHistory'>;

const HistoryRow: React.FC<{ row: InventoryHistoryRow }> = ({ row }) => (
  <Box
    bg={colors.white}
    borderRadius="$xl"
    p="$3"
    mb="$2"
    borderWidth={1}
    borderColor={colors.border}
    style={shadows.card}>
    <HStack justifyContent="space-between" alignItems="flex-start">
      <VStack flex={1} pr="$2">
        <Text fontWeight="$semibold" color={colors.text} fontSize="$sm">
          {row.movement_type}
        </Text>
        <Text size="xs" color={colors.textMuted} mt="$0.5">
          {row.source}
          {row.reference_label ? ` · ${row.reference_label}` : ''}
        </Text>
        {row.notes ? (
          <Text size="xs" color={colors.textSecondary} mt="$1">
            {row.notes}
          </Text>
        ) : null}
      </VStack>
      <VStack alignItems="flex-end">
        <Text
          fontWeight="$bold"
          fontSize="$sm"
          color={row.qty_change < 0 ? colors.error : colors.success}>
          {row.qty_change > 0 ? '+' : ''}
          {row.qty_change}
        </Text>
        {row.qty_after != null ? (
          <Text size="xs" color={colors.textMuted} mt="$0.5">
            → {row.qty_after}
          </Text>
        ) : null}
      </VStack>
    </HStack>
    {row.created_at ? (
      <Text size="xs" color={colors.textMuted} mt="$2">
        {new Date(row.created_at.replace(' ', 'T')).toLocaleString()}
        {row.location ? ` · ${row.location}` : ''}
      </Text>
    ) : null}
  </Box>
);

export const ItemHistoryScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Route>();
  const { showErrorFromUnknown } = useErrorDialog();
  const [loading, setLoading] = useState(true);
  const [item, setItem] = useState<ItemRecord | null>(null);
  const [history, setHistory] = useState<InventoryHistoryRow[]>([]);

  const load = useCallback(async (silent = false) => {
    if (!silent) {
      setLoading(true);
    }
    try {
      const data = await inventoryService.getItemHistory(params.itemId);
      setItem(data.item);
      setHistory(data.history ?? []);
    } catch (e) {
      if (!silent) {
        showErrorFromUnknown(e, 'Item activity');
        navigation.goBack();
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, [navigation, params.itemId, showErrorFromUnknown]);

  useEffect(() => {
    load(false);
  }, [load]);

  useAutoRefresh({
    onRefresh: silent => load(silent),
    scopes: ['inventory', 'sales', 'purchases'],
  });

  return (
    <ScreenContainer>
      <AppHeader
        title="Item activity"
        subtitle={item?.description}
        showBack
      />

      {loading && !item ? <LoadingOverlay message="Loading history…" /> : null}

      <SmoothScrollView
        style={{ flex: 1, backgroundColor: colors.backgroundAlt }}
        contentPaddingBottom={TAB_BAR_SCROLL_PADDING}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}>
        <VStack px="$4" py="$4" space="sm">
          {item ? (
            <Text size="sm" color={colors.textSecondary} px="$1" mb="$1">
              Qty on hand: {item.qty ?? 0} {item.uom ?? ''}
            </Text>
          ) : null}

          {history.length ? (
            history.map((row, idx) => <HistoryRow key={`${row.created_at}-${idx}`} row={row} />)
          ) : !loading ? (
            <Box alignItems="center" py="$10">
              <Text color={colors.textMuted}>No activity recorded yet.</Text>
            </Box>
          ) : null}
        </VStack>
      </SmoothScrollView>
    </ScreenContainer>
  );
};
