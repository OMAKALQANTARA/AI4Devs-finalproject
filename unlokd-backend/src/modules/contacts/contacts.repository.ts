import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';

type DbContact = {
  id: number | bigint;
  contact_user_id: number | bigint;
  alias: string | null;
  email: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  presence_status: string | null;
};

export type ContactRecord = {
  id: number;
  contactUserId: number;
  alias: string | null;
  email: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  presenceStatus: string | null;
};

@Injectable()
export class ContactsRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async listContacts(ownerId: number): Promise<ContactRecord[]> {
    const rows = await this.prismaService.$queryRaw<DbContact[]>`
      SELECT c.id, c.contact_user_id, c.alias, u.email, u.username, u.display_name, u.avatar_url, u.presence_status
      FROM contacts c
      JOIN users u ON u.id = c.contact_user_id
      WHERE c.owner_user_id = ${ownerId}
      ORDER BY u.display_name ASC
    `;

    return rows.map((row) => this.mapContact(row));
  }

  async getContactByUser(
    ownerId: number,
    contactUserId: number,
  ): Promise<ContactRecord | null> {
    const rows = await this.prismaService.$queryRaw<DbContact[]>`
      SELECT c.id, c.contact_user_id, c.alias, u.email, u.username, u.display_name, u.avatar_url, u.presence_status
      FROM contacts c
      JOIN users u ON u.id = c.contact_user_id
      WHERE c.owner_user_id = ${ownerId} AND c.contact_user_id = ${contactUserId}
      LIMIT 1
    `;

    return rows.length ? this.mapContact(rows[0]) : null;
  }

  async createContact(ownerId: number, contactUserId: number, alias?: string | null) {
    await this.prismaService.$executeRaw`
      INSERT INTO contacts (owner_user_id, contact_user_id, alias, created_at)
      VALUES (${ownerId}, ${contactUserId}, ${alias ?? null}, NOW())
    `;
  }

  async deleteContact(ownerId: number, contactUserId: number) {
    await this.prismaService.$executeRaw`
      DELETE FROM contacts
      WHERE owner_user_id = ${ownerId} AND contact_user_id = ${contactUserId}
    `;
  }

  private mapContact(row: DbContact): ContactRecord {
    return {
      id: Number(row.id),
      contactUserId: Number(row.contact_user_id),
      alias: row.alias,
      email: row.email,
      username: row.username,
      displayName: row.display_name,
      avatarUrl: row.avatar_url,
      presenceStatus: row.presence_status,
    };
  }
}
