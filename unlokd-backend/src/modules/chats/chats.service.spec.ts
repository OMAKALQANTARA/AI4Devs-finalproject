import { ForbiddenException } from '@nestjs/common';
import { ChatsService } from './chats.service';
import { ChatsRepository } from './chats.repository';

describe('ChatsService', () => {
  let chatsService: ChatsService;
  let chatsRepository: jest.Mocked<ChatsRepository>;

  beforeEach(() => {
    chatsRepository = {
      findDirectChatBetweenUsers: jest.fn(),
      createDirectChat: jest.fn(),
      addMember: jest.fn(),
      getChatsByUserId: jest.fn(),
      getChatDetailsById: jest.fn(),
      getMembers: jest.fn(),
      isMember: jest.fn(),
    } as unknown as jest.Mocked<ChatsRepository>;

    chatsService = new ChatsService(chatsRepository);
  });

  it('returns existing direct chat if found', async () => {
    chatsRepository.findDirectChatBetweenUsers.mockResolvedValue({
      id: 1,
      public_id: 'abc',
      type: 'DIRECT',
      title: null,
      created_by: 1,
      created_at: new Date('2026-02-01T00:00:00Z'),
    });

    const result = await chatsService.createDirectChat(1, 2);
    expect(result.publicId).toBe('abc');
  });

  it('throws when non-member requests chat details', async () => {
    chatsRepository.isMember.mockResolvedValue(false);

    await expect(chatsService.getChatDetails(1, 2)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });
});
