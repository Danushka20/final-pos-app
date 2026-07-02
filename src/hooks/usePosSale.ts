import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAutoRefresh } from '@/hooks/useAutoRefresh';
import { useDataRefreshNotify } from '@/context/DataRefreshContext';
import { customerService } from '@/services/api/customerService';
import { inventoryService } from '@/services/api/inventoryService';
import { salesService } from '@/services/api/salesService';
import { offerService } from '@/services/api/offerService';
import type { ApplicableOffer, OfferPreviewResult } from '@/types/offers';
import {
  findBestAutoOffer,
  findProductOffersForCart,
  findQualifyingMinOrderOffers,
  filterPromoOnlyOrderOffers,
  offerStillApplies,
} from '@/utils/offerHelpers';
import { cartOfferSignature, resolveBestAutoOfferId } from '@/utils/offerEngine';
import type { ItemCategory } from '@/types/inventory';
import type {
  CartLine,
  CreateSalePayload,
  CustomerSummary,
  InventoryItem,
  ItemBatch,
  PosContext,
  SalePaymentDetails,
  SaleReceiptPayload,
  SaleRecord,
  SaleTransactionMode,
} from '@/types/sales';
import {
  TRANSACTION_TYPE_RETURN,
  TRANSACTION_TYPE_SALE,
} from '@/types/sales';
import {
  buildReturnedQtyByOriginalSale,
  filterReturnableSales,
  getRemainingReturnQtyByLine,
  saleReturnLineKey,
  type ReturnedQtyByOriginalSale,
} from '@/utils/returnSaleTracking';
import {
  batchSellingPrice,
  cartLineKey,
  itemHasBatches,
} from '@/utils/batchUtils';
import { isItemExpired } from '@/utils/expiryUtils';
import { itemSellableQty } from '@/utils/itemInventoryUtils';
import {
  mergePosCatalogAcrossBranches,
  itemNumberKey,
  POS_CATALOG_LOCATION,
  prepareCheckoutCart,
  resolveCartItemForSale,
  resolveInventoryRowForCartLine,
  variantIdsForDisplayItem,
} from '@/utils/posSaleCatalogMerge';

const WALK_IN: CustomerSummary = {
  id: 0,
  customer_name: 'Walk-in Customer',
};

const defaultLocation = (locations: string[]): string =>
  locations.find(l => l === 'Main Location') ?? locations[0] ?? 'Main Location';

const round2 = (n: number) => Math.round(n * 100) / 100;

const computeDiscountAmount = (
  subTotal: number,
  type: 'percent' | 'amount',
  input: number,
): number => {
  if (type === 'percent') {
    const pct = Math.min(100, Math.max(0, input));
    return round2(Math.min(subTotal, subTotal * (pct / 100)));
  }
  return round2(Math.min(subTotal, Math.max(0, input)));
};

