import type { InventoryItem } from '@/types/sales';

/** Sellable stock for inventory and POS (excludes expired batch qty when provided). */
export function itemSellableQty(
  item: Pick<InventoryItem, 'qty' | 'sellable_qty' | 'expired_stock_qty'>,
): number {
  if (item.sellable_qty != null && !Number.isNaN(item.sellable_qty)) {
    return Math.max(0, Number(item.sellable_qty));
  }
  const total = Math.max(0, Number(item.qty ?? 0));
  const expired = Math.max(0, Number(item.expired_stock_qty ?? 0));
  return Math.max(0, Math.round((total - expired) * 100) / 100);
}

export function availableStockForCartItem(
  item: Pick<InventoryItem, 'qty' | 'sellable_qty' | 'expired_stock_qty'>,
): number {
  return itemSellableQty(item);
}
