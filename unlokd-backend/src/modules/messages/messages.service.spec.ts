import { ForbiddenException } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { MessagesRepository } from './messages.repository';
import { MessageContentType, MessageVisibilityType } from './dto/create-message.dto';
import { RealtimeGateway } from '../realtime/realtime.gateway';

describe('MessagesService', () => {
  let messagesService: MessagesService;
  let messagesRepository: jest.Mocked<MessagesRepository>;
  let realtimeGateway: jest.Mocked<RealtimeGateway>;

  beforeEach(() => {
    messagesRepository = {
      isChatMember: jest.fn(),
      createMessage: jest.fn(),
      getMessages: jest.fn(),
      updateLastReadAt: jest.fn(),
    } as unknown as jest.Mocked<MessagesRepository>;

    realtimeGateway = {
      emitNewMessage: jest.fn(),
    } as unknown as jest.Mocked<RealtimeGateway>;

    messagesService = new MessagesService(messagesRepository, realtimeGateway);
  });

  it('blocks send when not a member', async () => {
    messagesRepository.isChatMember.mockResolvedValue(false);

    await expect(
      messagesService.createMessage(1, {
        chatId: 1,
        contentType: MessageContentType.TEXT,
        contentText: 'Hola',
        visibilityType: MessageVisibilityType.PLAIN,
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('returns pagination cursor when limit reached', async () => {
    messagesRepository.isChatMember.mockResolvedValue(true);
    messagesRepository.getMessages.mockResolvedValue([
      {
        id: 3,
        chat_id: 1,
        sender_id: 1,
        content_type: 'TEXT',
        content_text: 'Hola',
        visibility_type: 'PLAIN',
        status: 'UNLOCKED',
        created_at: new Date('2026-02-01T00:00:00Z'),
      },
    ]);

    const result = await messagesService.getChatMessages(1, 1, null, 1);
    expect(result.nextCursor).toBe(3);
  });
});
