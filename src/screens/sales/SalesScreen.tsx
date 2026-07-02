import React, { useEffect, useMemo } from 'react';
import { Keyboard, Pressable, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { PauseCircle } from 'lucide-react-native';
import { ScreenContainer } from '@/components/common/ScreenContainer';
import { LoadingOverlay } from '@/components/common/LoadingOverlay';
import { PosCategoryBar } from '@/components/sales/PosCategoryBar';
import { SaleModeToggle } from '@/components/sales/SaleModeToggle';
import { ReturnSalePicker } from '@/components/sales/ReturnSalePicker';
import { PosProductGrid } from '@/components/sales/PosProductGrid';
import { PosBatchSelectModal } from '@/components/sales/PosBatchSelectModal';
import { PosDockCartBar } from '@/components/sales/PosDockCartBar';
import { useErrorDialog } from '@/context/ErrorDialogContext';
import { usePosSaleContext } from '@/context/PosSaleContext';
import { usePosSettings } from '@/context/PosSettingsContext';
import { colors, TAB_BAR_SCROLL_PADDING } from '@/theme';
import { summarizeCartQtyByUom } from '@/utils/uom';
import type { SalesStackParamList } from '@/navigation/types';
import type { InventoryItem } from '@/types/sales';

const DOCK_CART_HEIGHT = 88;

type Nav = NativeStackNavigationProp<SalesStackParamList, 'SalesPOS'>;

export const SalesScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const { showError } = useErrorDialog();
  const { currency } = usePosSettings();
  const pos = usePosSaleContext();
  const { error: posError, setError: setPosError } = pos;

  useEffect(() => {
    if (posError) {
      showError({ title: 'POS', message: posError });
      setPosError(null);
    }
  }, [posError, setPosError, showError]);

  const selectedCount = useMemo(
    () => pos.cart.reduce((n, line) => n + line.qty, 0),
    [pos.cart],
  );

  const cartQtySummary = useMemo(
    () => summarizeCartQtyByUom(pos.cart),
    [pos.cart],
  );

  const canBrowseItems =
    !pos.isReturn || pos.returnSourceSale != null || pos.returnWithoutBill;

  const openOrder = () => {
    if (
      pos.isReturn &&
      !pos.returnSourceSale &&
      !pos.returnWithoutBill
    ) {
      showError({
        title: 'Return sale',
        message: 'Select a sale bill or use return without bill.',
        variant: 'warning',
      });
      return;
    }
    if (pos.cart.length === 0) {
      showError({
        title: 'Order',
        message: pos.isReturn
          ? 'Select items to return'
          : 'Select at least one product',
        variant: 'warning',
      });
      return;
    }
    Keyboard.dismiss();
    navigation.navigate('SaleOrder');
  };

  const cartRevision = useMemo(
    () =>
      pos.cart
        .map(
          line =>
            `${line.item_id}:${line.item_batch_id ?? 'main'}:${line.qty}`,
        )
        .join('|'),
    [pos.cart],
  );

  const handleAddItem = (item: InventoryItem) => {
    const added = pos.tryAddToCart(item, 1);
    if (added) {
      openOrder();
    }
  };

  const handleOpenBatchTable = (item: InventoryItem) => {
    Keyboard.dismiss();
    void pos.openBatchPicker(item, 1);
  };

  const listBottomInset =
    selectedCount > 0
      ? DOCK_CART_HEIGHT + TAB_BAR_SCROLL_PADDING + 16
      : TAB_BAR_SCROLL_PADDING + 16;

  return (
    <ScreenContainer swipeMode="off" style={styles.screen}>
      {pos.loading || pos.loadingReturnSale ? (
        <LoadingOverlay
          message={pos.loadingReturnSale ? 'Loading sale…' : 'Loading products…'}
        />
      ) : null}

      <View style={[styles.topArea, { paddingTop: insets.top + 8 }]}>
        <View style={styles.metaRow}>
          <View style={styles.metaTextCol}>
            <Text style={styles.metaTitle}>
              {pos.isReturn ? 'Return' : 'Menu'}
            </Text>
            {!pos.isReturn ? (
              <Text style={styles.metaSub} numberOfLines={1}>
                {pos.catalogScopeLabel}
              </Text>
            ) : null}
          </View>

          {!pos.isReturn ? (
            <Pressable
              onPress={() => navigation.navigate('HoldOrders')}
              style={styles.holdBtn}
              accessibilityRole="button"
              accessibilityLabel="Hold orders">
              <PauseCircle size={16} color={colors.text} />
              <Text style={styles.holdBtnText}>Hold</Text>
            </Pressable>
          ) : null}

          {pos.salesId ? (
            <View style={styles.saleBadge}>
              <Text style={styles.saleBadgeText}>#{pos.salesId}</Text>
            </View>
          ) : null}
        </View>

        <SaleModeToggle
          mode={pos.transactionMode}
          onChange={pos.switchTransactionMode}
          compact
        />

        {canBrowseItems ? (
          <PosCategoryBar
            categories={pos.categories}
            selectedCategoryId={pos.categoryId}
            selectedSubCategoryId={pos.subCategoryId}
            onSelectCategory={pos.setCategoryId}
            onSelectSubCategory={pos.setSubCategoryId}
          />
        ) : null}
        {pos.isReturn ? <ReturnSalePicker /> : null}
      </View>

      <View style={styles.flex}>
        <View style={styles.gridArea}>
          {!canBrowseItems ? (
            <Text style={styles.hint}>
              Select a sale bill or return without bill, then pick items below.
            </Text>
          ) : pos.canShowProducts ? (
            <PosProductGrid
              items={pos.displayItems}
              currency={currency}
              refreshing={pos.isReturn ? false : pos.itemsRefreshing}
              onRefresh={pos.isReturn ? () => {} : pos.refreshProducts}
              onAddItem={handleAddItem}
              onOpenOrder={() => openOrder()}
              onIncrementItem={item => pos.tryAddToCart(item, 1)}
              onRemoveItem={item =>
                pos.decrementDisplayCartQty(item, item.sale_line_batch_id ?? null)
              }
              onRemoveAll={item =>
                pos.removeDisplayFromCart(item, item.sale_line_batch_id ?? null)
              }
              onOpenBatches={
                pos.isReturn ? undefined : handleOpenBatchTable
              }
              batchItemIds={pos.batchItemIds}
              getCartQty={item =>
                item.return_line_key != null
                  ? pos.getCartLineQty(item.id, item.sale_line_batch_id ?? null)
                  : pos.getDisplayCartQty(item)
              }
              cartRevision={cartRevision}
              canSellItem={item => pos.canSellItem(item, 1).ok}
              ignoreStock={pos.isReturn}
              offerProductItemIds={pos.isReturn ? undefined : pos.offerProductItemIds}
              bottomInset={listBottomInset}
            />
          ) : (
            <Text style={styles.hint}>Loading inventory…</Text>
          )}
        </View>
      </View>

      <PosDockCartBar
        itemCount={pos.cart.length}
        qtySummary={cartQtySummary}
        total={pos.netAmount}
        currency={currency}
        actionLabel={pos.isReturn ? 'Return' : 'Next'}
        onPress={openOrder}
      />

      <PosBatchSelectModal
        visible={pos.batchPickerOpen}
        item={pos.batchPickerItem}
        batches={pos.batchPickerBatches}
        loading={pos.batchPickerLoading}
        error={pos.batchPickerError}
        currency={currency}
        branchLocation={pos.batchPickerItem?.location ?? pos.location}
        defaultQty={pos.batchPickerQty}
        allowNegativeInventory={pos.allowNegativeInventory}
        onClose={pos.closeBatchPicker}
        onSelectMainProduct={pos.addMainFromBatchPicker}
        onSelectBatch={pos.addBatchFromPicker}
      />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.backgroundAlt,
  },
  topArea: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 10,
    backgroundColor: colors.backgroundAlt,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaTextCol: {
    flex: 1,
    minWidth: 0,
  },
  metaTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
  },
  metaSub: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
    fontWeight: '600',
  },
  holdBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  holdBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.text,
  },
  saleBadge: {
    backgroundColor: colors.text,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  saleBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.textOnPrimary,
  },
  flex: {
    flex: 1,
  },
  gridArea: {
    flex: 1,
    paddingHorizontal: 4,
    paddingTop: 4,
    paddingBottom: 4,
  },
  hint: {
    textAlign: 'center',
    color: colors.textMuted,
    paddingVertical: 32,
    paddingHorizontal: 16,
  },
});
