import React from 'react';
import { Receipt } from 'lucide-react-native';
import { Badge, BadgeText, Box, HStack, Text, VStack } from '@gluestack-ui/themed';

export interface RecentSale {
  id: string;
  customer: string;
  amount: string;
  time: string;
  status: 'paid' | 'pending' | 'hold';
}

interface RecentSaleRowProps {
  sale: RecentSale;
}

const statusConfig = {
  paid: { label: 'Paid', action: 'success' as const },
  pending: { label: 'Pending', action: 'warning' as const },
  hold: { label: 'Hold', action: 'muted' as const },
};

export const RecentSaleRow: React.FC<RecentSaleRowProps> = ({ sale }) => {
  const status = statusConfig[sale.status];

  return (
    <HStack
      alignItems="center"
      bg="$white"
      borderRadius="$xl"
      p="$3.5"
      mb="$2"
      borderWidth={1}
      borderColor="$borderLight300"
      gap="$3">
      <Box
        w={42}
        h={42}
        borderRadius="$lg"
        bg="#eff6ff"
        alignItems="center"
        justifyContent="center">
        <Receipt size={20} color="#2563eb" />
      </Box>
      <VStack flex={1}>
        <Text fontSize="$sm" fontWeight="$semibold" color="$textLight0">
          {sale.customer}
        </Text>
        <Text fontSize="$2xs" color="$textLight400">
          {sale.time} · #{sale.id}
        </Text>
      </VStack>
      <VStack alignItems="flex-end" space="xs">
        <Text fontSize="$sm" fontWeight="$bold" color="$textLight0">
          {sale.amount}
        </Text>
        <Badge size="sm" variant="outline" action={status.action} borderRadius="$md">
          <BadgeText fontSize="$2xs">{status.label}</BadgeText>
        </Badge>
      </VStack>
    </HStack>
  );
};
