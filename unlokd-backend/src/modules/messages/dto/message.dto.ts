import { MessageContentType, MessageVisibilityType } from './create-message.dto';

export type MessageDto = {
  id: number;
  chatId: number;
  senderId: number;
  contentType: MessageContentType;
  contentText: string | null;
  visibilityType: MessageVisibilityType;
  status: 'UNLOCKED' | 'PENDING';
  createdAt: string;
};
