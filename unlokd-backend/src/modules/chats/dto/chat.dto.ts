import { ChatMemberDto } from './chat-member.dto';

export type ChatDto = {
  id: number;
  publicId: string;
  type: 'DIRECT';
  title: string | null;
  createdBy: number;
  createdAt: string;
  members?: ChatMemberDto[];
};
