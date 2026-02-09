import { NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersRepository, UserProfileRecord } from './users.repository';

describe('UsersService', () => {
  let usersService: UsersService;
  let usersRepository: jest.Mocked<UsersRepository>;

  beforeEach(() => {
    usersRepository = {
      findProfileById: jest.fn(),
      updateProfile: jest.fn(),
      updateAvatar: jest.fn(),
    } as unknown as jest.Mocked<UsersRepository>;

    usersService = new UsersService(usersRepository);
  });

  it('throws when profile not found', async () => {
    usersRepository.findProfileById.mockResolvedValue(null);

    await expect(usersService.getProfile(1)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('updates profile and returns new data', async () => {
    const user: UserProfileRecord = {
      id: 1,
      email: 'test@example.com',
      username: 'test',
      displayName: 'Test User',
      avatarUrl: null,
      presenceStatus: null,
    };

    usersRepository.findProfileById
      .mockResolvedValueOnce(user)
      .mockResolvedValueOnce({
        ...user,
        displayName: 'Nuevo Nombre',
      });
    usersRepository.updateProfile.mockResolvedValue();

    const result = await usersService.updateProfile(1, {
      displayName: 'Nuevo Nombre',
    });

    expect(usersRepository.updateProfile).toHaveBeenCalled();
    expect(result.displayName).toBe('Nuevo Nombre');
  });
});
