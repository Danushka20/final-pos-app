import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  DEFAULT_RECEIPT_PRINT_CUSTOMIZATION,
  type ReceiptPrintCustomization,
} from '@/types/receiptPrint';

const STORAGE_KEY = '@pos/receipt_print_customization';

export const receiptPrintStorage = {
  async get(): Promise<ReceiptPrintCustomization> {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return { ...DEFAULT_RECEIPT_PRINT_CUSTOMIZATION };
      }
      const parsed = JSON.parse(raw) as Partial<ReceiptPrintCustomization>;
      return { ...DEFAULT_RECEIPT_PRINT_CUSTOMIZATION, ...parsed };
    } catch {
      return { ...DEFAULT_RECEIPT_PRINT_CUSTOMIZATION };
    }
  },

  async save(customization: ReceiptPrintCustomization): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(customization));
  },

  async reset(): Promise<void> {
    await AsyncStorage.removeItem(STORAGE_KEY);
  },
};
