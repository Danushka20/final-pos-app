import React from 'react';
import { Modal, TouchableOpacity, StyleSheet, View } from 'react-native';
import { SmoothFlatList } from '@/components/common/SmoothFlatList';
import { Box, Text } from '@gluestack-ui/themed';
import { X } from 'lucide-react-native';
import { colors } from '@/theme';

export interface SelectionOption {
  id: string;
  label: string;
  subtitle?: string;
}

interface SelectionModalProps {
  visible: boolean;
  title: string;
  options: SelectionOption[];
  onSelect: (option: SelectionOption) => void;
  onClose: () => void;
  emptyMessage?: string;
  footerActionLabel?: string;
  onFooterAction?: () => void;
}

export const SelectionModal: React.FC<SelectionModalProps> = ({
  visible,
  title,
  options,
  onSelect,
  onClose,
  emptyMessage = 'No options found',
  footerActionLabel,
  onFooterAction,
}) => (
  <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
    <View style={styles.overlay}>
      <Box bg={colors.white} borderTopLeftRadius={20} borderTopRightRadius={20} flex={1} mt="30%">
        <Box
          flexDirection="row"
          alignItems="center"
          justifyContent="space-between"
          px="$4"
          py="$3"
          borderBottomWidth={1}
          borderColor={colors.border}>
          <Text size="lg" fontWeight="$bold" color={colors.text}>
            {title}
          </Text>
          <TouchableOpacity onPress={onClose} hitSlop={12}>
            <X size={22} color={colors.textSecondary} />
          </TouchableOpacity>
        </Box>
        {footerActionLabel && onFooterAction ? (
          <TouchableOpacity style={styles.footerAction} onPress={onFooterAction}>
            <Text fontWeight="$bold" color={colors.primary}>
              {footerActionLabel}
            </Text>
          </TouchableOpacity>
        ) : null}
        <SmoothFlatList
          data={options}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text textAlign="center" color={colors.textMuted} py="$8">
              {emptyMessage}
            </Text>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.row}
              onPress={() => {
                onSelect(item);
                onClose();
              }}>
              <Text fontWeight="$semibold" color={colors.text}>
                {item.label}
              </Text>
              {item.subtitle ? (
                <Text size="sm" color={colors.textMuted} mt="$0.5">
                  {item.subtitle}
                </Text>
              ) : null}
            </TouchableOpacity>
          )}
        />
      </Box>
    </View>
  </Modal>
);

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  list: {
    paddingBottom: 32,
  },
  footerAction: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    backgroundColor: colors.primarySoft,
  },
  row: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
});
