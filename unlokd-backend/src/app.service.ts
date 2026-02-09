import { Injectable } from '@nestjs/common';
import { PrismaService } from './infrastructure/database/prisma.service';
import { RedisService } from './infrastructure/redis/redis.service';

@Injectable()
export class AppService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly redisService: RedisService,
  ) {}

  async getHealth(): Promise<{
    status: 'ok' | 'degraded';
    timestamp: string;
    services: {
      db: 'ok' | 'error';
      redis: 'ok' | 'error';
    };
  }> {
    const services: { db: 'ok' | 'error'; redis: 'ok' | 'error' } = {
      db: 'ok',
      redis: 'ok',
    };

    try {
      await this.prismaService.healthCheck();
    } catch {
      services.db = 'error';
    }

    try {
      await this.redisService.ping();
    } catch {
      services.redis = 'error';
    }

    const status =
      services.db === 'ok' && services.redis === 'ok' ? 'ok' : 'degraded';

    return {
      status,
      timestamp: new Date().toISOString(),
      services,
    };
  }
}
