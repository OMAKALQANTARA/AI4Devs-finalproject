import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UserRepository } from './user.repository';
import { JwtStrategy } from './jwt.strategy';
import { RedisModule } from '../../infrastructure/redis/redis.module';
import { DatabaseModule } from '../../infrastructure/database/database.module';

@Module({
  imports: [
    PassportModule,
    DatabaseModule,
    RedisModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const rawExpiration = configService.get<string>('jwt.expiration');
        const expiresIn =
          rawExpiration && /^\d+$/.test(rawExpiration)
            ? Number(rawExpiration)
            : 60 * 60 * 24;

        return {
          secret: configService.get<string>('jwt.secret') ?? 'change-me',
          signOptions: {
            expiresIn,
          },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, UserRepository, JwtStrategy],
  exports: [JwtModule],
})
export class AuthModule {}