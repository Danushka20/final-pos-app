import type { DashboardOverview, TodayTablesPayload } from '@/types/dashboard';
import type { AppAlert } from '@/types/notifications';

export function buildAppAlerts(
  overview: DashboardOverview | null,
  today: TodayTablesPayload | null,
): AppAlert[] {
  const alerts: AppAlert[] = [];
  const generatedAt =
    overview?.generated_at ?? today?.generated_at ?? new Date().toISOString();
  const metrics = overview?.metrics;
  const summary = today?.summary;

  const lowStock = metrics?.low_stock_count ?? 0;
  if (lowStock > 0) {
    alerts.push({
      id: 'low-stock',
      title: 'Low stock',
      message: `${lowStock} item${lowStock === 1 ? '' : 's'} below minimum stock level.`,
      severity: 'warning',
      createdAt: generatedAt,
      action: { type: 'today_reorder' },
    });
  }

  const reorderCount =
    summary?.reorder_items_count ?? today?.reorder_items.length ?? 0;
  if (reorderCount > 0) {
    const sample = (today?.reorder_items ?? [])
      .slice(0, 2)
      .map(item => item.description)
      .join(', ');
    alerts.push({
      id: 'reorder-items',
      title: 'Reorder needed',
      message: sample
        ? `${reorderCount} item${reorderCount === 1 ? '' : 's'} need reorder · ${sample}${reorderCount > 2 ? '…' : ''}`
        : `${reorderCount} item${reorderCount === 1 ? '' : 's'} need reorder.`,
      severity: 'warning',
      createdAt: generatedAt,
      action: { type: 'today_reorder' },
    });
  }

  const holdOrders = metrics?.hold_orders_count ?? 0;
  if (holdOrders > 0) {
    alerts.push({
      id: 'hold-orders',
      title: 'Orders on hold',
      message: `${holdOrders} sale${holdOrders === 1 ? '' : 's'} waiting to be completed.`,
      severity: 'info',
      createdAt: generatedAt,
      action: { type: 'sales' },
    });
  }

  const returnsCount = summary?.today_returns_count ?? metrics?.today_returns_count ?? 0;
  if (returnsCount > 0) {
    alerts.push({
      id: 'today-returns',
      title: 'Returns today',
      message: `${returnsCount} return${returnsCount === 1 ? '' : 's'} recorded today.`,
      severity: 'info',
      createdAt: generatedAt,
      action: { type: 'today_sales' },
    });
  }

  return alerts;
}
