import React, { useMemo } from 'react';
import { RefreshControl, useWindowDimensions } from 'react-native';
import { Box, Text } from '@gluestack-ui/themed';
import { SmoothFlatList } from '@/components/common/SmoothFlatList';
import { PosProductBox } from '@/components/sales/PosProductBox';
import { itemHasBatches } from '@/utils/batchUtils';
import { colors } from '@/theme';
import type { InventoryItem } from '@/types/sales';

interface PosProductGridProps {
  items: InventoryItem[];
  currency?: string;
  refreshing: boolean;
  onRefresh: () => void;
  onAddItem: (item: InventoryItem) => void;
  onOpenOrder?: (item: InventoryItem) => void;
  onIncrementItem?: (item: InventoryItem) => void;
  onRemoveItem: (item: InventoryItem) => void;
  onRemoveAll?: (item: InventoryItem) => void;
  getCartQty?: (item: InventoryItem) => number;
  getDisplayPrice?: (item: InventoryItem) => number;
  ignoreStock?: boolean;
  canSellItem?: (item: InventoryItem) => boolean;
  offerProductItemIds?: Set<number>;
  batchItemIds?: Set<number>;
  onOpenBatches?: (item: InventoryItem) => void;
  bottomInset?: number;
  /** Changes when cart qty changes — forces FlatList cells to refresh */
  cartRevision?: string;
}

/** 2 columns — modern menu-style product cards */
const NUM_COLUMNS = 2;
const GRID_H_PAD = 8;
const BOX_GAP = 6;

export const PosProductGrid: React.FC<PosProductGridProps> = ({
  items,
  currency,
  refreshing,
  onRefresh,
  onAddItem,
  onOpenOrder,
  onIncrementItem,
  onRemoveItem,
  onRemoveAll,
  getCartQty,
  getDisplayPrice,
  ignoreStock,
  canSellItem,
  offerProductItemIds,
  batchItemIds,
  onOpenBatches,
  bottomInset = 16,
  cartRevision = '',
}) => {
  const { width } = useWindowDimensions();
  const boxWidth = useMemo(
    () => (width - GRID_H_PAD * 2 - BOX_GAP * (NUM_COLUMNS - 1)) / NUM_COLUMNS,
    [width],
  );

  return (
    <SmoothFlatList
      data={items}
      extraData={`${cartRevision}|${batchItemIds?.size ?? 0}`}
      keyExtractor={item => item.return_line_key ?? String(item.id)}
      numColumns={NUM_COLUMNS}
      contentContainerStyle={{
        paddingHorizontal: GRID_H_PAD,
        paddingTop: 4,
        paddingBottom: bottomInset,
      }}
      columnWrapperStyle={{ gap: BOX_GAP, justifyContent: 'space-between' }}
      keyboardShouldPersistTaps="handled"
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      ListEmptyComponent={
        <Box py="$10" alignItems="center" px="$4">
          <Text color={colors.textMuted} textAlign="center">
            No items in this category
          </Text>
        </Box>
      }
      renderItem={({ item }) => (
        <Box width={boxWidth}>
          <PosProductBox
            item={item}
            currency={currency}
            cartQty={getCartQty?.(item) ?? 0}
            displayPrice={getDisplayPrice?.(item)}
            ignoreStock={ignoreStock}
            hasOffer={offerProductItemIds?.has(item.id) ?? false}
            hasBatches={itemHasBatches(item) || (batchItemIds?.has(item.id) ?? false)}
            onOpenBatches={onOpenBatches}
            disabled={canSellItem ? !canSellItem(item) : false}
            onAdd={onAddItem}
            onOpenOrder={onOpenOrder}
            onIncrement={onIncrementItem}
            onRemove={onRemoveItem}
            onRemoveAll={onRemoveAll}
          />
        </Box>
      )}
    />
  );
};
