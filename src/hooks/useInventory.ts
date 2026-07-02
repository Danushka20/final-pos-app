import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAutoRefresh } from '@/hooks/useAutoRefresh';
import { inventoryService } from '@/services/api/inventoryService';
import {
  deriveCategoriesFromItems,
  mergeCategoryLists,
} from '@/utils/inventoryCategoryUtils';
import type { ItemCategory } from '@/types/inventory';
import type { InventoryItem } from '@/types/sales';

export const useInventory = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [categories, setCategories] = useState<ItemCategory[]>([]);
  const [categoryId, setCategoryId] = useState<number | 'all'>('all');
  const [subCategoryId, setSubCategoryId] = useState<number | 'all'>('all');
  const [search, setSearch] = useState('');

  const load = useCallback(async (silent = false) => {
    if (!silent) {
      setLoading(true);
      setError(null);
    }
    try {
      const [list, categoryResult] = await Promise.all([
        inventoryService.list(),
        inventoryService.getCategories({ location: 'all' }),
      ]);

      setItems(list.items);
      setCategories(
        mergeCategoryLists(
          categoryResult,
          deriveCategoriesFromItems(list.items),
        ),
      );
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
  }, []);

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
      setSubCategoryId('all');
    }
  }, [categories, categoryId]);

  useEffect(() => {
    if (subCategoryId === 'all' || categoryId === 'all') {
      return;
    }
    const cat = categories.find(c => c.id === categoryId);
    const exists = cat?.sub_categories.some(s => s.id === subCategoryId);
    if (!exists) {
      setSubCategoryId('all');
    }
  }, [categories, categoryId, subCategoryId]);

  const handleSetCategoryId = useCallback((value: number | 'all') => {
    setCategoryId(value);
    setSubCategoryId('all');
  }, []);

  const selectedCategory = useMemo(
    () =>
      categoryId === 'all'
        ? null
        : (categories.find(c => c.id === categoryId) ?? null),
    [categories, categoryId],
  );

  const subCategoryOptions = useMemo(
    () => selectedCategory?.sub_categories ?? [],
    [selectedCategory],
  );

  const categoryOptions = useMemo(
    () => categories.map(c => c.name),
    [categories],
  );

  const filteredItems = useMemo(() => {
    let rows = items;
    if (categoryId !== 'all') {
      const cat = categories.find(c => c.id === categoryId);
      if (cat) {
        rows = rows.filter(
          i =>
            i.item_category_id === cat.id ||
            i.category?.trim().toLowerCase() === cat.name.trim().toLowerCase(),
        );
        if (subCategoryId !== 'all') {
          const sub = cat.sub_categories.find(s => s.id === subCategoryId);
          if (sub) {
            rows = rows.filter(
              i =>
                i.item_sub_category_id === sub.id ||
                i.sub_category?.trim().toLowerCase() ===
                  sub.name.trim().toLowerCase(),
            );
          }
        }
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
  }, [items, categories, categoryId, subCategoryId, search]);

  return {
    loading,
    error,
    items: filteredItems,
    categories,
    categoryOptions,
    categoryId,
    setCategoryId: handleSetCategoryId,
    subCategoryId,
    setSubCategoryId,
    subCategoryOptions,
    search,
    setSearch,
    refresh: () => load(false),
  };
};
