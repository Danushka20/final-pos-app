import React from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { Pressable } from '@gluestack-ui/themed';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, shadows } from '@/theme';

interface FloatingBackButtonProps {
  onPress: () => void;
  style?: ViewStyle;
}

/** Compact circular back — floats top-left over the screen. */
export const FloatingBackButton: React.FC<FloatingBackButtonProps> = ({ onPress, style }) => {
  const insets = useSafeAreaInsets();

  return (
    <Pressable
      onPress={onPress}
      hitSlop={12}
      style={[
        styles.fab,
        shadows.md,
        { top: insets.top + 6, left: 12 },
        style,
      ]}
      $active-opacity={0.9}
      accessibilityRole="button"
      accessibilityLabel="Go back">
      <ArrowLeft size={20} color={colors.primary} strokeWidth={2.5} />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    zIndex: 100,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
