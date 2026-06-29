import { useCallback, useEffect, useState } from 'react';
import { getReportBackendKey, usesDashboardApi } from '@/constants/reportBackendMap';
import { useAutoRefresh } from '@/hooks/useAutoRefresh';
import { usePosSettings } from '@/context/PosSettingsContext';
import { dashboardService } from '@/services/api/dashboardService';
import { reportService } from '@/services/api/reportService';
import { buildSystemReport } from '@/utils/systemReportBuilder';
import { defaultReportDateRange } from '@/utils/reportDateFilters';
import type { BackendReportData } from '@/types/backendReports';
import type { SystemReportPayload, SystemReportType } from '@/types/reports';

export type ReportLoadResult =
  | { source: 'dashboard'; report: SystemReportPayload }
  | { source: 'backend'; report: BackendReportData };

export const useSystemReport = (type: SystemReportType) => {
  const { settings } = usePosSettings();
  const [result, setResult] = useState<ReportLoadResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (pull = false, silent = false) => {
      if (pull) {
        setRefreshing(true);
      } else if (!silent) {
        setLoading(true);
      }
      setError(null);

      try {
        if (usesDashboardApi(type)) {
          const [overview, today] = await Promise.all([
            dashboardService.getOverview(),
            dashboardService.getTodayTables(),
          ]);
          setResult({
            source: 'dashboard',
            report: buildSystemReport(type, overview, today, settings),
          });
        } else {
          const backendKey = getReportBackendKey(type);
          const { dateFrom, dateTo } = defaultReportDateRange();
          const report = await reportService.fetch(backendKey, {
            dateFrom,
            dateTo,
          });
          setResult({ source: 'backend', report });
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load report');
        setResult(null);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [settings, type],
  );

  useEffect(() => {
    load(false);
  }, [load]);

  useAutoRefresh({
    onRefresh: silent => load(false, silent),
    scopes: [
      'reports',
      'dashboard',
      'todayActivity',
      'sales',
      'purchases',
      'inventory',
      'expenses',
    ],
  });

  return {
    result,
    loading,
    refreshing,
    error,
    refresh: () => load(true),
  };
};
