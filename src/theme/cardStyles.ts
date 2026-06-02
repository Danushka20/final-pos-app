import { StyleSheet } from 'react-native';
import { colors } from './colors';
import { radius } from './radius';
import { shadows } from './shadows';

/** Shared BizLink card chrome — white cards on off-white canvas */
export const cardStyles = StyleSheet.create({
  surface: {
    backgroundColor: colors.white,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  surfaceFlat: {
    backgroundColor: colors.white,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pastelYellow: {
    backgroundColor: colors.pastelYellowSoft,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.pastelYellow,
  },
  pastelPink: {
    backgroundColor: colors.pastelPinkSoft,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.pastelPink,
  },
  pastelGreen: {
    backgroundColor: colors.pastelGreenSoft,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.pastelGreen,
  },
  dark: {
    backgroundColor: colors.cardDark,
    borderRadius: radius.card,
    borderWidth: 0,
    ...shadows.md,
  },
});
