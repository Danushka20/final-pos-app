import {
  MD3LightTheme,
  configureFonts,
  type MD3Theme,
} from 'react-native-paper';
import { colors } from './colors';
import { fontFamily } from './fonts';

const fontConfig = {
  fontFamily: fontFamily.regular,
};

export const paperTheme: MD3Theme = {
  ...MD3LightTheme,
  roundness: 20,
  colors: {
    ...MD3LightTheme.colors,
    primary: colors.primary,
    onPrimary: colors.textOnPrimary,
    primaryContainer: colors.primarySoft,
    onPrimaryContainer: colors.text,
    secondary: colors.accent,
    onSecondary: colors.textOnPrimary,
    secondaryContainer: colors.accentSoft,
    onSecondaryContainer: colors.text,
    tertiary: colors.primaryLight,
    surface: colors.white,
    surfaceVariant: colors.backgroundAlt,
    onSurface: colors.text,
    onSurfaceVariant: colors.textSecondary,
    outline: colors.border,
    outlineVariant: colors.borderLight,
    error: colors.error,
    onError: colors.textOnPrimary,
    errorContainer: colors.errorSoft,
    onErrorContainer: colors.error,
    background: colors.backgroundAlt,
    elevation: {
      level0: 'transparent',
      level1: colors.white,
      level2: colors.surfaceElevated,
      level3: colors.white,
      level4: colors.white,
      level5: colors.white,
    },
  },
  fonts: configureFonts({ config: fontConfig }),
};
