import AsyncStorage from '@react-native-async-storage/async-storage';
import { ENV } from '@/config/env';

export interface StoredApiConfig {
  websiteUrl: string;
  apiBaseUrl: string;
}

export const apiConfigStorage = {
  async get(): Promise<StoredApiConfig | null> {
    const raw = await AsyncStorage.getItem(ENV.API_CONFIG_STORAGE_KEY);
    if (!raw) {
      return null;
    }
    try {
      const parsed = JSON.parse(raw) as StoredApiConfig;
      if (parsed?.apiBaseUrl && parsed?.websiteUrl) {
        return parsed;
      }
      return null;
    } catch {
      return null;
    }
  },

  async save(config: StoredApiConfig): Promise<void> {
    await AsyncStorage.setItem(ENV.API_CONFIG_STORAGE_KEY, JSON.stringify(config));
  },

  async clear(): Promise<void> {
    await AsyncStorage.removeItem(ENV.API_CONFIG_STORAGE_KEY);
  },
};
