import { useCallback, useEffect, useState } from 'react';
import { getReportBackendKey, usesDashboardApi } from '@/constants/reportBackendMap';
import { useAutoRefresh } from '@/hooks/useAutoRefresh';
import { usePosSettings } from '@/context/PosSettingsContext';
import { dashboardService } from '@/services/api/dashboardService';
import { reportService } from '@/services/api/reportService';
import { buildSystemReport } from '@/utils/systemReportBuilder';
import type { BackendReportData } from '@/types/backendReports';
import type { ReportFilterParams } from '@/types/reportFilters';
import type { SystemReportPayload, SystemReportType } from '@/types/reports';
import { formatReportDateRangeLabel } from '@/utils/reportDateFilters';

export type ReportLoadResult =
  | { source: 'dashboard'; report: SystemReportPayload }
  | { source: 'backend'; report: BackendReportData };

export const useSystemReport = (type: SystemReportType, filters: ReportFilterParams) => {
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
          const report = buildSystemReport(type, overview, today, settings);
          report.subtitle = formatReportDateRangeLabel(filters.dateFrom, filters.dateTo);
          setResult({
            source: 'dashboard',
            report,
          });
        } else {
          const backendKey = getReportBackendKey(type);
          const report = await reportService.fetch(backendKey, {
            dateFrom: filters.dateFrom,
            dateTo: filters.dateTo,
            itemId: filters.itemId,
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
    [filters.dateFrom, filters.dateTo, filters.itemId, settings, type],
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
