import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { UserRepository } from './user.repository';
import { RedisService } from '../../infrastructure/redis/redis.service';

describe('AuthService', () => {
  let authService: AuthService;
  let userRepository: jest.Mocked<UserRepository>;
  let redisService: jest.Mocked<RedisService>;

  beforeEach(() => {
    userRepository = {
      findByEmail: jest.fn(),
      findByUsername: jest.fn(),
      createUser: jest.fn(),
    } as unknown as jest.Mocked<UserRepository>;

    redisService = {
      getNumber: jest.fn(),
      increment: jest.fn(),
      expire: jest.fn(),
      delete: jest.fn(),
      ping: jest.fn(),
    } as unknown as jest.Mocked<RedisService>;

    authService = new AuthService(
      new JwtService({ secret: 'test' }),
      userRepository,
      redisService,
    );
  });

  it('hashes passwords before storing', async () => {
    const password = 'Password123!';
    const hash = await authService.hashPassword(password);

    expect(hash).not.toBe(password);
    expect(await bcrypt.compare(password, hash)).toBe(true);
  });
});
