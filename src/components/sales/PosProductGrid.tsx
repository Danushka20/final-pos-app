import React, { useMemo } from 'react';
import { RefreshControl, useWindowDimensions } from 'react-native';
import { Box, Text } from '@gluestack-ui/themed';
import { SmoothFlatList } from '@/components/common/SmoothFlatList';
import { PosProductBox } from '@/components/sales/PosProductBox';
import { colors } from '@/theme';
import type { InventoryItem } from '@/types/sales';

interface PosProductGridProps {
  items: InventoryItem[];
  currency?: string;
  refreshing: boolean;
  onRefresh: () => void;
  onAddItem: (item: InventoryItem) => void;
  onRemoveItem: (item: InventoryItem) => void;
  onRemoveAll?: (item: InventoryItem) => void;
  getCartQty?: (itemId: number) => number;
  getDisplayPrice?: (item: InventoryItem) => number;
  ignoreStock?: boolean;
  canSellItem?: (item: InventoryItem) => boolean;
  bottomInset?: number;
  /** Changes when cart qty changes — forces FlatList cells to refresh */
  cartRevision?: string;
}

/** 3 columns = larger touch boxes on phone */
const NUM_COLUMNS = 3;
const GRID_H_PAD = 6;
const BOX_GAP = 4;

export const PosProductGrid: React.FC<PosProductGridProps> = ({
  items,
  currency,
  refreshing,
  onRefresh,
  onAddItem,
  onRemoveItem,
  onRemoveAll,
  getCartQty,
  getDisplayPrice,
  ignoreStock,
  canSellItem,
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
      extraData={cartRevision}
      keyExtractor={item => String(item.id)}
      numColumns={NUM_COLUMNS}
      contentContainerStyle={{
        paddingHorizontal: GRID_H_PAD,
        paddingTop: 6,
        paddingBottom: bottomInset,
      }}
      columnWrapperStyle={{ justifyContent: 'flex-start' }}
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
            cartQty={getCartQty?.(item.id) ?? 0}
            displayPrice={getDisplayPrice?.(item)}
            ignoreStock={ignoreStock}
            disabled={canSellItem ? !canSellItem(item) : false}
            onAdd={onAddItem}
            onRemove={onRemoveItem}
            onRemoveAll={onRemoveAll}
          />
        </Box>
      )}
    />
  );
};
