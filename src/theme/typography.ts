import { TextStyle } from 'react-native';
import { fontFamily, fontStyle, fontWeight, letterSpacing } from './fonts';

export const typography = {
  hero: {
    ...fontStyle.screenTitle,
    fontSize: 34,
    lineHeight: 40,
  } satisfies TextStyle,
  screenTitle: fontStyle.screenTitle satisfies TextStyle,
  h1: {
    ...fontStyle.title,
    fontSize: 28,
    lineHeight: 34,
  } satisfies TextStyle,
  h2: {
    ...fontStyle.heading,
    fontSize: 24,
    lineHeight: 30,
  } satisfies TextStyle,
  h3: {
    fontFamily: fontFamily.semibold,
    fontWeight: fontWeight.semibold,
    fontSize: 18,
    lineHeight: 24,
    letterSpacing: letterSpacing.tight,
  } satisfies TextStyle,
  body: fontStyle.body satisfies TextStyle,
  bodyMedium: fontStyle.bodyMedium satisfies TextStyle,
  caption: fontStyle.caption satisfies TextStyle,
  label: fontStyle.label satisfies TextStyle,
  button: fontStyle.button satisfies TextStyle,
  input: fontStyle.input satisfies TextStyle,
  tabLabel: fontStyle.tabLabel satisfies TextStyle,
} as const;
