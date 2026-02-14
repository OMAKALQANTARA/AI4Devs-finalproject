import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { io as ioClient, Socket } from 'socket.io-client';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { ChatsController } from '../src/modules/chats/chats.controller';
import { ChatsService } from '../src/modules/chats/chats.service';
import { ChatsRepository } from '../src/modules/chats/chats.repository';
import { MessagesController } from '../src/modules/messages/messages.controller';
import { MessagesService } from '../src/modules/messages/messages.service';
import { MessagesRepository } from '../src/modules/messages/messages.repository';
import { JwtAuthGuard } from '../src/modules/auth/jwt-auth.guard';
import { UsersRepository } from '../src/modules/users/users.repository';
import { RealtimeGateway } from '../src/modules/realtime/realtime.gateway';

type Store = {
  chats: Array<{
    id: number;
    public_id: string;
    type: 'DIRECT';
    title: string | null;
    created_by: number;
    created_at: Date;
  }>;
  members: Array<{ chat_id: number; user_id: number; role: 'OWNER' | 'MEMBER' }>;
  messages: Array<{
    id: number;
    chat_id: number;
    sender_id: number;
    content_type: 'TEXT';
    content_text: string | null;
    visibility_type: 'PLAIN';
    status: 'UNLOCKED' | 'PENDING';
    created_at: Date;
  }>;
  nextChatId: number;
  nextMessageId: number;
};

const users = new Map<number, { displayName: string }>([
  [1, { displayName: 'User One' }],
  [2, { displayName: 'User Two' }],
]);

class InMemoryUsersRepository {
  async findProfileById(userId: number) {
    const profile = users.get(userId);
    if (!profile) return null;
    return {
      id: userId,
      email: `${userId}@example.com`,
      username: `user${userId}`,
      displayName: profile.displayName,
      avatarUrl: null,
      presenceStatus: null,
    };
  }
}

class InMemoryChatsRepository {
  constructor(private readonly store: Store) {}

  async findDirectChatBetweenUsers(userA: number, userB: number) {
    const chatIds = this.store.members
      .filter((member) => member.user_id === userA)
      .map((member) => member.chat_id);
    const candidate = chatIds.find((chatId) =>
      this.store.members.some((m) => m.chat_id === chatId && m.user_id === userB),
    );
    return this.store.chats.find((chat) => chat.id === candidate) ?? null;
  }

  async createDirectChat(publicId: string, creatorId: number) {
    const chat = {
      id: this.store.nextChatId++,
      public_id: publicId,
      type: 'DIRECT' as const,
      title: null,
      created_by: creatorId,
      created_at: new Date('2026-02-01T00:00:00Z'),
    };
    this.store.chats.push(chat);
    return chat;
  }

  async addMember(chatId: number, userId: number, role: 'OWNER' | 'MEMBER') {
    this.store.members.push({ chat_id: chatId, user_id: userId, role });
  }

  async getChatsByUserId(userId: number) {
    const chatIds = this.store.members
      .filter((member) => member.user_id === userId)
      .map((member) => member.chat_id);
    return this.store.chats
      .filter((chat) => chatIds.includes(chat.id))
      .map((chat) => ({
        ...chat,
        peer_display_name:
          this.store.members
            .filter((member) => member.chat_id === chat.id)
            .map((member) => member.user_id)
            .filter((memberId) => memberId !== userId)
            .map((memberId) => users.get(memberId)?.displayName ?? null)[0] ?? null,
      }));
  }

  async getChatDetailsById(chatId: number) {
    return this.store.chats.find((chat) => chat.id === chatId) ?? null;
  }

  async getMembers(chatId: number) {
    return this.store.members
      .filter((member) => member.chat_id === chatId)
      .map((member) => ({
        user_id: member.user_id,
        role: member.role,
        display_name: users.get(member.user_id)?.displayName ?? '',
        presence_status: null,
        avatar_url: null,
      }));
  }

