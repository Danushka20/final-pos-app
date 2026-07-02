import type { ItemCategory } from '@/types/inventory';
import type { InventoryItem } from '@/types/sales';

export function deriveCategoriesFromItems(rows: InventoryItem[]): ItemCategory[] {
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
}

export function mergeCategoryLists(
  primary: ItemCategory[],
  secondary: ItemCategory[],
): ItemCategory[] {
  const merged = new Map<string, ItemCategory>();

  const add = (cat: ItemCategory) => {
    const key =
      cat.id > 0 ? `id:${cat.id}` : `name:${cat.name.trim().toLowerCase()}`;
    const existing = merged.get(key);
    if (!existing) {
      merged.set(key, {
        ...cat,
        sub_categories: [...cat.sub_categories],
      });
      return;
    }

    const subByKey = new Map<string, { id: number; name: string }>();
    for (const sub of [...existing.sub_categories, ...cat.sub_categories]) {
      const subKey =
        sub.id > 0 ? `id:${sub.id}` : `name:${sub.name.trim().toLowerCase()}`;
      if (!subByKey.has(subKey)) {
        subByKey.set(subKey, sub);
      }
    }

    merged.set(key, {
      ...existing,
      id: existing.id > 0 ? existing.id : cat.id,
      product_type: existing.product_type ?? cat.product_type,
      sub_categories: [...subByKey.values()].sort((a, b) =>
        a.name.localeCompare(b.name),
      ),
    });
  };

  for (const cat of primary) {
    add(cat);
  }
  for (const cat of secondary) {
    add(cat);
  }

  return [...merged.values()].sort((a, b) => a.name.localeCompare(b.name));
}
