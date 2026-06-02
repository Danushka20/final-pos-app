import React, { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { SmoothScrollView } from '@/components/common/SmoothScrollView';
import ViewShot, { type ViewShotRef } from 'react-native-view-shot';
import { Box } from '@gluestack-ui/themed';
import { useNavigation, useRoute, CommonActions } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { ScreenContainer } from '@/components/common/ScreenContainer';
import { AppHeader } from '@/components/common/AppHeader';
import { PrimaryButton } from '@/components/buttons/PrimaryButton';
import { SelectionModal } from '@/components/common/SelectionModal';
import { PurchaseReceiptView } from '@/components/products/PurchaseReceiptView';
import { useErrorDialog } from '@/context/ErrorDialogContext';
import { usePosSettings } from '@/context/PosSettingsContext';
import { bluetoothPrintService } from '@/services/bluetooth/bluetoothPrintService';
import {
  downloadReceiptAsImage,
  shareReceiptImageFile,
} from '@/utils/receiptImageShare';
import type { ProductsStackParamList } from '@/navigation/types';

type Route = RouteProp<ProductsStackParamList, 'PurchaseReceipt'>;
type Nav = NativeStackNavigationProp<ProductsStackParamList, 'PurchaseReceipt'>;

export const PurchaseReceiptScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Route>();
  const { settings, currency } = usePosSettings();
  const { showError } = useErrorDialog();
  const [printing, setPrinting] = useState(false);
  const [printerModal, setPrinterModal] = useState(false);
  const [printers, setPrinters] = useState<Array<{ name: string; address: string }>>([]);
  const [scanning, setScanning] = useState(false);
  const [savingImage, setSavingImage] = useState(false);
  const receiptShotRef = useRef<ViewShotRef>(null);

  useEffect(() => {
    if (!bluetoothPrintService.isSupported()) {
      return;
    }
    bluetoothPrintService.getSavedPrinterAddress().then(saved => {
      if (!saved) {
        setPrinterModal(true);
      }
    });
  }, []);

  const scanPrinters = async () => {
    setScanning(true);
    try {
      const list = await bluetoothPrintService.scanPrinters();
      setPrinters(list);
      if (list.length === 0) {
        showError({
          title: 'Printer',
          message: 'No Bluetooth printers found. Pair your printer in Android settings first.',
          variant: 'warning',
        });
      }
    } catch (e) {
      showError({
        title: 'Printer',
        message: e instanceof Error ? e.message : 'Could not scan printers',
      });
    } finally {
      setScanning(false);
    }
  };

  const handlePrint = async () => {
    setPrinting(true);
    try {
      await bluetoothPrintService.printReceipt(params.receipt, currency);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Print failed';
      if (/no printer paired|connect/i.test(msg)) {
        setPrinterModal(true);
      }
      showError({ title: 'Print', message: msg, variant: 'warning' });
    } finally {
      setPrinting(false);
    }
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

  const printerOptions = printers.map(p => ({
    id: p.address,
    label: p.name,
    subtitle: p.address,
  }));

  return (
    <ScreenContainer>
      <AppHeader
        title="Purchase bill"
        subtitle={params.receipt.purchase.invoice_id}
        showBack
      />

      <SmoothScrollView
        contentContainerStyle={{ padding: 16, alignItems: 'center' }}
        contentPaddingBottom={40}>
        <View style={{ width: '100%', maxWidth: 400 }} collapsable={false}>
          <ViewShot
            ref={receiptShotRef}
            options={{ format: 'png', quality: 1, result: 'tmpfile' }}
            style={{ backgroundColor: '#fff' }}>
            <PurchaseReceiptView receipt={params.receipt} settings={settings} />
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
            <>
              <PrimaryButton
                label={printing ? 'Printing…' : 'Print bill via Bluetooth'}
                onPress={handlePrint}
                loading={printing}
              />
              <PrimaryButton
                label="Connect printer"
                variant="outline"
                onPress={() => {
                  setPrinterModal(true);
                  scanPrinters();
                }}
              />
            </>
          ) : null}
          <PrimaryButton
            label="New purchase"
            variant={bluetoothPrintService.isSupported() ? 'outline' : 'primary'}
            onPress={() =>
              navigation.dispatch(
                CommonActions.reset({
                  index: 0,
                  routes: [{ name: 'PurchaseCreate' }],
                }),
              )
            }
          />
          <PrimaryButton
            label="Purchase list"
            variant="outline"
            onPress={() => navigation.navigate('PurchasesList')}
          />
        </Box>
      </SmoothScrollView>

      <SelectionModal
        visible={printerModal}
        title={scanning ? 'Scanning printers…' : 'Bluetooth printer'}
        options={printerOptions}
        onSelect={async opt => {
          try {
            await bluetoothPrintService.connect(opt.id);
            setPrinterModal(false);
            await handlePrint();
          } catch (e) {
            showError({
              title: 'Printer',
              message: e instanceof Error ? e.message : 'Could not connect',
            });
          }
        }}
        onClose={() => setPrinterModal(false)}
        emptyMessage={
          scanning
            ? 'Searching…'
            : 'Tap refresh — pair printer in Android Bluetooth settings first'
        }
      />
    </ScreenContainer>
  );
};
