import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../infrastructure/database/database.module';
import { UsersModule } from '../users/users.module';
import { ChatsModule } from '../chats/chats.module';
import { ContactsController } from './contacts.controller';
import { ContactsService } from './contacts.service';
import { ContactsRepository } from './contacts.repository';

@Module({
  imports: [DatabaseModule, UsersModule, ChatsModule],
  controllers: [ContactsController],
  providers: [ContactsService, ContactsRepository],
})
export class ContactsModule {}