  async isMember(chatId: number, userId: number) {
    return this.store.members.some(
      (member) => member.chat_id === chatId && member.user_id === userId,
    );
  }
}

class InMemoryMessagesRepository {
  constructor(private readonly store: Store) {}

  async isChatMember(chatId: number, userId: number) {
    return this.store.members.some(
      (member) => member.chat_id === chatId && member.user_id === userId,
    );
  }

  async createMessage(payload: {
    chatId: number;
    senderId: number;
    contentType: 'TEXT';
    contentText: string;
    visibilityType: 'PLAIN';
  }) {
    const message = {
      id: this.store.nextMessageId++,
      chat_id: payload.chatId,
      sender_id: payload.senderId,
      content_type: payload.contentType,
      content_text: payload.contentText,
      visibility_type: payload.visibilityType,
      status: 'UNLOCKED' as const,
      created_at: new Date(),
    };
    this.store.messages.unshift(message);
    return message;
  }

  async getMessages(chatId: number, before: number | null, limit: number) {
    const filtered = this.store.messages.filter((msg) => msg.chat_id === chatId);
    const scoped = before ? filtered.filter((msg) => msg.id < before) : filtered;
    return scoped.slice(0, limit);
  }

  async updateLastReadAt() {
    return;
  }
}

describe('Messaging Basic E2E', () => {
  let app: INestApplication;
  let socket: Socket;
  let chatId: number;

  beforeAll(async () => {
    const store: Store = {
      chats: [],
      members: [],
      messages: [],
      nextChatId: 1,
      nextMessageId: 1,
    };
    const chatsRepo = new InMemoryChatsRepository(store);
    const messagesRepo = new InMemoryMessagesRepository(store);
    const usersRepo = new InMemoryUsersRepository();

    const moduleRef = await Test.createTestingModule({
      imports: [JwtModule.register({ secret: 'test-secret' })],
      controllers: [ChatsController, MessagesController],
      providers: [
        ChatsService,
        MessagesService,
        RealtimeGateway,
        { provide: ChatsRepository, useValue: chatsRepo },
        { provide: MessagesRepository, useValue: messagesRepo },
        { provide: UsersRepository, useValue: usersRepo },
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
      userId: 2,
      email: 'user2@example.com',
      username: 'user2',
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
  });

  afterAll(async () => {
    if (socket && socket.connected) {
      socket.disconnect();
    }
    await app.close();
  });

  it('creates a direct chat (1-a-1)', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/chats')
      .send({ contactId: 2 })
      .expect(201);
    chatId = response.body.id;
    expect(chatId).toBeDefined();
  });

  it('receives new message over websocket', async () => {
    await new Promise<void>((resolve, reject) => {
      socket.emit('joinChat', { chatId }, () => resolve());
      socket.on('error', (error) => reject(error));
    });

    const messagePromise = new Promise<any>((resolve) => {
      socket.once('newMessage', (payload) => resolve(payload));
    });

    await request(app.getHttpServer())
      .post('/api/v1/messages')
      .send({
        chatId,
        contentType: 'TEXT',
        contentText: 'Hola',
        visibilityType: 'PLAIN',
      })
      .expect(201);

    const payload = await messagePromise;
    expect(payload.chatId).toBe(chatId);
    expect(payload.messageId).toBeDefined();
  });

  it('returns paginated timeline', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/messages')
      .send({
        chatId,
        contentType: 'TEXT',
        contentText: 'Segundo mensaje',
        visibilityType: 'PLAIN',
      })
      .expect(201);

    const firstPage = await request(app.getHttpServer())
      .get(`/api/v1/chats/${chatId}/messages?limit=1`)
      .expect(200);

    expect(firstPage.body.messages.length).toBe(1);
    expect(firstPage.body.nextCursor).toBeTruthy();

    const secondPage = await request(app.getHttpServer())
      .get(
        `/api/v1/chats/${chatId}/messages?limit=1&before=${firstPage.body.nextCursor}`,
      )
      .expect(200);

    expect(secondPage.body.messages.length).toBe(1);
  });
});
