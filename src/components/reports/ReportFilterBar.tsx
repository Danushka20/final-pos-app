import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Box, Pressable as GsPressable, Text } from '@gluestack-ui/themed';
import { ChevronRight, Package, Search, X } from 'lucide-react-native';
import { SmoothScrollView } from '@/components/common/SmoothScrollView';
import { ReportDatePickerField } from '@/components/inputs/ReportDatePickerField';
import { inventoryService } from '@/services/api/inventoryService';
import type { ReportDatePresetId, ReportFilterParams } from '@/types/reportFilters';
import type { InventoryItem } from '@/types/sales';
import {
  REPORT_DATE_PRESETS,
  dateRangeForPreset,
  detectDatePreset,
  normalizeReportDateRange,
} from '@/utils/reportDateFilters';
import {
  appInputPlaceholderColor,
  appInputStyle,
  colors,
  shadows,
  smoothHorizontalScrollProps,
  typography,
} from '@/theme';

type Props = {
  filters: ReportFilterParams;
  onChange: (next: ReportFilterParams) => void;
};

const itemLabelFor = (item: InventoryItem): string => {
  const number = item.item_number?.trim();
  const description = item.description?.trim() || 'Unnamed item';
  return number ? `${number} — ${description}` : description;
};

export const ReportFilterBar: React.FC<Props> = ({ filters, onChange }) => {
  const [datePreset, setDatePreset] = useState(() =>
    detectDatePreset(filters.dateFrom, filters.dateTo),
  );
  const [itemPickerOpen, setItemPickerOpen] = useState(false);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [itemSearch, setItemSearch] = useState('');

  useEffect(() => {
    setDatePreset(detectDatePreset(filters.dateFrom, filters.dateTo));
  }, [filters.dateFrom, filters.dateTo]);

  const loadItems = useCallback(async () => {
    setItemsLoading(true);
    try {
      const list = await inventoryService.list();
      setItems(list.items);
    } catch {
      setItems([]);
    } finally {
      setItemsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (itemPickerOpen) {
      loadItems();
    }
  }, [itemPickerOpen, loadItems]);

  const filteredItems = useMemo(() => {
    const query = itemSearch.trim().toLowerCase();
    if (!query) {
      return items;
    }
    return items.filter(item => {
      const label = itemLabelFor(item).toLowerCase();
      return (
        label.includes(query) ||
        String(item.sku ?? '')
          .toLowerCase()
          .includes(query)
      );
    });
  }, [itemSearch, items]);

  const applyDatePreset = (presetId: ReportDatePresetId) => {
    if (presetId === 'custom') {
      setDatePreset('custom');
      return;
    }
    const range = dateRangeForPreset(presetId);
    setDatePreset(presetId);
    onChange({
      ...filters,
      ...range,
    });
  };

  const updateDate = (key: 'dateFrom' | 'dateTo', value: string) => {
    const next = normalizeReportDateRange(
      key === 'dateFrom' ? value : filters.dateFrom,
      key === 'dateTo' ? value : filters.dateTo,
    );
    onChange({
      ...filters,
      ...next,
    });
    setDatePreset('custom');
  };

  const selectItem = (item: InventoryItem | null) => {
    onChange({
      ...filters,
      itemId: item?.id ?? null,
      itemLabel: item ? itemLabelFor(item) : null,
    });
    setItemPickerOpen(false);
    setItemSearch('');
  };

  return (
    <>
      <Box
        w="100%"
        maxWidth={400}
        bg={colors.white}
        borderRadius="$xl"
        borderWidth={1}
        borderColor={colors.border}
        p="$4"
        mb="$4"
        style={shadows.sm}>
        <Text
          size="xs"
          fontWeight="$bold"
          color={colors.textSecondary}
          mb="$3"
          textTransform="uppercase"
          letterSpacing={0.5}>
          Report filters
        </Text>

        <Text
          size="xs"
          fontWeight="$bold"
          color={colors.textSecondary}
          mb="$1.5"
          textTransform="uppercase"
          letterSpacing={0.5}>
          Date range
        </Text>
        <SmoothScrollView
          horizontal
          contentPaddingBottom={0}
          {...smoothHorizontalScrollProps}>
          <Box flexDirection="row" gap="$2" py="$1" mb="$1">
            {REPORT_DATE_PRESETS.map(preset => {
              const active = datePreset === preset.id;
              return (
                <GsPressable
                  key={preset.id}
                  onPress={() => applyDatePreset(preset.id)}
                  px="$4"
                  py="$2.5"
                  borderRadius="$full"
                  borderWidth={active ? 0 : 1}
                  borderColor={colors.border}
                  bg={active ? colors.primary : colors.white}
                  style={active ? shadows.sm : undefined}>
                  <Text
                    size="xs"
                    fontWeight="$bold"
                    fontFamily={typography.label.fontFamily}
                    color={active ? colors.textOnPrimary : colors.textSecondary}>
                    {preset.label}
                  </Text>
                </GsPressable>
              );
            })}
          </Box>
        </SmoothScrollView>

        <Box flexDirection="row" gap="$3" mt="$3">
          <Box flex={1}>
            <ReportDatePickerField
              label="From"
              value={filters.dateFrom}
              onChange={value => updateDate('dateFrom', value)}
              placeholder="Start date"
            />
          </Box>
          <Box flex={1}>
            <ReportDatePickerField
              label="To"
              value={filters.dateTo}
              onChange={value => updateDate('dateTo', value)}
              placeholder="End date"
            />
          </Box>
        </Box>

        <Box mt="$3">
          <Text
            size="xs"
            fontWeight="$bold"
            color={colors.textSecondary}
            mb="$1.5"
            textTransform="uppercase"
            letterSpacing={0.5}>
            Item
          </Text>
          <Pressable
            onPress={() => setItemPickerOpen(true)}
            style={styles.itemSelectRow}
            accessibilityRole="button"
            accessibilityLabel={
              filters.itemLabel ? `Item ${filters.itemLabel}` : 'All items'
            }>
            <Package size={16} color={colors.primary} />
            <Text
              style={[
                styles.itemSelectText,
                !filters.itemLabel && styles.itemSelectPlaceholder,
              ]}
              numberOfLines={2}>
              {filters.itemLabel ?? 'All items'}
            </Text>
            {filters.itemId ? (
              <TouchableOpacity
                onPress={() => selectItem(null)}
                hitSlop={8}
                accessibilityLabel="Clear item filter">
                <X size={14} color={colors.textMuted} />
              </TouchableOpacity>
            ) : (
              <ChevronRight size={16} color={colors.primaryLight} />
            )}
          </Pressable>
        </Box>
      </Box>

      <Modal
        visible={itemPickerOpen}
        animationType="slide"
        onRequestClose={() => setItemPickerOpen(false)}>
        <View style={styles.modalRoot}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setItemPickerOpen(false)}>
              <Text style={styles.modalAction}>Close</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Select item</Text>
            <TouchableOpacity onPress={() => selectItem(null)}>
              <Text style={[styles.modalAction, styles.modalDone]}>All items</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.searchRow}>
            <Search size={16} color={colors.textMuted} />
            <TextInput
              value={itemSearch}
              onChangeText={setItemSearch}
              placeholder="Search by name, code, or SKU"
              placeholderTextColor={appInputPlaceholderColor}
              style={styles.searchInput}
              autoCorrect={false}
              autoCapitalize="none"
            />
          </View>

          <View style={styles.listWrap}>
            {itemsLoading ? (
              <Text style={styles.emptyText}>Loading items…</Text>
            ) : filteredItems.length === 0 ? (
              <Text style={styles.emptyText}>No items found.</Text>
            ) : (
              filteredItems.map(item => {
                const active = filters.itemId === item.id;
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.itemRow, active && styles.itemRowActive]}
                    onPress={() => selectItem(item)}>
                    <Text style={[styles.itemRowTitle, active && styles.itemRowTitleActive]}>
                      {item.description}
                    </Text>
                    <Text style={styles.itemRowMeta}>
                      {[item.item_number, item.sku].filter(Boolean).join(' · ') || `ID ${item.id}`}
                    </Text>
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  itemSelectRow: {
    ...appInputStyle,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 42,
    paddingVertical: 8,
    marginBottom: 0,
    gap: 10,
  },
  itemSelectText: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },
  itemSelectPlaceholder: {
    color: appInputPlaceholderColor,
    fontWeight: '400',
  },
  modalRoot: {
    flex: 1,
    backgroundColor: colors.white,
    paddingTop: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderLight,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  modalAction: {
    fontSize: 15,
    color: colors.textSecondary,
    minWidth: 72,
  },
  modalDone: {
    color: colors.primary,
    fontWeight: '700',
    textAlign: 'right',
  },
  searchRow: {
    ...appInputStyle,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    paddingVertical: 0,
  },
  listWrap: {
    flex: 1,
    paddingHorizontal: 16,
  },
  itemRow: {
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderLight,
  },
  itemRowActive: {
    backgroundColor: colors.primarySoft,
    marginHorizontal: -8,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  itemRowTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  itemRowTitleActive: {
    color: colors.primary,
  },
  itemRowMeta: {
    marginTop: 2,
    fontSize: 12,
    color: colors.textMuted,
  },
  emptyText: {
    paddingVertical: 24,
    textAlign: 'center',
    color: colors.textSecondary,
    fontSize: 14,
  },
});
