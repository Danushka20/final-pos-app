import type { PosMobileSettings } from '@/types/settings';
import type { PrintableReceipt } from '@/utils/receiptEscPos';
import {
  DEFAULT_RECEIPT_PRINT_CUSTOMIZATION,
  type ReceiptPaperWidth,
  type ReceiptPrintCustomization,
} from '@/types/receiptPrint';

const paperWidthFromHardware = (hardware?: Record<string, unknown>): ReceiptPaperWidth => {
  const raw = hardware?.printing_paper_size;
  if (typeof raw === 'string' && /80/i.test(raw)) {
    return '80mm';
  }
  if (typeof raw === 'number' && raw >= 80) {
    return '80mm';
  }
  return '58mm';
};

export const lineWidthForPaper = (paper: ReceiptPaperWidth): number =>
  paper === '80mm' ? 48 : 32;

export const mergeReceiptPrintSettings = (
  settings?: PosMobileSettings | null,
  local?: ReceiptPrintCustomization | null,
): ReceiptPrintCustomization => {
  const hardware = (settings?.hardware ?? {}) as Record<string, unknown>;
  const base = { ...DEFAULT_RECEIPT_PRINT_CUSTOMIZATION, ...local };

  if (hardware.allow_logo_on_sales_receipt === false) {
    base.showLogo = false;
  }

  if (!local?.paperWidth && hardware.printing_paper_size) {
    base.paperWidth = paperWidthFromHardware(hardware);
  }

  const serverFooter = hardware.receipt_footer_message ?? hardware.footer_message;
  if (
    typeof serverFooter === 'string' &&
    serverFooter.trim() &&
    (!local?.footerMessage ||
      local.footerMessage === DEFAULT_RECEIPT_PRINT_CUSTOMIZATION.footerMessage)
  ) {
    base.footerMessage = serverFooter.trim();
  }

  return base;
};

/** @deprecated Use resolveReceiptLogo from receiptLogoResolver */
export const resolveReceiptLogoUrl = (
  receipt: PrintableReceipt,
  settings?: PosMobileSettings | null,
): string | null => {
  const header = receipt.header as Record<string, string | undefined>;
  const printOpts =
    'sale' in receipt
      ? (receipt as { print_options?: Record<string, unknown> }).print_options
      : undefined;

  const url =
    (printOpts?.logo_url as string | undefined) ??
    header.logo_url ??
    settings?.printHeader?.logo_url ??
    settings?.company?.logo_url;

  if (!url?.trim()) {
    return null;
  }
  return url.trim();
};

export { resolveReceiptLogo } from '@/utils/receiptLogoResolver';
