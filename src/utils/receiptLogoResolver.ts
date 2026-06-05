import { receiptLogoStorage } from '@/services/storage/receiptLogoStorage';
import type { PosMobileSettings } from '@/types/settings';
import type { PrintableReceipt } from '@/utils/receiptEscPos';

export type ResolvedReceiptLogo =
  | { kind: 'local'; filePath: string; displayUri: string }
  | { kind: 'remote'; url: string; displayUri: string };

const remoteLogoFromReceipt = (
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

  return url?.trim() ? url.trim() : null;
};

export const remoteLogoFromSettings = (
  settings?: PosMobileSettings | null,
): string | null => {
  const url = settings?.printHeader?.logo_url ?? settings?.company?.logo_url;
  return url?.trim() ? url.trim() : null;
};

export const resolveReceiptLogo = async (
  receipt?: PrintableReceipt | null,
  settings?: PosMobileSettings | null,
): Promise<ResolvedReceiptLogo | null> => {
  const local = await receiptLogoStorage.get();
  if (local) {
    return {
      kind: 'local',
      filePath: local.filePath,
      displayUri: receiptLogoStorage.getDisplayUri(local),
    };
  }

  const remote = receipt
    ? remoteLogoFromReceipt(receipt, settings)
    : remoteLogoFromSettings(settings);
  if (remote) {
    return { kind: 'remote', url: remote, displayUri: remote };
  }

  return null;
};
