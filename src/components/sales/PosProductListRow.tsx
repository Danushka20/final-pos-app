import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { formatCurrency } from '@/utils/format';
import { colors, typography } from '@/theme';
import type { InventoryItem } from '@/types/sales';

interface PosProductListRowProps {
  item: InventoryItem;
  currency?: string;
  cartQty: number;
  disabled?: boolean;
  ignoreStock?: boolean;
  displayPrice?: number;
  onAdd: (item: InventoryItem) => void;
  isLast?: boolean;
}

export const PosProductListRow: React.FC<PosProductListRowProps> = ({
  item,
  currency,
  cartQty,
  disabled = false,
  ignoreStock = false,
  displayPrice,
  onAdd,
  isLast = false,
}) => {
  const outOfStock = (item.qty ?? 0) <= 0;
  const cannotSell = disabled || (!ignoreStock && outOfStock);
  const price = displayPrice ?? item.selling_price;
  const inCart = cartQty > 0;
  const code = item.item_number || String(item.id);
  const categoryLine = [item.category, item.sub_category].filter(Boolean).join(' / ');

  return (
    <Pressable
      onPress={() => !cannotSell && onAdd(item)}
      disabled={cannotSell}
      style={({ pressed }) => [
        styles.row,
        !isLast && styles.rowBorder,
        inCart && styles.rowSelected,
        cannotSell && styles.rowDisabled,
        pressed && !cannotSell && styles.rowPressed,
      ]}>
      <View style={styles.codeCol}>
        <Text style={[styles.code, inCart && styles.codeSelected]} numberOfLines={2}>
          {code}
        </Text>
      </View>

      <View style={styles.infoCol}>
        <Text style={styles.name} numberOfLines={2}>
          {item.description}
        </Text>
        {categoryLine ? (
          <Text style={styles.meta} numberOfLines={1}>
            {categoryLine}
          </Text>
        ) : null}
      </View>

      <View style={styles.rightCol}>
        <Text style={[styles.price, cannotSell && styles.priceMuted]}>
          {formatCurrency(price, currency)}
        </Text>
        {inCart ? (
          <View style={styles.qtyBadge}>
            <Text style={styles.qtyText}>{cartQty}</Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    backgroundColor: colors.white,
    gap: 10,
  },
  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  rowSelected: {
    backgroundColor: colors.backgroundAlt,
  },
  rowDisabled: {
    opacity: 0.45,
  },
  rowPressed: {
    backgroundColor: colors.primarySoft,
  },
  codeCol: {
    width: 72,
    flexShrink: 0,
  },
  code: {
    ...typography.caption,
    fontWeight: '800',
    color: colors.text,
    fontSize: 11,
    lineHeight: 14,
  },
  codeSelected: {
    color: colors.text,
  },
  infoCol: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    ...typography.bodyMedium,
    fontWeight: '600',
    color: colors.text,
    fontSize: 14,
    lineHeight: 18,
  },
  meta: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 3,
    fontSize: 11,
  },
  rightCol: {
    alignItems: 'flex-end',
    minWidth: 64,
    flexShrink: 0,
  },
  price: {
    ...typography.label,
    fontWeight: '800',
    color: colors.text,
    fontSize: 13,
  },
  priceMuted: {
    color: colors.textMuted,
  },
  qtyBadge: {
    marginTop: 4,
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.text,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  qtyText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textOnPrimary,
  },
});
