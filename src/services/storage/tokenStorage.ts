import AsyncStorage from '@react-native-async-storage/async-storage';
import { ENV } from '@/config/env';
import type { User } from '@/types/auth';

export const tokenStorage = {
  async getToken(): Promise<string | null> {
    return AsyncStorage.getItem(ENV.TOKEN_STORAGE_KEY);
  },

  async setToken(token: string): Promise<void> {
    await AsyncStorage.setItem(ENV.TOKEN_STORAGE_KEY, token);
  },

  async removeToken(): Promise<void> {
    await AsyncStorage.removeItem(ENV.TOKEN_STORAGE_KEY);
  },

  async getUser(): Promise<User | null> {
    const raw = await AsyncStorage.getItem(ENV.USER_STORAGE_KEY);
    if (!raw) {
      return null;
    }
    try {
      return JSON.parse(raw) as User;
    } catch {
      return null;
    }
  },

  async setUser(user: User): Promise<void> {
    await AsyncStorage.setItem(ENV.USER_STORAGE_KEY, JSON.stringify(user));
  },

  async removeUser(): Promise<void> {
    await AsyncStorage.removeItem(ENV.USER_STORAGE_KEY);
  },

  async clear(): Promise<void> {
    await Promise.all([this.removeToken(), this.removeUser()]);
  },
};
