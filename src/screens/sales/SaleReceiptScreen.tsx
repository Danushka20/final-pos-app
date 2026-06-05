import React, { useRef, useState } from 'react';
import { View } from 'react-native';
import { SmoothScrollView } from '@/components/common/SmoothScrollView';
import ViewShot, { type ViewShotRef } from 'react-native-view-shot';
import { Box } from '@gluestack-ui/themed';
import { useNavigation, useRoute, CommonActions } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { ScreenContainer } from '@/components/common/ScreenContainer';
import { AppHeader } from '@/components/common/AppHeader';
import { PrimaryButton } from '@/components/buttons/PrimaryButton';
import { SaleReceiptView } from '@/components/sales/SaleReceiptView';
import { useErrorDialog } from '@/context/ErrorDialogContext';
import { usePosSettings } from '@/context/PosSettingsContext';
import { bluetoothPrintService } from '@/services/bluetooth/bluetoothPrintService';
import { navigateToPrinterSetup } from '@/navigation/navigationRef';
import {
  downloadReceiptAsImage,
  shareReceiptImageFile,
} from '@/utils/receiptImageShare';
import type { SalesStackParamList } from '@/navigation/types';

type Route = RouteProp<SalesStackParamList, 'SaleReceipt'>;

const isPrinterSetupError = (msg: string): boolean =>
  /no printer|not configured|settings/i.test(msg);

export const SaleReceiptScreen: React.FC = () => {
  const navigation = useNavigation();
  const { params } = useRoute<Route>();
  const { settings, currency } = usePosSettings();
  const { showError, showConfirm } = useErrorDialog();
  const [printing, setPrinting] = useState(false);
  const [savingImage, setSavingImage] = useState(false);
  const receiptShotRef = useRef<ViewShotRef>(null);

  const promptPrinterSetup = (message: string) => {
    showConfirm({
      title: 'Printer not set up',
      message,
      confirmLabel: 'Open printer setup',
      cancelLabel: 'Cancel',
      onConfirm: () => navigateToPrinterSetup(),
    });
  };

  const handleDownloadImage = async () => {
    setSavingImage(true);
    try {
      const message = await downloadReceiptAsImage(receiptShotRef, params.receipt);
      showError({
        title: 'Image saved',
        message,
        variant: 'info',
        confirmLabel: 'OK',
      });
    } catch (e) {
      showError({
        title: 'Download failed',
        message: e instanceof Error ? e.message : 'Could not save receipt image',
        variant: 'warning',
      });
    } finally {
      setSavingImage(false);
    }
  };

  const handleShareImage = async () => {
    setSavingImage(true);
    try {
      await shareReceiptImageFile(receiptShotRef, params.receipt);
    } catch (e) {
      showError({
        title: 'Share failed',
        message: e instanceof Error ? e.message : 'Could not share receipt image',
        variant: 'warning',
      });
    } finally {
      setSavingImage(false);
    }
  };

  const handlePrint = async () => {
    setPrinting(true);
    try {
      await bluetoothPrintService.printReceipt(params.receipt, currency, settings);
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
        title="Bill / Receipt"
        subtitle={params.receipt.sale.sales_id}
        showBack
      />

      <SmoothScrollView
        contentContainerStyle={{
          padding: 16,
          alignItems: 'center',
        }}
        contentPaddingBottom={40}>
        <View style={{ width: '100%', maxWidth: 400 }} collapsable={false}>
          <ViewShot
            ref={receiptShotRef}
            options={{ format: 'png', quality: 1, result: 'tmpfile' }}
            style={{ backgroundColor: '#fff' }}>
            <SaleReceiptView receipt={params.receipt} settings={settings} />
          </ViewShot>
        </View>
        <Box w="100%" maxWidth={400} gap="$2">
          <PrimaryButton
            label={savingImage ? 'Saving…' : 'Download receipt image'}
            variant="outline"
            onPress={handleDownloadImage}
            loading={savingImage}
          />
          <PrimaryButton
            label="Share receipt image"
            variant="outline"
            onPress={handleShareImage}
            disabled={savingImage}
          />
          {bluetoothPrintService.isSupported() ? (
            <PrimaryButton
              label={printing ? 'Printing…' : 'Print via Bluetooth'}
              onPress={handlePrint}
              loading={printing}
            />
          ) : null}
          <PrimaryButton
            label="New sale"
            variant={bluetoothPrintService.isSupported() ? 'outline' : 'primary'}
            onPress={() =>
              navigation.dispatch(
                CommonActions.reset({
                  index: 0,
                  routes: [{ name: 'SalesPOS' }],
                }),
              )
            }
          />
        </Box>
      </SmoothScrollView>
    </ScreenContainer>
  );
};
