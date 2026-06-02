import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useDataRefreshNotify } from '@/context/DataRefreshContext';
import { customerService } from '@/services/api/customerService';
import { inventoryService } from '@/services/api/inventoryService';
import { salesService } from '@/services/api/salesService';
import type { ItemCategory } from '@/types/inventory';
import type {
  CartLine,
  CustomerSummary,
  InventoryItem,
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

const POLL_MS = 20_000;

const WALK_IN: CustomerSummary = {
  id: 0,
  customer_name: 'Walk-in Customer',
};

const defaultLocation = (locations: string[]): string =>
  locations.find(l => l === 'Main Location') ?? locations[0] ?? 'Main Location';

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

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isReturn = transactionMode === 'return';

  const maxReturnQtyByItemId = useMemo(() => {
    const map = new Map<number, number>();
    if (!returnSourceSale) {
      return map;
    }
    for (const line of returnSourceSale.items) {
      if (line.item_id) {
        map.set(line.item_id, line.qty);
      }
    }
    return map;
  }, [returnSourceSale]);

  const locations = context?.filters.locations ?? [];
  const paymentMethods = context?.filters.payment_methods ?? ['Cash'];
  const salesId = context?.next_sales_id ?? '';
  const branchLocation = location || defaultLocation(locations);

  const allowNegativeInventory = Boolean(
    (context?.order_settings as { allow_sales_negative_inventory?: boolean })
      ?.allow_sales_negative_inventory,
  );

  const loadCustomers = useCallback(async () => {
    const result = await customerService.list();
    setCustomers(result.customers);
  }, []);

  const loadCategories = useCallback(async (loc?: string) => {
    const cats = await inventoryService.getCategories({
      location: loc && loc !== 'all' ? loc : undefined,
    });
    setCategories(cats);
    setCategoryId(null);
    setSubCategoryId('all');
  }, []);

  const loadItems = useCallback(
    async (loc: string, query?: string, silent = false) => {
      if (!silent) {
        setItemsRefreshing(true);
      }
      try {
        if (query?.trim()) {
          const result = await salesService.searchItems(
            query.trim(),
            loc || undefined,
          );
          setItems(result.items);
          if (result.parsed_qty && result.items.length === 1) {
            return { autoQty: result.parsed_qty, item: result.items[0] };
          }
          return null;
        }

        const result = await inventoryService.list({
          for_pos_sale: true,
        });
        setItems(result.items);
        return null;
      } finally {
        if (!silent) {
          setItemsRefreshing(false);
        }
      }
    },
    [],
  );

  const refreshItemsSilent = useCallback(async () => {
    if (!branchLocation) {
      return;
    }
    try {
      await loadItems(branchLocation, searchQuery.trim() || undefined, true);
    } catch {
      /* keep last good data during background refresh */
    }
  }, [branchLocation, loadItems, searchQuery]);

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
      await loadCategories(loc);
      await loadItems(loc);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load POS');
    } finally {
      setLoading(false);
    }
  }, [loadCategories, loadCustomers, loadItems]);

  useEffect(() => {
    refreshContext();
  }, [refreshContext]);

  useFocusEffect(
    useCallback(() => {
      if (branchLocation) {
        refreshItemsSilent();
      }
    }, [branchLocation, refreshItemsSilent]),
  );

  useEffect(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
    }
    if (!branchLocation) {
      return undefined;
    }
    pollRef.current = setInterval(() => {
      refreshItemsSilent();
    }, POLL_MS);
    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
      }
    };
  }, [branchLocation, refreshItemsSilent]);

  const selectLocation = useCallback(
    async (loc: string) => {
      setLocation(loc);
      setCart([]);
      setSearchQuery('');
      if (categories.length > 0) {
        setCategoryId(categories[0].id);
      }
      setSubCategoryId('all');
      try {
        await loadCategories(loc);
        await loadItems(loc);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to update branch');
      }
    },
    [categories, loadCategories, loadItems],
  );

  const getCartQty = useCallback(
    (itemId: number) => cart.find(l => l.item_id === itemId)?.qty ?? 0,
    [cart],
  );

  const getMaxReturnQty = useCallback(
    (itemId: number) => maxReturnQtyByItemId.get(itemId) ?? 0,
    [maxReturnQtyByItemId],
  );

  const canSellItem = useCallback(
    (item: InventoryItem, addQty = 1): { ok: boolean; message?: string } => {
      if (isReturn) {
        if (!returnSourceSale) {
          return { ok: true };
        }
        const max = getMaxReturnQty(item.id);
        if (max <= 0) {
          return { ok: false, message: 'This item was not on the original sale' };
        }
        const inCart = getCartQty(item.id);
        if (inCart + addQty > max) {
          return {
            ok: false,
            message: `Only ${max} sold on bill ${returnSourceSale.sales_id}`,
          };
        }
        return { ok: true };
      }
      if (allowNegativeInventory) {
        return { ok: true };
      }
      const stock = item.qty ?? 0;
      const inCart = getCartQty(item.id);
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
    [allowNegativeInventory, getCartQty, getMaxReturnQty, isReturn, returnSourceSale],
  );

  const selectCustomer = useCallback((c: CustomerSummary | null) => {
    setCustomer(c ?? WALK_IN);
  }, []);

  const returnDisplayItems = useMemo((): InventoryItem[] => {
    if (!returnSourceSale) {
      return [];
    }
    return returnSourceSale.items
      .filter(line => line.item_id != null && line.qty > 0)
      .map(line => {
        const inv = items.find(i => i.id === line.item_id);
        return {
          id: line.item_id,
          item_number: line.item_number,
          description: line.description,
          selling_price: line.unit_price,
          qty: line.qty,
          category: inv?.category,
          item_category_id: inv?.item_category_id,
          item_sub_category_id: inv?.item_sub_category_id,
          sub_category: inv?.sub_category,
          sku: inv?.sku,
          image_url: inv?.image_url,
        } as InventoryItem;
      });
  }, [items, returnSourceSale]);

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

    let rows = items;
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
    items,
    categories,
    categoryId,
    subCategoryId,
    searchQuery,
    isReturn,
    returnDisplayItems,
  ]);

  const addToCart = useCallback((item: InventoryItem, qty = 1) => {
    setCart(prev => {
      const existing = prev.find(l => l.item_id === item.id);
      if (existing) {
        const nextQty = existing.qty + qty;
        return prev.map(l =>
          l.item_id === item.id
            ? {
                ...l,
                qty: nextQty,
                line_total: round2(nextQty * l.unit_price),
              }
            : l,
        );
      }
      const unitPrice = item.selling_price;
      return [
        ...prev,
        {
          item_id: item.id,
          item_number: item.item_number,
          description: item.description,
          qty,
          unit_price: unitPrice,
          line_total: round2(qty * unitPrice),
        },
      ];
    });
  }, []);

  const tryAddToCart = useCallback(
    (item: InventoryItem, qty = 1): boolean => {
      const check = canSellItem(item, qty);
      if (!check.ok) {
        setError(check.message ?? 'Cannot add item');
        return false;
      }
      addToCart(item, qty);
      return true;
    },
    [addToCart, canSellItem],
  );

  const removeFromCart = useCallback((itemId: number) => {
    setCart(prev => prev.filter(l => l.item_id !== itemId));
  }, []);

  const toggleCartItem = useCallback(
    (item: InventoryItem): boolean => {
      const inCart = getCartQty(item.id) > 0;
      if (inCart) {
        removeFromCart(item.id);
        return true;
      }
      return tryAddToCart(item, 1);
    },
    [getCartQty, removeFromCart, tryAddToCart],
  );

  const updateCartQty = useCallback(
    (itemId: number, qty: number) => {
      if (qty <= 0) {
        setCart(prev => prev.filter(l => l.item_id !== itemId));
        return;
      }

      setCart(prev => {
        const current = prev.find(l => l.item_id === itemId);
        if (!current) {
          return prev;
        }

        // Always allow lowering qty — user may be fixing a wrong tap.
        if (qty < current.qty) {
          return prev.map(l =>
            l.item_id === itemId
              ? { ...l, qty, line_total: round2(qty * l.unit_price) }
              : l,
          );
        }

        if (qty === current.qty) {
          return prev;
        }

        let nextQty = qty;

        if (isReturn) {
          const max = getMaxReturnQty(itemId);
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
          const stock = item.qty ?? 0;
          if (stock <= 0) {
            setError(`${item.description} is out of stock`);
            return prev;
          }
          if (nextQty > stock) {
            setError(`Only ${stock} in stock for ${item.description}`);
            return prev;
          }
        }

        return prev.map(l =>
          l.item_id === itemId
            ? { ...l, qty: nextQty, line_total: round2(nextQty * l.unit_price) }
            : l,
        );
      });
    },
    [allowNegativeInventory, getMaxReturnQty, isReturn, items],
  );

  const decrementCartQty = useCallback((itemId: number) => {
    setCart(prev => {
      const line = prev.find(l => l.item_id === itemId);
      if (!line) {
        return prev;
      }
      const nextQty = line.qty - 1;
      if (nextQty <= 0) {
        return prev.filter(l => l.item_id !== itemId);
      }
      return prev.map(l =>
        l.item_id === itemId
          ? { ...l, qty: nextQty, line_total: round2(nextQty * l.unit_price) }
          : l,
      );
    });
  }, []);

  const cartHasStockIssues = useCallback((): boolean => {
    if (isReturn || allowNegativeInventory) {
      return false;
    }
    return cart.some(line => {
      const item = items.find(i => i.id === line.item_id);
      const stock = item?.qty ?? 0;
      return !item || stock <= 0 || line.qty > stock;
    });
  }, [allowNegativeInventory, cart, isReturn, items]);

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
          const item = items.find(i => i.id === line.item_id);
          if (!item || (item.qty ?? 0) <= 0) {
            removed = true;
            return null;
          }
          const stock = item.qty ?? 0;
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
      if (!branchLocation) {
        return;
      }
      if (query.trim() === '') {
        try {
          await loadItems(branchLocation);
        } catch (e) {
          setError(e instanceof Error ? e.message : 'Search failed');
        }
        return;
      }
      if (query.trim().length < 2) {
        return;
      }
      try {
        const auto = await loadItems(branchLocation, query);
        if (auto?.item && auto.autoQty) {
          const sellCheck = canSellItem(auto.item, auto.autoQty);
          if (!sellCheck.ok) {
            setError(sellCheck.message ?? 'Cannot sell item');
            return;
          }
          addToCart(auto.item, auto.autoQty);
          setSearchQuery('');
          await loadItems(branchLocation);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Search failed');
      }
    },
    [addToCart, branchLocation, canSellItem, isReturn, loadItems, returnSourceSale],
  );

  const subTotal = useMemo(
    () => round2(cart.reduce((sum, l) => sum + l.line_total, 0)),
    [cart],
  );

  const discount = 0;
  const netAmount = useMemo(() => round2(subTotal - discount), [subTotal, discount]);

  const completeSale = useCallback(
    async (
      payment: SalePaymentDetails,
    ): Promise<{ receipt: SaleReceiptPayload; saleId: number } | null> => {
    const activeCustomer = customer ?? WALK_IN;
    const isWalkIn = activeCustomer.id === 0;

    if (cart.length === 0) {
      setError('Add at least one item to the cart');
      return null;
    }
    if (!isReturn && cartHasStockIssues()) {
      setError('Remove out-of-stock items from the cart before payment');
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

      const { sale, receipt } = await salesService.createSale({
        transaction_type: isReturn ? TRANSACTION_TYPE_RETURN : TRANSACTION_TYPE_SALE,
        sales_type: isReturn ? 'Return' : 'Retail',
        sales_id: salesId,
        location: branchLocation,
        customer_id: isWalkIn ? null : activeCustomer.id,
        customer_name: activeCustomer.customer_name,
        sub_total: subTotal,
        discount,
        net_amount: netAmount,
        payment_method: payment.payment_method,
        amount_received: payment.amount_received,
        bank_id: payment.bank_id,
        cheque_number: payment.cheque_number,
        refund_card_last4: payment.refund_card_last4 ?? null,
        notes,
        items: cart,
        order_status: 'completed',
      });

      setCart([]);
      setCustomer(WALK_IN);
      setReturnSourceSale(null);
      setReturnWithoutBill(false);
      setAmountReceived('');
      setPaymentMethod(payment.payment_method);
      await refreshContext();
      notifyRefresh([
        'dashboard',
        'todayActivity',
        'inventory',
        'sales',
        'customers',
      ]);
      return { receipt, saleId: sale.id };
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Checkout failed');
      return null;
    } finally {
      setSubmitting(false);
    }
  },
    [
      branchLocation,
      cart,
      cartHasStockIssues,
      customer,
      discount,
      netAmount,
      refreshContext,
      salesId,
      subTotal,
      isReturn,
      returnSourceSale,
      notifyRefresh,
    ],
  );

  const clearReturnSource = useCallback(() => {
    setReturnSourceSale(null);
    setReturnWithoutBill(false);
    setCart([]);
    setSearchQuery('');
    setError(null);
  }, []);

  const startReturnWithoutBill = useCallback(() => {
    setReturnSourceSale(null);
    setReturnWithoutBill(true);
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
        setError(e instanceof Error ? e.message : 'Failed to load sale');
        throw e;
      } finally {
        setLoadingReturnSale(false);
      }
    },
    [],
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
    const { sales } = await salesService.listSales({
      transaction_type: TRANSACTION_TYPE_SALE,
      location: branchLocation || undefined,
    });
    return sales
      .filter(
        s =>
          (s.order_status === 'completed' || !s.order_status) &&
          s.transaction_type !== TRANSACTION_TYPE_RETURN &&
          (s.items?.length ?? 0) > 0,
      )
      .slice(0, 200);
  }, [branchLocation]);

  const switchTransactionMode = useCallback((mode: SaleTransactionMode) => {
    setTransactionMode(mode);
    setCart([]);
    setReturnSourceSale(null);
    setReturnWithoutBill(false);
    setSearchQuery('');
    setError(null);
  }, []);

  const refreshProducts = useCallback(async () => {
    if (!branchLocation) {
      return;
    }
    await loadItems(branchLocation, searchQuery.trim() || undefined);
  }, [branchLocation, loadItems, searchQuery]);

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
    items,
    searchQuery,
    runSearch,
    cart,
    addToCart,
    tryAddToCart,
    toggleCartItem,
    getCartQty,
    canSellItem,
    allowNegativeInventory,
    updateCartQty,
    decrementCartQty,
    removeFromCart,
    cartHasStockIssues,
    paymentMethods,
    paymentMethod,
    setPaymentMethod,
    amountReceived,
    setAmountReceived,
    subTotal,
    discount,
    netAmount,
    completeSale,
    refreshContext,
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
    requiresRefundCard: Boolean(
      (context?.order_settings as { allow_verify_credit_card_for_sales_return_refund?: boolean })
        ?.allow_verify_credit_card_for_sales_return_refund,
    ),
  };
};

const round2 = (n: number) => Math.round(n * 100) / 100;
