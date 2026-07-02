import React, { useState, type ReactNode } from 'react';
import { Platform, StyleSheet, TextInput, View, type TextInputProps } from 'react-native';
import { Search } from 'lucide-react-native';
import { colors, appInputPlaceholderColor, typography } from '@/theme';

interface PosSearchFieldProps extends TextInputProps {
  containerStyle?: TextInputProps['style'];
  endAdornment?: ReactNode;
}

export const PosSearchField: React.FC<PosSearchFieldProps> = ({
  style,
  containerStyle,
  endAdornment,
  onFocus,
  onBlur,
  ...props
}) => {
  const [focused, setFocused] = useState(false);

  return (
    <View
      style={[
        styles.wrap,
        focused && styles.wrapFocused,
        containerStyle,
      ]}>
      <Search size={18} color={focused ? colors.primary : colors.textMuted} />
      <TextInput
        {...props}
        style={[styles.input, style]}
        placeholderTextColor={appInputPlaceholderColor}
        cursorColor={colors.primary}
        selectionColor={colors.primaryMuted}
        returnKeyType="search"
        clearButtonMode="while-editing"
        onFocus={e => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={e => {
          setFocused(false);
          onBlur?.(e);
        }}
      />
      {endAdornment ? <View style={styles.endAdornment}>{endAdornment}</View> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.white,
    paddingHorizontal: 12,
    paddingVertical: 2,
    minHeight: 48,
  },
  wrapFocused: {
    borderColor: colors.primary,
    borderWidth: 2,
    backgroundColor: colors.white,
    ...Platform.select({
      ios: {
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 6,
      },
      android: { elevation: 3 },
      default: {},
    }),
  },
  input: {
    ...typography.input,
    flex: 1,
    paddingVertical: 10,
    color: colors.text,
    fontSize: 15,
  },
  endAdornment: {
    marginLeft: 4,
  },
});
