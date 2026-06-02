import { Platform } from 'react-native';
import { apiConfigStorage, type StoredApiConfig } from '@/services/storage/apiConfigStorage';
import { buildApiBaseUrl, normalizeWebsiteUrl } from '@/utils/apiUrl';

/**
 * REAL PHONE (dev fallback only): set IP only (no port). Example: '192.168.8.100'
 * Used when no saved server URL exists in development.
 */
export const DEV_MACHINE_IP = '192.168.8.100';
export const DEV_API_PORT = 8000;

export const ENV = {
  API_CONFIG_STORAGE_KEY: '@pos_api_config',
  TOKEN_STORAGE_KEY: '@pos_auth_token',
  USER_STORAGE_KEY: '@pos_auth_user',
  API_TIMEOUT_MS: 30000,
  DEVICE_NAME: 'POSMobile',
} as const;

let cachedApiConfig: StoredApiConfig | null = null;
let configLoaded = false;

const getDevHost = (): string => {
  const ip = DEV_MACHINE_IP.trim();

  if (ip.includes(':') || /\.\d{4,}$/.test(ip)) {
    throw new Error(
      'DEV_MACHINE_IP must be IP only (e.g. 192.168.8.100). Set port in DEV_API_PORT.',
    );
  }

  if (ip) {
    return ip;
  }

  return Platform.OS === 'android' ? '10.0.2.2' : '127.0.0.1';
};

function getDevApiBaseUrl(): string {
  const host = getDevHost();
  return `http://${host}:${DEV_API_PORT}/api`;
}

function getDevWebsiteUrl(): string {
  const host = getDevHost();
  return `http://${host}:${DEV_API_PORT}`;
}

/** Load saved API config from device storage (call once on app start). */
export async function initApiConfig(): Promise<void> {
  cachedApiConfig = await apiConfigStorage.get();
  configLoaded = true;
}

export function isApiConfigLoaded(): boolean {
  return configLoaded;
}

export function isApiConfigured(): boolean {
  return Boolean(cachedApiConfig?.apiBaseUrl);
}

export function getStoredApiConfig(): StoredApiConfig | null {
  return cachedApiConfig;
}

/** Full API URL — saved config first, then dev fallback in __DEV__ only. */
export function getApiBaseUrl(): string {
  if (cachedApiConfig?.apiBaseUrl) {
    return cachedApiConfig.apiBaseUrl;
  }
  if (__DEV__) {
    return getDevApiBaseUrl();
  }
  return '';
}

export function getWebsiteUrl(): string {
  if (cachedApiConfig?.websiteUrl) {
    return cachedApiConfig.websiteUrl;
  }
  if (__DEV__) {
    return getDevWebsiteUrl();
  }
  return '';
}

/** Save website/server URL and persist for all future API calls. */
export async function saveApiConfig(websiteInput: string): Promise<StoredApiConfig> {
  const websiteUrl = normalizeWebsiteUrl(websiteInput);
  const apiBaseUrl = buildApiBaseUrl(websiteInput);
  const config: StoredApiConfig = { websiteUrl, apiBaseUrl };
  await apiConfigStorage.save(config);
  cachedApiConfig = config;
  return config;
}

export async function clearApiConfig(): Promise<void> {
  await apiConfigStorage.clear();
  cachedApiConfig = null;
}
