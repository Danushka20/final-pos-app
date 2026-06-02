import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { getApiBaseUrl } from '@/config/env';
import { tokenStorage } from '@/services/storage/tokenStorage';
import type { ApiErrorResponse } from '@/types/auth';

export const apiClient = axios.create({
  timeout: 30000,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const baseURL = getApiBaseUrl();
    if (!baseURL) {
      return Promise.reject(
        new Error(
          'Server not configured. Open the app setup screen and enter your website URL.',
        ),
      );
    }
    config.baseURL = baseURL;

    const token = await tokenStorage.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error),
);

apiClient.interceptors.response.use(
  response => response,
  (error: AxiosError<ApiErrorResponse>) => {
    if (!error.response) {
      const url = getApiBaseUrl() || 'not configured';
      return Promise.reject(
        new Error(
          `Cannot reach server at ${url}\n\n` +
            '1. Open Server setup and enter your website URL\n' +
            '2. Laravel API must be at: your-site.com/api\n' +
            '3. Same Wi‑Fi on phone & PC (for local IP)\n' +
            '4. Run: php artisan serve --host=0.0.0.0 --port=8000',
        ),
      );
    }

    const message =
      error.response?.data?.message ??
      error.response?.data?.errors?.email?.[0] ??
      error.message ??
      'Network request failed';

    return Promise.reject(new Error(message));
  },
);
