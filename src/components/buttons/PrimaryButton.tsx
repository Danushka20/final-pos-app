import React from 'react';
import { StyleSheet } from 'react-native';
import { Pressable, Text, ActivityIndicator } from 'react-native';
import { colors, shadows, typography } from '@/theme';

interface PrimaryButtonProps {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'outline' | 'outlineLight' | 'ghost' | 'light';
  /** Smaller button for dialogs/modals (no bottom margin). */
  compact?: boolean;
}

export const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  label,
  onPress,
  loading = false,
  disabled = false,
  variant = 'primary',
  compact = false,
}) => {
  const isDisabled = disabled || loading;

  if (variant === 'outline') {
    return (
      <Pressable
        onPress={onPress}
        disabled={isDisabled}
        style={[
          styles.base,
          compact && styles.compact,
          styles.outline,
          isDisabled && styles.disabled,
        ]}>
        {loading ? (
          <ActivityIndicator color={colors.primary} />
        ) : (
          <Text style={styles.outlineText}>{label}</Text>
        )}
      </Pressable>
    );
  }

  if (variant === 'outlineLight') {
    return (
      <Pressable
        onPress={onPress}
        disabled={isDisabled}
        style={[
          styles.base,
          compact && styles.compact,
          styles.outlineLight,
          isDisabled && styles.disabled,
        ]}>
        {loading ? (
          <ActivityIndicator color={colors.textOnDark} />
        ) : (
          <Text style={styles.outlineLightText}>{label}</Text>
        )}
      </Pressable>
    );
  }

  if (variant === 'ghost') {
    return (
      <Pressable onPress={onPress} disabled={isDisabled} style={styles.ghost}>
        <Text style={styles.ghostText}>{label}</Text>
      </Pressable>
    );
  }

  if (variant === 'light') {
    return (
      <Pressable
        onPress={onPress}
        disabled={isDisabled}
        style={[styles.base, compact && styles.compact, styles.light, shadows.md, isDisabled && styles.disabled]}>
        {loading ? (
          <ActivityIndicator color={colors.primary} />
        ) : (
          <Text style={styles.lightText}>{label}</Text>
        )}
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={[
        styles.base,
        compact && styles.compact,
        styles.primary,
        shadows.md,
        isDisabled && styles.disabled,
      ]}>
      {loading ? (
        <ActivityIndicator color={colors.textOnPrimary} />
      ) : (
        <Text style={styles.primaryText}>{label}</Text>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    width: '100%',
    marginBottom: 12,
    borderRadius: 999,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compact: {
    height: 46,
    marginBottom: 0,
    borderRadius: 10,
  },
  primary: {
    backgroundColor: colors.primary,
  },
  primaryText: {
    ...typography.button,
    color: colors.textOnPrimary,
  },
  outline: {
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: colors.white,
  },
  outlineText: {
    ...typography.button,
    color: colors.primary,
  },
  outlineLight: {
    borderWidth: 2,
    borderColor: colors.white,
    backgroundColor: 'transparent',
  },
  outlineLightText: {
    ...typography.button,
    color: colors.textOnDark,
  },
  light: {
    backgroundColor: colors.white,
  },
  lightText: {
    ...typography.button,
    color: colors.primary,
  },
  ghost: {
    paddingVertical: 8,
    alignItems: 'center',
    marginBottom: 4,
  },
  ghostText: {
    fontFamily: typography.bodyMedium.fontFamily,
    fontWeight: typography.bodyMedium.fontWeight,
    fontSize: 15,
    color: colors.textMuted,
  },
  disabled: {
    opacity: 0.55,
    backgroundColor: colors.textMuted,
  },
});
