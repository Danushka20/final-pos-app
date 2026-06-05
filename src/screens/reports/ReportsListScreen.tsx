import React from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  AlertTriangle,
  BarChart3,
  FileText,
  ShoppingBag,
  Truck,
} from 'lucide-react-native';
import { Text, VStack } from '@gluestack-ui/themed';
import { SmoothScrollView } from '@/components/common/SmoothScrollView';
import { ScreenContainer } from '@/components/common/ScreenContainer';
import { AppHeader } from '@/components/common/AppHeader';
import { SettingsRow } from '@/components/settings/SettingsRow';
import { SYSTEM_REPORT_CATALOG } from '@/types/reports';
import type { HomeStackParamList } from '@/navigation/types';
import type { SystemReportType } from '@/types/reports';
import { colors, TAB_BAR_SCROLL_PADDING } from '@/theme';

type Nav = NativeStackNavigationProp<HomeStackParamList, 'ReportsList'>;

const REPORT_ICONS: Record<
  SystemReportType,
  { icon: typeof FileText; color: string; bg: string }
> = {
  daily_summary: {
    icon: BarChart3,
    color: colors.primary,
    bg: colors.primarySoft,
  },
  today_sales: {
    icon: ShoppingBag,
    color: colors.text,
    bg: colors.pastelYellow,
  },
  today_purchases: {
    icon: Truck,
    color: colors.text,
    bg: colors.pastelGreen,
  },
  reorder: {
    icon: AlertTriangle,
    color: colors.warning,
    bg: colors.warningSoft,
  },
};

export const ReportsListScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();

  return (
    <ScreenContainer>
      <AppHeader
        title="Reports"
        subtitle="View and print system reports"
        showBack
      />

      <SmoothScrollView
        style={{ flex: 1, backgroundColor: colors.backgroundAlt }}
        contentPaddingBottom={TAB_BAR_SCROLL_PADDING}>
        <VStack px="$5" py="$4" space="md">
          <Text fontSize="$sm" color={colors.textSecondary} px="$1">
            Open a report to preview on screen and print to your receipt printer,
            using the same layout as bills.
          </Text>

          <VStack
            bg="$white"
            borderRadius="$2xl"
            borderWidth={1}
            borderColor="$borderLight300"
            overflow="hidden">
            {SYSTEM_REPORT_CATALOG.map(item => {
              const visual = REPORT_ICONS[item.id];
              return (
                <SettingsRow
                  key={item.id}
                  icon={visual.icon}
                  iconColor={visual.color}
                  iconBg={visual.bg}
                  title={item.title}
                  subtitle={item.description}
                  onPress={() => navigation.navigate('ReportView', { type: item.id })}
                />
              );
            })}
          </VStack>
        </VStack>
      </SmoothScrollView>
    </ScreenContainer>
  );
};
