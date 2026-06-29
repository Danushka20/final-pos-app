import AsyncStorage from '@react-native-async-storage/async-storage';

const DEVICE_ID_KEY = '@pos/device_id';
const PERMISSIONS_SETUP_KEY = '@pos/permissions_setup_completed';

export const deviceIdStorage = {
  async getOrCreateDeviceId(): Promise<string> {
    const existing = await AsyncStorage.getItem(DEVICE_ID_KEY);
    if (existing) {
      return existing;
    }
    const id = `pos-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
    await AsyncStorage.setItem(DEVICE_ID_KEY, id);
    return id;
  },

  async isPermissionsSetupCompleted(): Promise<boolean> {
    return (await AsyncStorage.getItem(PERMISSIONS_SETUP_KEY)) === 'true';
  },

  async setPermissionsSetupCompleted(completed: boolean): Promise<void> {
    await AsyncStorage.setItem(PERMISSIONS_SETUP_KEY, completed ? 'true' : 'false');
  },
};
