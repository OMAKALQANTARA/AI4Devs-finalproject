import { ForbiddenException, Injectable } from '@nestjs/common';
import { MessagesRepository } from './messages.repository';
import {
  CreateMessageDto,
  MessageContentType,
  MessageVisibilityType,
} from './dto/create-message.dto';
import { MessageDto } from './dto/message.dto';
import { RealtimeGateway } from '../realtime/realtime.gateway';

@Injectable()
export class MessagesService {
  constructor(
    private readonly messagesRepository: MessagesRepository,
    private readonly realtimeGateway: RealtimeGateway,
  ) {}

  async createMessage(userId: number, payload: CreateMessageDto): Promise<MessageDto> {
    const isMember = await this.messagesRepository.isChatMember(
      payload.chatId,
      userId,
    );
    if (!isMember) {
      throw new ForbiddenException('No tienes acceso a este chat');
    }

    const created = await this.messagesRepository.createMessage({
      chatId: payload.chatId,
      senderId: userId,
      contentType: MessageContentType.TEXT,
      contentText: payload.contentText,
      visibilityType: MessageVisibilityType.PLAIN,
    });

    const message = this.mapMessage(created);
    await this.realtimeGateway.emitNewMessage(message);
    return message;
  }

  async getChatMessages(
    chatId: number,
    userId: number,
    before: number | null,
    limit: number,
  ): Promise<{ messages: MessageDto[]; nextCursor: number | null }> {
    const isMember = await this.messagesRepository.isChatMember(chatId, userId);
    if (!isMember) {
      throw new ForbiddenException('No tienes acceso a este chat');
    }

    const rows = await this.messagesRepository.getMessages(chatId, before, limit);
    await this.messagesRepository.updateLastReadAt(chatId, userId);

    const messages = rows.map((row) => this.mapMessage(row));
    const nextCursor = rows.length === limit ? rows[rows.length - 1].id : null;

    return { messages, nextCursor };
  }

  private mapMessage(row: {
    id: number;
    chat_id: number;
    sender_id: number;
    content_type: MessageContentType;
    content_text: string | null;
    visibility_type: MessageVisibilityType;
    status: 'UNLOCKED' | 'PENDING';
    created_at: Date;
  }): MessageDto {
    return {
      id: Number(row.id),
      chatId: Number(row.chat_id),
      senderId: Number(row.sender_id),
      contentType: row.content_type,
      contentText: row.content_text,
      visibilityType: row.visibility_type,
      status: row.status,
      createdAt: row.created_at.toISOString(),
    };
  }
}
