import { NativeModules, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import RNBlobUtil from 'react-native-blob-util';
import { buildEscPosPrintText, type PrintableReceipt } from '@/utils/receiptEscPos';
import { buildEscPosReport } from '@/utils/reportEscPos';
import { buildEscPosBackendReport } from '@/utils/backendReportEscPos';
import {
  buildDailyReceiptEscPos,
  type DailyReceiptKind,
} from '@/utils/dailyReceiptEscPos';
import type { TodayTablesPayload } from '@/types/dashboard';
import type { SystemReportPayload } from '@/types/reports';
import type { BackendReportData } from '@/types/backendReports';
import type { SystemReportHeader } from '@/types/reports';
import { receiptPrintStorage } from '@/services/storage/receiptPrintStorage';
import { mergeReceiptPrintSettings } from '@/utils/receiptPrintCustomization';
import { buildEscPosRasterBase64FromJpeg } from '@/utils/escPosRasterImage';
import {
  resolveReceiptLogo,
  type ResolvedReceiptLogo,
} from '@/utils/receiptLogoResolver';
import type { PosMobileSettings } from '@/types/settings';
import { normalizeLineEndings, type EscPosPrintOptions } from '@/utils/escPosPrintOptions';
import {
  appendMiniPrinterFeed,
  buildEscPosBase64Payload,
  stripFancyEscPosTags,
} from '@/utils/escPosDirectPrint';
import {
  getPrinterProfileBehavior,
  guessPrinterProfile,
  type PrinterProfileId,
} from '@/types/printerProfile';
import {
  buildLongTestReceipt,
  buildShortTestReceipt,
} from '@/utils/printerTestReceipts';
const PRINTER_ADDRESS_KEY = '@pos/printer_address';
const PRINTER_NAME_KEY = '@pos/printer_name';
const PRINTER_TYPE_KEY = '@pos/printer_type';
const PRINTER_PROFILE_KEY = '@pos/printer_profile';
const PRINTER_CONFIGURED_KEY = '@pos/printer_configured';

export type PrinterConnectionType = 'bluetooth' | 'network';

export type SavedPrinter = {
  type: PrinterConnectionType;
  address: string;
  name: string;
  profile: PrinterProfileId;
};

export type DiscoveredPrinter = {
  type: PrinterConnectionType;
  name: string;
  address: string;
};

type PrinterModule = {
  init: () => Promise<void>;
  connectPrinter: (...args: unknown[]) => Promise<void>;
  printText: (text: string, options?: EscPosPrintOptions) => void;
  printBill?: (text: string, options?: EscPosPrintOptions) => void;
  closeConn?: () => Promise<void>;
};

type BleDevice = { device_name?: string; inner_mac_address?: string };

type BlePrinterModule = PrinterModule & {
  getDeviceList: () => Promise<BleDevice[]>;
};

const DEFAULT_NET_PORT = 9100;

const MAC_REGEX = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;

const normalizeMac = (mac: string): string => mac.trim().toUpperCase().replace(/-/g, ':');

let bleModule: PrinterModule | null | undefined;
let netModule: PrinterModule | null | undefined;

const loadLibrary = (): {
  BLEPrinter: PrinterModule | null;
  NetPrinter: PrinterModule | null;
} => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('react-native-thermal-receipt-printer');
    return {
      BLEPrinter: (mod?.BLEPrinter ?? mod?.default?.BLEPrinter ?? null) as PrinterModule | null,
      NetPrinter: (mod?.NetPrinter ?? mod?.default?.NetPrinter ?? null) as PrinterModule | null,
    };
  } catch {
    return { BLEPrinter: null, NetPrinter: null };
  }
};

const getBleModule = (): PrinterModule | null => {
  if (bleModule !== undefined) {
    return bleModule;
  }
  bleModule = loadLibrary().BLEPrinter;
  return bleModule;
};

const getNetModule = (): PrinterModule | null => {
  if (netModule !== undefined) {
    return netModule;
  }
  netModule = loadLibrary().NetPrinter;
  return netModule;
};

const ensureBleModule = (): PrinterModule => {
  const mod = getBleModule();
  if (!mod) {
    throw new Error('Bluetooth printer module is not available');
  }
  return mod;
};

const ensureNetModule = (): PrinterModule => {
  const mod = getNetModule();
  if (!mod) {
    throw new Error('Wi‑Fi printer module is not available');
  }
  return mod;
};

