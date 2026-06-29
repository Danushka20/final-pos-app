import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useAuth } from '@/context/AuthContext';
import { dashboardService } from '@/services/api/dashboardService';
import { buildAppAlerts } from '@/utils/appAlerts';
import { useAutoRefresh } from '@/hooks/useAutoRefresh';
import { phoneNotificationService } from '@/services/notifications/phoneNotificationService';
import type { AppAlert } from '@/types/notifications';

interface AppAlertContextValue {
  alerts: AppAlert[];
  unreadCount: number;
  loading: boolean;
  refresh: () => Promise<AppAlert[]>;
  markAllRead: () => void;
  syncPhoneNotifications: () => Promise<void>;
}

const AppAlertContext = createContext<AppAlertContextValue | undefined>(undefined);

export const AppAlertProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { isAuthenticated } = useAuth();
  const [alerts, setAlerts] = useState<AppAlert[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSeenAlerts, setHasSeenAlerts] = useState(false);
  const prevAlertCountRef = useRef(0);

  const refresh = useCallback(async (): Promise<AppAlert[]> => {
    if (!isAuthenticated) {
      setAlerts([]);
      return [];
    }
    setLoading(true);
    try {
      const [overview, today] = await Promise.all([
        dashboardService.getOverview(),
        dashboardService.getTodayTables(),
      ]);
      const nextAlerts = buildAppAlerts(overview, today);
      setAlerts(nextAlerts);
      return nextAlerts;
    } catch {
      /* keep previous alerts on silent refresh failure */
      return [];
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const syncPhoneNotifications = useCallback(async () => {
    if (!isAuthenticated) {
      return;
    }
    const latest = await refresh();
    await phoneNotificationService.syncAlerts(latest);
  }, [isAuthenticated, refresh]);

  useEffect(() => {
    if (!isAuthenticated || alerts.length === 0) {
      return;
    }
    phoneNotificationService.syncAlerts(alerts).catch(() => {});
  }, [alerts, isAuthenticated]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useAutoRefresh({
    onRefresh: () => {
      void refresh();
    },
    scopes: ['dashboard', 'todayActivity', 'inventory', 'purchases', 'sales', 'reports', 'expenses'],
  });

  useEffect(() => {
    if (alerts.length > prevAlertCountRef.current) {
      setHasSeenAlerts(false);
    }
    prevAlertCountRef.current = alerts.length;
  }, [alerts.length]);

  const markAllRead = useCallback(() => {
    setHasSeenAlerts(true);
  }, []);

  const unreadCount = hasSeenAlerts ? 0 : alerts.length;

  const value = useMemo(
    () => ({
      alerts,
      unreadCount,
      loading,
      refresh,
      markAllRead,
      syncPhoneNotifications,
    }),
    [alerts, unreadCount, loading, refresh, markAllRead, syncPhoneNotifications],
  );

  return (
    <AppAlertContext.Provider value={value}>{children}</AppAlertContext.Provider>
  );
};

export const useAppAlerts = (): AppAlertContextValue => {
  const ctx = useContext(AppAlertContext);
  if (!ctx) {
    throw new Error('useAppAlerts must be used within AppAlertProvider');
  }
  return ctx;
};
