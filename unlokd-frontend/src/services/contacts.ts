import { apiRequest } from './api';
import { getValidAuthToken } from '../utils/auth';

export type Contact = {
  id: number;
  contactUserId: number;
  alias: string | null;
  email: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  presenceStatus: string | null;
};

type CreateContactPayload = {
  email: string;
};

const getAuthHeaders = (): HeadersInit => {
  const token = getValidAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export async function listContacts() {
  return apiRequest<Contact[]>('/api/v1/contacts', {
    method: 'GET',
    headers: getAuthHeaders(),
  });
}

export async function addContactByEmail(payload: CreateContactPayload) {
  return apiRequest<Contact>('/api/v1/contacts', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
}

export async function deleteContact(contactUserId: number) {
  return apiRequest<{ success: boolean }>(`/api/v1/contacts/${contactUserId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
}
