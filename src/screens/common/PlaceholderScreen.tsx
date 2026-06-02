import React from 'react';
import { Box, Text, VStack } from '@gluestack-ui/themed';
import { ScreenContainer } from '@/components/common/ScreenContainer';
import { AppHeader } from '@/components/common/AppHeader';
import { colors } from '@/theme';

export const PlaceholderScreen: React.FC = () => (
  <ScreenContainer>
    <AppHeader title="Coming soon" />
    <Box flex={1} alignItems="center" justifyContent="center" px="$8">
      <VStack alignItems="center" space="md">
        <Box
          w={72}
          h={72}
          borderRadius="$full"
          bg={colors.primarySoft}
          alignItems="center"
          justifyContent="center">
          <Text fontSize="$2xl">🚧</Text>
        </Box>
        <Text fontSize="$lg" fontWeight="$semibold" color={colors.text} textAlign="center">
          This section is under development
        </Text>
      </VStack>
    </Box>
  </ScreenContainer>
);