export const parseNetworkAddress = (
  input: string,
  defaultPort = DEFAULT_NET_PORT,
): { host: string; port: number } => {
  const trimmed = input.trim();
  if (!trimmed) {
    throw new Error('Enter printer IP address');
  }
  if (trimmed.includes(':')) {
    const [host, portPart] = trimmed.split(':');
    const port = parseInt(portPart ?? '', 10);
    if (!host?.trim() || Number.isNaN(port) || port <= 0) {
      throw new Error('Invalid IP address or port (example: 192.168.1.50:9100)');
    }
    return { host: host.trim(), port };
  }
  return { host: trimmed, port: defaultPort };
};

export const formatNetworkAddress = (host: string, port: number): string =>
  `${host.trim()}:${port}`;

const getModuleForType = (type: PrinterConnectionType): PrinterModule => {
  return type === 'network' ? ensureNetModule() : ensureBleModule();
};

const connectToAddress = async (
  type: PrinterConnectionType,
  address: string,
  strict = false,
): Promise<void> => {
  const mod = getModuleForType(type);
  await mod.init();

  if (type === 'network') {
    const { host, port } = parseNetworkAddress(address);
    await (mod.connectPrinter as (h: string, p: number) => Promise<void>)(host, port);
    return;
  }

  const mac = normalizeMac(address);
  if (strict && mod.closeConn) {
    try {
      await mod.closeConn();
    } catch {
      /* ignore */
    }
  }
  try {
    await (mod.connectPrinter as (m: string) => Promise<void>)(mac);
  } catch (e) {
    if (strict) {
      throw e instanceof Error ? e : new Error(String(e));
    }
  }
};

const connectPrinter = async (
  type: PrinterConnectionType,
  address: string,
  strict = false,
): Promise<void> => {
  await connectToAddress(type, address, strict);
};

const POST_CONNECT_DELAY_MS = 350;

const estimatePrintDelayMs = (text: string, multiplier = 1): number =>
  Math.min(
    12000,
    Math.max(1000, Math.ceil(text.length / 32) * 120) * multiplier,
  );

const delay = (ms: number): Promise<void> =>
  new Promise(resolve => {
    setTimeout(resolve, ms);
  });

const resolvePrinterProfile = async (
  profile?: PrinterProfileId,
): Promise<PrinterProfileId> => {
  if (profile) {
    return profile;
  }
  const name = await AsyncStorage.getItem(PRINTER_NAME_KEY);
  const guessed = guessPrinterProfile(name);
  const stored = await AsyncStorage.getItem(PRINTER_PROFILE_KEY);
  if (stored === 'mini_portable' || stored === 'standard_counter') {
    // Saved before profiles existed, or wrong profile for SCO3H-style names.
    if (stored === 'standard_counter' && guessed === 'mini_portable') {
      return 'mini_portable';
    }
    return stored;
  }
  return guessed;
};

const printRawDataNative = async (
  type: PrinterConnectionType,
  base64Data: string,
  waitMs: number,
): Promise<void> => {
  const native =
    type === 'network' ? NativeModules.RNNetPrinter : NativeModules.RNBLEPrinter;
  if (!native?.printRawData) {
    throw new Error('Printer raw output is not available');
  }

  await new Promise<void>((resolve, reject) => {
    native.printRawData(base64Data, (error: string) => {
      if (error) {
        reject(new Error(error));
      } else {
        setTimeout(resolve, waitMs);
      }
    });
  });
};

/** Profile-aware ESC/POS send — SCO3H mini uses direct raw bytes + CP437, no fancy font tags. */
const sendRawText = async (
  type: PrinterConnectionType,
  text: string,
  profile?: PrinterProfileId,
): Promise<void> => {
  const mod = getModuleForType(type);
  const behavior = getPrinterProfileBehavior(await resolvePrinterProfile(profile));
  const options: EscPosPrintOptions = { ...behavior.printOptions };
  const prepared = behavior.stripFancyTags
    ? stripFancyEscPosTags(text)
    : normalizeLineEndings(text);
  const waitMs = estimatePrintDelayMs(prepared, behavior.printDelayMultiplier);

  const sendOnce = async (): Promise<void> => {
    if (behavior.useDirectRawPrint) {
      let base64 = buildEscPosBase64Payload(prepared, options);
      base64 = appendMiniPrinterFeed(base64);
      await printRawDataNative(type, base64, waitMs);
      return;
    }

  await new Promise<void>((resolve, reject) => {
    let settled = false;
    const finish = (err?: string) => {
      if (settled) {
        return;
      }
      settled = true;
      if (err) {
        reject(new Error(err));
      } else {
        resolve();
      }
    };

    try {
      if (behavior.preferPrintBill && mod.printBill) {
        mod.printBill(prepared, options);
      } else {
        mod.printText(prepared, options);
      }
    } catch (e) {
      finish(e instanceof Error ? e.message : 'Print failed');
      return;
    }

    setTimeout(() => finish(), waitMs);
  });
  };

  try {
    await sendOnce();
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (/connection is not built|not connected|socket/i.test(msg)) {
      const address = await AsyncStorage.getItem(PRINTER_ADDRESS_KEY);
      if (address) {
        await connectAndPrepare(type, address, profile);
        await sendOnce();
        return;
      }
    }
    throw e;
  }
};

