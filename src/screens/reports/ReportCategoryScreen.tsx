import React from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { FileText } from 'lucide-react-native';
import { Text, VStack } from '@gluestack-ui/themed';
import { SmoothScrollView } from '@/components/common/SmoothScrollView';
import { ScreenContainer } from '@/components/common/ScreenContainer';
import { AppHeader } from '@/components/common/AppHeader';
import { SettingsRow } from '@/components/settings/SettingsRow';
import { getReportCategory, getReportMeta } from '@/types/reports';
import type { ReportsStackParamList } from '@/navigation/types';
import { colors, TAB_BAR_SCROLL_PADDING } from '@/theme';

type Nav = NativeStackNavigationProp<ReportsStackParamList, 'ReportCategory'>;
type Route = RouteProp<ReportsStackParamList, 'ReportCategory'>;

export const ReportCategoryScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Route>();
  const category = getReportCategory(params.categoryId);

  if (!category) {
    return (
      <ScreenContainer>
        <AppHeader title="Reports" showBack />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <AppHeader
        title={category.title}
        subtitle={category.subtitle}
        showBack
      />

      <SmoothScrollView
        style={{ flex: 1, backgroundColor: colors.backgroundAlt }}
        contentPaddingBottom={TAB_BAR_SCROLL_PADDING}>
        <VStack px="$5" py="$4" space="md">
          <Text fontSize="$sm" color={colors.textSecondary} px="$1">
            {category.description}
          </Text>

          <VStack
            bg="$white"
            borderRadius="$2xl"
            borderWidth={1}
            borderColor="$borderLight300"
            overflow="hidden">
            {category.reportIds.map(reportId => {
              const meta = getReportMeta(reportId);
              if (!meta) {
                return null;
              }
              return (
                <SettingsRow
                  key={reportId}
                  icon={FileText}
                  iconColor={colors.primary}
                  iconBg={colors.primarySoft}
                  title={meta.title}
                  subtitle={meta.subtitle}
                  onPress={() => navigation.navigate('ReportView', { type: reportId })}
                />
              );
            })}
          </VStack>
        </VStack>
      </SmoothScrollView>
    </ScreenContainer>
  );
};
