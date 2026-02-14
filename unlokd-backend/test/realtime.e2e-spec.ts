import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { io as ioClient, Socket } from 'socket.io-client';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { MessagesController } from '../src/modules/messages/messages.controller';
import { MessagesService } from '../src/modules/messages/messages.service';
import { MessagesRepository } from '../src/modules/messages/messages.repository';
import { JwtAuthGuard } from '../src/modules/auth/jwt-auth.guard';
import { RealtimeGateway } from '../src/modules/realtime/realtime.gateway';
import { ChatsRepository } from '../src/modules/chats/chats.repository';

class InMemoryMessagesRepository {
  private messages: Array<{
    id: number;
    chat_id: number;
    sender_id: number;
    content_type: 'TEXT';
    content_text: string | null;
    visibility_type: 'PLAIN';
    status: 'UNLOCKED' | 'PENDING';
    created_at: Date;
  }> = [];
  private nextId = 1;
  private members = new Set<string>(['1:1']);

  async isChatMember(chatId: number, userId: number) {
    return this.members.has(`${chatId}:${userId}`);
  }

  async createMessage(payload: {
    chatId: number;
    senderId: number;
    contentType: 'TEXT';
    contentText: string;
    visibilityType: 'PLAIN';
  }) {
    const message = {
      id: this.nextId++,
      chat_id: payload.chatId,
      sender_id: payload.senderId,
      content_type: payload.contentType,
      content_text: payload.contentText,
      visibility_type: payload.visibilityType,
      status: 'UNLOCKED' as const,
      created_at: new Date('2026-02-01T00:00:00Z'),
    };
    this.messages.unshift(message);
    return message;
  }

  async getMessages(chatId: number, before: number | null, limit: number) {
    const filtered = this.messages.filter((msg) => msg.chat_id === chatId);
    const scoped = before ? filtered.filter((msg) => msg.id < before) : filtered;
    return scoped.slice(0, limit);
  }

  async updateLastReadAt() {
    return;
  }
}

class InMemoryChatsRepository {
  private members = new Set<string>(['1:1']);

  async isMember(chatId: number, userId: number) {
    return this.members.has(`${chatId}:${userId}`);
  }
}

describe('Realtime Gateway E2E', () => {
  let app: INestApplication;
  let socket: Socket;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [JwtModule.register({ secret: 'test-secret' })],
      controllers: [MessagesController],
      providers: [
        MessagesService,
        RealtimeGateway,
        {
          provide: MessagesRepository,
          useClass: InMemoryMessagesRepository,
        },
        {
          provide: ChatsRepository,
          useClass: InMemoryChatsRepository,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context: any) => {
          const request = context.switchToHttp().getRequest();
          request.user = {
            userId: 1,
            email: 'user@example.com',
            username: 'user',
          };
          return true;
        },
      })
      .compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
    );
    await app.listen(0);

    const jwtService = app.get(JwtService);
    const token = jwtService.sign({
      userId: 1,
      email: 'user@example.com',
      username: 'user',
    });
    const address = app.getHttpServer().address();
    const port = typeof address === 'object' && address ? address.port : 0;

    socket = ioClient(`http://localhost:${port}`, {
      auth: { token },
      transports: ['websocket'],
    });

    await new Promise<void>((resolve, reject) => {
      socket.on('connect', () => resolve());
      socket.on('connect_error', (error) => reject(error));
    });

    await new Promise<void>((resolve, reject) => {
      socket.emit('joinChat', { chatId: 1 }, () => resolve());
      socket.on('error', (error) => reject(error));
    });
  });

  afterAll(async () => {
    if (socket && socket.connected) {
      socket.disconnect();
    }
    await app.close();
  });

  it('emits newMessage to chat room', async () => {
    const messagePromise = new Promise<any>((resolve) => {
      socket.once('newMessage', (payload) => resolve(payload));
    });

    await request(app.getHttpServer())
      .post('/api/v1/messages')
      .send({
        chatId: 1,
        contentType: 'TEXT',
        contentText: 'Hola',
        visibilityType: 'PLAIN',
      })
      .expect(201);

    const payload = await messagePromise;
    expect(payload.chatId).toBe(1);
    expect(payload.messageId).toBeDefined();
    expect(payload.createdAt).toBeDefined();
  });
});
