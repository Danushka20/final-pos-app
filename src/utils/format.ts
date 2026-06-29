/** Default ISO currency for all mobile amounts */
export const DEFAULT_CURRENCY = 'LKR';

const CURRENCY_ALIASES: Record<string, string> = {
  rs: 'LKR',
  'rs.': 'LKR',
  rupee: 'LKR',
  rupees: 'LKR',
  lkr: 'LKR',
  'sri lankan rupee': 'LKR',
  'sri lanka rupee': 'LKR',
  usd: 'USD',
  '$': 'USD',
  dollar: 'USD',
  dollars: 'USD',
  eur: 'EUR',
  euro: 'EUR',
  euros: 'EUR',
  gbp: 'GBP',
  pound: 'GBP',
  aed: 'AED',
  sar: 'SAR',
  inr: 'INR',
};

/** Normalize backend / legacy labels to a valid ISO 4217 code */
export const resolveCurrencyCode = (code?: string | null): string => {
  if (!code?.trim()) {
    return DEFAULT_CURRENCY;
  }
  const trimmed = code.trim();
  const alias = CURRENCY_ALIASES[trimmed.toLowerCase()];
  if (alias) {
    return alias;
  }
  if (/^[A-Za-z]{3}$/.test(trimmed)) {
    return trimmed.toUpperCase();
  }
  return DEFAULT_CURRENCY;
};

const localeForCurrency = (currency: string): string =>
  currency === 'LKR' ? 'en-LK' : 'en-US';

export const formatCurrency = (
  value?: number | null,
  currency?: string | null,
): string => {
  const code = resolveCurrencyCode(currency);
  const amount = value ?? 0;
  try {
    return new Intl.NumberFormat(localeForCurrency(code), {
      style: 'currency',
      currency: code,
    }).format(amount);
  } catch {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: DEFAULT_CURRENCY,
    }).format(amount);
  }
};

/** Symbol or code for labels — e.g. "Rs.", "$", "LKR" */
export const getCurrencyLabel = (currency?: string | null): string => {
  const code = resolveCurrencyCode(currency);
  try {
    const parts = new Intl.NumberFormat(localeForCurrency(code), {
      style: 'currency',
      currency: code,
    }).formatToParts(0);
    const symbol = parts.find(part => part.type === 'currency')?.value?.trim();
    return symbol && symbol !== code ? symbol : code;
  } catch {
    return code;
  }
};

/** Receipt / Bluetooth print lines — same localized currency as on-screen prices */
export const formatPrintAmount = (
  value?: number | null,
  currency?: string | null,
): string => formatCurrency(value, currency);

export const formatNumber = (value?: number | null): string => {
  return new Intl.NumberFormat('en-US').format(value ?? 0);
};

export const formatRelativeTime = (dateStr?: string | null): string => {
  if (!dateStr) {
    return '—';
  }
  const date = new Date(dateStr.replace(' ', 'T'));
  if (Number.isNaN(date.getTime())) {
    return dateStr;
  }

  const diffMs = Date.now() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString();
};

export const computeRevenueChange = (
  chart: { sales_amount: number }[],
): string | undefined => {
  if (chart.length < 2) {
    return undefined;
  }
  const yesterday = chart[chart.length - 2]?.sales_amount ?? 0;
  const today = chart[chart.length - 1]?.sales_amount ?? 0;

  if (yesterday === 0) {
    return today > 0 ? 'New sales today' : undefined;
  }

  const pct = ((today - yesterday) / yesterday) * 100;
  const sign = pct >= 0 ? '+' : '';
  return `${sign}${pct.toFixed(1)}% vs yesterday`;
};