export const usePosSale = () => {
  const notifyRefresh = useDataRefreshNotify();
  const [loading, setLoading] = useState(true);
  const [itemsRefreshing, setItemsRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [context, setContext] = useState<PosContext | null>(null);
  const [location, setLocation] = useState('');
  const [customer, setCustomer] = useState<CustomerSummary | null>(WALK_IN);
  const [customers, setCustomers] = useState<CustomerSummary[]>([]);
  const [categories, setCategories] = useState<ItemCategory[]>([]);
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [subCategoryId, setSubCategoryId] = useState<number | 'all'>('all');
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<CartLine[]>([]);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [amountReceived, setAmountReceived] = useState('');
  const [transactionMode, setTransactionMode] = useState<SaleTransactionMode>('sale');
  const [returnSourceSale, setReturnSourceSale] = useState<SaleRecord | null>(null);
  const [returnWithoutBill, setReturnWithoutBill] = useState(false);
  const [loadingReturnSale, setLoadingReturnSale] = useState(false);
  const [remainingReturnQtyByLineKey, setRemainingReturnQtyByLineKey] = useState<
    Map<string, number>
  >(new Map());
  const [orderDiscountType, setOrderDiscountType] = useState<'percent' | 'amount'>('percent');
  const [orderDiscountInput, setOrderDiscountInput] = useState(0);
  const [activeHoldId, setActiveHoldId] = useState<number | null>(null);
  const [activeHoldSalesId, setActiveHoldSalesId] = useState<string | null>(null);
  const [selectedOfferId, setSelectedOfferId] = useState<number | null>(null);
  const [offerPromoCode, setOfferPromoCode] = useState('');
  const [offerPreview, setOfferPreview] = useState<OfferPreviewResult | null>(null);
  const [offerPreviewError, setOfferPreviewError] = useState<string | null>(null);
  const [offerPreviewLoading, setOfferPreviewLoading] = useState(false);
  const offerAutoDisabledRef = useRef(false);
  const offerManualIdRef = useRef<number | null>(null);
  const offerResolveRef = useRef(0);
  const offerResolveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cartSignatureRef = useRef('');
  const variantsByItemNumberRef = useRef<Map<string, InventoryItem[]>>(new Map());
  const [offerUserDisabled, setOfferUserDisabled] = useState(false);
  const [batchPickerOpen, setBatchPickerOpen] = useState(false);
  const [batchPickerItem, setBatchPickerItem] = useState<InventoryItem | null>(null);
  const [batchPickerQty, setBatchPickerQty] = useState(1);
  const [batchPickerBatches, setBatchPickerBatches] = useState<ItemBatch[]>([]);
  const [batchPickerLoading, setBatchPickerLoading] = useState(false);
  const [batchPickerError, setBatchPickerError] = useState<string | null>(null);
  const [batchItemIds, setBatchItemIds] = useState<Set<number>>(() => new Set());

  const isReturn = transactionMode === 'return';

  const locations = context?.filters.locations ?? [];
  const paymentMethods = context?.filters.payment_methods ?? ['Cash'];
  const salesId = context?.next_sales_id ?? '';
  const branchLocation = location || defaultLocation(locations);

  const fetchReturnedQtyByOriginalSale = useCallback(async (): Promise<ReturnedQtyByOriginalSale> => {
    const { sales } = await salesService.listSales({
      transaction_type: TRANSACTION_TYPE_RETURN,
      location: branchLocation || undefined,
    });
    return buildReturnedQtyByOriginalSale(
      sales.filter(s => s.order_status === 'completed' || !s.order_status),
    );
  }, [branchLocation]);

  const allowNegativeInventory = Boolean(
    (context?.order_settings as { allow_sales_negative_inventory?: boolean })
      ?.allow_sales_negative_inventory,
  );

  const allowOrderDiscount = useMemo(() => {
    const settings = context?.order_settings as { allow_order_discount?: boolean } | undefined;
    return settings?.allow_order_discount !== false;
  }, [context?.order_settings]);

  const allowOffer = useMemo(() => {
    const settings = context?.order_settings as { allow_offer?: boolean } | undefined;
    return settings?.allow_offer !== false;
  }, [context?.order_settings]);

  const applicableOffers = useMemo(
    () => context?.applicable_offers ?? [],
    [context?.applicable_offers],
  );

  const selectedOffer = useMemo(
    () => applicableOffers.find(o => o.id === selectedOfferId) ?? null,
    [applicableOffers, selectedOfferId],
  );

  const productOffers = useMemo(
    () => applicableOffers.filter(o => o.discount_type === 'product'),
    [applicableOffers],
  );

  const orderOffers = useMemo(
    () => applicableOffers.filter(o => o.discount_type === 'order'),
    [applicableOffers],
  );

  const loadCustomers = useCallback(async () => {
    const result = await customerService.list();
    setCustomers(result.customers);
  }, []);

  const loadCategories = useCallback(async () => {
    const cats = await inventoryService.getCategories({
      location: POS_CATALOG_LOCATION,
    });
    setCategories(cats);
    setCategoryId(null);
    setSubCategoryId('all');
  }, []);

  const syncBatchItemIds = useCallback((loaded: InventoryItem[]) => {
    setBatchItemIds(prev => {
      const next = new Set(prev);
      let changed = false;
      for (const item of loaded) {
        if (itemHasBatches(item) && !next.has(item.id)) {
          next.add(item.id);
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, []);

  const loadItems = useCallback(
    async (query?: string, silent = false) => {
      if (!silent) {
        setItemsRefreshing(true);
      }
      try {
        if (query?.trim()) {
          const result = await salesService.searchItems(
            query.trim(),
            POS_CATALOG_LOCATION,
          );
          setItems(result.items);
          syncBatchItemIds(result.items);
          if (result.parsed_qty && result.items.length === 1) {
            const { displayItems: merged } = mergePosCatalogAcrossBranches(
              result.items,
              branchLocation,
            );
            const match = merged[0] ?? result.items[0];
            return { autoQty: result.parsed_qty, item: match };
          }
          return null;
        }

        const result = await inventoryService.list({
          for_pos_sale: true,
          location: POS_CATALOG_LOCATION,
        });
        setItems(result.items);
        syncBatchItemIds(result.items);
        return null;
      } finally {
        if (!silent) {
          setItemsRefreshing(false);
        }
      }
    },
    [branchLocation, syncBatchItemIds],
  );

  const refreshItemsSilent = useCallback(async () => {
    try {
      await loadItems(searchQuery.trim() || undefined, true);
    } catch {
      /* keep last good data during background refresh */
    }
  }, [loadItems, searchQuery]);

  const refreshContext = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [ctx] = await Promise.all([
        salesService.getPosContext(),
        loadCustomers(),
      ]);
      setContext(ctx);
      const loc = defaultLocation(ctx.filters.locations);
      setLocation(loc);
      setPaymentMethod(ctx.filters.payment_methods[0] ?? 'Cash');
      await loadCategories();
      await loadItems();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load POS');
    } finally {
      setLoading(false);
    }
  }, [loadCategories, loadCustomers, loadItems]);

  useEffect(() => {
    refreshContext();
  }, [refreshContext]);

  const syncPosData = useCallback(
    async (silent: boolean) => {
      if (!branchLocation) {
        return;
      }
      try {
        if (silent) {
          await Promise.all([
            refreshItemsSilent(),
            salesService.getPosContext().then(setContext),
            loadCustomers(),
          ]);
        } else {
          await refreshContext();
        }
      } catch {
        /* keep last good data during background refresh */
      }
    },
    [branchLocation, loadCustomers, refreshContext, refreshItemsSilent],
  );

  useAutoRefresh({
    onRefresh: syncPosData,
    scopes: ['inventory', 'sales', 'dashboard', 'customers', 'purchases', 'reports', 'expenses'],
    enabled: Boolean(branchLocation),
  });

  const selectLocation = useCallback(
    (loc: string) => {
      setLocation(loc);
      setCart([]);
      setSearchQuery('');
      if (categories.length > 0) {
        setCategoryId(categories[0].id);
      }
      setSubCategoryId('all');
    },
    [categories],
  );

  const { displayItems: catalogItems } = useMemo(
    () => mergePosCatalogAcrossBranches(items, branchLocation),
    [items, branchLocation],
  );

  useEffect(() => {
    for (const item of items) {
      const key = itemNumberKey(item);
      const list = variantsByItemNumberRef.current.get(key) ?? [];
      const idx = list.findIndex(row => row.id === item.id);
      if (idx >= 0) {
        list[idx] = item;
        variantsByItemNumberRef.current.set(key, [...list]);
      } else {
        variantsByItemNumberRef.current.set(key, [...list, item]);
      }
    }
  }, [items]);

  const catalogScopeLabel = useMemo(() => {
    if (locations.length > 1) {
      return `All branches (${locations.length})`;
    }
    return 'All locations';
  }, [locations.length]);

  const resolveSaleItem = useCallback(
    (displayItem: InventoryItem) =>
      resolveCartItemForSale(
        displayItem,
        variantsByItemNumberRef.current,
        branchLocation,
      ),
    [branchLocation],
  );

  const prepareCheckout = useCallback(
    (lines: CartLine[]) =>
      prepareCheckoutCart(
        lines,
        variantsByItemNumberRef.current,
        items,
        branchLocation,
      ),
    [branchLocation, items],
  );

  const getCartQty = useCallback(
    (itemId: number) =>
      cart
        .filter(line => line.item_id === itemId)
        .reduce((sum, line) => sum + line.qty, 0),
    [cart],
  );

  const getDisplayCartQty = useCallback(
    (displayItem: InventoryItem) => {
      const ids = new Set(
        variantIdsForDisplayItem(displayItem, variantsByItemNumberRef.current),
      );
      return cart
        .filter(line => ids.has(line.item_id))
        .reduce((sum, line) => sum + line.qty, 0);
    },
    [cart],
  );

  const getCartLineQty = useCallback(
    (itemId: number, itemBatchId?: number | null) => {
      const batchId = itemBatchId ?? null;
      return (
        cart.find(
          line =>
            line.item_id === itemId && (line.item_batch_id ?? null) === batchId,
        )?.qty ?? 0
      );
    },
    [cart],
  );

  const getMaxReturnQty = useCallback(
    (itemId: number, itemBatchId?: number | null) =>
      remainingReturnQtyByLineKey.get(cartLineKey(itemId, itemBatchId)) ?? 0,
    [remainingReturnQtyByLineKey],
  );

  const resolveReturnBatch = useCallback(
    (item: InventoryItem): ItemBatch | null => {
      if (!item.sale_line_batch_id) {
        return null;
      }
      return {
        id: item.sale_line_batch_id,
        batch_number: item.sale_line_batch_number ?? 'Batch',
        qty: item.qty ?? 0,
        expiry_date: item.sale_line_batch_expiry ?? null,
        selling_price: item.selling_price,
      };
    },
    [],
  );

  const canSellItem = useCallback(
    (item: InventoryItem, addQty = 1): { ok: boolean; message?: string } => {
      if (isReturn) {
        if (!returnSourceSale) {
          return { ok: true };
        }
        const batchId = item.sale_line_batch_id ?? null;
        const max = getMaxReturnQty(item.id, batchId);
        if (max <= 0) {
          return { ok: false, message: 'This item was not on the original sale' };
        }
        const inCart = getCartLineQty(item.id, batchId);
        if (inCart + addQty > max) {
          return {
            ok: false,
            message: `Only ${max} remaining on bill ${returnSourceSale.sales_id}`,
          };
        }
        return { ok: true };
      }
      if (allowNegativeInventory) {
        return { ok: true };
      }
      if (!itemHasBatches(item) && isItemExpired(item)) {
        return { ok: false, message: `${item.description} is expired` };
      }
      const stock = itemSellableQty(item);
      const inCart = isReturn ? getCartQty(item.id) : getDisplayCartQty(item);
      if (stock <= 0 && inCart === 0) {
        return { ok: false, message: `${item.description} is out of stock` };
      }
      if (inCart + addQty > stock) {
        return {
          ok: false,
          message: `Only ${stock} in stock for ${item.description}`,
        };
      }
      return { ok: true };
    },
    [allowNegativeInventory, getCartLineQty, getDisplayCartQty, getCartQty, getMaxReturnQty, isReturn, returnSourceSale],
  );

  const selectCustomer = useCallback((c: CustomerSummary | null) => {
    setCustomer(c ?? WALK_IN);
  }, []);

  const returnDisplayItems = useMemo((): InventoryItem[] => {
    if (!returnSourceSale) {
      return [];
    }
    return returnSourceSale.items
      .filter(line => {
        if (line.item_id == null || line.qty <= 0) {
          return false;
        }
        const lineKey = saleReturnLineKey(line.item_id, line.item_batch_id);
        return (remainingReturnQtyByLineKey.get(lineKey) ?? line.qty) > 0;
      })
      .map(line => {
        const inv = items.find(i => i.id === line.item_id);
        const lineKey = saleReturnLineKey(line.item_id!, line.item_batch_id);
        const remaining = remainingReturnQtyByLineKey.get(lineKey) ?? line.qty;
        const batchLabel = line.batch_number?.trim();
        return {
          id: line.item_id!,
          return_line_key: lineKey,
          sale_line_batch_id: line.item_batch_id ?? null,
          sale_line_batch_number: line.batch_number ?? null,
          sale_line_batch_expiry: line.batch_expiry_date ?? null,
          item_number: line.item_number,
          description: batchLabel
            ? `${line.description} (${batchLabel})`
            : line.description,
          selling_price: line.unit_price,
          qty: remaining,
          category: inv?.category,
          item_category_id: inv?.item_category_id,
          item_sub_category_id: inv?.item_sub_category_id,
          sub_category: inv?.sub_category,
          sku: inv?.sku,
          image_url: inv?.image_url,
          has_batches: Boolean(line.item_batch_id),
        } as InventoryItem;
      });
  }, [items, remainingReturnQtyByLineKey, returnSourceSale]);

  const displayItems = useMemo(() => {
    if (isReturn && returnSourceSale) {
      let rows = returnDisplayItems;
      const q = searchQuery.trim().toLowerCase();
      if (q.length >= 1) {
        rows = rows.filter(
          i =>
            i.description.toLowerCase().includes(q) ||
            i.item_number.toLowerCase().includes(q) ||
            (i.sku?.toLowerCase().includes(q) ?? false),
        );
      }
      return rows;
    }

    let rows = catalogItems;
    if (categoryId != null) {
      const cat = categories.find(c => c.id === categoryId);
      if (cat) {
        rows = rows.filter(
          i =>
            i.item_category_id === cat.id || i.category === cat.name,
        );
        if (subCategoryId !== 'all') {
          const sub = cat.sub_categories.find(s => s.id === subCategoryId);
          if (sub) {
            rows = rows.filter(
              i =>
                i.item_sub_category_id === sub.id ||
                i.sub_category === sub.name,
            );
          }
        }
      } else {
        rows = [];
      }
    }
    const q = searchQuery.trim().toLowerCase();
    if (q.length >= 2) {
      rows = rows.filter(
        i =>
          i.description.toLowerCase().includes(q) ||
          i.item_number.toLowerCase().includes(q) ||
          (i.sku?.toLowerCase().includes(q) ?? false),
      );
    }
    return rows;
  }, [
    catalogItems,
    categories,
    categoryId,
    subCategoryId,
    searchQuery,
    isReturn,
    returnDisplayItems,
    returnSourceSale,
  ]);

  const addToCart = useCallback((item: InventoryItem, qty = 1, batch?: ItemBatch | null) => {
    const batchId = batch?.id ?? null;
    setCart(prev => {
      const existing = prev.find(
        line =>
          line.item_id === item.id && (line.item_batch_id ?? null) === batchId,
      );
      const unitPrice = batch
        ? batchSellingPrice(batch, item.selling_price, item.wholesale_price)
        : item.selling_price;
      const description = batch
        ? `${item.description} (${batch.batch_number})`
        : item.description;

      if (existing) {
        const nextQty = existing.qty + qty;
        return prev.map(line =>
          line.item_id === item.id && (line.item_batch_id ?? null) === batchId
            ? {
                ...line,
                qty: nextQty,
                line_total: round2(nextQty * line.unit_price),
                inventory_location:
                  item.location?.trim() || line.inventory_location || null,
              }
            : line,
        );
      }

      return [
        ...prev,
        {
          item_id: item.id,
          item_number: item.item_number,
          description,
          qty,
          unit_price: unitPrice,
          line_total: round2(qty * unitPrice),
          uom: item.uom?.trim() || 'Pcs',
          item_batch_id: batchId,
          batch_number: batch?.batch_number ?? null,
          batch_expiry_date: batch?.expiry_date ?? null,
          inventory_location: item.location?.trim() || null,
        },
      ];
    });
  }, []);

  const removeFromCart = useCallback((itemId: number, itemBatchId?: number | null) => {
    if (itemBatchId === undefined) {
      setCart(prev => prev.filter(line => line.item_id !== itemId));
      return;
    }
    const batchId = itemBatchId ?? null;
    setCart(prev =>
      prev.filter(
        line =>
          !(
            line.item_id === itemId &&
            (line.item_batch_id ?? null) === batchId
          ),
      ),
    );
  }, []);

  const closeBatchPicker = useCallback(() => {
    setBatchPickerOpen(false);
    setBatchPickerItem(null);
    setBatchPickerBatches([]);
    setBatchPickerLoading(false);
    setBatchPickerError(null);
    setBatchPickerQty(1);
  }, []);

  const openBatchPicker = useCallback(async (displayItem: InventoryItem, qty = 1) => {
    const saleItem = isReturn
      ? displayItem
      : resolveSaleItem(displayItem);
    if (
      !isReturn &&
      isItemExpired(saleItem) &&
      !itemHasBatches(saleItem) &&
      !itemHasBatches(displayItem)
    ) {
      setError(`${displayItem.item_number} is expired`);
      return;
    }
    setBatchPickerItem(saleItem);
    setBatchPickerOpen(true);
    setBatchPickerQty(qty);
    setBatchPickerBatches([]);
    setBatchPickerError(null);
    setBatchPickerLoading(true);
    try {
      const { batches } = await inventoryService.getItemBatches(saleItem.id);
      setBatchPickerBatches(batches);
      if (batches.length > 0) {
        setBatchItemIds(prev => new Set(prev).add(saleItem.id));
        setItems(prev =>
          prev.map(row =>
            row.id === saleItem.id
              ? { ...row, has_batches: true, batch_count: batches.length }
              : row,
          ),
        );
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to load batches';
      setBatchPickerError(message);
      setBatchPickerBatches([]);
    } finally {
      setBatchPickerLoading(false);
    }
  }, [isReturn, resolveSaleItem]);

  const tryAddToCart = useCallback(
    (displayItem: InventoryItem, qty = 1): boolean => {
      if (isReturn) {
        const check = canSellItem(displayItem, qty);
        if (!check.ok) {
          setError(check.message ?? 'Cannot add item');
          return false;
        }
        const returnBatch = resolveReturnBatch(displayItem);
        addToCart(displayItem, qty, returnBatch);
        return true;
      }

      const saleItem = resolveSaleItem(displayItem);
      if (saleItem.has_expired_stock || isItemExpired(saleItem)) {
        if (itemHasBatches(saleItem) || itemHasBatches(displayItem)) {
          void openBatchPicker(displayItem, qty);
          return false;
        }
        setError(
          `${saleItem.item_number} is expired at ${saleItem.location ?? 'this branch'}`,
        );
        return false;
      }

      const check = canSellItem(displayItem, qty);
      if (!check.ok) {
        setError(check.message ?? 'Cannot add item');
        return false;
      }
      addToCart(saleItem, qty, null);
      return true;
    },
    [addToCart, canSellItem, isReturn, openBatchPicker, resolveReturnBatch, resolveSaleItem],
  );

  const addMainFromBatchPicker = useCallback(
    (qty: number) => {
      if (!batchPickerItem) {
        return false;
      }
      const ok = tryAddToCart(batchPickerItem, qty);
      if (ok) {
        closeBatchPicker();
      }
      return ok;
    },
    [batchPickerItem, closeBatchPicker, tryAddToCart],
  );

  const addBatchFromPicker = useCallback(
    (batch: ItemBatch, qty: number) => {
      if (!batchPickerItem) {
        return false;
      }
      if (!allowNegativeInventory && qty > batch.qty) {
        setError(`Only ${batch.qty} in batch ${batch.batch_number}`);
        return false;
      }
      addToCart(batchPickerItem, qty, batch);
      closeBatchPicker();
      return true;
    },
    [addToCart, allowNegativeInventory, batchPickerItem, closeBatchPicker],
  );

  const toggleCartItem = useCallback(
    (item: InventoryItem): boolean => {
      if (isReturn) {
        const inCart = getCartQty(item.id) > 0;
        if (inCart) {
          removeFromCart(item.id);
          return true;
        }
        return tryAddToCart(item, 1);
      }

      const variantIds = variantIdsForDisplayItem(item, variantsByItemNumberRef.current);
      const inCart = getDisplayCartQty(item) > 0;
      if (inCart) {
        setCart(prev => prev.filter(line => !variantIds.includes(line.item_id)));
        return true;
      }
      return tryAddToCart(item, 1);
    },
    [
      getCartQty,
      getDisplayCartQty,
      isReturn,
      removeFromCart,
      tryAddToCart,
    ],
  );

  const updateCartQty = useCallback(
    (itemId: number, qty: number, itemBatchId?: number | null) => {
      const batchId = itemBatchId ?? null;
      if (qty <= 0) {
        setCart(prev =>
          prev.filter(
            line =>
              !(
                line.item_id === itemId &&
                (line.item_batch_id ?? null) === batchId
              ),
          ),
        );
        return;
      }

      setCart(prev => {
        const current = prev.find(
          line =>
            line.item_id === itemId &&
            (line.item_batch_id ?? null) === batchId,
        );
        if (!current) {
          return prev;
        }

        if (qty < current.qty) {
          return prev.map(line =>
            line.item_id === itemId &&
            (line.item_batch_id ?? null) === batchId
              ? { ...line, qty, line_total: round2(qty * line.unit_price) }
              : line,
          );
        }

        if (qty === current.qty) {
          return prev;
        }

        let nextQty = qty;

        if (isReturn) {
          const max = getMaxReturnQty(itemId, batchId);
          if (max <= 0) {
            setError('Item is not on the original sale');
            return prev;
          }
          if (nextQty > max) {
            setError(`Maximum return qty is ${max}`);
            nextQty = max;
          }
        }

        const item = items.find(i => i.id === itemId);
        if (item && !allowNegativeInventory && !isReturn) {
          const stock = item ? itemSellableQty(item) : 0;
          if (stock <= 0) {
            setError(`${item.description} is out of stock`);
            return prev;
          }
          if (nextQty > stock && batchId == null) {
            setError(`Only ${stock} in stock for ${item.description}`);
            return prev;
          }
        }

        return prev.map(line =>
          line.item_id === itemId && (line.item_batch_id ?? null) === batchId
            ? { ...line, qty: nextQty, line_total: round2(nextQty * line.unit_price) }
            : line,
        );
      });
    },
    [allowNegativeInventory, getMaxReturnQty, isReturn, items],
  );

  const decrementDisplayCartQty = useCallback(
    (displayItem: InventoryItem, itemBatchId?: number | null) => {
      const variantIds = variantIdsForDisplayItem(displayItem, variantsByItemNumberRef.current);
      setCart(prev => {
        let batchId: number | null;
        if (itemBatchId !== undefined) {
          batchId = itemBatchId ?? null;
        } else {
          const mainLine = prev.find(
            line =>
              variantIds.includes(line.item_id) && line.item_batch_id == null,
          );
          const line =
            mainLine ?? prev.find(cartLine => variantIds.includes(cartLine.item_id));
          batchId = line?.item_batch_id ?? null;
        }
        const line = prev.find(
          cartLine =>
            variantIds.includes(cartLine.item_id) &&
            (cartLine.item_batch_id ?? null) === batchId,
        );
        if (!line) {
          return prev;
        }
        const nextQty = line.qty - 1;
        if (nextQty <= 0) {
          return prev.filter(
            cartLine =>
              !(
                cartLine.item_id === line.item_id &&
                (cartLine.item_batch_id ?? null) === batchId
              ),
          );
        }
        return prev.map(cartLine =>
          cartLine.item_id === line.item_id &&
          (cartLine.item_batch_id ?? null) === batchId
            ? {
                ...cartLine,
                qty: nextQty,
                line_total: round2(nextQty * cartLine.unit_price),
              }
            : cartLine,
        );
      });
    },
    [],
  );

  const removeDisplayFromCart = useCallback(
    (displayItem: InventoryItem, itemBatchId?: number | null) => {
      const variantIds = variantIdsForDisplayItem(displayItem, variantsByItemNumberRef.current);
      if (itemBatchId === undefined) {
        setCart(prev => prev.filter(line => !variantIds.includes(line.item_id)));
        return;
      }
      const batchId = itemBatchId ?? null;
      setCart(prev =>
        prev.filter(
          line =>
            !(
              variantIds.includes(line.item_id) &&
              (line.item_batch_id ?? null) === batchId
            ),
        ),
      );
    },
    [],
  );

  const decrementCartQty = useCallback(
    (itemId: number, itemBatchId?: number | null) => {
      setCart(prev => {
        let batchId: number | null;
        if (itemBatchId !== undefined) {
          batchId = itemBatchId ?? null;
        } else {
          const mainLine = prev.find(
            line => line.item_id === itemId && line.item_batch_id == null,
          );
          const line = mainLine ?? prev.find(cartLine => cartLine.item_id === itemId);
          batchId = line?.item_batch_id ?? null;
        }
        const line = prev.find(
          cartLine =>
            cartLine.item_id === itemId &&
            (cartLine.item_batch_id ?? null) === batchId,
        );
        if (!line) {
          return prev;
        }
        const nextQty = line.qty - 1;
        if (nextQty <= 0) {
          return prev.filter(
            cartLine =>
              !(
                cartLine.item_id === itemId &&
                (cartLine.item_batch_id ?? null) === batchId
              ),
          );
        }
        return prev.map(cartLine =>
          cartLine.item_id === itemId &&
          (cartLine.item_batch_id ?? null) === batchId
            ? {
                ...cartLine,
                qty: nextQty,
                line_total: round2(nextQty * cartLine.unit_price),
              }
            : cartLine,
        );
      });
    },
    [],
  );

  const cartHasStockIssuesFor = useCallback(
    (lines: CartLine[]): boolean => {
      if (isReturn || allowNegativeInventory) {
        return false;
      }
      return lines.some(line => {
        const item = resolveInventoryRowForCartLine(
          line,
          items,
          variantsByItemNumberRef.current,
        );
        const stock = item ? itemSellableQty(item) : 0;
        return !item || stock <= 0 || line.qty > stock;
      });
    },
    [allowNegativeInventory, isReturn, items],
  );

  const cartHasStockIssues = useCallback(
    (): boolean => cartHasStockIssuesFor(cart),
    [cart, cartHasStockIssuesFor],
  );

  useEffect(() => {
    if (allowNegativeInventory || items.length === 0) {
      return;
    }
    setCart(prev => {
      if (prev.length === 0) {
        return prev;
      }
      let removed = false;
      const next = prev
        .map(line => {
          const item = resolveInventoryRowForCartLine(
            line,
            items,
            variantsByItemNumberRef.current,
          );
          if (!item || itemSellableQty(item) <= 0) {
            removed = true;
            return null;
          }
          const stock = itemSellableQty(item);
          if (line.qty > stock) {
            removed = true;
            return {
              ...line,
              qty: stock,
              line_total: round2(stock * line.unit_price),
            };
          }
          return line;
        })
        .filter((line): line is CartLine => line != null);

      if (removed) {
        setError('Out-of-stock items were removed from your cart');
      }
      const changed =
        next.length !== prev.length ||
        next.some((l, i) => l.qty !== prev[i]?.qty || l.item_id !== prev[i]?.item_id);
      return changed ? next : prev;
    });
  }, [allowNegativeInventory, items]);

  const runSearch = useCallback(
    async (query: string) => {
      setSearchQuery(query);
      if (isReturn && returnSourceSale) {
        return;
      }
      if (query.trim() === '') {
        try {
          await loadItems();
        } catch (e) {
          setError(e instanceof Error ? e.message : 'Search failed');
        }
        return;
      }
      if (query.trim().length < 2) {
        return;
      }
      try {
        const auto = await loadItems(query);
        if (auto?.item && auto.autoQty) {
          const ok = tryAddToCart(auto.item, auto.autoQty);
          if (!ok) {
            return;
          }
          setSearchQuery('');
          await loadItems();
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Search failed');
      }
    },
    [isReturn, loadItems, returnSourceSale, tryAddToCart],
  );

  const subTotal = useMemo(
    () => round2(cart.reduce((sum, l) => sum + l.line_total, 0)),
    [cart],
  );

  const offerDiscount = offerPreview?.offer_discount ?? 0;
  const offerAdjustedSubTotal = offerPreview?.sub_total ?? subTotal;

  /** Manual cashier discount — separate from automatic product/order offers. */
  const discount = useMemo(
    () => computeDiscountAmount(subTotal, orderDiscountType, orderDiscountInput),
    [orderDiscountType, orderDiscountInput, subTotal],
  );

  const discountPercent = useMemo(() => {
    if (orderDiscountType === 'percent') {
      return round2(Math.min(100, Math.max(0, orderDiscountInput)));
    }
    if (subTotal <= 0) {
      return 0;
    }
    return round2((discount / subTotal) * 100);
  }, [discount, orderDiscountInput, orderDiscountType, subTotal]);

  const netAmount = useMemo(
    () => round2(Math.max(0, subTotal - discount - offerDiscount)),
    [discount, offerDiscount, subTotal],
  );

  const clearHoldSession = useCallback(() => {
    setActiveHoldId(null);
    setActiveHoldSalesId(null);
  }, []);

  const resetOfferPreview = useCallback(() => {
    setOfferPreview(null);
    setOfferPreviewError(null);
  }, []);

  const clearOfferState = useCallback(() => {
    setSelectedOfferId(null);
    setOfferPromoCode('');
    resetOfferPreview();
  }, [resetOfferPreview]);

  const clearOffer = useCallback(() => {
    offerManualIdRef.current = null;
    offerAutoDisabledRef.current = true;
    setOfferUserDisabled(true);
    clearOfferState();
  }, [clearOfferState]);

  const reapplyAutoOffer = useCallback(async () => {
    offerManualIdRef.current = null;
    offerAutoDisabledRef.current = false;
    setOfferUserDisabled(false);
    try {
      const id = await resolveBestAutoOfferId(
        applicableOffers,
        cart,
        offerPromoCode,
      );
      if (id != null) {
        setSelectedOfferId(id);
        const offer = applicableOffers.find(o => o.id === id);
        if (offer && !offer.requires_promo_code) {
          setOfferPromoCode('');
        }
        return;
      }
    } catch {
      const fallback = findBestAutoOffer(cart, applicableOffers, subTotal);
      if (fallback) {
        setSelectedOfferId(fallback.id);
        if (!fallback.requires_promo_code) {
          setOfferPromoCode('');
        }
        return;
      }
    }
    clearOfferState();
  }, [applicableOffers, cart, clearOfferState, offerPromoCode, subTotal]);

  const selectOffer = useCallback(
    (offer: ApplicableOffer | null) => {
      if (!offer) {
        clearOffer();
        return;
      }
      offerAutoDisabledRef.current = false;
      setOfferUserDisabled(false);
      offerManualIdRef.current = offer.id;
      setSelectedOfferId(offer.id);
      if (!offer.requires_promo_code) {
        setOfferPromoCode('');
      }
    },
    [clearOffer],
  );

  const resetDiscount = useCallback(() => {
    setOrderDiscountType('percent');
    setOrderDiscountInput(0);
    clearOffer();
  }, [clearOffer]);

  const cartSignature = useMemo(() => cartOfferSignature(cart), [cart]);

  useEffect(() => {
    if (cartSignature !== cartSignatureRef.current) {
      cartSignatureRef.current = cartSignature;
      offerAutoDisabledRef.current = false;
      offerManualIdRef.current = null;
      setOfferUserDisabled(false);
    }
  }, [cartSignature]);

  useEffect(() => {
    if (isReturn || !allowOffer || cart.length === 0) {
      if (selectedOfferId != null) {
        clearOfferState();
      }
      return;
    }

    if (offerAutoDisabledRef.current) {
      return;
    }

    const manualId = offerManualIdRef.current;
    if (manualId != null) {
      const manualOffer = applicableOffers.find(o => o.id === manualId);
      if (manualOffer && offerStillApplies(manualOffer, cart, subTotal)) {
        if (selectedOfferId !== manualId) {
          setSelectedOfferId(manualId);
        }
        return;
      }
      offerManualIdRef.current = null;
    }

    const matchingProduct = findProductOffersForCart(applicableOffers, cart);
    const qualifyingOrder = findQualifyingMinOrderOffers(applicableOffers, cart);
    const promoOnly = filterPromoOnlyOrderOffers(applicableOffers);
    const hasPromo = Boolean(offerPromoCode.trim());

    const needsResolve =
      matchingProduct.length > 0 ||
      qualifyingOrder.length > 0 ||
      (promoOnly.length > 0 && hasPromo);

    if (!needsResolve) {
      if (selectedOfferId != null) {
        const current = applicableOffers.find(o => o.id === selectedOfferId);
        if (!current || !offerStillApplies(current, cart, subTotal)) {
          clearOfferState();
        }
      }
      return;
    }

    const requestId = ++offerResolveRef.current;

    const resolve = async () => {
      try {
        const id = await resolveBestAutoOfferId(
          applicableOffers,
          cart,
          offerPromoCode,
        );
        if (requestId !== offerResolveRef.current) {
          return;
        }
        if (id != null) {
          if (selectedOfferId !== id) {
            setSelectedOfferId(id);
            const offer = applicableOffers.find(o => o.id === id);
            if (offer && !offer.requires_promo_code) {
              setOfferPromoCode('');
            }
          }
          return;
        }
        if (selectedOfferId != null) {
          clearOfferState();
        }
      } catch {
        const fallback = findBestAutoOffer(cart, applicableOffers, subTotal);
        if (requestId !== offerResolveRef.current) {
          return;
        }
        if (fallback) {
          setSelectedOfferId(fallback.id);
        } else if (selectedOfferId != null) {
          clearOfferState();
        }
      }
    };

    if (offerResolveTimerRef.current) {
      clearTimeout(offerResolveTimerRef.current);
    }
    offerResolveTimerRef.current = setTimeout(() => {
      void resolve();
    }, 200);

    return () => {
      if (offerResolveTimerRef.current) {
        clearTimeout(offerResolveTimerRef.current);
      }
    };
  }, [
    allowOffer,
    applicableOffers,
    cart,
    cartSignature,
    clearOfferState,
    isReturn,
    offerPromoCode,
    selectedOfferId,
    subTotal,
  ]);

  useEffect(() => {
    if (isReturn || !allowOffer || selectedOfferId == null || cart.length === 0) {
      setOfferPreview(null);
      setOfferPreviewError(null);
      setOfferPreviewLoading(false);
      return;
    }

    const offer = applicableOffers.find(o => o.id === selectedOfferId);
    if (!offer) {
      return;
    }

    if (offer.requires_promo_code && !offerPromoCode.trim()) {
      setOfferPreview(null);
      setOfferPreviewError('Enter promo code for this offer');
      setOfferPreviewLoading(false);
      return;
    }

    let cancelled = false;
    setOfferPreviewLoading(true);
    offerService
      .preview({
        offerId: selectedOfferId,
        lines: cart,
        promoCode: offerPromoCode,
      })
      .then(result => {
        if (!cancelled) {
          setOfferPreview(result);
          setOfferPreviewError(null);
        }
      })
      .catch(e => {
        if (!cancelled) {
          setOfferPreview(null);
          setOfferPreviewError(e instanceof Error ? e.message : 'Offer preview failed');
        }
      })
      .finally(() => {
        if (!cancelled) {
          setOfferPreviewLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [
    allowOffer,
    applicableOffers,
    cart,
    isReturn,
    offerPromoCode,
    selectedOfferId,
  ]);

  const offerProductItemIds = useMemo(() => {
    const ids = new Set<number>();
    for (const offer of productOffers) {
      for (const id of offer.item_ids) {
        ids.add(id);
      }
    }
    return ids;
  }, [productOffers]);

  const getOfferLineDiscount = useCallback(
    (itemId: number, itemBatchId?: number | null): number => {
      const batchId = itemBatchId ?? null;
      const line = offerPreview?.lines.find(
        previewLine =>
          previewLine.item_id === itemId &&
          (previewLine.item_batch_id ?? null) === batchId,
      );
      return line?.offer_discount ?? 0;
    },
    [offerPreview?.lines],
  );

  const attachOfferToPayload = useCallback(
    (payload: CreateSalePayload): CreateSalePayload => {
      if (isReturn || !allowOffer || selectedOfferId == null) {
        return payload;
      }
      const trimmedPromo = offerPromoCode.trim().toUpperCase();
      return {
        ...payload,
        offer_id: selectedOfferId,
        offer_applied: true,
        ...(trimmedPromo
          ? { offer_promo_code: trimmedPromo, promo_code: trimmedPromo }
          : {}),
      };
    },
    [allowOffer, isReturn, offerPromoCode, selectedOfferId],
  );

  const applyOrderDiscount = useCallback(
    (type: 'percent' | 'amount', value: number) => {
      if (type === 'percent') {
        setOrderDiscountType('percent');
        setOrderDiscountInput(round2(Math.min(100, Math.max(0, value))));
        return;
      }
      setOrderDiscountType('amount');
      setOrderDiscountInput(round2(Math.max(0, value)));
    },
    [],
  );

  const setOrderDiscount = useCallback(
    (value: number) => {
      applyOrderDiscount('amount', value);
    },
    [applyOrderDiscount],
  );

  const enrichReceipt = useCallback(
    (
      receipt: SaleReceiptPayload,
      hold = false,
      cartLines?: CartLine[],
    ): SaleReceiptPayload => {
      const uomByNumber = new Map(
        (cartLines ?? [])
          .filter(line => line.item_number)
          .map(line => [line.item_number, line.uom?.trim() || 'Pcs']),
      );

      return {
        ...receipt,
        sale: {
          ...receipt.sale,
          discount: discount > 0 ? discount : receipt.sale.discount,
          discount_type: orderDiscountType,
          discount_percent: discountPercent,
          lines: receipt.sale.lines.map(line => ({
            ...line,
            uom:
              line.uom?.trim() ||
              uomByNumber.get(line.item_number ?? '') ||
              'Pcs',
          })),
          ...(hold
            ? {
                order_status: 'hold',
                is_hold: true,
                payment_method: receipt.sale.payment_method ?? 'Hold',
              }
            : {}),
        },
      };
    },
    [discount, discountPercent, orderDiscountType],
  );

  const loadHoldOrder = useCallback(
    async (saleId: number): Promise<boolean> => {
      setLoadingReturnSale(true);
      setError(null);
      try {
        const sale = await salesService.getSale(saleId);
        if ((sale.order_status ?? '').toLowerCase() !== 'hold') {
          setError('This sale is not on hold');
          return false;
        }
        setTransactionMode('sale');
        setReturnSourceSale(null);
        setReturnWithoutBill(false);
        setActiveHoldId(sale.id);
        setActiveHoldSalesId(sale.sales_id);
        setOrderDiscountType('amount');
        setOrderDiscountInput(sale.discount ?? 0);
        setCart(
          (sale.items ?? []).map(line => {
            const inv = items.find(i => i.id === line.item_id);
            const key = itemNumberKey({
              item_number: line.item_number,
              id: line.item_id,
            } as InventoryItem);
            const variant =
              variantsByItemNumberRef.current
                .get(key)
                ?.find(row => row.id === line.item_id) ?? inv;
            return {
              item_id: line.item_id,
              item_number: line.item_number,
              description: line.description,
              qty: line.qty,
              unit_price: line.unit_price,
              line_total: line.line_total,
              uom: line.uom?.trim() || variant?.uom?.trim() || 'Pcs',
              item_batch_id: line.item_batch_id ?? null,
              batch_number: line.batch_number ?? null,
              batch_expiry_date: line.batch_expiry_date ?? null,
              inventory_location:
                variant?.location?.trim() || sale.location?.trim() || null,
            };
          }),
        );
        if (sale.customer_id && sale.customer_name) {
          setCustomer({
            id: sale.customer_id,
            customer_name: sale.customer_name,
          });
        } else {
          setCustomer(WALK_IN);
        }
        if (sale.location) {
          setLocation(sale.location);
        }
        return true;
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load hold order');
        return false;
      } finally {
        setLoadingReturnSale(false);
      }
    },
    [items],
  );

  const holdSale = useCallback(
    async (
      notes?: string | null,
      cartOverride?: CartLine[],
    ): Promise<{ receipt: SaleReceiptPayload; saleId: number } | null> => {
      const activeCustomer = customer ?? WALK_IN;
      const isWalkIn = activeCustomer.id === 0;
      const checkoutCart =
        cartOverride && cartOverride.length > 0 ? cartOverride : cart;
      const { location: stockLocation, lines: saleLines } =
        prepareCheckout(checkoutCart);
      const checkoutSubTotal = round2(
        saleLines.reduce((sum, line) => sum + line.line_total, 0),
      );
      const checkoutDiscount = computeDiscountAmount(
        checkoutSubTotal,
        orderDiscountType,
        orderDiscountInput,
      );
      let checkoutOfferDiscount = offerDiscount;
      let checkoutNet = round2(
        Math.max(0, checkoutSubTotal - checkoutDiscount - checkoutOfferDiscount),
      );

      if (checkoutCart.length === 0) {
        setError('Add at least one item to hold');
        return null;
      }
      if (!salesId) {
        setError('Sale ID not ready — pull to refresh');
        return null;
      }
      if (!branchLocation) {
        setError('Select a branch');
        return null;
      }
      if (cartHasStockIssuesFor(saleLines)) {
        setError('Remove out-of-stock items from the cart before holding');
        return null;
      }
      if (checkoutDiscount > checkoutSubTotal) {
        setError('Discount cannot exceed subtotal');
        return null;
      }
      if (
        allowOffer &&
        selectedOfferId != null &&
        selectedOffer?.requires_promo_code &&
        !offerPromoCode.trim()
      ) {
        setError('Enter promo code for the selected offer');
        return null;
      }

      setSubmitting(true);
      setError(null);
      try {
        if (
          allowOffer &&
          selectedOfferId != null &&
          cartOverride &&
          cartOverride.length > 0
        ) {
          const preview = await offerService.preview({
            offerId: selectedOfferId,
            lines: saleLines,
            promoCode: offerPromoCode,
          });
          checkoutOfferDiscount = preview.offer_discount;
          checkoutNet = round2(
            Math.max(0, checkoutSubTotal - checkoutDiscount - checkoutOfferDiscount),
          );
        } else if (allowOffer && selectedOfferId != null && offerPreviewError) {
          setError(offerPreviewError);
          return null;
        }

        const salePayload = attachOfferToPayload({
          transaction_type: TRANSACTION_TYPE_SALE,
          sales_type: 'Retail',
          sales_id: salesId,
          location: stockLocation,
          customer_id: isWalkIn ? null : activeCustomer.id,
          customer_name: activeCustomer.customer_name,
          sub_total: checkoutSubTotal,
          discount: checkoutDiscount,
          net_amount: checkoutNet,
          payment_method: 'Hold',
          amount_received: 0,
          notes: notes?.trim() || 'Held from mobile POS',
          items: saleLines,
          order_status: 'hold',
        });

        const { sale, receipt } = await salesService.createSale(salePayload);
        const holdReceipt = enrichReceipt(receipt, true, checkoutCart);

        setCart([]);
        setCustomer(WALK_IN);
        resetDiscount();
        clearHoldSession();
        await refreshContext();
        notifyRefresh([
          'dashboard',
          'todayActivity',
          'inventory',
          'sales',
          'customers',
          'reports',
          'expenses',
        ]);
        return { receipt: holdReceipt, saleId: sale.id };
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Hold order failed');
        return null;
      } finally {
        setSubmitting(false);
      }
    },
    [
      allowOffer,
      attachOfferToPayload,
      branchLocation,
      cart,
      cartHasStockIssuesFor,
      clearHoldSession,
      customer,
      enrichReceipt,
      notifyRefresh,
      offerDiscount,
      offerPreviewError,
      offerPromoCode,
      orderDiscountInput,
      orderDiscountType,
      refreshContext,
      resetDiscount,
      prepareCheckout,
      salesId,
      selectedOffer,
      selectedOfferId,
    ],
  );

  const completeSale = useCallback(
    async (
      payment: SalePaymentDetails,
    ): Promise<{ receipt: SaleReceiptPayload; saleId: number } | null> => {
    const activeCustomer = customer ?? WALK_IN;
    const isWalkIn = activeCustomer.id === 0;
    const checkoutCart =
      payment.cart && payment.cart.length > 0 ? payment.cart : cart;
    const { location: stockLocation, lines: saleLines } =
      prepareCheckout(checkoutCart);
    const checkoutSubTotal = round2(
      saleLines.reduce((sum, line) => sum + line.line_total, 0),
    );
    const checkoutDiscount = computeDiscountAmount(
      checkoutSubTotal,
      orderDiscountType,
      orderDiscountInput,
    );
    let checkoutOfferDiscount = offerDiscount;
    let checkoutNet = round2(
      Math.max(0, checkoutSubTotal - checkoutDiscount - checkoutOfferDiscount),
    );

    if (checkoutCart.length === 0) {
      setError('Add at least one item to the cart');
      return null;
    }
    if (!isReturn && cartHasStockIssuesFor(saleLines)) {
      setError('Remove out-of-stock items from the cart before payment');
      return null;
    }
    if (checkoutDiscount > checkoutSubTotal) {
      setError('Discount cannot exceed subtotal');
      return null;
    }
    if (
      !isReturn &&
      allowOffer &&
      selectedOfferId != null &&
      selectedOffer?.requires_promo_code &&
      !offerPromoCode.trim()
    ) {
      setError('Enter promo code for the selected offer');
      return null;
    }
    if (!activeHoldId && !salesId) {
      setError('Sale ID not ready — pull to refresh');
      return null;
    }
    if (!branchLocation) {
      setError('Select a branch');
      return null;
    }
    if (/cheque/i.test(payment.payment_method) && !payment.cheque_number) {
      setError('Enter cheque number');
      return null;
    }
    if (
      /cheque|bank transfer/i.test(payment.payment_method) &&
      !payment.bank_id
    ) {
      setError('Select a bank account');
      return null;
    }
    if (/^online$/i.test(payment.payment_method) && !payment.notes?.trim()) {
      setError('Enter a transaction / approval ID for online payment');
      return null;
    }

    setSubmitting(true);
    setError(null);
    try {
      if (
        !isReturn &&
        allowOffer &&
        selectedOfferId != null &&
        payment.cart &&
        payment.cart.length > 0
      ) {
        const preview = await offerService.preview({
          offerId: selectedOfferId,
          lines: saleLines,
          promoCode: offerPromoCode,
        });
        checkoutOfferDiscount = preview.offer_discount;
        checkoutNet = round2(
          Math.max(0, checkoutSubTotal - checkoutDiscount - checkoutOfferDiscount),
        );
      } else if (
        !isReturn &&
        allowOffer &&
        selectedOfferId != null &&
        offerPreviewError
      ) {
        setError(offerPreviewError);
        return null;
      }

      const originalBill =
        payment.original_sale_id?.trim() ||
        returnSourceSale?.sales_id?.trim() ||
        null;

      const notes = isReturn
        ? [
            originalBill ? `Return for ${originalBill}` : 'Walk-in return',
            payment.notes?.trim(),
          ]
            .filter(Boolean)
            .join(' · ') || null
        : payment.notes?.trim() || null;

      const salePayload = attachOfferToPayload({
        transaction_type: isReturn ? TRANSACTION_TYPE_RETURN : TRANSACTION_TYPE_SALE,
        sales_type: isReturn ? 'Return' : 'Retail',
        sales_id: activeHoldSalesId ?? salesId,
        location: stockLocation,
        customer_id: isWalkIn ? null : activeCustomer.id,
        customer_name: activeCustomer.customer_name,
        sub_total: checkoutSubTotal,
        discount: checkoutDiscount,
        net_amount: checkoutNet,
        payment_method: payment.payment_method,
        amount_received: payment.amount_received,
        bank_id: payment.bank_id,
        cheque_number: payment.cheque_number,
        notes,
        items: saleLines,
        order_status: 'completed',
      });

      if (isReturn && payment.refund_card_last4) {
        salePayload.refund_card_last4 = payment.refund_card_last4;
      }

      if (activeHoldId && payment.hold_pin?.trim()) {
        salePayload.hold_pin = payment.hold_pin.trim();
      }

      const { sale, receipt } = activeHoldId
        ? await salesService.completeHold(activeHoldId, salePayload)
        : await salesService.createSale(salePayload);

      const finalReceipt = enrichReceipt(receipt, false, checkoutCart);

      setCart([]);
      setCustomer(WALK_IN);
      resetDiscount();
      clearHoldSession();
      setReturnSourceSale(null);
      setReturnWithoutBill(false);
      setRemainingReturnQtyByLineKey(new Map());
      setAmountReceived('');
      setPaymentMethod(payment.payment_method);
      await refreshContext();
      notifyRefresh([
        'dashboard',
        'todayActivity',
        'inventory',
        'sales',
        'customers',
        'reports',
        'expenses',
      ]);
      return { receipt: finalReceipt, saleId: sale.id };
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Checkout failed');
      return null;
    } finally {
      setSubmitting(false);
    }
  },
    [
      activeHoldId,
      activeHoldSalesId,
      allowOffer,
      attachOfferToPayload,
      branchLocation,
      cart,
      cartHasStockIssuesFor,
      clearHoldSession,
      customer,
      enrichReceipt,
      notifyRefresh,
      offerDiscount,
      offerPreviewError,
      offerPromoCode,
      orderDiscountInput,
      orderDiscountType,
      refreshContext,
      resetDiscount,
      prepareCheckout,
      returnSourceSale,
      salesId,
      selectedOffer,
      selectedOfferId,
      isReturn,
    ],
  );

  const clearReturnSource = useCallback(() => {
    setReturnSourceSale(null);
    setReturnWithoutBill(false);
    setRemainingReturnQtyByLineKey(new Map());
    setCart([]);
    setSearchQuery('');
    setError(null);
  }, []);

  const startReturnWithoutBill = useCallback(() => {
    setReturnSourceSale(null);
    setReturnWithoutBill(true);
    setRemainingReturnQtyByLineKey(new Map());
    setCart([]);
    setSearchQuery('');
    setError(null);
  }, []);

  const loadReturnSale = useCallback(
    async (saleId: number) => {
      setLoadingReturnSale(true);
      setError(null);
      try {
        const sale = await salesService.getSale(saleId);
        if (sale.transaction_type === TRANSACTION_TYPE_RETURN) {
          throw new Error('Cannot return from another return bill');
        }
        if (sale.order_status && sale.order_status !== 'completed') {
          throw new Error('Only completed sales can be returned');
        }
        if (!sale.items?.length) {
          throw new Error('This sale has no line items');
        }

        const returnedBySale = await fetchReturnedQtyByOriginalSale();
        const remaining = getRemainingReturnQtyByLine(sale, returnedBySale);
        if (remaining.size === 0) {
          throw new Error(
            `Bill ${sale.sales_id} has already been fully returned`,
          );
        }

        setRemainingReturnQtyByLineKey(remaining);
        setReturnSourceSale(sale);
        setReturnWithoutBill(false);
        setCart([]);
        setSearchQuery('');
        if (sale.customer_id && sale.customer_name) {
          setCustomer({
            id: sale.customer_id,
            customer_name: sale.customer_name,
          });
        } else if (sale.customer_name) {
          setCustomer({ id: 0, customer_name: sale.customer_name });
        }
      } catch (e) {
        setRemainingReturnQtyByLineKey(new Map());
        setError(e instanceof Error ? e.message : 'Failed to load sale');
        throw e;
      } finally {
        setLoadingReturnSale(false);
      }
    },
    [fetchReturnedQtyByOriginalSale],
  );

  const findAndLoadReturnSale = useCallback(
    async (salesIdQuery: string) => {
      const q = salesIdQuery.trim();
      if (!q) {
        throw new Error('Enter a bill number (e.g. SAL-0042)');
      }
      setLoadingReturnSale(true);
      setError(null);
      try {
        const { sales } = await salesService.listSales({
          transaction_type: TRANSACTION_TYPE_SALE,
          location: branchLocation || undefined,
        });
        const match = sales.find(
          s =>
            s.sales_id.toLowerCase() === q.toLowerCase() ||
            String(s.id) === q,
        );
        if (!match) {
          throw new Error(`No sale found for "${q}"`);
        }
        await loadReturnSale(match.id);
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Sale not found';
        setError(msg);
        throw e;
      } finally {
        setLoadingReturnSale(false);
      }
    },
    [branchLocation, loadReturnSale],
  );

  const loadSalesBillsForReturn = useCallback(async (): Promise<SaleRecord[]> => {
    const [{ sales }, returnedBySale] = await Promise.all([
      salesService.listSales({
        transaction_type: TRANSACTION_TYPE_SALE,
        location: branchLocation || undefined,
      }),
      fetchReturnedQtyByOriginalSale(),
    ]);

    const eligible = sales.filter(
      s =>
        (s.order_status === 'completed' || !s.order_status) &&
        s.transaction_type !== TRANSACTION_TYPE_RETURN &&
        (s.items?.length ?? 0) > 0,
    );

    return filterReturnableSales(eligible, returnedBySale).slice(0, 200);
  }, [branchLocation, fetchReturnedQtyByOriginalSale]);

  const switchTransactionMode = useCallback((mode: SaleTransactionMode) => {
    setTransactionMode(mode);
    setCart([]);
    setReturnSourceSale(null);
    setReturnWithoutBill(false);
    setRemainingReturnQtyByLineKey(new Map());
    setSearchQuery('');
    setError(null);
    clearOffer();
  }, [clearOffer]);

  const refreshProducts = useCallback(async () => {
    await loadItems(searchQuery.trim() || undefined);
  }, [loadItems, searchQuery]);

  return {
    loading,
    itemsRefreshing,
    submitting,
    error,
    setError,
    context,
    salesId,
    locations,
    location: branchLocation,
    selectLocation,
    customer,
    customers,
    selectCustomer,
    categories,
    categoryId,
    setCategoryId,
    subCategoryId,
    setSubCategoryId,
    displayItems,
    catalogScopeLabel,
    items,
    searchQuery,
    runSearch,
    cart,
    addToCart,
    tryAddToCart,
    toggleCartItem,
    getCartQty,
    getDisplayCartQty,
    decrementDisplayCartQty,
    removeDisplayFromCart,
    canSellItem,
    allowNegativeInventory,
    updateCartQty,
    decrementCartQty,
    removeFromCart,
    batchPickerOpen,
    batchPickerItem,
    batchPickerBatches,
    batchPickerLoading,
    batchPickerError,
    batchPickerQty,
    batchItemIds,
    openBatchPicker,
    closeBatchPicker,
    addMainFromBatchPicker,
    addBatchFromPicker,
    getCartLineQty,
    cartLineKey,
    cartHasStockIssues,
    cartHasStockIssuesFor,
    prepareCheckout,
    paymentMethods,
    paymentMethod,
    setPaymentMethod,
    amountReceived,
    setAmountReceived,
    subTotal,
    discount,
    discountPercent,
    applyOrderDiscount,
    orderDiscountType,
    setOrderDiscountType,
    orderDiscountInput,
    setOrderDiscountInput,
    orderDiscount: discount,
    setOrderDiscount,
    allowOrderDiscount,
    allowOffer,
    applicableOffers,
    productOffers,
    orderOffers,
    selectedOfferId,
    selectedOffer,
    selectOffer,
    clearOffer,
    reapplyAutoOffer,
    offerUserDisabled,
    offerPromoCode,
    setOfferPromoCode,
    offerDiscount,
    offerAdjustedSubTotal,
    offerPreview,
    offerPreviewError,
    offerPreviewLoading,
    offerProductItemIds,
    getOfferLineDiscount,
    netAmount,
    completeSale,
    holdSale,
    loadHoldOrder,
    activeHoldId,
    activeHoldSalesId,
    clearHoldSession,
    refreshContext,
    loadCustomers,
    refreshProducts,
    canShowProducts: !loading,
    needsCategoryPick: false,
    transactionMode,
    isReturn,
    switchTransactionMode,
    returnSourceSale,
    returnWithoutBill,
    loadingReturnSale,
    loadReturnSale,
    findAndLoadReturnSale,
    loadSalesBillsForReturn,
    /** @deprecated use loadSalesBillsForReturn */
    loadRecentSalesForReturn: loadSalesBillsForReturn,
    clearReturnSource,
    startReturnWithoutBill,
    getMaxReturnQty,
  };
};
