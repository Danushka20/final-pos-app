import React, { useCallback, useState } from 'react';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { SettingsStackParamList } from '@/navigation/types';
import {
  Building2,
  Bell,
  FileText,
  HardDrive,
  LogOut,
  Package,
  ShoppingBag,
  User,
  Users,
  Wifi,
  AlertTriangle,
  BarChart3,
} from 'lucide-react-native';
import { Box, Text, VStack } from '@gluestack-ui/themed';
import { SmoothScrollView } from '@/components/common/SmoothScrollView';
import { ScreenContainer } from '@/components/common/ScreenContainer';
import { AppHeader } from '@/components/common/AppHeader';
import { SettingsRow } from '@/components/settings/SettingsRow';
import { useAuth } from '@/context/AuthContext';
import { useErrorDialog } from '@/context/ErrorDialogContext';
import { usePosSettings } from '@/context/PosSettingsContext';
import { getApiBaseUrl } from '@/config/env';
import { navigateToReports } from '@/navigation/navigationRef';
import { bluetoothPrintService } from '@/services/bluetooth/bluetoothPrintService';
import { colors, TAB_BAR_SCROLL_PADDING } from '@/theme';

const ProfileAvatar: React.FC<{ name?: string }> = ({ name }) => {
  const initial = (name?.trim()?.[0] ?? 'U').toUpperCase();
  return (
    <Box
      w={64}
      h={64}
      borderRadius="$full"
      bg={colors.text}
      alignItems="center"
      justifyContent="center">
      <Text fontSize="$2xl" fontWeight="$bold" color="$white">
        {initial}
      </Text>
    </Box>
  );
};

type Nav = NativeStackNavigationProp<SettingsStackParamList, 'SettingsHome'>;

