import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
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
import {
  getStoredItemImage,
  itemImageKey,
  pickItemPhotoFromGallery,
  removeItemImage,
  saveItemImage,
  toFileUri,
} from '@/services/storage/itemImageStorage';
import type { ProductsStackParamList } from '@/navigation/types';
import type { ItemPayload, ItemCategory } from '@/types/inventory';
import {
  deriveCategoriesFromItems,
  mergeCategoryLists,
} from '@/utils/inventoryCategoryUtils';
import { Camera, Layers, Trash2 } from 'lucide-react-native';
import { typography, colors, appInputStyle, appInputPlaceholderColor } from '@/theme';

const UOM_PRESETS = ['Pcs', 'Kg', 'Ltr', 'Box', 'Pkt', 'Doz'];

/** Real branch names only — "all" is a catalog filter, not a stock location. */
const branchLocationOptions = (rows: string[]): string[] => {
  const cleaned = rows
    .map(l => l?.trim())
    .filter((l): l is string => Boolean(l && l.toLowerCase() !== 'all'));
  return cleaned.length > 0 ? cleaned : ['Main Location'];
};

const defaultBranchLocation = (rows: string[]): string =>
  branchLocationOptions(rows).find(l => l === 'Main Location') ??
  branchLocationOptions(rows)[0] ??
  'Main Location';

type Nav = NativeStackNavigationProp<ProductsStackParamList, 'ItemForm'>;
type Route = RouteProp<ProductsStackParamList, 'ItemForm'>;

