import type { DashboardOverview, TodayTablesPayload } from '@/types/dashboard';
import type { PosMobileSettings } from '@/types/settings';
import type { SystemReportHeader, SystemReportPayload } from '@/types/reports';
import type { SystemReportType } from '@/types/reports';

const buildHeader = (settings?: PosMobileSettings | null): SystemReportHeader => ({
  company_name:
    settings?.printHeader?.company_name ??
    settings?.company?.name ??
    'Business Report',
  address:
    settings?.printHeader?.address_line ?? settings?.company?.address ?? undefined,
  phone: settings?.printHeader?.phone ?? settings?.company?.phone ?? undefined,
  email: settings?.printHeader?.email ?? settings?.company?.email ?? undefined,
  tax_id: settings?.printHeader?.tax_id ?? settings?.company?.tax_id ?? undefined,
});

const formatReportDate = (date: string): string => {
  const parsed = new Date(`${date}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return date;
  }
  return parsed.toLocaleDateString(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

export const buildSystemReport = (
  type: SystemReportType,
  overview: DashboardOverview,
  today: TodayTablesPayload,
  settings?: PosMobileSettings | null,
): SystemReportPayload => {
  const header = buildHeader(settings);
  const dateLabel = formatReportDate(today.date);
  const generatedAt = today.generated_at ?? overview.generated_at;

  const base: SystemReportPayload = {
    type,
    date: today.date,
    generated_at: generatedAt,
    header,
    title: '',
    subtitle: dateLabel,
  };

  switch (type) {
    case 'daily_summary':
      return {
        ...base,
        title: 'Daily Business Summary',
        daily_summary: {
          metrics: overview.metrics,
          summary: today.summary,
        },
      };
    case 'sales_report':
      return {
        ...base,
        title: 'Sales Report',
        sales_rows: today.today_sales,
      };
    case 'reorder':
      return {
        ...base,
        title: 'Reorder Report',
        reorder_rows: today.reorder_items,
      };
    default:
      return base;
  }
};
