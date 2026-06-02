import AsyncStorage from '@react-native-async-storage/async-storage';
import notifee, { AndroidImportance, AuthorizationStatus } from '@notifee/react-native';
import type { AppAlert } from '@/types/notifications';

const ENABLED_KEY = '@pos/phone_notifications_enabled';
const NOTIFIED_IDS_KEY = '@pos/notified_alert_ids';
const PENDING_ROUTE_KEY = '@pos/pending_notification_route';
export const PHONE_NOTIFICATION_CHANNEL_ID = 'pos-store-alerts';

export type PendingNotificationRoute = 'alerts' | 'today_reorder' | 'today_sales' | 'sales';

export const phoneNotificationService = {
  async isEnabled(): Promise<boolean> {
    const value = await AsyncStorage.getItem(ENABLED_KEY);
    return value !== 'false';
  },

  async setEnabled(enabled: boolean): Promise<void> {
    await AsyncStorage.setItem(ENABLED_KEY, enabled ? 'true' : 'false');
  },

  async hasPermission(): Promise<boolean> {
    const settings = await notifee.getNotificationSettings();
    return (
      settings.authorizationStatus === AuthorizationStatus.AUTHORIZED ||
      settings.authorizationStatus === AuthorizationStatus.PROVISIONAL
    );
  },

  async requestPermission(): Promise<boolean> {
    const settings = await notifee.requestPermission();
    const granted =
      settings.authorizationStatus === AuthorizationStatus.AUTHORIZED ||
      settings.authorizationStatus === AuthorizationStatus.PROVISIONAL;

    if (granted) {
      await phoneNotificationService.ensureChannel();
    }
    return granted;
  },

  async ensureChannel(): Promise<void> {
    await notifee.createChannel({
      id: PHONE_NOTIFICATION_CHANNEL_ID,
      name: 'Store alerts',
      description: 'Low stock, reorder, and POS alerts',
      importance: AndroidImportance.HIGH,
      vibration: true,
    });
  },

  async enablePhoneNotifications(): Promise<boolean> {
    const granted = await phoneNotificationService.requestPermission();
    if (granted) {
      await phoneNotificationService.setEnabled(true);
    }
    return granted;
  },

  async getNotifiedIds(): Promise<string[]> {
    try {
      const raw = await AsyncStorage.getItem(NOTIFIED_IDS_KEY);
      if (!raw) {
        return [];
      }
      const parsed = JSON.parse(raw) as string[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  },

  async saveNotifiedIds(ids: string[]): Promise<void> {
    await AsyncStorage.setItem(NOTIFIED_IDS_KEY, JSON.stringify(ids));
  },

  async setPendingRoute(route: PendingNotificationRoute): Promise<void> {
    await AsyncStorage.setItem(PENDING_ROUTE_KEY, route);
  },

  async consumePendingRoute(): Promise<PendingNotificationRoute | null> {
    const route = await AsyncStorage.getItem(PENDING_ROUTE_KEY);
    if (route) {
      await AsyncStorage.removeItem(PENDING_ROUTE_KEY);
      return route as PendingNotificationRoute;
    }
    return null;
  },

  routeForAlert(alert: AppAlert): PendingNotificationRoute {
    switch (alert.action?.type) {
      case 'today_reorder':
        return 'today_reorder';
      case 'today_sales':
        return 'today_sales';
      case 'sales':
        return 'sales';
      default:
        return 'alerts';
    }
  },

  async displayAlertNotification(alert: AppAlert): Promise<void> {
    await phoneNotificationService.ensureChannel();
    await notifee.displayNotification({
      id: alert.id,
      title: alert.title,
      body: alert.message,
      data: {
        alertId: alert.id,
        route: phoneNotificationService.routeForAlert(alert),
      },
      android: {
        channelId: PHONE_NOTIFICATION_CHANNEL_ID,
        smallIcon: 'ic_launcher',
        pressAction: { id: 'default' },
        importance: AndroidImportance.HIGH,
      },
    });
  },

  async syncAlerts(alerts: AppAlert[]): Promise<void> {
    const enabled = await phoneNotificationService.isEnabled();
    if (!enabled) {
      return;
    }

    const permitted = await phoneNotificationService.hasPermission();
    if (!permitted) {
      return;
    }

    const notified = new Set(await phoneNotificationService.getNotifiedIds());
    const currentIds = new Set(alerts.map(alert => alert.id));

    for (const alert of alerts) {
      if (!notified.has(alert.id)) {
        await phoneNotificationService.displayAlertNotification(alert);
        notified.add(alert.id);
      }
    }

    for (const id of [...notified]) {
      if (!currentIds.has(id)) {
        notified.delete(id);
        await notifee.cancelNotification(id);
      }
    }

    await phoneNotificationService.saveNotifiedIds([...notified]);
  },

  async showTestNotification(): Promise<void> {
    const granted = await phoneNotificationService.requestPermission();
    if (!granted) {
      throw new Error('Notification permission was denied.');
    }
    await phoneNotificationService.displayAlertNotification({
      id: 'test-notification',
      title: 'POS alerts enabled',
      message: 'You will see phone notifications for low stock and store alerts.',
      severity: 'info',
      createdAt: new Date().toISOString(),
    });
  },
};
