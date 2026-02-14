import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { ChatsController } from '../src/modules/chats/chats.controller';
import { ChatsService } from '../src/modules/chats/chats.service';
import { ChatsRepository } from '../src/modules/chats/chats.repository';
import { JwtAuthGuard } from '../src/modules/auth/jwt-auth.guard';
import { UsersRepository } from '../src/modules/users/users.repository';

class InMemoryChatsRepository {
  private chats: Array<{
    id: number;
    public_id: string;
    type: 'DIRECT';
    title: string | null;
    created_by: number;
    created_at: Date;
  }> = [];
  private members: Array<{ chat_id: number; user_id: number; role: 'OWNER' | 'MEMBER' }> =
    [];
  private nextId = 1;

  async findDirectChatBetweenUsers(userA: number, userB: number) {
    const chatIds = this.members
      .filter((member) => member.user_id === userA)
      .map((member) => member.chat_id);
    const candidate = chatIds.find((chatId) =>
      this.members.some((m) => m.chat_id === chatId && m.user_id === userB),
    );
    return this.chats.find((chat) => chat.id === candidate) ?? null;
  }

  async createDirectChat(publicId: string, creatorId: number) {
    const chat = {
      id: this.nextId++,
      public_id: publicId,
      type: 'DIRECT' as const,
      title: null,
      created_by: creatorId,
      created_at: new Date('2026-02-01T00:00:00Z'),
    };
    this.chats.push(chat);
    return chat;
  }

  async addMember(chatId: number, userId: number, role: 'OWNER' | 'MEMBER') {
    this.members.push({ chat_id: chatId, user_id: userId, role });
  }

  async getChatsByUserId(userId: number) {
    const chatIds = this.members
      .filter((member) => member.user_id === userId)
      .map((member) => member.chat_id);
    return this.chats.filter((chat) => chatIds.includes(chat.id));
  }

  async getChatDetailsById(chatId: number) {
    return this.chats.find((chat) => chat.id === chatId) ?? null;
  }

  async getMembers(chatId: number) {
    return this.members
      .filter((member) => member.chat_id === chatId)
      .map((member) => ({ user_id: member.user_id, role: member.role }));
  }

  async isMember(chatId: number, userId: number) {
    return this.members.some(
      (member) => member.chat_id === chatId && member.user_id === userId,
    );
  }
}

class InMemoryUsersRepository {
  async findProfileById(userId: number) {
    return {
      id: userId,
      email: `${userId}@example.com`,
      username: `user${userId}`,
      displayName: `User ${userId}`,
      avatarUrl: null,
      presenceStatus: null,
    };
  }
}

describe('Chats E2E', () => {
  let app: INestApplication;
  let repository: InMemoryChatsRepository;

  beforeAll(async () => {
    repository = new InMemoryChatsRepository();
    const moduleRef = await Test.createTestingModule({
      controllers: [ChatsController],
      providers: [
        ChatsService,
        {
          provide: ChatsRepository,
          useValue: repository,
        },
        {
          provide: UsersRepository,
          useClass: InMemoryUsersRepository,
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
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /api/v1/chats creates or returns direct chat', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/chats')
      .send({ contactId: 2 })
      .expect(201);

    await request(app.getHttpServer())
      .post('/api/v1/chats')
      .send({ contactId: 2 })
      .expect(201);
  });

  it('GET /api/v1/chats lists user chats', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/chats')
      .expect(200)
      .expect(({ body }) => {
        expect(Array.isArray(body)).toBe(true);
      });
  });

  it('GET /api/v1/chats/:chatId returns details', async () => {
    const chats = await repository.getChatsByUserId(1);
    const chatId = chats[0]?.id ?? 1;

    await request(app.getHttpServer())
      .get(`/api/v1/chats/${chatId}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.id).toBeDefined();
        expect(body.members).toBeDefined();
      });
  });
});
