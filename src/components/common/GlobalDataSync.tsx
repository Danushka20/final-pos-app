import { useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { useDataRefresh } from '@/context/DataRefreshContext';
import { GLOBAL_DATA_SYNC_INTERVAL_MS } from '@/config/realtimeSync';

/**
 * Keeps all screens in sync with the server while the user is logged in.
 * Bumps global refresh revisions on a timer and when the app returns to foreground.
 */
export function GlobalDataSync(): null {
  const { isAuthenticated } = useAuth();
  const { notifyAll } = useDataRefresh();
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    if (!isAuthenticated) {
      return undefined;
    }

    const subscription = AppState.addEventListener('change', nextState => {
      const wasBackground =
        appStateRef.current === 'background' || appStateRef.current === 'inactive';
      appStateRef.current = nextState;
      if (wasBackground && nextState === 'active') {
        notifyAll();
      }
    });

    notifyAll();

    const timer = setInterval(() => {
      if (appStateRef.current === 'active') {
        notifyAll();
      }
    }, GLOBAL_DATA_SYNC_INTERVAL_MS);

    return () => {
      subscription.remove();
      clearInterval(timer);
    };
  }, [isAuthenticated, notifyAll]);

  return null;
}
