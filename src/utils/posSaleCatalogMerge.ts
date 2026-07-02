import type { CartLine, InventoryItem } from '@/types/sales';
import { resolveItemExpiry } from '@/utils/expiryUtils';
import { itemHasBatches } from '@/utils/batchUtils';
import { itemSellableQty } from '@/utils/itemInventoryUtils';

export const POS_CATALOG_LOCATION = 'all';

export interface MergedPosCatalog {
  displayItems: InventoryItem[];
  variantsByItemNumber: Map<string, InventoryItem[]>;
}

export function itemNumberKey(item: InventoryItem): string {
  return (item.item_number || String(item.id)).trim().toLowerCase();
}

function expiryFieldsForBranchRow(
  item: InventoryItem,
): Pick<
  InventoryItem,
  'expiry_date' | 'nearest_expiry_date' | 'expiry_status' | 'expiry_days_remaining'
> {
  const resolved = resolveItemExpiry(item);
  return {
    expiry_date: item.expiry_date ?? resolved.date,
    nearest_expiry_date: resolved.date,
    expiry_status: resolved.status,
    expiry_days_remaining: resolved.daysRemaining,
  };
}

function expiryFieldsForSaleBranch(
  group: InventoryItem[],
  saleLocation: string,
): Pick<
  InventoryItem,
  'expiry_date' | 'nearest_expiry_date' | 'expiry_status' | 'expiry_days_remaining'
> {
  const branchRow =
    group.find(i => i.location === saleLocation && Number(i.qty ?? 0) > 0) ??
    group.find(i => i.location === saleLocation) ??
    group.find(i => Number(i.qty ?? 0) > 0) ??
    group[0];
  return expiryFieldsForBranchRow(branchRow);
}

/**
 * One catalog row per item number; qty is summed across all branches.
 * Pricing/metadata prefers the sale branch row when it exists.
 */
export function mergePosCatalogAcrossBranches(
  items: InventoryItem[],
  saleLocation: string,
): MergedPosCatalog {
  const variantsByItemNumber = new Map<string, InventoryItem[]>();

  for (const item of items) {
    const key = itemNumberKey(item);
    const list = variantsByItemNumber.get(key) ?? [];
    list.push(item);
    variantsByItemNumber.set(key, list);
  }

  const displayItems: InventoryItem[] = [];

  for (const group of variantsByItemNumber.values()) {
    const preferred =
      group.find(i => i.location === saleLocation && i.image_url) ??
      group.find(i => i.image_url) ??
      group.find(i => i.location === saleLocation) ??
      group[0];
    const totalQty = group.reduce((sum, i) => sum + Number(i.qty ?? 0), 0);
    const totalSellable = group.reduce((sum, i) => sum + itemSellableQty(i), 0);
    const totalExpired = group.reduce(
      (sum, i) => sum + Math.max(0, Number(i.expired_stock_qty ?? 0)),
      0,
    );
    const imageSource = group.find(i => i.image_url) ?? preferred;
    const hasBatches = group.some(i => itemHasBatches(i));
    const batchCount = group.reduce((sum, i) => sum + (i.batch_count ?? 0), 0);

    displayItems.push({
      ...preferred,
      qty: totalQty,
      sellable_qty: Math.round(totalSellable * 100) / 100,
      expired_stock_qty: Math.round(totalExpired * 100) / 100,
      has_expired_stock: group.some(i => i.has_expired_stock),
      has_batches: hasBatches,
      batch_count: batchCount > 0 ? batchCount : preferred.batch_count,
      image_url: imageSource.image_url ?? null,
      ...expiryFieldsForSaleBranch(group, saleLocation),
    });
  }

  displayItems.sort((a, b) =>
    a.item_number.localeCompare(b.item_number, undefined, { numeric: true }),
  );

  return { displayItems, variantsByItemNumber };
}

/**
 * Inventory row for cart / stock deduction.
 * Prefers preferred sale branch when it has stock; otherwise any branch with qty (highest first).
 */
export function resolveCartItemForSale(
  displayItem: InventoryItem,
  variantsByItemNumber: Map<string, InventoryItem[]>,
  preferredLocation: string,
): InventoryItem {
  const key = itemNumberKey(displayItem);
  const group = variantsByItemNumber.get(key) ?? [displayItem];

  const atPreferredWithStock = group.find(
    i => i.location === preferredLocation && itemSellableQty(i) > 0,
  );
  if (atPreferredWithStock) {
    return atPreferredWithStock;
  }

  const withStock = [...group]
    .filter(i => itemSellableQty(i) > 0)
    .sort((a, b) => itemSellableQty(b) - itemSellableQty(a));
  if (withStock.length > 0) {
    return withStock[0];
  }

  return group.find(i => i.location === preferredLocation) ?? group[0];
}

/** Cart line → inventory row at the supplying branch (for stock checks). */
export function resolveInventoryRowForCartLine(
  line: Pick<CartLine, 'item_id' | 'item_number' | 'inventory_location'>,
  rawCatalogItems: InventoryItem[],
  variantsByItemNumber: Map<string, InventoryItem[]>,
): InventoryItem | null {
  const direct = rawCatalogItems.find(i => i.id === line.item_id);
  if (direct) {
    return direct;
  }

  const key = itemNumberKey({
    item_number: line.item_number,
    id: line.item_id,
  } as InventoryItem);
  const group = variantsByItemNumber.get(key) ?? [];
  const loc = line.inventory_location?.trim();

  return (
    group.find(i => i.id === line.item_id) ??
    (loc ? group.find(i => i.location === loc) : null) ??
    group.find(i => itemSellableQty(i) > 0) ??
    group[0] ??
    null
  );
}

