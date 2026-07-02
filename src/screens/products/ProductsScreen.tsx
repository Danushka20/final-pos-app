import React, { useEffect } from 'react';
import { RefreshControl, TextInput } from 'react-native';
import { Box, HStack, Pressable, Text, VStack } from '@gluestack-ui/themed';
import { SmoothFlatList } from '@/components/common/SmoothFlatList';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Package, SlidersHorizontal, Truck } from 'lucide-react-native';
import { ScreenContainer } from '@/components/common/ScreenContainer';
import { AppHeader } from '@/components/common/AppHeader';
import { PosCategoryBar } from '@/components/sales/PosCategoryBar';
import { LoadingOverlay } from '@/components/common/LoadingOverlay';
import { useErrorDialog } from '@/context/ErrorDialogContext';
import { usePosSettings } from '@/context/PosSettingsContext';
import { useInventory } from '@/hooks/useInventory';
import { formatCurrency } from '@/utils/format';
import { colors, appInputStyle, appInputPlaceholderColor, TAB_BAR_SCROLL_PADDING, shadows } from '@/theme';
import type { ProductsStackParamList } from '@/navigation/types';
import type { InventoryItem } from '@/types/sales';

type Nav = NativeStackNavigationProp<ProductsStackParamList, 'ProductsList'>;

export const ProductsScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const { showError } = useErrorDialog();
  const { currency } = usePosSettings();
  const inv = useInventory();

  useEffect(() => {
    if (inv.error) {
      showError({ title: 'Inventory', message: inv.error });
    }
  }, [inv.error, showError]);

  const selectedCategoryId =
    inv.categoryId === 'all' ? null : inv.categoryId;

  const renderItem = ({ item }: { item: InventoryItem }) => (
    <Pressable
      mx="$4"
      mb="$3"
      bg={colors.white}
      borderRadius="$2xl"
      p="$4"
      borderWidth={1}
      borderColor={colors.border}
      style={shadows.card}
      onPress={() => navigation.push('ItemForm', { itemId: Number(item.id) })}
      accessibilityLabel={`Modify ${item.description}`}>
      <HStack justifyContent="space-between" alignItems="flex-start">
        <VStack flex={1} pr="$2">
          <Text fontWeight="$bold" color={colors.text}>
            {item.description}
          </Text>
          <Text size="xs" color={colors.textMuted} mt="$0.5">
            ID {item.item_number || item.id}
            {item.sku ? ` · SKU ${item.sku}` : ''}
            {item.product_type ? ` · ${item.product_type}` : ''}
            {item.category ? ` · ${item.category}` : ''}
            {item.sub_category ? ` / ${item.sub_category}` : ''}
          </Text>
          <Text size="xs" color={colors.textMuted}>
            {item.location ?? '—'}
          </Text>
        </VStack>
        <VStack alignItems="flex-end">
          <Text fontWeight="$bold" color={colors.text}>
            {formatCurrency(item.selling_price, currency)}
          </Text>
          <Text
            size="xs"
            color={
              (item.qty ?? 0) <= 0 ? colors.error : colors.textSecondary
            }
            mt="$0.5">
            Qty {item.qty ?? 0} {item.uom ?? ''}
            {(item.has_batches || (item.batch_count ?? 0) > 0)
              ? ` · ${item.batch_count ?? 0} batch${(item.batch_count ?? 0) === 1 ? '' : 'es'}`
              : ''}
          </Text>
        </VStack>
      </HStack>
    </Pressable>
  );

  const listHeader = (
    <Box px="$4" pb="$2" gap="$2" pt="$1">
      {inv.categories.length > 0 ? (
        <PosCategoryBar
          categories={inv.categories}
          selectedCategoryId={selectedCategoryId}
          selectedSubCategoryId={inv.subCategoryId}
          onSelectCategory={id => inv.setCategoryId(id ?? 'all')}
          onSelectSubCategory={inv.setSubCategoryId}
        />
      ) : null}
      <TextInput
        placeholder="Search inventory…"
        value={inv.search}
        onChangeText={inv.setSearch}
        style={appInputStyle}
        placeholderTextColor={appInputPlaceholderColor}
      />
    </Box>
  );

  return (
    <ScreenContainer enableTabSwipe>
      <AppHeader
        title="Inventory"
        rightSlot={
          <HStack alignItems="center" gap="$1">
            <Pressable
              onPress={() => navigation.navigate('InventoryActivity')}
              p="$2"
              accessibilityLabel="Inventory activity">
              <SlidersHorizontal size={22} color={colors.text} />
            </Pressable>
            <Pressable
              onPress={() => navigation.navigate('PurchasesList')}
              p="$2"
              accessibilityLabel="Purchases">
              <Truck size={22} color={colors.text} />
            </Pressable>
          </HStack>
        }
      />

      {inv.loading ? <LoadingOverlay message="Loading inventory…" /> : null}

      <SmoothFlatList
        data={inv.items}
        keyExtractor={item => String(item.id)}
        renderItem={renderItem}
        ListHeaderComponent={listHeader}
        contentContainerStyle={{ paddingBottom: TAB_BAR_SCROLL_PADDING, paddingTop: 4 }}
        refreshControl={
          <RefreshControl refreshing={inv.loading} onRefresh={inv.refresh} />
        }
        ListEmptyComponent={
          !inv.loading ? (
            <Box alignItems="center" py="$10">
              <Package size={40} color={colors.textMuted} />
              <Text color={colors.textMuted} mt="$2">
                No items found
              </Text>
            </Box>
          ) : null
        }
      />
    </ScreenContainer>
  );
};
