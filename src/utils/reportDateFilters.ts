import type { ReportDatePreset, ReportDatePresetId, ReportFilterParams } from '@/types/reportFilters';

const pad = (n: number) => String(n).padStart(2, '0');

export const formatDateYmd = (date: Date): string =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

export const startOfDay = (date: Date): Date => {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
};

export const parseReportDate = (value: string): Date | null => {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value.trim());
  if (!match) {
    return null;
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (!year || month < 1 || month > 12 || day < 1 || day > 31) {
    return null;
  }
  return startOfDay(new Date(year, month - 1, day));
};

export const formatReportDateLabel = (value: string): string => {
  const parsed = parseReportDate(value);
  if (!parsed) {
    return value;
  }
  return parsed.toLocaleDateString('en-LK', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

/** Default report range: start of current month through today (matches web POS). */
export const defaultReportDateRange = (): { dateFrom: string; dateTo: string } => {
  const today = startOfDay(new Date());
  const from = new Date(today.getFullYear(), today.getMonth(), 1);
  return { dateFrom: formatDateYmd(from), dateTo: formatDateYmd(today) };
};

export const defaultReportFilters = (): ReportFilterParams => ({
  ...defaultReportDateRange(),
  itemId: null,
  itemLabel: null,
});

export const REPORT_DATE_PRESETS: ReportDatePreset[] = [
  { id: 'today', label: 'Today' },
  { id: 'this_week', label: 'This week' },
  { id: 'this_month', label: 'This month' },
  { id: 'last_month', label: 'Last month' },
  { id: 'custom', label: 'Custom' },
];

const startOfWeek = (date: Date): Date => {
  const next = startOfDay(date);
  const day = next.getDay();
  next.setDate(next.getDate() - day);
  return next;
};

export const dateRangeForPreset = (
  preset: Exclude<ReportDatePresetId, 'custom'>,
): { dateFrom: string; dateTo: string } => {
  const today = startOfDay(new Date());

  switch (preset) {
    case 'today':
      return { dateFrom: formatDateYmd(today), dateTo: formatDateYmd(today) };
    case 'this_week':
      return { dateFrom: formatDateYmd(startOfWeek(today)), dateTo: formatDateYmd(today) };
    case 'this_month': {
      const from = new Date(today.getFullYear(), today.getMonth(), 1);
      return { dateFrom: formatDateYmd(from), dateTo: formatDateYmd(today) };
    }
    case 'last_month': {
      const from = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const to = new Date(today.getFullYear(), today.getMonth(), 0);
      return { dateFrom: formatDateYmd(from), dateTo: formatDateYmd(to) };
    }
    default:
      return defaultReportDateRange();
  }
};

export const detectDatePreset = (
  dateFrom: string,
  dateTo: string,
): ReportDatePresetId => {
  for (const preset of REPORT_DATE_PRESETS) {
    if (preset.id === 'custom') {
      continue;
    }
    const range = dateRangeForPreset(preset.id);
    if (range.dateFrom === dateFrom && range.dateTo === dateTo) {
      return preset.id;
    }
  }
  return 'custom';
};

export const normalizeReportDateRange = (
  dateFrom: string,
  dateTo: string,
): { dateFrom: string; dateTo: string } => {
  const from = parseReportDate(dateFrom);
  const to = parseReportDate(dateTo);
  if (!from || !to) {
    return defaultReportDateRange();
  }
  if (from.getTime() <= to.getTime()) {
    return { dateFrom: formatDateYmd(from), dateTo: formatDateYmd(to) };
  }
  return { dateFrom: formatDateYmd(to), dateTo: formatDateYmd(from) };
};

export const formatReportDateRangeLabel = (dateFrom: string, dateTo: string): string =>
  `${formatReportDateLabel(dateFrom)} — ${formatReportDateLabel(dateTo)}`;
