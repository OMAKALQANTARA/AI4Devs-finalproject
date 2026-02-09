import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { MessagesController } from '../src/modules/messages/messages.controller';
import { MessagesService } from '../src/modules/messages/messages.service';
import { MessagesRepository } from '../src/modules/messages/messages.repository';
import { JwtAuthGuard } from '../src/modules/auth/jwt-auth.guard';

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

describe('Messages E2E', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [MessagesController],
      providers: [
        MessagesService,
        {
          provide: MessagesRepository,
          useClass: InMemoryMessagesRepository,
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

  it('POST /api/v1/messages creates message', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/messages')
      .send({
        chatId: 1,
        contentType: 'TEXT',
        contentText: 'Hola',
        visibilityType: 'PLAIN',
      })
      .expect(201);
  });

  it('GET /api/v1/chats/:chatId/messages returns timeline', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/chats/1/messages?limit=1')
      .expect(200)
      .expect(({ body }) => {
        expect(Array.isArray(body.messages)).toBe(true);
      });
  });
});
