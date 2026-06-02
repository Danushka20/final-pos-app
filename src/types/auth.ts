export interface User {
  id: number;
  name: string;
  email: string;
  email_verified_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

/** Laravel API wrapper: { success, message, data } */
export interface ApiSuccessResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export interface ApiLoginData {
  user: User;
  token: string;
  subscription?: unknown;
}

export interface ApiErrorResponse {
  success?: boolean;
  message?: string;
  errors?: Record<string, string[]>;
}
