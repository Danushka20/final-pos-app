import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshControl, TextInput } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { Box, Pressable, Text } from '@gluestack-ui/themed';
import { Package } from 'lucide-react-native';
import { SmoothFlatList } from '@/components/common/SmoothFlatList';
import { ScreenContainer } from '@/components/common/ScreenContainer';
import { AppHeader } from '@/components/common/AppHeader';
import { LoadingOverlay } from '@/components/common/LoadingOverlay';
import { useErrorDialog } from '@/context/ErrorDialogContext';
import { useAutoRefresh } from '@/hooks/useAutoRefresh';
import { inventoryService } from '@/services/api/inventoryService';
import type { ProductsStackParamList } from '@/navigation/types';
import type { InventoryItem } from '@/types/sales';
import type { ItemSelectAction } from '@/types/inventory';
import { colors, appInputStyle, appInputPlaceholderColor, TAB_BAR_SCROLL_PADDING, shadows } from '@/theme';

type Nav = NativeStackNavigationProp<ProductsStackParamList, 'ItemSelect'>;
type Route = RouteProp<ProductsStackParamList, 'ItemSelect'>;

const TITLES: Record<ItemSelectAction, string> = {
  modify: 'Select item to modify',
  adjust: 'Select item to adjust',
  history: 'Select item for activity',
  batches: 'Select item for stock & batches',
};

export const ItemSelectScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Route>();
  const { showErrorFromUnknown } = useErrorDialog();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [search, setSearch] = useState('');

  const load = useCallback(async (silent = false) => {
    if (!silent) {
      setLoading(true);
    }
    try {
      const list = await inventoryService.list();
      setItems(list.items);
    } catch (e) {
      if (!silent) {
        showErrorFromUnknown(e, 'Inventory');
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, [showErrorFromUnknown]);

  useEffect(() => {
    load(false);
  }, [load]);

  useAutoRefresh({
    onRefresh: silent => load(silent),
    scopes: ['inventory', 'sales', 'purchases'],
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) {
      return items;
    }
    return items.filter(
      item =>
        item.description.toLowerCase().includes(q) ||
        String(item.item_number ?? '').toLowerCase().includes(q) ||
        String(item.sku ?? '').toLowerCase().includes(q),
    );
  }, [items, search]);

  const onSelect = (item: InventoryItem) => {
    switch (params.action) {
      case 'modify':
        navigation.push('ItemForm', { itemId: Number(item.id) });
        break;
      case 'adjust':
        navigation.navigate('StockAdjustment', { itemId: item.id });
        break;
      case 'history':
        navigation.navigate('ItemHistory', { itemId: item.id });
        break;
      case 'batches':
        navigation.navigate('ItemBatches', { itemId: item.id });
        break;
      default:
        break;
    }
  };

  return (
    <ScreenContainer>
      <AppHeader title={TITLES[params.action]} showBack />

      {loading && !items.length ? <LoadingOverlay message="Loading items…" /> : null}

      <Box px="$4" pb="$2">
        <TextInput
          placeholder="Search by name or item number…"
          value={search}
          onChangeText={setSearch}
          style={appInputStyle}
          placeholderTextColor={appInputPlaceholderColor}
        />
      </Box>

      <SmoothFlatList
        data={filtered}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={{ paddingBottom: TAB_BAR_SCROLL_PADDING, paddingTop: 8 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
        renderItem={({ item }) => (
          <Pressable
            mx="$4"
            mb="$3"
            bg={colors.white}
            borderRadius="$2xl"
            p="$4"
            borderWidth={1}
            borderColor={colors.border}
            style={shadows.card}
            onPress={() => onSelect(item)}>
            <Text fontWeight="$bold" color={colors.text}>
              {item.description}
            </Text>
            <Text size="xs" color={colors.textMuted} mt="$0.5">
              {item.item_number ? `#${item.item_number}` : `ID ${item.id}`}
              {item.location ? ` · ${item.location}` : ''}
            </Text>
            <Text size="xs" color={colors.textSecondary} mt="$1">
              Qty {item.qty ?? 0} {item.uom ?? ''}
              {(item.has_batches || (item.batch_count ?? 0) > 0)
                ? ` · ${item.batch_count ?? 0} batch${(item.batch_count ?? 0) === 1 ? '' : 'es'}`
                : ''}
            </Text>
          </Pressable>
        )}
        ListEmptyComponent={
          !loading ? (
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
