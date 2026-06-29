import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  StyleSheet,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { ScrollView } from 'react-native-gesture-handler';
import { Box, Text, VStack, Pressable } from '@gluestack-ui/themed';
import { SmoothScrollView } from '@/components/common/SmoothScrollView';
import { ScreenContainer } from '@/components/common/ScreenContainer';
import { AppHeader } from '@/components/common/AppHeader';
import { FilterChips } from '@/components/common/FilterChips';
import { PosCategoryBar } from '@/components/sales/PosCategoryBar';
import { PrimaryButton } from '@/components/buttons/PrimaryButton';
import { LoadingOverlay } from '@/components/common/LoadingOverlay';
import { CurrencyTextInput } from '@/components/inputs/CurrencyTextInput';
import { usePosSettings } from '@/context/PosSettingsContext';
import { useErrorDialog } from '@/context/ErrorDialogContext';
import { useDataRefreshNotify } from '@/context/DataRefreshContext';
import { inventoryService } from '@/services/api/inventoryService';
import type { ProductsStackParamList } from '@/navigation/types';
import type { ItemPayload, ItemCategory } from '@/types/inventory';
import { Layers } from 'lucide-react-native';
import { typography, colors, appInputStyle, appInputPlaceholderColor } from '@/theme';

const UOM_PRESETS = ['Pcs', 'Kg', 'Ltr', 'Box', 'Pkt', 'Doz'];

type Nav = NativeStackNavigationProp<ProductsStackParamList, 'ItemForm'>;
type Route = RouteProp<ProductsStackParamList, 'ItemForm'>;

const KEYBOARD_SCROLL_PADDING = 320;

const Label: React.FC<{ children: string }> = ({ children }) => (
  <Text style={[typography.label, { color: colors.textSecondary, marginBottom: 6, marginTop: 12 }]}>
    {children}
  </Text>
);

