import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../infrastructure/database/database.module';
import { UsersModule } from '../users/users.module';
import { ChatsController } from './chats.controller';
import { ChatsService } from './chats.service';
import { ChatsRepository } from './chats.repository';

@Module({
  imports: [DatabaseModule, UsersModule],
  controllers: [ChatsController],
  providers: [ChatsService, ChatsRepository],
  exports: [ChatsRepository],
})
export class ChatsModule {}
