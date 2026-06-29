import type { InventoryItem, ItemBatch } from '@/types/sales';

export const MAIN_LOCATION = 'Main Location';

export function normalizeBranchLocation(location: string | null | undefined): string {
  const value = (location ?? '').trim();
  return value !== '' ? value : MAIN_LOCATION;
}

export function parseExpiryDateOnly(dateStr: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(dateStr.trim());
  if (!match) {
    return null;
  }
  const y = Number(match[1]);
  const m = Number(match[2]);
  const d = Number(match[3]);
  if (!y || m < 1 || m > 12 || d < 1 || d > 31) {
    return null;
  }
  return new Date(y, m - 1, d);
}

export function isBatchExpired(batch: Pick<ItemBatch, 'expiry_date'>): boolean {
  if (!batch.expiry_date) {
    return false;
  }
  const exp = parseExpiryDateOnly(batch.expiry_date);
  if (!exp) {
    return false;
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return exp.getTime() < today.getTime();
}

export function formatDateYmd(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function formatExpiryDate(date: string | null | undefined): string {
  if (!date) {
    return '—';
  }
  const parsed = parseExpiryDateOnly(date);
  if (!parsed) {
    return date;
  }
  return parsed.toLocaleDateString('en-LK', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/** Batches with stock at the sale branch, nearest expiry first (FEFO). */
export function batchQtyTotal(batches: Array<Pick<ItemBatch, 'qty'>>): number {
  return batches.reduce((sum, batch) => sum + Math.max(0, Number(batch.qty ?? 0)), 0);
}

export function unbatchedStockQty(
  itemQty: number,
  batches: Array<Pick<ItemBatch, 'qty'>>,
): number {
  const total = Math.max(0, Number(itemQty ?? 0));
  const batched = batchQtyTotal(batches);
  return Math.max(0, Math.round((total - batched) * 100) / 100);
}

export function batchesAtBranch(
  batches: ItemBatch[],
  branchLocation: string,
): ItemBatch[] {
  const branch = normalizeBranchLocation(branchLocation);
  return batches.filter(
    batch => normalizeBranchLocation(batch.location ?? branch) === branch,
  );
}

/** Batches with stock at the sale branch, nearest expiry first (FEFO). */
export function availableBatchesAtBranch(
  batches: ItemBatch[],
  branchLocation: string,
  options?: { includeExpired?: boolean },
): ItemBatch[] {
  const branch = normalizeBranchLocation(branchLocation);
  const includeExpired = options?.includeExpired ?? false;

  return batches
    .filter(batch => {
      const batchLoc = normalizeBranchLocation(batch.location ?? branch);
      if (batchLoc !== branch || batch.qty <= 0) {
        return false;
      }
      if (!includeExpired && isBatchExpired(batch)) {
        return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (!a.expiry_date && !b.expiry_date) {
        return a.id - b.id;
      }
      if (!a.expiry_date) {
        return 1;
      }
      if (!b.expiry_date) {
        return -1;
      }
      return a.expiry_date.localeCompare(b.expiry_date) || a.id - b.id;
    });
}

export function batchSellingPrice(
  batch: ItemBatch,
  sellingPrice: number,
  wholesalePrice?: number,
): number {
  return batch.selling_price ?? sellingPrice ?? wholesalePrice ?? 0;
}

export function cartLineKey(itemId: number, itemBatchId?: number | null): string {
  return `${itemId}:${itemBatchId ?? 'main'}`;
}

export function formatBatchLabel(batchCount?: number): string {
  if (batchCount != null && batchCount > 0) {
    return `${batchCount} batch${batchCount === 1 ? '' : 'es'}`;
  }
  return 'Batch';
}

function truthyApiFlag(value: unknown): boolean {
  if (value === true || value === 1) {
    return true;
  }
  if (value === false || value === 0 || value == null) {
    return false;
  }
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    return normalized === 'true' || normalized === '1' || normalized === 'yes';
  }
  return Boolean(value);
}

export function itemHasBatches(
  item: Pick<
    InventoryItem,
    'has_batches' | 'batch_count'
  > & {
    hasBatches?: unknown;
    batchCount?: unknown;
  },
): boolean {
  if (truthyApiFlag(item.has_batches) || truthyApiFlag(item.hasBatches)) {
    return true;
  }

  const batchCount = Number(item.batch_count ?? item.batchCount ?? 0);
  return Number.isFinite(batchCount) && batchCount > 0;
}
