import { ChatMemberDto } from './chat-member.dto';

export type ChatDto = {
  id: number;
  publicId: string;
  type: 'DIRECT' | 'GROUP';
  title: string | null;
  peerDisplayName?: string | null;
  createdBy: number;
  createdAt: string;
  members?: ChatMemberDto[];
};