const connectAndPrepare = async (
  type: PrinterConnectionType,
  address: string,
  profile?: PrinterProfileId,
): Promise<void> => {
  await connectPrinter(type, address, true);
  const behavior = getPrinterProfileBehavior(await resolvePrinterProfile(profile));
  if (behavior.useDirectRawPrint) {
    await delay(POST_CONNECT_DELAY_MS);
  }
};

const printRawEscPosBase64 = async (
  type: PrinterConnectionType,
  base64Data: string,
  delayMs = 1800,
): Promise<void> => {
  const native =
    type === 'network' ? NativeModules.RNNetPrinter : NativeModules.RNBLEPrinter;
  if (!native?.printRawData) {
    throw new Error('Printer does not support raw image output');
  }

  await new Promise<void>((resolve, reject) => {
    native.printRawData(base64Data, (error: string) => {
      if (error) {
        reject(new Error(error));
      } else {
        setTimeout(resolve, delayMs);
      }
    });
  });
};

const printRemoteLogoImage = async (
  type: PrinterConnectionType,
  logoUrl: string,
): Promise<void> => {
  const native =
    type === 'network' ? NativeModules.RNNetPrinter : NativeModules.RNBLEPrinter;
  if (!native?.printImageData) {
    return;
  }

  await new Promise<void>((resolve, reject) => {
    native.printImageData(logoUrl, (error: string) => {
      if (error) {
        reject(new Error(error));
      } else {
        setTimeout(resolve, 1800);
      }
    });
  });
};

const printLocalLogoFile = async (
  type: PrinterConnectionType,
  filePath: string,
): Promise<void> => {
  const jpegBase64 = await RNBlobUtil.fs.readFile(filePath, 'base64');
  const rasterBase64 = buildEscPosRasterBase64FromJpeg(jpegBase64);
  await printRawEscPosBase64(type, rasterBase64, 2200);
};

const printResolvedLogo = async (
  type: PrinterConnectionType,
  logo: ResolvedReceiptLogo,
  profile?: PrinterProfileId,
): Promise<void> => {
  const behavior = getPrinterProfileBehavior(await resolvePrinterProfile(profile));
  if (!behavior.supportsRasterLogo) {
    return;
  }
  if (logo.kind === 'local') {
    await printLocalLogoFile(type, logo.filePath);
    return;
  }
  await printRemoteLogoImage(type, logo.url);
};

const resolveSavedPrinter = async (): Promise<SavedPrinter> => {
  const address = await AsyncStorage.getItem(PRINTER_ADDRESS_KEY);
  if (!address?.trim()) {
    throw new Error('No printer configured. Set up your printer in Settings → Receipt printer.');
  }
  const name = (await AsyncStorage.getItem(PRINTER_NAME_KEY)) ?? 'Saved printer';
  const typeRaw = await AsyncStorage.getItem(PRINTER_TYPE_KEY);
  const type: PrinterConnectionType = typeRaw === 'network' ? 'network' : 'bluetooth';
  const profile = await resolvePrinterProfile();
  return { type, address, name, profile };
};

