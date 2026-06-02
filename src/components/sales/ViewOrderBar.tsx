import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Box, Text } from '@gluestack-ui/themed';
import { ShoppingBag } from 'lucide-react-native';
import { PrimaryButton } from '@/components/buttons/PrimaryButton';
import { formatCurrency } from '@/utils/format';
import { colors, shadows, TAB_BAR_SCROLL_PADDING } from '@/theme';

interface ViewOrderBarProps {
  itemCount: number;
  total: number;
  currency?: string;
  isReturn?: boolean;
  onPress: () => void;
}

export const ViewOrderBar: React.FC<ViewOrderBarProps> = ({
  itemCount,
  total,
  currency,
  isReturn,
  onPress,
}) => {
  const insets = useSafeAreaInsets();

  if (itemCount <= 0) {
    return null;
  }

  return (
    <View
      style={[
        styles.wrap,
        { paddingBottom: Math.max(insets.bottom, 8) + TAB_BAR_SCROLL_PADDING - 24 },
        shadows.lg,
      ]}>
      <Box px="$4" pt="$3" pb="$1">
        <Box flexDirection="row" alignItems="center" justifyContent="space-between" mb="$2">
          <Box flexDirection="row" alignItems="center" gap="$2">
            <Box bg={colors.backgroundAlt} p="$2" borderRadius="$full" borderWidth={1} borderColor={colors.border}>
              <ShoppingBag size={18} color={colors.text} />
            </Box>
            <Text fontSize="$sm" fontWeight="$bold" color={colors.text}>
              {itemCount} item{itemCount === 1 ? '' : 's'}{' '}
              {isReturn ? 'to return' : 'selected'}
            </Text>
          </Box>
          <Text
            fontSize="$md"
            fontWeight="$bold"
            color={colors.text}>
            {formatCurrency(total, currency)}
          </Text>
        </Box>
        <PrimaryButton
          label={isReturn ? 'View Return' : 'View Order'}
          onPress={onPress}
        />
      </Box>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: TAB_BAR_SCROLL_PADDING - 24,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
