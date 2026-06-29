import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { Text } from 'react-native-paper';
import { Minus, Layers, Package, Plus } from 'lucide-react-native';
import { PosItemExpiryChip } from '@/components/sales/PosItemExpiryChip';
import { formatCurrency } from '@/utils/format';
import { itemHasBatches } from '@/utils/batchUtils';
import { isItemExpired } from '@/utils/expiryUtils';
import { resolveLineUom } from '@/utils/uom';
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
  onIncrement,
  onRemove,
  onRemoveAll,
}) => {
  const outOfStock = (item.qty ?? 0) <= 0;
  const expired = !ignoreStock && isItemExpired(item) && !itemHasBatches(item);
  const cannotSell = disabled || (!ignoreStock && (outOfStock || expired));
  const price = displayPrice ?? item.selling_price;
  const inCart = cartQty > 0;
  const code = item.item_number || String(item.id);
  const categoryLine = [item.category, item.sub_category].filter(Boolean).join(' · ');
  const uom = resolveLineUom(item.uom);
  const stockLine =
    !ignoreStock && item.qty != null
      ? `Stock ${item.qty} ${uom}`
      : uom
        ? `Unit: ${uom}`
        : '';
  const showBatchControl = Boolean(onOpenBatches) && (hasBatches || itemHasBatches(item));

  const openBatches = () => {
    onOpenBatches?.(item);
  };

  const batchButton = showBatchControl ? (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={openBatches}
      style={[
        styles.batchBtn,
        inCart && styles.batchBtnCompact,
        inCart && styles.batchBtnInCart,
      ]}
      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
      accessibilityLabel="Open batch list">
      <Layers
        size={inCart ? 11 : 10}
        color={inCart ? colors.primary : colors.textOnPrimary}
        strokeWidth={2.5}
      />
      {!inCart ? <Text style={styles.batchBtnText}>Batch</Text> : null}
    </TouchableOpacity>
  ) : null;

  return (
    <View
      style={[
        styles.cardOuter,
        shadows.card,
        inCart && styles.cardSelected,
        cannotSell && styles.cardDisabled,
        expired && styles.cardExpired,
      ]}>
      <View style={[styles.topBar, cannotSell && styles.topBarMuted, expired && styles.topBarExpired]} />

      {hasOffer && !inCart ? (
        <View style={styles.offerBadge}>
          <Text style={styles.offerBadgeText}>Offer</Text>
        </View>
      ) : null}

      {inCart ? (
        <View style={styles.qtyBadge}>
          <Text style={styles.qtyText}>{cartQty > 99 ? '99+' : cartQty}</Text>
        </View>
      ) : null}

      <Pressable
        onPress={() => {
          if (!cannotSell) {
            onAdd(item);
          }
        }}
        onLongPress={() => {
          if (inCart) {
            (onRemoveAll ?? onRemove)(item);
          }
        }}
        delayLongPress={400}
        disabled={cannotSell}
        style={({ pressed }) => [
          styles.cardBody,
          pressed && !cannotSell && styles.cardPressed,
        ]}>
        <View style={styles.iconFrame}>
          <Package size={24} color={inCart ? colors.text : colors.textMuted} strokeWidth={2.2} />
        </View>

        <View style={styles.codeFrame}>
          <Text style={styles.codeLabel}>CODE</Text>
          <Text style={styles.code} numberOfLines={1}>
            {code}
          </Text>
        </View>

        <Text style={styles.name} numberOfLines={2}>
          {item.description}
        </Text>

        <PosItemExpiryChip item={item} />

        {categoryLine || stockLine ? (
          <View style={styles.metaFrame}>
            <Text style={styles.meta} numberOfLines={2}>
              {[categoryLine, stockLine].filter(Boolean).join(' · ')}
            </Text>
          </View>
        ) : null}

        {!ignoreStock && expired ? (
          <View style={styles.outFrame}>
            <Text style={styles.outLabel}>Expired</Text>
          </View>
        ) : !ignoreStock && outOfStock ? (
          <View style={styles.outFrame}>
            <Text style={styles.outLabel}>Out of stock</Text>
          </View>
        ) : null}

        {inCart ? (
          <Text style={styles.hint}>Hold to remove</Text>
        ) : (
          <Text style={styles.hint}>Tap to add</Text>
        )}
      </Pressable>

      <View
        style={[
          styles.priceFrame,
          inCart && styles.priceFrameSelected,
          showBatchControl && !inCart && styles.priceFrameWithBatch,
        ]}>
        {inCart ? (
          <View style={styles.qtyRow}>
            {batchButton}
            <TouchableOpacity
              activeOpacity={0.75}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              onPress={() => onRemove(item)}
              style={styles.qtyBtn}
              accessibilityLabel="Remove one">
              <Minus size={18} color={colors.textOnPrimary} strokeWidth={2.5} />
            </TouchableOpacity>
            <Text style={[styles.price, styles.priceSelected, styles.qtyCenter]}>
              {cartQty}
            </Text>
            <TouchableOpacity
              activeOpacity={0.75}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              onPress={() => !cannotSell && (onIncrement ?? onAdd)(item)}
              disabled={cannotSell}
              style={[styles.qtyBtn, cannotSell && styles.qtyBtnDisabled]}
              accessibilityLabel="Add one">
              <Plus size={18} color={colors.textOnPrimary} strokeWidth={2.5} />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.priceFooter}>
            <Text
              style={[styles.price, cannotSell && styles.priceMuted]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.72}>
              {formatCurrency(price, currency)}
            </Text>
            {batchButton ? <View style={styles.batchBtnRow}>{batchButton}</View> : null}
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cardOuter: {
    flex: 1,
    margin: 6,
    minHeight: 178,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    overflow: 'hidden',
    position: 'relative',
  },
  cardSelected: {
    borderColor: colors.text,
    borderWidth: 2,
  },
  cardDisabled: {
    opacity: 0.52,
  },
  cardExpired: {
    backgroundColor: colors.errorSoft,
  },
  cardPressed: {
    backgroundColor: colors.primarySoft,
  },
  topBar: {
    height: 4,
    width: '100%',
    backgroundColor: colors.text,
  },
  topBarMuted: {
    backgroundColor: colors.borderStrong,
  },
  topBarExpired: {
    backgroundColor: colors.error,
  },
  offerBadge: {
    position: 'absolute',
    top: 10,
    left: 8,
    zIndex: 8,
    backgroundColor: colors.success,
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  offerBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.white,
    letterSpacing: 0.3,
  },
  priceFooter: {
    width: '100%',
    alignItems: 'center',
    gap: 5,
  },
  batchBtnRow: {
    width: '100%',
    alignItems: 'center',
  },
  batchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.primary,
    borderRadius: 7,
    paddingHorizontal: 7,
    paddingVertical: 4,
    ...shadows.sm,
  },
  batchBtnCompact: {
    width: 30,
    height: 30,
    minWidth: 30,
    paddingHorizontal: 0,
    paddingVertical: 0,
    justifyContent: 'center',
    borderRadius: 8,
  },
  batchBtnInCart: {
    backgroundColor: colors.white,
  },
  batchBtnText: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.textOnPrimary,
    letterSpacing: 0.2,
  },
  qtyBadge: {
    position: 'absolute',
    top: 10,
    right: 8,
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.text,
    borderWidth: 2,
    borderColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    zIndex: 3,
    ...shadows.sm,
  },
  qtyText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textOnPrimary,
  },
  cardBody: {
    flex: 1,
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 4,
    alignItems: 'center',
  },
  iconFrame: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    backgroundColor: colors.backgroundAlt,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  codeFrame: {
    width: '100%',
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.backgroundAlt,
    paddingVertical: 5,
    paddingHorizontal: 6,
    alignItems: 'center',
    marginBottom: 6,
  },
  codeLabel: {
    ...typography.caption,
    fontSize: 8,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.6,
    marginBottom: 1,
  },
  code: {
    ...typography.caption,
    fontWeight: '800',
    color: colors.text,
    fontSize: 12,
    textAlign: 'center',
    width: '100%',
  },
  name: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.text,
    fontSize: 11,
    lineHeight: 14,
    textAlign: 'center',
    width: '100%',
    minHeight: 28,
  },
  metaFrame: {
    width: '100%',
    marginTop: 4,
    paddingVertical: 3,
    paddingHorizontal: 4,
    borderRadius: radius.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderLight,
  },
  meta: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 9,
    textAlign: 'center',
    fontWeight: '600',
  },
  outFrame: {
    marginTop: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.full,
    backgroundColor: colors.errorSoft,
    borderWidth: 1,
    borderColor: colors.pastelPink,
  },
  outLabel: {
    ...typography.caption,
    color: colors.error,
    fontWeight: '700',
    fontSize: 9,
  },
  hint: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 8,
    marginTop: 4,
    fontWeight: '600',
  },
  priceFrame: {
    width: '100%',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.backgroundAlt,
    paddingVertical: 8,
    paddingHorizontal: 8,
    alignItems: 'center',
    minHeight: 44,
    justifyContent: 'center',
    zIndex: 4,
  },
  priceFrameWithBatch: {
    minHeight: 56,
    paddingVertical: 6,
  },
  priceFrameSelected: {
    backgroundColor: colors.text,
    borderTopColor: colors.text,
  },
  price: {
    ...typography.label,
    fontWeight: '800',
    color: colors.text,
    fontSize: 12,
    textAlign: 'center',
    width: '100%',
  },
  priceMuted: {
    color: colors.textMuted,
  },
  priceSelected: {
    color: colors.textOnPrimary,
  },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    gap: 6,
  },
  qtyBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtnDisabled: {
    opacity: 0.4,
  },
  qtyCenter: {
    flex: 1,
    fontSize: 15,
    textAlign: 'center',
  },
});
