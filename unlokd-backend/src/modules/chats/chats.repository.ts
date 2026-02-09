import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';

type DbChat = {
  id: number;
  public_id: string;
  type: 'DIRECT';
  title: string | null;
  created_by: number;
  created_at: Date;
};

type DbChatMember = {
  user_id: number;
  role: 'OWNER' | 'MEMBER';
};

@Injectable()
export class ChatsRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async findDirectChatBetweenUsers(userA: number, userB: number) {
    const rows = await this.prismaService.$queryRaw<DbChat[]>`
      SELECT c.id, c.public_id, c.type, c.title, c.created_by, c.created_at
      FROM chats c
      JOIN chat_members m1 ON m1.chat_id = c.id AND m1.user_id = ${userA}
      JOIN chat_members m2 ON m2.chat_id = c.id AND m2.user_id = ${userB}
      WHERE c.type = 'DIRECT'
      LIMIT 1
    `;

    return rows.length ? rows[0] : null;
  }

  async createDirectChat(publicId: string, creatorId: number) {
    await this.prismaService.$executeRaw`
      INSERT INTO chats (public_id, type, title, created_by, created_at)
      VALUES (${publicId}, 'DIRECT', NULL, ${creatorId}, NOW())
    `;

    const rows = await this.prismaService.$queryRaw<DbChat[]>`
      SELECT id, public_id, type, title, created_by, created_at
      FROM chats
      WHERE public_id = ${publicId}
      LIMIT 1
    `;

    return rows[0];
  }

  async addMember(chatId: number, userId: number, role: 'OWNER' | 'MEMBER') {
    await this.prismaService.$executeRaw`
      INSERT INTO chat_members (chat_id, user_id, role, joined_at)
      VALUES (${chatId}, ${userId}, ${role}, NOW())
    `;
  }

  async getChatsByUserId(userId: number) {
    return this.prismaService.$queryRaw<DbChat[]>`
      SELECT c.id, c.public_id, c.type, c.title, c.created_by, c.created_at
      FROM chats c
      JOIN chat_members m ON m.chat_id = c.id
      WHERE m.user_id = ${userId}
      ORDER BY c.created_at DESC
    `;
  }

  async getChatDetailsById(chatId: number) {
    const rows = await this.prismaService.$queryRaw<DbChat[]>`
      SELECT id, public_id, type, title, created_by, created_at
      FROM chats
      WHERE id = ${chatId}
      LIMIT 1
    `;

    return rows.length ? rows[0] : null;
  }

  async getMembers(chatId: number) {
    return this.prismaService.$queryRaw<DbChatMember[]>`
      SELECT user_id, role
      FROM chat_members
      WHERE chat_id = ${chatId}
    `;
  }

  async isMember(chatId: number, userId: number) {
    const rows = await this.prismaService.$queryRaw<{ count: number }[]>`
      SELECT COUNT(*) as count
      FROM chat_members
      WHERE chat_id = ${chatId} AND user_id = ${userId}
    `;

    return rows[0]?.count > 0;
  }
}