export const SettingsScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const { user, logout } = useAuth();
  const { settings, loading: settingsLoading } = usePosSettings();
  const { showError, showConfirm } = useErrorDialog();
  const [printerSubtitle, setPrinterSubtitle] = useState('Receipt printer');

  useFocusEffect(
    useCallback(() => {
      if (!bluetoothPrintService.isSupported()) {
        setPrinterSubtitle('Bluetooth printing unavailable');
        return;
      }
      bluetoothPrintService.getSavedPrinter().then(saved => {
        if (saved) {
          setPrinterSubtitle(saved.name);
          return;
        }
        bluetoothPrintService.isConfigured().then(configured => {
          setPrinterSubtitle(configured ? 'Printer saved' : 'Not configured — tap to set up');
        });
      });
    }, []),
  );

  const showSettingsInfo = (title: string, payload: Record<string, unknown>) => {
    const lines = Object.entries(payload)
      .filter(([, v]) => v !== null && v !== undefined && v !== '')
      .slice(0, 12)
      .map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : String(v)}`);
    showError({
      title,
      message: lines.length ? lines.join('\n') : 'No data',
      variant: 'info',
      confirmLabel: 'OK',
    });
  };

  const handleLogout = () => {
    showConfirm({
      title: 'Sign out?',
      message: 'You will need to sign in again.',
      confirmLabel: 'Sign out',
      cancelLabel: 'Cancel',
      onConfirm: () => logout(),
    });
  };

  return (
    <ScreenContainer enableTabSwipe edges={[]}>
      <AppHeader title="Settings" />

      <SmoothScrollView
        style={{ flex: 1, backgroundColor: colors.backgroundAlt }}
        contentPaddingBottom={TAB_BAR_SCROLL_PADDING}>
        <VStack px="$5" py="$4" space="md">
          <VStack
            bg="$white"
            borderRadius="$2xl"
            borderWidth={1}
            borderColor="$borderLight300"
            p="$4"
            alignItems="center"
            space="sm">
            <ProfileAvatar name={user?.name} />
            <Text fontSize="$lg" fontWeight="$bold" color="$textLight0">
              {user?.name ?? 'User'}
            </Text>
            <Text fontSize="$sm" color="$textLight400">
              {user?.email ?? '—'}
            </Text>
            {settings?.company?.name ? (
              <Text fontSize="$xs" color="$textLight400" mt="$1">
                {settings.company.name}
                {settings.company.currency ? ` · ${settings.company.currency}` : ''}
              </Text>
            ) : settingsLoading ? (
              <Text fontSize="$xs" color="$textLight400">
                Loading store settings…
              </Text>
            ) : null}
          </VStack>

          <Text fontSize="$xs" fontWeight="$semibold" color="$textLight400" px="$1" mt="$2">
            STORE SETTINGS (from server)
          </Text>
          <VStack
            bg="$white"
            borderRadius="$2xl"
            borderWidth={1}
            borderColor="$borderLight300"
            overflow="hidden">
            <SettingsRow
              icon={Building2}
              iconColor={colors.text}
              iconBg={colors.pastelYellow}
              title="Company"
              subtitle={settings?.company?.name ?? 'Tap to view'}
              onPress={() => navigation.navigate('CompanySettings')}
            />
            <SettingsRow
              icon={Package}
              iconColor={colors.text}
              iconBg={colors.pastelGreen}
              title="Inventory"
              subtitle={
                settings?.inventory &&
                (settings.inventory as { manage_multiple_locations?: boolean })
                  .manage_multiple_locations
                  ? 'Multi-location on'
                  : 'Inventory rules'
              }
              onPress={() => navigation.navigate('InventorySettings')}
            />
            <SettingsRow
              icon={ShoppingBag}
              iconColor={colors.text}
              iconBg={colors.pastelPink}
              title="Orders"
              subtitle="POS order preferences"
              onPress={() => navigation.navigate('OrderSettings')}
            />
            <SettingsRow
              icon={HardDrive}
              iconColor={colors.primaryDeep}
              iconBg={colors.primarySoft}
              title="Receipt printer"
              subtitle={printerSubtitle}
              onPress={() => navigation.navigate('PrinterSetup')}
            />
            <SettingsRow
              icon={FileText}
              iconColor={colors.primary}
              iconBg={colors.pastelYellow}
              title="Receipt layout"
              subtitle="Logo upload, center, font, footer"
              onPress={() => navigation.navigate('ReceiptCustomize')}
            />
            <SettingsRow
              icon={BarChart3}
              iconColor={colors.primaryDeep}
              iconBg={colors.pastelBlue}
              title="System reports"
              subtitle="Daily summary, sales, purchases, reorder"
              onPress={() => navigateToReports()}
            />
            <SettingsRow
              icon={Bell}
              iconColor={colors.accent}
              iconBg={colors.accentSoft}
              title="Notifications"
              subtitle="Customer SMS & email"
              onPress={() => navigation.navigate('NotificationsSettings')}
            />
            <SettingsRow
              icon={AlertTriangle}
              iconColor={colors.warning}
              iconBg={colors.warningSoft}
              title="Alerts"
              subtitle="Expiry & cheque reminders"
              onPress={() => navigation.navigate('AlertSettings')}
            />
            <SettingsRow
              icon={Users}
              iconColor={colors.primaryLight}
              iconBg={colors.primarySoft}
              title="Employees"
              subtitle="Staff & permissions"
              onPress={() =>
                showSettingsInfo('Employees', settings?.employee ?? {})
              }
            />
          </VStack>

          <Text fontSize="$xs" fontWeight="$semibold" color="$textLight400" px="$1" mt="$2">
            ACCOUNT
          </Text>
          <VStack
            bg="$white"
            borderRadius="$2xl"
            borderWidth={1}
            borderColor="$borderLight300"
            overflow="hidden">
            <SettingsRow
              icon={User}
              title="User profile"
              subtitle="Name, password"
              onPress={() => navigation.navigate('UserProfile')}
            />
            <SettingsRow
              icon={Wifi}
              iconColor={colors.textSecondary}
              iconBg={colors.primarySoft}
              title="Server / API"
              subtitle={getApiBaseUrl() || 'Not configured'}
              onPress={() =>
                navigation.navigate('BackendConfig', { fromSettings: true })
              }
            />
          </VStack>

          <VStack
            bg="$white"
            borderRadius="$2xl"
            borderWidth={1}
            borderColor="$borderLight300"
            overflow="hidden"
            mb="$6">
            <SettingsRow
              icon={LogOut}
              iconColor={colors.error}
              iconBg={colors.errorSoft}
              title="Sign out"
              showChevron={false}
              destructive
              onPress={handleLogout}
            />
          </VStack>
        </VStack>
      </SmoothScrollView>
    </ScreenContainer>
  );
};
