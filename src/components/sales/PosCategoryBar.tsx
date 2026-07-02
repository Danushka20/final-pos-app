import React, { useCallback, useEffect, useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { colors, radius, shadows, typography } from '@/theme';
import type { ItemCategory } from '@/types/inventory';

interface PosCategoryBarProps {
  categories: ItemCategory[];
  selectedCategoryId: number | null;
  selectedSubCategoryId: number | 'all';
  onSelectCategory: (id: number | null) => void;
  onSelectSubCategory: (id: number | 'all') => void;
}

interface CategoryPillProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  compact?: boolean;
}

/** Animated filter pill — smooth color/scale transition on select & press. */
const CategoryPill: React.FC<CategoryPillProps> = ({
  label,
  selected,
  onPress,
  compact = false,
}) => {
  const progress = useSharedValue(selected ? 1 : 0);
  const press = useSharedValue(1);

  useEffect(() => {
    progress.value = withTiming(selected ? 1 : 0, { duration: 220 });
  }, [progress, selected]);

  const animatedPillStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      ['transparent', colors.text],
    ),
    transform: [{ scale: press.value }],
    shadowOpacity: 0.16 * progress.value,
    elevation: 3 * progress.value,
  }));

  const animatedTextStyle = useAnimatedStyle(() => ({
    color: interpolateColor(
      progress.value,
      [0, 1],
      [colors.textSecondary, colors.textOnPrimary],
    ),
  }));

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => {
        press.value = withSpring(0.93, { damping: 16, stiffness: 260 });
      }}
      onPressOut={() => {
        press.value = withSpring(1, { damping: 14, stiffness: 220 });
      }}
      hitSlop={4}>
      <Animated.View
        style={[
          styles.pill,
          compact && styles.pillCompact,
          shadows.sm,
          animatedPillStyle,
        ]}>
        <Animated.Text
          style={[
            styles.pillText,
            compact && styles.pillTextCompact,
            selected && styles.pillTextActiveWeight,
            animatedTextStyle,
          ]}
          numberOfLines={1}>
          {label}
        </Animated.Text>
      </Animated.View>
    </Pressable>
  );
};

export const PosCategoryBar: React.FC<PosCategoryBarProps> = ({
  categories,
  selectedCategoryId,
  selectedSubCategoryId,
  onSelectCategory,
  onSelectSubCategory,
}) => {
  const activeCategory = useMemo(
    () => categories.find(c => c.id === selectedCategoryId),
    [categories, selectedCategoryId],
  );

  const selectCategory = useCallback(
    (id: number | null) => {
      onSelectCategory(id);
      onSelectSubCategory('all');
    },
    [onSelectCategory, onSelectSubCategory],
  );

  if (categories.length === 0) {
    return null;
  }

  return (
    <View style={styles.wrap}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
        keyboardShouldPersistTaps="handled">
        <CategoryPill
          label="All"
          selected={selectedCategoryId == null}
          onPress={() => selectCategory(null)}
        />
        {categories.map(cat => (
          <CategoryPill
            key={cat.id}
            label={cat.name}
            selected={selectedCategoryId === cat.id}
            onPress={() => selectCategory(cat.id)}
          />
        ))}
      </ScrollView>

      {activeCategory && activeCategory.sub_categories.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.subRow}
          keyboardShouldPersistTaps="handled">
          <CategoryPill
            label="All"
            selected={selectedSubCategoryId === 'all'}
            onPress={() => onSelectSubCategory('all')}
            compact
          />
          {activeCategory.sub_categories.map(sub => (
            <CategoryPill
              key={sub.id}
              label={sub.name}
              selected={selectedSubCategoryId === sub.id}
              onPress={() => onSelectSubCategory(sub.id)}
              compact
            />
          ))}
        </ScrollView>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    gap: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 3,
    paddingRight: 6,
  },
  subRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingBottom: 2,
    paddingRight: 6,
  },
  pill: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: radius.full,
    maxWidth: 150,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 8,
  },
  pillCompact: {
    paddingHorizontal: 13,
    paddingVertical: 7,
    maxWidth: 128,
  },
  pillText: {
    ...typography.label,
    fontSize: 13,
    lineHeight: 16,
    fontWeight: '600',
    textAlign: 'center',
    includeFontPadding: false,
  },
  pillTextCompact: {
    fontSize: 12,
    lineHeight: 15,
  },
  pillTextActiveWeight: {
    fontWeight: '800',
  },
});
