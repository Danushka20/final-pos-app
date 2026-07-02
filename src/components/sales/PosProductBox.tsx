import React from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { Text } from 'react-native-paper';
import { Check, Layers, Minus, Package, Plus } from 'lucide-react-native';
import { formatCurrency } from '@/utils/format';
import { itemHasBatches } from '@/utils/batchUtils';
import { isItemExpired } from '@/utils/expiryUtils';
import { useItemImage } from '@/hooks/useItemImage';
import { itemSellableQty } from '@/utils/itemInventoryUtils';
import { resolveLineUom } from '@/utils/uom';
import { PosItemExpiryChip } from '@/components/sales/PosItemExpiryChip';
import { colors, radius, shadows, typography } from '@/theme';
import type { InventoryItem } from '@/types/sales';

interface PosProductBoxProps {
  item: InventoryItem;
  currency?: string;
  cartQty?: number;
  disabled?: boolean;
  displayPrice?: number;
  ignoreStock?: boolean;
  hasOffer?: boolean;
  hasBatches?: boolean;
  onOpenBatches?: (item: InventoryItem) => void;
  onAdd: (item: InventoryItem) => void;
  onOpenOrder?: (item: InventoryItem) => void;
  onIncrement?: (item: InventoryItem) => void;
  onRemove: (item: InventoryItem) => void;
  onRemoveAll?: (item: InventoryItem) => void;
}

