import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AuthController } from '../src/modules/auth/auth.controller';
import { AuthService } from '../src/modules/auth/auth.service';
import { UserRepository, UserRecord } from '../src/modules/auth/user.repository';
import { RedisService } from '../src/infrastructure/redis/redis.service';
import { UsersController } from '../src/modules/users/users.controller';
import { UsersService } from '../src/modules/users/users.service';
import {
  UsersRepository,
  UserProfileRecord,
} from '../src/modules/users/users.repository';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from '../src/modules/auth/jwt.strategy';
import { ConfigService } from '@nestjs/config';

class InMemoryUserStore {
  private users: Array<UserRecord & UserProfileRecord> = [];
  private nextId = 1;

  getAll() {
    return this.users;
  }

  create(payload: {
    email: string;
    username: string;
    passwordHash: string;
    displayName: string;
  }) {
    const user = {
      id: this.nextId++,
      email: payload.email,
      username: payload.username,
      passwordHash: payload.passwordHash,
      displayName: payload.displayName,
      avatarUrl: null,
      presenceStatus: 'online',
      isActive: true,
    };
    this.users.push(user);
    return user;
  }
}

class InMemoryAuthUserRepository {
  constructor(private readonly store: InMemoryUserStore) {}

  async findByEmail(email: string) {
    return this.store.getAll().find((user) => user.email === email) ?? null;
  }

  async findByUsername(username: string) {
    return this.store.getAll().find((user) => user.username === username) ?? null;
  }

  async createUser(payload: {
    email: string;
    username: string;
    passwordHash: string;
    displayName: string;
  }) {
    return this.store.create(payload);
  }
}

class InMemoryUsersRepository {
  constructor(private readonly store: InMemoryUserStore) {}

  async findProfileById(userId: number) {
    return this.store.getAll().find((user) => user.id === userId) ?? null;
  }

  async updateProfile(userId: number, payload: { displayName?: string }) {
    const user = this.store.getAll().find((item) => item.id === userId);
    if (user && payload.displayName) {
      user.displayName = payload.displayName;
    }
  }

  async updateAvatar() {
    return;
  }
}

class InMemoryRedisService {
  private store = new Map<string, number>();

  async getNumber(key: string) {
    const value = this.store.get(key);
    return value ?? null;
  }

  async increment(key: string) {
    const next = (this.store.get(key) ?? 0) + 1;
    this.store.set(key, next);
    return next;
  }

  async expire() {
    return 1;
  }

  async delete(key: string) {
    return this.store.delete(key) ? 1 : 0;
  }

  async ping() {
    return 'PONG';
  }
}

describe('Auth E2E', () => {
  let app: INestApplication;
  let store: InMemoryUserStore;
  let accessToken = '';

  beforeAll(async () => {
    store = new InMemoryUserStore();
    const moduleRef = await Test.createTestingModule({
      imports: [
        PassportModule,
        JwtModule.register({ secret: 'test-secret', signOptions: { expiresIn: 3600 } }),
      ],
      controllers: [AuthController, UsersController],
      providers: [
        AuthService,
        UsersService,
        JwtStrategy,
        {
          provide: ConfigService,
          useValue: {
            get: (key: string) => (key === 'jwt.secret' ? 'test-secret' : undefined),
          },
        },
        {
          provide: UserRepository,
          useFactory: () => new InMemoryAuthUserRepository(store),
        },
        {
          provide: UsersRepository,
          useFactory: () => new InMemoryUsersRepository(store),
        },
        {
          provide: RedisService,
          useClass: InMemoryRedisService,
        },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /api/v1/auth/register creates a user', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        fullName: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        passwordConfirm: 'password123',
      })
      .expect(201)
      .expect(({ body }) => {
        expect(body.email).toBe('test@example.com');
        expect(body.username).toBeDefined();
        expect(body.userId).toBeDefined();
      });
  });

  it('POST /api/v1/auth/register rejects duplicate email', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        fullName: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        passwordConfirm: 'password123',
      })
      .expect(409);
  });

  it('POST /api/v1/auth/login returns token', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123',
      })
      .expect(200)
      .expect(({ body }) => {
        expect(body.accessToken).toBeDefined();
        expect(body.user.email).toBe('test@example.com');
        accessToken = body.accessToken;
      });
  });

  it('POST /api/v1/auth/login rejects invalid credentials', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: 'test@example.com',
        password: 'bad-password',
      })
      .expect(401);
  });

  it('blocks after 5 failed login attempts', async () => {
    for (let i = 0; i < 4; i += 1) {
      await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: 'bad-password',
        })
        .expect(401);
    }

    await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: 'test@example.com',
        password: 'bad-password',
      })
      .expect(429);
  });

  it('GET /api/v1/users/me rejects without JWT', async () => {
    await request(app.getHttpServer()).get('/api/v1/users/me').expect(401);
  });

  it('GET /api/v1/users/me accepts with JWT', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/users/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.email).toBe('test@example.com');
      });
  });
});
