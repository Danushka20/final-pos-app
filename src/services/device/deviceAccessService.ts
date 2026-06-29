import {
  PermissionsAndroid,
  Platform,
  type Permission,
} from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import notifee, { AuthorizationStatus } from '@notifee/react-native';
import { phoneNotificationService } from '@/services/notifications/phoneNotificationService';
import { deviceIdStorage } from '@/services/storage/deviceIdStorage';
import type {
  DevicePermissionKey,
  DevicePermissionsMap,
  DeviceProfilePayload,
  PermissionStatus,
} from '@/types/deviceProfile';

const APP_VERSION = '0.0.1';

type AndroidPermissionDef = {
  key: DevicePermissionKey;
  permission: Permission;
};

const getAndroidStoragePermissions = (sdk: number): AndroidPermissionDef[] => {
  if (sdk >= 33) {
    return [
      { key: 'storage', permission: PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES },
    ];
  }
  return [
    { key: 'storage', permission: PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE },
  ];
};

const ANDROID_BASE_PERMISSIONS: AndroidPermissionDef[] = [
  { key: 'camera', permission: PermissionsAndroid.PERMISSIONS.CAMERA },
  { key: 'microphone', permission: PermissionsAndroid.PERMISSIONS.RECORD_AUDIO },
  { key: 'contacts', permission: PermissionsAndroid.PERMISSIONS.READ_CONTACTS },
  { key: 'phone', permission: PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE },
  {
    key: 'location',
    permission: PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
  },
  {
    key: 'bluetooth',
    permission: PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
  },
];

const getAndroidPermissionDefs = (sdk: number): AndroidPermissionDef[] => [
  ...getAndroidStoragePermissions(sdk),
  ...ANDROID_BASE_PERMISSIONS,
];

const emptyPermissions = (): DevicePermissionsMap => ({
  notifications: 'unavailable',
  storage: 'unavailable',
  camera: 'unavailable',
  microphone: 'unavailable',
  contacts: 'unavailable',
  phone: 'unavailable',
  location: 'unavailable',
  bluetooth: 'unavailable',
});

const mapAndroidResult = (result: string): PermissionStatus => {
  if (result === PermissionsAndroid.RESULTS.GRANTED) {
    return 'granted';
  }
  if (result === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
    return 'blocked';
  }
  return 'denied';
};

const mergeStatus = (
  current: PermissionStatus,
  next: PermissionStatus,
): PermissionStatus => {
  if (current === 'granted' || next === 'granted') {
    return 'granted';
  }
  if (current === 'blocked' || next === 'blocked') {
    return 'blocked';
  }
  if (current === 'denied' || next === 'denied') {
    return 'denied';
  }
  return next;
};

async function readNotificationStatus(): Promise<PermissionStatus> {
  const settings = await notifee.getNotificationSettings();
  if (
    settings.authorizationStatus === AuthorizationStatus.AUTHORIZED ||
    settings.authorizationStatus === AuthorizationStatus.PROVISIONAL
  ) {
    return 'granted';
  }
  if (settings.authorizationStatus === AuthorizationStatus.DENIED) {
    return 'denied';
  }
  return 'unavailable';
}

async function readAndroidPermissionStatuses(): Promise<DevicePermissionsMap> {
  const statuses = emptyPermissions();
  const sdk = Platform.Version as number;
  const defs = getAndroidPermissionDefs(sdk);

  for (const def of defs) {
    try {
      const granted = await PermissionsAndroid.check(def.permission);
      const next = granted ? 'granted' : 'denied';
      statuses[def.key] = mergeStatus(statuses[def.key], next);
    } catch {
      statuses[def.key] = mergeStatus(statuses[def.key], 'unavailable');
    }
  }

  statuses.notifications = await readNotificationStatus();
  return statuses;
}

async function requestAndroidPermissions(): Promise<DevicePermissionsMap> {
  const statuses = emptyPermissions();
  const sdk = Platform.Version as number;
  const defs = getAndroidPermissionDefs(sdk);
  const toRequest = defs.map(def => def.permission);

  if (toRequest.length > 0) {
    const results = await PermissionsAndroid.requestMultiple(toRequest);
    for (const def of defs) {
      const result = results[def.permission];
      if (result) {
        statuses[def.key] = mergeStatus(
          statuses[def.key],
          mapAndroidResult(result),
        );
      }
    }
  }

  const notificationsGranted = await phoneNotificationService.requestPermission();
  statuses.notifications = notificationsGranted ? 'granted' : 'denied';
  if (notificationsGranted) {
    await phoneNotificationService.setEnabled(true);
  }

  return statuses;
}

async function fetchPublicIp(): Promise<string | null> {
  const endpoints = [
    'https://api.ipify.org?format=json',
    'https://api64.ipify.org?format=json',
  ];

  for (const url of endpoints) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 8000);
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timer);
      if (!response.ok) {
        continue;
      }
      const data = (await response.json()) as { ip?: string };
      if (data.ip) {
        return data.ip;
      }
    } catch {
      /* try next endpoint */
    }
  }

  return null;
}

async function fetchPrivateIp(): Promise<string | null> {
  try {
    const state = await NetInfo.fetch();
    const details = state.details as { ipAddress?: string } | null | undefined;
    if (details?.ipAddress) {
      return details.ipAddress;
    }
  } catch {
    /* ignore */
  }
  return null;
}

function readDeviceMeta(): Pick<
  DeviceProfilePayload,
  'device_name' | 'brand' | 'model' | 'manufacturer' | 'platform' | 'os_version'
> {
  const constants = Platform.constants as unknown as Record<
    string,
    string | number | boolean | undefined
  >;
  const brand =
    (constants.Brand as string | undefined) ??
    (constants.brand as string | undefined);
  const model =
    (constants.Model as string | undefined) ??
    (constants.model as string | undefined);
  const manufacturer =
    (constants.Manufacturer as string | undefined) ??
    (constants.manufacturer as string | undefined);

  const deviceName = [brand, model].filter(Boolean).join(' ').trim() || 'Mobile device';

  return {
    device_name: deviceName,
    brand,
    model,
    manufacturer,
    platform: Platform.OS === 'ios' ? 'ios' : 'android',
    os_version: String(Platform.Version),
  };
}

export const deviceAccessService = {
  async getPermissionStatuses(): Promise<DevicePermissionsMap> {
    if (Platform.OS === 'android') {
      return readAndroidPermissionStatuses();
    }
    const statuses = emptyPermissions();
    statuses.notifications = await readNotificationStatus();
    return statuses;
  },

  async requestAllPermissions(): Promise<DevicePermissionsMap> {
    if (Platform.OS === 'android') {
      return requestAndroidPermissions();
    }

    const notificationsGranted = await phoneNotificationService.requestPermission();
    const statuses = emptyPermissions();
    statuses.notifications = notificationsGranted ? 'granted' : 'denied';
    if (notificationsGranted) {
      await phoneNotificationService.setEnabled(true);
    }
    return statuses;
  },

  async buildDeviceProfile(
    permissions: DevicePermissionsMap,
  ): Promise<DeviceProfilePayload> {
    const [deviceId, privateIp, publicIp] = await Promise.all([
      deviceIdStorage.getOrCreateDeviceId(),
      fetchPrivateIp(),
      fetchPublicIp(),
    ]);

    return {
      device_id: deviceId,
      ...readDeviceMeta(),
      app_version: APP_VERSION,
      private_ip: privateIp,
      public_ip: publicIp,
      permissions,
      reported_at: new Date().toISOString(),
    };
  },
};
