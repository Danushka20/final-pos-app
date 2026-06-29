import React, { useCallback, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Modal,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Box, Text, VStack } from '@gluestack-ui/themed';
import { Layers, Pencil, Plus, Trash2, X } from 'lucide-react-native';
import { SmoothScrollView } from '@/components/common/SmoothScrollView';
import { ScreenContainer } from '@/components/common/ScreenContainer';
import { AppHeader } from '@/components/common/AppHeader';
import { PrimaryButton } from '@/components/buttons/PrimaryButton';
import { LoadingOverlay } from '@/components/common/LoadingOverlay';
import { useErrorDialog } from '@/context/ErrorDialogContext';
import { useDataRefreshNotify } from '@/context/DataRefreshContext';
import { useAutoRefresh } from '@/hooks/useAutoRefresh';
import { usePosSettings } from '@/context/PosSettingsContext';
import { inventoryService } from '@/services/api/inventoryService';
import type { ProductsStackParamList } from '@/navigation/types';
import type { ItemBatchPayload, ItemInventoryBreakdown } from '@/types/inventory';
import type { ItemBatch } from '@/types/sales';
import { formatExpiryDate } from '@/utils/batchUtils';
import { formatCurrency } from '@/utils/format';
import { resolveLineUom } from '@/utils/uom';
import {
  colors,
  typography,
  appInputStyle,
  appInputPlaceholderColor,
  shadows,
} from '@/theme';

type Nav = NativeStackNavigationProp<ProductsStackParamList, 'ItemBatches'>;
type Route = RouteProp<ProductsStackParamList, 'ItemBatches'>;

const Label: React.FC<{ children: string }> = ({ children }) => (
  <Text style={[typography.label, { color: colors.textSecondary, marginBottom: 6, marginTop: 12 }]}>
    {children}
  </Text>
);

const formatQty = (qty: number, uom?: string) => `${qty}${uom ? ` ${uom}` : ''}`;

