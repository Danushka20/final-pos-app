/** Default report range: start of current month through today (matches web POS). */
export const defaultReportDateRange = (): { dateFrom: string; dateTo: string } => {
  const today = new Date();
  const from = new Date(today.getFullYear(), today.getMonth(), 1);
  const pad = (n: number) => String(n).padStart(2, '0');
  const fmt = (d: Date) =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  return { dateFrom: fmt(from), dateTo: fmt(today) };
};
