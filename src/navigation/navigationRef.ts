import { createNavigationContainerRef } from '@react-navigation/native';
import type { AppStackParamList } from '@/navigation/types';

export const navigationRef = createNavigationContainerRef<AppStackParamList>();

export function navigateToPrinterSetup(): void {
  if (!navigationRef.isReady()) {
    return;
  }
  navigationRef.navigate('MainTabs', {
    screen: 'Profile',
    params: { screen: 'PrinterSetup' },
  });
}

export function navigateToReports(): void {
  if (!navigationRef.isReady()) {
    return;
  }
  navigationRef.navigate('MainTabs', {
    screen: 'Reports',
    params: { screen: 'ReportsList' },
  });
}

export function navigateToAlerts(): void {
  if (!navigationRef.isReady()) {
    return;
  }
  navigationRef.navigate('MainTabs', {
    screen: 'Home',
    params: { screen: 'AlertsList' },
  });
}

export function navigateFromNotificationRoute(
  route: 'alerts' | 'today_reorder' | 'today_sales' | 'sales',
): void {
  if (!navigationRef.isReady()) {
    return;
  }

  switch (route) {
    case 'today_reorder':
      navigationRef.navigate('MainTabs', {
        screen: 'Home',
        params: { screen: 'TodayActivity', params: { tab: 'reorder' } },
      });
      break;
    case 'today_sales':
      navigationRef.navigate('MainTabs', {
        screen: 'Home',
        params: { screen: 'TodayActivity', params: { tab: 'sales' } },
      });
      break;
    case 'sales':
      navigationRef.navigate('MainTabs', { screen: 'Sales' });
      break;
    case 'alerts':
    default:
      navigateToAlerts();
      break;
  }
}
