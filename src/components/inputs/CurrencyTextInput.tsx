import React from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';
import { getCurrencyLabel } from '@/utils/format';
import { appInputPlaceholderColor, appInputStyle, colors, radius } from '@/theme';

interface CurrencyTextInputProps extends Omit<TextInputProps, 'value' | 'onChangeText'> {
  currency?: string | null;
  value: string;
  onChangeText: (text: string) => void;
}

export const CurrencyTextInput: React.FC<CurrencyTextInputProps> = ({
  currency,
  value,
  onChangeText,
  style,
  placeholder,
  ...props
}) => {
  const label = getCurrencyLabel(currency);

  return (
    <View style={styles.wrap}>
      <View style={styles.prefix}>
        <Text style={styles.prefixText}>{label}</Text>
      </View>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        keyboardType="decimal-pad"
        style={[appInputStyle, styles.input, style]}
        placeholder={placeholder ?? '0.00'}
        placeholderTextColor={appInputPlaceholderColor}
        {...props}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  prefix: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRightWidth: 0,
    borderTopLeftRadius: radius.lg,
    borderBottomLeftRadius: radius.lg,
    backgroundColor: colors.backgroundAlt,
    paddingHorizontal: 14,
    justifyContent: 'center',
    minWidth: 56,
  },
  prefixText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  input: {
    flex: 1,
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
  },
});
