import React from 'react';
import { Box, Text } from '@gluestack-ui/themed';
import { FilterChips } from '@/components/common/FilterChips';
import { colors } from '@/theme';
import type { ItemCategory } from '@/types/inventory';

interface PosCategoryBarProps {
  categories: ItemCategory[];
  selectedCategoryId: number | null;
  selectedSubCategoryId: number | 'all';
  onSelectCategory: (id: number | null) => void;
  onSelectSubCategory: (id: number | 'all') => void;
}

export const PosCategoryBar: React.FC<PosCategoryBarProps> = ({
  categories,
  selectedCategoryId,
  selectedSubCategoryId,
  onSelectCategory,
  onSelectSubCategory,
}) => {
  if (categories.length === 0) {
    return (
      <Text size="xs" color={colors.textMuted} py="$1">
        No categories — showing all products
      </Text>
    );
  }

  const activeCategory = categories.find(c => c.id === selectedCategoryId);
  const categoryNames = ['All', ...categories.map(c => c.name)];
  const selectedCategoryName =
    selectedCategoryId == null
      ? 'All'
      : (activeCategory?.name ?? categoryNames[1] ?? 'All');

  const subNames =
    activeCategory?.sub_categories.map(s => s.name) ?? [];

  return (
    <Box mb="$1">
      <FilterChips
        label="Category"
        options={categoryNames}
        selected={selectedCategoryName}
        onSelect={name => {
          if (name === 'All') {
            onSelectCategory(null);
            onSelectSubCategory('all');
            return;
          }
          const cat = categories.find(c => c.name === name);
          if (cat) {
            onSelectCategory(cat.id);
            onSelectSubCategory('all');
          }
        }}
        showAllOption={false}
      />

      {activeCategory && subNames.length > 0 ? (
        <FilterChips
          label="Sub-category"
          options={subNames}
          selected={
            selectedSubCategoryId === 'all'
              ? 'all'
              : (activeCategory.sub_categories.find(
                  s => s.id === selectedSubCategoryId,
                )?.name ?? 'all')
          }
          onSelect={name => {
            if (name === 'all') {
              onSelectSubCategory('all');
              return;
            }
            const sub = activeCategory.sub_categories.find(s => s.name === name);
            if (sub) {
              onSelectSubCategory(sub.id);
            }
          }}
        />
      ) : null}
    </Box>
  );
};