/** Room below the last field so it clears the keyboard while typing */
const KEYBOARD_SCROLL_PADDING = 140;

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
  const itemId = route.params?.itemId != null ? Number(route.params.itemId) : undefined;
  const isEdit = itemId != null && !Number.isNaN(itemId);

  const scrollRef = useRef<ScrollView>(null);
  const scrollOffsetY = useRef(0);
  const keyboardTopY = useRef<number | null>(null);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
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
  /** file:// URI shown in the preview (stored photo or a freshly picked one) */
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  /** Newly picked photo waiting to be copied to phone storage on save */
  const [pendingPhotoUri, setPendingPhotoUri] = useState<string | null>(null);
  const [photoRemoved, setPhotoRemoved] = useState(false);

  /**
   * Scroll just enough to keep the focused input above the keyboard.
   * Does nothing when the field is already visible (no over-scrolling).
   */
  const ensureFocusedInputVisible = useCallback(() => {
    const input = TextInput.State.currentlyFocusedInput();
    const keyboardTop = keyboardTopY.current;
    if (!input || keyboardTop == null) {
      return;
    }
    requestAnimationFrame(() => {
      input.measureInWindow((_x, y, _w, h) => {
        const statusBar = Platform.OS === 'android' ? StatusBar.currentHeight ?? 0 : 0;
        const inputBottom = y + statusBar + h;
        const visibleLimit = keyboardTop - 20;
        if (inputBottom > visibleLimit) {
          scrollRef.current?.scrollTo({
            y: Math.max(0, scrollOffsetY.current + (inputBottom - visibleLimit)),
            animated: true,
          });
        }
      });
    });
  }, []);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, event => {
      keyboardTopY.current = event.endCoordinates.screenY;
      // Two passes: the first right after the keyboard settles, the second
      // after KeyboardAvoidingView padding has rendered — bottom fields (SKU)
      // need that space before the scroll can reach them.
      setTimeout(ensureFocusedInputVisible, Platform.OS === 'android' ? 90 : 40);
      setTimeout(ensureFocusedInputVisible, 300);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      keyboardTopY.current = null;
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [ensureFocusedInputVisible]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const [list, categoryResult] = await Promise.all([
          inventoryService.list(),
          inventoryService.getCategories({ location: 'all' }),
        ]);
        if (cancelled) {
          return;
        }
        const allCategories = mergeCategoryLists(
          categoryResult,
          deriveCategoriesFromItems(list.items),
        );
        setLocations(branchLocationOptions(list.filters.locations));
        setProductTypes(
          list.filters.product_types.length ? list.filters.product_types : ['Retail'],
        );
        setCategories(allCategories);

        if (isEdit && itemId) {
          const item = await inventoryService.getItem(itemId);
          if (cancelled) {
            return;
          }
          setItemNumber(item.item_number ?? '');
          setDescription(item.description);
          setLocation(
            item.location && item.location.toLowerCase() !== 'all'
              ? item.location
              : defaultBranchLocation(list.filters.locations),
          );
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

          const storedPhoto = await getStoredItemImage(
            itemImageKey({ item_number: item.item_number, id: itemId }),
          );
          if (!cancelled && storedPhoto) {
            setPhotoUri(toFileUri(storedPhoto));
          }

          if (item.item_category_id != null) {
            setCategoryId(item.item_category_id);
            setSubCategoryId(item.item_sub_category_id ?? 'all');
          } else if (item.category) {
            const cat = allCategories.find(
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
          setLocation(defaultBranchLocation(list.filters.locations));
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

  const locationChipOptions = useMemo(() => {
    const opts = branchLocationOptions(locations);
    const trimmed = location.trim();
    if (
      trimmed &&
      trimmed.toLowerCase() !== 'all' &&
      !opts.includes(trimmed)
    ) {
      return [trimmed, ...opts];
    }
    return opts;
  }, [locations, location]);

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
      location:
        location.trim().toLowerCase() === 'all'
          ? defaultBranchLocation(locations)
          : location.trim(),
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

  const handlePickPhoto = async () => {
    try {
      const uri = await pickItemPhotoFromGallery();
      if (uri) {
        setPhotoUri(uri);
        setPendingPhotoUri(uri);
        setPhotoRemoved(false);
      }
    } catch (e) {
      showErrorFromUnknown(e, 'Item photo');
    }
  };

  const handleRemovePhoto = () => {
    setPhotoUri(null);
    setPendingPhotoUri(null);
    setPhotoRemoved(true);
  };

  const syncPhotoToStorage = async (savedItemNumber: string | null) => {
    const key = itemImageKey({
      item_number: savedItemNumber ?? itemNumber,
      id: itemId ?? null,
    });
    try {
      if (photoRemoved) {
        await removeItemImage(key);
      } else if (pendingPhotoUri) {
        await saveItemImage(key, pendingPhotoUri);
      }
    } catch {
      // Photo is device-only; a copy failure must not block the item save
    }
  };

  const handleSave = async () => {
    if (!description.trim()) {
      showErrorFromUnknown(new Error('Description is required'), 'Item');
      return;
    }
    setSubmitting(true);
    try {
      const payload = buildPayload();
      const saved =
        isEdit && itemId
          ? await inventoryService.updateItem(itemId, payload)
          : await inventoryService.createItem(payload);
      await syncPhotoToStorage(saved.item_number ?? null);
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

  return (
    <ScreenContainer>
      <AppHeader title={isEdit ? 'Modify item' : 'Add item'} showBack />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior="padding"
        keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top + 56 : 0}>
        <SmoothScrollView
          ref={scrollRef}
          contentContainerStyle={[styles.scroll, { paddingBottom: KEYBOARD_SCROLL_PADDING }]}
          onScroll={event => {
            scrollOffsetY.current = event.nativeEvent.contentOffset.y;
          }}
          scrollEventThrottle={16}
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
              onFocus={ensureFocusedInputVisible}
            />

            <Label>Description *</Label>
            <TextInput
              value={description}
              onChangeText={setDescription}
              style={appInputStyle}
              placeholder="Product name"
              placeholderTextColor={appInputPlaceholderColor}
              editable={!submitting}
              onFocus={ensureFocusedInputVisible}
            />

            <Label>Item photo</Label>
            <Text size="xs" color={colors.textMuted} mb="$2">
              Saved on this phone only — shown on the sales product cards.
            </Text>
            <Box flexDirection="row" alignItems="center" gap="$3">
              <Pressable
                onPress={handlePickPhoto}
                disabled={submitting}
                style={photoStyles.photoBox}
                accessibilityRole="button"
                accessibilityLabel={photoUri ? 'Change item photo' : 'Add item photo'}>
                {photoUri ? (
                  <Image
                    source={{ uri: photoUri }}
                    style={photoStyles.photo}
                    resizeMode="cover"
                  />
                ) : (
                  <Box alignItems="center" gap="$1">
                    <Camera size={22} color={colors.textMuted} />
                    <Text size="2xs" color={colors.textMuted}>
                      Add photo
                    </Text>
                  </Box>
                )}
              </Pressable>
              <VStack gap="$2" flex={1}>
                <Pressable
                  onPress={handlePickPhoto}
                  disabled={submitting}
                  style={photoStyles.photoBtn}>
                  <Camera size={14} color={colors.text} />
                  <Text size="xs" fontWeight="$bold" color={colors.text}>
                    {photoUri ? 'Change photo' : 'Choose from gallery'}
                  </Text>
                </Pressable>
                {photoUri ? (
                  <Pressable
                    onPress={handleRemovePhoto}
                    disabled={submitting}
                    style={[photoStyles.photoBtn, photoStyles.photoBtnDanger]}>
                    <Trash2 size={14} color={colors.error} />
                    <Text size="xs" fontWeight="$bold" color={colors.error}>
                      Remove photo
                    </Text>
                  </Pressable>
                ) : null}
              </VStack>
            </Box>

            <Label>Location</Label>
            <Text size="xs" fontWeight="$bold" color={colors.text} mb="$1.5">
              Branch: {location}
            </Text>
            <FilterChips
              options={locationChipOptions}
              selected={location}
              onSelect={nextLocation => {
                if (nextLocation.toLowerCase() === 'all') {
                  return;
                }
                setLocation(nextLocation);
              }}
              showAllOption={false}
            />

            <Label>Category</Label>
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
              onFocus={ensureFocusedInputVisible}
            />

            <Label>Purchase price</Label>
            <CurrencyTextInput
              currency={currency}
              value={purchasePrice}
              onChangeText={setPurchasePrice}
              editable={!submitting}
              onFocus={ensureFocusedInputVisible}
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
              onFocus={ensureFocusedInputVisible}
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
              onFocus={ensureFocusedInputVisible}
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
              onFocus={ensureFocusedInputVisible}
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
              onFocus={ensureFocusedInputVisible}
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

const photoStyles = StyleSheet.create({
  photoBox: {
    width: 96,
    height: 96,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.backgroundAlt,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  photoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    borderRadius: 999,
    paddingVertical: 9,
    paddingHorizontal: 14,
  },
  photoBtnDanger: {
    borderColor: colors.pastelPink,
    backgroundColor: colors.errorSoft,
  },
});
