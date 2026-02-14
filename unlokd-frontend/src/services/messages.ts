import { apiRequest } from './api';

export type Message = {
  id: number;
  chatId: number;
  senderId: number;
  contentType: 'TEXT';
  contentText: string | null;
  visibilityType: 'PLAIN';
  status: 'UNLOCKED' | 'PENDING';
  createdAt: string;
};

export type MessagesResponse = {
  messages: Message[];
  nextCursor: number | null;
};

const getAuthHeaders = (): HeadersInit => {
  const token = localStorage.getItem('authToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export async function sendMessage(payload: {
  chatId: number;
  contentText: string;
}) {
  return apiRequest<Message>('/api/v1/messages', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({
      chatId: payload.chatId,
      contentType: 'TEXT',
      contentText: payload.contentText,
      visibilityType: 'PLAIN',
    }),
  });
}

export async function getChatMessages(chatId: number, before?: number, limit = 20) {
  const params = new URLSearchParams();
  if (before) params.set('before', before.toString());
  params.set('limit', limit.toString());

  return apiRequest<MessagesResponse>(`/api/v1/chats/${chatId}/messages?${params}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });
}
