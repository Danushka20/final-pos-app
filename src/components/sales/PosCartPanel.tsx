import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { SmoothScrollView } from '@/components/common/SmoothScrollView';
import { Box, HStack, Pressable, Text, VStack } from '@gluestack-ui/themed';
import { Minus, Plus, ShoppingCart, Trash2 } from 'lucide-react-native';
import { PrimaryButton } from '@/components/buttons/PrimaryButton';
import { formatCurrency } from '@/utils/format';
import { formatPricePerUom, resolveLineUom } from '@/utils/uom';
import { colors, shadows } from '@/theme';
import type { CartLine, InventoryItem } from '@/types/sales';

interface PosCartPanelProps {
  cart: CartLine[];
  currency?: string;
  netAmount: number;
  itemStock: Map<number, InventoryItem>;
  allowNegativeInventory: boolean;
  cartOpen: boolean;
  onToggleCart: () => void;
  onUpdateQty: (itemId: number, qty: number) => void;
  onRemove: (itemId: number) => void;
  onCheckout: () => void;
  submitting?: boolean;
}

export const PosCartPanel: React.FC<PosCartPanelProps> = ({
  cart,
  currency,
  netAmount,
  itemStock,
  allowNegativeInventory,
  cartOpen,
  onToggleCart,
  onUpdateQty,
  onRemove,
  onCheckout,
  submitting,
}) => {
  if (cart.length === 0) {
    return null;
  }

  const lineCount = cart.reduce((n, l) => n + l.qty, 0);

  return (
    <Box bg={colors.white} style={[styles.panel, shadows.lg]}>
      <Pressable
        px="$4"
        py="$2.5"
        onPress={onToggleCart}
        flexDirection="row"
        alignItems="center"
        justifyContent="space-between"
        borderBottomWidth={cartOpen ? 1 : 0}
        borderColor={colors.borderLight}>
        <HStack alignItems="center" gap="$2" flex={1}>
          <Box bg={colors.primarySoft} p="$1.5" borderRadius="$full">
            <ShoppingCart size={16} color={colors.primary} />
          </Box>
          <VStack flex={1}>
            <Text fontSize="$sm" fontWeight="$bold" color={colors.text} numberOfLines={1}>
              Cart · {cart.length} item{cart.length === 1 ? '' : 's'} ({lineCount} qty)
            </Text>
            <Text fontSize="$xs" color={colors.primary} fontWeight="$bold">
              {formatCurrency(netAmount, currency)}
            </Text>
          </VStack>
        </HStack>
        <Text fontSize="$2xs" color={colors.textSecondary} fontWeight="$bold">
          {cartOpen ? 'Hide' : 'Show'}
        </Text>
      </Pressable>

      {cartOpen ? (
        <SmoothScrollView
          style={styles.linesScroll}
          contentPaddingBottom={8}
          showsVerticalScrollIndicator>
          {cart.map(line => {
            const item = itemStock.get(line.item_id);
            const stock = item?.qty ?? 0;
            const uom = resolveLineUom(line.uom, item?.uom);
            const outOfStock = !allowNegativeInventory && stock <= 0;
            const overStock = !allowNegativeInventory && line.qty > stock;

            return (
              <HStack
                key={line.item_id}
                py="$2"
                px="$4"
                alignItems="center"
                gap="$2"
                borderBottomWidth={StyleSheet.hairlineWidth}
                borderColor={colors.borderLight}
                bg={outOfStock || overStock ? colors.errorSoft : undefined}>
                <VStack flex={1}>
                  <Text size="xs" fontWeight="$bold" color={colors.text} numberOfLines={1}>
                    {line.description}
                  </Text>
                  <Text size="2xs" color={colors.textMuted}>
                    {line.item_number ? `ID ${line.item_number} · ` : ''}
                    {formatPricePerUom(formatCurrency(line.unit_price, currency), uom)}
                    {!allowNegativeInventory && item
                      ? ` · Stock ${stock} ${uom}`
                      : ''}
                  </Text>
                  {outOfStock ? (
                    <Text size="2xs" color={colors.error} fontWeight="$bold" mt="$0.5">
                      Out of stock — remove to continue
                    </Text>
                  ) : overStock ? (
                    <Text size="2xs" color={colors.error} fontWeight="$bold" mt="$0.5">
                      Only {stock} available
                    </Text>
                  ) : null}
                </VStack>
                <HStack alignItems="center" gap="$1.5">
                  <TouchableOpacity
                    onPress={() => onUpdateQty(line.item_id, line.qty - 1)}
                    hitSlop={8}
                    style={styles.qtyBtn}>
                    <Minus size={14} color={colors.textSecondary} />
                  </TouchableOpacity>
                  <Text fontSize="$sm" fontWeight="$bold" minWidth={20} textAlign="center">
                    {line.qty}
                  </Text>
                  <Text fontSize="$2xs" color={colors.textMuted} fontWeight="$bold">
                    {uom}
                  </Text>
                  <TouchableOpacity
                    onPress={() => onUpdateQty(line.item_id, line.qty + 1)}
                    hitSlop={8}
                    style={styles.qtyBtn}
                    disabled={outOfStock}>
                    <Plus
                      size={14}
                      color={outOfStock ? colors.textMuted : colors.textSecondary}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => onRemove(line.item_id)} hitSlop={8}>
                    <Trash2 size={14} color={colors.error} />
                  </TouchableOpacity>
                </HStack>
                <Text fontSize="$xs" fontWeight="$bold" minWidth={56} textAlign="right">
                  {formatCurrency(line.line_total, currency)}
                </Text>
              </HStack>
            );
          })}
        </SmoothScrollView>
      ) : null}

      <Box px="$4" py="$3" borderTopWidth={1} borderColor={colors.borderLight} bg={colors.surfaceElevated}>
        <HStack justifyContent="space-between" alignItems="center" mb="$2">
          <Text fontSize="$sm" color={colors.textSecondary} fontWeight="$semibold">
            Total due
          </Text>
          <Text fontSize="$lg" fontWeight="$bold" color={colors.primary}>
            {formatCurrency(netAmount, currency)}
          </Text>
        </HStack>
        <PrimaryButton
          label={cartOpen ? 'Proceed to payment' : `Pay ${formatCurrency(netAmount, currency)}`}
          onPress={onCheckout}
          loading={submitting}
          disabled={submitting || cart.some(line => {
            if (allowNegativeInventory) return false;
            const item = itemStock.get(line.item_id);
            const stock = item?.qty ?? 0;
            return stock <= 0 || line.qty > stock;
          })}
        />
      </Box>
    </Box>
  );
};

const styles = StyleSheet.create({
  panel: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '48%',
  },
  linesScroll: {
    maxHeight: 168,
  },
  qtyBtn: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
