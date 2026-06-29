import React, { useEffect, useMemo, useRef, useState } from 'react';
import { RefreshControl, View } from 'react-native';
import ViewShot, { type ViewShotRef } from 'react-native-view-shot';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Box, Text, VStack } from '@gluestack-ui/themed';
import { useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { SmoothScrollView } from '@/components/common/SmoothScrollView';
import { ScreenContainer } from '@/components/common/ScreenContainer';
import { AppHeader } from '@/components/common/AppHeader';
import { PrimaryButton } from '@/components/buttons/PrimaryButton';
import { LoadingOverlay } from '@/components/common/LoadingOverlay';
import { BackendReportView } from '@/components/reports/BackendReportView';
import { SystemReportView } from '@/components/reports/SystemReportView';
import { useErrorDialog } from '@/context/ErrorDialogContext';
import { usePosSettings } from '@/context/PosSettingsContext';
import { useSystemReport } from '@/hooks/useSystemReport';
import { bluetoothPrintService } from '@/services/bluetooth/bluetoothPrintService';
import { navigateToPrinterSetup } from '@/navigation/navigationRef';
import { getReportMeta } from '@/types/reports';
import type { SystemReportHeader } from '@/types/reports';
import type { ReportsStackParamList } from '@/navigation/types';
import type { PosMobileSettings } from '@/types/settings';
import { colors } from '@/theme';

type Route = RouteProp<ReportsStackParamList, 'ReportView'>;

const isPrinterSetupError = (msg: string): boolean =>
  /no printer|not configured|settings/i.test(msg);

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

export const ReportViewScreen: React.FC = () => {
  const { params } = useRoute<Route>();
  const insets = useSafeAreaInsets();
  const { settings, currency } = usePosSettings();
  const { showError, showConfirm } = useErrorDialog();
  const { result, loading, refreshing, error, refresh } = useSystemReport(params.type);
  const [printing, setPrinting] = useState(false);
  const reportShotRef = useRef<ViewShotRef>(null);
  const lastError = useRef<string | null>(null);

  const meta = getReportMeta(params.type);
  const header = useMemo(() => buildHeader(settings), [settings]);

  useEffect(() => {
    if (error && error !== lastError.current) {
      lastError.current = error;
      showError({ title: 'Report unavailable', message: error });
    }
  }, [error, showError]);

  const promptPrinterSetup = (message: string) => {
    showConfirm({
      title: 'Printer not set up',
      message,
      confirmLabel: 'Open printer setup',
      cancelLabel: 'Cancel',
      onConfirm: () => navigateToPrinterSetup(),
    });
  };

  const handlePrint = async () => {
    if (!result) {
      return;
    }
    if (!bluetoothPrintService.isSupported()) {
      promptPrinterSetup(
        'Bluetooth printing is not available on this device.\n\nConfigure a receipt printer in Settings → Receipt printer.',
      );
      return;
    }
    setPrinting(true);
    try {
      if (result.source === 'dashboard') {
        await bluetoothPrintService.printReport(result.report, currency, settings);
      } else {
        await bluetoothPrintService.printBackendReport(
          result.report,
          header,
          currency,
          settings,
        );
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Print failed';
      if (isPrinterSetupError(msg)) {
        promptPrinterSetup(
          `${msg}\n\nConfigure your portable printer once in Settings → Receipt printer.`,
        );
      } else {
        showError({ title: 'Print', message: msg, variant: 'warning' });
      }
    } finally {
      setPrinting(false);
    }
  };

  const subtitle =
    result?.source === 'dashboard'
      ? result.report.subtitle
      : result?.source === 'backend'
        ? `${result.report.filters.date_from} — ${result.report.filters.date_to}`
        : meta?.subtitle;

  const scrollBottomPad = Math.max(insets.bottom, 16) + 88;

  return (
    <ScreenContainer>
      <AppHeader
        title={meta?.title ?? (result?.source === 'backend' ? result.report.title : 'Report')}
        subtitle={subtitle}
        showBack
      />

      {loading && !result ? <LoadingOverlay message="Loading report…" /> : null}

      <SmoothScrollView
        contentContainerStyle={{
          padding: 16,
          alignItems: 'center',
        }}
        contentPaddingBottom={scrollBottomPad}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.primary} />
        }>
        {result ? (
          <>
            <View style={{ width: '100%', maxWidth: 400 }} collapsable={false}>
              <ViewShot
                ref={reportShotRef}
                options={{ format: 'png', quality: 1, result: 'tmpfile' }}
                style={{ backgroundColor: '#fff' }}>
                {result.source === 'dashboard' ? (
                  <SystemReportView report={result.report} settings={settings} />
                ) : (
                  <BackendReportView
                    report={result.report}
                    header={header}
                    settings={settings}
                  />
                )}
              </ViewShot>
            </View>
            <Box w="100%" maxWidth={400} gap="$2" mt="$4" mb="$2">
              <PrimaryButton
                label={printing ? 'Printing…' : 'Print via Bluetooth'}
                onPress={handlePrint}
                loading={printing}
                disabled={!result}
              />
            </Box>
          </>
        ) : !loading && !error ? (
          <Box w="100%" maxWidth={400} px="$4" py="$8">
            <VStack alignItems="center" space="md">
              <Text fontSize="$sm" color={colors.textSecondary} textAlign="center">
                No report data available.
              </Text>
            </VStack>
          </Box>
        ) : null}
      </SmoothScrollView>
    </ScreenContainer>
  );
};
