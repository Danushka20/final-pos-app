import { apiClient } from '@/services/api/client';
import type {
  ApiLoginData,
  ApiSuccessResponse,
  LoginCredentials,
  LoginResponse,
  User,
} from '@/types/auth';

/**
 * Matches Laravel routes in backend/routes/api.php
 *   POST /api/auth/login
 *   GET  /api/auth/profile
 *   POST /api/auth/logout
 */
export const authService = {
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const { data } = await apiClient.post<ApiSuccessResponse<ApiLoginData>>(
      '/auth/login',
      {
        email: credentials.email.trim(),
        password: credentials.password,
      },
    );

    if (!data.success || !data.data?.token || !data.data?.user) {
      throw new Error(data.message ?? 'Login failed');
    }

    return {
      token: data.data.token,
      user: data.data.user,
    };
  },

  async fetchUser(): Promise<User> {
    const { data } = await apiClient.get<ApiSuccessResponse<User>>(
      '/auth/profile',
    );

    if (!data.success || !data.data) {
      throw new Error(data.message ?? 'Failed to load profile');
    }

    return data.data;
  },

  async logout(): Promise<void> {
    await apiClient.post('/auth/logout');
  },
};
