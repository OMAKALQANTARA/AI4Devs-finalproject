import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import {
  MessageContentType,
  MessageVisibilityType,
} from './dto/create-message.dto';

type DbMessage = {
  id: number;
  chat_id: number;
  sender_id: number;
  content_type: MessageContentType;
  content_text: string | null;
  visibility_type: MessageVisibilityType;
  status: 'UNLOCKED' | 'PENDING';
  created_at: Date;
};

@Injectable()
export class MessagesRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async isChatMember(chatId: number, userId: number) {
    const rows = await this.prismaService.$queryRaw<{ count: number }[]>`
      SELECT COUNT(*) as count
      FROM chat_members
      WHERE chat_id = ${chatId} AND user_id = ${userId}
    `;
    return rows[0]?.count > 0;
  }

  async createMessage(payload: {
    chatId: number;
    senderId: number;
    contentType: MessageContentType;
    contentText: string;
    visibilityType: MessageVisibilityType;
  }) {
    await this.prismaService.$executeRaw`
      INSERT INTO messages (chat_id, sender_id, content_type, content_text, visibility_type, status, created_at, updated_at)
      VALUES (${payload.chatId}, ${payload.senderId}, ${payload.contentType}, ${payload.contentText}, ${payload.visibilityType}, 'UNLOCKED', NOW(), NOW())
    `;

    const rows = await this.prismaService.$queryRaw<DbMessage[]>`
      SELECT id, chat_id, sender_id, content_type, content_text, visibility_type, status, created_at
      FROM messages
      WHERE chat_id = ${payload.chatId} AND sender_id = ${payload.senderId}
      ORDER BY id DESC
      LIMIT 1
    `;

    return rows[0];
  }

  async getMessages(chatId: number, before: number | null, limit: number) {
    if (before !== null) {
      return this.prismaService.$queryRaw<DbMessage[]>`
        SELECT id, chat_id, sender_id, content_type, content_text, visibility_type, status, created_at
        FROM messages
        WHERE chat_id = ${chatId} AND id < ${before}
        ORDER BY id DESC
        LIMIT ${limit}
      `;
    }

    return this.prismaService.$queryRaw<DbMessage[]>`
      SELECT id, chat_id, sender_id, content_type, content_text, visibility_type, status, created_at
      FROM messages
      WHERE chat_id = ${chatId}
      ORDER BY id DESC
      LIMIT ${limit}
    `;
  }

  async updateLastReadAt(chatId: number, userId: number) {
    await this.prismaService.$executeRaw`
      UPDATE chat_members
      SET last_read_at = NOW()
      WHERE chat_id = ${chatId} AND user_id = ${userId}
    `;
  }
}
