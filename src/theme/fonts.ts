import { Platform, TextStyle } from 'react-native';

/**
 * BizLink-style typography: Inter when linked, otherwise system stack.
 * Run `npm run link:fonts` after adding/updating files in src/assets/fonts/.
 */
export const USE_INTER_FONTS = true;

const inter = {
  regular: 'Inter-Regular',
  medium: 'Inter-Medium',
  semibold: 'Inter-SemiBold',
  bold: 'Inter-Bold',
  extrabold: 'Inter-ExtraBold',
} as const;

const system = {
  regular: Platform.select({
    ios: 'System',
    android: 'Roboto',
    default: 'System',
  })!,
  medium: Platform.select({
    ios: 'System',
    android: 'Roboto',
    default: 'System',
  })!,
  semibold: Platform.select({
    ios: 'System',
    android: 'Roboto',
    default: 'System',
  })!,
  bold: Platform.select({
    ios: 'System',
    android: 'Roboto',
    default: 'System',
  })!,
  extrabold: Platform.select({
    ios: 'System',
    android: 'Roboto',
    default: 'System',
  })!,
};

export const fontFamily = USE_INTER_FONTS ? inter : system;

export const fontWeight = {
  regular: '400' as TextStyle['fontWeight'],
  medium: '500' as TextStyle['fontWeight'],
  semibold: '600' as TextStyle['fontWeight'],
  bold: '700' as TextStyle['fontWeight'],
  extrabold: '800' as TextStyle['fontWeight'],
};

export const letterSpacing = {
  tight: -0.6,
  normal: 0,
  wide: 0.4,
  button: 0.2,
  caption: 0.2,
  screenTitle: -0.8,
} as const;

export const fontStyle = {
  body: {
    fontFamily: fontFamily.regular,
    fontWeight: fontWeight.regular,
    fontSize: 15,
    lineHeight: 22,
    letterSpacing: letterSpacing.normal,
  } satisfies TextStyle,
  bodyMedium: {
    fontFamily: fontFamily.medium,
    fontWeight: fontWeight.medium,
    fontSize: 15,
    lineHeight: 22,
  } satisfies TextStyle,
  label: {
    fontFamily: fontFamily.medium,
    fontWeight: fontWeight.semibold,
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: letterSpacing.caption,
  } satisfies TextStyle,
  caption: {
    fontFamily: fontFamily.regular,
    fontWeight: fontWeight.regular,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: letterSpacing.caption,
  } satisfies TextStyle,
  button: {
    fontFamily: fontFamily.semibold,
    fontWeight: fontWeight.bold,
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: letterSpacing.button,
  } satisfies TextStyle,
  heading: {
    fontFamily: fontFamily.bold,
    fontWeight: fontWeight.bold,
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: letterSpacing.tight,
  } satisfies TextStyle,
  title: {
    fontFamily: fontFamily.extrabold,
    fontWeight: fontWeight.extrabold,
    fontSize: 26,
    lineHeight: 32,
    letterSpacing: letterSpacing.tight,
  } satisfies TextStyle,
  screenTitle: {
    fontFamily: fontFamily.extrabold,
    fontWeight: fontWeight.extrabold,
    fontSize: 32,
    lineHeight: 38,
    letterSpacing: letterSpacing.screenTitle,
  } satisfies TextStyle,
  input: {
    fontFamily: fontFamily.regular,
    fontWeight: fontWeight.regular,
    fontSize: 15,
    lineHeight: 20,
  } satisfies TextStyle,
  tabLabel: {
    fontFamily: fontFamily.semibold,
    fontWeight: fontWeight.semibold,
    fontSize: 10,
    letterSpacing: letterSpacing.wide,
  } satisfies TextStyle,
} as const;
