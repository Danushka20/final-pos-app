import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, RefreshControl, StyleSheet, Switch, View } from 'react-native';
import { Text } from 'react-native-paper';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  AlertCircle,
  AlertTriangle,
  Bell,
  BellRing,
  ChevronRight,
  Info,
  Smartphone,
} from 'lucide-react-native';
import { PrimaryButton } from '@/components/buttons/PrimaryButton';
import { ScreenContainer } from '@/components/common/ScreenContainer';
import { AppHeader } from '@/components/common/AppHeader';
import { SmoothScrollView } from '@/components/common/SmoothScrollView';
import { LoadingOverlay } from '@/components/common/LoadingOverlay';
import { useAppAlerts } from '@/context/AppAlertContext';
import { useErrorDialog } from '@/context/ErrorDialogContext';
import { useToast } from '@/context/ToastContext';
import { phoneNotificationService } from '@/services/notifications/phoneNotificationService';
import { colors, radius, shadows, TAB_BAR_SCROLL_PADDING, typography } from '@/theme';
import type { AppAlert, AppAlertSeverity } from '@/types/notifications';
import type { HomeStackParamList, MainTabParamList } from '@/navigation/types';

type Nav = CompositeNavigationProp<
  NativeStackNavigationProp<HomeStackParamList, 'AlertsList'>,
  BottomTabNavigationProp<MainTabParamList>
>;

const ICONS: Record<AppAlertSeverity, typeof Info> = {
  info: Info,
  warning: AlertTriangle,
  error: AlertCircle,
};

const COLORS: Record<AppAlertSeverity, string> = {
  info: colors.text,
  warning: colors.warning,
  error: colors.error,
};

