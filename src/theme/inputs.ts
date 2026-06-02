import { StyleSheet, TextStyle } from 'react-native';
import { colors } from './colors';
import { fontStyle } from './fonts';

/** Shared TextInput styling for POS forms and search fields. */
export const appInputStyle: TextStyle = {
  ...fontStyle.input,
  borderWidth: 1,
  borderColor: colors.border,
  borderRadius: 16,
  paddingHorizontal: 14,
  paddingVertical: 10,
  color: colors.text,
  backgroundColor: colors.white,
};

export const appInputPlaceholderColor = colors.textMuted;

export const appInputStyles = StyleSheet.create({
  base: appInputStyle,
});
