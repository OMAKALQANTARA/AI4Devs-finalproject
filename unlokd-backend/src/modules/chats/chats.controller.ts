import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ChatsService } from './chats.service';
import { CreateChatDto } from './dto/create-chat.dto';

type RequestWithUser = {
  user: {
    userId: number;
    email: string;
    username: string;
  };
};

@Controller('api/v1/chats')
@UseGuards(JwtAuthGuard)
export class ChatsController {
  constructor(private readonly chatsService: ChatsService) {}

  @Post()
  async createChat(@Request() req: RequestWithUser, @Body() body: CreateChatDto) {
    return this.chatsService.createDirectChat(req.user.userId, body.contactId);
  }

  @Get()
  async getChats(@Request() req: RequestWithUser) {
    return this.chatsService.getChatsByUserId(req.user.userId);
  }

  @Get(':chatId')
  async getChatDetails(@Request() req: RequestWithUser, @Param('chatId') chatId: string) {
    return this.chatsService.getChatDetails(Number(chatId), req.user.userId);
  }

  @Delete(':chatId')
  async deleteChat(@Request() req: RequestWithUser, @Param('chatId') chatId: string) {
    await this.chatsService.deleteChat(Number(chatId), req.user.userId);
    return { success: true };
  }
}
