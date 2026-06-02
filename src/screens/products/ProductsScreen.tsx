import React, { useEffect } from 'react';
import { RefreshControl, TextInput, TouchableOpacity } from 'react-native';
import { Box, HStack, Pressable, Text, VStack } from '@gluestack-ui/themed';
import { SmoothFlatList } from '@/components/common/SmoothFlatList';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Package, Truck } from 'lucide-react-native';
import { ScreenContainer } from '@/components/common/ScreenContainer';
import { AppHeader } from '@/components/common/AppHeader';
import { FilterChips } from '@/components/common/FilterChips';
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

  const categoryOptions = inv.categories.map(c => c.name);

  const renderItem = ({ item }: { item: InventoryItem }) => (
    <Box
      mx="$4"
      mb="$3"
      bg={colors.white}
      borderRadius="$2xl"
      p="$4"
      borderWidth={1}
      borderColor={colors.border}
      style={shadows.card}>
      <HStack justifyContent="space-between" alignItems="flex-start">
        <VStack flex={1} pr="$2">
          <Text fontWeight="$bold" color={colors.text}>
            {item.description}
          </Text>
          <Text size="xs" color={colors.textMuted} mt="$0.5">
            ID {item.item_number || item.id}
            {item.sku ? ` · SKU ${item.sku}` : ''}
            {item.category ? ` · ${item.category}` : ''}
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
          </Text>
        </VStack>
      </HStack>
    </Box>
  );

  return (
    <ScreenContainer enableTabSwipe>
      <AppHeader
        title="Inventory"
        rightSlot={
          <TouchableOpacity
            onPress={() => navigation.navigate('PurchasesList')}
            style={{ padding: 8 }}>
            <Truck size={22} color={colors.text} />
          </TouchableOpacity>
        }
      />

      {inv.loading ? <LoadingOverlay message="Loading inventory…" /> : null}

      <Box px="$4" pb="$2" gap="$2">
        <FilterChips
          label="Branch / Area"
          options={inv.filters.locations}
          selected={inv.location}
          onSelect={inv.setLocation}
        />
        <FilterChips
          label="Product type"
          options={inv.filters.product_types}
          selected={inv.productType}
          onSelect={inv.setProductType}
        />
        {categoryOptions.length > 0 ? (
          <FilterChips
            label="Category"
            options={categoryOptions}
            selected={
              inv.categoryId === 'all'
                ? 'all'
                : (inv.categories.find(c => c.id === inv.categoryId)?.name ??
                  'all')
            }
            onSelect={name => {
              if (name === 'all') {
                inv.setCategoryId('all');
              } else {
                const cat = inv.categories.find(c => c.name === name);
                inv.setCategoryId(cat?.id ?? 'all');
              }
            }}
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

      <SmoothFlatList
        data={inv.items}
        keyExtractor={item => String(item.id)}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: TAB_BAR_SCROLL_PADDING, paddingTop: 8 }}
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
