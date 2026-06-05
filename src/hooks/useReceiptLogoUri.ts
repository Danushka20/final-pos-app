import { useEffect, useState } from 'react';
import type { PosMobileSettings } from '@/types/settings';
import type { PrintableReceipt } from '@/utils/receiptEscPos';
import { resolveReceiptLogo } from '@/utils/receiptLogoResolver';

export const useReceiptLogoUri = (
  settings?: PosMobileSettings | null,
  receipt?: PrintableReceipt | null,
): string | null => {
  const [uri, setUri] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    resolveReceiptLogo(receipt ?? null, settings).then(resolved => {
      if (active) {
        setUri(resolved?.displayUri ?? null);
      }
    });
    return () => {
      active = false;
    };
  }, [settings, receipt]);

  return uri;
};
