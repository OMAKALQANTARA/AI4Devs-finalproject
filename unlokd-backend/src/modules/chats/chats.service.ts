import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { ChatsRepository } from './chats.repository';
import { ChatDto } from './dto/chat.dto';
import { UsersRepository } from '../users/users.repository';

@Injectable()
export class ChatsService {
  constructor(
    private readonly chatsRepository: ChatsRepository,
    private readonly usersRepository: UsersRepository,
  ) {}

  async createDirectChat(creatorId: number, contactId: number): Promise<ChatDto> {
    const existing = await this.chatsRepository.findDirectChatBetweenUsers(
      creatorId,
      contactId,
    );
    if (existing) {
      const contactProfile = await this.usersRepository.findProfileById(contactId);
      return this.mapChat(existing, contactProfile?.displayName ?? null);
    }

    const publicId = randomUUID();
    const chat = await this.chatsRepository.createDirectChat(publicId, creatorId);

    await this.chatsRepository.addMember(chat.id, creatorId, 'OWNER');
    await this.chatsRepository.addMember(chat.id, contactId, 'MEMBER');

    const contactProfile = await this.usersRepository.findProfileById(contactId);
    return this.mapChat(chat, contactProfile?.displayName ?? null);
  }

  async getChatsByUserId(userId: number): Promise<ChatDto[]> {
    const chats = await this.chatsRepository.getChatsByUserId(userId);
    return chats.map((chat) => this.mapChat(chat, chat.peer_display_name ?? null));
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
    const directTitle =
      chat.type === 'DIRECT'
        ? members.find((member) => Number(member.user_id) !== userId)
            ?.display_name ?? null
        : chat.title;
    return {
      ...this.mapChat(chat, directTitle),
      members: members.map((member) => ({
        userId: Number(member.user_id),
        role: member.role,
        displayName: member.display_name,
        presenceStatus: member.presence_status,
        avatarUrl: member.avatar_url,
      })),
    };
  }

  async deleteChat(chatId: number, userId: number) {
    const isMember = await this.chatsRepository.isMember(chatId, userId);
    if (!isMember) {
      throw new ForbiddenException('No tienes acceso a este chat');
    }

    await this.chatsRepository.deleteChatById(chatId);
  }

  private mapChat(chat: {
    id: number;
    public_id: string;
    type: 'DIRECT' | 'GROUP';
    title: string | null;
    created_by: number;
    created_at: Date;
  }, directTitle: string | null = null): ChatDto {
    return {
      id: Number(chat.id),
      publicId: chat.public_id,
      type: chat.type,
      title: chat.type === 'DIRECT' ? null : chat.title,
      peerDisplayName: chat.type === 'DIRECT' ? directTitle : null,
      createdBy: Number(chat.created_by),
      createdAt: chat.created_at.toISOString(),
    };
  }
}
