import React from 'react';
import { Box, Pressable, Text } from '@gluestack-ui/themed';
import { SmoothScrollView } from '@/components/common/SmoothScrollView';
import { colors, shadows, smoothHorizontalScrollProps, typography } from '@/theme';

interface FilterChipsProps {
  label?: string;
  options: string[];
  selected: string;
  onSelect: (value: string) => void;
  allLabel?: string;
  showAllOption?: boolean;
}

export const FilterChips: React.FC<FilterChipsProps> = ({
  label,
  options,
  selected,
  onSelect,
  allLabel = 'All',
  showAllOption = true,
}) => {
  const cleaned = options.filter(o => o && o !== 'all');
  const values = showAllOption ? ['all', ...cleaned] : cleaned;

  return (
    <Box mb="$1">
      {label ? (
        <Text
          size="xs"
          fontWeight="$bold"
          color={colors.textSecondary}
          mb="$1.5"
          textTransform="uppercase"
          letterSpacing={0.5}>
          {label}
        </Text>
      ) : null}
      <SmoothScrollView
        horizontal
        contentPaddingBottom={0}
        {...smoothHorizontalScrollProps}>
        <Box flexDirection="row" gap="$2" py="$1">
          {values.map(value => {
            const active = selected === value;
            const chipLabel = value === 'all' ? allLabel : value;
            return (
              <Pressable
                key={value}
                onPress={() => onSelect(value)}
                px="$4"
                py="$2.5"
                borderRadius="$full"
                borderWidth={active ? 0 : 1}
                borderColor={colors.border}
                bg={active ? colors.primary : colors.white}
                style={active ? shadows.sm : undefined}>
                <Text
                  size="xs"
                  fontWeight="$bold"
                  fontFamily={typography.label.fontFamily}
                  color={active ? colors.textOnPrimary : colors.textSecondary}>
                  {chipLabel}
                </Text>
              </Pressable>
            );
          })}
        </Box>
      </SmoothScrollView>
    </Box>
  );
};
