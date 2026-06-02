import React from 'react';
import { AlertCircle, AlertTriangle, Info, X } from 'lucide-react-native';
import {
  Modal,
  ModalBackdrop,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Pressable,
  Text,
  VStack,
} from '@gluestack-ui/themed';
import { PrimaryButton } from '@/components/buttons/PrimaryButton';
import { colors } from '@/theme';

export type ErrorDialogVariant = 'error' | 'warning' | 'info';

export interface ErrorDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  variant?: ErrorDialogVariant;
  confirmLabel?: string;
  onClose: () => void;
}

const variantConfig = {
  error: {
    icon: AlertCircle,
    color: colors.error,
    bg: colors.errorSoft,
    border: colors.pastelPink,
  },
  warning: {
    icon: AlertTriangle,
    color: colors.warning,
    bg: colors.warningSoft,
    border: colors.pastelYellow,
  },
  info: {
    icon: Info,
    color: colors.text,
    bg: colors.infoSoft,
    border: colors.border,
  },
};

export const ErrorDialog: React.FC<ErrorDialogProps> = ({
  isOpen,
  title,
  message,
  variant = 'error',
  confirmLabel = 'OK',
  onClose,
}) => {
  const config = variantConfig[variant];
  const Icon = config.icon;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <ModalBackdrop bg={colors.overlay} />
      <ModalContent
        bg="$white"
        borderRadius="$2xl"
        borderWidth={1}
        borderColor="$borderLight300"
        mx="$5"
        maxWidth={400}>
        <ModalHeader
          borderBottomWidth={0}
          pb="$0"
          pt="$5"
          px="$5"
          flexDirection="row"
          justifyContent="flex-end">
          <Pressable onPress={onClose} hitSlop={12} p="$1">
            <X size={22} color={colors.textMuted} />
          </Pressable>
        </ModalHeader>

        <ModalBody px="$5" pt="$2" pb="$4">
          <VStack alignItems="center" space="md">
            <Pressable
              w={56}
              h={56}
              borderRadius="$full"
              bg={config.bg}
              borderWidth={1}
              borderColor={config.border}
              alignItems="center"
              justifyContent="center">
              <Icon size={28} color={config.color} />
            </Pressable>

            <Text
              fontSize="$lg"
              fontWeight="$bold"
              color="$textLight0"
              textAlign="center">
              {title}
            </Text>

            <Text
              fontSize="$sm"
              color="$textLight400"
              textAlign="center"
              lineHeight="$lg">
              {message}
            </Text>
          </VStack>
        </ModalBody>

        <ModalFooter px="$5" pb="$5" pt="$0" borderTopWidth={0}>
          <PrimaryButton label={confirmLabel} onPress={onClose} />
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
