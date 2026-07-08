import React from 'react';
import { Image, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { Minus, Package, Plus, Trash2 } from 'lucide-react-native';
import { formatCurrency } from '@/utils/format';
import { formatExpiryDate } from '@/utils/batchUtils';
import { formatPricePerUom, resolveLineUom } from '@/utils/uom';
import { useItemImage } from '@/hooks/useItemImage';
import {
  appInputPlaceholderColor,
  appInputStyle,
  colors,
  shadows,
  typography,
} from '@/theme';
import type { CartLine, InventoryItem } from '@/types/sales';

interface SaleOrderLineRowProps {
  line: CartLine;
  item?: InventoryItem;
  currency?: string;
  qtyDraft: string;
  priceDraft?: string;
  allowEditPrice?: boolean;
  lineTotal: number;
  offerDiscount: number;
  isReturn: boolean;
  allowNegativeInventory: boolean;
  maxReturn?: number;
  outOfStock: boolean;
  showBatchInfo?: boolean;
  onQtyDraftChange: (text: string) => void;
  onCommitQty: () => void;
  onPriceDraftChange?: (text: string) => void;
  onCommitPrice?: () => void;
  onDecrement: () => void;
  onIncrement: () => void;
  onRemove: () => void;
}

export const SaleOrderLineRow: React.FC<SaleOrderLineRowProps> = ({
  line,
  item,
  currency,
  qtyDraft,
  priceDraft,
  allowEditPrice = false,
  lineTotal,
  offerDiscount,
  isReturn,
  allowNegativeInventory,
  maxReturn,
  outOfStock,
  showBatchInfo = false,
  onQtyDraftChange,
  onCommitQty,
  onPriceDraftChange,
  onCommitPrice,
  onDecrement,
  onIncrement,
  onRemove,
}) => {
  const uom = resolveLineUom(line.uom, item?.uom);
  const stock = item?.qty ?? 0;
  const localImage = useItemImage({
    id: item?.id ?? line.item_id,
    item_number: item?.item_number ?? line.item_number,
    image_url: item?.image_url,
  });
  const imageUri = localImage;
  const hasOffer = offerDiscount > 0;
  const unitPriceLabel = formatPricePerUom(formatCurrency(line.unit_price, currency), uom);
  const canEditPrice = allowEditPrice && !isReturn;

  return (
    <View
      style={[
        styles.row,
        hasOffer && styles.rowOffer,
        outOfStock && styles.rowOutOfStock,
      ]}>
      <View style={styles.mainRow}>
        <View style={styles.thumb}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.thumbImage} resizeMode="cover" />
          ) : (
            <View style={styles.thumbPlaceholder}>
              <Package size={18} color={colors.textMuted} />
              <Text style={styles.thumbCode} numberOfLines={2}>
                {line.item_number || '—'}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.productCol}>
          <Text style={styles.productName} numberOfLines={2}>
            {line.description}
          </Text>
          <Text style={styles.meta} numberOfLines={1}>
            {line.item_number || `ID ${line.item_id}`}
          </Text>
          {showBatchInfo ? (
            line.item_batch_id ? (
              <Text style={styles.batchLabel}>
                Batch {line.batch_number ?? line.item_batch_id}
                {line.batch_expiry_date
                  ? ` · exp ${formatExpiryDate(line.batch_expiry_date)}`
                  : ''}
              </Text>
            ) : (
              <Text style={styles.unbatchedLabel}>Unbatched stock</Text>
            )
          ) : null}
          {isReturn && maxReturn != null ? (
            <Text style={styles.meta}>Max return {maxReturn} {uom}</Text>
          ) : null}
          {!isReturn && !allowNegativeInventory && !line.item_batch_id ? (
            <Text style={[styles.meta, outOfStock && styles.metaError]}>
              {outOfStock ? 'Out of stock' : `Stock ${stock} ${uom}`}
            </Text>
          ) : null}
          {hasOffer ? (
            <View style={styles.offerBox}>
              <Text style={styles.offerTitle}>Offer applied</Text>
              <Text style={styles.offerAmount}>
                −{formatCurrency(offerDiscount, currency)} on this line
              </Text>
            </View>
          ) : null}
        </View>

        <View style={styles.priceCol}>
          {canEditPrice ? (
            <TextInput
              value={priceDraft ?? String(line.unit_price)}
              onChangeText={text =>
                onPriceDraftChange?.(text.replace(/[^0-9.,]/g, ''))
              }
              onBlur={() => onCommitPrice?.()}
              onSubmitEditing={() => onCommitPrice?.()}
              keyboardType="decimal-pad"
              returnKeyType="done"
              selectTextOnFocus
              style={styles.priceInput}
              placeholder="0.00"
              placeholderTextColor={appInputPlaceholderColor}
            />
          ) : (
            <Text style={styles.unitPrice}>{unitPriceLabel}</Text>
          )}
          <Text style={[styles.lineTotal, hasOffer && styles.lineTotalOffer]}>
            {formatCurrency(lineTotal, currency)}
          </Text>
        </View>
      </View>

      <View style={styles.qtyRow}>
        <Text style={styles.qtyLabel}>Qty</Text>
        <View style={styles.qtyControls}>
          <TouchableOpacity
            onPress={onDecrement}
            style={styles.qtyBtn}
            accessibilityLabel="Decrease quantity">
            <Minus size={14} color={colors.textSecondary} />
          </TouchableOpacity>
          <TextInput
            value={qtyDraft}
            onChangeText={onQtyDraftChange}
            onBlur={onCommitQty}
            onSubmitEditing={onCommitQty}
            keyboardType="decimal-pad"
            returnKeyType="done"
            selectTextOnFocus
            style={styles.qtyInput}
            placeholder="0"
            placeholderTextColor={appInputPlaceholderColor}
          />
          <Text style={styles.uomLabel}>{uom}</Text>
          <TouchableOpacity
            onPress={onIncrement}
            style={styles.qtyBtn}
            accessibilityLabel="Increase quantity">
            <Plus size={14} color={colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onRemove}
            style={styles.removeBtn}
            accessibilityLabel="Remove item">
            <Trash2 size={16} color={colors.error} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    backgroundColor: colors.white,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: 10,
    marginBottom: 8,
    ...shadows.sm,
  },
  rowOffer: {
    backgroundColor: colors.pastelGreenSoft,
    borderColor: colors.pastelGreen,
  },
  rowOutOfStock: {
    backgroundColor: '#FEF2F2',
    borderColor: colors.error,
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  thumb: {
    width: 48,
    height: 48,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.backgroundAlt,
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
  thumbPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  thumbCode: {
    ...typography.caption,
    fontSize: 8,
    fontWeight: '700',
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 2,
  },
  productCol: {
    flex: 1,
    minWidth: 0,
  },
  productName: {
    ...typography.body,
    fontWeight: '700',
    color: colors.text,
  },
  meta: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  metaError: {
    color: colors.error,
    fontWeight: '700',
  },
  batchLabel: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
    marginTop: 3,
  },
  unbatchedLabel: {
    ...typography.caption,
    color: colors.warning,
    fontWeight: '600',
    marginTop: 3,
  },
  offerBox: {
    marginTop: 6,
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  offerTitle: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.success,
  },
  offerAmount: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 1,
  },
  priceCol: {
    alignItems: 'flex-end',
    minWidth: 72,
  },
  unitPrice: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'right',
  },
  priceInput: {
    ...appInputStyle,
    width: 88,
    minHeight: 34,
    paddingVertical: 4,
    paddingHorizontal: 8,
    textAlign: 'right',
    fontWeight: '700',
    fontSize: 13,
    marginBottom: 0,
  },
  lineTotal: {
    ...typography.body,
    fontWeight: '700',
    color: colors.primary,
    marginTop: 4,
    textAlign: 'right',
  },
  lineTotalOffer: {
    color: colors.success,
  },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.borderLight,
  },
  qtyLabel: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  qtyControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  qtyBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyInput: {
    ...appInputStyle,
    width: 68,
    minHeight: 36,
    paddingVertical: 6,
    paddingHorizontal: 8,
    textAlign: 'center',
    fontWeight: '700',
    fontSize: 15,
    marginBottom: 0,
  },
  uomLabel: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.textSecondary,
    minWidth: 24,
  },
  removeBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#FEF2F2',
    marginLeft: 2,
  },
});