export const ItemBatchesScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Route>();
  const insets = useSafeAreaInsets();
  const { currency } = usePosSettings();
  const { showErrorFromUnknown, showConfirm } = useErrorDialog();
  const notifyRefresh = useDataRefreshNotify();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [breakdown, setBreakdown] = useState<ItemInventoryBreakdown | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBatch, setEditingBatch] = useState<ItemBatch | null>(null);
  const [batchQty, setBatchQty] = useState('');
  const [batchExpiry, setBatchExpiry] = useState('');
  const [batchPurchase, setBatchPurchase] = useState('');
  const [batchSelling, setBatchSelling] = useState('');
  const [batchNotes, setBatchNotes] = useState('');

  const load = useCallback(
    async (silent = false) => {
      if (!silent) {
        setLoading(true);
      }
      try {
        const data = await inventoryService.getInventoryBreakdown(params.itemId);
        setBreakdown(data);
      } catch (e) {
        if (!silent) {
          showErrorFromUnknown(e, 'Stock & batches');
          navigation.goBack();
        }
      } finally {
        if (!silent) {
          setLoading(false);
        }
      }
    },
    [navigation, params.itemId, showErrorFromUnknown],
  );

  React.useEffect(() => {
    void load(false);
  }, [load]);

  useAutoRefresh({
    onRefresh: silent => load(silent),
    scopes: ['inventory', 'sales', 'purchases'],
  });

  const openCreateModal = () => {
    const item = breakdown?.item;
    setEditingBatch(null);
    setBatchQty('');
    setBatchExpiry('');
    setBatchPurchase(String(item?.purchase_price ?? ''));
    setBatchSelling(String(item?.selling_price ?? ''));
    setBatchNotes('');
    setModalOpen(true);
  };

  const openEditModal = (batch: ItemBatch) => {
    setEditingBatch(batch);
    setBatchQty(String(batch.qty ?? ''));
    setBatchExpiry(batch.expiry_date?.slice(0, 10) ?? '');
    setBatchPurchase(String(batch.purchase_price ?? ''));
    setBatchSelling(String(batch.selling_price ?? breakdown?.item.selling_price ?? ''));
    setBatchNotes(batch.notes ?? '');
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingBatch(null);
  };

  const buildPayload = (): ItemBatchPayload => {
    const qty = Math.max(0.01, parseFloat(batchQty) || 0);
    const purchase = parseFloat(batchPurchase);
    const selling = parseFloat(batchSelling);
    return {
      qty,
      expiry_date: batchExpiry.trim() || null,
      purchase_price: Number.isFinite(purchase) ? purchase : null,
      selling_price: Number.isFinite(selling) ? selling : null,
      notes: batchNotes.trim() || null,
      location: breakdown?.item.location ?? null,
    };
  };

  const handleSaveBatch = async () => {
    const qty = parseFloat(batchQty);
    if (!Number.isFinite(qty) || qty <= 0) {
      showErrorFromUnknown(new Error('Enter a valid batch quantity'), 'Batch');
      return;
    }
    setSubmitting(true);
    try {
      if (editingBatch) {
        await inventoryService.updateItemBatch(params.itemId, editingBatch.id, buildPayload());
      } else {
        await inventoryService.createItemBatch(params.itemId, buildPayload());
      }
      notifyRefresh(['inventory', 'dashboard', 'sales', 'reports']);
      closeModal();
      await load(true);
    } catch (e) {
      showErrorFromUnknown(e, editingBatch ? 'Update batch' : 'Add batch');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteBatch = (batch: ItemBatch) => {
    showConfirm({
      title: 'Delete batch',
      message: `Remove batch ${batch.batch_number} from inventory?`,
      confirmLabel: 'Delete',
      onConfirm: async () => {
        setSubmitting(true);
        try {
          await inventoryService.deleteItemBatch(params.itemId, batch.id);
          notifyRefresh(['inventory', 'dashboard', 'sales', 'reports']);
          await load(true);
        } catch (e) {
          showErrorFromUnknown(e, 'Delete batch');
        } finally {
          setSubmitting(false);
        }
      },
    });
  };

  if (loading || !breakdown) {
    return (
      <ScreenContainer>
        <AppHeader title="Stock & batches" showBack />
        <LoadingOverlay message="Loading stock breakdown…" />
      </ScreenContainer>
    );
  }

  const { item, totals, variants, batches } = breakdown;
  const uom = resolveLineUom(item.uom);
  const unbatchedRows = variants.filter(v => v.unbatched_qty > 0);

  return (
    <ScreenContainer>
      <AppHeader title="Stock & batches" subtitle={item.description} showBack />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={insets.top + 56}>
        <SmoothScrollView contentContainerStyle={styles.scroll}>
          <VStack px="$5" pb="$8" gap="$3">
            <Box style={[styles.card, shadows.card]}>
              <Text fontWeight="$bold" color={colors.text}>
                {item.description}
              </Text>
              <Text size="sm" color={colors.textMuted} mt="$1">
                {item.item_number ? `#${item.item_number}` : `ID ${item.id}`}
                {item.location ? ` · ${item.location}` : ''}
              </Text>
            </Box>

            <View style={styles.summaryRow}>
              <SummaryChip label="Total" value={formatQty(totals.total_qty, uom)} />
              <Text style={styles.summaryEq}>=</Text>
              <SummaryChip label="Unbatched" value={formatQty(totals.total_unbatched_qty, uom)} />
              <Text style={styles.summaryPlus}>+</Text>
              <SummaryChip label="Batch" value={formatQty(totals.total_batch_qty, uom)} />
            </View>

            <Text style={styles.sectionTitle}>Branches</Text>
            {variants.map(variant => (
              <View key={variant.id} style={[styles.rowCard, variant.is_current && styles.rowCurrent]}>
                <View style={styles.rowHeader}>
                  <Text style={styles.rowType}>{variant.is_current ? 'Main' : 'Branch'}</Text>
                  <Text style={styles.rowQty}>{formatQty(variant.qty, uom)}</Text>
                </View>
                <Text style={styles.rowMeta}>
                  {variant.location || 'Main Location'}
                </Text>
                {variant.batch_qty > 0 ? (
                  <Text style={styles.rowMeta}>
                    {formatQty(variant.batch_qty, uom)} in batches ·{' '}
                    {formatQty(variant.unbatched_qty, uom)} unbatched
                  </Text>
                ) : null}
              </View>
            ))}

            {unbatchedRows.length > 0 ? (
              <>
                <Text style={styles.sectionTitle}>Unbatched stock</Text>
                {unbatchedRows.map(variant => (
                  <View key={`unbatched-${variant.id}`} style={styles.rowCard}>
                    <View style={styles.rowHeader}>
                      <Text style={styles.rowTypeMuted}>Unbatched</Text>
                      <Text style={styles.rowQty}>{formatQty(variant.unbatched_qty, uom)}</Text>
                    </View>
                    <Text style={styles.rowMeta}>{variant.location || 'Main Location'}</Text>
                  </View>
                ))}
              </>
            ) : null}

            <Text style={styles.sectionTitle}>
              Batches ({totals.batch_count})
            </Text>
            {batches.length === 0 ? (
              <Text style={styles.emptyText}>No batches with stock</Text>
            ) : (
              batches.map(batch => (
                <View key={batch.id} style={styles.rowCard}>
                  <View style={styles.rowHeader}>
                    <View style={styles.batchTitleRow}>
                      <Layers size={14} color={colors.primary} />
                      <Text style={styles.batchNumber}>{batch.batch_number}</Text>
                    </View>
                    <Text style={styles.rowQty}>{formatQty(batch.qty, uom)}</Text>
                  </View>
                  <Text style={styles.rowMeta}>
                    {batch.location ? `@ ${batch.location}` : item.location || 'Main Location'}
                  </Text>
                  <Text style={styles.rowMeta}>
                    Buy {formatCurrency(batch.purchase_price ?? 0, currency)} · Sell{' '}
                    {formatCurrency(batch.selling_price ?? item.selling_price, currency)}
                    {batch.expiry_date ? ` · Exp ${formatExpiryDate(batch.expiry_date)}` : ''}
                  </Text>
                  <View style={styles.rowActions}>
                    <TouchableOpacity
                      style={styles.iconBtn}
                      onPress={() => openEditModal(batch)}
                      hitSlop={8}>
                      <Pencil size={16} color={colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.iconBtn}
                      onPress={() => handleDeleteBatch(batch)}
                      hitSlop={8}>
                      <Trash2 size={16} color={colors.error} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}

            <PrimaryButton
              label="Add batch"
              onPress={openCreateModal}
              disabled={submitting}
            />
          </VStack>
        </SmoothScrollView>
      </KeyboardAvoidingView>

      <Modal visible={modalOpen} animationType="slide" transparent onRequestClose={closeModal}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { paddingBottom: Math.max(insets.bottom, 16) }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingBatch ? `Edit ${editingBatch.batch_number}` : 'Add batch'}
              </Text>
              <TouchableOpacity onPress={closeModal} hitSlop={10}>
                <X size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <Label>Quantity *</Label>
            <TextInput
              value={batchQty}
              onChangeText={setBatchQty}
              keyboardType="decimal-pad"
              style={appInputStyle}
              placeholder="0"
              placeholderTextColor={appInputPlaceholderColor}
            />

            <Label>Expiry date (YYYY-MM-DD)</Label>
            <TextInput
              value={batchExpiry}
              onChangeText={setBatchExpiry}
              style={appInputStyle}
              placeholder="2026-12-31"
              placeholderTextColor={appInputPlaceholderColor}
              autoCapitalize="none"
            />

            <Label>Purchase price</Label>
            <TextInput
              value={batchPurchase}
              onChangeText={setBatchPurchase}
              keyboardType="decimal-pad"
              style={appInputStyle}
              placeholder="0.00"
              placeholderTextColor={appInputPlaceholderColor}
            />

            <Label>Selling price</Label>
            <TextInput
              value={batchSelling}
              onChangeText={setBatchSelling}
              keyboardType="decimal-pad"
              style={appInputStyle}
              placeholder="0.00"
              placeholderTextColor={appInputPlaceholderColor}
            />

            <Label>Notes</Label>
            <TextInput
              value={batchNotes}
              onChangeText={setBatchNotes}
              style={[appInputStyle, { minHeight: 72, textAlignVertical: 'top' }]}
              multiline
              placeholder="Optional"
              placeholderTextColor={appInputPlaceholderColor}
            />

            <PrimaryButton
              label={submitting ? 'Saving…' : editingBatch ? 'Update batch' : 'Create batch'}
              onPress={handleSaveBatch}
              loading={submitting}
            />
          </View>
        </View>
      </Modal>

      {submitting ? <LoadingOverlay message="Saving…" /> : null}
    </ScreenContainer>
  );
};

const SummaryChip: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <View style={styles.summaryChip}>
    <Text style={styles.summaryLabel}>{label}</Text>
    <Text style={styles.summaryValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  scroll: {
    paddingTop: 8,
    paddingBottom: 32,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 4,
    paddingVertical: 8,
  },
  summaryChip: {
    alignItems: 'center',
    minWidth: 72,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  summaryLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
  },
  summaryValue: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.text,
    marginTop: 2,
  },
  summaryEq: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
  },
  summaryPlus: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginTop: 4,
  },
  rowCard: {
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rowCurrent: {
    borderColor: colors.primaryMuted,
    backgroundColor: colors.primarySoft,
  },
  rowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  rowType: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.primary,
    textTransform: 'uppercase',
  },
  rowTypeMuted: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textMuted,
    textTransform: 'uppercase',
  },
  rowQty: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
  },
  rowMeta: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 4,
  },
  batchTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  batchNumber: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    flexShrink: 1,
  },
  rowActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: colors.backgroundAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    paddingVertical: 16,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: colors.overlay,
  },
  modalCard: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 16,
    maxHeight: '88%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.text,
  },
});
