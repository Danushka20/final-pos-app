import React, { useEffect, useMemo } from 'react';
import { Keyboard, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ScreenContainer } from '@/components/common/ScreenContainer';
import { LoadingOverlay } from '@/components/common/LoadingOverlay';
import { PosCategoryBar } from '@/components/sales/PosCategoryBar';
import { PosSalesHeader } from '@/components/sales/PosSalesHeader';
import { SaleModeToggle } from '@/components/sales/SaleModeToggle';
import { ReturnSalePicker } from '@/components/sales/ReturnSalePicker';
import { PosProductGrid } from '@/components/sales/PosProductGrid';
import { FloatingCartFab } from '@/components/sales/FloatingCartFab';
import { useErrorDialog } from '@/context/ErrorDialogContext';
import { usePosSaleContext } from '@/context/PosSaleContext';
import { usePosSettings } from '@/context/PosSettingsContext';
import { colors, FLOATING_FAB_HEIGHT, TAB_BAR_SCROLL_PADDING } from '@/theme';
import type { SalesStackParamList } from '@/navigation/types';

const FLOATING_CART_HEIGHT = FLOATING_FAB_HEIGHT + 20;

type Nav = NativeStackNavigationProp<SalesStackParamList, 'SalesPOS'>;

export const SalesScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const { showError } = useErrorDialog();
  const { currency } = usePosSettings();
  const pos = usePosSaleContext();

  useEffect(() => {
    if (pos.error) {
      showError({ title: 'POS', message: pos.error });
      pos.setError(null);
    }
  }, [pos.error, pos.setError, showError]);

  const selectedCount = useMemo(
    () => pos.cart.reduce((n, line) => n + line.qty, 0),
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
    () => pos.cart.map(line => `${line.item_id}:${line.qty}`).join('|'),
    [pos.cart],
  );

  const listBottomInset =
    selectedCount > 0
      ? FLOATING_CART_HEIGHT + TAB_BAR_SCROLL_PADDING + 12
      : TAB_BAR_SCROLL_PADDING + 12;

  return (
    <ScreenContainer swipeMode="off">
      <PosSalesHeader
        title={pos.isReturn ? 'Return' : 'Items'}
        badge={pos.salesId ? `#${pos.salesId}` : undefined}
      />

      {pos.loading || pos.loadingReturnSale ? (
        <LoadingOverlay
          message={pos.loadingReturnSale ? 'Loading sale…' : 'Loading products…'}
        />
      ) : null}

      <View style={styles.flex}>
        <View style={styles.filtersBlock}>
          <SaleModeToggle
            mode={pos.transactionMode}
            onChange={pos.switchTransactionMode}
            compact
          />
          {pos.isReturn ? <ReturnSalePicker /> : null}

          {canBrowseItems ? (
            <>
              <PosCategoryBar
                categories={pos.categories}
                selectedCategoryId={pos.categoryId}
                selectedSubCategoryId={pos.subCategoryId}
                onSelectCategory={pos.setCategoryId}
                onSelectSubCategory={pos.setSubCategoryId}
              />
              {selectedCount > 0 ? (
                <Text style={styles.tip}>
                  Wrong item? Tap − on the card, or open Order to edit.
                </Text>
              ) : null}
            </>
          ) : null}
        </View>

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
              onAddItem={item => pos.tryAddToCart(item, 1)}
              onRemoveItem={item => pos.decrementCartQty(item.id)}
              onRemoveAll={item => pos.removeFromCart(item.id)}
              getCartQty={pos.getCartQty}
              cartRevision={cartRevision}
              canSellItem={item => pos.canSellItem(item, 1).ok}
              ignoreStock={pos.isReturn}
              bottomInset={listBottomInset}
            />
          ) : (
            <Text style={styles.hint}>Loading inventory…</Text>
          )}
        </View>
      </View>

      <FloatingCartFab
        itemCount={selectedCount}
        total={pos.netAmount}
        currency={currency}
        isReturn={pos.isReturn}
        onPress={openOrder}
      />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  filtersBlock: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 8,
    backgroundColor: colors.backgroundAlt,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 4,
  },
  gridArea: {
    flex: 1,
    paddingHorizontal: 4,
    paddingTop: 6,
    paddingBottom: 4,
  },
  hint: {
    textAlign: 'center',
    color: colors.textMuted,
    paddingVertical: 32,
    paddingHorizontal: 16,
  },
  tip: {
    textAlign: 'center',
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
    paddingTop: 4,
    paddingBottom: 2,
  },
});
