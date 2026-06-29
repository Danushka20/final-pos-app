import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';

export type DataRefreshScope =
  | 'dashboard'
  | 'todayActivity'
  | 'inventory'
  | 'customers'
  | 'purchases'
  | 'expenses'
  | 'sales'
  | 'reports';

const SCOPES: DataRefreshScope[] = [
  'dashboard',
  'todayActivity',
  'inventory',
  'customers',
  'purchases',
  'expenses',
  'sales',
  'reports',
];

type RevisionMap = Record<DataRefreshScope, number>;

const emptyRevisions = (): RevisionMap =>
  Object.fromEntries(SCOPES.map(s => [s, 0])) as RevisionMap;

interface DataRefreshContextValue {
  revisions: RevisionMap;
  notify: (scopes: DataRefreshScope | DataRefreshScope[]) => void;
  notifyAll: () => void;
}

const DataRefreshContext = createContext<DataRefreshContextValue | null>(null);

export const DataRefreshProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [revisions, setRevisions] = useState<RevisionMap>(emptyRevisions);

  const bump = useCallback((scopes: DataRefreshScope[]) => {
    setRevisions(prev => {
      const next = { ...prev };
      for (const scope of scopes) {
        next[scope] = (prev[scope] ?? 0) + 1;
      }
      return next;
    });
  }, []);

  const notify = useCallback(
    (scopes: DataRefreshScope | DataRefreshScope[]) => {
      const list = Array.isArray(scopes) ? scopes : [scopes];
      bump(list);
    },
    [bump],
  );

  const notifyAll = useCallback(() => {
    bump(SCOPES);
  }, [bump]);

  const value = useMemo(
    () => ({ revisions, notify, notifyAll }),
    [revisions, notify, notifyAll],
  );

  return (
    <DataRefreshContext.Provider value={value}>
      {children}
    </DataRefreshContext.Provider>
  );
};

export const useDataRefresh = (): DataRefreshContextValue => {
  const ctx = useContext(DataRefreshContext);
  if (!ctx) {
    throw new Error('useDataRefresh must be used within DataRefreshProvider');
  }
  return ctx;
};

/** Safe outside provider (e.g. tests) — no-op if missing */
export const useDataRefreshNotify = (): DataRefreshContextValue['notify'] => {
  const ctx = useContext(DataRefreshContext);
  return ctx?.notify ?? (() => {});
};

export const useDataRefreshRevision = (scopes: DataRefreshScope[]): number => {
  const ctx = useContext(DataRefreshContext);
  if (!ctx) {
    return 0;
  }
  return scopes.reduce((sum, scope) => sum + (ctx.revisions[scope] ?? 0), 0);
};
