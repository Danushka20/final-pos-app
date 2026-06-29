import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useAppAlerts } from '@/context/AppAlertContext';
import { AppPermissionsModal } from '@/components/common/AppPermissionsModal';
import { deviceAccessService } from '@/services/device/deviceAccessService';
import { deviceService } from '@/services/api/deviceService';
import { phoneNotificationService } from '@/services/notifications/phoneNotificationService';
import { deviceIdStorage } from '@/services/storage/deviceIdStorage';
import type { DevicePermissionsMap } from '@/types/deviceProfile';

/**
 * After login:
 * - First time only: show phone permission access sheet
 * - Later launches: sync device profile quietly (no repeat prompts)
 */
export function AppStartupSetup(): React.ReactElement | null {
  const { isAuthenticated } = useAuth();
  const { syncPhoneNotifications } = useAppAlerts();
  const [showModal, setShowModal] = useState(false);
  const [busy, setBusy] = useState(false);
  const [permissions, setPermissions] = useState<DevicePermissionsMap | null>(null);
  const startedRef = useRef(false);
  const syncedProfileRef = useRef(false);

  const sendDeviceProfile = useCallback(async (map: DevicePermissionsMap) => {
    if (syncedProfileRef.current) {
      return;
    }
    try {
      const profile = await deviceAccessService.buildDeviceProfile(map);
      await deviceService.registerProfile(profile);
      syncedProfileRef.current = true;
    } catch {
      /* server may not have endpoint yet; keep app usable */
    }
  }, []);

  const finishStartup = useCallback(
    async (map: DevicePermissionsMap) => {
      await sendDeviceProfile(map);
      await phoneNotificationService.setEnabled(true);
      await syncPhoneNotifications();
      await deviceIdStorage.setPermissionsSetupCompleted(true);
      setShowModal(false);
    },
    [sendDeviceProfile, syncPhoneNotifications],
  );

  const runAllowAll = useCallback(async () => {
    setBusy(true);
    try {
      const map = await deviceAccessService.requestAllPermissions();
      setPermissions(map);
      await finishStartup(map);
    } finally {
      setBusy(false);
    }
  }, [finishStartup]);

  const runContinue = useCallback(async () => {
    setBusy(true);
    try {
      const map = permissions ?? (await deviceAccessService.getPermissionStatuses());
      setPermissions(map);
      await finishStartup(map);
    } finally {
      setBusy(false);
    }
  }, [finishStartup, permissions]);

  useEffect(() => {
    if (!isAuthenticated || startedRef.current) {
      return;
    }
    startedRef.current = true;

    (async () => {
      const map = await deviceAccessService.getPermissionStatuses();
      setPermissions(map);

      const setupDone = await deviceIdStorage.isPermissionsSetupCompleted();

      if (map.notifications === 'granted') {
        await phoneNotificationService.setEnabled(true);
        await syncPhoneNotifications();
      }

      await sendDeviceProfile(map);

      if (setupDone) {
        return;
      }

      setShowModal(true);
    })();
  }, [isAuthenticated, sendDeviceProfile, syncPhoneNotifications]);

  useEffect(() => {
    if (!isAuthenticated || !showModal) {
      return;
    }
    deviceAccessService.getPermissionStatuses().then(setPermissions).catch(() => {});
  }, [isAuthenticated, showModal]);

  return (
    <AppPermissionsModal
      visible={showModal}
      busy={busy}
      permissions={permissions}
      onAllow={runAllowAll}
      onContinue={runContinue}
    />
  );
}
