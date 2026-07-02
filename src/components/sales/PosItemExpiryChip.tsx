import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import type { InventoryItem } from '@/types/sales';
import {
  expiryChipLabel,
  expiryChipStyles,
  itemHasExpiryDate,
  resolveItemExpiry,
} from '@/utils/expiryUtils';
import { radius, typography } from '@/theme';

interface PosItemExpiryChipProps {
  item: InventoryItem;
  /** Product card: compact left-aligned pill */
  variant?: 'default' | 'card';
}

export const PosItemExpiryChip: React.FC<PosItemExpiryChipProps> = ({
  item,
  variant = 'default',
}) => {
  if (!itemHasExpiryDate(item)) {
    return null;
  }

  const resolved = resolveItemExpiry(item);
  const chipColors = expiryChipStyles(resolved.status);
  const label = expiryChipLabel(item);
  const isCard = variant === 'card';

  return (
    <View
      style={[
        styles.chip,
        isCard && styles.chipCard,
        {
          backgroundColor: chipColors.backgroundColor,
          borderColor: chipColors.borderColor,
        },
      ]}>
      <Text
        style={[
          styles.label,
          isCard && styles.labelCard,
          { color: chipColors.textColor },
        ]}
        numberOfLines={1}
        adjustsFontSizeToFit={!isCard}
        minimumFontScale={0.8}>
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  chip: {
    width: '100%',
    marginTop: 4,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: radius.sm,
    borderWidth: 1,
    alignItems: 'center',
  },
  chipCard: {
    width: 'auto',
    alignSelf: 'flex-start',
    marginTop: 3,
    marginBottom: 1,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  label: {
    ...typography.caption,
    fontSize: 8,
    fontWeight: '700',
    textAlign: 'center',
  },
  labelCard: {
    fontSize: 8,
    fontWeight: '800',
    textAlign: 'left',
  },
});
