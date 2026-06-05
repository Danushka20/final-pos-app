const BASE64_CHARS =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

export const bytesToBase64 = (bytes: number[] | Uint8Array): string => {
  const list = Array.from(bytes);
  let output = '';
  for (let i = 0; i < list.length; i += 3) {
    const chr1 = list[i];
    const chr2 = i + 1 < list.length ? list[i + 1] : NaN;
    const chr3 = i + 2 < list.length ? list[i + 2] : NaN;

    const enc1 = chr1 >> 2;
    const enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
    const enc3 = Number.isNaN(chr2) ? 64 : ((chr2 & 15) << 2) | (chr3 >> 6);
    const enc4 = Number.isNaN(chr3) ? 64 : chr3 & 63;

    output += BASE64_CHARS.charAt(enc1);
    output += BASE64_CHARS.charAt(enc2);
    output += enc3 === 64 ? '=' : BASE64_CHARS.charAt(enc3);
    output += enc4 === 64 ? '=' : BASE64_CHARS.charAt(enc4);
  }
  return output;
};
