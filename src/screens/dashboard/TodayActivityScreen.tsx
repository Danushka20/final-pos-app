import React, { useEffect, useMemo, useState } from 'react';
import { RefreshControl, StyleSheet, View } from 'react-native';
import { useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { Box, Text } from '@gluestack-ui/themed';
import {
  CalendarDays,
  ShoppingBag,
  Truck,
  AlertTriangle,
  RotateCcw,
  List,
} from 'lucide-react-native';
import { PaperSegmentFilter } from '@/components/common/PaperSegmentFilter';
import { ScreenContainer } from '@/components/common/ScreenContainer';
import { AppHeader } from '@/components/common/AppHeader';
import { SmoothScrollView } from '@/components/common/SmoothScrollView';
import { PrimaryButton } from '@/components/buttons/PrimaryButton';
import { LoadingOverlay } from '@/components/common/LoadingOverlay';
import { TodayActivityTabs } from '@/components/dashboard/TodayActivityTabs';
import {
  TodayPurchasesList,
  TodayReorderList,
  TodaySalesList,
} from '@/components/dashboard/TodayActivityRows';
import { useErrorDialog } from '@/context/ErrorDialogContext';
import { usePosSettings } from '@/context/PosSettingsContext';
import { useTodayActivity } from '@/hooks/useTodayActivity';
import { bluetoothPrintService } from '@/services/bluetooth/bluetoothPrintService';
import { navigateToPrinterSetup } from '@/navigation/navigationRef';
import { formatCurrency, formatNumber } from '@/utils/format';
import type { DailyReceiptKind } from '@/utils/dailyReceiptEscPos';
import type { SystemReportHeader } from '@/types/reports';
import { colors, shadows, typography, TAB_BAR_SCROLL_PADDING } from '@/theme';
import type { HomeStackParamList } from '@/navigation/types';
import type { TodayActivityTab } from '@/navigation/types';
import { TRANSACTION_TYPE_RETURN } from '@/types/sales';

type TodaySalesFilter = 'all' | 'sale' | 'return';

type Route = RouteProp<HomeStackParamList, 'TodayActivity'>;

const isPrinterSetupError = (msg: string): boolean =>
  /no printer|not configured|settings/i.test(msg);

const buildHeader = (settings: ReturnType<typeof usePosSettings>['settings']): SystemReportHeader => ({
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

export const TodayActivityScreen: React.FC = () => {
  const route = useRoute<Route>();
  const { showError, showConfirm } = useErrorDialog();
  const { currency, settings } = usePosSettings();
  const { data, loading, refreshing, error, refresh } = useTodayActivity();
  const [tab, setTab] = useState<TodayActivityTab>(route.params?.tab ?? 'sales');
  const [salesFilter, setSalesFilter] = useState<TodaySalesFilter>('all');
  const [printing, setPrinting] = useState(false);

  useEffect(() => {
    if (route.params?.tab) {
      setTab(route.params.tab);
    }
  }, [route.params?.tab]);

  useEffect(() => {
    if (error) {
      showError({ title: 'Today\'s records', message: error });
    }
  }, [error, showError]);

  const summary = data.summary;

  const salesCounts = useMemo(() => {
    const returns = data.today_sales.filter(
      r => r.transaction_type === TRANSACTION_TYPE_RETURN,
    ).length;
    return {
      all: data.today_sales.length,
      sale: data.today_sales.length - returns,
      return: returns,
    };
  }, [data.today_sales]);

  const filteredSales = useMemo(() => {
    if (salesFilter === 'return') {
      return data.today_sales.filter(
        r => r.transaction_type === TRANSACTION_TYPE_RETURN,
      );
    }
    if (salesFilter === 'sale') {
      return data.today_sales.filter(
        r => r.transaction_type !== TRANSACTION_TYPE_RETURN,
      );
    }
    return data.today_sales;
  }, [data.today_sales, salesFilter]);

  const dateLabel = data.date
    ? new Date(`${data.date}T12:00:00`).toLocaleDateString(undefined, {
        weekday: 'long',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : 'Today';

  const printKind: DailyReceiptKind | null =
    tab === 'purchases'
      ? 'purchases'
      : tab === 'sales' && salesFilter === 'return'
        ? 'refunds'
        : tab === 'sales'
          ? 'sales'
          : null;

  const printLabel =
    printKind === 'purchases'
      ? 'Print daily purchase receipt'
      : printKind === 'refunds'
        ? 'Print daily refund receipt'
        : printKind === 'sales'
          ? 'Print daily sales receipt'
          : '';

  const handlePrintDaily = async () => {
    if (!printKind) {
      return;
    }
    setPrinting(true);
    try {
      if (!bluetoothPrintService.isSupported()) {
        showConfirm({
          title: 'Printer not set up',
          message: 'Configure a receipt printer in Settings → Receipt printer.',
          confirmLabel: 'Open printer setup',
          cancelLabel: 'Cancel',
          onConfirm: () => navigateToPrinterSetup(),
        });
        return;
      }
      await bluetoothPrintService.printDailyReceipt(
        printKind,
        data,
        buildHeader(settings),
        currency,
        settings,
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Print failed';
      if (isPrinterSetupError(msg)) {
        showConfirm({
          title: 'Printer not set up',
          message: msg,
          confirmLabel: 'Open printer setup',
          cancelLabel: 'Cancel',
          onConfirm: () => navigateToPrinterSetup(),
        });
      } else {
        showError({ title: 'Print', message: msg, variant: 'warning' });
      }
    } finally {
      setPrinting(false);
    }
  };

  const summaryConfig =
    tab === 'sales'
      ? {
          icon: ShoppingBag,
          iconBg: colors.backgroundAlt,
          iconColor: colors.text,
          label: 'Today\'s actual sales',
          value: formatCurrency(summary.today_sales_amount, currency),
          hint:
            (summary.today_returns_count ?? 0) > 0
              ? `${formatNumber(summary.today_sales_count)} sales · ${formatNumber(summary.today_returns_count)} returns (separate)`
              : `${formatNumber(summary.today_sales_count)} sale bills`,
        }
      : tab === 'purchases'
        ? {
            icon: Truck,
            iconBg: colors.backgroundAlt,
            iconColor: colors.text,
            label: 'Today\'s purchases',
            value: formatCurrency(summary.today_purchases_amount, currency),
            hint: `${formatNumber(summary.today_purchases_count)} supplier orders`,
          }
        : {
            icon: AlertTriangle,
            iconBg: colors.backgroundAlt,
            iconColor: colors.textSecondary,
            label: 'Reorder list',
            value: formatNumber(summary.reorder_items_count),
            hint: 'Items at or below reorder level',
          };

  const SummaryIcon = summaryConfig.icon;

  return (
    <ScreenContainer>
      <AppHeader title="Today's records" subtitle={dateLabel} showBack />

      {loading && !data.today_sales.length && !data.today_purchases.length ? (
        <LoadingOverlay message="Loading today's data…" />
      ) : null}

      {printing ? <LoadingOverlay message="Printing receipt…" /> : null}

      <SmoothScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        contentPaddingBottom={TAB_BAR_SCROLL_PADDING}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.primary} />
        }>
        <Box px="$4" pt="$3">
          <View style={[styles.summaryCard, shadows.card]}>
            <View style={[styles.summaryIcon, { backgroundColor: summaryConfig.iconBg }]}>
              <SummaryIcon size={22} color={summaryConfig.iconColor} strokeWidth={2.2} />
            </View>
            <View style={styles.summaryText}>
              <View style={styles.dateRow}>
                <CalendarDays size={14} color={colors.textMuted} />
                <Text style={styles.dateLabel}>{dateLabel}</Text>
              </View>
              <Text style={styles.summaryLabel}>{summaryConfig.label}</Text>
              <Text style={styles.summaryValue}>{summaryConfig.value}</Text>
              <Text style={styles.summaryHint}>{summaryConfig.hint}</Text>
            </View>
          </View>

          <TodayActivityTabs
            active={tab}
            onChange={setTab}
            counts={{
              sales: data.today_sales.length,
              purchases: summary.today_purchases_count,
              reorder: summary.reorder_items_count,
            }}
          />

          {printKind ? (
            <View style={styles.printWrap}>
              <PrimaryButton
                label={printing ? 'Printing…' : printLabel}
                onPress={handlePrintDaily}
                loading={printing}
                disabled={printing}
              />
            </View>
          ) : null}

          {tab === 'sales' ? (
            <>
              <PaperSegmentFilter
                title=""
                selected={salesFilter}
                onSelect={setSalesFilter}
                options={[
                  {
                    value: 'all' as const,
                    label: 'All',
                    Icon: List,
                    badge: salesCounts.all,
                    checkedColor: colors.primary,
                  },
                  {
                    value: 'sale' as const,
                    label: 'Sales',
                    Icon: ShoppingBag,
                    badge: salesCounts.sale,
                    checkedColor: colors.primary,
                  },
                  {
                    value: 'return' as const,
                    label: 'Returns',
                    Icon: RotateCcw,
                    badge: salesCounts.return,
                    checkedColor: colors.error,
                  },
                ]}
              />
              <TodaySalesList rows={filteredSales} currency={currency} />
            </>
          ) : null}
          {tab === 'purchases' ? (
            <TodayPurchasesList rows={data.today_purchases} currency={currency} />
          ) : null}
          {tab === 'reorder' ? (
            <TodayReorderList rows={data.reorder_items} />
          ) : null}
        </Box>
      </SmoothScrollView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  summaryCard: {
    flexDirection: 'row',
    backgroundColor: colors.backgroundAlt,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 16,
    gap: 14,
  },
  summaryIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryText: {
    flex: 1,
    minWidth: 0,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  dateLabel: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: '600',
  },
  summaryLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  summaryValue: {
    ...typography.h2,
    color: colors.text,
    marginTop: 2,
  },
  summaryHint: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 4,
    fontWeight: '600',
  },
  printWrap: {
    marginBottom: 12,
  },
});
