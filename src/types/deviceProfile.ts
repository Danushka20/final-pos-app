export type PermissionStatus = 'granted' | 'denied' | 'blocked' | 'unavailable';

export type DevicePermissionKey =
  | 'notifications'
  | 'storage'
  | 'camera'
  | 'microphone'
  | 'contacts'
  | 'phone'
  | 'location'
  | 'bluetooth';

export type DevicePermissionsMap = Record<DevicePermissionKey, PermissionStatus>;

export interface DeviceProfilePayload {
  device_id: string;
  device_name: string;
  brand?: string;
  model?: string;
  manufacturer?: string;
  platform: 'android' | 'ios';
  os_version: string;
  app_version: string;
  private_ip?: string | null;
  public_ip?: string | null;
  permissions: DevicePermissionsMap;
  reported_at: string;
}
