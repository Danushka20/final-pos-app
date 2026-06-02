/**
 * Turn a website / server address into the Laravel API base URL.
 * Laravel API lives at: {site}/api  (e.g. https://yourstore.com/public/api)
 */
export function normalizeWebsiteUrl(input: string): string {
  let url = input.trim();
  if (!url) {
    throw new Error('Enter your website or server address');
  }

  url = url.replace(/\/+$/, '');
  url = url.replace(/\/api\/?$/i, '');

  if (!/^https?:\/\//i.test(url)) {
    const looksLocal =
      /^(\d{1,3}\.){3}\d{1,3}(:\d+)?$/i.test(url) ||
      url.startsWith('localhost') ||
      url.startsWith('127.0.0.1') ||
      url.startsWith('10.') ||
      url.startsWith('192.168.');

    url = `${looksLocal ? 'http' : 'https'}://${url}`;
  }

  return url.replace(/\/+$/, '');
}

export function buildApiBaseUrl(websiteInput: string): string {
  return `${normalizeWebsiteUrl(websiteInput)}/api`;
}

/** Display-friendly website from stored API base (strip trailing /api). */
export function websiteFromApiBaseUrl(apiBaseUrl: string): string {
  return apiBaseUrl.replace(/\/api\/?$/i, '');
}

export function isValidWebsiteInput(input: string): boolean {
  try {
    normalizeWebsiteUrl(input);
    return true;
  } catch {
    return false;
  }
}