export const bluetoothPrintService = {
  isSupported(): boolean {
    return getBleModule() != null || getNetModule() != null;
  },

  supportsBluetooth(): boolean {
    return getBleModule() != null;
  },

  supportsNetwork(): boolean {
    return getNetModule() != null && Platform.OS === 'android';
  },

  async getSavedPrinterAddress(): Promise<string | null> {
    return AsyncStorage.getItem(PRINTER_ADDRESS_KEY);
  },

  async getSavedPrinter(): Promise<SavedPrinter | null> {
    const address = await AsyncStorage.getItem(PRINTER_ADDRESS_KEY);
    if (!address) {
      return null;
    }
    const name = (await AsyncStorage.getItem(PRINTER_NAME_KEY)) ?? 'Saved printer';
    const typeRaw = await AsyncStorage.getItem(PRINTER_TYPE_KEY);
    const type: PrinterConnectionType = typeRaw === 'network' ? 'network' : 'bluetooth';
    const profile = await resolvePrinterProfile();
    return { type, address, name, profile };
  },

  async isConfigured(): Promise<boolean> {
    const address = await AsyncStorage.getItem(PRINTER_ADDRESS_KEY);
    if (!address?.trim()) {
      return false;
    }
    const flag = await AsyncStorage.getItem(PRINTER_CONFIGURED_KEY);
    return flag === 'true' || Boolean(address?.trim());
  },

  async savePrinter(printer: SavedPrinter): Promise<void> {
    await AsyncStorage.setMany({
      [PRINTER_ADDRESS_KEY]: printer.address,
      [PRINTER_NAME_KEY]: printer.name,
      [PRINTER_TYPE_KEY]: printer.type,
      [PRINTER_PROFILE_KEY]: printer.profile,
      [PRINTER_CONFIGURED_KEY]: 'true',
    });
  },

  async clearSavedPrinter(): Promise<void> {
    await AsyncStorage.removeMany([
      PRINTER_ADDRESS_KEY,
      PRINTER_NAME_KEY,
      PRINTER_TYPE_KEY,
      PRINTER_PROFILE_KEY,
      PRINTER_CONFIGURED_KEY,
    ]);
  },

  /** @deprecated Use savePrinter after setup tests */
  async savePrinterAddress(address: string): Promise<void> {
    await this.savePrinter({
      type: 'bluetooth',
      address: normalizeMac(address),
      name: 'Printer',
      profile: 'mini_portable',
    });
  },

  /** All paired Bluetooth devices (any ESC/POS portable printer). */
  async scanBluetoothPrinters(): Promise<DiscoveredPrinter[]> {
    const mod = ensureBleModule() as BlePrinterModule;
    await mod.init();
    try {
      const devices = await mod.getDeviceList();
      return (devices ?? [])
        .map(d => ({
          type: 'bluetooth' as const,
          name: d.device_name?.trim() || 'Bluetooth printer',
          address: normalizeMac(d.inner_mac_address ?? ''),
        }))
        .filter(d => d.address.length > 0);
    } catch (e) {
      const msg = String(e ?? '');
      if (/no device|not found/i.test(msg)) {
        return [];
      }
      throw e instanceof Error ? e : new Error(msg || 'Could not list Bluetooth printers');
    }
  },

  /** Backward-compatible alias — paired Bluetooth printers only. */
  async scanPrinters(): Promise<Array<{ name: string; address: string }>> {
    const list = await this.scanBluetoothPrinters();
    return list.map(d => ({ name: d.name, address: d.address }));
  },

  isValidMacAddress(mac: string): boolean {
    return MAC_REGEX.test(mac.trim());
  },

  async connectSession(printer: Pick<SavedPrinter, 'type' | 'address'>): Promise<void> {
    if (printer.type === 'bluetooth') {
      if (!this.isValidMacAddress(printer.address)) {
        throw new Error('Invalid Bluetooth address. Use format AA:BB:CC:DD:EE:FF');
      }
      await connectPrinter('bluetooth', normalizeMac(printer.address));
      return;
    }
    await connectPrinter('network', printer.address);
  },

  /** Connect and persist immediately (legacy) */
  async connect(address: string, name = 'Printer'): Promise<void> {
    await this.connectSession({ type: 'bluetooth', address });
    await this.savePrinter({
      type: 'bluetooth',
      address: normalizeMac(address),
      name,
      profile: guessPrinterProfile(name),
    });
  },

  async printRawText(
    text: string,
    options?: { address?: string; type?: PrinterConnectionType },
  ): Promise<void> {
    const type = options?.type ?? (await resolveSavedPrinter()).type;
    const address =
      options?.address ?? (await AsyncStorage.getItem(PRINTER_ADDRESS_KEY)) ?? undefined;
    if (!address) {
      throw new Error('No printer connected. Set up a printer in Settings first.');
    }
    const profile = await resolvePrinterProfile();
    await connectAndPrepare(type, address, profile);
    await sendRawText(type, text, profile);
  },

  async printTestReceipt(
    variant: 'short' | 'long',
    options?: {
      address?: string;
      type?: PrinterConnectionType;
      profile?: PrinterProfileId;
      storeName?: string;
      settings?: PosMobileSettings | null;
    },
  ): Promise<void> {
    const localCustomization = await receiptPrintStorage.get();
    const customization = mergeReceiptPrintSettings(options?.settings, localCustomization);
    const type = options?.type ?? (await resolveSavedPrinter()).type;
    const profile = await resolvePrinterProfile(options?.profile);
    const address =
      options?.address ?? (await AsyncStorage.getItem(PRINTER_ADDRESS_KEY)) ?? undefined;
    if (!address) {
      throw new Error('No printer connected. Set up a printer in Settings first.');
    }
    await connectAndPrepare(type, address, profile);

    if (customization.showLogo) {
      const logo = await resolveReceiptLogo(null, options?.settings);
      if (logo) {
        try {
          await printResolvedLogo(type, logo, profile);
        } catch {
          /* continue */
        }
      }
    }

    const text =
      variant === 'short'
        ? buildShortTestReceipt(options?.storeName, customization)
        : buildLongTestReceipt(options?.storeName, customization);
    await sendRawText(type, text, profile);
  },

  async printReceipt(
    receipt: PrintableReceipt,
    currency?: string,
    settings?: PosMobileSettings | null,
  ): Promise<void> {
    if (!(await this.isConfigured())) {
      throw new Error(
        'No printer configured. Set up your printer in Settings → Receipt printer.',
      );
    }

    const saved = await resolveSavedPrinter();
    const localCustomization = await receiptPrintStorage.get();
    const customization = mergeReceiptPrintSettings(settings, localCustomization);
    const logo = await resolveReceiptLogo(receipt, settings);

    await connectAndPrepare(saved.type, saved.address, saved.profile);

    if (customization.showLogo && logo) {
      try {
        await printResolvedLogo(saved.type, logo, saved.profile);
      } catch {
        /* continue with text if logo print fails */
      }
    }

    const text = buildEscPosPrintText(receipt, {
      currency,
      customization,
      settings,
    });
    await sendRawText(saved.type, text, saved.profile);
  },

  async printReport(
    report: SystemReportPayload,
    currency?: string,
    settings?: PosMobileSettings | null,
  ): Promise<void> {
    if (!(await this.isConfigured())) {
      throw new Error(
        'No printer configured. Set up your printer in Settings → Receipt printer.',
      );
    }

    const saved = await resolveSavedPrinter();
    const localCustomization = await receiptPrintStorage.get();
    const customization = mergeReceiptPrintSettings(settings, localCustomization);
    const logo = await resolveReceiptLogo(null, settings);

    await connectAndPrepare(saved.type, saved.address, saved.profile);

    if (customization.showLogo && logo) {
      try {
        await printResolvedLogo(saved.type, logo, saved.profile);
      } catch {
        /* continue with text if logo print fails */
      }
    }

    const text = buildEscPosReport(report, {
      currency,
      customization,
      settings,
    });
    await sendRawText(saved.type, text, saved.profile);
  },

  async printBackendReport(
    report: BackendReportData,
    header: SystemReportHeader,
    currency?: string,
    settings?: PosMobileSettings | null,
  ): Promise<void> {
    if (!(await this.isConfigured())) {
      throw new Error(
        'No printer configured. Set up your printer in Settings → Receipt printer.',
      );
    }

    const saved = await resolveSavedPrinter();
    const localCustomization = await receiptPrintStorage.get();
    const customization = mergeReceiptPrintSettings(settings, localCustomization);
    const logo = await resolveReceiptLogo(null, settings);

    await connectAndPrepare(saved.type, saved.address, saved.profile);

    if (customization.showLogo && logo) {
      try {
        await printResolvedLogo(saved.type, logo, saved.profile);
      } catch {
        /* continue with text if logo print fails */
      }
    }

    const text = buildEscPosBackendReport(report, header, {
      currency,
      customization,
      settings,
    });
    await sendRawText(saved.type, text, saved.profile);
  },

  async printDailyReceipt(
    kind: DailyReceiptKind,
    data: TodayTablesPayload,
    header: SystemReportHeader,
    currency?: string,
    settings?: PosMobileSettings | null,
  ): Promise<void> {
    if (!(await this.isConfigured())) {
      throw new Error(
        'No printer configured. Set up your printer in Settings → Receipt printer.',
      );
    }

    const saved = await resolveSavedPrinter();
    const localCustomization = await receiptPrintStorage.get();
    const customization = mergeReceiptPrintSettings(settings, localCustomization);
    const logo = await resolveReceiptLogo(null, settings);

    await connectAndPrepare(saved.type, saved.address, saved.profile);

    if (customization.showLogo && logo) {
      try {
        await printResolvedLogo(saved.type, logo, saved.profile);
      } catch {
        /* continue */
      }
    }

    const text = buildDailyReceiptEscPos(kind, data, header, {
      currency,
      customization,
      settings,
    });
    await sendRawText(saved.type, text, saved.profile);
  },
};
