import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { NavigationContext } from '@react-navigation/native';
import type { DataRefreshScope } from '@/context/DataRefreshContext';
import { useDataRefreshRevision } from '@/context/DataRefreshContext';

const DEFAULT_INTERVAL_MS = 25_000;

interface UseAutoRefreshOptions {
  /** Silent background refresh (no full-screen loader) */
  onRefresh: (silent: boolean) => void | Promise<void>;
  /** Poll while screen is focused */
  intervalMs?: number;
  enabled?: boolean;
  /** Re-run when these scopes are bumped (sale completed, etc.) */
  scopes?: DataRefreshScope[];
}

/**
 * Refreshes data when the screen gains focus, on a timer, when the app
 * returns to foreground, and when global notify() fires for the given scopes.
 * Uses NavigationContext directly so it does not throw outside a screen.
 */
export const useAutoRefresh = ({
  onRefresh,
  intervalMs = DEFAULT_INTERVAL_MS,
  enabled = true,
  scopes = [],
}: UseAutoRefreshOptions): void => {
  const navigation = useContext(NavigationContext);
  const revision = useDataRefreshRevision(scopes);
  const [isFocused, setIsFocused] = useState(true);
  const onRefreshRef = useRef(onRefresh);
  onRefreshRef.current = onRefresh;

  const runSilent = useCallback(() => {
    void onRefreshRef.current(true);
  }, []);

  useEffect(() => {
    if (!enabled || !navigation) {
      setIsFocused(true);
      return undefined;
    }

    const onFocus = () => {
      setIsFocused(true);
      runSilent();
    };
    const onBlur = () => setIsFocused(false);

    const unsubFocus = navigation.addListener('focus', onFocus);
    const unsubBlur = navigation.addListener('blur', onBlur);

    if (navigation.isFocused()) {
      onFocus();
    }

    return () => {
      unsubFocus();
      unsubBlur();
    };
  }, [enabled, navigation, runSilent]);

  const prevRevision = useRef(revision);
  useEffect(() => {
    if (!enabled) {
      return;
    }
    if (prevRevision.current !== revision && revision > 0) {
      runSilent();
    }
    prevRevision.current = revision;
  }, [enabled, revision, runSilent]);

  useEffect(() => {
    if (!enabled || !isFocused || intervalMs <= 0) {
      return undefined;
    }
    const id = setInterval(runSilent, intervalMs);
    return () => clearInterval(id);
  }, [enabled, isFocused, intervalMs, runSilent]);

  useEffect(() => {
    if (!enabled) {
      return undefined;
    }
    const sub = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active' && isFocused) {
        runSilent();
      }
    });
    return () => sub.remove();
  }, [enabled, isFocused, runSilent]);
};
