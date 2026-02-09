import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { ChatsRepository } from './chats.repository';
import { ChatDto } from './dto/chat.dto';

@Injectable()
export class ChatsService {
  constructor(private readonly chatsRepository: ChatsRepository) {}

  async createDirectChat(creatorId: number, contactId: number): Promise<ChatDto> {
    const existing = await this.chatsRepository.findDirectChatBetweenUsers(
      creatorId,
      contactId,
    );
    if (existing) {
      return this.mapChat(existing);
    }

    const publicId = randomUUID();
    const chat = await this.chatsRepository.createDirectChat(publicId, creatorId);

    await this.chatsRepository.addMember(chat.id, creatorId, 'OWNER');
    await this.chatsRepository.addMember(chat.id, contactId, 'MEMBER');

    return this.mapChat(chat);
  }

  async getChatsByUserId(userId: number): Promise<ChatDto[]> {
    const chats = await this.chatsRepository.getChatsByUserId(userId);
    return chats.map((chat) => this.mapChat(chat));
  }

  async getChatDetails(chatId: number, userId: number): Promise<ChatDto> {
    const isMember = await this.chatsRepository.isMember(chatId, userId);
    if (!isMember) {
      throw new ForbiddenException('No tienes acceso a este chat');
    }

    const chat = await this.chatsRepository.getChatDetailsById(chatId);
    if (!chat) {
      throw new NotFoundException('Chat no encontrado');
    }

    const members = await this.chatsRepository.getMembers(chatId);
    return {
      ...this.mapChat(chat),
      members: members.map((member) => ({
        userId: Number(member.user_id),
        role: member.role,
      })),
    };
  }

  private mapChat(chat: {
    id: number;
    public_id: string;
    type: 'DIRECT';
    title: string | null;
    created_by: number;
    created_at: Date;
  }): ChatDto {
    return {
      id: Number(chat.id),
      publicId: chat.public_id,
      type: chat.type,
      title: chat.title,
      createdBy: Number(chat.created_by),
      createdAt: chat.created_at.toISOString(),
    };
  }
}
