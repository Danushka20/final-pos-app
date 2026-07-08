export interface ReportFilterParams {
  dateFrom: string;
  dateTo: string;
  itemId: number | null;
  itemLabel: string | null;
}

export type ReportDatePresetId =
  | 'today'
  | 'this_week'
  | 'this_month'
  | 'last_month'
  | 'custom';

export interface ReportDatePreset {
  id: ReportDatePresetId;
  label: string;
}
