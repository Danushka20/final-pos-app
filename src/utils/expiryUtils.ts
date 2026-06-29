import type { InventoryItem } from '@/types/sales';
import { formatExpiryDate, parseExpiryDateOnly } from '@/utils/batchUtils';
import { colors } from '@/theme';

export type ExpiryStatus = 'none' | 'ok' | 'expiring_soon' | 'expired';

export type ItemExpiryFields = Pick<
  InventoryItem,
  | 'nearest_expiry_date'
  | 'expiry_date'
  | 'expiry_status'
  | 'expiry_days_remaining'
>;

export function daysUntilExpiry(dateStr: string): number | null {
  const exp = parseExpiryDateOnly(dateStr);
  if (!exp) {
    return null;
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((exp.getTime() - today.getTime()) / 86400000);
}

export function resolveItemExpiry(
  item: ItemExpiryFields,
  alertDays = 7,
): { status: ExpiryStatus; date: string | null; daysRemaining: number | null } {
  const date = item.nearest_expiry_date ?? item.expiry_date ?? null;
  if (!date) {
    return { status: 'none', date: null, daysRemaining: null };
  }

  const daysRemaining = daysUntilExpiry(date);
  if (daysRemaining == null) {
    const status = item.expiry_status;
    if (
      status === 'expired' ||
      status === 'expiring_soon' ||
      status === 'ok'
    ) {
      return {
        status,
        date,
        daysRemaining: item.expiry_days_remaining ?? null,
      };
    }
    return { status: 'none', date, daysRemaining: item.expiry_days_remaining ?? null };
  }

  if (daysRemaining < 0) {
    return { status: 'expired', date, daysRemaining };
  }
  if (daysRemaining <= alertDays) {
    return { status: 'expiring_soon', date, daysRemaining };
  }
  return { status: 'ok', date, daysRemaining };
}

export function isItemExpired(item: ItemExpiryFields, alertDays?: number): boolean {
  return resolveItemExpiry(item, alertDays).status === 'expired';
}

export function itemHasExpiryDate(item: ItemExpiryFields): boolean {
  return Boolean(item.nearest_expiry_date ?? item.expiry_date);
}

export function expiryChipLabel(item: ItemExpiryFields, alertDays?: number): string {
  const resolved = resolveItemExpiry(item, alertDays);
  const date = resolved.date;
  if (!date || resolved.status === 'none') {
    return 'No expiry';
  }

  const formatted = formatExpiryDate(date);
  if (resolved.status === 'expired') {
    return `Expired ${formatted}`;
  }
  if (resolved.status === 'expiring_soon' && resolved.daysRemaining != null) {
    const days = resolved.daysRemaining;
    return days === 0 ? `Today · ${formatted}` : `${formatted} (${days}d)`;
  }
  if (resolved.status === 'ok' && resolved.daysRemaining != null) {
    return `${formatted} (${resolved.daysRemaining}d)`;
  }
  return formatted;
}

export function expiryChipStyles(status: ExpiryStatus): {
  backgroundColor: string;
  borderColor: string;
  textColor: string;
} {
  switch (status) {
    case 'expired':
      return {
        backgroundColor: colors.errorSoft,
        borderColor: colors.pastelPink,
        textColor: colors.error,
      };
    case 'expiring_soon':
      return {
        backgroundColor: colors.warningSoft,
        borderColor: colors.pastelYellow,
        textColor: colors.warning,
      };
    case 'ok':
      return {
        backgroundColor: colors.successSoft,
        borderColor: colors.pastelGreen,
        textColor: colors.success,
      };
    default:
      return {
        backgroundColor: colors.backgroundAlt,
        borderColor: colors.border,
        textColor: colors.textSecondary,
      };
  }
}
