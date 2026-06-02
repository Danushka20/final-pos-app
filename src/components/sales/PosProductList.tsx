import React from 'react';
import { RefreshControl, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { SmoothFlatList } from '@/components/common/SmoothFlatList';
import { PosProductListRow } from '@/components/sales/PosProductListRow';
import { colors, typography } from '@/theme';
import type { InventoryItem } from '@/types/sales';

interface PosProductListProps {
  items: InventoryItem[];
  currency?: string;
  refreshing: boolean;
  onRefresh: () => void;
  onAddItem: (item: InventoryItem) => void;
  getCartQty?: (itemId: number) => number;
  getDisplayPrice?: (item: InventoryItem) => number;
  ignoreStock?: boolean;
  canSellItem?: (item: InventoryItem) => boolean;
  bottomInset?: number;
}

const ListHeader = () => (
  <View style={styles.headerRow}>
    <Text style={[styles.headerCell, styles.codeHead]}>Code</Text>
    <Text style={[styles.headerCell, styles.infoHead]}>Item</Text>
    <Text style={[styles.headerCell, styles.priceHead]}>Price</Text>
  </View>
);

export const PosProductList: React.FC<PosProductListProps> = ({
  items,
  currency,
  refreshing,
  onRefresh,
  onAddItem,
  getCartQty,
  getDisplayPrice,
  ignoreStock,
  canSellItem,
  bottomInset = 16,
}) => (
  <View style={styles.wrap}>
    <ListHeader />
    <SmoothFlatList
      data={items}
      keyExtractor={item => String(item.id)}
      contentContainerStyle={{ paddingBottom: bottomInset }}
      keyboardShouldPersistTaps="handled"
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      ListEmptyComponent={
        <Text style={styles.empty}>No items in this category</Text>
      }
      renderItem={({ item, index }) => (
        <PosProductListRow
          item={item}
          currency={currency}
          cartQty={getCartQty?.(item.id) ?? 0}
          displayPrice={getDisplayPrice?.(item)}
          ignoreStock={ignoreStock}
          disabled={canSellItem ? !canSellItem(item) : false}
          onAdd={onAddItem}
          isLast={index === items.length - 1}
        />
      )}
    />
  </View>
);

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    backgroundColor: colors.backgroundAlt,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 10,
  },
  headerCell: {
    ...typography.caption,
    fontWeight: '800',
    color: colors.textMuted,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  codeHead: {
    width: 72,
  },
  infoHead: {
    flex: 1,
  },
  priceHead: {
    width: 64,
    textAlign: 'right',
  },
  empty: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
    paddingVertical: 32,
  },
});
