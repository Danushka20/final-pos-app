import { config as defaultConfig } from '@gluestack-ui/config';
import { colors } from './colors';
import { fontFamily, fontWeight } from './fonts';

export const appGluestackConfig = {
  ...defaultConfig,
  tokens: {
    ...defaultConfig.tokens,
    fonts: {
      ...defaultConfig.tokens.fonts,
      heading: fontFamily.extrabold,
      body: fontFamily.regular,
      mono: 'monospace',
    },
    fontWeights: {
      ...defaultConfig.tokens.fontWeights,
      normal: fontWeight.regular,
      medium: fontWeight.medium,
      semibold: fontWeight.semibold,
      bold: fontWeight.bold,
    },
    colors: {
      ...defaultConfig.tokens.colors,
      primary500: colors.primary,
      primary600: colors.primaryDark,
      primary700: colors.primaryDeep,
      primary400: colors.primaryLight,
      primary50: colors.primarySoft,
      backgroundLight0: colors.backgroundAlt,
      backgroundLight50: colors.surfaceBlue,
      backgroundLight100: colors.surface,
      backgroundDark900: colors.background,
      backgroundDark800: colors.surface,
      textLight0: colors.text,
      textLight400: colors.textSecondary,
      textLight500: colors.textMuted,
      borderLight300: colors.border,
      error500: colors.error,
      success500: colors.success,
      warning500: colors.warning,
    },
  },
};
