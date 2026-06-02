import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDataRefreshNotify } from '@/context/DataRefreshContext';
import { inventoryService } from '@/services/api/inventoryService';
import { purchaseService } from '@/services/api/purchaseService';
import {
  supplierService,
  WALK_IN_SUPPLIER,
  type SupplierSummary,
} from '@/services/api/supplierService';
import type { ItemCategory } from '@/types/inventory';
import type { PurchaseReceiptPayload } from '@/types/inventory';
import type { InventoryItem } from '@/types/sales';
import type { SalePaymentDetails } from '@/types/sales';
import type { PosMobileSettings } from '@/types/settings';
import { buildPurchaseReceiptPayload } from '@/utils/purchaseReceipt';

export interface PurchaseCartLine {
  item_id: number;
  item_number: string;
  description: string;
  qty: number;
  unit_price: number;
  line_total: number;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

export const usePurchaseCreate = () => {
  const notifyRefresh = useDataRefreshNotify();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [invoiceId, setInvoiceId] = useState('');
  const [locations, setLocations] = useState<string[]>([]);
  const [location, setLocation] = useState('');
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [categories, setCategories] = useState<ItemCategory[]>([]);
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [subCategoryId, setSubCategoryId] = useState<number | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [suppliers, setSuppliers] = useState<SupplierSummary[]>([]);
  const [supplier, setSupplier] = useState<SupplierSummary | null>(WALK_IN_SUPPLIER);
  const [cart, setCart] = useState<PurchaseCartLine[]>([]);
  const [paymentMethods] = useState([
    'Cash',
    'Card',
    'Cheque',
    'Credit',
    'Bank Transfer',
    'Online',
  ]);

  const loadProducts = useCallback(async () => {
    const inv = await inventoryService.list();
    setItems(inv.items);
    setLocations(inv.filters.locations);
    const loc =
      inv.filters.locations.find(l => l === 'Main Location') ??
      inv.filters.locations[0] ??
      'Main Location';
    setLocation(prev => prev || loc);
    return inv;
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [invResult, supsResult, nextIdResult] =
        await Promise.allSettled([
          loadProducts(),
          supplierService.list(),
          purchaseService.getNextInvoiceId(),
        ]);

      if (invResult.status === 'rejected') {
        throw invResult.reason;
      }
      if (nextIdResult.status === 'rejected') {
        throw nextIdResult.reason;
      }

      const sups =
        supsResult.status === 'fulfilled' ? supsResult.value : [];
      const resolvedLocation =
        invResult.status === 'fulfilled'
          ? invResult.value.filters.locations.find(l => l === 'Main Location') ??
            invResult.value.filters.locations[0] ??
            'Main Location'
          : 'Main Location';
      const categoryRequest = await Promise.allSettled([
        inventoryService.getCategories({
          location: resolvedLocation,
        }),
      ]);
      const cats =
        categoryRequest[0].status === 'fulfilled' ? categoryRequest[0].value : [];

      if (supsResult.status === 'rejected') {
        setError(
          supsResult.reason instanceof Error
            ? supsResult.reason.message
            : 'Could not load suppliers',
        );
      }

      setSuppliers(sups);
      setInvoiceId(
        nextIdResult.status === 'fulfilled' ? nextIdResult.value : '',
      );
      setCategories(cats);
      setCategoryId(null);
      setSubCategoryId('all');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load purchase data');
    } finally {
      setLoading(false);
    }
  }, [loadProducts]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const displayItems = useMemo(() => {
    let rows = items;
    if (categoryId != null) {
      const cat = categories.find(c => c.id === categoryId);
      if (cat) {
        rows = rows.filter(
          i => i.item_category_id === cat.id || i.category === cat.name,
        );
        if (subCategoryId !== 'all') {
          const sub = cat.sub_categories.find(s => s.id === subCategoryId);
          if (sub) {
            rows = rows.filter(
              i =>
                i.item_sub_category_id === sub.id || i.sub_category === sub.name,
            );
          }
        }
      } else {
        rows = [];
      }
    }
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
  }, [items, categories, categoryId, subCategoryId, searchQuery]);

  const getCartQty = useCallback(
    (itemId: number) => cart.find(l => l.item_id === itemId)?.qty ?? 0,
    [cart],
  );

  const addToCart = useCallback((item: InventoryItem) => {
    setCart(prev => {
      const existing = prev.find(l => l.item_id === item.id);
      if (existing) {
        const qty = existing.qty + 1;
        return prev.map(l =>
          l.item_id === item.id
            ? { ...l, qty, line_total: round2(qty * l.unit_price) }
            : l,
        );
      }
      const price = item.purchase_price ?? item.selling_price ?? 0;
      return [
        ...prev,
        {
          item_id: item.id,
          item_number: item.item_number,
          description: item.description,
          qty: 1,
          unit_price: price,
          line_total: round2(price),
        },
      ];
    });
  }, []);

  const removeFromCart = useCallback((itemId: number) => {
    setCart(prev => prev.filter(l => l.item_id !== itemId));
  }, []);

  const toggleCartItem = useCallback(
    (item: InventoryItem) => {
      if (getCartQty(item.id) > 0) {
        removeFromCart(item.id);
        return true;
      }
      addToCart(item);
      return true;
    },
    [addToCart, getCartQty, removeFromCart],
  );

  const updateCartQty = useCallback((itemId: number, qty: number) => {
    if (qty <= 0) {
      setCart(prev => prev.filter(l => l.item_id !== itemId));
      return;
    }
    setCart(prev =>
      prev.map(l =>
        l.item_id === itemId
          ? { ...l, qty, line_total: round2(qty * l.unit_price) }
          : l,
      ),
    );
  }, []);

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

  const subTotal = useMemo(
    () => round2(cart.reduce((s, l) => s + l.line_total, 0)),
    [cart],
  );

  const netAmount = subTotal;

  const completePurchase = useCallback(
    async (
      payment: SalePaymentDetails,
      locationOverride?: string,
      settings?: PosMobileSettings | null,
    ): Promise<{ receipt: PurchaseReceiptPayload } | null> => {
      const stockLocation = locationOverride || location || 'Main Location';
      if (!supplier) {
        setError('Select a supplier');
        return null;
      }
      if (cart.length === 0) {
        setError('Add at least one item');
        return null;
      }
      if (!invoiceId) {
        setError('Invoice ID not ready');
        return null;
      }

      const purchaseDate = new Date().toISOString().slice(0, 10);
      const receipt = buildPurchaseReceiptPayload({
        invoiceId,
        location: stockLocation,
        supplierName: supplier.supplier_name,
        supplierContactNo: supplier.contact_no ?? null,
        supplierEmail: supplier.email ?? null,
        purchaseDate,
        lines: cart,
        subTotal: netAmount,
        amount: netAmount,
        paymentMethod: payment.payment_method,
        amountPaid: payment.amount_received,
        notes: payment.notes,
        settings,
      });

      setSubmitting(true);
      setError(null);
      try {
        const isWalkIn = supplier.id === 0;
        await purchaseService.create({
          invoice_id: invoiceId,
          location: stockLocation,
          supplier_id: isWalkIn ? null : supplier.id,
          supplier_name: supplier.supplier_name,
          sub_total: netAmount,
          discount: 0,
          amount: netAmount,
          payment_method: payment.payment_method,
          bank_id: payment.bank_id,
          cheque_number: payment.cheque_number,
          notes: payment.notes,
          purchase_date: purchaseDate,
          items: cart,
        });
        setCart([]);
        setSupplier(WALK_IN_SUPPLIER);
        setLocation(stockLocation);
        try {
          const nextId = await purchaseService.getNextInvoiceId();
          setInvoiceId(nextId);
        } catch {
          /* invoice id refresh is optional */
        }
        notifyRefresh(['dashboard', 'todayActivity', 'purchases', 'inventory']);
        return { receipt };
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to save purchase');
        return null;
      } finally {
        setSubmitting(false);
      }
    },
    [cart, invoiceId, location, netAmount, notifyRefresh, supplier],
  );

  const getDisplayPrice = useCallback(
    (item: InventoryItem) => item.purchase_price ?? item.selling_price ?? 0,
    [],
  );

  return {
    loading,
    submitting,
    error,
    setError,
    invoiceId,
    locations,
    location,
    setLocation,
    items,
    categories,
    categoryId,
    setCategoryId,
    subCategoryId,
    setSubCategoryId,
    searchQuery,
    setSearchQuery,
    displayItems,
    suppliers,
    supplier,
    setSupplier,
    cart,
    getCartQty,
    toggleCartItem,
    updateCartQty,
    decrementCartQty,
    removeFromCart,
    subTotal,
    netAmount,
    paymentMethods,
    completePurchase,
    refresh,
    getDisplayPrice,
  };
};
