import AsyncStorage from '@react-native-async-storage/async-storage';
import { buildEscPosPrintText } from '@/utils/receiptEscPos';
import type { SaleReceiptPayload } from '@/types/sales';
import type { PurchaseReceiptPayload } from '@/types/inventory';

const PRINTER_KEY = '@pos/printer_address';

type BluetoothPrinterModule = {
  init: () => Promise<void>;
  getDeviceList: () => Promise<Array<{ device_name?: string; inner_mac_address?: string }>>;
  connectPrinter: (address: string) => Promise<void>;
  printText: (text: string, options?: { encoding?: string }) => Promise<void>;
  printBill?: (text: string, options?: { encoding?: string }) => Promise<void>;
};

let printerModule: BluetoothPrinterModule | null | undefined;

const getPrinterModule = (): BluetoothPrinterModule | null => {
  if (printerModule !== undefined) {
    return printerModule;
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('react-native-thermal-receipt-printer');
    printerModule = (mod?.BLEPrinter ?? mod?.default?.BLEPrinter ?? null) as BluetoothPrinterModule | null;
  } catch {
    printerModule = null;
  }
  return printerModule;
};

export const bluetoothPrintService = {
  isSupported(): boolean {
    return getPrinterModule() != null;
  },

  async getSavedPrinterAddress(): Promise<string | null> {
    return AsyncStorage.getItem(PRINTER_KEY);
  },

  async savePrinterAddress(address: string): Promise<void> {
    await AsyncStorage.setItem(PRINTER_KEY, address);
  },

  async scanPrinters(): Promise<Array<{ name: string; address: string }>> {
    const mod = getPrinterModule();
    if (!mod) {
      throw new Error(
        'Bluetooth printer module is not installed. Run: npm install react-native-thermal-receipt-printer',
      );
    }
    await mod.init();
    const devices = await mod.getDeviceList();
    return (devices ?? [])
      .map(d => ({
        name: d.device_name?.trim() || 'Unknown printer',
        address: d.inner_mac_address ?? '',
      }))
      .filter(d => d.address.length > 0);
  },

  async connect(address: string): Promise<void> {
    const mod = getPrinterModule();
    if (!mod) {
      throw new Error('Bluetooth printer module is not available');
    }
    await mod.init();
    await mod.connectPrinter(address);
    await this.savePrinterAddress(address);
  },

  async printReceipt(
    receipt: SaleReceiptPayload | PurchaseReceiptPayload,
    currency?: string,
  ): Promise<void> {
    const mod = getPrinterModule();
    if (!mod) {
      throw new Error('Bluetooth printer module is not available');
    }

    const saved = await this.getSavedPrinterAddress();
    if (!saved) {
      throw new Error('No printer paired. Connect a Bluetooth printer first.');
    }

    await mod.init();
    try {
      await mod.connectPrinter(saved);
    } catch {
      /* may already be connected */
    }

    const text = buildEscPosPrintText(receipt, currency);
  if (mod.printBill) {
      await mod.printBill(text, { encoding: 'UTF-8' });
    } else {
      await mod.printText(text, { encoding: 'UTF-8' });
    }
  },
};