export const AlertsScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const { alerts, loading, refresh, markAllRead } = useAppAlerts();
  const { showError } = useErrorDialog();
  const { showSuccess } = useToast();
  const [phoneEnabled, setPhoneEnabled] = useState(true);
  const [hasPermission, setHasPermission] = useState(false);
  const [phoneBusy, setPhoneBusy] = useState(false);

  const loadPhoneSettings = useCallback(async () => {
    const [enabled, permitted] = await Promise.all([
      phoneNotificationService.isEnabled(),
      phoneNotificationService.hasPermission(),
    ]);
    setPhoneEnabled(enabled);
    setHasPermission(permitted);
  }, []);

  useFocusEffect(
    useCallback(() => {
      markAllRead();
      loadPhoneSettings();
    }, [markAllRead, loadPhoneSettings]),
  );

  useEffect(() => {
    loadPhoneSettings();
  }, [loadPhoneSettings]);

  const enablePhoneNotifications = async () => {
    setPhoneBusy(true);
    try {
      const granted = await phoneNotificationService.enablePhoneNotifications();
      setPhoneEnabled(granted);
      setHasPermission(granted);
      if (granted) {
        await phoneNotificationService.showTestNotification();
        await phoneNotificationService.syncAlerts(alerts);
        showSuccess('Phone notifications are on. Check your notification tray.');
      } else {
        showError({
          title: 'Permission needed',
          message: 'Allow notifications in phone settings to get stock alerts.',
          variant: 'warning',
        });
      }
    } catch (e) {
      showError({
        title: 'Notifications',
        message: e instanceof Error ? e.message : 'Could not enable notifications',
      });
    } finally {
      setPhoneBusy(false);
    }
  };

  const togglePhoneNotifications = async (value: boolean) => {
    if (value) {
      await enablePhoneNotifications();
      return;
    }
    await phoneNotificationService.setEnabled(false);
    setPhoneEnabled(false);
  };

  const sendTestNotification = async () => {
    setPhoneBusy(true);
    try {
      await phoneNotificationService.showTestNotification();
      showSuccess('Test notification sent.');
    } catch (e) {
      showError({
        title: 'Test failed',
        message: e instanceof Error ? e.message : 'Could not send test notification',
        variant: 'warning',
      });
    } finally {
      setPhoneBusy(false);
    }
  };

  const openAlert = (alert: AppAlert) => {
    switch (alert.action?.type) {
      case 'today_reorder':
        navigation.navigate('TodayActivity', { tab: 'reorder' });
        break;
      case 'today_sales':
        navigation.navigate('TodayActivity', { tab: 'sales' });
        break;
      case 'products':
        navigation.navigate('Products', { screen: 'ProductsList' });
        break;
      case 'sales':
        navigation.navigate('Sales');
        break;
      default:
        break;
    }
  };

  const phoneReady = phoneEnabled && hasPermission;

  return (
    <ScreenContainer>
      <AppHeader title="Alerts" subtitle="Store notifications" showBack />

      {loading && alerts.length === 0 ? (
        <LoadingOverlay message="Loading alerts…" />
      ) : null}

      <SmoothScrollView
        contentContainerStyle={styles.scroll}
        contentPaddingBottom={TAB_BAR_SCROLL_PADDING}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={() => refresh()} />
        }>
        <View style={styles.phoneCard}>
          <View style={styles.phoneHeader}>
            <View style={styles.phoneIconWrap}>
              {phoneReady ? (
                <BellRing size={20} color={colors.success} strokeWidth={2.25} />
              ) : (
                <Smartphone size={20} color={colors.text} strokeWidth={2.25} />
              )}
            </View>
            <View style={styles.textCol}>
              <Text style={styles.phoneTitle}>Phone notifications</Text>
              <Text style={styles.phoneSubtitle}>
                {phoneReady
                  ? 'Alerts appear in your phone notification tray.'
                  : 'Turn on to get low stock and reorder alerts on your phone.'}
              </Text>
            </View>
            <Switch
              value={phoneEnabled && hasPermission}
              onValueChange={togglePhoneNotifications}
              disabled={phoneBusy}
            />
          </View>

          {!phoneReady ? (
            <View style={styles.phoneBtn}>
              <PrimaryButton
                label={phoneBusy ? 'Please wait…' : 'Enable phone notifications'}
                onPress={enablePhoneNotifications}
                loading={phoneBusy}
              />
            </View>
          ) : (
            <View style={styles.phoneBtn}>
              <PrimaryButton
                label="Send test notification"
                variant="outline"
                onPress={sendTestNotification}
                loading={phoneBusy}
              />
            </View>
          )}
        </View>

        {alerts.length === 0 ? (
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Bell size={28} color={colors.textMuted} strokeWidth={2} />
            </View>
            <Text style={styles.emptyTitle}>All clear</Text>
            <Text style={styles.emptyText}>
              No stock or order alerts right now. Pull to refresh.
            </Text>
          </View>
        ) : (
          alerts.map(alert => {
            const Icon = ICONS[alert.severity];
            const tone = COLORS[alert.severity];
            return (
              <Pressable
                key={alert.id}
                onPress={() => openAlert(alert)}
                style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}>
                <View style={[styles.iconWrap, { backgroundColor: `${tone}14` }]}>
                  <Icon size={20} color={tone} strokeWidth={2.25} />
                </View>
                <View style={styles.textCol}>
                  <Text style={styles.cardTitle}>{alert.title}</Text>
                  <Text style={styles.cardMessage}>{alert.message}</Text>
                </View>
                {alert.action ? (
                  <ChevronRight size={18} color={colors.textMuted} strokeWidth={2.25} />
                ) : null}
              </Pressable>
            );
          })
        )}
      </SmoothScrollView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  scroll: {
    padding: 16,
    gap: 10,
  },
  phoneCard: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    marginBottom: 6,
    ...shadows.sm,
  },
  phoneHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  phoneIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.backgroundAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  phoneTitle: {
    ...typography.label,
    color: colors.text,
    fontWeight: '800',
    marginBottom: 4,
  },
  phoneSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  phoneBtn: {
    marginTop: 12,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.backgroundAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: 8,
  },
  emptyText: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    ...shadows.sm,
  },
  cardPressed: {
    backgroundColor: colors.primarySoft,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textCol: {
    flex: 1,
    minWidth: 0,
  },
  cardTitle: {
    ...typography.label,
    color: colors.text,
    fontWeight: '800',
    marginBottom: 4,
  },
  cardMessage: {
    ...typography.caption,
    color: colors.textSecondary,
    lineHeight: 18,
  },
});