export const PosProductBox: React.FC<PosProductBoxProps> = ({
  item,
  currency,
  cartQty = 0,
  disabled = false,
  displayPrice,
  ignoreStock = false,
  hasOffer = false,
  hasBatches = false,
  onOpenBatches,
  onAdd,
  onOpenOrder,
  onIncrement,
  onRemove,
  onRemoveAll,
}) => {
  const stock = ignoreStock ? (item.qty ?? 0) : itemSellableQty(item);
  const outOfStock = !ignoreStock && stock <= 0;
  const expired = !ignoreStock && isItemExpired(item) && !itemHasBatches(item);
  const lowStock = !ignoreStock && !outOfStock && stock > 0 && stock <= 5;
  const cannotSell = disabled || (!ignoreStock && (outOfStock || expired));
  const price = displayPrice ?? item.selling_price;
  const inCart = cartQty > 0;
  const imageUrl = useItemImage(item);
  const showBatchControl = Boolean(onOpenBatches) && (hasBatches || itemHasBatches(item));
  const itemCode = item.item_number?.trim() || String(item.id);
  const lineUom = resolveLineUom(item.uom);

  return (
    <View
      style={[
        styles.card,
        shadows.sm,
        inCart && styles.cardSelected,
        cannotSell && styles.cardDisabled,
      ]}>
        <Pressable
          onPress={() => {
            if (cannotSell) {
              return;
            }
            if (inCart) {
              onOpenOrder?.(item);
              return;
            }
            onAdd(item);
          }}
          onLongPress={() => {
            if (inCart) {
              (onRemoveAll ?? onRemove)(item);
            }
          }}
          delayLongPress={400}
          disabled={cannotSell}
          style={({ pressed }) => [pressed && !cannotSell && styles.cardPressed]}>
          <View style={styles.imageShell}>
            <View style={styles.imageWrap}>
              {imageUrl ? (
                <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="cover" />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Package size={22} color={colors.textMuted} strokeWidth={1.6} />
                </View>
              )}

              {cannotSell ? (
                <View style={styles.unavailableOverlay}>
                  <Text style={styles.unavailableText}>
                    {expired ? 'Expired' : 'Out of stock'}
                  </Text>
                </View>
              ) : null}
            </View>

            {inCart ? (
              <View style={styles.selectedBadge}>
                <Check size={9} color={colors.textOnPrimary} strokeWidth={3} />
              </View>
            ) : null}

            {hasOffer && !inCart ? (
              <View style={styles.offerBadge}>
                <Text style={styles.offerBadgeText}>Offer</Text>
              </View>
            ) : null}

            {showBatchControl && !inCart && !cannotSell ? (
              <TouchableOpacity
                onPress={() => onOpenBatches?.(item)}
                style={styles.batchFab}
                hitSlop={6}
                accessibilityRole="button"
                accessibilityLabel="Select batch">
                <Layers size={11} color={colors.text} strokeWidth={2.5} />
              </TouchableOpacity>
            ) : null}

            {!inCart && !cannotSell ? (
              <TouchableOpacity
                onPress={() => onAdd(item)}
                style={styles.fabAdd}
                activeOpacity={0.88}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={`Add ${item.description}`}>
                <Plus size={15} color={colors.textOnPrimary} strokeWidth={2.5} />
              </TouchableOpacity>
            ) : null}
          </View>

          <View style={styles.body}>
            <Text style={styles.code} numberOfLines={1}>
              {itemCode}
            </Text>
            <Text style={styles.name} numberOfLines={2}>
              {item.description}
            </Text>

            <PosItemExpiryChip item={item} variant="card" />

            <View style={styles.metaRow}>
              <Text style={[styles.price, cannotSell && styles.priceMuted]} numberOfLines={1}>
                {formatCurrency(price, currency)}
              </Text>
              {!ignoreStock && !cannotSell ? (
                <View style={[styles.stockPill, lowStock && styles.stockPillLow]}>
                  <View
                    style={[
                      styles.stockDot,
                      lowStock ? styles.stockDotLow : styles.stockDotOk,
                    ]}
                  />
                  <Text style={[styles.stockText, lowStock && styles.stockTextLow]}>
                    {stock % 1 === 0 ? stock : stock.toFixed(1)} {lineUom}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>
        </Pressable>

      {inCart ? (
        <View style={styles.stepper}>
          {showBatchControl ? (
            <TouchableOpacity
              onPress={() => onOpenBatches?.(item)}
              style={styles.stepperBatchBtn}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
              <Layers size={13} color={colors.text} strokeWidth={2.5} />
            </TouchableOpacity>
          ) : null}
          <TouchableOpacity
            onPress={() => onRemove(item)}
            style={styles.stepperBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Minus size={13} color={colors.text} strokeWidth={2.5} />
          </TouchableOpacity>
          <Text style={styles.stepperQty}>
            {cartQty} {lineUom}
          </Text>
          <TouchableOpacity
            onPress={() => !cannotSell && (onIncrement ?? onAdd)(item)}
            disabled={cannotSell}
            style={[
              styles.stepperBtn,
              styles.stepperBtnPlus,
              cannotSell && styles.stepperBtnDisabled,
            ]}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Plus size={15} color={colors.textOnPrimary} strokeWidth={2.5} />
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    margin: 3,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    overflow: 'hidden',
  },
  cardSelected: {
    borderColor: colors.text,
    backgroundColor: colors.white,
    ...shadows.md,
  },
  cardDisabled: {
    opacity: 0.78,
  },
  cardPressed: {
    transform: [{ scale: 0.985 }],
    opacity: 0.96,
  },
  imageShell: {
    padding: 6,
    paddingBottom: 4,
    position: 'relative',
  },
  imageWrap: {
    width: '100%',
    aspectRatio: 1.25,
    borderRadius: radius.md,
    backgroundColor: colors.backgroundAlt,
    overflow: 'hidden',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.backgroundAlt,
  },
  selectedBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.text,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.white,
    ...shadows.sm,
  },
  offerBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: colors.warningSoft,
    borderRadius: radius.full,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  offerBadgeText: {
    fontSize: 8,
    fontWeight: '800',
    color: colors.warning,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  fabAdd: {
    position: 'absolute',
    right: 10,
    bottom: 6,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.text,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    ...shadows.sm,
  },
  batchFab: {
    position: 'absolute',
    left: 10,
    bottom: 6,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  unavailableOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(255,255,255,0.78)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  unavailableText: {
    ...typography.caption,
    fontWeight: '800',
    color: colors.text,
    fontSize: 9,
    backgroundColor: colors.white,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  body: {
    paddingHorizontal: 8,
    paddingBottom: 6,
    gap: 1,
  },
  code: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },
  name: {
    ...typography.label,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '700',
    color: colors.text,
    minHeight: 28,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 4,
    marginTop: 2,
  },
  price: {
    ...typography.label,
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
    flex: 1,
  },
  priceMuted: {
    color: colors.textMuted,
  },
  stockPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.pastelGreenSoft,
    borderRadius: radius.full,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  stockPillLow: {
    backgroundColor: colors.warningSoft,
  },
  stockDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  stockDotOk: {
    backgroundColor: colors.statusDotGreen,
  },
  stockDotLow: {
    backgroundColor: colors.statusDotYellow,
  },
  stockText: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.success,
  },
  stockTextLow: {
    color: colors.warning,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 6,
    marginBottom: 6,
    paddingVertical: 5,
    paddingHorizontal: 8,
    backgroundColor: colors.backgroundAlt,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  stepperBatchBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperBtnPlus: {
    backgroundColor: colors.text,
    borderColor: colors.text,
  },
  stepperBtnDisabled: {
    opacity: 0.4,
  },
  stepperQty: {
    ...typography.label,
    minWidth: 36,
    textAlign: 'center',
    fontWeight: '800',
    fontSize: 12,
    color: colors.text,
  },
});
