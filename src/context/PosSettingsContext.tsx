import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useAuth } from '@/context/AuthContext';
import { useAutoRefresh } from '@/hooks/useAutoRefresh';
import { settingsService } from '@/services/api/settingsService';
import type { PosMobileSettings } from '@/types/settings';
import { resolveCurrencyCode } from '@/utils/format';

interface PosSettingsContextValue {
  settings: PosMobileSettings | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  currency: string;
}

const PosSettingsContext = createContext<PosSettingsContextValue | undefined>(
  undefined,
);

export const PosSettingsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { isAuthenticated } = useAuth();
  const [settings, setSettings] = useState<PosMobileSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async (silent = false) => {
    if (!isAuthenticated) {
      setSettings(null);
      return;
    }
    if (!silent) {
      setLoading(true);
    }
    if (!silent) {
      setError(null);
    }
    try {
      const data = await settingsService.loadAll();
      setSettings(data);
    } catch (e) {
      if (!silent) {
        setError(e instanceof Error ? e.message : 'Failed to load settings');
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, [isAuthenticated]);

  useEffect(() => {
    refresh(false);
  }, [refresh]);

  useAutoRefresh({
    onRefresh: silent => refresh(silent),
    scopes: [
      'dashboard',
      'todayActivity',
      'inventory',
      'customers',
      'purchases',
      'expenses',
      'sales',
      'reports',
    ],
  });

  const currency = resolveCurrencyCode(settings?.company?.currency);

  const value = useMemo(
    () => ({ settings, loading, error, refresh, currency }),
    [settings, loading, error, refresh, currency],
  );

  return (
    <PosSettingsContext.Provider value={value}>
      {children}
    </PosSettingsContext.Provider>
  );
};

export const usePosSettings = (): PosSettingsContextValue => {
  const ctx = useContext(PosSettingsContext);
  if (!ctx) {
    throw new Error('usePosSettings must be used within PosSettingsProvider');
  }
  return ctx;
};
