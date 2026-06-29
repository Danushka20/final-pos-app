import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { X, Check } from 'lucide-react-native';
import { PrimaryButton } from '@/components/buttons/PrimaryButton';
import type { InventoryItem, ItemBatch } from '@/types/sales';
import {
  availableBatchesAtBranch,
  batchesAtBranch,
  batchQtyTotal,
  batchSellingPrice,
  formatExpiryDate,
  isBatchExpired,
  unbatchedStockQty,
} from '@/utils/batchUtils';
import { formatCurrency } from '@/utils/format';
import { resolveLineUom } from '@/utils/uom';
import { colors, appInputStyle, appInputPlaceholderColor } from '@/theme';

const DIALOG_MAX_HEIGHT = Math.min(Dimensions.get('window').height * 0.78, 520);
const HEADER_BLOCK_HEIGHT = 130;
const FOOTER_BLOCK_HEIGHT = 108;
const TABLE_BODY_MAX_HEIGHT = Math.max(
  100,
  DIALOG_MAX_HEIGHT - HEADER_BLOCK_HEIGHT - FOOTER_BLOCK_HEIGHT,
);

type StockSelection =
  | { kind: 'unbatched' }
  | { kind: 'batch'; batchId: number };

interface PosBatchSelectModalProps {
  visible: boolean;
  item: InventoryItem | null;
  batches: ItemBatch[];
  loading?: boolean;
  error?: string | null;
  currency?: string;
  branchLocation: string;
  defaultQty?: number;
  allowNegativeInventory?: boolean;
  onClose: () => void;
  onSelectBatch: (batch: ItemBatch, qty: number) => void;
  onSelectMainProduct: (qty: number) => void;
}

