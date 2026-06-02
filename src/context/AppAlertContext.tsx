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
  refresh: () => Promise<void>;
  markAllRead: () => void;
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

  const refresh = useCallback(async () => {
    if (!isAuthenticated) {
      setAlerts([]);
      return;
    }
    setLoading(true);
    try {
      const [overview, today] = await Promise.all([
        dashboardService.getOverview(),
        dashboardService.getTodayTables(),
      ]);
      setAlerts(buildAppAlerts(overview, today));
    } catch {
      /* keep previous alerts on silent refresh failure */
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

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
    onRefresh: () => refresh(),
    scopes: ['dashboard', 'todayActivity', 'inventory', 'purchases', 'sales'],
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
    }),
    [alerts, unreadCount, loading, refresh, markAllRead],
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
