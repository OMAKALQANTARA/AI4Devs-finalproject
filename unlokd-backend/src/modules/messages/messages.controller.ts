import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';

type RequestWithUser = {
  user: {
    userId: number;
    email: string;
    username: string;
  };
};

@Controller('api/v1')
@UseGuards(JwtAuthGuard)
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post('messages')
  async createMessage(
    @Request() req: RequestWithUser,
    @Body() body: CreateMessageDto,
  ) {
    return this.messagesService.createMessage(req.user.userId, body);
  }

  @Get('chats/:chatId/messages')
  async getChatMessages(
    @Request() req: RequestWithUser,
    @Param('chatId') chatId: string,
    @Query('before') before?: string,
    @Query('limit') limit?: string,
  ) {
    const parsedBefore = before ? Number(before) : null;
    const parsedLimit = limit ? Number(limit) : 20;

    return this.messagesService.getChatMessages(
      Number(chatId),
      req.user.userId,
      Number.isFinite(parsedBefore) ? parsedBefore : null,
      Number.isFinite(parsedLimit) ? parsedLimit : 20,
    );
  }
}
