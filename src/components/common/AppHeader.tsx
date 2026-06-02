import React from 'react';
import { Box, HStack, Text, VStack } from '@gluestack-ui/themed';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FloatingBackButton } from '@/components/common/FloatingBackButton';
import { useAppBack } from '@/hooks/useAppBack';
import { colors, typography } from '@/theme';

interface AppHeaderProps {
  greeting?: string;
  title: string;
  subtitle?: string;
  /** Default true. Set false only on the main dashboard. */
  showBack?: boolean;
  rightSlot?: React.ReactNode;
  onBackPress?: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  greeting,
  title,
  subtitle,
  showBack = true,
  rightSlot,
  onBackPress,
}) => {
  const insets = useSafeAreaInsets();
  const handleBack = useAppBack(onBackPress);
  const backInset = showBack ? 50 : 0;

  return (
    <Box bg={colors.backgroundAlt} borderBottomWidth={1} borderBottomColor={colors.border}>
      {showBack ? <FloatingBackButton onPress={handleBack} /> : null}
      <Box
        style={{
          paddingTop: insets.top + 10,
          paddingBottom: 14,
          paddingLeft: 16 + backInset,
          paddingRight: 16,
        }}>
        <HStack alignItems="center" justifyContent="space-between" minHeight={40}>
          <VStack flex={1} minWidth={0} pr="$2">
            {greeting ? (
              <Text
                style={[
                  typography.label,
                  { color: colors.textMuted, textTransform: 'uppercase', fontSize: 11 },
                ]}>
                {greeting}
              </Text>
            ) : null}
            <Text
              style={[
                typography.screenTitle,
                { color: colors.text, marginTop: greeting ? 4 : 0, fontSize: 28 },
              ]}
              numberOfLines={1}>
              {title}
            </Text>
            {subtitle ? (
              <Text
                style={[typography.caption, { color: colors.textSecondary, marginTop: 4 }]}
                numberOfLines={1}>
                {subtitle}
              </Text>
            ) : null}
          </VStack>
          {rightSlot ? <HStack alignItems="center">{rightSlot}</HStack> : null}
        </HStack>
      </Box>
    </Box>
  );
};
