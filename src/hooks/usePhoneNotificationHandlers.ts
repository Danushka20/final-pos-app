import { useEffect } from 'react';
import notifee, { EventType } from '@notifee/react-native';
import {
  navigateFromNotificationRoute,
  navigationRef,
} from '@/navigation/navigationRef';
import {
  phoneNotificationService,
  type PendingNotificationRoute,
} from '@/services/notifications/phoneNotificationService';

function handleNotificationPress(data?: Record<string, string | number | object>): void {
  const route = (data?.route as PendingNotificationRoute | undefined) ?? 'alerts';
  if (navigationRef.isReady()) {
    navigateFromNotificationRoute(route);
  } else {
    phoneNotificationService.setPendingRoute(route);
  }
}

export function usePhoneNotificationHandlers(isActive: boolean): void {
  useEffect(() => {
    if (!isActive) {
      return;
    }

    phoneNotificationService.ensureChannel().catch(() => {});

    notifee.getInitialNotification().then(initial => {
      if (initial?.notification?.data) {
        handleNotificationPress(initial.notification.data as Record<string, string>);
      }
    });

    phoneNotificationService.consumePendingRoute().then(route => {
      if (route && navigationRef.isReady()) {
        navigateFromNotificationRoute(route);
      }
    });

    const unsubscribeForeground = notifee.onForegroundEvent(({ type, detail }) => {
      if (type === EventType.PRESS && detail.notification?.data) {
        handleNotificationPress(detail.notification.data as Record<string, string>);
      }
    });

    return unsubscribeForeground;
  }, [isActive]);
}

export async function handleBackgroundNotificationEvent(
  type: EventType,
  data?: Record<string, string | number | object>,
): Promise<void> {
  if (type === EventType.PRESS) {
    const route = (data?.route as PendingNotificationRoute | undefined) ?? 'alerts';
    await phoneNotificationService.setPendingRoute(route);
  }
}
