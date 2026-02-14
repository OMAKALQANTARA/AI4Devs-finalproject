import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ContactsRepository } from './contacts.repository';
import { UsersRepository } from '../users/users.repository';
import { ChatsRepository } from '../chats/chats.repository';

@Injectable()
export class ContactsService {
  constructor(
    private readonly contactsRepository: ContactsRepository,
    private readonly usersRepository: UsersRepository,
    private readonly chatsRepository: ChatsRepository,
  ) {}

  async listContacts(userId: number) {
    return this.contactsRepository.listContacts(userId);
  }

  async addContact(userId: number, email: string) {
    const contactProfile = await this.usersRepository.findProfileByEmail(email);
    if (!contactProfile) {
      throw new NotFoundException('No existe un usuario con ese email');
    }
    if (contactProfile.id === userId) {
      throw new BadRequestException('No puedes agregarte como contacto');
    }

    const existing = await this.contactsRepository.getContactByUser(
      userId,
      contactProfile.id,
    );
    if (existing) {
      return existing;
    }

    await this.contactsRepository.createContact(userId, contactProfile.id);
    const created = await this.contactsRepository.getContactByUser(
      userId,
      contactProfile.id,
    );
    if (!created) {
      throw new BadRequestException('No se pudo crear el contacto');
    }
    return created;
  }

  async deleteContact(userId: number, contactUserId: number) {
    const existing = await this.contactsRepository.getContactByUser(
      userId,
      contactUserId,
    );
    if (!existing) {
      throw new NotFoundException('Contacto no encontrado');
    }

    await this.chatsRepository.deleteDirectChatBetweenUsers(userId, contactUserId);
    await this.contactsRepository.deleteContact(userId, contactUserId);
  }
}
