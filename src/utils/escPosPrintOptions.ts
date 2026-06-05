/** Options passed to react-native-thermal-receipt-printer (EPToolkit). */
export type EscPosEncoding = 'UTF8' | 'GB18030' | 'CP437';

export type EscPosPrintOptions = {
  encoding?: EscPosEncoding;
  cut?: boolean;
  beep?: boolean;
  tailingLine?: boolean;
};

/**
 * Legacy default — kept for backward compatibility.
 * Prefer profile-specific options from `getPrinterProfileBehavior()`.
 */
export const MINI_PRINTER_PRINT_OPTIONS: EscPosPrintOptions = {
  encoding: 'UTF8',
  cut: false,
  beep: false,
  tailingLine: true,
};

export const normalizeLineEndings = (text: string): string =>
  text.replace(/\r\n/g, '\n').replace(/\n/g, '\r\n');
