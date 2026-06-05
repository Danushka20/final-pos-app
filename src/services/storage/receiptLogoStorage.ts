import AsyncStorage from '@react-native-async-storage/async-storage';
import RNBlobUtil from 'react-native-blob-util';

const LOGO_META_KEY = '@pos/receipt_logo_meta';
const LOGO_FILE_NAME = 'receipt_logo.jpg';

export type StoredReceiptLogo = {
  filePath: string;
  updatedAt: string;
};

const logoFilePath = (): string =>
  `${RNBlobUtil.fs.dirs.DocumentDir}/${LOGO_FILE_NAME}`;

export const receiptLogoStorage = {
  async get(): Promise<StoredReceiptLogo | null> {
    try {
      const raw = await AsyncStorage.getItem(LOGO_META_KEY);
      if (!raw) {
        return null;
      }
      const meta = JSON.parse(raw) as StoredReceiptLogo;
      const exists = await RNBlobUtil.fs.exists(meta.filePath);
      if (!exists) {
        await AsyncStorage.removeItem(LOGO_META_KEY);
        return null;
      }
      return meta;
    } catch {
      return null;
    }
  },

  getDisplayUri(logo: StoredReceiptLogo): string {
    return logo.filePath.startsWith('file://') ? logo.filePath : `file://${logo.filePath}`;
  },

  async saveFromUri(sourceUri: string): Promise<StoredReceiptLogo> {
    const dest = logoFilePath();
    const normalizedSource = sourceUri.startsWith('file://')
      ? sourceUri
      : sourceUri.startsWith('content://') || sourceUri.startsWith('ph://')
        ? sourceUri
        : `file://${sourceUri}`;

    if (await RNBlobUtil.fs.exists(dest)) {
      await RNBlobUtil.fs.unlink(dest);
    }

    await RNBlobUtil.fs.cp(normalizedSource, dest);

    const meta: StoredReceiptLogo = {
      filePath: dest,
      updatedAt: new Date().toISOString(),
    };
    await AsyncStorage.setItem(LOGO_META_KEY, JSON.stringify(meta));
    return meta;
  },

  async clear(): Promise<void> {
    const existing = await this.get();
    if (existing) {
      try {
        await RNBlobUtil.fs.unlink(existing.filePath);
      } catch {
        /* ignore */
      }
    }
    await AsyncStorage.removeItem(LOGO_META_KEY);
  },
};
