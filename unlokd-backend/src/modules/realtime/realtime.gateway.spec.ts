import { WsException } from '@nestjs/websockets';
import { RealtimeGateway } from './realtime.gateway';
import { JwtService } from '@nestjs/jwt';
import { ChatsRepository } from '../chats/chats.repository';

describe('RealtimeGateway', () => {
  let gateway: RealtimeGateway;
  let jwtService: jest.Mocked<JwtService>;
  let chatsRepository: jest.Mocked<ChatsRepository>;

  beforeEach(() => {
    jwtService = {
      verifyAsync: jest.fn(),
    } as unknown as jest.Mocked<JwtService>;

    chatsRepository = {
      isMember: jest.fn(),
    } as unknown as jest.Mocked<ChatsRepository>;

    gateway = new RealtimeGateway(jwtService, chatsRepository);
    gateway.server = {
      to: jest.fn().mockReturnThis(),
      emit: jest.fn(),
    } as any;
  });

  it('accepts valid JWT in handshake', async () => {
    const client = createClient({ token: 'valid-token' });
    jwtService.verifyAsync.mockResolvedValue({
      userId: 10,
      email: 'user@example.com',
      username: 'user',
    });

    await gateway.handleConnection(client as any);

    expect(client.data.user).toEqual({
      userId: 10,
      email: 'user@example.com',
      username: 'user',
    });
    expect(client.disconnect).not.toHaveBeenCalled();
  });

  it('disconnects when JWT is invalid', async () => {
    const client = createClient({ token: 'invalid-token' });
    jwtService.verifyAsync.mockRejectedValue(new Error('invalid'));

    await gateway.handleConnection(client as any);

    expect(client.disconnect).toHaveBeenCalledWith(true);
  });

  it('joins chat room when user is member', async () => {
    const client = createClient({ token: 'valid-token' });
    client.data.user = {
      userId: 1,
      email: 'user@example.com',
      username: 'user',
    };
    chatsRepository.isMember.mockResolvedValue(true);

    await gateway.handleJoinChat(client as any, { chatId: 1 });

    expect(client.join).toHaveBeenCalledWith('chat:1');
  });

  it('blocks join when user is not a member', async () => {
    const client = createClient({ token: 'valid-token' });
    client.data.user = {
      userId: 1,
      email: 'user@example.com',
      username: 'user',
    };
    chatsRepository.isMember.mockResolvedValue(false);

    await expect(gateway.handleJoinChat(client as any, { chatId: 1 })).rejects.toBeInstanceOf(
      WsException,
    );
  });
});

function createClient({ token }: { token: string }) {
  return {
    handshake: { auth: { token } },
    data: {},
    disconnect: jest.fn(),
    join: jest.fn(),
    leave: jest.fn(),
    to: jest.fn().mockReturnValue({ emit: jest.fn() }),
  };
}
