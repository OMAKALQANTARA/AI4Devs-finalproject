import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';

type DbUser = {
  id: number | bigint;
  email: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  presence_status: string | null;
};

export type UserProfileRecord = {
  id: number;
  email: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  presenceStatus: string | null;
};

@Injectable()
export class UsersRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async findProfileById(userId: number): Promise<UserProfileRecord | null> {
    const rows = await this.prismaService.$queryRaw<DbUser[]>`
      SELECT id, email, username, display_name, avatar_url, presence_status
      FROM users
      WHERE id = ${userId}
      LIMIT 1
    `;

    return rows.length ? this.mapProfile(rows[0]) : null;
  }

  async findProfileByEmail(email: string): Promise<UserProfileRecord | null> {
    const rows = await this.prismaService.$queryRaw<DbUser[]>`
      SELECT id, email, username, display_name, avatar_url, presence_status
      FROM users
      WHERE email = ${email}
      LIMIT 1
    `;

    return rows.length ? this.mapProfile(rows[0]) : null;
  }

  async updateProfile(
    userId: number,
    payload: { displayName?: string; presenceStatus?: string },
  ): Promise<UserProfileRecord | null> {
    await this.prismaService.$executeRaw`
      UPDATE users
      SET
        display_name = COALESCE(${payload.displayName ?? null}, display_name),
        presence_status = COALESCE(${payload.presenceStatus ?? null}, presence_status),
        updated_at = NOW()
      WHERE id = ${userId}
    `;

    return this.findProfileById(userId);
  }

  async updateAvatar(userId: number, avatarUrl: string): Promise<void> {
    await this.prismaService.$executeRaw`
      UPDATE users
      SET avatar_url = ${avatarUrl}, updated_at = NOW()
      WHERE id = ${userId}
    `;
  }

  private mapProfile(user: DbUser): UserProfileRecord {
    return {
      id: Number(user.id),
      email: user.email,
      username: user.username,
      displayName: user.display_name,
      avatarUrl: user.avatar_url,
      presenceStatus: user.presence_status,
    };
  }
}
