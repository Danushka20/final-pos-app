import React, { useEffect, useState } from 'react';
import { StyleSheet, TextInput } from 'react-native';
import { colors, typography } from '@/theme';

interface CartQtyInputProps {
  qty: number;
  onCommit: (qty: number) => void;
  disabled?: boolean;
}

export const CartQtyInput: React.FC<CartQtyInputProps> = ({
  qty,
  onCommit,
  disabled,
}) => {
  const [text, setText] = useState(String(qty));
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) {
      setText(String(qty));
    }
  }, [qty, focused]);

  const commit = () => {
    const trimmed = text.trim();
    if (trimmed === '') {
      setText(String(qty));
      setFocused(false);
      return;
    }
    const parsed = parseInt(trimmed, 10);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setText(String(qty));
      setFocused(false);
      return;
    }
    onCommit(parsed);
    setFocused(false);
  };

  return (
    <TextInput
      value={text}
      onChangeText={value => setText(value.replace(/[^0-9]/g, ''))}
      onFocus={() => setFocused(true)}
      onBlur={commit}
      onSubmitEditing={commit}
      keyboardType="number-pad"
      returnKeyType="done"
      selectTextOnFocus
      editable={!disabled}
      style={[styles.input, disabled && styles.inputDisabled]}
    />
  );
};

const styles = StyleSheet.create({
  input: {
    ...typography.body,
    minWidth: 36,
    width: 44,
    height: 28,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    backgroundColor: colors.white,
    textAlign: 'center',
    fontWeight: '700',
    paddingHorizontal: 4,
    paddingVertical: 0,
    color: colors.text,
  },
  inputDisabled: {
    backgroundColor: colors.backgroundAlt,
    color: colors.textMuted,
  },
});
