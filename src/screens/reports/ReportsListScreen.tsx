import React from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  AlertTriangle,
  BarChart3,
  CalendarClock,
  CreditCard,
  FileText,
  Landmark,
  Package,
  Receipt,
  RotateCcw,
  ShoppingBag,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react-native';
import type { LucideProps } from 'lucide-react-native';
import type { ComponentType } from 'react';
import { Text, VStack } from '@gluestack-ui/themed';
import { SmoothScrollView } from '@/components/common/SmoothScrollView';
import { ScreenContainer } from '@/components/common/ScreenContainer';
import { AppHeader } from '@/components/common/AppHeader';
import { SectionHeader } from '@/components/common/SectionHeader';
import { SettingsRow } from '@/components/settings/SettingsRow';
import { getReportMeta } from '@/types/reports';
import type { SystemReportType } from '@/types/reports';
import type { ReportsStackParamList } from '@/navigation/types';
import { colors, TAB_BAR_SCROLL_PADDING } from '@/theme';

type Nav = NativeStackNavigationProp<ReportsStackParamList, 'ReportsList'>;

type ReportSection = {
  title: string;
  subtitle?: string;
  items: Array<
    | { kind: 'report'; id: SystemReportType }
    | { kind: 'category'; id: 'finance'; title: string; subtitle: string }
  >;
};

const REPORT_SECTIONS: ReportSection[] = [
  {
    title: 'Overview',
    subtitle: 'Daily business snapshot',
    items: [{ kind: 'report', id: 'daily_summary' }],
  },
  {
    title: 'Sales & customers',
    subtitle: 'Sales, returns, and customer activity',
    items: [
      { kind: 'report', id: 'sales_report' },
      { kind: 'report', id: 'expense_report' },
      { kind: 'report', id: 'customer_report' },
      { kind: 'report', id: 'customer_settlement' },
      { kind: 'report', id: 'return_report' },
      { kind: 'report', id: 'credit_sales' },
    ],
  },
  {
    title: 'Inventory',
    subtitle: 'Stock, items, and expiry',
    items: [
      { kind: 'report', id: 'item_report' },
      { kind: 'report', id: 'reorder' },
      { kind: 'report', id: 'expiry_report' },
    ],
  },
  {
    title: 'Finance',
    subtitle: 'Cash, payments, aging & statements',
    items: [
      { kind: 'report', id: 'cash_in_hand' },
      { kind: 'report', id: 'payment_report' },
      { kind: 'report', id: 'customer_aging' },
      {
        kind: 'category',
        id: 'finance',
        title: 'Finance report',
        subtitle: 'Profit & loss, transactions summary',
      },
    ],
  },
];

const REPORT_ICONS: Partial<
  Record<SystemReportType | 'finance', { icon: ComponentType<LucideProps>; color: string; bg: string }>
> = {
  daily_summary: { icon: BarChart3, color: colors.primary, bg: colors.primarySoft },
  sales_report: { icon: ShoppingBag, color: colors.text, bg: colors.pastelYellow },
  expense_report: { icon: Receipt, color: colors.text, bg: colors.pastelPink },
  customer_report: { icon: Users, color: colors.text, bg: colors.pastelBlue },
  customer_settlement: { icon: Wallet, color: colors.text, bg: colors.pastelGreen },
  return_report: { icon: RotateCcw, color: colors.warning, bg: colors.warningSoft },
  credit_sales: { icon: CreditCard, color: colors.text, bg: colors.pastelYellowSoft },
  item_report: { icon: Package, color: colors.text, bg: colors.pastelGreen },
  reorder: { icon: AlertTriangle, color: colors.warning, bg: colors.warningSoft },
  expiry_report: { icon: CalendarClock, color: colors.error, bg: colors.errorSoft },
  cash_in_hand: { icon: Wallet, color: colors.text, bg: colors.pastelGreenSoft },
  payment_report: { icon: CreditCard, color: colors.text, bg: colors.pastelBlue },
  customer_aging: { icon: TrendingUp, color: colors.text, bg: colors.pastelPink },
  finance: { icon: Landmark, color: colors.primary, bg: colors.primarySoft },
};

const defaultVisual = {
  icon: FileText,
  color: colors.text,
  bg: colors.backgroundAlt,
};

export const ReportsListScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();

  return (
    <ScreenContainer>
      <AppHeader
        title="Reports"
        subtitle="View and print business reports"
      />

      <SmoothScrollView
        style={{ flex: 1, backgroundColor: colors.backgroundAlt }}
        contentPaddingBottom={TAB_BAR_SCROLL_PADDING}>
        <VStack px="$5" py="$4" space="xl">
          <Text fontSize="$sm" color={colors.textSecondary} px="$1">
            Open a report to preview on screen and print to your receipt printer,
            using the same layout as bills.
          </Text>

          {REPORT_SECTIONS.map(section => (
            <VStack key={section.title} space="sm">
              <SectionHeader title={section.title} subtitle={section.subtitle} />
              <VStack
                bg="$white"
                borderRadius="$2xl"
                borderWidth={1}
                borderColor="$borderLight300"
                overflow="hidden">
                {section.items.map(item => {
                  if (item.kind === 'category') {
                    const visual = REPORT_ICONS[item.id] ?? defaultVisual;
                    return (
                      <SettingsRow
                        key={item.id}
                        icon={visual.icon}
                        iconColor={visual.color}
                        iconBg={visual.bg}
                        title={item.title}
                        subtitle={item.subtitle}
                        onPress={() =>
                          navigation.navigate('ReportCategory', { categoryId: item.id })
                        }
                      />
                    );
                  }

                  const meta = getReportMeta(item.id);
                  if (!meta) {
                    return null;
                  }
                  const visual = REPORT_ICONS[item.id] ?? defaultVisual;
                  return (
                    <SettingsRow
                      key={item.id}
                      icon={visual.icon}
                      iconColor={visual.color}
                      iconBg={visual.bg}
                      title={meta.title}
                      subtitle={meta.subtitle}
                      onPress={() => navigation.navigate('ReportView', { type: item.id })}
                    />
                  );
                })}
              </VStack>
            </VStack>
          ))}
        </VStack>
      </SmoothScrollView>
    </ScreenContainer>
  );
};
