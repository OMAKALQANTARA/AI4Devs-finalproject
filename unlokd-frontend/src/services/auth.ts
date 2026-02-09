import { apiRequest } from './api';

export type RegisterPayload = {
  fullName: string;
  email: string;
  password: string;
  passwordConfirm: string;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type AuthResponse = {
  token?: string;
  accessToken?: string;
  userId?: string;
  username?: string;
  email?: string;
  message?: string;
};

export async function registerUser(payload: RegisterPayload) {
  return apiRequest<AuthResponse>('/api/v1/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function loginUser(payload: LoginPayload) {
  return apiRequest<AuthResponse>('/api/v1/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
