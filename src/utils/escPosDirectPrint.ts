import type { EscPosPrintOptions } from '@/utils/escPosPrintOptions';
import { bytesToBase64 } from '@/utils/escPosBase64';

type ExchangeTextFn = (text: string, options?: EscPosPrintOptions) => { toString: (enc: string) => string };

const loadExchangeText = (): ExchangeTextFn => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mod = require('react-native-thermal-receipt-printer/dist/utils/EPToolkit');
  return mod.exchange_text as ExchangeTextFn;
};

/** Mini printers (SCO3H) often choke on double-width / bold font tags. */
export const stripFancyEscPosTags = (text: string): string =>
  text
    .replace(/<CB>/gi, '<C>')
    .replace(/<\/CB>/gi, '')
    .replace(/<CD>/gi, '<C>')
    .replace(/<\/CD>/gi, '')
    .replace(/<CM>/gi, '<C>')
    .replace(/<\/CM>/gi, '')
    .replace(/<B>/gi, '')
    .replace(/<\/B>/gi, '')
    .replace(/<M>/gi, '')
    .replace(/<\/M>/gi, '')
    .replace(/<D>/gi, '')
    .replace(/<\/D>/gi, '');

/** EPToolkit splits on `\n` only — `\r` bytes can break SCO3H output. */
export const normalizeEscPosNewlines = (text: string): string =>
  text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

export const buildEscPosBase64Payload = (
  text: string,
  options: EscPosPrintOptions,
): string => {
  const exchangeText = loadExchangeText();
  const buffer = exchangeText(normalizeEscPosNewlines(text), options);
  return buffer.toString('base64');
};

/** Plain ASCII feed after body — helps mini printers eject paper without cut command. */
export const appendMiniPrinterFeed = (base64: string): string => {
  const feed = [0x0a, 0x0a, 0x0a, 0x0a, 0x0a];
  const binary = atobPolyfill(base64);
  const merged = new Uint8Array(binary.length + feed.length);
  merged.set(binary, 0);
  merged.set(feed, binary.length);
  return bytesToBase64(merged);
};

const atobPolyfill = (base64: string): Uint8Array => {
  const normalized = base64.replace(/[^A-Za-z0-9+/=]/g, '');
  const padding = normalized.endsWith('==') ? 2 : normalized.endsWith('=') ? 1 : 0;
  const byteLength = (normalized.length * 3) / 4 - padding;
  const bytes = new Uint8Array(byteLength);
  let byteIndex = 0;
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

  for (let i = 0; i < normalized.length; i += 4) {
    const enc1 = chars.indexOf(normalized[i]);
    const enc2 = chars.indexOf(normalized[i + 1]);
    const enc3 = chars.indexOf(normalized[i + 2]);
    const enc4 = chars.indexOf(normalized[i + 3]);
    const chr1 = (enc1 << 2) | (enc2 >> 4);
    const chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
    const chr3 = ((enc3 & 3) << 6) | enc4;

    bytes[byteIndex++] = chr1;
    if (enc3 !== 64 && byteIndex < byteLength) {
      bytes[byteIndex++] = chr2;
    }
    if (enc4 !== 64 && byteIndex < byteLength) {
      bytes[byteIndex++] = chr3;
    }
  }
  return bytes;
};
