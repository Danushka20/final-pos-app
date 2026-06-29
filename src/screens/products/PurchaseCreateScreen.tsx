import React, { useEffect, useMemo } from 'react';
import { TextInput } from 'react-native';
import { Box, Text } from '@gluestack-ui/themed';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ScreenContainer } from '@/components/common/ScreenContainer';
import { AppHeader } from '@/components/common/AppHeader';
import { LoadingOverlay } from '@/components/common/LoadingOverlay';
import { PosCategoryBar } from '@/components/sales/PosCategoryBar';
import { PosProductGrid } from '@/components/sales/PosProductGrid';
import { FloatingCartFab } from '@/components/sales/FloatingCartFab';
import { useErrorDialog } from '@/context/ErrorDialogContext';
import { usePurchaseCreateContext } from '@/context/PurchaseCreateContext';
import { usePosSettings } from '@/context/PosSettingsContext';
import {
  colors,
  appInputStyle,
  appInputPlaceholderColor,
  FLOATING_FAB_HEIGHT,
  TAB_BAR_SCROLL_PADDING,
} from '@/theme';
import type { ProductsStackParamList } from '@/navigation/types';

const FLOATING_CART_HEIGHT = FLOATING_FAB_HEIGHT + 20;

type Nav = NativeStackNavigationProp<ProductsStackParamList, 'PurchaseCreate'>;

export const PurchaseCreateScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const { showError } = useErrorDialog();
  const { currency } = usePosSettings();
  const purchase = usePurchaseCreateContext();
  const { error: purchaseError, setError: setPurchaseError } = purchase;

  useEffect(() => {
    if (purchaseError) {
      showError({ title: 'Purchase', message: purchaseError });
      setPurchaseError(null);
    }
  }, [purchaseError, setPurchaseError, showError]);

  const selectedCount = useMemo(
    () => purchase.cart.reduce((n, line) => n + line.qty, 0),
    [purchase.cart],
  );

  const openOrder = () => {
    if (purchase.cart.length === 0) {
      showError({
        title: 'Purchase',
        message: 'Select at least one product',
        variant: 'warning',
      });
      return;
    }
    navigation.navigate('PurchaseOrder');
  };

  const cartRevision = useMemo(
    () => purchase.cart.map(line => `${line.item_id}:${line.qty}`).join('|'),
    [purchase.cart],
  );

  const gridBottomInset =
    selectedCount > 0
      ? FLOATING_CART_HEIGHT + TAB_BAR_SCROLL_PADDING + 12
      : TAB_BAR_SCROLL_PADDING + 12;

  return (
    <ScreenContainer swipeMode="off">
      <AppHeader
        title="New purchase"
        subtitle={`#${purchase.invoiceId || '…'} · All products`}
        showBack
      />

      {purchase.loading ? <LoadingOverlay message="Loading products…" /> : null}

      <Box px="$3" pb="$1" flex={1}>
        <PosCategoryBar
          categories={purchase.categories}
          selectedCategoryId={purchase.categoryId}
          selectedSubCategoryId={purchase.subCategoryId}
          onSelectCategory={purchase.setCategoryId}
          onSelectSubCategory={purchase.setSubCategoryId}
        />
        <TextInput
          placeholder="Search code, name, SKU…"
          value={purchase.searchQuery}
          onChangeText={purchase.setSearchQuery}
          style={{ ...appInputStyle, marginTop: 8 }}
          placeholderTextColor={appInputPlaceholderColor}
        />

        <Box flex={1} minHeight={100} mt="$1">
          {!purchase.loading ? (
            <PosProductGrid
              items={purchase.displayItems}
              currency={currency}
              refreshing={false}
              onRefresh={purchase.refresh}
              onAddItem={item => purchase.toggleCartItem(item)}
              onRemoveItem={item => purchase.decrementCartQty(item.id)}
              onRemoveAll={item => purchase.removeFromCart(item.id)}
              getCartQty={item => purchase.getCartQty(item.id)}
              cartRevision={cartRevision}
              getDisplayPrice={purchase.getDisplayPrice}
              ignoreStock
              bottomInset={gridBottomInset}
            />
          ) : (
            <Text textAlign="center" color={colors.textMuted} py="$8">
              Loading inventory…
            </Text>
          )}
        </Box>
      </Box>

      <FloatingCartFab
        variant="purchase"
        itemCount={selectedCount}
        total={purchase.netAmount}
        currency={currency}
        onPress={openOrder}
      />
    </ScreenContainer>
  );
};
