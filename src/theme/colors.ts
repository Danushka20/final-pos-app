/** BizLink-style POS theme — black, white, neutrals, soft pastels */
export const colors = {
  primary: '#000000',
  primaryDark: '#0A0A0A',
  primaryDeep: '#171717',
  primaryLight: '#404040',
  primarySoft: '#F5F5F5',
  primaryMuted: '#E5E5E5',
  primaryGradient: ['#171717', '#0A0A0A', '#000000', '#262626'] as const,
  oceanGradient: ['#404040', '#262626', '#0A0A0A'] as const,

  accent: '#404040',
  accentDark: '#262626',
  accentSoft: '#F5F5F5',

  background: '#FFFFFF',
  backgroundAlt: '#F4F4F5',
  surface: '#FFFFFF',
  surfaceElevated: '#F4F4F5',
  surfaceBlue: '#F5F5F5',

  /** BizLink pastel accents */
  pastelYellow: '#FEF9C3',
  pastelYellowSoft: '#FEFCE8',
  pastelPink: '#FFE4E6',
  pastelPinkSoft: '#FFF1F2',
  pastelGreen: '#DCFCE7',
  pastelGreenSoft: '#F0FDF4',
  pastelBlue: '#E0E7FF',
  pastelBlueSoft: '#EEF2FF',
  cardDark: '#0A0A0A',
  cardDarkSoft: '#171717',

  border: '#E5E5E5',
  borderLight: '#F5F5F5',
  borderStrong: '#D4D4D4',
  borderFocus: '#000000',

  text: '#0A0A0A',
  textSecondary: '#525252',
  textMuted: '#737373',
  textOnPrimary: '#FFFFFF',
  textOnDark: '#FAFAFA',
  textOnOcean: '#FAFAFA',

  success: '#166534',
  successSoft: '#DCFCE7',
  warning: '#A16207',
  warningSoft: '#FEF9C3',
  error: '#991B1B',
  errorSoft: '#FFE4E6',
  info: '#404040',
  infoSoft: '#F4F4F5',

  white: '#FFFFFF',
  black: '#000000',
  overlay: 'rgba(0, 0, 0, 0.45)',

  tabBar: '#0A0A0A',
  tabInactive: '#A3A3A3',
  tabActive: '#FFFFFF',
  tabBarBorder: 'transparent',

  chartSales: '#0A0A0A',
  chartStock: '#404040',
  chartCustomers: '#525252',
  chartOrders: '#737373',
  chartExpenses: '#262626',
  chartMonth: '#A3A3A3',

  statusDotYellow: '#EAB308',
  statusDotGreen: '#22C55E',
  statusDotRed: '#EF4444',
} as const;
