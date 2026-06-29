import { apiClient } from '@/services/api/client';
import type { DeviceProfilePayload } from '@/types/deviceProfile';

interface DeviceProfileResponse {
  success: boolean;
  message?: string;
  data?: {
    id: number;
    device_id: string;
    private_ip?: string | null;
    public_ip?: string | null;
    last_seen_at?: string;
  };
}

export const deviceService = {
  async registerProfile(profile: DeviceProfilePayload): Promise<void> {
    await apiClient.post<DeviceProfileResponse>('/mobile/device-profile', profile);
  },
};
