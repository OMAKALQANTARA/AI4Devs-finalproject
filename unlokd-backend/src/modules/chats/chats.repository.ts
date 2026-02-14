import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';

type DbChat = {
  id: number;
  public_id: string;
  type: 'DIRECT' | 'GROUP';
  title: string | null;
  created_by: number;
  created_at: Date;
  peer_display_name?: string | null;
  peer_user_id?: number | null;
};

type DbChatMember = {
  user_id: number;
  role: 'OWNER' | 'MEMBER';
  display_name: string;
  presence_status: string | null;
  avatar_url: string | null;
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

  async deleteDirectChatBetweenUsers(userA: number, userB: number) {
    const chat = await this.findDirectChatBetweenUsers(userA, userB);
    if (!chat) {
      return;
    }
    await this.deleteChatById(chat.id);
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
      SELECT c.id,
             c.public_id,
             c.type,
             c.title,
             c.created_by,
             c.created_at,
             direct_peer.display_name AS peer_display_name,
             direct_peer.user_id AS peer_user_id
      FROM chats c
      JOIN chat_members m ON m.chat_id = c.id AND m.user_id = ${userId}
      LEFT JOIN (
        SELECT cm.chat_id, cm.user_id, u.display_name
        FROM chat_members cm
        JOIN users u ON u.id = cm.user_id
        WHERE cm.user_id <> ${userId}
      ) AS direct_peer ON direct_peer.chat_id = c.id AND c.type = 'DIRECT'
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
      SELECT m.user_id, m.role, u.display_name, u.presence_status, u.avatar_url
      FROM chat_members m
      JOIN users u ON u.id = m.user_id
      WHERE m.chat_id = ${chatId}
    `;
  }

  async deleteChatById(chatId: number) {
    await this.prismaService.$executeRaw`
      DELETE FROM chats WHERE id = ${chatId}
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
