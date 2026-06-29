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
}

export const PosItemExpiryChip: React.FC<PosItemExpiryChipProps> = ({ item }) => {
  if (!itemHasExpiryDate(item)) {
    return null;
  }

  const resolved = resolveItemExpiry(item);
  const chipColors = expiryChipStyles(resolved.status);
  const label = expiryChipLabel(item);

  return (
    <View
      style={[
        styles.chip,
        {
          backgroundColor: chipColors.backgroundColor,
          borderColor: chipColors.borderColor,
        },
      ]}>
      <Text
        style={[styles.label, { color: chipColors.textColor }]}
        numberOfLines={1}
        adjustsFontSizeToFit
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
  label: {
    ...typography.caption,
    fontSize: 8,
    fontWeight: '700',
    textAlign: 'center',
  },
});
