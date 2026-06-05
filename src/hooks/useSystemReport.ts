import { useCallback, useEffect, useState } from 'react';
import { usePosSettings } from '@/context/PosSettingsContext';
import { dashboardService } from '@/services/api/dashboardService';
import { buildSystemReport } from '@/utils/systemReportBuilder';
import type { SystemReportPayload, SystemReportType } from '@/types/reports';

export const useSystemReport = (type: SystemReportType) => {
  const { settings } = usePosSettings();
  const [report, setReport] = useState<SystemReportPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (pull = false) => {
      if (pull) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      try {
        const [overview, today] = await Promise.all([
          dashboardService.getOverview(),
          dashboardService.getTodayTables(),
        ]);
        setReport(buildSystemReport(type, overview, today, settings));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load report');
        setReport(null);
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

  return {
    report,
    loading,
    refreshing,
    error,
    refresh: () => load(true),
  };
};
