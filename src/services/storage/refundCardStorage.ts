import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@pos/refund_card_last4';

export const refundCardStorage = {
  async get(): Promise<string | null> {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return null;
      }
      const digits = raw.replace(/\D/g, '').slice(-4);
      return digits.length === 4 ? digits : null;
    } catch {
      return null;
    }
  },

  async save(last4: string): Promise<void> {
    const digits = last4.replace(/\D/g, '').slice(-4);
    if (digits.length !== 4) {
      return;
    }
    await AsyncStorage.setItem(STORAGE_KEY, digits);
  },
};
