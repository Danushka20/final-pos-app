import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAutoRefresh } from '@/hooks/useAutoRefresh';
import { inventoryService } from '@/services/api/inventoryService';
import type {
  ItemCategory,
  InventoryFilters,
} from '@/types/inventory';
import type { InventoryItem } from '@/types/sales';

const deriveCategoriesFromItems = (rows: InventoryItem[]): ItemCategory[] => {
  const map = new Map<
    string,
    {
      id: number;
      name: string;
      sub: Map<string, { id: number; name: string }>;
    }
  >();
  let generatedCategoryId = -1;
  let generatedSubId = -1;

  for (const item of rows) {
    const categoryName = item.category?.trim();
    if (!categoryName) {
      continue;
    }
    const categoryKey =
      item.item_category_id != null
        ? `id:${item.item_category_id}`
        : `name:${categoryName.toLowerCase()}`;

    let category = map.get(categoryKey);
    if (!category) {
      category = {
        id: item.item_category_id ?? generatedCategoryId--,
        name: categoryName,
        sub: new Map<string, { id: number; name: string }>(),
      };
      map.set(categoryKey, category);
    }

    const subName = item.sub_category?.trim();
    if (!subName) {
      continue;
    }
    const subKey =
      item.item_sub_category_id != null
        ? `id:${item.item_sub_category_id}`
        : `name:${subName.toLowerCase()}`;
    if (!category.sub.has(subKey)) {
      category.sub.set(subKey, {
        id: item.item_sub_category_id ?? generatedSubId--,
        name: subName,
      });
    }
  }

  return [...map.values()]
    .map(c => ({
      id: c.id,
      name: c.name,
      sub_categories: [...c.sub.values()].sort((a, b) =>
        a.name.localeCompare(b.name),
      ),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
};

export const useInventory = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [filters, setFilters] = useState<InventoryFilters>({
    product_types: [],
    locations: [],
  });
  const [categories, setCategories] = useState<ItemCategory[]>([]);
  const [location, setLocation] = useState('all');
  const [productType, setProductType] = useState('all');
  const [categoryId, setCategoryId] = useState<number | 'all'>('all');
  const [search, setSearch] = useState('');

  const load = useCallback(async (silent = false) => {
    if (!silent) {
      setLoading(true);
      setError(null);
    }
    try {
      const list = await inventoryService.list({
        location: location === 'all' ? undefined : location,
        product_type: productType === 'all' ? undefined : productType,
      });
      setItems(list.items);
      setFilters(list.filters);
      setCategories(deriveCategoriesFromItems(list.items));
      if (!silent) {
        setError(null);
      }
    } catch (e) {
      if (!silent) {
        setError(e instanceof Error ? e.message : 'Failed to load inventory');
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, [location, productType]);

  useEffect(() => {
    load(false);
  }, [load]);

  useAutoRefresh({
    onRefresh: silent => load(silent),
    scopes: ['inventory', 'sales', 'dashboard', 'purchases', 'reports'],
  });

  useEffect(() => {
    if (categoryId === 'all') {
      return;
    }
    const exists = categories.some(c => c.id === categoryId);
    if (!exists) {
      setCategoryId('all');
    }
  }, [categories, categoryId]);

  const filteredItems = useMemo(() => {
    let rows = items;
    if (categoryId !== 'all') {
      const cat = categories.find(c => c.id === categoryId);
      if (cat) {
        rows = rows.filter(
          i => i.category === cat.name || i.item_category_id === cat.id,
        );
      }
    }
    const q = search.trim().toLowerCase();
    if (q) {
      rows = rows.filter(
        i =>
          i.description.toLowerCase().includes(q) ||
          i.item_number.toLowerCase().includes(q) ||
          (i.sku?.toLowerCase().includes(q) ?? false),
      );
    }
    return rows;
  }, [items, categories, categoryId, search]);

  return {
    loading,
    error,
    items: filteredItems,
    filters,
    categories,
    location,
    setLocation,
    productType,
    setProductType,
    categoryId,
    setCategoryId,
    search,
    setSearch,
    refresh: () => load(false),
  };
};
