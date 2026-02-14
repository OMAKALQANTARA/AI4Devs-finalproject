import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets';
import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets/interfaces';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';
import { ChatsRepository } from '../chats/chats.repository';
import { MessageDto } from '../messages/dto/message.dto';

type JwtPayload = {
  userId: number;
  email: string;
  username: string;
};

type JoinChatPayload = {
  chatId: number;
};

type TypingPayload = {
  chatId: number;
  isTyping?: boolean;
  timestamp?: string;
};

type MessageReadPayload = {
  chatId: number;
  timestamp?: string;
};

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly chatsRepository: ChatsRepository,
  ) {}

  async handleConnection(client: Socket) {
    const token = this.extractToken(client);
    if (!token) {
      client.disconnect(true);
      return;
    }

    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token);
      client.data.user = payload;
    } catch (error) {
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    client.data.user = null;
  }

  async emitNewMessage(message: MessageDto) {
    const room = this.getChatRoom(message.chatId);
    const payload = {
      messageId: message.id,
      chatId: message.chatId,
      senderId: message.senderId,
      contentType: message.contentType,
      contentText: message.contentText,
      visibilityType: message.visibilityType,
      status: message.status,
      createdAt: message.createdAt,
    };

    this.server.to(room).emit('newMessage', payload);
  }

  @SubscribeMessage('joinChat')
  async handleJoinChat(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: JoinChatPayload,
  ) {
    const chatId = this.parseChatId(payload?.chatId);
    await this.ensureMember(client, chatId);
    client.join(this.getChatRoom(chatId));
    return { chatId };
  }

  @SubscribeMessage('leaveChat')
  async handleLeaveChat(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: JoinChatPayload,
  ) {
    const chatId = this.parseChatId(payload?.chatId);
    await this.ensureMember(client, chatId);
    client.leave(this.getChatRoom(chatId));
    return { chatId };
  }

  @SubscribeMessage('userTyping')
  async handleUserTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: TypingPayload,
  ) {
    const chatId = this.parseChatId(payload?.chatId);
    await this.ensureMember(client, chatId);
    const userId = this.getUserId(client);
    const eventPayload = {
      chatId,
      userId,
      isTyping: payload?.isTyping ?? true,
      timestamp: payload?.timestamp ?? new Date().toISOString(),
    };

    client.to(this.getChatRoom(chatId)).emit('userTyping', eventPayload);
    return eventPayload;
  }

  @SubscribeMessage('messageRead')
  async handleMessageRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: MessageReadPayload,
  ) {
    const chatId = this.parseChatId(payload?.chatId);
    await this.ensureMember(client, chatId);
    const userId = this.getUserId(client);
    const eventPayload = {
      chatId,
      userId,
      timestamp: payload?.timestamp ?? new Date().toISOString(),
    };

    client.to(this.getChatRoom(chatId)).emit('messageRead', eventPayload);
    return eventPayload;
  }

  private extractToken(client: Socket): string | null {
    const token = client.handshake.auth?.token;
    if (typeof token === 'string' && token.trim()) {
      return token;
    }
    return null;
  }

  private getChatRoom(chatId: number) {
    return `chat:${chatId}`;
  }

  private parseChatId(chatId: number) {
    if (!Number.isFinite(chatId) || chatId <= 0) {
      throw new WsException('chatId inválido');
    }
    return Number(chatId);
  }

  private getUserId(client: Socket) {
    const payload = client.data.user as JwtPayload | undefined;
    if (!payload?.userId) {
      throw new WsException('Usuario no autenticado');
    }
    return payload.userId;
  }

  private async ensureMember(client: Socket, chatId: number) {
    const userId = this.getUserId(client);
    const isMember = await this.chatsRepository.isMember(chatId, userId);
    if (!isMember) {
      throw new WsException('No tienes acceso a este chat');
    }
  }
}
