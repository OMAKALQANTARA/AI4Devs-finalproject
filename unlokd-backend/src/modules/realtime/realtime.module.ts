import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ChatsModule } from '../chats/chats.module';
import { RealtimeGateway } from './realtime.gateway';

@Module({
  imports: [AuthModule, ChatsModule],
  providers: [RealtimeGateway],
  exports: [RealtimeGateway],
})
export class RealtimeModule {}
