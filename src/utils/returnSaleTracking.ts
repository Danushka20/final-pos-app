import type { SaleRecord } from '@/types/sales';
import { cartLineKey } from '@/utils/batchUtils';

/** Map original bill sales_id → cart line key → total qty already returned */
export type ReturnedQtyByOriginalSale = Map<string, Map<string, number>>;

export function saleReturnLineKey(
  itemId: number,
  itemBatchId?: number | null,
): string {
  return cartLineKey(itemId, itemBatchId);
}

export function parseOriginalSaleIdFromReturnNotes(
  notes?: string | null,
): string | null {
  if (!notes?.trim()) {
    return null;
  }
  const match = notes.match(/Return for\s+(\S+)/i);
  return match?.[1]?.trim() ?? null;
}

function saleKey(salesId: string): string {
  return salesId.trim().toUpperCase();
}

export function buildReturnedQtyByOriginalSale(
  returns: SaleRecord[],
): ReturnedQtyByOriginalSale {
  const map: ReturnedQtyByOriginalSale = new Map();

  for (const ret of returns) {
    const originalId = parseOriginalSaleIdFromReturnNotes(ret.notes);
    if (!originalId) {
      continue;
    }
    const key = saleKey(originalId);
    if (!map.has(key)) {
      map.set(key, new Map());
    }
    const lineMap = map.get(key)!;
    for (const line of ret.items ?? []) {
      if (!line.item_id || line.qty <= 0) {
        continue;
      }
      const lineKey = saleReturnLineKey(line.item_id, line.item_batch_id);
      lineMap.set(lineKey, (lineMap.get(lineKey) ?? 0) + line.qty);
    }
  }

  return map;
}

/** Remaining returnable qty per sale line (item + optional batch) on an original bill */
export function getRemainingReturnQtyByLine(
  sale: SaleRecord,
  returnedBySale: ReturnedQtyByOriginalSale,
): Map<string, number> {
  const returned = returnedBySale.get(saleKey(sale.sales_id)) ?? new Map();
  const remaining = new Map<string, number>();

  for (const line of sale.items ?? []) {
    if (!line.item_id || line.qty <= 0) {
      continue;
    }
    const lineKey = saleReturnLineKey(line.item_id, line.item_batch_id);
    const left = line.qty - (returned.get(lineKey) ?? 0);
    if (left > 0) {
      remaining.set(lineKey, left);
    }
  }

  return remaining;
}

export function isSaleFullyReturned(
  sale: SaleRecord,
  returnedBySale: ReturnedQtyByOriginalSale,
): boolean {
  return getRemainingReturnQtyByLine(sale, returnedBySale).size === 0;
}

export function filterReturnableSales(
  sales: SaleRecord[],
  returnedBySale: ReturnedQtyByOriginalSale,
): SaleRecord[] {
  return sales.filter(s => !isSaleFullyReturned(s, returnedBySale));
}