export const ItemFormScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const insets = useSafeAreaInsets();
  const { currency } = usePosSettings();
  const { showErrorFromUnknown, showConfirm } = useErrorDialog();
  const notifyRefresh = useDataRefreshNotify();
  const scrollRef = useRef<ScrollView>(null);
  const itemId = route.params?.itemId != null ? Number(route.params.itemId) : undefined;
  const isEdit = itemId != null && !Number.isNaN(itemId);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [keyboardPadding, setKeyboardPadding] = useState(0);
  const [itemNumber, setItemNumber] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('Main Location');
  const [productType, setProductType] = useState('Retail');
  const [sellingPrice, setSellingPrice] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [qty, setQty] = useState('0');
  const [reorderQty, setReorderQty] = useState('0');
  const [uom, setUom] = useState('Pcs');
  const [sku, setSku] = useState('');
  const [defaultDiscount, setDefaultDiscount] = useState('0');
  const [defaultDiscountType, setDefaultDiscountType] = useState<'percent' | 'amount'>('percent');
  const [maxDiscount, setMaxDiscount] = useState('0');
  const [locations, setLocations] = useState<string[]>(['Main Location']);
  const [productTypes, setProductTypes] = useState<string[]>(['Retail']);
  const [categories, setCategories] = useState<ItemCategory[]>([]);
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [subCategoryId, setSubCategoryId] = useState<number | 'all'>('all');

  const scrollToFocusedField = useCallback(() => {
    requestAnimationFrame(() => {
      setTimeout(() => {
        scrollRef.current?.scrollToEnd({ animated: true });
      }, Platform.OS === 'android' ? 120 : 60);
    });
  }, []);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, event => {
      setKeyboardPadding(event.endCoordinates.height + 24);
      scrollToFocusedField();
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardPadding(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [scrollToFocusedField]);

  const loadCategories = async (loc: string) => {
    try {
      const cats = await inventoryService.getCategories({
        location: loc && loc !== 'all' ? loc : undefined,
      });
      setCategories(cats);
    } catch {
      setCategories([]);
    }
  };

  useEffect(() => {
    loadCategories(location);
  }, [location]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const list = await inventoryService.list();
        if (cancelled) {
          return;
        }
        setLocations(
          list.filters.locations.length ? list.filters.locations : ['Main Location'],
        );
        setProductTypes(
          list.filters.product_types.length ? list.filters.product_types : ['Retail'],
        );

        if (isEdit && itemId) {
          const item = await inventoryService.getItem(itemId);
          if (cancelled) {
            return;
          }
          setItemNumber(item.item_number ?? '');
          setDescription(item.description);
          setLocation(item.location ?? 'Main Location');
          setProductType(item.product_type ?? 'Retail');
          setSellingPrice(String(item.selling_price ?? 0));
          setPurchasePrice(String(item.purchase_price ?? 0));
          setQty(String(item.qty ?? 0));
          setReorderQty(String(item.reorder_qty ?? 0));
          setUom(item.uom ?? 'Pcs');
          setSku(item.sku ?? '');
          setDefaultDiscount(String(item.default_discount ?? 0));
          setDefaultDiscountType(
            item.default_discount_type === 'amount' ? 'amount' : 'percent',
          );
          setMaxDiscount(String(item.max_discount ?? 0));

          const cats = await inventoryService.getCategories({
            location: item.location ?? undefined,
          });
          if (cancelled) {
            return;
          }
          setCategories(cats);

          if (item.item_category_id != null) {
            setCategoryId(item.item_category_id);
            setSubCategoryId(item.item_sub_category_id ?? 'all');
          } else if (item.category) {
            const cat = cats.find(
              c => c.name.toLowerCase() === item.category!.toLowerCase(),
            );
            if (cat) {
              setCategoryId(cat.id);
              const sub = cat.sub_categories.find(
                s =>
                  item.sub_category &&
                  s.name.toLowerCase() === item.sub_category.toLowerCase(),
              );
              setSubCategoryId(sub?.id ?? 'all');
            } else {
              setCategoryId(null);
              setSubCategoryId('all');
            }
          } else {
            setCategoryId(null);
            setSubCategoryId('all');
          }
        } else {
          const nextNo = await inventoryService.getNextItemNumber();
          if (cancelled) {
            return;
          }
          setItemNumber(nextNo);
          const loc =
            list.filters.locations.find(l => l === 'Main Location') ??
            list.filters.locations[0] ??
            'Main Location';
          setLocation(loc);
          setProductType(list.filters.product_types[0] ?? 'Retail');
          setCategoryId(null);
          setSubCategoryId('all');
        }
      } catch (e) {
        if (!cancelled) {
          showErrorFromUnknown(e, isEdit ? 'Modify item' : 'Add item');
          if (!isEdit) {
            navigation.goBack();
          }
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isEdit, itemId, navigation, showErrorFromUnknown]);

  const buildPayload = (): ItemPayload => {
    const activeCategory = categories.find(c => c.id === categoryId);
    const activeSub =
      subCategoryId === 'all' || !activeCategory
        ? null
        : activeCategory.sub_categories.find(s => s.id === subCategoryId);

    const discountType =
      defaultDiscountType === 'amount' ? 'amount' : 'percent';

    return {
      item_number: itemNumber.trim() || undefined,
      auto_generate_item_number: isEdit ? false : !itemNumber.trim(),
      description: description.trim(),
      location,
      product_type: productType,
      item_category_id: categoryId,
      item_sub_category_id: activeSub?.id ?? null,
      category: activeCategory?.name ?? null,
      sub_category: activeSub?.name ?? null,
      selling_price: parseFloat(sellingPrice) || 0,
      purchase_price: parseFloat(purchasePrice) || 0,
      default_discount: parseFloat(defaultDiscount) || 0,
      default_discount_type: discountType,
      max_discount: parseFloat(maxDiscount) || 0,
      qty: parseFloat(qty) || 0,
      reorder_qty: parseFloat(reorderQty) || 0,
      uom: uom.trim() || 'Pcs',
      sku: sku.trim() || null,
      track_with_inventory: true,
      is_active: true,
    };
  };

  const handleSave = async () => {
    if (!description.trim()) {
      showErrorFromUnknown(new Error('Description is required'), 'Item');
      return;
    }
    setSubmitting(true);
    try {
      const payload = buildPayload();
      if (isEdit && itemId) {
        await inventoryService.updateItem(itemId, payload);
      } else {
        await inventoryService.createItem(payload);
      }
      notifyRefresh(['inventory', 'dashboard', 'sales', 'reports']);
      showConfirm({
        title: isEdit ? 'Item updated' : 'Item added',
        message: 'Inventory has been saved to the server.',
        confirmLabel: 'OK',
        onConfirm: () => navigation.goBack(),
      });
    } catch (e) {
      showErrorFromUnknown(e, isEdit ? 'Modify item' : 'Add item');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <ScreenContainer>
        <AppHeader title={isEdit ? 'Modify item' : 'Add item'} showBack />
        <LoadingOverlay message="Loading…" />
      </ScreenContainer>
    );
  }

  const bottomPad = Math.max(keyboardPadding, KEYBOARD_SCROLL_PADDING);

  return (
    <ScreenContainer>
      <AppHeader title={isEdit ? 'Modify item' : 'Add item'} showBack />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top + 56 : 0}>
        <SmoothScrollView
          ref={scrollRef}
          contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad }]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}>
          <VStack px="$5" pb="$4">
            <Label>Item number</Label>
            <TextInput
              value={itemNumber}
              onChangeText={setItemNumber}
              style={appInputStyle}
              placeholder="Auto-generated if empty"
              placeholderTextColor={appInputPlaceholderColor}
              editable={!submitting}
              onFocus={scrollToFocusedField}
            />

            <Label>Description *</Label>
            <TextInput
              value={description}
              onChangeText={setDescription}
              style={appInputStyle}
              placeholder="Product name"
              placeholderTextColor={appInputPlaceholderColor}
              editable={!submitting}
              onFocus={scrollToFocusedField}
            />

            <Label>Location</Label>
            <FilterChips
              options={locations}
              selected={location}
              onSelect={nextLocation => {
                setLocation(nextLocation);
                setCategoryId(null);
                setSubCategoryId('all');
              }}
            />

            <PosCategoryBar
              categories={categories}
              selectedCategoryId={categoryId}
              selectedSubCategoryId={subCategoryId}
              onSelectCategory={setCategoryId}
              onSelectSubCategory={setSubCategoryId}
            />

            <Label>Product type</Label>
            <FilterChips
              options={productTypes}
              selected={productType}
              onSelect={setProductType}
            />

            <Label>Selling price</Label>
            <CurrencyTextInput
              currency={currency}
              value={sellingPrice}
              onChangeText={setSellingPrice}
              editable={!submitting}
              onFocus={scrollToFocusedField}
            />

            <Label>Purchase price</Label>
            <CurrencyTextInput
              currency={currency}
              value={purchasePrice}
              onChangeText={setPurchasePrice}
              editable={!submitting}
              onFocus={scrollToFocusedField}
            />

            <Label>Quantity on hand</Label>
            <TextInput
              value={qty}
              onChangeText={setQty}
              keyboardType="decimal-pad"
              style={appInputStyle}
              placeholder="0"
              placeholderTextColor={appInputPlaceholderColor}
              editable={!submitting}
              onFocus={scrollToFocusedField}
            />

            <Label>Reorder level</Label>
            <TextInput
              value={reorderQty}
              onChangeText={setReorderQty}
              keyboardType="decimal-pad"
              style={appInputStyle}
              placeholder="0"
              placeholderTextColor={appInputPlaceholderColor}
              editable={!submitting}
              onFocus={scrollToFocusedField}
            />

            <Label>Unit of measure (UOM)</Label>
            <Text size="xs" color={colors.textMuted} mb="$2">
              Shown on sales/purchase orders and printed receipts.
            </Text>
            <FilterChips
              options={UOM_PRESETS}
              selected={UOM_PRESETS.includes(uom) ? uom : ''}
              onSelect={value => setUom(value)}
              showAllOption={false}
            />
            <TextInput
              value={uom}
              onChangeText={setUom}
              style={appInputStyle}
              placeholder="Pcs"
              placeholderTextColor={appInputPlaceholderColor}
              editable={!submitting}
              onFocus={scrollToFocusedField}
            />

            <Label>SKU</Label>
            <TextInput
              value={sku}
              onChangeText={setSku}
              style={appInputStyle}
              placeholder="Optional barcode / SKU"
              placeholderTextColor={appInputPlaceholderColor}
              editable={!submitting}
              autoCapitalize="characters"
              autoCorrect={false}
              onFocus={scrollToFocusedField}
            />

            <Box mt="$6">
              {isEdit && itemId ? (
                <Pressable
                  onPress={() => navigation.navigate('ItemBatches', { itemId })}
                  mb="$4"
                  borderRadius="$xl"
                  borderWidth={1}
                  borderColor={colors.primaryMuted}
                  bg={colors.primarySoft}
                  px="$4"
                  py="$3"
                  flexDirection="row"
                  alignItems="center"
                  gap="$2">
                  <Layers size={18} color={colors.primary} />
                  <VStack flex={1}>
                    <Text fontWeight="$bold" color={colors.primaryDeep}>
                      Stock & batches
                    </Text>
                    <Text size="xs" color={colors.textSecondary}>
                      View unbatched stock, batch qty, and expiry
                    </Text>
                  </VStack>
                </Pressable>
              ) : null}
              <PrimaryButton
                label={submitting ? 'Saving…' : isEdit ? 'Save changes' : 'Add item'}
                onPress={handleSave}
                loading={submitting}
              />
            </Box>
          </VStack>
        </SmoothScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
    paddingTop: 4,
  },
});
