import { apiClient } from '@/services/api/client';
import type { ApiSuccessResponse } from '@/types/auth';
import type {
  CompanySettings,
  PosMobileSettings,
  PrintHeaderSettings,
} from '@/types/settings';

async function getSetting<T>(path: string): Promise<T> {
  const { data } = await apiClient.get<ApiSuccessResponse<T>>(path);
  if (!data.success) {
    throw new Error(data.message ?? `Failed to load ${path}`);
  }
  return data.data as T;
}

async function putSetting<T>(path: string, body: Record<string, unknown>): Promise<T> {
  const { data } = await apiClient.put<ApiSuccessResponse<T>>(path, body);
  if (!data.success) {
    throw new Error(data.message ?? `Failed to save ${path}`);
  }
  return data.data as T;
}

export const settingsService = {
  async loadAll(): Promise<PosMobileSettings> {
    const [
      company,
      printHeader,
      inventory,
      item,
      order,
      hardware,
      employee,
      alert,
      notifications,
    ] = await Promise.all([
      getSetting<CompanySettings>('/settings/company'),
      getSetting<PrintHeaderSettings>('/settings/company/print-header'),
      getSetting<Record<string, unknown>>('/settings/inventory'),
      getSetting<Record<string, unknown>>('/settings/item'),
      getSetting<Record<string, unknown>>('/settings/order'),
      getSetting<Record<string, unknown>>('/settings/hardware'),
      getSetting<Record<string, unknown>>('/settings/employee'),
      getSetting<Record<string, unknown>>('/settings/alert'),
      getSetting<Record<string, unknown>>('/settings/notifications'),
    ]);

    return {
      company,
      printHeader,
      inventory,
      item,
      order,
      hardware,
      employee,
      alert,
      notifications,
    };
  },

  updateCompany: (body: Record<string, unknown>) =>
    putSetting<CompanySettings>('/settings/company', body),

  updateInventory: (body: Record<string, unknown>) =>
    putSetting<Record<string, unknown>>('/settings/inventory', body),

  updateOrder: (body: Record<string, unknown>) =>
    putSetting<Record<string, unknown>>('/settings/order', body),

  getUserSettings: () => getSetting<Record<string, unknown>>('/settings/user'),

  updateUserSettings: (body: Record<string, unknown>) =>
    putSetting<Record<string, unknown>>('/settings/user', body),
};
