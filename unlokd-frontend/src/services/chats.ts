import { API_BASE_URL, apiRequest } from './api';
import { getValidAuthToken } from '../utils/auth';

export type ChatMember = {
  userId: number;
  role: 'OWNER' | 'MEMBER';
  displayName: string;
  presenceStatus: string | null;
  avatarUrl: string | null;
};

export type Chat = {
  id: number;
  publicId: string;
  type: 'DIRECT' | 'GROUP';
  title: string | null;
  peerDisplayName?: string | null;
  createdBy: number;
  createdAt: string;
  members?: ChatMember[];
};

const getAuthHeaders = (): HeadersInit => {
  const token = getValidAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export async function listChats() {
  return apiRequest<Chat[]>('/api/v1/chats', {
    method: 'GET',
    headers: getAuthHeaders(),
  });
}

export async function createDirectChat(contactId: number) {
  return apiRequest<Chat>('/api/v1/chats', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ contactId }),
  });
}

export async function getChatDetails(chatId: number) {
  return apiRequest<Chat>(`/api/v1/chats/${chatId}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });
}

export async function deleteChat(chatId: number) {
  return apiRequest<{ success: boolean }>(`/api/v1/chats/${chatId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
}

export async function getAvatarUrl(path: string | null) {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${API_BASE_URL}${path}`;
}
