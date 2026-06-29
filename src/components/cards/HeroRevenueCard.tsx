import React from 'react';
import { TrendingUp } from 'lucide-react-native';
import { Box, HStack, Text, VStack } from '@gluestack-ui/themed';
import { colors, shadows } from '@/theme';

interface HeroRevenueCardProps {
  label?: string;
  amount: string;
  change?: string;
  loading?: boolean;
}

export const HeroRevenueCard: React.FC<HeroRevenueCardProps> = ({
  label = "Today's revenue",
  amount,
  change,
  loading,
}) => (
  <Box
    borderRadius="$2xl"
    mb="$5"
    bg={colors.white}
    borderWidth={1}
    borderColor={colors.border}
    style={shadows.card}>
    <Box p="$5">
      <HStack alignItems="center" justifyContent="space-between">
        <VStack flex={1} space="xs">
          <Text fontSize="$xs" color={colors.textMuted} fontWeight="$semibold">
            {label}
          </Text>
          <Text fontSize="$3xl" fontWeight="$bold" color={colors.text}>
            {loading ? '—' : amount}
          </Text>
          {change ? (
            <HStack alignItems="center" gap="$1" mt="$1">
              <TrendingUp size={14} color={colors.textMuted} />
              <Text fontSize="$xs" color={colors.textSecondary} fontWeight="$semibold">
                {change}
              </Text>
            </HStack>
          ) : null}
        </VStack>
        <Box
          w={56}
          h={56}
          borderRadius="$full"
          bg={colors.backgroundAlt}
          alignItems="center"
          justifyContent="center"
          borderWidth={1}
          borderColor={colors.border}>
          <TrendingUp size={28} color={colors.text} />
        </Box>
      </HStack>
    </Box>
  </Box>
);
