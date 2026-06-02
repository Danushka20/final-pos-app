import React from 'react';
import { Box, HStack, Text, VStack } from '@gluestack-ui/themed';
import { colors } from '@/theme';

interface SettingFieldProps {
  label: string;
  value?: string | number | boolean | null;
  hint?: string;
}

export const SettingField: React.FC<SettingFieldProps> = ({
  label,
  value,
  hint,
}) => {
  const display =
    typeof value === 'boolean'
      ? value
        ? 'On'
        : 'Off'
      : value === null || value === undefined || value === ''
        ? '—'
        : String(value);

  return (
    <Box
      py="$3"
      px="$4"
      borderBottomWidth={1}
      borderColor={colors.border}>
      <HStack justifyContent="space-between" alignItems="flex-start" gap="$3">
        <VStack flex={1}>
          <Text size="sm" color={colors.textSecondary}>
            {label}
          </Text>
          {hint ? (
            <Text size="xs" color={colors.textMuted} mt="$0.5">
              {hint}
            </Text>
          ) : null}
        </VStack>
        <Text
          size="sm"
          fontWeight="$semibold"
          color={colors.text}
          textAlign="right"
          maxWidth="55%">
          {display}
        </Text>
      </HStack>
    </Box>
  );
};
