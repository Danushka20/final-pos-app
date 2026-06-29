import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@pos/hold_order_pin';

export const holdPinStorage = {
  async get(): Promise<string | null> {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      const trimmed = raw?.trim() ?? '';
      return trimmed.length > 0 ? trimmed : null;
    } catch {
      return null;
    }
  },

  async save(pin: string): Promise<void> {
    const trimmed = pin.trim();
    if (!trimmed) {
      return;
    }
    await AsyncStorage.setItem(STORAGE_KEY, trimmed);
  },

  async clear(): Promise<void> {
    await AsyncStorage.removeItem(STORAGE_KEY);
  },
};

export const isInvalidHoldPinError = (message: string): boolean =>
  /invalid hold order pin/i.test(message);
