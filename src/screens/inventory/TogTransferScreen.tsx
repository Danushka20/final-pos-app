import React from 'react';
import { Box, Text, VStack } from '@gluestack-ui/themed';
import { ArrowLeftRight } from 'lucide-react-native';
import { ScreenContainer } from '@/components/common/ScreenContainer';
import { AppHeader } from '@/components/common/AppHeader';
import { colors } from '@/theme';

/** TOG (transfer of goods) between locations — full flow is on web POS for now. */
export const TogTransferScreen: React.FC = () => (
  <ScreenContainer>
    <AppHeader title="TOG transfer" subtitle="Transfer of goods" showBack />
    <Box flex={1} alignItems="center" justifyContent="center" px="$8">
      <VStack alignItems="center" space="md">
        <Box
          w={72}
          h={72}
          borderRadius="$full"
          bg={colors.primarySoft}
          alignItems="center"
          justifyContent="center">
          <ArrowLeftRight size={32} color={colors.primary} />
        </Box>
        <Text fontSize="$lg" fontWeight="$semibold" color={colors.text} textAlign="center">
          TOG transfer on mobile
        </Text>
        <Text fontSize="$sm" color={colors.textSecondary} textAlign="center">
          Stock transfers between locations (TOG) are available on the web POS under
          Inventory → Repair transfer. Mobile support will be added in a future update.
        </Text>
        <Text fontSize="$xs" color={colors.textMuted} textAlign="center" mt="$2">
          Use Stock adjustment to correct quantities at a single location today.
        </Text>
      </VStack>
    </Box>
  </ScreenContainer>
);
