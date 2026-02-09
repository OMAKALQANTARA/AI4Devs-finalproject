import {
  BadRequestException,
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { UserRepository } from './user.repository';
import { RedisService } from '../../infrastructure/redis/redis.service';

const LOGIN_ATTEMPTS_LIMIT = 5;
const LOGIN_ATTEMPTS_TTL_SECONDS = 15 * 60;

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly userRepository: UserRepository,
    private readonly redisService: RedisService,
  ) {}

  async register(payload: RegisterDto) {
    if (payload.password !== payload.passwordConfirm) {
      throw new BadRequestException('Las contraseñas no coinciden');
    }

    const existingUser = await this.userRepository.findByEmail(payload.email);
    if (existingUser) {
      throw new ConflictException('Email ya registrado');
    }

    const username = await this.generateUsername(payload.email);
    const passwordHash = await this.hashPassword(payload.password);

    const createdUser = await this.userRepository.createUser({
      email: payload.email,
      username,
      passwordHash,
      displayName: payload.fullName,
    });

    return {
      userId: createdUser.id,
      username: createdUser.username,
      email: createdUser.email,
    };
  }

  async login(payload: LoginDto, ipAddress: string): Promise<AuthResponseDto> {
    const attemptsKey = `login:attempts:${ipAddress}`;
    const attempts = await this.redisService.getNumber(attemptsKey);
    if (attempts !== null && attempts >= LOGIN_ATTEMPTS_LIMIT) {
      throw new HttpException(
        'Demasiados intentos, intenta más tarde',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const user = await this.userRepository.findByEmail(payload.email);
    const isValid =
      user && (await bcrypt.compare(payload.password, user.passwordHash));

    if (!isValid) {
      const nextAttempts = await this.redisService.increment(attemptsKey);
      if (nextAttempts === 1) {
        await this.redisService.expire(attemptsKey, LOGIN_ATTEMPTS_TTL_SECONDS);
      }
      throw new UnauthorizedException('Credenciales inválidas');
    }

    await this.redisService.delete(attemptsKey);

    const accessToken = await this.jwtService.signAsync({
      userId: user.id,
      email: user.email,
      username: user.username,
    });

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
      },
    };
  }

  async hashPassword(password: string) {
    return bcrypt.hash(password, 10);
  }

  private async generateUsername(email: string) {
    const base = email.split('@')[0].replace(/[^a-zA-Z0-9._]/g, '');
    const normalized = base.length > 0 ? base : 'usuario';
    let candidate = normalized;
    let suffix = 1;

    while (await this.userRepository.findByUsername(candidate)) {
      suffix += 1;
      candidate = `${normalized}${suffix}`;
    }

    return candidate;
  }
}