export function variantIdsForDisplayItem(
  displayItem: InventoryItem,
  variantsByItemNumber: Map<string, InventoryItem[]>,
): number[] {
  const key = itemNumberKey(displayItem);
  const group = variantsByItemNumber.get(key) ?? [displayItem];
  return group.map(i => i.id);
}

export function branchCountForDisplayItem(
  displayItem: InventoryItem,
  variantsByItemNumber: Map<string, InventoryItem[]>,
): number {
  const key = itemNumberKey(displayItem);
  const group = variantsByItemNumber.get(key) ?? [displayItem];
  return new Set(group.map(i => i.location).filter(Boolean)).size;
}

/** Sale location: branch that supplies most cart lines (inventory location). */
export function resolveLineInventoryLocation(
  line: Pick<CartLine, 'item_id' | 'item_number' | 'inventory_location'>,
  variantsByItemNumber: Map<string, InventoryItem[]>,
  rawCatalogItems: InventoryItem[] = [],
): string | null {
  const stored = line.inventory_location?.trim();
  if (stored) {
    return stored;
  }

  const fromRaw = rawCatalogItems.find(i => i.id === line.item_id)?.location?.trim();
  if (fromRaw) {
    return fromRaw;
  }

  const key = itemNumberKey({
    item_number: line.item_number,
    id: line.item_id,
  } as InventoryItem);
  const group = variantsByItemNumber.get(key) ?? [];
  return (
    group.find(i => i.id === line.item_id)?.location?.trim() ??
    group.find(i => i.location)?.location?.trim() ??
    null
  );
}

export function resolveSaleLocationFromCart(
  lines: CartLine[],
  variantsByItemNumber: Map<string, InventoryItem[]>,
  rawCatalogItems: InventoryItem[],
  fallback: string,
): string {
  if (lines.length === 0) {
    return fallback;
  }

  const counts = new Map<string, number>();
  for (const line of lines) {
    const loc = resolveLineInventoryLocation(line, variantsByItemNumber, rawCatalogItems);
    if (loc) {
      counts.set(loc, (counts.get(loc) ?? 0) + line.qty);
    }
  }

  if (counts.size > 0) {
    return [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
  }

  for (const line of lines) {
    const stored = line.inventory_location?.trim();
    if (stored) {
      return stored;
    }
  }

  for (const line of lines) {
    const loc = resolveLineInventoryLocation(line, variantsByItemNumber, rawCatalogItems);
    if (loc) {
      return loc;
    }
  }

  return fallback;
}

export function alignCartLinesToSaleLocation(
  lines: CartLine[],
  saleLocation: string,
  variantsByItemNumber: Map<string, InventoryItem[]>,
): CartLine[] {
  return lines.map(line => {
    const key = itemNumberKey({
      item_number: line.item_number,
      id: line.item_id,
    } as InventoryItem);
    const group = variantsByItemNumber.get(key) ?? [];
    const current =
      group.find(i => i.id === line.item_id) ??
      ({
        id: line.item_id,
        item_number: line.item_number,
        description: line.description,
        selling_price: line.unit_price,
        location: line.inventory_location,
      } as InventoryItem);

    const lineLocation =
      resolveLineInventoryLocation(line, variantsByItemNumber) ?? saleLocation;

    if (current.location === saleLocation && current.id === line.item_id) {
      return { ...line, inventory_location: saleLocation };
    }

    const atSaleLocation = group.find(i => i.location === saleLocation);
    if (atSaleLocation && lineLocation === saleLocation) {
      return {
        ...line,
        item_id: atSaleLocation.id,
        inventory_location: saleLocation,
      };
    }

    const atLineBranch =
      group.find(i => i.location === lineLocation) ??
      (current.location === lineLocation ? current : null);
    if (atLineBranch) {
      return {
        ...line,
        item_id: atLineBranch.id,
        inventory_location: lineLocation,
      };
    }

    return {
      ...line,
      inventory_location: lineLocation,
    };
  });
}

export function prepareCheckoutCart(
  lines: CartLine[],
  variantsByItemNumber: Map<string, InventoryItem[]>,
  rawCatalogItems: InventoryItem[],
  preferredLocation: string,
): { location: string; lines: CartLine[] } {
  const resolvedLines = lines.map(line => {
    const displayItem = {
      id: line.item_id,
      item_number: line.item_number,
      description: line.description,
      selling_price: line.unit_price,
      location: line.inventory_location,
      qty: line.qty,
    } as InventoryItem;

    const saleItem = resolveCartItemForSale(
      displayItem,
      variantsByItemNumber,
      line.inventory_location?.trim() || preferredLocation,
    );

    return {
      ...line,
      item_id: saleItem.id,
      inventory_location: saleItem.location?.trim() ?? line.inventory_location ?? null,
    };
  });

  const location = resolveSaleLocationFromCart(
    resolvedLines,
    variantsByItemNumber,
    rawCatalogItems,
    resolvedLines[0]?.inventory_location?.trim() || preferredLocation,
  );

  const aligned = alignCartLinesToSaleLocation(
    resolvedLines,
    location,
    variantsByItemNumber,
  );

  return {
    location: resolveSaleLocationFromCart(
      aligned,
      variantsByItemNumber,
      rawCatalogItems,
      location,
    ),
    lines: aligned,
  };
}

export function resolveSaleLocationFromLines(
  lineItemIds: number[],
  rawCatalogItems: InventoryItem[],
  fallback: string,
): string {
  if (lineItemIds.length === 0) {
    return fallback;
  }

  const counts = new Map<string, number>();
  for (const id of lineItemIds) {
    const loc = rawCatalogItems.find(i => i.id === id)?.location;
    if (loc) {
      counts.set(loc, (counts.get(loc) ?? 0) + 1);
    }
  }
  if (counts.size === 0) {
    return fallback;
  }

  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
}