export const PosBatchSelectModal: React.FC<PosBatchSelectModalProps> = ({
  visible,
  item,
  batches,
  loading = false,
  error = null,
  currency,
  branchLocation,
  defaultQty = 1,
  allowNegativeInventory = false,
  onClose,
  onSelectBatch,
  onSelectMainProduct,
}) => {
  const [selection, setSelection] = useState<StockSelection | null>(null);
  const [saleQty, setSaleQty] = useState(String(defaultQty));

  const branchBatches = useMemo(
    () => batchesAtBranch(batches, branchLocation),
    [batches, branchLocation],
  );

  const available = useMemo(
    () => availableBatchesAtBranch(batches, branchLocation),
    [batches, branchLocation],
  );

  const totalStock = Math.max(0, item?.qty ?? 0);
  const batchStockTotal = batchQtyTotal(branchBatches);
  const unbatchedStock = unbatchedStockQty(totalStock, branchBatches);
  const uom = resolveLineUom(item?.uom);

  const selectedBatch = useMemo(() => {
    if (selection?.kind !== 'batch') {
      return null;
    }
    return available.find(batch => batch.id === selection.batchId) ?? null;
  }, [available, selection]);

  useEffect(() => {
    if (!visible) {
      return;
    }
    setSaleQty(String(defaultQty));
    if (unbatchedStock > 0) {
      setSelection({ kind: 'unbatched' });
    } else if (available[0]) {
      setSelection({ kind: 'batch', batchId: available[0].id });
    } else {
      setSelection(null);
    }
  }, [available, defaultQty, unbatchedStock, visible]);

  const parsedQty = Math.max(0.01, parseFloat(saleQty) || defaultQty);
  const isUnbatchedSelected = selection?.kind === 'unbatched';
  const selectionInvalid =
    !selection ||
    (isUnbatchedSelected &&
      (unbatchedStock <= 0 ||
        (!allowNegativeInventory && parsedQty > unbatchedStock))) ||
    (selection?.kind === 'batch' &&
      (!selectedBatch ||
        isBatchExpired(selectedBatch) ||
        (!allowNegativeInventory && parsedQty > selectedBatch.qty)));

  const addDisabled = selectionInvalid || Boolean(error) || loading;

  const handleAdd = () => {
    if (!selection) {
      return;
    }
    if (selection.kind === 'unbatched') {
      onSelectMainProduct(parsedQty);
      return;
    }
    if (selectedBatch) {
      onSelectBatch(selectedBatch, parsedQty);
    }
  };

  const formatStock = (qty: number) => `${qty}${uom ? ` ${uom}` : ''}`;

  if (!visible) {
    return null;
  }

  return (
    <Modal
      visible
      animationType="fade"
      transparent
      statusBarTranslucent
      presentationStyle="overFullScreen"
      onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.backdrop} />
        </TouchableWithoutFeedback>
        <View style={styles.dialog}>
          <View style={styles.header}>
            <View style={styles.headerText}>
              <Text style={styles.title}>Stock & batches</Text>
              {item ? (
                <Text style={styles.subtitle} numberOfLines={1}>
                  {item.item_number} · {item.description}
                </Text>
              ) : null}
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={12} style={styles.closeBtn}>
              <X size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {item ? (
            <View style={styles.summaryRow}>
              <View style={styles.summaryChip}>
                <Text style={styles.summaryLabel}>All</Text>
                <Text style={styles.summaryValue}>{formatStock(totalStock)}</Text>
              </View>
              <Text style={styles.summaryEq}>=</Text>
              <View style={styles.summaryChip}>
                <Text style={styles.summaryLabel}>Unbatched</Text>
                <Text style={styles.summaryValue}>{formatStock(unbatchedStock)}</Text>
              </View>
              <Text style={styles.summaryPlus}>+</Text>
              <View style={styles.summaryChip}>
                <Text style={styles.summaryLabel}>Batch</Text>
                <Text style={styles.summaryValue}>{formatStock(batchStockTotal)}</Text>
              </View>
            </View>
          ) : null}

          <View style={styles.tableHeader}>
            <View style={styles.colCheck} />
            <Text style={[styles.th, styles.colType]}>Type</Text>
            <Text style={[styles.th, styles.colQty]}>Stock</Text>
            <Text style={[styles.th, styles.colPrice]}>Price</Text>
            <Text style={[styles.th, styles.colExp]}>Expiry</Text>
          </View>

          <ScrollView
            style={styles.tableBody}
            nestedScrollEnabled
            keyboardShouldPersistTaps="handled">
            {loading ? (
              <View style={styles.centered}>
                <ActivityIndicator color={colors.primary} size="small" />
                <Text style={styles.muted}>Loading…</Text>
              </View>
            ) : error ? (
              <View style={styles.centered}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : (
              <>
                {item ? (
                  <Pressable
                    onPress={() => unbatchedStock > 0 && setSelection({ kind: 'unbatched' })}
                    disabled={unbatchedStock <= 0}
                    style={[
                      styles.tr,
                      styles.trUnbatched,
                      isUnbatchedSelected && styles.trSelected,
                      unbatchedStock <= 0 && styles.trDisabled,
                    ]}>
                    <View style={styles.colCheck}>
                      <View
                        style={[
                          styles.checkbox,
                          isUnbatchedSelected && styles.checkboxSelected,
                          unbatchedStock <= 0 && styles.checkboxDisabled,
                        ]}>
                        {isUnbatchedSelected ? (
                          <Check size={11} color={colors.white} strokeWidth={3} />
                        ) : null}
                      </View>
                    </View>
                    <View style={styles.colType}>
                      <Text
                        style={[
                          styles.typeBadge,
                          styles.typeBadgeMuted,
                          isUnbatchedSelected && styles.typeBadgeSelected,
                        ]}>
                        Unbatched
                      </Text>
                      <Text style={styles.typeHint} numberOfLines={1}>
                        Main stock
                      </Text>
                    </View>
                    <Text style={[styles.td, styles.colQty]} numberOfLines={1}>
                      {unbatchedStock}
                    </Text>
                    <Text style={[styles.td, styles.colPrice]} numberOfLines={1}>
                      {formatCurrency(item.selling_price, currency)}
                    </Text>
                    <Text style={[styles.td, styles.colExp]} numberOfLines={1}>
                      —
                    </Text>
                  </Pressable>
                ) : null}

                {available.length === 0 ? (
                  <View style={styles.centered}>
                    <Text style={styles.muted}>No batch stock at this branch</Text>
                  </View>
                ) : (
                  available.map(batch => {
                    const selected =
                      selection?.kind === 'batch' && selection.batchId === batch.id;
                    const expired = isBatchExpired(batch);
                    const price = item
                      ? batchSellingPrice(batch, item.selling_price, item.wholesale_price)
                      : batch.selling_price ?? 0;

                    return (
                      <Pressable
                        key={batch.id}
                        onPress={() => !expired && setSelection({ kind: 'batch', batchId: batch.id })}
                        disabled={expired}
                        style={[
                          styles.tr,
                          selected && styles.trSelected,
                          expired && styles.trExpired,
                        ]}>
                        <View style={styles.colCheck}>
                          <View
                            style={[
                              styles.checkbox,
                              selected && styles.checkboxSelected,
                              expired && styles.checkboxDisabled,
                            ]}>
                            {selected ? (
                              <Check size={11} color={colors.white} strokeWidth={3} />
                            ) : null}
                          </View>
                        </View>
                        <View style={styles.colType}>
                          <Text
                            style={[
                              styles.typeBadge,
                              styles.typeBadgeBatch,
                              selected && styles.typeBadgeSelected,
                            ]}
                            numberOfLines={1}>
                            {batch.batch_number}
                          </Text>
                          <Text style={styles.typeHint}>Batch</Text>
                        </View>
                        <Text style={[styles.td, styles.colQty]} numberOfLines={1}>
                          {batch.qty}
                        </Text>
                        <Text style={[styles.td, styles.colPrice]} numberOfLines={1}>
                          {formatCurrency(price, currency)}
                        </Text>
                        <Text
                          style={[styles.td, styles.colExp, expired && styles.expired]}
                          numberOfLines={1}>
                          {batch.expiry_date ? formatExpiryDate(batch.expiry_date) : '—'}
                        </Text>
                      </Pressable>
                    );
                  })
                )}
              </>
            )}
          </ScrollView>

          <View style={styles.footer}>
            <View style={styles.qtyRow}>
              <Text style={styles.footerLabel}>Qty</Text>
              <TextInput
                value={saleQty}
                onChangeText={setSaleQty}
                keyboardType="decimal-pad"
                placeholder="1"
                style={[appInputStyle, styles.qtyInput]}
                placeholderTextColor={appInputPlaceholderColor}
                editable={!loading && !error && Boolean(selection)}
              />
            </View>
            <PrimaryButton
              label="Add"
              compact
              onPress={handleAdd}
              disabled={addDisabled}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.overlay,
  },
  dialog: {
    width: '100%',
    maxWidth: 420,
    maxHeight: DIALOG_MAX_HEIGHT,
    backgroundColor: colors.white,
    borderRadius: 16,
    overflow: 'hidden',
    zIndex: 2,
    flexDirection: 'column',
    ...Platform.select({
      android: { elevation: 8 },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
      },
    }),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  headerText: {
    flex: 1,
    paddingRight: 8,
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
  },
  subtitle: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: colors.backgroundAlt,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  summaryChip: {
    alignItems: 'center',
    minWidth: 72,
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  summaryLabel: {
    fontSize: 8,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  summaryValue: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.text,
    marginTop: 2,
  },
  summaryEq: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
  },
  summaryPlus: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
  },
  qtyInput: {
    flex: 1,
    minHeight: 42,
    paddingVertical: 8,
    fontSize: 15,
    fontWeight: '600',
  },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: colors.backgroundAlt,
  },
  th: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.textSecondary,
    textTransform: 'uppercase',
  },
  tableBody: {
    flexGrow: 0,
    flexShrink: 1,
    maxHeight: TABLE_BODY_MAX_HEIGHT,
  },
  tr: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  trUnbatched: {
    backgroundColor: colors.backgroundAlt,
  },
  trSelected: {
    backgroundColor: colors.primarySoft,
  },
  trExpired: {
    backgroundColor: colors.errorSoft,
    opacity: 0.8,
  },
  trDisabled: {
    opacity: 0.5,
  },
  td: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text,
  },
  colCheck: {
    width: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  checkboxDisabled: {
    opacity: 0.45,
  },
  colType: {
    flex: 1.5,
    paddingRight: 4,
  },
  typeBadge: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.text,
  },
  typeBadgeMuted: {
    color: colors.textSecondary,
  },
  typeBadgeBatch: {
    color: colors.primary,
  },
  typeBadgeSelected: {
    color: colors.primary,
  },
  typeHint: {
    fontSize: 8,
    fontWeight: '600',
    color: colors.textMuted,
    marginTop: 1,
  },
  colQty: {
    flex: 0.65,
    textAlign: 'right',
  },
  colPrice: {
    flex: 0.95,
    textAlign: 'right',
  },
  colExp: {
    flex: 1.05,
    textAlign: 'right',
  },
  expired: {
    color: colors.error,
  },
  footer: {
    flexShrink: 0,
    width: '100%',
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 12,
    gap: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.white,
  },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  footerLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textSecondary,
    minWidth: 28,
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    gap: 8,
  },
  muted: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 12,
    color: colors.error,
    fontWeight: '700',
    textAlign: 'center',
    paddingHorizontal: 16,
  },
});
