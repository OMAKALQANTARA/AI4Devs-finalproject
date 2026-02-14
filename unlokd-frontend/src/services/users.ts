import { apiRequest, API_BASE_URL } from './api';
import { getValidAuthToken } from '../utils/auth';

export type UserProfile = {
  id: number;
  email: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  presenceStatus: string | null;
};

export type UpdateProfilePayload = {
  displayName?: string;
  presenceStatus?: string;
};

const getAuthHeaders = (): HeadersInit => {
  const token = getValidAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export async function getMyProfile() {
  return apiRequest<UserProfile>('/api/v1/users/me', {
    method: 'GET',
    headers: getAuthHeaders(),
  });
}

export async function updateMyProfile(payload: UpdateProfilePayload) {
  return apiRequest<UserProfile>('/api/v1/users/me', {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
}

export async function uploadAvatar(file: File) {
  const token = getValidAuthToken();
  const formData = new FormData();
  formData.append('file', file);

  const headers: HeadersInit | undefined = token
    ? { Authorization: `Bearer ${token}` }
    : undefined;

  const response = await fetch(`${API_BASE_URL}/api/v1/users/me/avatar`, {
    method: 'PUT',
    headers,
    body: formData,
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    throw new Error(errorBody?.message ?? 'Request failed');
  }

  return (await response.json()) as UserProfile;
}
