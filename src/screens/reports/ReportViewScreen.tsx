import React, { useEffect, useRef, useState } from 'react';
import { RefreshControl, View } from 'react-native';
import ViewShot, { type ViewShotRef } from 'react-native-view-shot';
import { Box } from '@gluestack-ui/themed';
import { useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { SmoothScrollView } from '@/components/common/SmoothScrollView';
import { ScreenContainer } from '@/components/common/ScreenContainer';
import { AppHeader } from '@/components/common/AppHeader';
import { PrimaryButton } from '@/components/buttons/PrimaryButton';
import { LoadingOverlay } from '@/components/common/LoadingOverlay';
import { SystemReportView } from '@/components/reports/SystemReportView';
import { useErrorDialog } from '@/context/ErrorDialogContext';
import { usePosSettings } from '@/context/PosSettingsContext';
import { useSystemReport } from '@/hooks/useSystemReport';
import { bluetoothPrintService } from '@/services/bluetooth/bluetoothPrintService';
import { navigateToPrinterSetup } from '@/navigation/navigationRef';
import { SYSTEM_REPORT_CATALOG } from '@/types/reports';
import type { HomeStackParamList } from '@/navigation/types';
import { colors } from '@/theme';

type Route = RouteProp<HomeStackParamList, 'ReportView'>;

const isPrinterSetupError = (msg: string): boolean =>
  /no printer|not configured|settings/i.test(msg);

export const ReportViewScreen: React.FC = () => {
  const { params } = useRoute<Route>();
  const { settings, currency } = usePosSettings();
  const { showError, showConfirm } = useErrorDialog();
  const { report, loading, refreshing, error, refresh } = useSystemReport(params.type);
  const [printing, setPrinting] = useState(false);
  const reportShotRef = useRef<ViewShotRef>(null);
  const lastError = useRef<string | null>(null);

  const meta = SYSTEM_REPORT_CATALOG.find(item => item.id === params.type);

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
    if (!report) {
      return;
    }
    setPrinting(true);
    try {
      await bluetoothPrintService.printReport(report, currency, settings);
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

  return (
    <ScreenContainer>
      <AppHeader
        title={meta?.title ?? 'Report'}
        subtitle={report?.subtitle}
        showBack
      />

      {loading && !report ? <LoadingOverlay message="Loading report…" /> : null}

      <SmoothScrollView
        contentContainerStyle={{
          padding: 16,
          alignItems: 'center',
        }}
        contentPaddingBottom={40}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.primary} />
        }>
        {report ? (
          <>
            <View style={{ width: '100%', maxWidth: 400 }} collapsable={false}>
              <ViewShot
                ref={reportShotRef}
                options={{ format: 'png', quality: 1, result: 'tmpfile' }}
                style={{ backgroundColor: '#fff' }}>
                <SystemReportView report={report} settings={settings} />
              </ViewShot>
            </View>
            <Box w="100%" maxWidth={400} gap="$2" mt="$4">
              {bluetoothPrintService.isSupported() ? (
                <PrimaryButton
                  label={printing ? 'Printing…' : 'Print via Bluetooth'}
                  onPress={handlePrint}
                  loading={printing}
                />
              ) : null}
            </Box>
          </>
        ) : null}
      </SmoothScrollView>
    </ScreenContainer>
  );
};
