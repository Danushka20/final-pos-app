import React from 'react';
import { HelpCircle, X } from 'lucide-react-native';
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

export interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
}) => (
  <Modal isOpen={isOpen} onClose={onCancel} size="md">
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
        <Pressable onPress={onCancel} hitSlop={12} p="$1">
          <X size={22} color={colors.textMuted} />
        </Pressable>
      </ModalHeader>

      <ModalBody px="$5" pt="$2" pb="$4">
        <VStack alignItems="center" space="md">
          <Pressable
            w={56}
            h={56}
            borderRadius="$full"
            bg={colors.warningSoft}
            borderWidth={1}
            borderColor={colors.pastelYellow}
            alignItems="center"
            justifyContent="center">
            <HelpCircle size={28} color={colors.warning} />
          </Pressable>
          <Text fontSize="$lg" fontWeight="$bold" color="$textLight0" textAlign="center">
            {title}
          </Text>
          <Text fontSize="$sm" color="$textLight400" textAlign="center" lineHeight="$lg">
            {message}
          </Text>
        </VStack>
      </ModalBody>

      <ModalFooter px="$5" pb="$5" pt="$0" borderTopWidth={0}>
        <VStack w="$full" gap="$2">
          <PrimaryButton label={confirmLabel} onPress={onConfirm} />
          <PrimaryButton label={cancelLabel} variant="outline" onPress={onCancel} />
        </VStack>
      </ModalFooter>
    </ModalContent>
  </Modal>
);
