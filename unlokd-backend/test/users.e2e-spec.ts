import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { UsersController } from '../src/modules/users/users.controller';
import { UsersService } from '../src/modules/users/users.service';
import {
  UsersRepository,
  UserProfileRecord,
} from '../src/modules/users/users.repository';
import { JwtAuthGuard } from '../src/modules/auth/jwt-auth.guard';

class InMemoryUsersRepository {
  private user: UserProfileRecord = {
    id: 1,
    email: 'user@example.com',
    username: 'user',
    displayName: 'User Name',
    avatarUrl: null,
    presenceStatus: 'online',
  };

  async findProfileById(userId: number) {
    return userId === this.user.id ? this.user : null;
  }

  async updateProfile(userId: number, payload: { displayName?: string }) {
    if (userId === this.user.id && payload.displayName) {
      this.user = { ...this.user, displayName: payload.displayName };
    }
  }

  async updateAvatar(userId: number, avatarUrl: string) {
    if (userId === this.user.id) {
      this.user = { ...this.user, avatarUrl };
    }
  }
}

describe('Users E2E', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        UsersService,
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

  it('GET /api/v1/users/me returns profile', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/users/me')
      .expect(200)
      .expect(({ body }) => {
        expect(body.email).toBe('user@example.com');
        expect(body.displayName).toBe('User Name');
      });
  });

  it('PUT /api/v1/users/me updates profile', async () => {
    await request(app.getHttpServer())
      .put('/api/v1/users/me')
      .send({ displayName: 'Nuevo Nombre' })
      .expect(200)
      .expect(({ body }) => {
        expect(body.displayName).toBe('Nuevo Nombre');
      });
  });
});
